import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";
const PAGE_LIMITS: Record<string, number> = { starter: 50, pro: 200, business: 500 };

export async function POST(req: Request) {
  try {
    const { url, mode } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL to scrape" }, { status: 400 });
    }

    if (!process.env.FIRECRAWL_API_KEY) {
      return NextResponse.json({ error: "Missing FIRECRAWL_API_KEY" }, { status: 500 });
    }

    // Determine page limit by plan
    let pageLimit = 50;
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: usageData } = await supabase
          .rpc("get_user_usage", { p_user_id: user.id } as any)
          .single();
        const planCode = (usageData as any)?.plan_code as string | undefined;
        if (planCode && PAGE_LIMITS[planCode]) pageLimit = PAGE_LIMITS[planCode];
      }
    }

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}`
    };

    // If mode is "single", use the old scrape endpoint for a single page
    if (mode === "single") {
      const response = await fetch(`${FIRECRAWL_BASE}/scrape`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url, formats: ["markdown"] })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to scrape target URL");
      }

      return NextResponse.json({
        pages: [{ url, markdown: data.data?.markdown || "", metadata: data.data?.metadata || {} }],
        totalPages: 1,
        success: true
      });
    }

    // Full-site crawl: POST to /v1/crawl to start the async job
    const crawlResponse = await fetch(`${FIRECRAWL_BASE}/crawl`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        url,
        limit: pageLimit,
        scrapeOptions: {
          formats: ["markdown"]
        }
      })
    });

    const crawlData = await crawlResponse.json();

    if (!crawlResponse.ok || !crawlData.success) {
      throw new Error(crawlData.error || "Failed to start crawl job");
    }

    const crawlId = crawlData.id;
    console.log(`[Crawl] Started crawl job: ${crawlId} for ${url}`);

    // Poll for completion
    const maxPolls = 60; // 5 minutes max (5s intervals)
    let pollCount = 0;
    let completed = false;
    let resultData: any = null;

    while (pollCount < maxPolls) {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds
      pollCount++;

      const statusResponse = await fetch(`${FIRECRAWL_BASE}/crawl/${crawlId}`, {
        headers: { "Authorization": `Bearer ${process.env.FIRECRAWL_API_KEY}` }
      });

      const statusData = await statusResponse.json();
      console.log(`[Crawl] Poll ${pollCount}: status=${statusData.status}, completed=${statusData.completed}/${statusData.total}`);

      if (statusData.status === "completed") {
        resultData = statusData;
        completed = true;
        break;
      }

      if (statusData.status === "failed" || statusData.status === "cancelled") {
        throw new Error(`Crawl ${statusData.status}: ${statusData.error || "Unknown error"}`);
      }
    }

    if (!completed) {
      throw new Error("Crawl timed out after 5 minutes");
    }

    // Extract pages from crawl result
    const pages = (resultData.data || []).map((item: any) => ({
      url: item.metadata?.sourceURL || item.metadata?.url || url,
      markdown: item.markdown || "",
      metadata: item.metadata || {}
    })).filter((p: any) => p.markdown.length > 0);

    console.log(`[Crawl] Completed: ${pages.length} pages with content from ${url}`);

    return NextResponse.json({
      pages,
      totalPages: pages.length,
      success: true
    });
  } catch (error: any) {
    console.error("Crawl error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
