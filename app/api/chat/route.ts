import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { detectBuyingIntent, detectUnanswered, detectFrustration, detectUrgency, normalizeQuestion, hashQuestion } from "@/lib/slack/detect";
import { dispatchEvent } from "@/lib/events/dispatch";
import { detectIndustry, INDUSTRY_GOALS } from "@/lib/agent/industry-detect";
import { parseAgentAction, stripAgentAction, executeAgentAction } from "@/lib/agent/executor";
import { detectHumanRequest, evaluateHandoffTriggers } from "@/lib/handoff/detect-triggers";
import { createHandoffSession } from "@/lib/handoff/create-session";

async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, delayMs = 5000): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const msg = typeof err?.message === "string" ? err.message : "";
      const retryable =
        err?.status === 503 ||
        err?.code === 503 ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("high demand") ||
        msg.includes("Service Unavailable") ||
        msg.includes("503");
      if (!retryable || attempt === maxAttempts) throw err;
      console.warn(`[Chat] Gemini 503 — retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw lastErr;
}

// In-memory rate limiter: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  // Rate limiting check
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down and try again in a minute." },
      { status: 429, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  try {
    const { messages, assistantId, sessionId, imageBase64, imageMimeType, visitorContext, visitorId } = await req.json();
    const isPreview = assistantId === "preview";

    if (!messages || !assistantId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Missing required fields or invalid format" }, { status: 400, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Use admin client to bypass RLS for embedding retrieval
    const supabase = getSupabaseAdminClient();

    // Generate a session ID if not provided (for conversation grouping)
    const chatSessionId = sessionId || crypto.randomUUID();

    // Extract the latest user query
    const lastUserMessage = messages[messages.length - 1]?.content;

    // ─── Handoff lockout: skip AI entirely if a human is handling this session ──
    if (!isPreview && supabase && lastUserMessage) {
      const { data: activeHandoff } = await supabase
        .from("handoff_sessions")
        .select("id, status, claimed_by_user_id")
        .eq("session_id", chatSessionId)
        .in("status", ["waiting", "active"])
        .maybeSingle();

      if (activeHandoff) {
        await supabase.from("chat_messages").insert({
          assistant_id: assistantId,
          session_id: chatSessionId,
          role: "user",
          content: lastUserMessage,
        });
        await supabase
          .from("handoff_sessions")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", activeHandoff.id);
        const holdingMsg = activeHandoff.claimed_by_user_id
          ? "Our team member is with you — they'll respond shortly."
          : "You're connected — our team will be with you shortly.";
        return new Response(holdingMsg, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "X-Handoff-Active": "true",
          },
        });
      }
    }
    let contextDocs = "";
    let productImageMap = "";
    let imageMapRawData: any[] = []; // Raw data for server-side product card injection

    if (supabase && lastUserMessage) {
      // Check limits before proceeding if it's a new session
      const { data: existingSession } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("session_id", chatSessionId)
        .limit(1)
        .maybeSingle();

      if (!existingSession) {
        // It's a new conversation, check quota. First get assistant owner.
        const { data: ownerData } = await supabase
          .from("assistants")
          .select("user_id")
          .eq("id", assistantId)
          .single();

        if (ownerData?.user_id) {
          const { data: usageData, error: usageError } = await supabase
            .rpc("get_user_usage", { p_user_id: ownerData.user_id } as any)
            .single();
            
          const usage = usageData as any;
          if (!usageError && usage && usage.conversations_count >= usage.monthly_chat_limit) {
             console.log(`[Chat] Usage limit reached for owner ${ownerData.user_id}`);
             return NextResponse.json({ error: "The monthly conversation limit for this assistant has been reached." }, { status: 403, headers: { "Access-Control-Allow-Origin": "*" } });
          }
        }
      }

      // Log the user message to chat_messages (skip for preview — no real assistant row)
      if (!isPreview) {
        await supabase.from("chat_messages").insert({
          assistant_id: assistantId,
          session_id: chatSessionId,
          role: "user",
          content: lastUserMessage,
        });
      }

      if (!isPreview) try {
        // Embed the query
        const embedResponse = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: lastUserMessage,
          config: { outputDimensionality: 768 },
        });

        const queryEmbedding = embedResponse.embeddings?.[0]?.values;

        if (queryEmbedding) {
          console.log(`[Chat] Query embedding generated (${queryEmbedding.length} dims) for: "${lastUserMessage.substring(0, 50)}..."`);

          // Run text + image embeddings searches in parallel
          const [textResult, imageResult] = await Promise.all([
            supabase.rpc('match_embeddings', {
              query_embedding: queryEmbedding,
              match_threshold: 0.5,
              match_count: 5,
              p_assistant_id: assistantId
            }),
            supabase.rpc('match_image_embeddings', {
              query_embedding: queryEmbedding,
              match_threshold: 0.3,
              match_count: 5,
              p_assistant_id: assistantId
            }),
          ]);

          if (textResult.error) {
            console.error("[Chat] RPC match_embeddings error:", textResult.error.message);
          } else if (textResult.data && textResult.data.length > 0) {
            console.log(`[Chat] Found ${textResult.data.length} matching chunks`);
            contextDocs = textResult.data.map((match: any) => match.content_chunk).join("\n\n");
          } else {
            console.log("[Chat] No matching chunks found for query");
          }

          if (!imageResult.error && imageResult.data && imageResult.data.length > 0) {
            console.log(`[Chat] Found ${imageResult.data.length} product images for image map`);
            imageMapRawData = imageResult.data;
            productImageMap = imageResult.data
              .map((m: any, i: number) =>
                `${i + 1}. image_url: ${m.metadata?.image_url || ""} | page_url: ${m.metadata?.page_url || ""} | description: ${m.content_chunk}`
              )
              .join("\n");
          }

          // Fallback: if no image embeddings matched, build product map from text results that have page_url
          // This ensures generic queries ("show me some products") still produce clickable markdown links
          if (imageMapRawData.length === 0 && textResult.data && textResult.data.length > 0) {
            const textWithUrls = (textResult.data as any[]).filter((m: any) => m.metadata?.page_url);
            if (textWithUrls.length > 0) {
              console.log(`[Chat] No image embeddings matched — using ${textWithUrls.length} text results with page_url for product map`);
              imageMapRawData = textWithUrls;
              productImageMap = textWithUrls.slice(0, 5).map((m: any, i: number) =>
                `${i + 1}. page_url: ${m.metadata.page_url} | description: ${m.content_chunk}`
              ).join("\n");
            }
          }
        } else {
          console.warn("[Chat] No query embedding returned from Gemini");
        }
      } catch (err) {
        console.error("[Chat] Embedding or retrieval failed:", err);
      }
    } else {
      if (!supabase) {
        console.error("[Chat] Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
      }
    }

    // --- Image search (when user uploads a photo) — Pro+ only ---
    let imageContext = "";
    let ownerPlanCode = "starter";
    if (imageBase64 && supabase) {
      // Fetch the assistant owner's plan to enforce the Pro+ gate
      const { data: imgOwner } = await supabase
        .from("assistants")
        .select("user_id")
        .eq("id", assistantId)
        .single();
      if (imgOwner?.user_id) {
        const { data: planData } = await supabase
          .rpc("get_user_usage", { p_user_id: imgOwner.user_id } as any)
          .single();
        ownerPlanCode = (planData as any)?.plan_code ?? "starter";
      }
    }
    if (imageBase64 && supabase && ownerPlanCode !== "starter") {
      try {
        console.log("[Chat] Image upload detected — describing with Gemini Vision");
        const mimeType = imageMimeType || "image/jpeg";

        // 1. Describe the uploaded image using Gemini Vision
        const visionResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [
              { text: "Describe this product in detail for visual search purposes. Include: product type, colors, style, material if visible, key features. Be concise (2-3 sentences)." },
              { inlineData: { mimeType, data: imageBase64 } }
            ]
          }]
        });
        const imageDescription = visionResult.text?.trim();
        console.log("[Chat] Image description:", imageDescription?.substring(0, 100));

        if (imageDescription) {
          // 2. Embed the description
          const imgEmbedResponse = await ai.models.embedContent({
            model: "gemini-embedding-001",
            contents: imageDescription,
            config: { outputDimensionality: 768 },
          });
          const imgEmbedding = imgEmbedResponse.embeddings?.[0]?.values;

          if (imgEmbedding) {
            // 3. Search image-specific embeddings
            const { data: imageMatches, error: imgError } = await supabase.rpc("match_image_embeddings", {
              query_embedding: imgEmbedding,
              match_threshold: 0.45,
              match_count: 3,
              p_assistant_id: assistantId
            });

            if (imgError) {
              console.error("[Chat] match_image_embeddings error:", imgError.message);
            } else if (imageMatches && imageMatches.length > 0) {
              console.log(`[Chat] Found ${imageMatches.length} matching product images`);
              imageContext = "IMAGE SEARCH RESULTS (user uploaded a photo — these are visually similar products found):\n" +
                imageMatches.map((m: any) =>
                  `- ${m.content_chunk}\n  Page URL: ${m.metadata?.page_url || "N/A"}\n  Image URL: ${m.metadata?.image_url || "N/A"}`
                ).join("\n\n");
            } else {
              console.log("[Chat] No matching product images found — will use text context as fallback");
              imageContext = "IMAGE SEARCH: No exact visual match found in the product catalog. Suggest the most similar products from the knowledge base context instead.";
            }
          }
        }
      } catch (imgErr: any) {
        console.warn("[Chat] Image search failed:", imgErr.message);
      }
    }

    // Fetch assistant config for custom system prompt + agent config
    let customSystemPrompt = "";
    let assistantData: any = null;
    let agentConfig = { checkoutUrl: "", orderTrackingUrl: "", supportUrl: "", orderWebhookUrl: "" };
    let matchedOverride: { trigger_phrase: string; override_response: string } | null = null;
    let configuredWebhooks: { action: string; name: string }[] = [];

    if (supabase) {
      const { data } = await supabase
        .from("assistants")
        .select("widget_config, tone, user_id, name, business_summary, website_url")
        .eq("id", assistantId)
        .single();
      assistantData = data;

      // Fetch configured agent webhooks (only when agentMode is ON)
      if (!isPreview && data?.widget_config?.agentMode) {
        const { data: hooks } = await supabase
          .from("agent_webhooks")
          .select("action, name")
          .eq("assistant_id", assistantId)
          .eq("is_active", true);
        configuredWebhooks = hooks || [];
      }
    }

    // Load visitor memory (only in agent mode, non-preview, when visitor_id provided)
    let visitorMemoryPrompt = "";
    let visitorSentimentAvg: number | null = null;
    let ownerEmailForHandoff = "";
    let hasHandoffFeature = false;
    const adminDb = getSupabaseAdminClient();
    if (!isPreview && visitorId && adminDb) {
      const { data: vp } = await adminDb
        .from("visitor_profiles")
        .select("email, name, total_sessions, pages_visited, questions_asked, last_action, sentiment_avg")
        .eq("visitor_id", visitorId)
        .eq("assistant_id", assistantId)
        .maybeSingle();

      if (vp) {
        visitorSentimentAvg = vp.sentiment_avg || null;
        const isReturning = vp.total_sessions > 1;
        visitorMemoryPrompt = `
VISITOR MEMORY:
- Sessions: ${vp.total_sessions} | Returning: ${isReturning ? "YES" : "NO"}
- Email on file: ${vp.email || "not captured"}
- Name: ${vp.name || "unknown"}
- Last agent action taken: ${vp.last_action || "none"}
- Pages they've visited: ${(vp.pages_visited || []).slice(-5).join(", ") || "unknown"}
- Previously asked: ${(vp.questions_asked || []).slice(-3).map((q: string) => `"${q}"`).join(", ") || "nothing on record"}
- Average frustration score: ${vp.sentiment_avg ? `${vp.sentiment_avg.toFixed(1)}/5` : "not measured"}
${isReturning ? "This is a RETURNING visitor — acknowledge you remember them warmly and reference their past context." : ""}`;

        // Upsert: add this question to their history, update last_seen
        if (lastUserMessage) {
          const updatedQuestions = [...(vp.questions_asked || []), lastUserMessage].slice(-10);
          adminDb.from("visitor_profiles").update({
            last_seen: new Date().toISOString(),
            questions_asked: updatedQuestions,
            total_sessions: vp.total_sessions, // already counted by ping
          })
          .eq("visitor_id", visitorId)
          .eq("assistant_id", assistantId)
          .then(() => {});
        }
      } else if (lastUserMessage) {
        // First time visitor — create profile
        adminDb.from("visitor_profiles").upsert({
          visitor_id: visitorId,
          assistant_id: assistantId,
          questions_asked: [lastUserMessage],
          total_sessions: 1,
        }, { onConflict: "visitor_id,assistant_id" }).then(() => {});
      }
    }

    // Sentiment scoring (only in agent mode, non-preview, when there are prior messages)
    let sentimentScore = 1;
    if (!isPreview && assistantData?.widget_config?.agentMode && messages.length > 1 && lastUserMessage && ai) {
      try {
        const sentimentResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: `Rate the frustration level in this message 1-5 (1=calm, 5=very frustrated). Reply with ONLY the single digit number.\nMessage: "${lastUserMessage.substring(0, 300)}"` }] }],
          config: { temperature: 0, maxOutputTokens: 5 },
        });
        const parsed = parseInt(sentimentResult.text?.trim() || "1");
        if (!isNaN(parsed)) sentimentScore = Math.min(5, Math.max(1, parsed));

        // Update rolling sentiment average in visitor profile
        if (visitorId && adminDb) {
          const { data: vp2 } = await adminDb
            .from("visitor_profiles")
            .select("sentiment_avg, total_sessions")
            .eq("visitor_id", visitorId)
            .eq("assistant_id", assistantId)
            .maybeSingle();
          if (vp2) {
            const prevAvg = vp2.sentiment_avg || sentimentScore;
            const newAvg = (prevAvg + sentimentScore) / 2;
            adminDb.from("visitor_profiles").update({ sentiment_avg: newAvg })
              .eq("visitor_id", visitorId).eq("assistant_id", assistantId).then(() => {});
          }
        }
      } catch { /* sentiment scoring never blocks chat */ }
    }

    if (supabase) {

      if (assistantData?.widget_config?.systemPrompt) {
        customSystemPrompt = assistantData.widget_config.systemPrompt;
      }
      const wc = assistantData?.widget_config || {};
      agentConfig = {
        checkoutUrl: wc.checkoutUrl || "",
        orderTrackingUrl: wc.orderTrackingUrl || "",
        supportUrl: wc.supportUrl || "",
        orderWebhookUrl: wc.orderWebhookUrl || "",
      };

      // Check response overrides (only for non-preview, when there's a user message)
      if (!isPreview && lastUserMessage) {
        const { data: overrides } = await supabase
          .from("response_overrides")
          .select("trigger_phrase, override_response")
          .eq("assistant_id", assistantId)
          .eq("is_active", true);

        if (overrides && overrides.length > 0) {
          const msgLower = lastUserMessage.toLowerCase();
          matchedOverride = overrides.find((o: any) => msgLower.includes(o.trigger_phrase)) ?? null;
        }
      }
    }

    // ── Handoff feature gate: fetch owner email + plan flags ─────────────────
    if (!isPreview && assistantData?.user_id && adminDb) {
      const [emailResult, planResult] = await Promise.all([
        adminDb.from("profiles").select("email").eq("id", assistantData.user_id).maybeSingle(),
        adminDb.rpc("get_user_usage", { p_user_id: assistantData.user_id } as any).single(),
      ]);
      ownerEmailForHandoff = (emailResult.data as any)?.email ?? "";
      hasHandoffFeature = (planResult.data as any)?.feature_flags?.human_handoff === true;
    }

    // ── Calendly booking card payload ─────────────────────────────────────────
    // Build the payload whenever Calendly is configured + plan allows it.
    // Whether to actually show the card is gated later on the AI's response text,
    // so we do NOT restrict this to user booking-keyword detection.
    let bookingPayload: { url: string; name: string } | null = null;

    if (
      assistantData?.widget_config?.calendlyEnabled &&
      assistantData?.widget_config?.calendlyEventTypeUrl &&
      supabase
    ) {
      const assistantOwnerId = assistantData?.user_id;
      if (assistantOwnerId) {
        const { data: planData } = await supabase
          .rpc("get_user_usage", { p_user_id: assistantOwnerId } as any)
          .single();
        const planCode = (planData as any)?.plan_code;
        const hasCalendlyAccess = planCode === "pro" || planCode === "business";
        if (hasCalendlyAccess) {
          bookingPayload = {
            url: assistantData.widget_config.calendlyEventTypeUrl,
            name: assistantData.widget_config.calendlyEventTypeName || "a meeting",
          };
        }
      }
    }

    // Role-based system prompt selection
    const role: string = assistantData?.widget_config?.role || "general";
    const wc = assistantData?.widget_config || {};
    const calendlyEnabled = wc.calendlyEnabled && wc.calendlyEventTypeUrl;
    const calendlyEventTypeName = wc.calendlyEventTypeName || "a meeting";
    const incentiveText: string = wc.incentiveText || "";

    // Detect sentiment from the last user message
    const isFrustrated = !isPreview && lastUserMessage ? detectFrustration(lastUserMessage) : false;
    const isUrgent = !isPreview && lastUserMessage ? detectUrgency(lastUserMessage) : false;

    // Detect explicit handoff request (synchronous, before Gemini call)
    const isExplicitHandoff = !isPreview && lastUserMessage
      ? detectHumanRequest(lastUserMessage)
      : false;

    const INTENT_RETENTION_RULES = `
INTENT RETENTION RULES:
- Always anchor alternative recommendations to the user's original request (e.g. "similar to what you asked for").
- When recommending alternatives, explain WHY each is relevant to their original query.
- End alternative recommendations with a clarifying question: "Is this similar to what you had in mind?"
- Never recommend items based purely on popularity unless the user explicitly asks for "popular" or "trending" items.
- When the knowledge base has no clear answer, ask ONE clarifying question before concluding you can't help.`;

    const SENTIMENT_ADJUSTMENT = isFrustrated
      ? `\nTONE ADJUSTMENT: The user appears frustrated. Acknowledge their frustration first before answering. Be extra patient, empathetic, and apologetic. Lead with: "I'm sorry you're having this issue..."`
      : isUrgent
      ? `\nTONE ADJUSTMENT: The user has an urgent need. Lead immediately with the solution — skip pleasantries. Offer to escalate if needed.`
      : "";

    const CALENDLY_BLOCK = calendlyEnabled
      ? `\nSCHEDULING: You have a Calendly booking integration active for "${calendlyEventTypeName}". Follow these rules strictly:
1. NEVER say you cannot book directly or lack booking capability.
2. When the user first asks to book/schedule: ask exactly ONE brief qualifying question (e.g. "What would you like to discuss?"). Do NOT say "booking calendar" or mention the calendar yet — just ask your question and stop.
3. Only AFTER the user answers your qualifying question, respond with the solution and include the exact phrase "booking calendar" (e.g. "I'll pull up the booking calendar for you now!") — this triggers the calendar to appear automatically.
4. Never include "booking calendar" in a response that also contains a question to the user.`
      : "";

    const roleInstructions: Record<string, string> = {
      general: `You are a helpful, knowledgeable AI assistant embedded on this website. Your goal is to answer questions accurately and helpfully, drawing on the knowledge base and your general knowledge.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context does not cover the question, reason from general knowledge to give a helpful answer. Do NOT say "I don't have that information."
3. Be clear, concise, and friendly. Use short paragraphs.
4. When the user's request is ambiguous, ask one clarifying question before attempting to answer.
5. Always suggest a useful next step at the end of your answer.${INTENT_RETENTION_RULES}${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,

      sales: `You are an expert AI sales advisor embedded on this website. Your goal is to guide visitors toward a confident purchase or action.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context does not cover the question, use your general expertise and reasoning.
3. Be warm, confident, and persuasive. Write in short paragraphs. Avoid bullet lists unless listing 3+ items.
4. Always end with a natural next step — suggest a product, a category, or an action the user can take.
5. Use details the user has shared earlier (skin tone, budget, use case) to personalize later answers.
6. Never dead-end. If outside your domain, pivot to what you CAN help with.${INTENT_RETENTION_RULES}${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,

      support: `You are a patient, thorough customer support specialist embedded on this website. Your goal is to resolve issues quickly and leave the user feeling helped.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context is silent, reason from general product/service knowledge to provide a useful answer.
3. Be empathetic, clear, and step-by-step. Break complex issues into numbered steps.
4. Always confirm understanding and offer to dig deeper if needed.
5. If the issue cannot be resolved, clearly direct the user to contact support with specific details.${INTENT_RETENTION_RULES}${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,

      docs: `You are a precise technical documentation assistant. Your goal is to help users find the right information quickly and understand it clearly.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. Cite sections or headings from the docs when relevant.
3. Be precise and technical. Use code blocks for commands or code snippets. Use numbered steps for procedures.
4. If a topic is not in the docs, say so clearly, then suggest related documented topics.
5. Accuracy is more important than helpfulness — never guess at technical specifics.${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,

      hr: `You are a professional HR assistant embedded on this platform. Your goal is to answer employee and candidate questions clearly and confidentially.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth for policies, procedures, and FAQs.
2. Be professional, neutral, and supportive in tone.
3. For sensitive topics (termination, complaints, legal), advise the user to speak with an HR representative directly.
4. Never speculate about company policy not in the knowledge base.
5. Keep answers concise but complete.${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,

      ecommerce: `You are an enthusiastic e-commerce shopping assistant. Your goal is to help customers find the perfect product and complete their purchase with confidence.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below to surface relevant products, specs, and availability.
2. When context is missing, use general product knowledge (sizing, materials, compatibility) to assist.
3. Be enthusiastic, product-focused, and specific. Compare options when the user is deciding.
4. Always recommend a clear best fit based on what the user has shared.
5. Suggest complementary products naturally at the end of your answer.${INTENT_RETENTION_RULES}${SENTIMENT_ADJUSTMENT}${CALENDLY_BLOCK}`,
    };

    // For the AskYourSite landing page widget ("preview" mode), inject built-in product knowledge
    // so the bot answers correctly before any training data is added.
    const AYS_KNOWLEDGE = `
## About AskYourSite
AskYourSite (askyoursite.in) turns any website into an AI-powered sales and support agent in minutes. You train it on your content, embed a small script, and it handles customer questions 24/7 — no code required.

## How It Works
1. **Create an assistant** — Sign up at askyoursite.in, go to Dashboard → Assistants → Create New.
2. **Train it** — Add your website URL to crawl (we automatically extract all pages) or upload documents (PDF, text). Training usually takes 1–5 minutes.
3. **Customize** — Set colors, fonts, logo, tone (Friendly / Professional / Sales / Support), welcome message, and a custom system prompt.
4. **Embed** — Copy the one-line script from the Embed tab and paste it before the closing </body> tag on your website. The AI widget goes live instantly.

## Key Features
- **Website crawler** — Crawl your entire site (or a single page) automatically. Starter: 50 pages, Pro: 200 pages, Business: 500 pages.
- **Document upload** — Upload PDFs, text files, and paste raw text as knowledge.
- **Streaming AI responses** — Powered by Gemini 2.5 Flash for fast, intelligent, context-aware answers.
- **Suggested follow-ups** — The bot automatically shows 3 follow-up question chips after each answer to guide conversations.
- **Image search** (Pro+) — Visitors can upload a photo to find visually similar products from your catalog.
- **Lead capture form** (Pro+) — Collect visitor name & email before the chat starts. View all leads in the Leads dashboard.
- **Remove branding** (Pro+) — Hide the "Powered by AskYourSite" footer.
- **Analytics dashboard** — See total conversations, weekly trends, top questions, unanswered queries, and more.
- **Advanced analytics** (Business) — 30-day conversation trend chart, peak activity hours, response quality score, lead conversion rate.
- **Full appearance customization** — Primary color, background color, text color, font family, logo upload, tone, role (Sales / Support / E-commerce / HR / Docs / General).
- **Custom system prompt** — Give the AI specific instructions for your business.
- **Multiple assistants** — Create separate bots for different products, regions, or departments.
- **Knowledge Base tab** — Manage all trained content across all assistants from one place.

## Pricing Plans
- **Starter (Free)** — 1 assistant, 100 conversations/month, 50-page crawl, basic features.
- **Pro** — More assistants, higher conversation limits, 200-page crawl, image search, lead capture, remove branding.
- **Business** — Highest limits, 500-page crawl, advanced analytics, CSV export of leads, priority support.
- All plans include the embeddable widget, streaming AI, analytics, and full appearance customization.

## Getting Started (Step by Step)
1. Visit **askyoursite.in** → click "Get Started" or "Start for free"
2. Sign up (email or Google)
3. Dashboard → Assistants → "Create New Assistant"
4. Enter your website URL → click "Crawl Website" — wait 1–3 minutes
5. Go to Appearance tab → customize colors, logo, tone
6. Go to Embed tab → copy the script tag
7. Paste it before </body> on your website — done!

## Common Questions
- **Does it work on any website?** Yes — WordPress, Shopify, Webflow, custom HTML, any platform.
- **How accurate are the answers?** The AI answers based solely on your trained content, so accuracy depends on the quality and completeness of your training data.
- **Can I update the knowledge base?** Yes — add more URLs, re-crawl, or upload new documents anytime.
- **What language does it support?** It can respond in the same language the visitor uses.
- **Is there a free plan?** Yes — Starter is free and includes the core features.
- **How do I see who chatted?** Go to Dashboard → Analytics for conversation stats. Enable Lead Capture (Pro+) to collect emails.
- **Can I use my own logo?** Yes — upload a logo in the Appearance tab.
- **How do I remove the "Powered by AskYourSite" badge?** Toggle "Remove Branding" in the Appearance tab (Pro+ plan required).

## Support
For help, email support@askyoursite.in or use the chat widget on the site.
`.trim();

    if (assistantId === "preview" && !contextDocs) {
      contextDocs = AYS_KNOWLEDGE;
    } else if (assistantId === "preview") {
      contextDocs = AYS_KNOWLEDGE + "\n\n" + contextDocs;
    }

    // Order webhook proxy — if configured and query looks like order tracking
    let orderWebhookData = "";
    if (agentConfig.orderWebhookUrl && lastUserMessage) {
      const orderKeywords = /\b(order|track|shipment|delivery|where is my|shipping|dispatch|package|parcell?)\b/i;
      if (orderKeywords.test(lastUserMessage)) {
        try {
          const webhookRes = await Promise.race([
            fetch(agentConfig.orderWebhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId: chatSessionId, query: lastUserMessage, conversationHistory: messages }),
            }),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000)),
          ]) as Response;
          if (webhookRes.ok) {
            const webhookJson = await webhookRes.json();
            orderWebhookData = `\nORDER DATA FROM MERCHANT API:\n${JSON.stringify(webhookJson, null, 2)}\n`;
            console.log("[Chat] Order webhook responded successfully");
          }
        } catch (e: any) {
          console.warn("[Chat] Order webhook failed:", e.message);
        }
      }
    }

    // Prepare system instruction with context
    // Build action markers the server will inject based on AI response intent detection
    const hasActionUrls = agentConfig.checkoutUrl || agentConfig.orderTrackingUrl || agentConfig.supportUrl;
    const wc2 = assistantData?.widget_config || {};
    const isAgentMode = !isPreview && wc2.agentMode === true;

    // Industry detection for agentic mode
    const industry = isAgentMode
      ? (wc2.industry && wc2.industry !== 'auto'
          ? wc2.industry
          : detectIndustry(assistantData?.business_summary || '', assistantData?.website_url || ''))
      : 'general';

    const sentimentInstruction = sentimentScore >= 4
      ? `\nCRITICAL: This visitor is highly frustrated (score: ${sentimentScore}/5). Immediately acknowledge their frustration with empathy. Offer to escalate to a human specialist. Do NOT give generic answers. Trigger assign_human_agent action.`
      : sentimentScore >= 3
      ? `\nNOTE: Visitor shows some frustration (score: ${sentimentScore}/5). Be extra patient, supportive, and concrete in your help.`
      : '';

    // agentInstructions is the new unified field; fall back to legacy fields for backward compat
    const agentInstructionsText = wc2.agentInstructions
      || [wc2.agentGoal, wc2.agentPersona, wc2.agentRestrictions].filter(Boolean).join('\n')
      || '';
    const agentInstructionsBlock = agentInstructionsText ? `\nAGENT INSTRUCTIONS:\n${agentInstructionsText}` : '';

    const agentBehavior = isAgentMode ? `

---
AGENTIC MODE: ENABLED
INDUSTRY HINT: ${industry.toUpperCase()} (auto-detected)
${agentInstructionsBlock}
${INDUSTRY_GOALS[industry as keyof typeof INDUSTRY_GOALS] || INDUSTRY_GOALS.general}
${visitorMemoryPrompt}
${sentimentInstruction}

INTENT CLASSIFICATION:
Classify EVERY user message as one of:
- INFORMATIONAL  → exploring, learning
- TRANSACTIONAL  → ready to buy/book/sign up
- NAVIGATIONAL   → looking for specific page/feature
- PROBLEM        → stuck, frustrated, confused
- HIGH_INTENT    → strong buying/decision signal (price questions, "I want to...", "how do I start")

CONFIGURED WEBHOOK ACTIONS:
${configuredWebhooks.length > 0
  ? configuredWebhooks.map(w => `- ${w.action}: "${w.name}"`).join('\n')
  : 'No webhooks configured yet — focus on guiding the conversation toward the user\'s goal.'}

AGENTIC BEHAVIOR RULES:
1. UNDERSTAND: Deeply analyze user's real intent
2. PLAN: What action creates the most business value right now?
3. ACT: If action is needed, append the action JSON AFTER your response text
4. ADAPT: Every response should move the user closer to their goal — never dead-end

WHEN TO TRIGGER ACTIONS:
- HIGH_INTENT → ALWAYS trigger capture_lead or book_demo
- PROBLEM (stuck/frustrated after 2+ turns) → trigger assign_human_agent
- TRANSACTIONAL → trigger recommend_product or trigger_discount (if hesitating on price)
- After purchase/booking signal → trigger update_crm + track_event
- Sentiment score 4+ → trigger assign_human_agent

ACTION FORMAT (append after your response text when an action is needed):
__AYS_AGENT_ACTION__{"action":"capture_lead","reason":"User asked about pricing with purchase intent","data":{"user_intent":"purchase","user_message":"${(lastUserMessage || '').replace(/"/g, "'")}","priority":"high"}}__/AYS_AGENT_ACTION__

CRITICAL: The action JSON is parsed server-side and NEVER shown to the user. Your visible response must be natural conversation only.
---` : assistantId !== "preview" && hasActionUrls ? `

AGENTIC BEHAVIOR — detect user intent and append the relevant action markers at the end of your response.
Product cards and suggestion chips are handled automatically by the system — do NOT output __AYS_SUGGESTIONS__ or __AYS_PRODUCTS__.

1. CHECKOUT / BUY INTENT (user wants to buy, place order, or go to cart):
   ${agentConfig.checkoutUrl ? `Append: __AYS_ACTIONS__[{"label":"Go to Checkout","url":"${agentConfig.checkoutUrl}","style":"primary","icon":"cart"}]` : "No checkout URL configured — skip this action."}

2. ORDER TRACKING INTENT (user asks about their order status, delivery, tracking):
   ${agentConfig.orderTrackingUrl ? `If order data is available from the webhook, show it in your text response. Always append: __AYS_ACTIONS__[{"label":"Track Your Order","url":"${agentConfig.orderTrackingUrl}","style":"primary","icon":"track"}]` : "No order tracking URL configured. Ask the user to contact support for order status."}

3. SUPPORT / HELP / COMPLAINT INTENT (user reports a problem or asks for human help):
   ${agentConfig.supportUrl ? `Append: __AYS_ACTIONS__[{"label":"Contact Support","url":"${agentConfig.supportUrl}","style":"secondary","icon":"support"}]` : "No support URL configured — skip this action."}` : "";

    // Build optional system prompt additions
    const overrideBlock = matchedOverride
      ? `\nMANDATORY RESPONSE OVERRIDE: The user asked about "${matchedOverride.trigger_phrase}". You MUST respond with exactly: "${matchedOverride.override_response}". Do not deviate, add, or omit anything from this response.\n`
      : "";

    const incentiveBlock = incentiveText && detectBuyingIntent(lastUserMessage || "")
      ? `\nINCENTIVE: When discussing pricing or plans, naturally include this offer in your response: "${incentiveText}"\n`
      : "";

    const visitorContextBlock = visitorContext
      ? `\nRETURNING VISITOR CONTEXT: This visitor previously asked about: ${visitorContext}. Use this to personalize your greeting and responses when relevant.\n`
      : "";

    const systemPrompt = `${customSystemPrompt ? customSystemPrompt + "\n\n" : ""}${overrideBlock}${incentiveBlock}${visitorContextBlock}${assistantId === "preview" ? `You are the official AI assistant for AskYourSite (askyoursite.in). You are embedded directly on the AskYourSite landing page to help potential users understand the product and get started. Be concise, friendly, and action-oriented. Always guide users toward the next step (sign up, create assistant, embed script). If someone asks how to do something specific, give them the exact steps. Never say you don't know about AskYourSite — use the knowledge base below.` : roleInstructions[role] || roleInstructions.general}

KNOWLEDGE BASE CONTEXT:
${contextDocs ? contextDocs : "No specific context found — answer from general expertise for this domain."}
${orderWebhookData}${imageContext ? `\n${imageContext}\n\nWhen image search results are found, format your response as:\n**Found a match:** [Product Name](page_url)\n![Product Image](image_url)\n\nThen describe the product briefly. If no exact match, suggest similar products from the knowledge base.` : ""}
${productImageMap ? `\nPRODUCT IMAGE MAP (products available in the catalog):\nIMPORTANT: When you mention any product from this list in your response, format it as a markdown link using its page_url, like: [Product Name](page_url). Always link product names — never mention them as plain text.\n${productImageMap}` : ""}${agentBehavior}

RESPONSE STYLE: Be brief and conversational — you are chatting, not writing an article. Maximum 3-4 short sentences per response. For product lists, use a short bullet point per product (name as a link + one key detail). Do not write long paragraphs. Never include follow-up questions in your response — the system adds suggestion chips automatically.`;

    // Map messages for Gemini — attach image to the last user message if present
    const geminiContents = messages.map((msg: any, idx: number) => {
      const isLastUserMsg = idx === messages.length - 1 && msg.role === "user";
      if (isLastUserMsg && imageBase64) {
        return {
          role: "user",
          parts: [
            { text: msg.content || "Find this product" },
            { inlineData: { mimeType: imageMimeType || "image/jpeg", data: imageBase64 } }
          ]
        };
      }
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      };
    });

    // Collect assistant response for logging while streaming
    let fullAssistantResponse = "";

    // Gemini call config — reused inside retry wrapper
    const geminiCallConfig = {
      model: "gemini-3-flash-preview",
      contents: geminiContents,
      config: { systemInstruction: systemPrompt, temperature: 0.6 },
    };

    // Create a ReadableStream to stream text back to client
    const query = lastUserMessage || "";
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        // Holds the parsed agent action so the finally block can fire it without re-parsing
        let pendingAgentAction: import("@/lib/agent/executor").ActionPayload | null = null;
        try {
          // 1. Collect full Gemini response before streaming to client.
          //    Wrapped in retry so transient 503 errors auto-recover after 5 s.
          await withRetry(async () => {
            fullAssistantResponse = "";
            const responseStream = await ai.models.generateContentStream(geminiCallConfig);
            for await (const chunk of responseStream) {
              if (chunk.text) fullAssistantResponse += chunk.text;
            }
          }, 3, 5000);

          // Strip agent action marker before streaming — prevents marker leaking into the widget
          if (isAgentMode) {
            pendingAgentAction = parseAgentAction(fullAssistantResponse);
            if (pendingAgentAction) {
              pendingAgentAction.data.session_id = chatSessionId;
              pendingAgentAction.data.assistant_id = assistantId;
            }
            // Always strip — even if JSON parse failed (AI may omit closing tag)
            fullAssistantResponse = stripAgentAction(fullAssistantResponse);
          }

          // Stream the clean response to the client
          controller.enqueue(encoder.encode(fullAssistantResponse));

          // 2. Server-side marker injection — guaranteed, not AI-dependent
          let suffix = "";

          // Deterministic suggestions — no async API call, guaranteed to always work
          let suggestions: string[];
          const q = query.toLowerCase();
          const r = fullAssistantResponse.toLowerCase();
          if (imageMapRawData.length > 0) {
            const firstName = (imageMapRawData[0]?.content_chunk || "")
              .split(/[|\n]/)[0]?.trim().substring(0, 35) || "this product";
            suggestions = [
              `Tell me more about ${firstName}`,
              "What are the prices?",
              "Do you have other options?",
            ];
          } else if (/price|cost|how much|afford|cheap|expensive|discount|offer|deal/i.test(q)) {
            suggestions = ["Do you have discounts?", "What are the payment options?", "Show me more products"];
          } else if (/return|refund|exchange|cancel|warranty/i.test(q)) {
            suggestions = ["How long does shipping take?", "Can I track my order?", "Contact support"];
          } else if (/ship|deliver|track|order status|dispatch/i.test(q)) {
            suggestions = ["What's the return policy?", "How do I contact support?", "Show me more products"];
          } else if (/contact|email|phone|reach|support|help|talk to/i.test(q)) {
            suggestions = ["What are your business hours?", "Do you have a live chat?", "Show me your products"];
          } else if (/how|step|guide|tutorial|setup|install|configure/i.test(q)) {
            suggestions = ["Can you explain more?", "What are the requirements?", "Contact support"];
          } else if (/compare|difference|vs|versus|better|best|recommend/i.test(q)) {
            suggestions = ["What are the prices?", "Show me all options", "Which do you recommend?"];
          } else if (/who|what is|about|tell me about|explain/i.test(q)) {
            suggestions = ["Show me your products", "What are your prices?", "How do I get started?"];
          } else if (r.includes("price") || r.includes("$") || r.includes("cost")) {
            suggestions = ["Do you have discounts?", "What payment methods do you accept?", "Show me more"];
          } else if (r.includes("product") || r.includes("item") || r.includes("collection")) {
            suggestions = ["Show me more options", "What are the prices?", "How do I order?"];
          } else if (r.includes("contact") || r.includes("email") || r.includes("support")) {
            suggestions = ["What are your business hours?", "Do you have a FAQ?", "Show me your products"];
          } else {
            suggestions = ["Tell me more", "What are your top products?", "How can I get started?"];
          }
          suffix += `__AYS_SUGGESTIONS__${JSON.stringify(suggestions)}`;

          // Signal handoff to widget — explicit request OR agent fired assign_human_agent
          const agentWantsHandoff = pendingAgentAction?.action === 'assign_human_agent';
          const handoffSessionWillBeCreated =
            (isExplicitHandoff || agentWantsHandoff) &&
            hasHandoffFeature &&
            assistantData?.widget_config?.humanHandoffEnabled === true;
          if (handoffSessionWillBeCreated) {
            suffix += `__AYS_HANDOFF__`;
          }

          // Add product cards if image map was populated (works in Playground too)
          if (imageMapRawData.length > 0) {
            const products = imageMapRawData.slice(0, 4).map((m: any) => ({
              name: (m.content_chunk || "").split(/[|\n]/)[0]?.trim().substring(0, 80) || "Product",
              price: "",
              image: m.metadata?.image_url || "",
              url: m.metadata?.page_url || "",
              description: (m.content_chunk || "").substring(0, 120),
            }));
            suffix += `__AYS_PRODUCTS__${JSON.stringify(products)}`;
            console.log(`[Chat] Injected ${products.length} product cards server-side`);
          }

          // Append Calendly booking card only when the AI signals it's ready to show the calendar.
          // The AI is instructed to say "booking calendar" / "I'll pull up" only after qualifying questions.
          // This prevents the card from appearing when the AI is still asking a qualifying question.
          const AI_CALENDAR_SIGNALS = [
            "booking calendar",
            "pull up the calendar",
            "show you the calendar",
            "book your time",
            "pick a time",
            "choose a time",
            "select a time",
            "scheduling link",
            "calendar below",
            "calendar will appear",
            "calendar should appear",
            "appear below",
            "booking link",
            "schedule a time",
          ];
          const aiWantsToShowCalendar = AI_CALENDAR_SIGNALS.some((sig) =>
            fullAssistantResponse.toLowerCase().includes(sig)
          );
          // Suppress Calendly when user asked for a human — don't open booking while connecting to agent
          const handoffRequested = isExplicitHandoff || pendingAgentAction?.action === 'assign_human_agent';
          if (bookingPayload && aiWantsToShowCalendar && !handoffRequested) {
            suffix += `__AYS_BOOKING__${JSON.stringify(bookingPayload)}`;
          }

          // Enqueue the markers as a final chunk
          controller.enqueue(encoder.encode(suffix));

        } catch (err) {
          console.error("Streaming error", err);
          controller.enqueue(encoder.encode("\n[Error streaming response]"));
        } finally {
          controller.close();

          // Fire agent action (already parsed and stripped before streaming)
          if (pendingAgentAction) {
            executeAgentAction(pendingAgentAction, assistantId, chatSessionId);
          }

          // Log clean response to chat_messages (strip all __AYS_* markers)
          const cleanResponse = fullAssistantResponse.replace(/__AYS_\w+__[\s\S]*/g, "").trim();
          if (!isPreview && supabase && cleanResponse) {
            supabase.from("chat_messages").insert({
              assistant_id: assistantId,
              session_id: chatSessionId,
              role: "assistant",
              content: cleanResponse,
            }).then(({ error }) => {
              if (error) console.error("[Chat] Failed to log assistant message:", error.message);
            });
          }

          // Fire integration events non-blocking after stream closes (never delays user response)
          if (!isPreview && assistantData?.user_id && lastUserMessage) {
            const ownerId = assistantData.user_id as string;
            const botName = (assistantData.name as string | null) ?? "Your bot";

            if (detectBuyingIntent(lastUserMessage)) {
              dispatchEvent("intent.detected", {
                userId: ownerId,
                botId: assistantId,
                botName,
                intentType: "buying",
                visitorMessage: lastUserMessage,
                botResponse: cleanResponse,
                sessionId: chatSessionId,
                pageUrl: "",
                timestamp: new Date().toISOString(),
              });
            }

            if (detectUnanswered(cleanResponse)) {
              const normalized = normalizeQuestion(lastUserMessage);
              const hash = hashQuestion(normalized);
              dispatchEvent("question.unanswered", {
                userId: ownerId,
                botId: assistantId,
                botName,
                question: lastUserMessage,
                questionHash: hash,
                sessionId: chatSessionId,
                timestamp: new Date().toISOString(),
              });
            }

            if (isFrustrated || isUrgent) {
              dispatchEvent("sentiment.detected", {
                userId: ownerId,
                botId: assistantId,
                botName,
                sentimentType: isFrustrated ? "frustration" : "urgency",
                visitorMessage: lastUserMessage,
                sessionId: chatSessionId,
                timestamp: new Date().toISOString(),
              });
            }

            // Non-blocking handoff trigger evaluation (Business plan + toggle enabled)
            if (adminDb && assistantData?.widget_config?.humanHandoffEnabled && hasHandoffFeature) {
              // Path A: agent mode fired assign_human_agent — create session directly, skip eval
              if (pendingAgentAction?.action === 'assign_human_agent') {
                void createHandoffSession({
                  adminDb: adminDb!,
                  ai,
                  assistantId,
                  sessionId: chatSessionId,
                  visitorId: visitorId || null,
                  triggerReason: "explicit_request",
                  triggerMessage: lastUserMessage,
                  ownerId,
                  ownerEmail: ownerEmailForHandoff,
                  assistantName: assistantData.name || "Assistant",
                }).catch((err) => console.error("[Handoff] agent-action create failed:", err));
              } else {
                // Path B: sentiment / keyword / streak triggers
                void evaluateHandoffTriggers(adminDb, {
                  sessionId: chatSessionId,
                  userMessage: lastUserMessage,
                  botResponse: cleanResponse,
                  sentimentScore,
                  sentimentAvg: visitorSentimentAvg,
                }).then((result) => {
                  if (!result.triggered) return;
                  return createHandoffSession({
                    adminDb: adminDb!,
                    ai,
                    assistantId,
                    sessionId: chatSessionId,
                    visitorId: visitorId || null,
                    triggerReason: result.reason,
                    triggerMessage: lastUserMessage,
                    ownerId,
                    ownerEmail: ownerEmailForHandoff,
                    assistantName: assistantData.name || "Assistant",
                  });
                }).catch((err) => console.error("[Handoff] eval failed:", err));
              }
            }
          }
        }
      }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Session-Id": chatSessionId,
            "Access-Control-Allow-Origin": "*",
        }
    });

  } catch (error: any) {
    console.error("[Chat] API Error:", error);
    const msg = typeof error?.message === "string" ? error.message : "";
    if (
      error?.status === 503 ||
      msg.includes("UNAVAILABLE") ||
      msg.includes("high demand") ||
      msg.includes("Service Unavailable")
    ) {
      return NextResponse.json(
        { error: "The AI service is currently experiencing high demand. Please try again in a few seconds." },
        { status: 503, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    if (
      error?.status === 429 ||
      msg.includes("RESOURCE_EXHAUSTED") ||
      msg.includes("quota")
    ) {
      return NextResponse.json(
        { error: "The AI service is currently busy due to high demand. Please try again in a few minutes." },
        { status: 429, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
