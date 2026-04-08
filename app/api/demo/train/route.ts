import { NextResponse } from "next/server";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const MAX_DEMO_PAGES = 3;

// Rate limit: 5 trains per IP per hour
const trainRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkTrainRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = trainRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    trainRateLimit.set(ip, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + chunkSize));
    i += chunkSize - overlap;
  }
  return chunks;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkTrainRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many demo requests. Please wait before trying again." },
      { status: 429 }
    );
  }

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Missing URL" }, { status: 400 });
    }

    // Basic URL validation + normalize
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith("http") ? url : `https://${url}`);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: "Service not configured" }, { status: 500 });
    }

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    };

    // Start crawl job with max 3 pages
    const crawlResponse = await fetch(`${FIRECRAWL_BASE}/crawl`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url: parsedUrl.toString(),
        limit: MAX_DEMO_PAGES,
        scrapeOptions: { formats: ["markdown"] },
      }),
    });

    const crawlData = await crawlResponse.json();
    if (!crawlResponse.ok || !crawlData.success) {
      // Fallback: try single page scrape
      const scrapeRes = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: parsedUrl.toString(), formats: ["markdown"] }),
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok || !scrapeData.success) {
        throw new Error("Failed to read website content. Make sure the URL is publicly accessible.");
      }

      const markdown = scrapeData.data?.markdown || "";
      const chunks = chunkText(markdown).slice(0, 20);
      return NextResponse.json({
        success: true,
        chunks,
        pagesCrawled: 1,
        urls: [parsedUrl.toString()],
        domain: parsedUrl.hostname,
      });
    }

    const crawlId = crawlData.id;
    let pages: { url: string; markdown: string }[] = [];

    // Poll for completion — max 60s for demo (12 polls × 5s)
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const statusRes = await fetch(`${FIRECRAWL_BASE}/crawl/${crawlId}`, {
        headers: { Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}` },
      });
      const statusData = await statusRes.json();

      const rawPages = statusData.data || [];
      pages = rawPages
        .slice(0, MAX_DEMO_PAGES)
        .map((item: any) => ({
          url: item.metadata?.sourceURL || parsedUrl.toString(),
          markdown: item.markdown || "",
        }))
        .filter((p: any) => p.markdown.length > 50);

      if (statusData.status === "completed" || pages.length >= MAX_DEMO_PAGES) break;
      if (statusData.status === "failed") break;
    }

    // Combine all content into chunks
    const allChunks: string[] = [];
    const crawledUrls: string[] = [];

    for (const page of pages) {
      if (page.markdown) {
        crawledUrls.push(page.url);
        const pageChunks = chunkText(page.markdown).slice(0, 15);
        allChunks.push(...pageChunks);
      }
    }

    return NextResponse.json({
      success: true,
      chunks: allChunks.slice(0, 30),
      pagesCrawled: pages.length,
      urls: crawledUrls,
      domain: parsedUrl.hostname,
    });
  } catch (error: any) {
    console.error("[Demo Train] Error:", error);
    return NextResponse.json(
      { error: error.message || "Training failed. Please check the URL and try again." },
      { status: 500 }
    );
  }
}
