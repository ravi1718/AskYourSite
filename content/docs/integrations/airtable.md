---
title: "Airtable Integration"
description: "Sync Airtable bases and tables as structured knowledge sources for your AI assistant."
---

# Airtable Integration

Connect Airtable and train your assistant on any table in your bases. AskYourSite converts each record into natural-language text — making your structured Airtable data fully searchable by AI.

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

## Use Cases

- **Product database** — bot answers product questions from your Airtable catalog
- **FAQ base** — Question/Answer table becomes direct training data
- **Employee directory** — "Who handles X?" answered from your team table
- **Event listings** — bot answers "what events do you have coming up?"
- **Case studies** — bot matches customers to relevant success stories
- **Support playbooks** — issue-resolution table trains your support bot
- **Roadmap** — features and upcoming releases for a product-expert bot

---

## Prerequisites

An Airtable account with at least one base. Create a free account at [airtable.com](https://www.airtable.com).

---

## Connecting Airtable

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the **Airtable** card
3. You'll be redirected to Airtable's authorization page
4. Select which bases to grant access to
5. Click **Grant access** — you'll be redirected back to your dashboard

---

## Configuring Per Assistant

1. Go to **Integrations → Airtable → Configure**
2. Select your **assistant**
3. Browse your bases and tables — select which tables to sync
4. Set **sync frequency**
5. Click **Save & Sync Now**

---

## How Record Extraction Works

AskYourSite reads each record's field names and values and converts them to natural language:

**Example Airtable Record:**

| Field | Value |
|-------|-------|
| Product Name | Enterprise Plan |
| Price | $149/mo |
| Max Chatbots | 10 |
| Support | Priority |

**Converted to:**

```
Product Name: Enterprise Plan. Price: $149/mo. Max Chatbots: 10. Support: Priority.
```

---

## Supported Field Types

| Field Type | Handling |
|------------|---------|
| Single line text | Used as-is |
| Long text | Included in full |
| Number | Converted to string |
| Checkbox | `true` / `false` |
| Select / Multi-select | Values joined with comma |
| Linked record | Record name extracted |
| Formula | Computed value used |
| Attachment | Skipped |

---

## Disconnecting

Go to **Integrations → Airtable → Disconnect**. This removes the connection and deactivates all Airtable sync configurations.

---

## Need Help?

Email **ravitej@askyoursite.in** if you have any trouble connecting Airtable.
