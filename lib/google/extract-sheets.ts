/**
 * Extracts plain text content from a Google Sheet.
 * Converts rows to "ColumnName: Value. ColumnName: Value." format.
 * The first row is treated as headers (column names).
 * One API call fetches all data in the default sheet.
 */
export async function extractGoogleSheetContent(
  spreadsheetId: string,
  accessToken: string
): Promise<string> {
  // First fetch spreadsheet metadata to get the first sheet's title
  const metaRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!metaRes.ok) {
    throw new Error(`[Google Sheets] Failed to fetch metadata for ${spreadsheetId}: ${await metaRes.text()}`);
  }

  const meta = await metaRes.json();
  const firstSheet = meta.sheets?.[0]?.properties?.title ?? "Sheet1";

  // Fetch all rows from the first sheet
  const dataRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(firstSheet)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!dataRes.ok) {
    throw new Error(`[Google Sheets] Failed to fetch values: ${await dataRes.text()}`);
  }

  const data = await dataRes.json();
  const rows: string[][] = data.values ?? [];

  if (rows.length === 0) return "";

  const headers = rows[0].map((h) => String(h).trim());
  const parts: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const fields: string[] = [];
    for (let j = 0; j < headers.length; j++) {
      const value = (row[j] ?? "").toString().trim();
      if (value && headers[j]) {
        fields.push(`${headers[j]}: ${value}`);
      }
    }
    if (fields.length > 0) {
      parts.push(fields.join(". "));
    }
  }

  return parts.join("\n");
}
