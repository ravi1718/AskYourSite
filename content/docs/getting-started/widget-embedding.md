---
title: "Widget Embedding"
description: "Embed the AskYourSite chat widget on any website with one line of code."
---

# Widget Embedding

The AskYourSite widget is a lightweight, self-contained JavaScript snippet that adds a floating chat button to any website. It requires no framework, no build step, and no dependencies.

## Basic Embed Code

Paste this snippet before the closing `</body>` tag on every page where you want the widget to appear:

```html
<script
  data-agent-id="YOUR_AGENT_ID"
  src="https://askyoursite.in/public/embed.js"
  defer>
</script>
```

Find your `data-agent-id` in **Dashboard → Assistants → [Your Assistant] → Widget**.

---

## Platform-Specific Instructions

### WordPress

1. Go to **Appearance → Theme Editor** (or use a plugin like [Insert Headers and Footers](https://wordpress.org/plugins/insert-headers-and-footers/))
2. Paste the embed code before `</body>`
3. Save and preview your site

### Shopify

1. Go to **Online Store → Themes → Edit code**
2. Open `theme.liquid`
3. Paste the embed code just before `</body>`
4. Save

### Webflow

1. Go to **Project Settings → Custom Code**
2. Paste the embed code in the **Footer Code** section
3. Publish your site

### Wix

1. Go to **Settings → Custom Code**
2. Click **+ Add Custom Code**
3. Paste the embed code, set placement to **Body - end**
4. Apply to all pages and publish

### Next.js / React

Add the script to your root layout or `_document.js`:

```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <script
          data-agent-id="YOUR_AGENT_ID"
          src="https://askyoursite.in/public/embed.js"
          defer
        />
      </body>
    </html>
  );
}
```

---

## Widget Customization

You can customize the widget's appearance from your dashboard under **Assistants → [Your Assistant] → Widget Settings**:

| Setting | Description |
|---------|-------------|
| Primary Color | The main accent color for the chat bubble and buttons |
| Background Color | Chat window background |
| Welcome Message | The first message shown to new visitors |
| Assistant Logo | Upload your brand logo to replace the default icon |
| Font Family | Choose a font that matches your brand |

---

## Multiple Assistants, One Site

You can embed different assistants on different pages. For example:

- `/support` → support-focused assistant trained on your help docs
- `/pricing` → sales assistant trained on pricing and FAQs
- `/blog` → content assistant trained on your blog posts

Just use a different `data-agent-id` on each page.

---

## Widget Behavior

- **Position:** Fixed bottom-right, 24px from edges
- **Size:** 380×600px chat window, 60px launch button
- **Mobile:** Responsive, adapts to screen width
- **CORS:** Fully cross-domain, works on any domain
- **Rate limit:** 10 messages per minute per visitor IP

> **Note:** The widget loads asynchronously with `defer` — it will not affect your page's load time or Core Web Vitals.
