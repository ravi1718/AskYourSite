---
title: "HubSpot Integration"
description: "Sync your HubSpot Knowledge Base and blog posts as live training content for your AI assistant."
---

# HubSpot Integration

Connect HubSpot and train your assistant on your Knowledge Base articles and blog posts. Every time you publish or update an article, your assistant picks it up on the next sync — no manual re-training needed.

> **Note:** Integrations are available on the **Pro** and **Business** plans. [Upgrade your plan](/docs/billing/plans) if you're on Starter.

## Use Cases

- **Support bot** — trained on your HubSpot Knowledge Base, answers customer questions 24/7
- **Content bot** — trained on your blog, helps visitors discover relevant articles
- **Sales bot** — trained on both KB and blog for a comprehensive product expert
- **Onboarding bot** — KB articles for product setup and guidance

---

## Prerequisites

A HubSpot account with Knowledge Base or Blog content. Create a free account at [hubspot.com](https://www.hubspot.com). Knowledge Base requires a HubSpot **Professional** plan or above.

---

## Connecting HubSpot

1. Go to **Dashboard → Integrations**
2. Click **Connect** on the **HubSpot** card
3. You'll be redirected to HubSpot's authorization page
4. Select your HubSpot account and click **Connect**
5. You'll be redirected back — HubSpot will show as **Connected**

> **Note:** You may see an "unverified app" warning from HubSpot during the authorization. This is expected — click **Connect app** to proceed. AskYourSite only reads your content, never modifies it.

---

## Configuring Per Assistant

1. Go to **Integrations → HubSpot → Configure**
2. Select your **assistant**
3. Choose which content sources to sync:
   - **Knowledge Base** — all published KB articles
   - **Blog Posts** — all published blog posts
4. Set **sync frequency**
5. Click **Save & Sync Now**

---

## Verifying It Works

1. After the sync completes, go to your assistant's **Playground**
2. Ask a question that's answered in your HubSpot Knowledge Base or Blog
3. The assistant should respond accurately from that content

---

## Sync Behavior

| Source | What Gets Synced |
|--------|-----------------|
| Knowledge Base | All published articles, titles, and body content |
| Blog Posts | All published posts, titles, and body text |
| **Not included** | Drafts, archived content, private pages |

---

## Disconnecting

Go to **Integrations → HubSpot → Disconnect**. This removes the connection and deactivates all HubSpot sync configurations.

---

## Need Help?

Email **ravitej@askyoursite.in** if you have trouble connecting your HubSpot account.
