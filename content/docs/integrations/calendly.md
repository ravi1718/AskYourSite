---
title: "Calendly Integration"
description: "Let visitors book meetings directly through your AI assistant using Calendly."
---

# Calendly Integration

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

Connect Calendly so your assistant can offer meeting booking directly inside the chat widget. Visitors can browse available times and book without leaving your website.

## Use Cases

- Sales assistant books discovery calls automatically
- Support assistant schedules follow-up sessions
- Onboarding assistant books kickoff calls with new customers
- Recruitment bot lets candidates schedule interviews

---

## Prerequisites

You need a Calendly account. Create one free at [calendly.com](https://calendly.com).

---

## Setup Instructions

### Step 1 — Connect Calendly

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the Calendly card
3. You'll be redirected to Calendly's OAuth page
4. Click **Allow** to grant AskYourSite access
5. You'll be redirected back to your dashboard

### Step 2 — Configure Per Assistant

1. Go to **Integrations → Calendly → Configure**
2. Select the **assistant** to configure
3. Choose which **event type** to offer (e.g. "30-Minute Call")
4. Set a **trigger phrase** — the message the assistant detects to offer booking (e.g. "book a call", "schedule a demo")
5. Click **Save**

### Step 3 — Test the Flow

1. Open your assistant's **Playground**
2. Type your trigger phrase (e.g. "I'd like to book a demo")
3. The assistant should respond with a Calendly booking link or inline booking UI

---

## How It Works

When a visitor expresses intent to book a meeting (e.g. says "schedule a call", "book a demo", or "talk to someone"), the assistant detects the intent and presents your Calendly booking link inline.

The visitor selects a time, fills in their details, and books — all within the chat widget, without navigating away.

---

## Supported Event Types

You can connect multiple event types and assign each to a different assistant:

| Event Type | Typical Use |
|------------|-------------|
| 15-Minute Chat | Quick introductory calls |
| 30-Minute Demo | Product demonstrations |
| 60-Minute Strategy | In-depth consulting sessions |
| Custom | Any event from your Calendly account |

---

## Disconnecting Calendly

Go to **Integrations → Calendly → Disconnect**. This removes the OAuth connection. Assistants configured with Calendly will stop offering booking links immediately.
