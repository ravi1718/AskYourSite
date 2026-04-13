# AskYourSite — Business Setup Guide

> **How to read this guide:**
> The setup flow is the same for every business: **Create → Train → Design → Automate → Install**.
> Find your industry section, follow the numbered steps, and every step maps to a specific tab inside your assistant dashboard. No technical knowledge required.

---

## Feature Glossary

| Feature | What It Does |
|---|---|
| **Agent Mode** | Turns your chat widget into a goal-driven agent that classifies visitor intent and takes action automatically |
| **Agent Instructions** | A single plain-English description of how your agent should behave and what it should achieve |
| **Webhooks** | POST notifications sent to your CRM, Zapier, or any endpoint when the agent detects an intent |
| **Workflows** | Multi-step automation chains (email → wait → webhook) triggered after a webhook fires |
| **Proactive Triggers** | Auto-open the chat with a custom message based on visitor behavior |
| **Integrations** | Connect Notion, Google Docs, HubSpot, Airtable, and more as auto-updating training sources |
| **Visitor Memory** | The agent remembers returning visitors — their name, email, past questions, and last action |
| **Sentiment Detection** | Automatically detects visitor frustration and adjusts the agent's tone or escalates to a human |
| **Response Rules** | Pin exact answers to specific questions so the AI never hallucinates on critical topics |
| **Lead Capture** | Ask visitors for their name and email before the chat starts |

---

## Industries Covered

1. [E-Commerce (Physical Products)](#1-e-commerce-physical-products)
2. [SaaS / Software Product](#2-saas--software-product)
3. [EdTech / Online Courses](#3-edtech--online-courses)
4. [Service Sales (Agencies, Consultants, Freelancers)](#4-service-sales-agencies-consultants-freelancers)
5. [Real Estate](#5-real-estate)
6. [Healthcare / Medical Practice](#6-healthcare--medical-practice)
7. [Restaurant / Food & Beverage](#7-restaurant--food--beverage)
8. [B2B Lead Generation / Sales](#8-b2b-lead-generation--sales)
9. [HR & Recruitment](#9-hr--recruitment)
10. [Professional Services (Law, Finance, Accounting)](#10-professional-services-law-finance-accounting)

---

---

## 1. E-Commerce (Physical Products)

**Revenue goal:** Recover abandoned carts, upsell products, capture leads for re-engagement, and reduce "where is my order?" support volume.

**Example:** *StyleNest* — an online clothing store selling mid-range fashion. The agent proactively engages shoppers on the cart page, recommends similar items, and sends a recovery email if they leave without buying.

---

### Step 1 — Create Your Assistant (Dashboard → New Assistant)

- **Name:** `StyleNest Shopping Assistant`
- **Website URL:** Your full store URL (e.g., `https://yourstorename.com`)
- **Business description to paste:**
  > We are an online clothing store selling [men's/women's/unisex] fashion. Our agent should help visitors find the right products, answer questions about sizing, shipping, and returns, capture their email for follow-up, and recover abandoned carts by offering a discount when they try to leave.

---

### Step 2 — Train Your Agent (Train Tab)

1. **Crawl first:** Click "Crawl & Train" with your store URL. This pulls in product pages, collection pages, and the homepage.
2. **Paste these as plain text** (use "Plain Text Data" section):
   - Full return and refund policy
   - Shipping times and carriers by region
   - Size guide (or a text version)
   - Any active discount codes and their eligibility rules
3. **Connect integrations (Integrations page):**
   - **Google Sheets** — paste your product catalog (name, SKU, price, URL) for the agent to reference during recommendations
   - **Airtable** — if you track inventory or variants in Airtable, connect it so the agent knows what's in stock
   - **Zapier** — connect to Klaviyo or Mailchimp for email marketing automation

---

### Step 3 — Design Tab

- **Tone:** Friendly
- **Colors:** Match your brand's primary color
- **Lead Capture:** Enable. Set the message to: *"Before we start — drop your email and we'll send you 10% off your first order."*
- **Exit Capture:** Enable. Message: *"Wait — your cart is still here! Can I help you find your size or apply a discount?"*
- **Notification Bubbles:** Enable. Message 1: *"New arrivals just dropped 🛍"*. Message 2: *"Free shipping on orders over $X."* Delay: 4 seconds.

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a friendly shopping assistant for [Store Name]. Your primary goal is to help visitors find products they love, answer questions about sizing, shipping, and returns, and recover abandoned carts.

When a visitor mentions a product type or describes what they're looking for, recommend 2–3 relevant items from our catalog and share the direct product URL. When a visitor asks about their order, ask for their order number and direct them to our tracking page. When a visitor is about to leave with items in their cart, offer a discount code.

Always be enthusiastic and concise. Never make up product details — only reference products you have been trained on. If a visitor is frustrated, immediately apologize and escalate to a human agent.
```

#### Webhooks to Create (Automate Tab → scroll to Webhooks)

| Action | Endpoint | When the Agent Fires It | Revenue Impact |
|---|---|---|---|
| `capture_lead` | Your Zapier webhook URL → Klaviyo/Mailchimp | Visitor shares their email | Added to email nurture sequence |
| `recommend_product` | Your Zapier webhook URL | Visitor asks for a recommendation | Drives product page traffic |
| `trigger_discount` | Your Zapier webhook URL | Visitor on cart/checkout tries to leave | Discount email or popup triggered |

#### Proactive Triggers (Automate Tab → Proactive Triggers section)

| Trigger | Type | Setting | URL Pattern | Message |
|---|---|---|---|---|
| Cart page exit intent | Exit Intent | — | `/cart` | *"Wait — your cart has items! Want a 10% discount code before you go?"* |
| Checkout exit intent | Exit Intent | — | `/checkout` | *"Almost done! Can I help you complete your order or answer any questions?"* |
| Return shopper | Return Visit | 2nd+ visit | (all pages) | *"Welcome back! Looking for something specific? I can help you find it."* |

Cooldown: 12 hours for all triggers.

#### Workflows to Create (Automate Tab → Workflows section → New Workflow)

**Workflow 1: Abandoned Cart Recovery**
Use the "Lead Welcome Email" template. Modify it:
- Trigger: `capture_lead`
- Step 1: Wait — 60 minutes
- Step 2: Email — To: `{{email}}`, Subject: `You left something behind, {{name}}`, Body: *"Hi {{name}}, you had items in your cart at [Store Name]. Here's 10% off to complete your order: [CODE]. Your cart is saved — [link to cart]."*

**Workflow 2: New Lead Alert**
Use the "New Lead Alert" template as-is. Point the webhook at your Slack or your Zapier → CRM pipeline.

---

### Step 5 — Integrations Page

Priority order:
1. **Zapier** — connects the agent to your email marketing tool (Klaviyo, Mailchimp)
2. **Google Sheets** — product catalog as training data
3. **Airtable** — inventory and variant data

---

### Step 6 — Response Rules Tab

Pin exact answers for these phrases:
- *"return policy"* → paste your full return policy text
- *"shipping time"* → paste your shipping table by region
- *"discount code"* → paste your active promo codes
- *"size guide"* → paste your size chart or link to it

---

### Step 7 — Install Tab

Select your platform (Shopify, Vanilla JS, etc.) and follow the instructions. Install on **all pages** — the agent must be present on product pages, the cart, and checkout.

---

### Expected Outcomes

- **Week 1:** 20–40 leads captured per 1,000 visitors. Exit intent trigger fires on cart page and reduces visible bounce.
- **Week 4:** Abandoned cart recovery emails achieve 15–25% open rate. First re-engaged purchases appear.
- **Month 3:** Agent handles 60%+ of "where is my order?" questions without human intervention. Average order value increases as product recommendations drive upsells.

---
---

## 2. SaaS / Software Product

**Revenue goal:** Convert free trial users to paid subscribers, qualify enterprise inbound leads for the sales team, and reduce churn by answering product questions instantly.

**Example:** *FlowDesk* — a project management SaaS for remote teams. The agent qualifies inbound visitors by use case, books product demos, and instantly alerts the sales team when a high-value signal appears.

---

### Step 1 — Create Your Assistant

- **Name:** `FlowDesk Product Assistant`
- **Business description:**
  > We are a SaaS company offering [product category] software. Our agent should help visitors understand which plan is right for them, answer technical and pricing questions, book product demos for qualified leads, and capture contact information for follow-up.

---

### Step 2 — Train Tab

1. **Crawl** your marketing site first.
2. **Connect integrations:**
   - **HubSpot** — syncs your blog and knowledge base articles
   - **Notion** — connect your internal product documentation or help center
3. **Paste as plain text:**
   - Pricing table (all plans, features per tier, billing cycles)
   - Feature comparison table vs. top 2 competitors
   - Data security/compliance statement (SOC2, GDPR, etc.)
   - Trial limitations (what's included, what's restricted)

---

### Step 3 — Design Tab

- **Tone:** Helpful
- **Lead Capture:** Enable only on the pricing page if possible; otherwise enable globally. *"Start a conversation — no account needed."*
- **Exit Capture on `/pricing`:** *"Comparing options? I can walk you through the plan differences in 2 minutes."*
- **Notification Bubbles:** Message 1: *"Questions about pricing? Ask me."* Delay: 8 seconds.

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a knowledgeable product assistant for [Company]. Your goal is to help visitors understand our software, identify the right plan for their needs, and book a product demo for teams larger than 5 people or with enterprise requirements.

When a visitor mentions company size, team structure, or specific use cases, classify their need and recommend the appropriate plan. When you detect high purchase intent (asking about pricing, integrations, or security), offer to book a demo immediately.

Never guess at features we don't have. If a visitor asks about a feature not in your training data, say you'll have a specialist confirm and offer to book a call. If a visitor expresses frustration with their current tool, empathize and highlight our key differentiators.
```

#### Webhooks

| Action | Endpoint | When Fired | Revenue Impact |
|---|---|---|---|
| `capture_lead` | Zapier → HubSpot/CRM | Visitor shares email | Lead enters CRM nurture |
| `book_demo` | Calendly webhook | Visitor agrees to demo | Sales qualified meeting created |
| `assign_human_agent` | Slack webhook or Zapier | Enterprise signals detected | Sales rep gets instant alert |

#### Proactive Triggers

| Trigger | Type | Setting | URL | Message |
|---|---|---|---|---|
| Pricing page return | Return Visit | 2nd visit | `/pricing` | *"Welcome back — comparing plans? I can walk you through the differences."* |
| Long session on features | Time on Page | 60 seconds | `/features` | *"Have questions about a specific feature? Ask me anything."* |
| Exit on pricing | Exit Intent | — | `/pricing` | *"Before you go — can I answer any questions about pricing or book a quick 15-min demo?"* |

#### Workflows

**Workflow: Demo Booking Confirmation** — Use the built-in "Demo Booking Confirmation" template. Modify the email body to include: meeting link, what to prepare, and a link to your feature overview page.

**Workflow: Sales Team Alert** — Use the "Human Handoff Alert" template. Point the webhook to a Slack channel or your CRM's inbound API.

---

### Step 5 — Integrations

1. **Calendly** — book demos directly inside the chat
2. **HubSpot** — sync knowledge base + receive leads in CRM
3. **Notion** — product documentation as training data
4. **Zapier** — connect to your email sequences (Intercom, Customer.io)

---

### Step 6 — Response Rules

Pin answers for: *"how much does it cost"*, *"is there a free plan"*, *"what integrations do you support"*, *"is my data secure"*, *"how do I cancel"*

---

### Step 7 — Install

Install on all pages. The agent is most valuable on `/pricing`, `/features`, and `/blog` posts (where intent is high).

---

### Expected Outcomes

- **Week 1:** Pricing page exit rate drops. Demo bookings begin coming in via the agent.
- **Week 4:** Agent handles 70% of "what's included in the trial" questions. Sales team gets pre-qualified leads with conversation context.
- **Month 3:** Demo-to-close rate improves because leads are better qualified. Support ticket volume for basic product questions drops significantly.

---
---

## 3. EdTech / Online Courses

**Revenue goal:** Convert course browsers into enrolled students, answer pre-enrollment questions instantly, and capture leads for promotional campaigns.

**Example:** *LearnForge* — an online platform offering coding bootcamps and design courses. The agent answers curriculum questions, handles objections about time commitment, and captures leads for enrollment campaigns.

---

### Step 1 — Create Your Assistant

- **Name:** `LearnForge Enrollment Advisor`
- **Business description:**
  > We offer online [subject] courses for [audience]. Our agent should answer questions about course curriculum, prerequisites, duration, and pricing, capture student emails for follow-up, and help visitors choose the right course for their goals.

---

### Step 2 — Train Tab

1. **Crawl** all course landing pages and the homepage.
2. **Integrations:** Connect **Notion** (curriculum outlines) and **Google Docs** (course syllabi, instructor bios).
3. **Paste as plain text:**
   - Course list with duration, price, and skill level
   - Refund and satisfaction guarantee policy
   - Certificate details (what's awarded, if accredited)
   - Payment plan options
   - Student testimonials (paraphrased)

---

### Step 3 — Design Tab

- **Tone:** Friendly
- **Lead Capture:** Enable. *"Get a free course guide — drop your email and we'll send it over."*
- **Exit Capture:** *"Not sure yet? Let me send you a free sample lesson — what's your email?"*
- **Notification Bubbles:** Message 1: *"Enrollment closes soon for [Course]."* Delay: 4 seconds.

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are an enrollment advisor for [Platform]. Your goal is to help visitors choose the right course and move them toward enrollment.

When a visitor describes their skill level or goal, recommend the most suitable course with a direct enrollment link. When a visitor raises objections (time commitment, cost, "I'm not technical enough"), address them directly with specific reassurances. When a visitor shares their email, confirm receipt and tell them what to expect.

Always be encouraging and specific. Never oversell — if a course isn't the right fit, say so and suggest a better option. If a visitor is hesitant, offer to connect them with a past student story or a free trial lesson.
```

#### Webhooks

| Action | Endpoint | When Fired | Revenue Impact |
|---|---|---|---|
| `capture_lead` | Zapier → email marketing | Visitor shares email | Added to enrollment drip sequence |
| `book_demo` | Calendly | Visitor wants a free consultation | 1:1 enrollment call booked |

#### Proactive Triggers

| Trigger | Type | Setting | URL | Message |
|---|---|---|---|---|
| Course page engagement | Time on Page | 45 seconds | `/courses/*` | *"Curious about this course? I can tell you exactly what you'll learn and how long it takes."* |
| Exit from course page | Exit Intent | — | `/courses/*` | *"Not sure yet? Let me send you a free sample lesson — no commitment needed."* |
| Return visitor | Return Visit | 2nd visit | (all pages) | *"Welcome back! Still researching? I can answer any questions or help you enroll."* |

#### Workflows

**Workflow: Lead Welcome Email** — Use the built-in template. Modify the email:
- Subject: *"Your free course guide from [Platform], {{name}}"*
- Body: course overview, enrollment link, deadline reminder, testimonial quote.

---

### Step 5 — Integrations

1. **Notion** — curriculum documents
2. **Google Docs** — syllabus and instructor materials
3. **Zapier** → email marketing platform (ConvertKit, Mailchimp)
4. **Calendly** — free consultation sessions

---

### Step 6 — Response Rules

Pin answers for: *"how long is the course"*, *"do I get a certificate"*, *"is there a refund"*, *"what are the prerequisites"*, *"do you have payment plans"*

---

### Expected Outcomes

- **Week 1:** Lead capture rate increases. Exit intent on course pages catches undecided visitors.
- **Week 4:** Drip email sequence from captured leads generates first re-engagement enrollments.
- **Month 3:** Agent answers 80% of pre-enrollment questions without human involvement. Enrollment team focuses on high-intent 1:1 calls only.

---
---

## 4. Service Sales (Agencies, Consultants, Freelancers)

**Revenue goal:** Book discovery calls with qualified prospects, pre-qualify budget and project scope, and reduce time spent answering repetitive "what do you do" questions.

**Example:** *Apex Creative* — a branding and web design agency. The agent qualifies visitors by project type and budget, then books a free 30-minute discovery call directly in the chat.

---

### Step 1 — Create Your Assistant

- **Name:** `Apex Creative Project Advisor`
- **Business description:**
  > We are a [service type] agency/consultancy. Our agent should help visitors understand our services, qualify their project needs and budget, and book a free discovery call for qualified leads.

---

### Step 2 — Train Tab

1. **Crawl** your portfolio/services website.
2. **Integrations:** Connect **Notion** (case studies, process documentation) and **HubSpot** (blog posts about your expertise).
3. **Paste as plain text:**
   - Service packages with indicative pricing ranges
   - Typical project timelines
   - Past client industries and project types (anonymized)
   - Process overview (discovery → strategy → delivery → handoff)
   - FAQ (minimum budget, revision rounds, ownership of deliverables)

---

### Step 3 — Design Tab

- **Tone:** Professional
- **Lead Capture:** Disable (let conversation start freely — capturing email mid-conversation is more natural for agencies).
- **Exit Capture:** Enable. *"Before you go — what kind of project do you have in mind? Takes 30 seconds to tell me."*
- **Notification Bubbles:** Message 1: *"Free discovery call — 30 minutes, no obligation."* Delay: 8 seconds.

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a project advisor for [Agency Name]. Your goal is to understand what visitors are trying to build, qualify whether we're a good fit, and book a free 30-minute discovery call.

Start by asking about their project type and timeline. If they describe a project that fits our services and their timeline is within 3 months, offer to book a discovery call immediately using our Calendly link.

Always be direct and confident — our clients respect expertise. If a visitor mentions a budget significantly below our minimum, be honest that we may not be the right fit but suggest what we can offer. Never promise specific prices in chat — always frame them as "starting from" and direct them to a call for accurate scoping.
```

#### Webhooks

| Action | Endpoint | When Fired | Revenue Impact |
|---|---|---|---|
| `capture_lead` | Zapier → CRM or spreadsheet | Visitor shares contact details | Lead logged for follow-up |
| `book_demo` | Calendly webhook + Zapier → CRM | Visitor books discovery call | Qualified opportunity created |

#### Proactive Triggers

| Trigger | Type | Setting | URL | Message |
|---|---|---|---|---|
| Portfolio page browse | Time on Page | 30 seconds | `/work` or `/portfolio` | *"Like what you see? I can tell you how we approached any of these projects."* |
| Services exit intent | Exit Intent | — | `/services` | *"Before you go — what kind of project do you have in mind? I can check our availability."* |
| Return visitor | Return Visit | 2nd visit | (all) | *"Good to see you again. Ready to talk about your project?"* |

#### Workflows

**Workflow: Discovery Call Booked** — Use the "Demo Booking Confirmation" template:
- Email subject: *"Your discovery call with [Agency] is confirmed, {{name}}"*
- Body: meeting link, what to prepare (brief description of project, reference examples you love), what to expect in the call.

**Workflow: Team Alert** — Use the "Human Handoff Alert" template. POST to a Slack channel or email your team when a call is booked.

---

### Step 5 — Integrations

1. **Calendly** — discovery call booking inside chat
2. **Notion** — case studies and process documents as training data
3. **HubSpot** — blog content for expertise signals

---

### Step 6 — Response Rules

Pin answers for: *"what's your pricing"*, *"how long does a project take"*, *"who will I work with"*, *"do you do [specific service]"*, *"what's your minimum budget"*

---

### Expected Outcomes

- **Week 1:** Discovery calls begin booking via the agent. Exit intent catches visitors who were about to leave without contacting you.
- **Week 4:** Pre-qualified leads arrive to calls already knowing your process and approximate pricing — shorter sales cycles.
- **Month 3:** Agent handles all top-of-funnel qualification. Your team only engages with leads who are ready to scope a project.

---
---

## 5. Real Estate

**Revenue goal:** Capture buyer and seller leads, qualify intent and budget, and book property viewings or consultation calls.

**Example:** *Meridian Realty* — a residential real estate agency. The agent engages visitors browsing listings, answers property questions, and books viewings directly.

---

### Step 1 — Create Your Assistant

- **Name:** `Meridian Property Advisor`
- **Business description:**
  > We are a real estate agency specializing in [area/type]. Our agent should help buyers find properties matching their criteria, answer questions about listings, and book property viewings or seller consultations.

---

### Step 2 — Train Tab

1. **Crawl** your listings site.
2. **Integrations:** Connect **Google Sheets** with your current property listings (address, price, beds, baths, sqft, status).
3. **Paste as plain text:** Neighborhood guides, school district info, financing FAQ, buying/selling process overview.

---

### Step 3 — Design Tab

- **Tone:** Professional
- **Lead Capture:** Enable. *"Tell us what you're looking for and we'll match you with the right properties."*
- **Exit Capture:** *"Before you go — would you like us to alert you when a property matching your criteria hits the market?"*
- **Notification Bubbles:** Message 1: *"New listing just added — 3 bed, 2 bath in [neighborhood]."*

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a property advisor for [Agency]. Help buyers find homes that match their needs and budget, and help sellers understand their property's market value.

When a visitor describes what they're looking for (bedrooms, budget, neighborhood), reference our listings and suggest 2–3 matches with key details. Always offer to book a viewing for properties they express interest in.

When a visitor mentions selling, offer a free valuation consultation. Never quote exact valuations in chat — always direct them to a call with one of our agents. If a visitor is frustrated with previous agents or the market, empathize and focus on how we do things differently.
```

#### Webhooks

| Action | Endpoint | When Fired |
|---|---|---|
| `capture_lead` | Zapier → your CRM | Visitor shares contact details |
| `book_demo` | Calendly webhook | Viewing or consultation booked |

#### Proactive Triggers

| Trigger | Type | Setting | URL | Message |
|---|---|---|---|---|
| Listing page browse | Time on Page | 60 seconds | `/listings/*` | *"Interested in this property? I can arrange a viewing or answer any questions."* |
| Exit from listings | Exit Intent | — | `/listings` | *"Before you go — want us to notify you when similar properties come on the market?"* |

#### Workflows

**Workflow: Viewing Booked** — Confirmation email to buyer with property address, viewing time, agent name, and what to bring. Webhook alert to the listing agent.

---

### Step 5 — Integrations

1. **Calendly** — viewing and consultation bookings
2. **Google Sheets** — live property listings as training data
3. **Zapier** → your real estate CRM (Follow Up Boss, Salesforce, etc.)

---

### Step 6 — Response Rules

Pin answers for: *"what's the price"*, *"how many bedrooms"*, *"is it still available"*, *"what's the HOA fee"*, *"what school district"*

---

### Expected Outcomes

- **Week 1:** Viewing bookings begin. Lead capture on listing pages starts building your database.
- **Week 4:** Return visitor trigger converts researchers into action-takers.
- **Month 3:** Agent qualifies buyer intent before they reach your agents — your team spends time on serious buyers only.

---
---

## 6. Healthcare / Medical Practice

**Revenue goal:** Book new patient appointments, reduce front-desk call volume by answering common questions, and capture leads for elective or cosmetic services.

> **Important:** Configure your agent instructions to never provide medical advice. The agent's role is to inform and route — not diagnose.

---

### Step 1 — Create Your Assistant

- **Name:** `[Practice Name] Patient Support`
- **Business description:**
  > We are a [specialty] medical practice. Our agent should help patients understand our services, answer questions about insurance and appointments, and help new patients book their first visit. The agent must never provide medical advice.

---

### Step 2 — Train Tab

1. **Crawl** your practice website.
2. **Google Docs:** Upload your patient FAQ (accepted insurance, what to bring, parking, after-hours policy).
3. **Paste as plain text:** Services offered, doctor bios (brief), hours of operation by location, cancellation policy.

---

### Step 3 — Design Tab

- **Tone:** Professional and Helpful
- **Lead Capture:** Enable for new patients. *"New patient? Share your name and email and we'll send you our intake forms."*
- **Exit Capture:** *"Have a question about an appointment or our services? I can help quickly."*

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a patient support assistant for [Practice Name]. Help visitors understand our services, answer questions about appointments, insurance, and our doctors, and guide new patients through booking their first visit.

IMPORTANT: Never provide medical advice, diagnoses, or treatment recommendations. If a visitor describes symptoms, always say: "For medical questions, please consult with one of our doctors — I can help you book an appointment right now."

When a new patient wants to book, direct them to our booking link or offer to capture their details for our team to call back within 24 hours.
```

#### Webhooks

| Action | Endpoint | When Fired |
|---|---|---|
| `capture_lead` | Zapier → practice management system | New patient shares contact info |
| `book_demo` | Calendly or practice booking system | Appointment requested |

#### Proactive Triggers

| Trigger | Type | Setting | URL | Message |
|---|---|---|---|---|
| Services page browse | Time on Page | 30 seconds | `/services` | *"Looking for a specific service or want to book an appointment? I can help."* |
| Exit intent | Exit Intent | — | (all) | *"Have a quick question? I'm here to help — no hold music."* |

#### Workflows

**Workflow: New Patient Welcome** — Capture lead → send email with: new patient intake form link, what to bring, location and parking, cancellation policy.

---

### Step 5 — Integrations

1. **Calendly** — appointment booking
2. **Google Docs** — patient FAQ documents
3. **Zapier** — connect to your practice management software

---

### Step 6 — Response Rules

Pin answers for: *"do you accept [insurance]"*, *"what are your hours"*, *"where are you located"*, *"how do I book an appointment"*, *"do you take new patients"*

---

### Expected Outcomes

- **Week 1:** Front-desk call volume for basic questions drops. New patient leads captured 24/7 including evenings and weekends.
- **Month 3:** Agent handles 50%+ of inbound inquiries without staff involvement.

---
---

## 7. Restaurant / Food & Beverage

**Revenue goal:** Drive reservations, promote daily specials and events, and capture event booking leads (private dining, catering).

---

### Step 1 — Create Your Assistant

- **Name:** `[Restaurant Name] Host`
- **Business description:**
  > We are a [cuisine type] restaurant. Our agent should help guests make reservations, answer questions about the menu, hours, and dietary options, and promote upcoming events and specials.

---

### Step 2 — Train Tab

1. **Crawl** your website.
2. **Google Sheets:** Menu with prices, dietary labels (vegan, gluten-free, etc.), daily/weekly specials.
3. **Airtable:** Event calendar with upcoming private dining availability.
4. **Paste as plain text:** Reservation policy, cancellation terms, private dining packages, catering inquiry process.

---

### Step 3 — Design Tab

- **Tone:** Friendly
- **Notification Bubbles:** Message 1: *"Tonight's special: [dish]."* Message 2: *"Book your table for the weekend — spots are filling up."* Delay: 4 seconds.
- **Exit Capture:** *"Before you go — can I grab you a table? I can check availability right now."*

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a friendly host for [Restaurant Name]. Help guests make reservations, answer menu questions, and promote our specials and events.

When a guest asks about availability, check our calendar and offer specific time slots. Always mention our current special at least once per conversation. For groups larger than 8 or private dining requests, capture their email and tell them our events team will follow up within 2 hours.

Be warm and enthusiastic. Make guests feel like they're already at the table.
```

#### Webhooks

| Action | Endpoint | When Fired |
|---|---|---|
| `book_demo` | Reservation system or Zapier | Reservation requested |
| `capture_lead` | Zapier → email list | Private dining or event inquiry |

#### Proactive Triggers

| Trigger | Type | Setting | Message |
|---|---|---|---|
| Return visitor | Return Visit | 2nd visit | *"Welcome back! Want to book a table or check tonight's specials?"* |
| Friday/Saturday exit | Exit Intent | — | *"Before you go — weekend tables are filling up. Can I grab one for you?"* |

#### Workflows

**Workflow: Reservation Confirmation** — Book demo → confirmation email with: reservation details, address, parking info, cancellation policy, link to menu.

**Workflow: Private Dining Alert** — Capture lead → webhook POST to your events team email/Slack immediately.

---

### Step 5 — Integrations

1. **Google Sheets** — live menu data
2. **Airtable** — event calendar
3. **Calendly** — reservation booking (or link to your existing booking system)
4. **Zapier** → email list for specials and event promotions

---

### Step 6 — Response Rules

Pin answers for: *"what are your hours"*, *"do you have vegan options"*, *"can I make a reservation"*, *"do you do private events"*, *"where are you located"*

---

### Expected Outcomes

- **Week 1:** Reservations booked via the agent after hours (when staff aren't available). Specials promoted automatically.
- **Month 3:** Private dining inquiries captured 24/7. Email list grows from exit-capture leads.

---
---

## 8. B2B Lead Generation / Sales

**Revenue goal:** Qualify inbound leads by company size, use case, and budget — then route high-value leads to sales reps instantly.

---

### Step 1 — Create Your Assistant

- **Name:** `[Company] Sales Assistant`
- **Business description:**
  > We sell [product/service] to [target customer]. Our agent should qualify inbound visitors by asking about their company size, use case, and timeline, capture leads, and book discovery calls for qualified prospects.

---

### Step 2 — Train Tab

1. **Crawl** your site.
2. **HubSpot:** Connect your blog and knowledge base — these are your highest-value training sources for B2B.
3. **Paste as plain text:** ICP definition (ideal customer profile), qualification criteria (minimum company size, industry, budget), competitive positioning, key objection responses.

---

### Step 3 — Design Tab

- **Tone:** Professional
- **Lead Capture:** Enable. *"Tell us about your use case — we'll match you with the right solution."*
- **Exit Capture on `/pricing`:** *"Before you leave — what's the main challenge you're trying to solve? Takes 30 seconds."*

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a sales assistant for [Company]. Your job is to qualify inbound visitors and book discovery calls with leads that match our ideal customer profile: [company size], [industry], [use case].

Start by asking about their role, company size, and what challenge they're trying to solve. If they match our ICP, offer to book a 30-minute call with our team. If they're outside our ICP, be honest and recommend alternatives or offer self-serve resources.

When a visitor mentions competitors, acknowledge them professionally and focus on our key differentiators: [1], [2], [3]. Never be pushy — qualified leads should feel informed, not sold to.
```

#### Webhooks

| Action | Endpoint | Revenue Impact |
|---|---|---|
| `capture_lead` | Zapier → Salesforce/HubSpot CRM | Lead in pipeline |
| `book_demo` | Calendly webhook | Discovery call created |
| `update_crm` | HubSpot direct API | Contact updated with chat context |
| `assign_human_agent` | Slack webhook | Sales rep alerted for enterprise signal |

#### Proactive Triggers

| Trigger | Type | URL | Message |
|---|---|---|---|
| Pricing return visit | Return Visit | `/pricing` | *"Back to compare plans? I can answer any questions or get you a custom quote."* |
| Solutions exit intent | Exit Intent | `/solutions` | *"Before you leave — what's the main challenge you're trying to solve?"* |

#### Workflows

**Workflow: Demo Booked → Sales Alert** — Use "Demo Booking Confirmation" + "Human Handoff Alert" templates. Sales rep gets an instant Slack notification with visitor context, company, and intent signals.

**Workflow: Lead Nurture** — Capture lead → wait 15 minutes → send email with relevant case study based on their stated use case.

---

### Step 5 — Integrations

1. **HubSpot** — CRM sync and knowledge base training
2. **Calendly** — demo booking
3. **Zapier** → Salesforce, Pipedrive, or outreach platform
4. **Slack** — instant rep alerts

---

### Step 6 — Response Rules

Pin answers for: *"how much does it cost"*, *"what integrations do you support"*, *"is there a free trial"*, *"what's your implementation timeline"*, *"how are you different from [competitor]"*

---

### Expected Outcomes

- **Week 1:** Inbound lead qualification happens 24/7. Exit intent on pricing page recovers high-intent visitors.
- **Week 4:** Sales team receives pre-qualified leads with full conversation context — call preparation time drops.
- **Month 3:** Agent routes 3× more leads to sales with higher intent scores than form-fill leads.

---
---

## 9. HR & Recruitment

**Revenue goal:** Attract top candidates by answering job-seeker questions instantly, and accelerate time-to-hire by pre-screening and booking screening calls automatically.

---

### Step 1 — Create Your Assistant

- **Name:** `[Company] Talent Assistant`
- **Business description:**
  > We are a [company type] company looking to attract talent. Our agent should answer candidate questions about open roles, company culture, and benefits, and book screening calls for qualified applicants.

---

### Step 2 — Train Tab

1. **Crawl** your careers page.
2. **Notion:** Job descriptions, team structure, company values, interview process documentation.
3. **Google Docs:** Employee handbook sections you're comfortable sharing (benefits overview, remote work policy).
4. **Paste as plain text:** Open roles with requirements, salary ranges (if public), perks and benefits list.

---

### Step 3 — Design Tab

- **Tone:** Friendly and Professional
- **Lead Capture:** Enable on careers page. *"Interested in joining? Share your email and we'll keep you updated on new openings."*
- **Exit Capture:** *"Not ready to apply yet? Drop your email and we'll reach out when a role matches your profile."*

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are a talent advisor for [Company]. Help candidates understand our open roles, culture, and interview process — and book a 30-minute screening call for roles they're excited about.

When a candidate describes their experience and goals, match them to the most relevant open role and explain why they'd be a good fit. Always be enthusiastic about our team and culture. If a candidate asks about salary, share the range if it's public, or say "We can discuss specifics in the screening call — I can book one right now."

Never make hiring commitments. The agent is here to inform and schedule — not to screen or hire.
```

#### Webhooks

| Action | Endpoint | When Fired |
|---|---|---|
| `capture_lead` | Zapier → ATS (Greenhouse, Lever) | Candidate shares email |
| `book_demo` | Calendly webhook | Screening call booked |

#### Proactive Triggers

| Trigger | Type | URL | Message |
|---|---|---|---|
| Careers page engagement | Time on Page | 40 seconds | `/careers` | *"Interested in working here? I can tell you more about any of these roles or our team."* |
| Job listing exit | Exit Intent | `/careers/*` | *"Not finding the right role? Drop your email and we'll alert you when something matches your background."* |

#### Workflows

**Workflow: Screening Call Confirmation** — Book demo → email with: interview format, what to prepare, who they'll speak with, company values summary.

**Workflow: Recruiter Alert** — Capture lead → immediate webhook to recruiting team Slack or ATS.

---

### Step 5 — Integrations

1. **Notion** — job descriptions and culture docs
2. **Calendly** — screening call scheduling
3. **Zapier** → your ATS (Greenhouse, Lever, Workable)

---

### Step 6 — Response Rules

Pin answers for: *"are you hiring"*, *"what's the interview process"*, *"do you offer remote work"*, *"what are the benefits"*, *"what's the salary range"*

---

### Expected Outcomes

- **Week 1:** Candidate questions answered 24/7. Passive candidates (browsing at night) captured.
- **Month 3:** Time-to-first-screening-call drops significantly. ATS receives pre-qualified candidates with stated interest and background.

---
---

## 10. Professional Services (Law, Finance, Accounting)

**Revenue goal:** Convert information-seekers into consultation bookings, reduce time spent on repetitive intake questions, and build trust before the first call.

> **Important:** Configure your agent to never provide legal, financial, or tax advice. Its role is to educate about services and book consultations.

---

### Step 1 — Create Your Assistant

- **Name:** `[Firm Name] Intake Assistant`
- **Business description:**
  > We are a [law firm / financial advisory / accounting practice]. Our agent should help visitors understand our services, answer general questions about our process, and book a free initial consultation. The agent must never provide legal, financial, or tax advice.

---

### Step 2 — Train Tab

1. **Crawl** your firm's website.
2. **Notion / Google Docs:** Practice area overviews, process guides, team bios, FAQ documents.
3. **Paste as plain text:** Services with typical engagement scope, consultation fee structure (if any), what documents to bring to the first meeting, intake process step-by-step.

---

### Step 3 — Design Tab

- **Tone:** Professional
- **Lead Capture:** Enable. *"Tell us briefly what you need help with — we'll match you with the right specialist."*
- **Exit Capture:** *"Have a legal/financial question? I can't give advice, but I can book you a 30-minute consultation with one of our specialists."*
- **Notification Bubbles:** Message 1: *"Free initial consultation available."* Delay: 8 seconds.

---

### Step 4 — Automate Tab

#### Agent Instructions
```
You are an intake assistant for [Firm Name]. Help visitors understand our practice areas, what to expect from working with us, and book a free initial consultation.

CRITICAL: Never provide legal, financial, tax, or accounting advice. If a visitor asks a specific legal or financial question, say: "That's exactly the kind of question we'd address in your consultation — I can book one right now, no cost for the initial session."

When a visitor describes their situation, identify the relevant practice area and explain how we approach it. Build confidence by describing our process clearly. Always offer a consultation booking before the conversation ends.
```

#### Webhooks

| Action | Endpoint | When Fired |
|---|---|---|
| `capture_lead` | Zapier → your CRM | Visitor shares contact details |
| `book_demo` | Calendly webhook | Consultation booked |

#### Proactive Triggers

| Trigger | Type | URL | Message |
|---|---|---|---|
| Practice area return | Return Visit | `/services` or `/practice-areas` | *"Researching your options? I can explain how we approach this — and what a consultation looks like."* |
| Exit on services page | Exit Intent | `/services/*` | *"Before you go — consultations are free. I can book one in 60 seconds."* |

#### Workflows

**Workflow: Consultation Confirmation** — Book demo → email with: appointment time, what to prepare (relevant documents, timeline of events), what to expect in the meeting, firm address or video link.

**Workflow: Intake Alert** — Capture lead → immediate email/Slack alert to the responsible partner or advisor.

---

### Step 5 — Integrations

1. **Calendly** — consultation booking
2. **Notion** — practice area guides and FAQ
3. **Google Docs** — process documentation
4. **Zapier** → your practice management or CRM system

---

### Step 6 — Response Rules

Pin answers for: *"how much do you charge"*, *"what is a retainer"*, *"what documents do I need"*, *"what's the first step"*, *"do you offer payment plans"*

---

### Expected Outcomes

- **Week 1:** After-hours consultation requests captured automatically. Basic intake questions answered without staff involvement.
- **Week 4:** Clients arrive to their first consultation better prepared — shorter intake meetings.
- **Month 3:** Agent generates 30–50% of new consultation bookings. Intake team handles relationship management, not information delivery.

---

---

## Quick Reference — Webhook Actions

| Action Name | Use When |
|---|---|
| `capture_lead` | Visitor shares their email or contact info |
| `book_demo` | Visitor agrees to a meeting, call, or appointment |
| `recommend_product` | Visitor asks for a product or service recommendation |
| `trigger_discount` | Visitor is about to leave without buying |
| `send_notification` | Agent needs to alert your team of something |
| `assign_human_agent` | Visitor needs to speak with a real person |
| `update_crm` | Contact record should be updated in your CRM |
| `track_event` | Log a custom analytics event |
| `personalize_experience` | Adjust the widget behavior for this visitor |

## Quick Reference — Proactive Trigger Types

| Trigger Type | Best For |
|---|---|
| **Time on Page** | Engaging browsing visitors before they get stuck or leave |
| **Exit Intent** | Last-chance capture on high-value pages (cart, pricing, contact) |
| **Return Visit** | Re-engaging warm leads who came back a second time |
