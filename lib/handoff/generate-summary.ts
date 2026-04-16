import { GoogleGenAI } from "@google/genai";

interface Message {
  role: string;
  content: string;
}

/**
 * Generates a 2-3 sentence summary of the conversation for the inbox card
 * and the human agent's context panel. Non-blocking — caller should not await
 * if it doesn't want to delay the response.
 */
export async function generateHandoffSummary(
  ai: GoogleGenAI,
  messages: Message[]
): Promise<string> {
  // Use last 10 messages for context
  const transcript = messages
    .slice(-10)
    .map((m) => {
      const role = m.role === "user" ? "Visitor" : "AI";
      return `${role}: ${m.content.slice(0, 300)}`; // cap per message
    })
    .join("\n");

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a support team assistant. A visitor needs human help. Summarize this chat for the agent in 2-3 sentences. Include: what the visitor is trying to do, what went wrong, and their emotional state. Be concise and actionable. Do not start with "The visitor" — vary your opener.\n\nConversation:\n${transcript}`,
            },
          ],
        },
      ],
      config: { temperature: 0.2, maxOutputTokens: 120 },
    });
    return result.text?.trim() ?? "No summary available.";
  } catch {
    return "Unable to generate summary — please review the full conversation above.";
  }
}
