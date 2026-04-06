import { extractGoogleDocContent } from "./extract-docs";
import { extractGoogleSheetContent } from "./extract-sheets";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

/**
 * Extracts text content from all files in a Google Drive folder.
 * Recursively walks subfolders.
 * Supports: Google Docs, Google Sheets (other types skipped).
 */
export async function extractDriveFolderContent(
  folderId: string,
  accessToken: string,
  depth = 0
): Promise<string[]> {
  // Prevent runaway recursion in deeply nested folder structures
  if (depth > 3) return [];

  const files = await listFolderFiles(folderId, accessToken);
  const contents: string[] = [];

  await Promise.allSettled(
    files.map(async (file) => {
      try {
        if (file.mimeType === "application/vnd.google-apps.folder") {
          // Recurse into subfolder
          const subContents = await extractDriveFolderContent(file.id, accessToken, depth + 1);
          contents.push(...subContents);
        } else if (file.mimeType === "application/vnd.google-apps.document") {
          const text = await extractGoogleDocContent(file.id, accessToken);
          if (text.trim()) contents.push(`[${file.name}]\n${text}`);
        } else if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
          const text = await extractGoogleSheetContent(file.id, accessToken);
          if (text.trim()) contents.push(`[${file.name}]\n${text}`);
        }
        // Other types (PDFs, images, etc.) are skipped in this version
      } catch (err) {
        console.error(`[Google Drive] Failed to extract file ${file.name} (${file.id}):`, err);
      }
    })
  );

  return contents;
}

async function listFolderFiles(folderId: string, accessToken: string): Promise<DriveFile[]> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: "files(id,name,mimeType)",
    pageSize: "200",
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`[Google Drive] Failed to list folder ${folderId}: ${await res.text()}`);
  }

  const data = await res.json();
  return data.files ?? [];
}
