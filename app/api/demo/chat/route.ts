import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const DEMO_MESSAGE_LIMIT = 5;

// Rate limit: 20 demo chats per IP per hour
const chatRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkChatRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = chatRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    chatRateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkChatRateLimit(ip)) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  try {
    const { messages, context, messageCount, domain } = await req.json();

    // Check message limit (client sends current count before this message)
    if (typeof messageCount === "number" && messageCount >= DEMO_MESSAGE_LIMIT) {
      return NextResponse.json({ limitReached: true });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Service not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const contextSection = context
      ? `\nWEBSITE CONTENT:\n${context}\n`
      : "\nNo website content available. Answer based on general knowledge.\n";

    const systemPrompt = `You are an AI assistant trained on the content of ${domain || "a website"}.
Help visitors by answering their questions based on the website content provided below.
Be helpful, concise, and accurate. Keep responses to 2-4 sentences unless more detail is needed.
${contextSection}
IMPORTANT RULES:
- Only answer based on the website content provided above
- If the content doesn't cover a question, honestly say you don't have that information
- Be warm and conversational
- After answering, end with one short follow-up question to engage the user further`;

    const lastMessage = messages[messages.length - 1]?.content || "";

    // Retry up to 3 times on 503 (transient overload) — same model/config as main chat
    let text = "";
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: "user", parts: [{ text: lastMessage }] }],
          config: { systemInstruction: systemPrompt, temperature: 0.6, maxOutputTokens: 400 },
        });
        text = response.text || "";
        break;
      } catch (err: any) {
        const status = err?.status ?? err?.statusCode;
        if ((status === 503 || status === 429) && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        throw err;
      }
    }
    if (!text) text = "I couldn't generate a response. Please try again.";
    if (!text) text = "I couldn't generate a response. Please try again.";
    const used = (messageCount ?? 0) + 1;
    const remaining = Math.max(0, DEMO_MESSAGE_LIMIT - used);

    return NextResponse.json({
      response: text,
      limitReached: remaining <= 0,
      messagesRemaining: remaining,
    });
  } catch (error: any) {
    console.error("[Demo Chat] Error:", error);
    return NextResponse.json({ error: "Chat failed. Please try again." }, { status: 500 });
  }
}
