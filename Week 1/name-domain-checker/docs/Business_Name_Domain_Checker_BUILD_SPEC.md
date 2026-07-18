# Build Spec — AI Business Name + Domain Checker

## 1. Product Summary

**Product:** AI Business Name + Domain Checker  
**Goal:** Let users enter a business idea, generate strong business names, check matching domain availability, and push them toward a fast purchase decision.

**Primary outcome:** Ship a paid MVP in 3–4 days that can sell a $9 one-off report or $19/month unlimited plan.

**Target users:**
- Solo founders
- Side-hustlers
- Freelancers
- Indie hackers
- Small business owners
- Dropshippers/ecommerce starters

## 2. MVP Scope

### Core User Flow

1. User lands on tool page.
2. User enters:
   - Business idea / short brief
   - Industry/category
   - Preferred brand tone
   - Optional location/country
3. App generates 20 business name ideas.
4. App checks domain availability for key extensions.
5. User sees limited free results.
6. User pays to unlock full results/report.
7. User can click available domains via Cloudflare/domain-provider affiliate or buy link.

## 3. MVP Feature Requirements

### 3.1 Landing Page

**Route:** `/tools/business-name-checker`

Must include:
- Clear headline
- Short value proposition
- Input form above the fold
- Pricing card
- Example output preview
- FAQ
- CTA buttons

Suggested headline:

> Generate business names and check domains in one click.

Suggested subheadline:

> Get 20 AI-generated business name ideas, matching domain availability, taglines, and launch-ready positioning in under 60 seconds.

### 3.2 Input Form

Fields:

| Field | Type | Required | Notes |
|---|---|---:|---|
| Business idea | Textarea | Yes | 20–500 chars |
| Industry | Select/input | Yes | e.g. ecommerce, SaaS, local service |
| Brand tone | Select | Yes | Premium, playful, professional, tech, local, bold |
| Country/market | Select | No | AU, US, Global |
| Preferred extensions | Multi-select | No | `.com`, `.com.au`, `.ai`, `.io`, `.co` |

Validation:
- Business idea must not be empty.
- Block obvious spam or nonsensical submissions.
- Rate-limit free usage.

### 3.3 AI Name Generation

Generate exactly **20 names**.

For each name return:
- Name
- Short rationale
- Suggested tagline
- Brand tone fit
- Best-use category
- Domain search candidates

Output schema:

```json
{
  "names": [
    {
      "name": "ExampleName",
      "rationale": "Why this name fits the brief.",
      "tagline": "Short tagline.",
      "toneFit": "Premium / Professional / Tech",
      "bestFor": "SaaS / ecommerce / local service",
      "domainCandidates": [
        "examplename.com",
        "examplename.com.au",
        "getexamplename.com"
      ]
    }
  ]
}
```

AI rules:
- Avoid names that are too close to famous brands.
- Avoid trademark-heavy language.
- Prefer short, pronounceable names.
- Generate a mix of practical, premium, and creative names.
- No legal guarantee should be implied.

### 3.4 Domain Availability Check

Use Cloudflare API or chosen provider API.

Minimum checks:
- `.com`
- `.com.au`
- `.ai`
- `.io`
- `.co`

For each domain return:

| Field | Description |
|---|---|
| Domain | Full domain name |
| Extension | TLD |
| Availability | Available / taken / unknown |
| Purchase URL | Buy link or affiliate URL |
| Checked at | Timestamp |

If API fails:
- Show `unknown` status.
- Do not block whole report.
- Log error server-side.

### 3.5 Results Page

**Route:** `/tools/business-name-checker/results/:id`

Free view:
- Show 5 names
- Show limited domain data
- Blur/lock remaining names
- CTA to unlock full report

Paid view:
- Show all 20 names
- Show all checked domains
- Include taglines
- Include “best pick” recommendation
- Include downloadable/shareable report

### 3.6 Payment

Use Stripe Checkout.

Initial pricing:

| Plan | Price | Access |
|---|---:|---|
| One-off report | $9 | One full report |
| Unlimited monthly | $19/mo | Unlimited checks |

Payment requirements:
- Create checkout session server-side.
- Use Stripe webhook to unlock report.
- Store payment status in database.
- Never trust client-side payment state.

### 3.7 Report

Report should include:
- Business brief summary
- Top 20 names
- Top 5 recommended names
- Domain availability table
- Taglines
- Launch positioning suggestions
- Disclaimer: domain/trademark availability is informational only

Export options:
- MVP: HTML printable page
- Later: PDF export

## 4. Technical Architecture

### Recommended Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js / React |
| Backend | Next.js API routes/server actions |
| Database | Supabase/Postgres |
| Auth | Optional for MVP; anonymous report tokens acceptable |
| Payments | Stripe |
| AI | OpenAI or Gemini |
| Domain API | Cloudflare API or provider API |
| Email | Resend |
| Hosting | Vercel |
| Monitoring | Sentry/logging later |

### Suggested Routes

```txt
/tools/business-name-checker
/tools/business-name-checker/results/[id]
/api/name-checker/generate
/api/name-checker/check-domains
/api/name-checker/create-checkout-session
/api/stripe/webhook
```

### Suggested Database Tables

#### `name_checker_reports`

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| created_at | timestamp | Default now |
| email | text | Optional |
| business_idea | text | User input |
| industry | text | User input |
| tone | text | User input |
| country | text | Optional |
| ai_output | jsonb | Full AI response |
| domain_results | jsonb | Domain check output |
| payment_status | text | free / paid / subscription |
| stripe_session_id | text | Nullable |
| unlock_token | text | Secure token |

#### `name_checker_usage`

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| ip_hash | text | For rate limiting |
| created_at | timestamp | Timestamp |
| report_id | uuid | Optional FK |
| status | text | success / blocked / failed |

## 5. API Behaviour

### `POST /api/name-checker/generate`

Input:

```json
{
  "businessIdea": "AI tool for freelance proposal writing",
  "industry": "SaaS",
  "tone": "professional",
  "country": "AU",
  "extensions": [".com", ".com.au", ".ai"]
}
```

Output:

```json
{
  "reportId": "uuid",
  "previewNames": [],
  "lockedCount": 15,
  "checkoutUrl": null
}
```

Rules:
- Generate AI names.
- Check domains.
- Save report.
- Return limited preview.

### `POST /api/name-checker/create-checkout-session`

Input:

```json
{
  "reportId": "uuid",
  "plan": "one_off"
}
```

Output:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/..."
}
```

### Stripe Webhook

Events:
- `checkout.session.completed`
- `invoice.payment_succeeded` if subscription used
- `customer.subscription.deleted` later

On successful payment:
- Update report/payment status.
- Email unlocked report link if email exists.

## 6. AI Prompt Draft

```txt
You are an expert brand naming strategist.

Generate exactly 20 business name ideas for this business:

Business idea: {{businessIdea}}
Industry: {{industry}}
Brand tone: {{tone}}
Target market/country: {{country}}

Rules:
- Names must be short, memorable, pronounceable, and commercially plausible.
- Avoid names that are too similar to famous brands.
- Avoid legal guarantees or trademark claims.
- Include a mix of practical, premium, modern, and slightly creative names.
- For each name, include a short rationale, tagline, tone fit, best-use category, and 3–5 domain candidates.
- Domain candidates should include clean .com possibilities where possible, plus relevant alternatives such as .com.au, .ai, .io, or .co.

Return valid JSON only using this schema:
{
  "names": [
    {
      "name": "string",
      "rationale": "string",
      "tagline": "string",
      "toneFit": "string",
      "bestFor": "string",
      "domainCandidates": ["string"]
    }
  ]
}
```

## 7. UI Requirements

### Visual Style

- Clean SaaS tool interface
- Minimal friction
- Mobile responsive
- One main action per screen
- Strong result cards
- Available domains should visually stand out

### Result Card Fields

Each name card:
- Name
- Tagline
- Rationale
- Domain chips:
  - Available
  - Taken
  - Unknown
- Buy/check button

### Locked State

For unpaid users:
- Show first 5 results
- Blur/lock remaining 15
- CTA: “Unlock all 20 names + domain report”

## 8. Error Handling

Must handle:
- AI API failure
- Invalid AI JSON
- Domain API timeout
- Stripe checkout failure
- Webhook failure
- Duplicate/repeated submissions
- Rate limit exceeded

User-facing fallback copy:

> Something went wrong while generating your report. Please try again in a moment. You have not been charged.

## 9. Security Requirements

- Store API keys in environment variables only.
- Never expose domain API keys client-side.
- Never expose Stripe secret key client-side.
- Validate all inputs server-side.
- Rate-limit anonymous generation.
- Use webhook verification for Stripe.
- Use secure unlock tokens for paid reports.

## 10. Analytics

Track events:
- Page view
- Form started
- Form submitted
- Report generated
- Checkout started
- Checkout completed
- Domain buy click
- Error occurred

Key metrics:
- Visitor → form submit conversion
- Form submit → checkout conversion
- Checkout → payment conversion
- Revenue per visitor
- Most common industries
- Most clicked domain extensions

## 11. Launch Checklist

### Build

- [ ] Create landing page
- [ ] Build input form
- [ ] Add AI generation endpoint
- [ ] Add domain availability endpoint
- [ ] Save reports to DB
- [ ] Build results page
- [ ] Add locked preview state
- [ ] Add Stripe checkout
- [ ] Add webhook unlock logic
- [ ] Add email/report link sending
- [ ] Add basic analytics
- [ ] Add legal disclaimer

### QA

- [ ] Test empty inputs
- [ ] Test long inputs
- [ ] Test AI failure
- [ ] Test domain API failure
- [ ] Test successful Stripe payment
- [ ] Test failed/cancelled Stripe payment
- [ ] Test webhook unlock
- [ ] Test mobile layout
- [ ] Test report reload by URL

### Launch

- [ ] Publish product page
- [ ] Create 3 example reports
- [ ] Post on Indie Hackers
- [ ] Post on Reddit/r/entrepreneur where allowed
- [ ] Post on X/LinkedIn
- [ ] Add link from CVScan/Thunder Ops if appropriate

## 12. Out of Scope for MVP

Do not build yet:
- Full user accounts
- Complex dashboard
- Trademark search
- Logo generation
- Business registration lookup
- Team collaboration
- Advanced PDF editor
- White-label reports

## 13. Acceptance Criteria

MVP is complete when:

- A user can submit a business idea.
- The system generates 20 name ideas.
- The system checks at least 3 domain extensions.
- Free users see only a limited preview.
- Paid users can unlock full results via Stripe.
- Report data persists in the database.
- Domain purchase/check buttons are visible.
- The tool is deployed and usable on mobile.
- No API secrets are exposed client-side.
