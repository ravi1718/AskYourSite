---
title: "Zapier Integration"
description: "Connect AskYourSite to 6,000+ apps via Zapier automation."
---

# Zapier Integration

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

Connect AskYourSite to over **6,000 apps** using Zapier. Automatically send unanswered questions, captured leads, and conversation events to your CRM, email platform, spreadsheets, and more — without writing any code.

## What You Can Automate

| Trigger Event | Example Automation |
|---------------|-------------------|
| Unanswered question detected | Create a Zendesk ticket |
| Lead captured via chat | Add contact to HubSpot CRM |
| Lead captured | Send welcome email via Mailchimp |
| Unanswered question | Notify team in Slack |
| Lead captured | Add row to Google Sheets |

---

## Setup Instructions

### Step 1 — Connect Zapier

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the Zapier card
3. Copy your **Zapier Webhook URL** shown after connecting

### Step 2 — Create a Zap in Zapier

1. Log in to [Zapier](https://zapier.com) (create a free account if you don't have one)
2. Click **+ Create Zap**
3. For the **Trigger**, search for **Webhooks by Zapier**
4. Choose **Catch Hook**
5. Paste your AskYourSite webhook URL into Zapier
6. Click **Test trigger** — AskYourSite will send a sample payload

### Step 3 — Configure Your Action

Choose what happens when the trigger fires. Common examples:

**Send to Google Sheets:**
1. Action app: **Google Sheets**
2. Action: **Create Spreadsheet Row**
3. Map: `question` → Column A, `timestamp` → Column B

**Create HubSpot Contact:**
1. Action app: **HubSpot**
2. Action: **Create Contact**
3. Map: `email` → Email, `name` → First Name

**Send Slack Notification:**
1. Action app: **Slack**
2. Action: **Send Channel Message**
3. Message: `New unanswered question: {{question}}`

### Step 4 — Test and Activate

Click **Test** in Zapier to verify the data flows correctly. Then click **Publish** to activate your Zap.

---

## Event Payload Format

AskYourSite sends a JSON payload to your Zapier webhook for each event:

```json
{
  "event": "unanswered_question",
  "question": "Do you offer enterprise pricing?",
  "assistant_id": "asst_abc123",
  "assistant_name": "Sales Bot",
  "session_id": "sess_xyz789",
  "timestamp": "2026-04-06T10:30:00Z"
}
```

For lead capture events:

```json
{
  "event": "lead_captured",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "assistant_id": "asst_abc123",
  "assistant_name": "Sales Bot",
  "timestamp": "2026-04-06T10:31:00Z"
}
```

---

## Disconnecting Zapier

Go to **Integrations → Zapier → Disconnect**. This deactivates the webhook. Your existing Zaps will stop receiving events but won't be deleted in Zapier.
