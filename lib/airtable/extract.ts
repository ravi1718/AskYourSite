/**
 * Extracts plain text from an Airtable table.
 * Converts each record into a "FieldName: Value. FieldName: Value." string.
 * The resource ID format is "baseId::tableId" (colon-separated composite key).
 */
export async function extractAirtableTableContent(
  resourceId: string,  // "baseId::tableId"
  accessToken: string
): Promise<string> {
  const [baseId, tableId] = resourceId.split("::");
  if (!baseId || !tableId) throw new Error(`Invalid Airtable resource ID: ${resourceId}`);

  // Get field names from table schema
  const schemaRes = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!schemaRes.ok) throw new Error(`[Airtable] Schema fetch failed: ${await schemaRes.text()}`);
  const schema = await schemaRes.json();
  const table = (schema.tables ?? []).find((t: any) => t.id === tableId);
  const fieldNames: Record<string, string> = {};
  for (const f of table?.fields ?? []) {
    fieldNames[f.id] = f.name;
  }

  const parts: string[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const res = await fetch(`https://api.airtable.com/v0/${baseId}/${tableId}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`[Airtable] Records fetch failed: ${await res.text()}`);

    const data = await res.json();

    for (const record of data.records ?? []) {
      const fields = record.fields ?? {};
      const fieldStrings: string[] = [];
      for (const [fieldId, value] of Object.entries(fields)) {
        const name = fieldNames[fieldId] ?? fieldId;
        const strValue = formatFieldValue(value);
        if (strValue) fieldStrings.push(`${name}: ${strValue}`);
      }
      if (fieldStrings.length) parts.push(fieldStrings.join(". "));
    }

    offset = data.offset;
  } while (offset);

  return parts.join("\n");
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "object" && v !== null && "name" in v ? (v as any).name : String(v)))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object" && value !== null) {
    // Handle linked records, collaborators, etc.
    if ("name" in value) return (value as any).name;
    if ("email" in value) return (value as any).email;
    if ("text" in value) return (value as any).text;
    if ("url" in value) return (value as any).url;
  }
  return "";
}
