import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { decrypt } from "@/lib/crypto";
import { extractNotionPageContent, extractNotionDatabaseContent } from "./extract";

function chunkText(text: string, size = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    i += size - overlap;
  }
  return chunks.filter((c) => c.trim().length > 0);
}

/**
 * Runs a full Notion sync for a single notion_sync_configs row.
 * - Extracts content from all selected pages + databases
 * - Hashes combined content — skips re-embedding if unchanged
 * - Deletes old Notion-sourced embeddings for this bot
 * - Re-embeds all content via Gemini
 * - Updates last_synced_at, content_hash, next_sync_at, status
 */
export async function syncNotionConfig(configId: string): Promise<void> {
  const admin = getSupabaseAdminClient();
  if (!admin) throw new Error("Admin client unavailable");

  const { data: config } = await admin
    .from("notion_sync_configs")
    .select("*")
    .eq("id", configId)
    .single();

  if (!config || config.status === "inactive") return;

  // Mark as syncing
  await admin
    .from("notion_sync_configs")
    .update({ status: "syncing" })
    .eq("id", configId);

  try {
    // Get Notion access token
    const { data: integration } = await admin
      .from("user_integrations")
      .select("access_token")
      .eq("user_id", config.user_id)
      .eq("provider", "notion")
      .single();

    if (!integration?.access_token) throw new Error("No Notion access token");

    const accessToken = decrypt(integration.access_token);

    // Extract all content
    const allContent: string[] = [];

    for (const page of config.selected_pages ?? []) {
      const content = await extractNotionPageContent(page.id, accessToken);
      if (content.trim()) allContent.push(content);
    }

    for (const db of config.selected_databases ?? []) {
      const rows = await extractNotionDatabaseContent(db.id, accessToken);
      allContent.push(...rows.filter((r) => r.trim()));
    }

    if (allContent.length === 0) {
      const hasNoPages =
        (config.selected_pages ?? []).length === 0 &&
        (config.selected_databases ?? []).length === 0;
      await admin
        .from("notion_sync_configs")
        .update({
          status: "active",
          last_error: hasNoPages
            ? "No pages selected. Open Configure and select at least one Notion page."
            : "Selected pages have no readable text content.",
          // Do NOT update last_synced_at — nothing was actually synced
        })
        .eq("id", configId);
      return;
    }

    // Hash combined content for change detection
    const combined = allContent.join("\n---\n");
    const newHash = crypto.createHash("sha256").update(combined).digest("hex");

    if (newHash === config.content_hash) {
      // Content unchanged — just advance next_sync_at
      const nextSync = computeNextSync(config.sync_frequency, config.user_id);
      await admin
        .from("notion_sync_configs")
        .update({ status: "active", last_synced_at: new Date().toISOString(), next_sync_at: nextSync, last_error: null })
        .eq("id", configId);
      return;
    }

    // Delete old Notion-sourced documents for this bot
    const { data: oldDocs } = await admin
      .from("documents")
      .select("id")
      .eq("assistant_id", config.bot_id)
      .filter("metadata->>'source_type'", "eq", "notion");

    if (oldDocs?.length) {
      const ids = oldDocs.map((d: any) => d.id);
      await admin.from("embeddings").delete().in("document_id", ids);
      await admin.from("documents").delete().in("id", ids);
    }

    // Embed all chunks
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    for (const content of allContent) {
      const chunks = chunkText(content);

      // Create one document per page/database content
      const { data: doc } = await admin
        .from("documents")
        .insert({
          assistant_id: config.bot_id,
          source_url: null,
          metadata: { source_type: "notion" },
        })
        .select("id")
        .single();

      if (!doc) continue;

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
              document_id: doc.id,
              assistant_id: config.bot_id,
              content_chunk: chunk,
              embedding,
            });
          } catch (err) {
            console.error("[Notion Sync] Embedding error:", err);
          }
        })
      );
    }

    const nextSync = computeNextSync(config.sync_frequency, config.user_id);
    await admin
      .from("notion_sync_configs")
      .update({
        status: "active",
        last_synced_at: new Date().toISOString(),
        next_sync_at: nextSync,
        content_hash: newHash,
        last_error: null,
      })
      .eq("id", configId);
  } catch (err: any) {
    console.error("[Notion Sync] Error for config", configId, ":", err);
    await admin
      .from("notion_sync_configs")
      .update({ status: "error", last_error: err.message ?? "Unknown error" })
      .eq("id", configId);
  }
}

function computeNextSync(frequency: string, _userId: string): string {
  const now = new Date();
  if (frequency === "hourly") {
    now.setHours(now.getHours() + 1);
  } else {
    now.setHours(now.getHours() + 24);
  }
  return now.toISOString();
}
