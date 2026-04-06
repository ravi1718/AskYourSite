---
title: "AI Assistants"
description: "Create, train, and configure AI assistants for your website."
---

# AI Assistants

An **assistant** is the core unit of AskYourSite. Each assistant has its own knowledge base, widget configuration, and conversation history. You can create multiple assistants — one per website, product line, or use case.

## Creating an Assistant

1. Go to **Dashboard → Assistants**
2. Click **+ New Assistant**
3. Enter:
   - **Name** — shown to visitors in the chat widget
   - **Website URL** — used for initial content crawl
4. Click **Create**

The assistant starts training immediately. Status will show **Indexing** while it processes your content, then **Ready** when it's live.

---

## Training Sources

Open your assistant and click the **Knowledge** tab. You can add multiple source types:

### Website Crawl
Enter any URL and AskYourSite will crawl that page (and its linked pages up to 2 levels deep). Best for:
- Your main website
- Help center pages
- Product landing pages

### File Upload
Upload PDFs, Word documents, or plain text files. Best for:
- Policy documents
- Product manuals
- Internal FAQs

### Plain Text
Paste content directly. Best for:
- Quick FAQ updates
- Custom instructions for the assistant
- Policies you haven't published online

### Integrations
Connect live data sources that stay in sync automatically:
- [Notion](/docs/integrations/notion)
- [Google Docs](/docs/integrations/google-docs)
- [Google Sheets](/docs/integrations/google-sheets)
- [HubSpot Knowledge Base](/docs/integrations/hubspot)
- [Airtable](/docs/integrations/airtable)

---

## Training Status

Each source shows a status badge:

| Status | Meaning |
|--------|---------|
| **Pending** | Queued for processing |
| **Processing** | Being indexed and embedded |
| **Ready** | Live — assistant can answer from this source |
| **Failed** | Error during processing — hover for details |

> **Tip:** If a source fails, check the URL is publicly accessible and the file is not password-protected.

---

## The Playground

Click the **Playground** tab inside any assistant to test it before going live. Type questions and see exactly what your assistant answers — and which source it used.

This is the fastest way to identify gaps in your training data.

---

## Widget Configuration

Click the **Widget** tab to customize the chat widget appearance:

- Upload a logo
- Set a welcome message
- Choose brand colors
- Copy the embed code

See [Widget Embedding](/docs/getting-started/widget-embedding) for full setup instructions.

---

## Managing Multiple Assistants

Each assistant is completely independent — separate knowledge, separate widget, separate analytics. Common multi-assistant setups:

| Assistant | Trained On | Embedded On |
|-----------|-----------|------------|
| Support Bot | Help docs, FAQs, policies | `/support`, `/help` |
| Sales Bot | Pricing, case studies, product pages | Homepage, `/pricing` |
| Onboarding Bot | Setup guides, tutorials | `/app/onboarding` |

---

## Deleting an Assistant

Go to **Assistant Settings → Danger Zone → Delete Assistant**. This permanently removes the assistant, its knowledge base, conversation history, and widget. The action cannot be undone.
