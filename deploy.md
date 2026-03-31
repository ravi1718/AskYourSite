# AskYourSite — Production Deployment Guide

This document covers every step to deploy AskYourSite to production on Vercel
with the custom domain `askyoursite.in`.

---

## 1. Environment Variables — What to Change

### Current `.env` → What Each Value Needs to Be in Production

| Variable | Current (dev) | Production value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wzoudmczoroecnzxomyu.supabase.co` | **Same** — do not change |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | existing key | **Same** — do not change |
| `SUPABASE_SERVICE_ROLE_KEY` | existing key | **Same** — do not change |
| `FIRECRAWL_API_KEY` | existing key | **Same** — do not change |
| `GEMINI_API_KEY` | existing key | **Same** — do not change |
| `NEXT_PUBLIC_APP_URL` | `https://unfierce-myah-misapprehendingly.ngrok-free.dev` | **`https://askyoursite.in`** |
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` | **`live_mode`** |
| `DODO_PAYMENTS_API_KEY` | test key | **Your Dodo Payments live API key** |
| `DODO_PAYMENTS_WEBHOOK_KEY` | test webhook secret | **Your Dodo Payments live webhook secret** |
| `DODO_PRODUCT_ID_STARTER` | test product ID | **Live product ID for Starter plan** |
| `DODO_PRODUCT_ID_PRO` | test product ID | **Live product ID for Pro plan** |
| `DODO_PRODUCT_ID_BUSINESS` | test product ID | **Live product ID for Business plan** |
| `DODO_PAYMENTS_RETURN_URL` | `https://yourdomain.com/checkout/success` | **`https://askyoursite.in/checkout/success`** |

> **Note:** Supabase URL, anon key, and service role key stay the same — they are tied to
> your Supabase project, not your deployment environment.

---

## 2. Dodo Payments — Switch to Live Mode

### Step 1: Get live API credentials
1. Log in to [Dodo Payments dashboard](https://app.dodopayments.com)
2. Switch from **Test** → **Live** mode (toggle in the top navigation)
3. Go to **Settings → API Keys** → copy the live API key → set as `DODO_PAYMENTS_API_KEY`

### Step 2: Create live products
1. In Dodo dashboard (Live mode), go to **Products**
2. Recreate the 3 subscription products:
   - **Starter** — $29/mo
   - **Pro** — $69/mo
   - **Business** — $149/mo
3. Copy each live product ID → set as `DODO_PRODUCT_ID_STARTER`, `DODO_PRODUCT_ID_PRO`, `DODO_PRODUCT_ID_BUSINESS`

### Step 3: Create live webhook
1. In Dodo dashboard (Live mode), go to **Webhooks → Add Webhook**
2. **Webhook URL** (replace the old ngrok URL):
   ```
   https://askyoursite.in/api/webhook/dodo-payments
   ```
   > Your old ngrok webhook (`https://unfierce-myah-misapprehendingly.ngrok-free.dev/api/webhook/dodo-payments`)
   > only worked while ngrok was running locally. Delete it from Dodo dashboard and replace with the above.
3. Select events: `subscription.active`, `subscription.renewed`, `subscription.plan_changed`,
   `subscription.cancelled`, `subscription.expired`, `subscription.failed`,
   `payment.succeeded`, `payment.failed`
4. Copy the webhook signing secret → set as `DODO_PAYMENTS_WEBHOOK_KEY`

### Step 4: Update return URL
Set `DODO_PAYMENTS_RETURN_URL=https://askyoursite.in/checkout/success`

---

## 3. Vercel Deployment

### Step 1: Push to GitHub
Make sure your project is in a GitHub (or GitLab/Bitbucket) repository.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/askyoursite-codex.git
git push -u origin main
```

### Step 2: Create Vercel project
1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Leave build settings as defaults (`next build`)
5. Click **Deploy** — let it do an initial deploy (it will fail on missing env vars, that's okay)

### Step 3: Add environment variables in Vercel
1. Go to your Vercel project → **Settings → Environment Variables**
2. Add **every variable** from the production column in Section 1 above
3. Set each variable to apply to: **Production, Preview, Development**
   (or Production only if you want preview/dev to use different values)

> **Critical:** Never commit `.env` to git. Add `.env` to `.gitignore` if not already there.

### Step 4: Redeploy
After adding all env vars, go to **Deployments** → click the latest deployment → **Redeploy**.

---

## 4. Custom Domain — Connect askyoursite.in

### In Vercel
1. Go to your project → **Settings → Domains**
2. Add `askyoursite.in` and `www.askyoursite.in`
3. Vercel will show you DNS records to add

### In your DNS provider (wherever askyoursite.in is registered)
Add the records Vercel gives you. Typically:
- `A` record: `@` → `76.76.21.21` (Vercel's IP)
- `CNAME` record: `www` → `cname.vercel-dns.com`

Wait for DNS propagation (5 min to 48 hours). Vercel will auto-provision SSL.

---

## 5. Supabase — Post-Deploy Configuration

### Step 1: Update Site URL
1. Go to [Supabase dashboard](https://supabase.com/dashboard) → your project
2. **Authentication → URL Configuration**
3. Set **Site URL** to: `https://askyoursite.in`

### Step 2: Add allowed redirect URLs
Still in **Authentication → URL Configuration → Redirect URLs**, add:
```
https://askyoursite.in/auth/callback
https://askyoursite.in/**
```
Keep `http://localhost:3000/**` for local development.

### Step 3: Confirm email template URLs
1. Go to **Authentication → Email Templates**
2. Check that confirmation/reset email links use your Site URL (they should auto-update)

---

## 6. Google OAuth — Add Production URLs

### Step 1: Update OAuth consent screen
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project → **APIs & Services → OAuth consent screen**
3. Under **Authorized domains**, add: `askyoursite.in`
4. Set **App name** to: `AskYourSite` (this shows in the consent screen)
5. Save

### Step 2: Update OAuth credentials
1. Go to **APIs & Services → Credentials → your OAuth 2.0 Client**
2. Under **Authorized JavaScript origins**, add:
   ```
   https://askyoursite.in
   ```
3. Under **Authorized redirect URIs**, confirm this is present (Supabase adds it):
   ```
   https://wzoudmczoroecnzxomyu.supabase.co/auth/v1/callback
   ```
   Do not remove it — this is how Supabase handles the OAuth callback.
4. Save

### Step 3: Fix "to continue to wzoudmczoroecnzxomyu.supabase.co"
The Google sign-in screen currently shows your Supabase project URL instead of `askyoursite.in`.
This happens because Google OAuth redirects through Supabase's auth server (`*.supabase.co`).

**To fix this (shows `askyoursite.in` in the consent screen):**

**Option A — Supabase Custom Domain (Recommended, requires Supabase Pro plan)**
1. Upgrade Supabase project to Pro
2. Go to **Project Settings → Custom Domain**
3. Set custom domain to: `auth.askyoursite.in`
4. Follow Supabase's DNS instructions (add CNAME: `auth` → your Supabase project ref)
5. Once active, update your Google OAuth redirect URI to:
   `https://auth.askyoursite.in/auth/v1/callback`
6. Update `NEXT_PUBLIC_SUPABASE_URL` in Vercel env vars to `https://auth.askyoursite.in`
7. Now Google will show "to continue to **askyoursite.in**"

**Option B — No cost workaround (cosmetic only)**
1. **APIs & Services → OAuth consent screen**
2. Set **App name** to `AskYourSite` — users will see "Sign in to AskYourSite"
3. This does NOT change the URL shown — just the app name.

> **Summary:** To fully remove `*.supabase.co` from the sign-in screen, Option A (custom domain)
> is required. Option B only improves the app name display, not the URL.

---

## 7. Storage Bucket — Verify Public URLs

Logo uploads are stored in Supabase Storage. After deployment:

1. Go to Supabase dashboard → **Storage**
2. Find the `logos` bucket (or whatever bucket is used for assistant logos)
3. Confirm it is set to **Public** (not private)
4. Test a logo upload after deployment to confirm the public URL resolves correctly

---

## 8. Post-Deployment Checklist

Run through these after your first successful deployment:

### Auth
- [ ] Visit `https://askyoursite.in` — redirects to login
- [ ] Click "Sign in with Google" — Google OAuth flow completes, lands on `/dashboard`
- [ ] Sign out — lands on `/login`

### Dashboard
- [ ] Dashboard loads with analytics data
- [ ] Sidebar navigation works (all links navigate correctly)
- [ ] Blue navigation progress bar appears when switching pages

### Assistants
- [ ] Create a new assistant — wizard completes, assistant appears in list
- [ ] Train assistant with a URL — crawl runs and training sources appear
- [ ] Chat in playground — assistant responds with streaming

### Billing
- [ ] Go to `/dashboard/billing` — plan cards load
- [ ] Click "Start free trial" on a plan — redirects to Dodo Payments checkout (live mode)
- [ ] Complete a test purchase with a real card — subscription activates
- [ ] Check Supabase `user_subscriptions` table — status shows `active`
- [ ] Webhook fires — check Vercel function logs for `[dodo-webhook]` entries

### Settings
- [ ] Go to `/dashboard/settings` — profile loads with Google avatar
- [ ] Update display name — saves without error

### Widget
- [ ] Copy embed code from an assistant's "Install on Website" tab
- [ ] Paste into an external HTML page — widget loads and chat works
- [ ] Confirm `Access-Control-Allow-Origin: *` is working (no CORS errors)

---

## 9. Environment Variable Summary for Vercel

Copy-paste ready list of all variables to add in Vercel dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://wzoudmczoroecnzxomyu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
SUPABASE_SERVICE_ROLE_KEY=<your service role key>
FIRECRAWL_API_KEY=<your firecrawl key>
GEMINI_API_KEY=<your gemini key>
NEXT_PUBLIC_APP_URL=https://askyoursite.in
DODO_PAYMENTS_ENVIRONMENT=live_mode
DODO_PAYMENTS_API_KEY=<your dodo live api key>
DODO_PAYMENTS_WEBHOOK_KEY=<your dodo live webhook secret>
DODO_PRODUCT_ID_STARTER=<live starter product id>
DODO_PRODUCT_ID_PRO=<live pro product id>
DODO_PRODUCT_ID_BUSINESS=<live business product id>
DODO_PAYMENTS_RETURN_URL=https://askyoursite.in/checkout/success
```

---

## 10. Things You DO NOT Need to Change

- **Supabase URL / anon key / service role key** — project-level keys, not environment-level
- **`next.config.ts`** — image remote patterns are fine as-is
- **CORS headers** — `/api/chat` and `/api/widget/[id]` already use `*` wildcard, correct for embeddable widgets
- **ngrok** — only needed for local development; do not run ngrok in production

---

## 11. Ongoing Maintenance

- **Webhook signature verification** is already implemented in the Dodo webhook handler — do not remove it
- **Rate limiting** (10 req/min per IP) is in `/api/chat` — monitor Vercel logs if users report throttling
- **Firecrawl** — each URL crawl consumes API credits; monitor your Firecrawl dashboard
- **Gemini API** — monitor usage and billing in Google Cloud Console
- **Supabase** — monitor database size and auth usage; free tier has row and storage limits
