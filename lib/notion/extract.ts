const NOTION_VERSION = "2022-06-28";
const REQUEST_DELAY_MS = 350; // Stay under Notion's 3 req/s limit

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function notionGet(url: string, accessToken: string, attempt = 0): Promise<any> {
  await delay(REQUEST_DELAY_MS * attempt); // backoff on retries
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": NOTION_VERSION,
    },
  });
  if (res.status === 429 && attempt < 3) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "1", 10);
    await delay(retryAfter * 1000);
    return notionGet(url, accessToken, attempt + 1);
  }
  if (!res.ok) throw new Error(`Notion GET ${url} failed: ${res.status}`);
  return res.json();
}

/** Extracts plain text from a rich_text array */
function richTextToString(richText: any[]): string {
  return (richText ?? []).map((t: any) => t.plain_text ?? "").join("");
}

/** Recursively extracts text from a block and its children */
async function extractBlock(block: any, accessToken: string, depth = 0): Promise<string> {
  if (depth > 5) return ""; // prevent infinite recursion on deeply nested pages

  const parts: string[] = [];

  switch (block.type) {
    case "paragraph":
      parts.push(richTextToString(block.paragraph?.rich_text));
      break;
    case "heading_1":
      parts.push(`# ${richTextToString(block.heading_1?.rich_text)}`);
      break;
    case "heading_2":
      parts.push(`## ${richTextToString(block.heading_2?.rich_text)}`);
      break;
    case "heading_3":
      parts.push(`### ${richTextToString(block.heading_3?.rich_text)}`);
      break;
    case "bulleted_list_item":
      parts.push(`- ${richTextToString(block.bulleted_list_item?.rich_text)}`);
      break;
    case "numbered_list_item":
      parts.push(`1. ${richTextToString(block.numbered_list_item?.rich_text)}`);
      break;
    case "toggle":
      parts.push(richTextToString(block.toggle?.rich_text));
      break;
    case "quote":
      parts.push(`> ${richTextToString(block.quote?.rich_text)}`);
      break;
    case "callout":
      parts.push(richTextToString(block.callout?.rich_text));
      break;
    case "code":
      parts.push(`\`\`\`${block.code?.language ?? ""}\n${richTextToString(block.code?.rich_text)}\n\`\`\``);
      break;
    case "table_row":
      parts.push(
        (block.table_row?.cells ?? [])
          .map((cell: any[]) => richTextToString(cell))
          .join(" | ")
      );
      break;
    // Skip: image, video, embed, file, divider, breadcrumb, table_of_contents, unsupported
    default:
      break;
  }

  // Fetch children for blocks that can have them
  const hasChildrenTypes = ["toggle", "child_page", "column_list", "column", "synced_block", "template", "bulleted_list_item", "numbered_list_item"];
  if (block.has_children && hasChildrenTypes.includes(block.type)) {
    const children = await fetchAllBlocks(block.id, accessToken);
    for (const child of children) {
      const childText = await extractBlock(child, accessToken, depth + 1);
      if (childText) parts.push(childText);
    }
  }

  return parts.filter(Boolean).join("\n");
}

/** Fetches all blocks for a page/block, handling pagination */
async function fetchAllBlocks(blockId: string, accessToken: string): Promise<any[]> {
  const blocks: any[] = [];
  let cursor: string | undefined;

  do {
    const url = `https://api.notion.com/v1/blocks/${blockId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ""}`;
    const data = await notionGet(url, accessToken);
    blocks.push(...(data.results ?? []));
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/**
 * Extracts all text content from a Notion page.
 * Returns a single string with double newlines between sections.
 */
export async function extractNotionPageContent(
  pageId: string,
  accessToken: string
): Promise<string> {
  const blocks = await fetchAllBlocks(pageId, accessToken);
  const parts: string[] = [];

  for (const block of blocks) {
    const text = await extractBlock(block, accessToken);
    if (text.trim()) parts.push(text.trim());
    await delay(REQUEST_DELAY_MS);
  }

  return parts.join("\n\n");
}

/**
 * Extracts content from a Notion database.
 * Returns an array of strings (one per row/page), each suitable as a training chunk.
 */
export async function extractNotionDatabaseContent(
  databaseId: string,
  accessToken: string
): Promise<string[]> {
  const chunks: string[] = [];
  let cursor: string | undefined;

  do {
    const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 50, start_cursor: cursor }),
    });

    if (!res.ok) break;
    const data = await res.json();

    for (const page of data.results ?? []) {
      const lines: string[] = [];
      for (const [propName, propValue] of Object.entries<any>(page.properties ?? {})) {
        let value = "";
        switch (propValue.type) {
          case "title":
            value = richTextToString(propValue.title);
            break;
          case "rich_text":
            value = richTextToString(propValue.rich_text);
            break;
          case "select":
            value = propValue.select?.name ?? "";
            break;
          case "multi_select":
            value = (propValue.multi_select ?? []).map((s: any) => s.name).join(", ");
            break;
          case "url":
            value = propValue.url ?? "";
            break;
          case "email":
            value = propValue.email ?? "";
            break;
          case "number":
            value = String(propValue.number ?? "");
            break;
          case "checkbox":
            value = propValue.checkbox ? "Yes" : "No";
            break;
          default:
            continue;
        }
        if (value) lines.push(`${propName}: ${value}`);
      }
      if (lines.length) chunks.push(lines.join("\n"));
    }

    cursor = data.has_more ? data.next_cursor : undefined;
    await delay(REQUEST_DELAY_MS);
  } while (cursor);

  return chunks;
}
