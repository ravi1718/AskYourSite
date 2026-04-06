---
title: "Google Sheets Integration"
description: "Sync Google Sheets as structured knowledge sources for your AI assistant."
---

# Google Sheets Integration

Connect Google Sheets and train your assistant on any spreadsheet. AskYourSite converts each row into structured text, making it ideal for product catalogs, pricing tables, FAQs, and directories.

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

## Use Cases

- **Product catalogs** — Name, Description, Price, SKU → bot answers product questions
- **FAQ sheets** — Question, Answer columns → direct Q&A training
- **Pricing tables** — Plans, features, limits → bot explains pricing tiers
- **Team directory** — Name, Role, Email, Department → "who do I contact for X?"
- **Inventory / stock** — Live data maintained by your team
- **Partner or vendor lists** — Bot answers "do you work with X?"

---

## How Row Extraction Works

AskYourSite reads the **first row as column headers** and converts every subsequent row into a natural-language sentence:

**Example Sheet:**

| Product | Price | Description |
|---------|-------|-------------|
| Starter Plan | $20/mo | 1 chatbot, 200 conversations/mo |
| Pro Plan | $69/mo | 3 chatbots, 1,000 conversations/mo |

**Converted to:**

```
Product: Starter Plan. Price: $20/mo. Description: 1 chatbot, 200 conversations/mo.
Product: Pro Plan. Price: $69/mo. Description: 3 chatbots, 1,000 conversations/mo.
```

This format makes embeddings semantically rich and search-accurate.

---

## Connecting Google Sheets

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the **Google Sheets** card (or it will already show **Connected** if you've connected Google Docs)
3. If not connected: log in with your Google account and click **Allow**
4. You'll be redirected back — Google Sheets will show as **Connected**

---

## Configuring Per Assistant

1. Go to **Integrations → Google Sheets → Configure**
2. Select your **assistant**
3. Browse and select which spreadsheets to sync
4. Set **sync frequency**
5. Click **Save & Sync Now**

---

## Sync Behavior

| Setting | Details |
|---------|---------|
| **Sync scope** | First sheet (tab) of each spreadsheet |
| **Headers** | Row 1 is treated as column names |
| **Empty cells** | Skipped gracefully |
| **Change detection** | Only re-embeds if content has changed |
| **Row limit** | Up to 10,000 rows per sheet |

---

## Best Practices

- **One topic per sheet** — don't mix products and FAQs in the same spreadsheet
- **Use clear column headers** — they become part of the embedded text
- **Keep data clean** — remove merged cells before syncing
- **Add a "Notes" column** for additional context the bot can use

---

## Disconnecting

Go to **Integrations → Google Sheets → Disconnect**. This disconnects all three Google integrations (Docs, Sheets, Drive).

---

## Need Help?

Email **ravitej@askyoursite.in** with any questions about the Google Sheets integration.
