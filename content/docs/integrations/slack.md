---
title: "Slack Integration"
description: "Get real-time alerts in Slack when your assistant can't answer a question or captures a lead."
---

# Slack Integration

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

Get instant Slack notifications when your AI assistant encounters unanswered questions or captures a new lead. Stay on top of what your customers are asking — right in your team's Slack workspace.

## What You'll Get

- **Unanswered question alerts** — know immediately when a visitor asks something your bot couldn't answer
- **Lead capture notifications** — see name and email of every captured lead in real time
- **Formatted messages** — rich Slack blocks with context (assistant name, question text, timestamp)

---

## Prerequisites

You need a Slack workspace. Create one free at [slack.com](https://slack.com).

---

## Setup Instructions

### Step 1 — Connect Slack

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the Slack card
3. You'll be redirected to Slack's OAuth page
4. Select your workspace and click **Allow**
5. You'll be redirected back to AskYourSite

### Step 2 — Configure Alerts Per Assistant

1. Go to **Integrations → Slack → Configure**
2. Select which **assistant** to configure
3. Choose the **Slack channel** to send alerts to (e.g. `#support-alerts`)
4. Choose which events to notify on:
   - Unanswered questions
   - Lead captures
5. Click **Save**

> **Tip:** Create a dedicated `#ays-alerts` channel in Slack to keep bot notifications separate from regular team chat.

---

## Example Alert Messages

**Unanswered Question:**
```
🤖 AskYourSite — Unanswered Question
Assistant: Sales Bot
Question: "Do you integrate with Salesforce?"
Time: Apr 6, 2026 at 10:30 AM
```

**Lead Captured:**
```
✅ AskYourSite — New Lead
Assistant: Support Bot
Name: Jane Smith
Email: jane@example.com
Time: Apr 6, 2026 at 10:31 AM
```

---

## Multiple Assistants, Multiple Channels

You can route alerts from different assistants to different Slack channels:

| Assistant | Channel |
|-----------|---------|
| Sales Bot | `#sales-leads` |
| Support Bot | `#support-alerts` |
| Onboarding Bot | `#customer-success` |

Configure each assistant separately under **Integrations → Slack → Configure**.

---

## Disconnecting Slack

Go to **Integrations → Slack → Disconnect**. This removes the OAuth connection and stops all Slack notifications. You can reconnect at any time.
