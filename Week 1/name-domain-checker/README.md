# Name Domain Checker

AI Business Name + Domain Checker MVP built from the local product spec in [`docs/`](./docs).

## What it does

- Collects a business brief, industry, tone, market, and preferred domain extensions
- Generates exactly 20 business names
- Stores the report server-side
- Shows a free preview with the first 5 names
- Starts a Stripe Checkout session to unlock the full report
- Verifies payment through a Stripe webhook

## Stack

- Next.js 16 App Router
- React 19
- Postgres via `pg` when `DATABASE_URL` is set
- Local JSON fallback in `.data/` for development without a database
- OpenAI API via `fetch` when `OPENAI_API_KEY` is set
- Stripe for checkout and webhook verification

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Add the required environment variables.
3. If you want Postgres persistence, apply [`db/schema.sql`](./db/schema.sql).
4. Run `npm run dev`.
5. Open `http://localhost:3000/tools/business-name-checker`.

## Important env vars

```bash
OPENAI_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
DOMAIN_CHECK_API_URL=
DOMAIN_CHECK_API_KEY=
```

## Notes

- If `OPENAI_API_KEY` is missing, the app falls back to deterministic local name generation for development.
- If `DATABASE_URL` is missing, reports are stored locally in `.data/name-checker-reports.json`.
- If domain provider env vars are missing, domain checks return `unknown` rather than a fake available status.
