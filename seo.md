# SEO & Analytics Guide — AskYourSite

Everything needed to get `askyoursite.in` indexed on Google, ranked for the right keywords, and fully instrumented with Google Analytics 4.

---

## Table of Contents

1. [Required Env Var](#1-required-env-var)
2. [Google Analytics 4 — Setup](#2-google-analytics-4--setup)
3. [Custom Event Reference](#3-custom-event-reference)
4. [Google Search Console — Setup](#4-google-search-console--setup)
5. [Submit Sitemap](#5-submit-sitemap)
6. [Request First Indexing](#6-request-first-indexing)
7. [Open Graph Preview Test](#7-open-graph-preview-test)
8. [OG Image](#8-og-image)
9. [Ongoing SEO Practices](#9-ongoing-seo-practices)
10. [Full Launch Checklist](#10-full-launch-checklist)

---

## 1. Required Env Var

Add this to your **Vercel dashboard** → Project → Settings → Environment Variables:

| Variable | Value | Environment |
|---|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Production, Preview |

Replace `G-XXXXXXXXXX` with your actual GA4 Measurement ID (step 2 below).

> **Note:** This variable is prefixed `NEXT_PUBLIC_` so it's available client-side. GA will not load unless this variable is set — no dummy data is sent in local dev unless you explicitly add it to `.env.local`.

---

## 2. Google Analytics 4 — Setup

### Step 1: Create a GA4 Property

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **Admin** (gear icon, bottom left)
3. In the **Account** column → **Create Account** (or use an existing one)
4. In the **Property** column → **Create Property**
5. Property name: `AskYourSite`
6. Reporting time zone: your timezone
7. Currency: INR (or USD)
8. Click **Next** → Business details → select **Other** + **Examine user behavior**
9. Click **Create**

### Step 2: Set Up a Web Data Stream

1. After creating the property, click **Web**
2. Enter URL: `https://askyoursite.in`
3. Stream name: `askyoursite.in`
4. Leave **Enhanced measurement** ON (tracks scrolls, outbound clicks, video, file downloads automatically)
5. Click **Create stream**

### Step 3: Get the Measurement ID

- You'll see **Measurement ID**: `G-XXXXXXXXXX`
- Copy it
- Add it to Vercel env vars as `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Step 4: Verify It's Working

1. Deploy to Vercel with the env var set
2. Open `https://askyoursite.in` in Chrome
3. In GA4 → **Reports** → **Realtime**
4. You should see **1 active user** and a `page_view` event within 30 seconds

### Step 5: Enable DebugView (for testing custom events)

1. Install **Google Analytics Debugger** Chrome extension
2. Enable it, then visit your site
3. In GA4 → **Admin** → **DebugView**
4. You'll see every event fire in real time — including `sign_up` and `chat_message_sent`

---

## 3. Custom Event Reference

These events are already implemented in the codebase:

| Event Name | Where It Fires | Parameters | What It Tracks |
|---|---|---|---|
| `page_view` | Automatic (GA4 built-in) | `page_location`, `page_title` | Every page visited |
| `sign_up` | `components/signup-tracker.tsx` — fires once after Google OAuth for new users | `method: "google"` | New user registrations |
| `chat_message_sent` | `components/chat-widget.tsx` — fires on each send | `widget: "site_widget"` | Chat interactions on the landing page |

### How to view these in GA4

- **GA4 → Reports → Engagement → Events** — see all events with counts
- **GA4 → Reports → Acquisition → User acquisition** — see where sign-ups come from
- Create a **Custom Report** or **Exploration** to build a funnel: `page_view` → `sign_up`

### Adding More Events Later

Use `sendGAEvent` from `@next/third-parties/google` in any client component:

```ts
import { sendGAEvent } from "@next/third-parties/google";

// Examples:
sendGAEvent("event", "upgrade_clicked", { plan: "pro" });
sendGAEvent("event", "assistant_created", {});
sendGAEvent("event", "knowledge_base_trained", {});
```

---

## 4. Google Search Console — Setup

Search Console tells Google your site exists and lets you monitor how it appears in search results.

### Step 1: Add Your Property

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Click **Add property**
3. Choose **Domain** (not URL prefix) — enter `askyoursite.in`
4. Google will ask you to verify ownership via DNS

### Step 2: Verify Domain Ownership (DNS TXT Record)

1. Google gives you a TXT record like: `google-site-verification=XXXXXXXXXXXX`
2. Go to your DNS provider (wherever you manage `askyoursite.in` — GoDaddy, Cloudflare, Namecheap, etc.)
3. Add a new DNS record:
   - **Type:** `TXT`
   - **Name/Host:** `@` (root domain)
   - **Value:** the full string Google gave you
4. Click **Verify** in Search Console
5. DNS propagation can take 5–30 minutes. If it fails, wait and retry.

### Step 3: Connect GA4 to Search Console (Optional but Recommended)

1. In GA4 → **Admin** → **Search Console Links**
2. Click **Link** → select your Search Console property
3. This lets you see search queries, impressions, and clicks directly in GA4

---

## 5. Submit Sitemap

After verifying ownership:

1. In Search Console → **Sitemaps** (left sidebar)
2. Enter `sitemap.xml` in the "Add a new sitemap" field
3. Click **Submit**

Your sitemap is auto-generated at `https://askyoursite.in/sitemap.xml` by `app/sitemap.ts` and includes:

```
https://askyoursite.in              (homepage, priority 1.0, weekly)
https://askyoursite.in/privacy      (priority 0.3, yearly)
https://askyoursite.in/terms        (priority 0.3, yearly)
```

**When to update `app/sitemap.ts`:** Add new public pages (blog posts, feature pages, etc.) as you create them. Never add dashboard or API routes.

---

## 6. Request First Indexing

Submitting the sitemap tells Google the pages exist. To speed up indexing of the homepage:

1. In Search Console → **URL Inspection**
2. Enter `https://askyoursite.in`
3. Click **Request Indexing**
4. Google typically crawls within a few hours to a few days

Check back in a week — the **Coverage** report will show indexed pages.

---

## 7. Open Graph Preview Test

Before sharing on social media, verify your OG tags render correctly:

| Tool | URL |
|---|---|
| Facebook / Meta Debugger | `https://developers.facebook.com/tools/debug/` |
| Twitter Card Validator | `https://cards-dev.twitter.com/validator` |
| LinkedIn Post Inspector | `https://www.linkedin.com/post-inspector/` |
| OpenGraph.xyz (general) | `https://www.opengraph.xyz/` |

Enter `https://askyoursite.in` in each tool. You should see:
- **Title:** AskYourSite — AI Sales & Support Agent for Your Website
- **Description:** Turn any website into an AI-powered sales and support agent...
- **Image:** the OG image (see next section)

---

## 8. OG Image

The metadata in `app/layout.tsx` references `/og-image.png` (1200×630px). This file **does not exist yet** — until you add it, social previews will show no image.

### Create an OG Image

Option A — **Canva / Figma:** Design a 1200×630px image with:
- AskYourSite logo + name
- Tagline: "Turn any website into an AI sales & support agent"
- Dark background matching the app theme
- Export as PNG → save to `public/og-image.png`

Option B — **Next.js dynamic OG image** using `next/og` (more advanced):
- Create `app/opengraph-image.tsx` using the `ImageResponse` API
- Next.js generates it automatically from JSX

Once `public/og-image.png` exists, retest with the tools in section 7.

---

## 9. Ongoing SEO Practices

### Keywords to Target

Primary:
- `AI chatbot for website`
- `website AI agent`
- `AI sales agent for website`
- `embed AI chatbot`
- `AI customer support chatbot`

Long-tail (easier to rank, higher intent):
- `AI chatbot for SaaS website`
- `embed AI assistant on website without coding`
- `turn website into AI chatbot`

### Content / Blog

Google rewards fresh, relevant content. Ideas for blog posts:
- "How to add an AI chatbot to your website in 5 minutes"
- "AI sales agents vs live chat: which converts better?"
- "How [e-commerce / SaaS / agency] businesses use AI to answer customer questions"

These pages should be added to `app/sitemap.ts` when published.

### Backlinks

A few ways to build early backlinks:
- Submit to Product Hunt, Hacker News (Show HN), IndieHackers
- Guest posts on SaaS / no-code blogs
- Get listed in "AI Tools" directories (There's an AI, Future Tools, Futurepedia)

### Core Web Vitals

Google uses page speed as a ranking signal. Monitor via:
- [PageSpeed Insights](https://pagespeed.web.dev/) — enter `https://askyoursite.in`
- **Search Console → Core Web Vitals** (data appears after ~4 weeks of traffic)

Target: LCP < 2.5s, CLS < 0.1, INP < 200ms.

### Keep Sitemap Updated

Every time you add a public-facing page, add it to `app/sitemap.ts`:

```ts
{ url: `${base}/blog/my-new-post`, lastModified: new Date("2026-04-15"), changeFrequency: "monthly", priority: 0.7 },
```

---

## 10. Full Launch Checklist

Complete these in order:

### Env Vars (Vercel Dashboard)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` set to `G-XXXXXXXXXX`
- [ ] `NEXT_PUBLIC_APP_URL` set to `https://askyoursite.in`

### Google Analytics
- [ ] GA4 property created at analytics.google.com
- [ ] Web data stream created for `askyoursite.in`
- [ ] Measurement ID copied and set in Vercel
- [ ] Deployed and verified: `page_view` appears in GA4 Realtime
- [ ] DebugView confirms `sign_up` event fires when creating a new account
- [ ] DebugView confirms `chat_message_sent` fires when using the landing page widget

### Search Console
- [ ] Property added for `askyoursite.in` (Domain type)
- [ ] DNS TXT record added for verification
- [ ] Verification successful
- [ ] GA4 linked to Search Console
- [ ] Sitemap submitted: `sitemap.xml`
- [ ] Homepage URL inspected and indexing requested

### On-Page SEO
- [ ] `public/og-image.png` created (1200×630px)
- [ ] OG preview tested on opengraph.xyz — title, description, image all correct
- [ ] `/sitemap.xml` loads and shows all public pages
- [ ] `/robots.txt` loads and shows `Disallow: /dashboard/`

### Verify Widget
- [ ] Embed script on portfolio/test site loads without CORS errors
- [ ] Chat widget responds correctly from external domain
- [ ] Embed snippet in dashboard shows `https://askyoursite.in/embed.js` (not localhost)
