import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

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

      // Log the user message to chat_messages
      await supabase.from("chat_messages").insert({
        assistant_id: assistantId,
        session_id: chatSessionId,
        role: "user",
        content: lastUserMessage,
      });

      try {
        // Embed the query
        const embedResponse = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: lastUserMessage,
          config: { outputDimensionality: 768 },
        });

        const queryEmbedding = embedResponse.embeddings?.[0]?.values;

        if (queryEmbedding) {
          console.log(`[Chat] Query embedding generated (${queryEmbedding.length} dims) for: "${lastUserMessage.substring(0, 50)}..."`);

          // Retrieve matching chunks
          const { data: matches, error } = await supabase.rpc('match_embeddings', {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
            p_assistant_id: assistantId
          });

          if (error) {
            console.error("[Chat] RPC match_embeddings error:", error.message);
          } else if (matches && matches.length > 0) {
            console.log(`[Chat] Found ${matches.length} matching chunks (similarities: ${matches.map((m: any) => m.similarity.toFixed(3)).join(', ')})`);
            contextDocs = matches.map((match: any) => match.content_chunk).join("\n\n");
          } else {
            console.log("[Chat] No matching chunks found for query");
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

    // Fetch assistant config for custom system prompt
    let customSystemPrompt = "";
    let assistantData: any = null;
    if (supabase) {
      const { data } = await supabase
        .from("assistants")
        .select("widget_config, tone")
        .eq("id", assistantId)
        .single();
      assistantData = data;

      if (assistantData?.widget_config?.systemPrompt) {
        customSystemPrompt = assistantData.widget_config.systemPrompt;
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

    // Prepare system instruction with context
    const systemPrompt = `${customSystemPrompt ? customSystemPrompt + "\n\n" : ""}${roleInstructions[role] || roleInstructions.general}

KNOWLEDGE BASE CONTEXT:
${contextDocs ? contextDocs : "No specific context found — answer from general expertise for this domain."}
${imageContext ? `\n${imageContext}\n\nWhen image search results are found, format your response as:\n**Found a match:** [Product Name](page_url)\n![Product Image](image_url)\n\nThen describe the product briefly. If no exact match, suggest similar products from the knowledge base.` : ""}

MANDATORY FORMAT RULE: At the very end of your response (after all content), append this on a new line with no spaces between the marker and the array:
__AYS_SUGGESTIONS__["follow-up question 1?","follow-up question 2?","follow-up question 3?"]
Replace the 3 questions with natural follow-ups the user would ask next. Output ONLY the marker and JSON array on that line, nothing else.`;

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
    const SUGGESTIONS_DELIMITER = "__AYS_SUGGESTIONS__";

    // Create a ReadableStream to stream text back to client
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          // 1. Stream the main answer
          for await (const chunk of responseStream) {
            if (chunk.text) {
              fullAssistantResponse += chunk.text;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }

        } catch (err) {
          console.error("Streaming error", err);
          controller.enqueue(encoder.encode("\n[Error streaming response]"));
        } finally {
          // 3. Close AFTER suggestions are enqueued
          controller.close();

          // 4. Log clean response to chat_messages (strip suggestions trailer)
          const cleanResponse = fullAssistantResponse.split(SUGGESTIONS_DELIMITER)[0];
          if (supabase && cleanResponse) {
            supabase.from("chat_messages").insert({
              assistant_id: assistantId,
              session_id: chatSessionId,
              role: "assistant",
              content: cleanResponse,
            }).then(({ error }) => {
              if (error) console.error("[Chat] Failed to log assistant message:", error.message);
            });
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
