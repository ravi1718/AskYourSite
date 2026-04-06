---
title: "Knowledge Base"
description: "Understand how AskYourSite processes, stores, and searches your training content."
---

# Knowledge Base

The knowledge base is the collection of content your assistant uses to answer questions. Every piece of content you add — URLs, files, integrations — is processed into searchable embeddings stored securely in your knowledge base.

## How It Works

1. **Ingest** — You add content (URL, file, integration sync)
2. **Chunk** — Content is split into overlapping segments (~500 tokens each)
3. **Embed** — Each chunk is converted to a vector using Google's embedding model
4. **Store** — Vectors stored in Supabase with metadata (source type, source ID)
5. **Search** — At query time, your question is embedded and matched against stored vectors
6. **Answer** — The top matches are passed to the AI model as context

This approach (Retrieval Augmented Generation / RAG) ensures the assistant only answers from your content — not from general AI training data.

---

## Adding Content

Go to **Dashboard → Assistants → [Your Assistant] → Knowledge** and click **+ Add Source**:

### Website URL

Enter any publicly accessible URL. AskYourSite will:
- Crawl the page and extract visible text
- Follow internal links up to 2 levels deep
- Ignore JavaScript-rendered content (use file upload for SPAs)

```
https://yoursite.com/help          ← single page
https://yoursite.com               ← crawls entire site (up to 50 pages)
```

### File Upload

Drag and drop or browse for:

| Format | Notes |
|--------|-------|
| PDF | Text extracted, images ignored |
| TXT | Ingested as-is |
| DOCX | Text extracted from paragraphs |

> **Note:** Maximum file size is 25 MB. Password-protected files cannot be processed.

### Plain Text

Paste content directly into the text editor. Useful for:
- Custom instructions (e.g. "Always recommend the Pro plan for teams >5")
- Quick FAQ additions
- Content that isn't published anywhere online

### Integrations

Live-sync sources that update automatically:

- [Notion](/docs/integrations/notion)
- [Google Docs](/docs/integrations/google-docs)
- [Google Sheets](/docs/integrations/google-sheets)
- [Google Drive](/docs/integrations/google-drive)
- [HubSpot](/docs/integrations/hubspot)
- [Airtable](/docs/integrations/airtable)

---

## Source Status

| Status | Meaning |
|--------|---------|
| **Pending** | Queued for processing |
| **Processing** | Being chunked and embedded |
| **Ready** | Live and searchable |
| **Failed** | Error — hover the status badge for details |

---

## Managing Sources

- **Delete a source** — Click the trash icon next to any source. Removes all chunks and embeddings for that source.
- **Re-sync** — For integration sources, click "Sync Now" to force an immediate re-index.
- **View chunks** — (Business plan) Inspect how content was chunked and what the bot sees.

---

## Content Limits by Plan

| Plan | Max Sources | Max Documents |
|------|------------|---------------|
| Starter | 10 | 100 |
| Professional | 50 | 500 |
| Business | Unlimited | Unlimited |

See [Plans Overview](/docs/billing/plans) for full details.

---

## Tips for Better Answers

- **Be specific** — Precise, well-structured content produces better answers than vague blobs of text
- **Use headings** — Section headers help the chunking algorithm create meaningful segments
- **Add FAQs explicitly** — A dedicated Q&A document improves response accuracy for common questions
- **Avoid duplicates** — Duplicate content across sources degrades embedding quality
- **Keep content current** — Stale content leads to wrong answers; use integrations for live sync
