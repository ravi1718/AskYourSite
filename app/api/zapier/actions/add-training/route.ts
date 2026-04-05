import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { verifyApiKey } from "@/lib/api-key-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks;
}

// POST /api/zapier/actions/add-training
// Adds text content to a bot's knowledge base without re-crawling.
// Body: { bot_id, content, source_label, replace_existing? }
export async function POST(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.bot_id || !body?.content) {
    return NextResponse.json({ error: "bot_id and content are required" }, { status: 400 });
  }

  const { bot_id, content, source_label = "Zapier", replace_existing = false } = body;

  const admin = getSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  // Verify bot belongs to this user
  const { data: bot } = await admin
    .from("assistants")
    .select("id")
    .eq("id", bot_id)
    .eq("user_id", auth.userId)
    .single();

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 });

  // Optionally delete existing documents with this source_label
  if (replace_existing) {
    const { data: existingDocs } = await admin
      .from("documents")
      .select("id")
      .eq("assistant_id", bot_id)
      .filter("metadata->>'source_label'", "eq", source_label);

    if (existingDocs?.length) {
      const ids = existingDocs.map((d) => d.id);
      await admin.from("embeddings").delete().in("document_id", ids);
      await admin.from("documents").delete().in("id", ids);
    }
  }

  // Create document record
  const { data: doc, error: docError } = await admin
    .from("documents")
    .insert({
      assistant_id: bot_id,
      source_url: null,
      metadata: { source_label, source_type: "zapier" },
    })
    .select("id")
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: docError?.message ?? "Failed to create document" }, { status: 500 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const chunks = chunkText(content).filter((c) => c.trim().length > 0);
  let chunksAdded = 0;

  for (const chunk of chunks) {
    try {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: chunk,
        config: { outputDimensionality: 768 },
      });
      const embedding = response.embeddings?.[0]?.values;
      if (!embedding) continue;

      await admin.from("embeddings").insert({
        document_id: doc.id,
        assistant_id: bot_id,
        content_chunk: chunk,
        embedding,
      });
      chunksAdded++;
    } catch (err) {
      console.error("[Zapier:add-training] Chunk error:", err);
    }
  }

  return NextResponse.json({ success: true, chunks_added: chunksAdded, bot_id });
}
