---
title: "Google Drive Integration"
description: "Sync entire Google Drive folders — every Doc, Sheet, and PDF stays in sync automatically."
---

# Google Drive Integration

Connect Google Drive and select entire folders to sync. AskYourSite recursively walks your selected folders, automatically detecting Docs, Sheets, and PDFs — and syncing all of them as training content for your assistant.

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

> **Tip:** This is the most powerful Google integration. Add any file to your folder and it gets picked up on the next sync automatically — no manual selection needed.

## Use Cases

- **Company shared drive** — sync an entire team knowledge base in one folder
- **Client folders** — one bot per client, each trained on their Drive folder
- **Support documentation** — all help articles stored in Drive, always in sync
- **Team wikis** — mix of Docs and Sheets, auto-synced to your assistant
- **Bulk onboarding** — sync all onboarding materials at once

---

## Supported File Types

| File Type | How It's Processed |
|-----------|-------------------|
| Google Docs | Extracted via Google Docs API |
| Google Sheets | Row-by-row extraction |
| Folders | Recursively walked (up to 3 levels deep) |
| PDFs | Text extracted directly |

> **Note:** Images, videos, audio files, and other binary files are skipped during sync.

---

## Connecting Google Drive

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the **Google Drive** card (or it shows **Connected** if you've already linked Google Docs or Sheets)
3. If not connected: log in with your Google account and click **Allow**
4. You'll be redirected back — Google Drive will show as **Connected**

---

## Configuring Per Assistant

1. Go to **Integrations → Google Drive → Configure**
2. Select your **assistant**
3. Browse your Drive folders and select the ones to sync
4. Set **sync frequency** (daily is recommended)
5. Click **Save & Sync Now**

---

## Sync Behavior

| Setting | Details |
|---------|---------|
| **Folder depth** | Up to 3 levels of sub-folders |
| **New files** | Picked up automatically on next sync |
| **Deleted files** | Removed from knowledge base on next sync |
| **Change detection** | Per-file hash — only changed files re-embed |
| **Max files per folder** | 500 files per sync run |

---

## Disconnecting

Go to **Integrations → Google Drive → Disconnect**. This disconnects all three Google integrations (Docs, Sheets, Drive) and deactivates all sync configurations.

---

## Need Help?

Email **ravitej@askyoursite.in** if you run into any issues with Google Drive sync.
