/**
 * Extracts plain text from HubSpot content sources.
 * Source IDs:
 *   "hubspot::kb"            → all published Knowledge Base articles
 *   "hubspot::blog"          → all published blog posts (all blogs)
 *   "hubspot::blog::{blogId}" → posts from a specific blog
 */

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export async function extractHubSpotContent(
  sourceId: string,
  accessToken: string
): Promise<string> {
  if (sourceId === "hubspot::kb") {
    return extractKnowledgeBase(accessToken);
  }
  if (sourceId === "hubspot::blog") {
    return extractBlogPosts(accessToken, null);
  }
  if (sourceId.startsWith("hubspot::blog::")) {
    const blogId = sourceId.replace("hubspot::blog::", "");
    return extractBlogPosts(accessToken, blogId);
  }
  return "";
}

async function extractKnowledgeBase(accessToken: string): Promise<string> {
  const parts: string[] = [];
  let after: string | undefined;

  do {
    const params = new URLSearchParams({ limit: "100", state: "PUBLISHED" });
    if (after) params.set("after", after);

    const res = await fetch(
      `https://api.hubapi.com/cms/v3/site-search/search?${params.toString()}&type=KNOWLEDGE_ARTICLE`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      console.error("[HubSpot KB] Search failed:", await res.text());
      break;
    }

    const data = await res.json();

    for (const result of data.results ?? []) {
      const title = result.title ?? "";
      const body = stripHtml(result.body ?? "");
      const description = stripHtml(result.description ?? "");
      if (title || body) {
        parts.push([title, description, body].filter(Boolean).join("\n"));
      }
    }

    after = data.paging?.next?.after;
  } while (after);

  return parts.join("\n\n---\n\n");
}

async function extractBlogPosts(accessToken: string, blogId: string | null): Promise<string> {
  const parts: string[] = [];
  let after: string | undefined;

  do {
    const params = new URLSearchParams({ limit: "50", state: "PUBLISHED" });
    if (after) params.set("after", after);
    if (blogId) params.set("contentGroupId", blogId);

    const res = await fetch(
      `https://api.hubapi.com/cms/v3/blogs/posts?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) {
      console.error("[HubSpot Blog] Fetch failed:", await res.text());
      break;
    }

    const data = await res.json();

    for (const post of data.results ?? []) {
      const title = post.name ?? "";
      const metaDescription = stripHtml(post.metaDescription ?? "");
      const body = stripHtml(post.postBody ?? post.postSummary ?? "");
      if (title || body) {
        parts.push([title, metaDescription, body].filter(Boolean).join("\n"));
      }
    }

    after = data.paging?.next?.after;
  } while (after);

  return parts.join("\n\n---\n\n");
}
