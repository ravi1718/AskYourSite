/**
 * Extracts plain text content from a Google Doc.
 * Uses the Google Docs API v1 — one call returns the full document structure.
 * No pagination needed; the API returns the entire body at once.
 */
export async function extractGoogleDocContent(
  docId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://docs.googleapis.com/v1/documents/${docId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`[Google Docs] Failed to fetch doc ${docId}: ${errText}`);
  }

  const doc = await res.json();
  const parts: string[] = [];

  // Walk the document body content array
  for (const element of doc.body?.content ?? []) {
    const text = extractDocElement(element);
    if (text.trim()) parts.push(text.trim());
  }

  return parts.join("\n");
}

function extractDocElement(element: any): string {
  if (element.paragraph) {
    return extractParagraph(element.paragraph);
  }
  if (element.table) {
    return extractTable(element.table);
  }
  return "";
}

function extractParagraph(paragraph: any): string {
  const texts: string[] = [];
  for (const el of paragraph.elements ?? []) {
    if (el.textRun?.content) {
      texts.push(el.textRun.content);
    }
  }
  return texts.join("");
}

function extractTable(table: any): string {
  const rows: string[] = [];
  for (const row of table.tableRows ?? []) {
    const cells: string[] = [];
    for (const cell of row.tableCells ?? []) {
      const cellText = (cell.content ?? [])
        .map((el: any) => extractDocElement(el))
        .join(" ")
        .trim();
      if (cellText) cells.push(cellText);
    }
    if (cells.length) rows.push(cells.join(" | "));
  }
  return rows.join("\n");
}
