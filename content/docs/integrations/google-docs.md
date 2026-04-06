---
title: "Google Docs Integration"
description: "Sync Google Docs as live training sources for your AI assistant."
---

# Google Docs Integration

Connect Google Docs and train your assistant on any document in your Google Drive. When you update a document, your assistant automatically re-syncs on the next scheduled run — no manual re-training needed.

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

## Use Cases

- SOPs, onboarding guides, and internal wikis
- Product documentation and release notes
- Support articles and troubleshooting guides
- Employee handbooks and HR policies
- Brand guidelines and messaging documents

---

## Connecting Google Docs

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the **Google Docs** card
3. You'll be redirected to Google's sign-in page — log in with the Google account that has access to your Docs
4. Review the permissions and click **Allow**
5. You'll be redirected back to your dashboard — Google Docs will show as **Connected**

> **Note:** Connecting Google Docs also enables Google Sheets and Google Drive — all three use the same Google account connection.

---

## Configuring Per Assistant

1. Go to **Integrations → Google Docs → Configure**
2. Select the **assistant** you want to train
3. Browse your Google Docs and select which documents to include
4. Set a **sync frequency** (daily is recommended)
5. Click **Save & Sync Now**

Your selected documents will be indexed and embedded immediately.

---

## Verifying It Works

1. After the sync completes, go to your assistant's **Playground**
2. Ask a question about the content inside one of your synced documents
3. The assistant should answer accurately from that content

---

## Sync Behavior

| Setting | Details |
|---------|---------|
| **Sync frequency** | Daily (automatic) |
| **Manual sync** | Click "Sync Now" at any time |
| **Change detection** | Only re-embeds if document content has changed |
| **Supported content** | Paragraphs, headings, tables, lists |

---

## Disconnecting

Go to **Integrations → Google Docs → Disconnect**. This disconnects all three Google integrations (Docs, Sheets, Drive) and deactivates all sync configurations. Existing embedded content is preserved until you manually remove it.

---

## Need Help?

Email **ravitej@askyoursite.in** if you run into any issues connecting your Google account.
