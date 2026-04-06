import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidAccessToken } from "@/lib/integrations/token";
import { extractGoogleDocContent } from "./extract-docs";

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

function computeNextSync(frequency: string): string {
  const now = new Date();
  now.setHours(now.getHours() + (frequency === "hourly" ? 1 : 24));
  return now.toISOString();
}

export async function syncGoogleDocsConfig(configId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  const { data: config } = await admin
    .from("google_docs_sync_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (!config || config.status === "inactive") return;

  await admin.from("google_docs_sync_configs").update({ status: "syncing" }).eq("id", configId);

  try {
    const { data: integration } = await admin
      .from("user_integrations")
      .select("id, user_id, provider, access_token, refresh_token, token_expires_at, metadata")
      .eq("user_id", config.user_id)
      .eq("provider", "google")
      .single();

    if (!integration?.access_token) throw new Error("No Google access token");

    const accessToken = await getValidAccessToken(integration as any);
    const selectedDocs: { id: string; title: string }[] = config.selected_docs ?? [];

    if (selectedDocs.length === 0) {
      await admin.from("google_docs_sync_configs").update({
        status: "active",
        last_error: "No documents selected. Open Configure and select at least one Google Doc.",
      }).eq("id", configId);
      return;
    }

    const allContent: { title: string; text: string }[] = [];

    for (const doc of selectedDocs) {
      try {
        const text = await extractGoogleDocContent(doc.id, accessToken);
        if (text.trim()) allContent.push({ title: doc.title, text });
      } catch (err) {
        console.error(`[Google Docs Sync] Failed to extract doc "${doc.title}":`, err);
      }
    }

    if (allContent.length === 0) {
      await admin.from("google_docs_sync_configs").update({
        status: "active",
        last_error: "Selected documents have no readable text content.",
      }).eq("id", configId);
      return;
    }

    const combined = allContent.map((c) => c.text).join("\n---\n");
    const newHash = crypto.createHash("sha256").update(combined).digest("hex");

    if (newHash === config.content_hash) {
      const nextSync = computeNextSync(config.sync_frequency);
      await admin.from("google_docs_sync_configs").update({
        status: "active",
        last_synced_at: new Date().toISOString(),
        next_sync_at: nextSync,
        last_error: null,
      }).eq("id", configId);
      return;
    }

    // Delete old Google Docs embeddings for this bot
    const { data: oldDocs } = await admin
      .from("documents")
      .select("id")
      .eq("assistant_id", config.bot_id)
      .filter("metadata->>'source_type'", "eq", "google_docs");

    if (oldDocs?.length) {
      const ids = oldDocs.map((d: any) => d.id);
      await admin.from("embeddings").delete().in("document_id", ids);
      await admin.from("documents").delete().in("id", ids);
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    for (const { title, text } of allContent) {
      const chunks = chunkText(text);

      const { data: docRow } = await admin
        .from("documents")
        .insert({
          assistant_id: config.bot_id,
          source_url: null,
          metadata: { source_type: "google_docs", title },
        })
        .select("id")
        .single();

      if (!docRow) continue;

      await Promise.allSettled(
        chunks.map(async (chunk) => {
          try {
            const response = await ai.models.embedContent({
              model: "gemini-embedding-001",
              contents: chunk,
              config: { outputDimensionality: 768 },
            });
            const embedding = response.embeddings?.[0]?.values;
            if (!embedding) return;
            await admin.from("embeddings").insert({
              document_id: docRow.id,
              assistant_id: config.bot_id,
              content_chunk: chunk,
              embedding,
            });
          } catch (err) {
            console.error("[Google Docs Sync] Embedding error:", err);
          }
        })
      );
    }

    const nextSync = computeNextSync(config.sync_frequency);
    await admin.from("google_docs_sync_configs").update({
      status: "active",
      last_synced_at: new Date().toISOString(),
      next_sync_at: nextSync,
      content_hash: newHash,
      last_error: null,
    }).eq("id", configId);
  } catch (err: any) {
    console.error("[Google Docs Sync] Error for config", configId, ":", err);
    await admin.from("google_docs_sync_configs").update({
      status: "error",
      last_error: err.message ?? "Unknown error",
    }).eq("id", configId);
  }
}
