# Agent Handover — AI Business Name + Domain Checker

## Mission

Build and ship the MVP for the **AI Business Name + Domain Checker**.

This is the Week 1 fast-cash product. Keep the build tight. The goal is not a large SaaS dashboard. The goal is a working paid tool that generates business names, checks domain availability, and unlocks a full report after payment.

## Product Intent

Users should be able to:

1. Enter a business idea.
2. Receive AI-generated business names.
3. See matching domain availability.
4. Pay to unlock the full report.
5. Click available domains to buy/check them.

## Build Priority

### Priority 1 — Must Ship

- Landing page
- Input form
- AI name generation
- Domain availability check
- Results page
- Locked free preview
- Stripe checkout
- Stripe webhook unlock
- Database persistence

### Priority 2 — Good If Fast

- Email unlocked report link
- Printable report page
- Simple analytics events
- Example reports on landing page

### Priority 3 — Defer

- User accounts
- Dashboard
- Logo generation
- Trademark checks
- Complex PDF export
- Multi-tool suite navigation

## Suggested Stack

Use the existing project conventions unless they conflict with this handover.

Recommended:

- Next.js / React
- Supabase/Postgres
- Stripe Checkout
- OpenAI or Gemini for AI generation
- Cloudflare/domain provider API for domain availability
- Resend for email if already configured
- Vercel deploy

## Environment Variables Needed

Add only what is required.

```bash
OPENAI_API_KEY=
GEMINI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

If both OpenAI and Gemini exist, choose the one already used in the repo.

## Routes to Create

```txt
/tools/business-name-checker
/tools/business-name-checker/results/[id]
/api/name-checker/generate
/api/name-checker/create-checkout-session
/api/stripe/webhook
```

Use existing route structure if the repo already has a preferred pattern.

## Database Work

Create table: `name_checker_reports`.

Minimum fields:

```sql
id uuid primary key default gen_random_uuid(),
created_at timestamptz default now(),
email text,
business_idea text not null,
industry text,
tone text,
country text,
ai_output jsonb,
domain_results jsonb,
payment_status text default 'free',
stripe_session_id text,
unlock_token text
```

Optional table: `name_checker_usage` for rate limiting/logging.

## Required User Flow

### Free User Flow

1. User submits form.
2. Backend generates full report.
3. Backend saves full report.
4. Frontend shows only first 5 names.
5. Remaining 15 names are locked.
6. User sees unlock CTA.

### Paid Flow

1. User clicks unlock.
2. Stripe Checkout opens.
3. Webhook confirms payment.
4. Report `payment_status` changes to `paid`.
5. User returns to results page.
6. Full report is visible.

## AI Generation Requirements

Generate exactly 20 names.

Each item must include:

- name
- rationale
- tagline
- toneFit
- bestFor
- domainCandidates

Use strict JSON output. Validate the AI response before saving.

If JSON parsing fails:
- Retry once.
- If retry fails, return clean user-facing error.

## Domain Check Requirements

Check common extensions:

- `.com`
- `.com.au`
- `.ai`
- `.io`
- `.co`

If provider API is unavailable, implement a safe abstraction now:

```ts
checkDomainAvailability(domain): Promise<{
  domain: string
  status: 'available' | 'taken' | 'unknown'
  purchaseUrl?: string
}>
```

Do not fake “available” results. Use `unknown` when uncertain.

## Payment Requirements

Use Stripe Checkout.

Products/prices:

- `$9` one-off full report
- `$19/month` unlimited can be stubbed or added if existing billing supports subscriptions

MVP can ship with one-off payment only if subscription adds too much friction.

Important:
- Payment unlock must happen server-side through webhook.
- Do not trust query params from Stripe as proof of payment.
- Verify Stripe webhook signature.

## UI Requirements

Keep UI simple and conversion-focused.

Landing page sections:

1. Hero + form
2. Example results
3. Pricing
4. FAQ
5. Disclaimer

Results page sections:

1. Business idea summary
2. Top recommendation
3. Name cards
4. Domain availability table
5. Unlock CTA if unpaid

Domain status badges:

- Available
- Taken
- Unknown

## Copy Guidelines

Use direct, practical copy.

Avoid claiming:
- guaranteed domain purchase
- trademark clearance
- legal availability
- guaranteed business success

Required disclaimer:

> Domain and business name availability checks are informational only. This tool does not provide trademark, legal, or business registration advice. Always complete your own checks before purchasing or registering a name.

## Error Handling

Handle these without crashing:

- AI API timeout
- AI invalid JSON
- Domain API timeout
- Stripe checkout creation failure
- Stripe webhook verification failure
- Missing report ID
- Already-paid report
- Rate-limited user

## Testing Checklist

Before finishing, test:

- [ ] Form submits successfully
- [ ] 20 names are generated
- [ ] Domain checks return structured results
- [ ] Report saves to DB
- [ ] Free preview shows only limited results
- [ ] Stripe checkout starts
- [ ] Webhook unlocks report
- [ ] Paid report shows all results
- [ ] Mobile layout works
- [ ] API keys are not exposed client-side
- [ ] Error states display cleanly

## Suggested Implementation Order

1. Create DB table/migration.
2. Build landing page and form.
3. Build AI generation endpoint.
4. Add report persistence.
5. Build results page with locked/free state.
6. Add domain availability abstraction.
7. Add Stripe checkout.
8. Add Stripe webhook unlock.
9. Polish UI/copy.
10. Test full flow.

## Definition of Done

The build is done when a real user can:

1. Open the tool.
2. Submit a business idea.
3. See a limited preview.
4. Pay through Stripe.
5. Return to a fully unlocked report.
6. Click domain purchase/check links.

## Final Handover Notes Required From Builder

When finished, update this file with:

- Files changed
- Routes added
- Environment variables added
- Database changes made
- Known limitations
- How to test locally
- Deployment notes
- Any unfinished items

---

## Builder Handover Notes

### Files changed

- Added Next.js app scaffold and replaced starter UI with the business-name-checker MVP
- Added routes:
  - `/`
  - `/tools/business-name-checker`
  - `/tools/business-name-checker/results/[id]`
  - `/api/name-checker/generate`
  - `/api/name-checker/create-checkout-session`
  - `/api/stripe/webhook`
- Added supporting code under `src/components/name-checker` and `src/lib`
- Added `db/schema.sql`
- Added `.env.example`
- Updated `README.md`

### Environment variables added

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=
DOMAIN_CHECK_API_URL=
DOMAIN_CHECK_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### Database changes made

- Added `db/schema.sql` containing `name_checker_reports`
- Runtime persistence uses Postgres when `DATABASE_URL` is present
- Local JSON storage in `.data/name-checker-reports.json` is used as a dev fallback only

### Known limitations

- Stripe unlock flow is implemented for one-off payments only
- Email delivery is not wired yet
- Domain availability requires an external provider endpoint; fallback status is `unknown`
- No subscription billing yet
- No analytics pipeline yet

### How to test locally

1. Create `.env.local` from `.env.example`
2. Run `npm install`
3. Run `npm run dev`
4. Open `/tools/business-name-checker`
5. Submit a valid brief and verify the results page shows 5 unlocked names
6. If Stripe is configured, start checkout and confirm webhook updates `payment_status` to `paid`

### Deployment notes

- Set `NEXT_PUBLIC_APP_URL` to the deployed origin
- Apply `db/schema.sql` before production traffic
- Configure the Stripe webhook to `POST /api/stripe/webhook`
- Add a real domain provider endpoint if you want statuses beyond `unknown`

### Unfinished items

- Email unlocked report link
- Subscription plan at `$19/month`
- Analytics events
- Example persisted reports for launch marketing

## Known MVP Tradeoffs

Acceptable for first launch:

- One-off payment only
- No login/account system
- Basic printable HTML instead of PDF
- `unknown` domain status if provider API fails
- No trademark lookup

Not acceptable:

- Fake domain availability
- Client-side-only payment unlock
- Exposed API keys
- Losing generated reports on refresh
- AI output displayed without validation
