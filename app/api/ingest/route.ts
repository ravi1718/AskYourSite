import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Simple text chunker
function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

// Extract product image URLs from Firecrawl markdown (absolute URLs only, no icons/logos)
function extractImageUrls(markdown: string): Array<{ imageUrl: string; altText: string }> {
  const IMAGE_REGEX = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  const SKIP_PATTERNS = /logo|icon|avatar|favicon|sprite|badge|banner|placeholder|pixel|tracking/i;
  const SKIP_EXTENSIONS = /\.(svg|gif|ico|webp)(\?|$)/i;

  const results: Array<{ imageUrl: string; altText: string }> = [];
  let match;
  while ((match = IMAGE_REGEX.exec(markdown)) !== null) {
    const [, altText, imageUrl] = match;
    if (SKIP_PATTERNS.test(imageUrl) || SKIP_PATTERNS.test(altText)) continue;
    if (SKIP_EXTENSIONS.test(imageUrl)) continue;
    results.push({ imageUrl, altText: altText || "" });
  }
  return results;
}

export async function POST(req: Request) {
  try {
    const { markdown, assistantId, sourceUrl } = await req.json();

    if (!markdown || !assistantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Use admin client to bypass RLS for server-side embedding storage
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase admin client not initialized. Check SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    // Insert Document record
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        assistant_id: assistantId,
        source_url: sourceUrl,
        metadata: {}
      })
      .select()
      .single();

    if (docError || !doc) {
      console.error("Document insert error:", docError);
      return NextResponse.json(
        { error: docError?.message || "Failed to create document" },
        { status: 500 }
      );
    }

    console.log(`[Ingest] Document created: ${doc.id} for assistant ${assistantId}`);

    // Chunk text
    const chunks = chunkText(markdown, 1000, 200);
    console.log(`[Ingest] Created ${chunks.length} chunks from markdown (${markdown.length} chars)`);

    // Generate embeddings via Gemini and insert sequentially
    let processed = 0;
    const errors: string[] = [];

    for (const chunk of chunks) {
      if (chunk.trim().length === 0) continue;

      try {
        const response = await ai.models.embedContent({
          model: 'gemini-embedding-001',
          contents: chunk,
          config: { outputDimensionality: 768 },
        });

        const embedding = response.embeddings?.[0]?.values;

        if (!embedding) {
          console.warn(`[Ingest] No embedding returned for chunk (${chunk.length} chars)`);
          errors.push(`No embedding returned for chunk`);
          continue;
        }

        console.log(`[Ingest] Generated embedding with ${embedding.length} dimensions`);

        const { error: insertError } = await supabase.from("embeddings").insert({
          document_id: doc.id,
          assistant_id: assistantId,
          content_chunk: chunk,
          embedding: embedding,
        });

        if (insertError) {
          console.error(`[Ingest] Embedding insert error:`, insertError);
          errors.push(`Insert failed: ${insertError.message}`);
          continue;
        }

        processed++;
        console.log(`[Ingest] Stored embedding ${processed}/${chunks.length}`);
      } catch (chunkError: any) {
        console.error(`[Ingest] Error processing chunk:`, chunkError);
        errors.push(`Chunk processing error: ${chunkError.message}`);
      }
    }

    if (processed === 0) {
      return NextResponse.json(
        { error: `Failed to store any embeddings. Errors: ${errors.join('; ')}` },
        { status: 500 }
      );
    }

    // --- Image extraction and embedding ---
    const imageUrls = extractImageUrls(markdown);
    const MAX_IMAGES_PER_PAGE = 10;
    const imagesToProcess = imageUrls.slice(0, MAX_IMAGES_PER_PAGE);
    let imagesProcessed = 0;

    if (imagesToProcess.length > 0) {
      console.log(`[Ingest] Found ${imageUrls.length} product images, processing up to ${MAX_IMAGES_PER_PAGE}`);
    }

    for (const { imageUrl, altText } of imagesToProcess) {
      try {
        // Fetch image and convert to base64
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(8000) });
        if (!imgRes.ok) {
          console.warn(`[Ingest] Skipping image (fetch failed ${imgRes.status}): ${imageUrl}`);
          continue;
        }
        const mimeType = imgRes.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");

        // Describe the image with Gemini Vision
        const visionResult = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{
            parts: [
              { text: `Describe this product image in detail for search purposes. Include: product type, colors, style, material if visible, key features, and any text visible. Alt text hint: "${altText}". Be concise (2-3 sentences).` },
              { inlineData: { mimeType, data: base64 } }
            ]
          }]
        });

        const description = visionResult.text?.trim();
        if (!description) {
          console.warn(`[Ingest] No description returned for image: ${imageUrl}`);
          continue;
        }

        // Embed the description text
        const embedResponse = await ai.models.embedContent({
          model: "gemini-embedding-001",
          contents: description,
          config: { outputDimensionality: 768 },
        });

        const imageEmbedding = embedResponse.embeddings?.[0]?.values;
        if (!imageEmbedding) {
          console.warn(`[Ingest] No embedding for image description: ${imageUrl}`);
          continue;
        }

        // Store with image metadata
        const { error: imgInsertError } = await supabase.from("embeddings").insert({
          document_id: doc.id,
          assistant_id: assistantId,
          content_chunk: description,
          embedding: imageEmbedding,
          metadata: {
            type: "image",
            image_url: imageUrl,
            page_url: sourceUrl || null,
            alt_text: altText,
          },
        });

        if (imgInsertError) {
          console.error(`[Ingest] Image embedding insert error:`, imgInsertError);
          errors.push(`Image insert failed: ${imgInsertError.message}`);
          continue;
        }

        imagesProcessed++;
        console.log(`[Ingest] Embedded image ${imagesProcessed}/${imagesToProcess.length}: ${imageUrl}`);
        // Respect free-tier RPM limit — add delay between image calls
        if (imagesProcessed < imagesToProcess.length) {
          await new Promise(r => setTimeout(r, 6000));
        }
      } catch (imgError: any) {
        console.warn(`[Ingest] Image processing skipped (${imageUrl}): ${imgError.message}`);
      }
    }

    if (imageUrls.length > MAX_IMAGES_PER_PAGE) {
      console.log(`[Ingest] Skipped ${imageUrls.length - MAX_IMAGES_PER_PAGE} images (limit ${MAX_IMAGES_PER_PAGE}/page)`);
    }

    console.log(`[Ingest] Complete: ${processed}/${chunks.length} text chunks + ${imagesProcessed} images stored`);

    return NextResponse.json({
      success: true,
      chunksProcessed: processed,
      totalChunks: chunks.length,
      imagesProcessed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Ingest] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
