---
title: "Notion Integration"
description: "Sync Notion pages and databases as a live knowledge source for your AI assistant."
---

# Notion Integration

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

Connect your Notion workspace and train your assistant on any page or database. When you update a Notion page, your assistant automatically stays in sync — no manual re-training needed.

## Use Cases

- Train your assistant on your Notion knowledge base or internal wiki
- Sync product documentation, SOPs, and onboarding guides
- Use a Notion database as a live FAQ source
- Keep support bots up to date as your team edits Notion pages

---

## Prerequisites

You need a Notion account. Create one free at [notion.so](https://www.notion.so).

---

## Setup Instructions

### Step 1 — Connect Notion

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the Notion card
3. You'll be redirected to Notion's authorization page
4. Select which pages and databases to give AskYourSite access to

> **Important:** Notion requires you to explicitly select which pages to share. AskYourSite can only access pages you grant permission to.

5. Click **Allow access** — you'll be redirected back to your dashboard

### Step 2 — Configure Per Assistant

1. Go to **Integrations → Notion → Configure**
2. Select the **assistant** to configure
3. Browse and select which Notion pages to include as training sources
4. Set a **sync frequency** (daily recommended)
5. Click **Save & Sync Now**

Your selected pages will be crawled, chunked, and embedded immediately.

### Step 3 — Verify Sync

After the first sync completes, go to your assistant's **Playground** and ask a question about the Notion content. The assistant should answer accurately from the synced content.

---

## Sync Behavior

| Setting | Details |
|---------|---------|
| **Sync frequency** | Daily (automatic) or manual |
| **Manual sync** | Click "Sync Now" at any time |
| **Content deduplication** | Re-sync only runs if content has changed |
| **Supported content** | Text, headings, lists, tables, toggles, callouts |
| **Unsupported** | Embedded databases from other tools, PDFs in Notion |

> **Note:** Notion sub-pages are not automatically included. If you want sub-pages synced, select them individually in the configuration.

---

## Content Types Supported

AskYourSite extracts text from the following Notion block types:

- Paragraph, heading 1/2/3
- Bulleted and numbered lists
- Toggle blocks
- Quote blocks
- Callout blocks
- Table rows
- Code blocks (treated as text)

---

## Disconnecting Notion

Go to **Integrations → Notion → Disconnect**. This deactivates all Notion sync configurations and removes the OAuth connection. Existing embedded content is not deleted — your assistant continues to use the last-synced version until you remove sources manually.
