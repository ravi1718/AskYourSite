import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { detectBuyingIntent, detectUnanswered, normalizeQuestion, hashQuestion } from "@/lib/slack/detect";
import { sendSlackAlert } from "@/lib/slack/send-alert";
import { buyingIntentBlock, unansweredBlock } from "@/lib/slack/blocks";

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
    const { messages, assistantId, sessionId, imageBase64, imageMimeType } = await req.json();
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
          model: "gemini-2.5-flash",
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
    if (supabase) {
      const { data } = await supabase
        .from("assistants")
        .select("widget_config, tone, user_id, name")
        .eq("id", assistantId)
        .single();
      assistantData = data;

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
    }

    // ── Calendly booking intent detection ────────────────────────────────────
    const BOOKING_KEYWORDS = [
      "book", "schedule", "demo", "call", "meeting", "appointment",
      "talk to", "speak with", "consult", "set up a time", "hop on a call",
    ];
    // Prevent re-triggering when user is confirming/thanking after a booking
    const ANTI_BOOKING_PATTERNS = [
      /thank.{0,20}(book|schedul|meeting|appointment)/i,
      /thanks.{0,20}(book|schedul|meeting|appointment)/i,
      /(already|just).{0,10}(book|schedul)/i,
      /(book|schedul).{0,20}(confirm|done|complet)/i,
    ];
    const lastUserMsgLower = (lastUserMessage || "").toLowerCase();
    const hasBookingIntent =
      BOOKING_KEYWORDS.some((kw) => lastUserMsgLower.includes(kw)) &&
      !ANTI_BOOKING_PATTERNS.some((pat) => pat.test(lastUserMessage || ""));
    let bookingPayload: { url: string; name: string } | null = null;

    if (
      hasBookingIntent &&
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

    const roleInstructions: Record<string, string> = {
      general: `You are a helpful, knowledgeable AI assistant embedded on this website. Your goal is to answer questions accurately and helpfully, drawing on the knowledge base and your general knowledge.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context does not cover the question, reason from general knowledge to give a helpful answer. Do NOT say "I don't have that information."
3. Be clear, concise, and friendly. Use short paragraphs.
4. Always suggest a useful next step at the end of your answer.`,

      sales: `You are an expert AI sales advisor embedded on this website. Your goal is to guide visitors toward a confident purchase or action.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context does not cover the question, use your general expertise and reasoning. Example: if a user asks which shirt colors suit dark skin and your knowledge base only covers product listings, apply real color-theory and fashion knowledge, then tie it back to products in context.
3. Be warm, confident, and persuasive. Write in short paragraphs. Avoid bullet lists unless listing 3+ items.
4. Always end with a natural next step — suggest a product, a category, or an action the user can take.
5. Use details the user has shared earlier (skin tone, budget, use case) to personalize later answers.
6. Never dead-end. If outside your domain, pivot to what you CAN help with.`,

      support: `You are a patient, thorough customer support specialist embedded on this website. Your goal is to resolve issues quickly and leave the user feeling helped.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. When the context is silent, reason from general product/service knowledge to provide a useful answer.
3. Be empathetic, clear, and step-by-step. Break complex issues into numbered steps.
4. Always confirm understanding and offer to dig deeper if needed.
5. If the issue cannot be resolved, clearly direct the user to contact support with specific details.`,

      docs: `You are a precise technical documentation assistant. Your goal is to help users find the right information quickly and understand it clearly.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth.
2. Cite sections or headings from the docs when relevant.
3. Be precise and technical. Use code blocks for commands or code snippets. Use numbered steps for procedures.
4. If a topic is not in the docs, say so clearly, then suggest related documented topics.
5. Accuracy is more important than helpfulness — never guess at technical specifics.`,

      hr: `You are a professional HR assistant embedded on this platform. Your goal is to answer employee and candidate questions clearly and confidentially.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below as your primary source of truth for policies, procedures, and FAQs.
2. Be professional, neutral, and supportive in tone.
3. For sensitive topics (termination, complaints, legal), advise the user to speak with an HR representative directly.
4. Never speculate about company policy not in the knowledge base.
5. Keep answers concise but complete.`,

      ecommerce: `You are an enthusiastic e-commerce shopping assistant. Your goal is to help customers find the perfect product and complete their purchase with confidence.

BEHAVIOR RULES:
1. Use the KNOWLEDGE BASE CONTEXT below to surface relevant products, specs, and availability.
2. When context is missing, use general product knowledge (sizing, materials, compatibility) to assist.
3. Be enthusiastic, product-focused, and specific. Compare options when the user is deciding.
4. Always recommend a clear best fit based on what the user has shared.
5. Suggest complementary products naturally at the end of your answer.`,
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

    const agentBehavior = assistantId !== "preview" && hasActionUrls ? `

AGENTIC BEHAVIOR — detect user intent and append the relevant action markers at the end of your response.
Product cards and suggestion chips are handled automatically by the system — do NOT output __AYS_SUGGESTIONS__ or __AYS_PRODUCTS__.

1. CHECKOUT / BUY INTENT (user wants to buy, place order, or go to cart):
   ${agentConfig.checkoutUrl ? `Append: __AYS_ACTIONS__[{"label":"Go to Checkout","url":"${agentConfig.checkoutUrl}","style":"primary","icon":"cart"}]` : "No checkout URL configured — skip this action."}

2. ORDER TRACKING INTENT (user asks about their order status, delivery, tracking):
   ${agentConfig.orderTrackingUrl ? `If order data is available from the webhook, show it in your text response. Always append: __AYS_ACTIONS__[{"label":"Track Your Order","url":"${agentConfig.orderTrackingUrl}","style":"primary","icon":"track"}]` : "No order tracking URL configured. Ask the user to contact support for order status."}

3. SUPPORT / HELP / COMPLAINT INTENT (user reports a problem or asks for human help):
   ${agentConfig.supportUrl ? `Append: __AYS_ACTIONS__[{"label":"Contact Support","url":"${agentConfig.supportUrl}","style":"secondary","icon":"support"}]` : "No support URL configured — skip this action."}` : "";

    const systemPrompt = `${customSystemPrompt ? customSystemPrompt + "\n\n" : ""}${assistantId === "preview" ? `You are the official AI assistant for AskYourSite (askyoursite.in). You are embedded directly on the AskYourSite landing page to help potential users understand the product and get started. Be concise, friendly, and action-oriented. Always guide users toward the next step (sign up, create assistant, embed script). If someone asks how to do something specific, give them the exact steps. Never say you don't know about AskYourSite — use the knowledge base below.` : roleInstructions[role] || roleInstructions.general}

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

    // Generate response using Gemini Flash
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.6,
      }
    });

    // Collect assistant response for logging while streaming
    let fullAssistantResponse = "";

    // Create a ReadableStream to stream text back to client
    const query = lastUserMessage || "";
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // 1. Stream the main answer from Gemini
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullAssistantResponse += chunk.text;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }

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

          // Append Calendly booking card if intent detected and plan allows it
          if (bookingPayload) {
            suffix += `__AYS_BOOKING__${JSON.stringify(bookingPayload)}`;
          }

          // Enqueue the markers as a final chunk
          controller.enqueue(encoder.encode(suffix));

        } catch (err) {
          console.error("Streaming error", err);
          controller.enqueue(encoder.encode("\n[Error streaming response]"));
        } finally {
          controller.close();

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

          // Fire Slack alerts non-blocking after stream closes (never delays user response)
          if (!isPreview && assistantData?.user_id && lastUserMessage) {
            const ownerId = assistantData.user_id as string;
            const botName = (assistantData.name as string | null) ?? "Your bot";
            const adminForSlack = getSupabaseAdminClient();

            (async () => {
              // Buying intent alert
              if (detectBuyingIntent(lastUserMessage)) {
                const blocks = buyingIntentBlock({
                  botName,
                  visitorMessage: lastUserMessage,
                  botResponse: cleanResponse,
                  pageUrl: "",
                  conversationId: chatSessionId,
                });
                await sendSlackAlert(ownerId, assistantId, chatSessionId, "buying_intent", blocks);
              }

              // Unanswered question alert
              if (detectUnanswered(cleanResponse)) {
                const normalized = normalizeQuestion(lastUserMessage);
                const hash = hashQuestion(normalized);
                // Count today's occurrences to populate "asked N times today"
                const { count: todayCount } = adminForSlack
                  ? await adminForSlack
                      .from("slack_alert_log")
                      .select("id", { count: "exact", head: true })
                      .eq("user_id", ownerId)
                      .eq("alert_type", "unanswered")
                      .eq("question_hash", hash)
                      .gte("sent_at", new Date(Date.now() - 86400000).toISOString())
                  : { count: 0 };
                const blocks = unansweredBlock({
                  botName,
                  botId: assistantId,
                  question: lastUserMessage,
                  count: (todayCount ?? 0) + 1,
                  conversationId: chatSessionId,
                });
                await sendSlackAlert(ownerId, assistantId, chatSessionId, "unanswered", blocks, hash);
              }
            })().catch((e) => console.error("[Slack] Chat alert failed:", e));
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
    if (
      error?.status === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED") ||
      error?.message?.includes("quota")
    ) {
      return NextResponse.json(
        { error: "The AI service is currently busy due to high demand. Please try again in a few minutes." },
        { status: 429, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
  }
}
