# Owner Instructions

This file is the operational guide for getting `name-domain-checker` running locally and in production.

It is written against the current codebase, not the original product spec. Where the live implementation differs from the ideal MVP scope, that is called out clearly.

## What This App Does

The app is a Next.js tool that:

- accepts a business brief
- generates exactly 20 business name ideas
- stores the generated report server-side
- shows the first 5 names for free
- sends the user to Stripe Checkout to unlock the full report
- marks the report as paid only after Stripe webhook confirmation

## Current Routes

- `/`
  - simple homepage / entry point
- `/tools/business-name-checker`
  - main product page and form
- `/tools/business-name-checker/results/[id]`
  - results page for a generated report
- `POST /api/name-checker/generate`
  - validates the form input, generates names, checks domains, stores the report
- `POST /api/name-checker/create-checkout-session`
  - creates a Stripe Checkout session for the report
- `POST /api/stripe/webhook`
  - verifies Stripe webhook signatures and unlocks the report

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Stripe Node SDK
- `pg` for Postgres

## Important Reality Check

The current app is designed to run even if some production services are not configured yet.

That means:

- if `OPENAI_API_KEY` is missing, the app uses a deterministic local fallback generator
- if `DATABASE_URL` is missing, the app stores reports in `.data/name-checker-reports.json`
- if a domain provider is not configured, domain results return `unknown`
- if Stripe is not configured, checkout cannot start

This is useful for development, but for a real launch you should configure:

- OpenAI
- Postgres
- Stripe
- a real domain lookup service

## Files You Should Know

- [README.md](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/README.md)
- [db/schema.sql](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/db/schema.sql)
- [src/lib/storage.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/storage.ts)
- [src/lib/ai.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/ai.ts)
- [src/lib/domain.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/domain.ts)
- [src/app/api/name-checker/generate/route.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/app/api/name-checker/generate/route.ts)
- [src/app/api/name-checker/create-checkout-session/route.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/app/api/name-checker/create-checkout-session/route.ts)
- [src/app/api/stripe/webhook/route.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/app/api/stripe/webhook/route.ts)

## Prerequisites

Install these before trying to run the app:

- Node.js 20 or newer
- npm
- a Stripe account
- a Postgres database if you want persistent production storage
- an OpenAI API key if you want real AI generation
- a domain lookup provider endpoint if you want live domain statuses

## Environment Variables

Copy `.env.example` to `.env.local`.

```bash
cp .env.example .env.local
```

Current variables used or reserved by the app:

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
DATABASE_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
DOMAIN_CHECK_API_URL=
DOMAIN_CHECK_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

### Which Variables Matter Right Now

Required for a full production flow:

- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `DOMAIN_CHECK_API_URL`

Optional right now:

- `OPENAI_MODEL`
- `DOMAIN_CHECK_API_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - currently not used directly in the frontend because checkout redirects from a server-created session URL
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
  - email sending is not implemented yet

### Variable Details

`OPENAI_API_KEY`
- used in [src/lib/ai.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/ai.ts)
- if missing, the app uses local fallback name generation

`OPENAI_MODEL`
- defaults to `gpt-4.1-mini`
- only used if `OPENAI_API_KEY` exists

`STRIPE_SECRET_KEY`
- used server-side to create checkout sessions and verify webhook payloads

`STRIPE_WEBHOOK_SECRET`
- required for `POST /api/stripe/webhook`
- Stripe signs webhook payloads; this app verifies the signature

`DATABASE_URL`
- if present, reports are stored in Postgres
- if absent, reports are stored in `.data/name-checker-reports.json`

`NEXT_PUBLIC_APP_URL`
- used to build Stripe success and cancel URLs
- examples:
  - local: `http://localhost:3000`
  - production: `https://yourdomain.com`

`DOMAIN_CHECK_API_URL`
- expected to point to your own domain-check endpoint or provider wrapper
- current code sends:

```json
{
  "domain": "example.com"
}
```

- current code expects a JSON response containing:

```json
{
  "status": "available"
}
```

Valid status values are:

- `available`
- `taken`
- `unknown`

If the provider returns anything else or fails entirely, the app falls back to `unknown`.

`DOMAIN_CHECK_API_KEY`
- optional bearer token for your domain-check provider

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Local Environment File

```bash
cp .env.example .env.local
```

Then fill in what you have available.

Minimum local dev setup:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

That minimal setup lets you run the app and test:

- page rendering
- form submission
- fallback name generation
- local JSON persistence
- preview flow

### 3. Start the Dev Server

```bash
npm run dev
```

Open:

- `http://localhost:3000`
- or directly `http://localhost:3000/tools/business-name-checker`

### 4. Verify the Local Flow

Submit a business idea longer than 20 characters.

You should see:

- a redirect to a results page
- 5 visible names
- locked paid results below
- domain statuses, usually `unknown` unless you configured a provider

## Local Persistence Behavior

If `DATABASE_URL` is not set, reports are saved in:

- `.data/name-checker-reports.json`

That file is ignored by git. It is only meant for development.

Do not rely on it for production.

## Database Setup

The database schema file is:

- [db/schema.sql](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/db/schema.sql)

### Current Table

The app currently expects:

- `name_checker_reports`

### Apply the Schema

Use your preferred Postgres client or hosted DB console and run:

```sql
create extension if not exists pgcrypto;

create table if not exists name_checker_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text,
  business_idea text not null,
  industry text not null,
  tone text not null,
  country text,
  ai_output jsonb not null,
  domain_results jsonb not null,
  payment_status text not null default 'free',
  stripe_session_id text,
  unlock_token text not null
);

create index if not exists idx_name_checker_reports_created_at
  on name_checker_reports (created_at desc);
```

### Notes About Storage Logic

Storage behavior is implemented in [src/lib/storage.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/storage.ts).

Important behavior:

- Postgres is used only when `DATABASE_URL` exists
- non-localhost database URLs get SSL with `rejectUnauthorized: false`
- reports start with `payment_status = 'free'`
- successful webhook processing changes `payment_status` to `paid`

## OpenAI Setup

Real AI generation is implemented in [src/lib/ai.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/ai.ts).

### What It Does

- sends a prompt to `https://api.openai.com/v1/chat/completions`
- requests strict JSON
- validates the response
- retries once if parsing or validation fails

### How To Enable It

Set:

```bash
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

### If You Do Nothing

The app still works, but generated names come from a local fallback generator instead of a real model.

That is acceptable for UI testing, not for a paid production launch.

## Domain Provider Setup

Domain checking is implemented in [src/lib/domain.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/domain.ts).

### Current Integration Model

The current app does not ship with a direct Cloudflare integration.

Instead, it expects a provider endpoint:

- URL from `DOMAIN_CHECK_API_URL`
- optional bearer token from `DOMAIN_CHECK_API_KEY`

The app `POST`s this payload:

```json
{
  "domain": "examplename.com"
}
```

The provider should respond with:

```json
{
  "status": "available"
}
```

Allowed values:

- `available`
- `taken`
- `unknown`

### What Happens If You Skip This

The app will not fake availability.

Instead:

- every domain status becomes `unknown`
- purchase links still point to Namecheap search URLs

### Recommended Approach

If you want production-grade domain checks, build or provision a thin backend endpoint that:

- accepts a domain string
- checks availability with your chosen registrar or provider
- normalizes the result into `available`, `taken`, or `unknown`

## Stripe Setup

Stripe is required for the paid unlock flow.

Relevant files:

- [src/app/api/name-checker/create-checkout-session/route.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/app/api/name-checker/create-checkout-session/route.ts)
- [src/app/api/stripe/webhook/route.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/app/api/stripe/webhook/route.ts)

### Current Billing Model

The live implementation currently supports:

- one-time payment only
- `$9` report unlock

The monthly subscription mentioned in the spec is not implemented.

### Required Stripe Variables

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

### What The Checkout Route Does

When the user clicks unlock:

- the frontend calls `POST /api/name-checker/create-checkout-session`
- the server creates a Stripe Checkout session
- Stripe redirects back to the results page after success or cancel

### What The Webhook Does

When Stripe sends `checkout.session.completed`:

- the webhook verifies the signature
- reads `metadata.reportId`
- marks the report as paid in storage

### Important Limitation

The results page does not trust the redirect query string.

It only becomes fully unlocked after the webhook updates `payment_status`.

That is correct behavior.

### Local Stripe Testing

You can test locally with the Stripe CLI.

Example workflow:

1. run the app locally
2. start Stripe webhook forwarding to your local app
3. copy the webhook signing secret into `.env.local`
4. complete a test checkout

Typical Stripe CLI command:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then Stripe will show a webhook signing secret that you place into:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Production Stripe Setup

In Stripe Dashboard:

1. create a webhook endpoint
2. point it to:

```txt
https://yourdomain.com/api/stripe/webhook
```

3. subscribe to:

- `checkout.session.completed`

4. copy the production webhook signing secret into your production env vars

## Running a Real Production-Like Local Stack

For the closest local simulation, use:

```bash
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
DATABASE_URL=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DOMAIN_CHECK_API_URL=https://your-domain-check-service.example.com
DOMAIN_CHECK_API_KEY=...
```

Then:

```bash
npm install
npm run dev
```

## Production Deployment Checklist

Before deployment:

- set all production environment variables
- apply `db/schema.sql`
- configure Stripe webhook
- configure a real domain provider endpoint
- confirm `NEXT_PUBLIC_APP_URL` is the final production URL

After deployment:

- generate a report
- confirm it persists in Postgres
- start checkout
- complete a Stripe test payment
- confirm the webhook marks the report as paid
- reload the results page and confirm the full report is visible

## Recommended Deployment Target

This app is a standard Next.js app and is suitable for:

- Vercel
- Railway
- Render
- any Node-compatible host that supports Next.js

For Vercel specifically:

- import the GitHub repo
- add env vars in project settings
- deploy
- set Stripe webhook to the final deployed domain

## Commands You’ll Use Most

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Lint:

```bash
npm run lint
```

Production build test:

```bash
npm run build
```

Run production build locally:

```bash
npm run build
npm run start
```

## How The Free vs Paid Flow Works

### Free Flow

1. user submits the form
2. server validates the input
3. AI names are generated
4. domain checks are run
5. report is stored
6. user is sent to the results page
7. only 5 names are shown

### Paid Flow

1. user clicks unlock
2. server creates Stripe Checkout session
3. user pays in Stripe
4. Stripe calls the webhook
5. webhook marks the report as paid
6. user reloads or returns to the results page
7. full report becomes visible

## Validation and Rate Limiting

Validation is handled in [src/lib/validation.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/validation.ts).

Current validation rules:

- business idea must be 20 to 500 characters
- industry is required
- tone must be one of the supported options
- country must be one of the supported options if provided
- some basic spam patterns are blocked

Rate limiting is handled in [src/lib/rate-limit.ts](/Users/Thunderops/Documents/Projects/new-apps/Week%201/name-domain-checker/src/lib/rate-limit.ts).

Current rate limit:

- 5 generation attempts per IP hash per hour

Important limitation:

- current rate limiting is in-memory only
- it resets when the server restarts
- it is not shared across multiple instances

That is acceptable for development, not ideal for a real public production launch.

## Known Limitations In The Current Build

These are important owner-level caveats:

- monthly subscription billing is not implemented
- email delivery is not implemented
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is not currently used
- domain provider integration is abstract only, not turnkey
- local fallback AI generation is deterministic and not launch-quality
- local file persistence is for dev only
- rate limiting is memory-based only
- analytics are not implemented
- trademark or legal checks are not implemented

## Troubleshooting

### Problem: Checkout button returns an error

Check:

- `STRIPE_SECRET_KEY` exists
- `NEXT_PUBLIC_APP_URL` is correct
- the report exists in storage

### Problem: Payment completes but report stays locked

Check:

- Stripe webhook endpoint URL is correct
- `STRIPE_WEBHOOK_SECRET` matches the endpoint
- Stripe actually sent `checkout.session.completed`
- the database row updated to `payment_status = 'paid'`

### Problem: Reports disappear after restart

Cause:

- you are using local `.data` storage because `DATABASE_URL` is not set

Fix:

- configure Postgres and `DATABASE_URL`

### Problem: All domains show `unknown`

Cause:

- `DOMAIN_CHECK_API_URL` is missing
- provider response format is wrong
- provider endpoint is failing

Fix:

- configure a valid provider endpoint that returns `status`

### Problem: Generated names look generic

Cause:

- `OPENAI_API_KEY` is missing, so fallback generation is being used

Fix:

- configure OpenAI

### Problem: Build works locally but production payment flow breaks

Check:

- production env vars are all present
- production webhook URL is correct
- production `NEXT_PUBLIC_APP_URL` matches the live domain exactly

## Recommended First Owner Actions

If you want this app truly launch-ready, do these next:

1. connect a real Postgres database
2. connect a real OpenAI API key
3. connect Stripe and verify webhook unlock end to end
4. build or connect a real domain provider endpoint
5. add analytics
6. add email delivery for unlocked reports

## If You Just Want It Running Fast

Use this minimum local flow:

1. `cp .env.example .env.local`
2. set `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. run `npm install`
4. run `npm run dev`
5. open `/tools/business-name-checker`

That will give you:

- UI
- fallback name generation
- local report saving
- preview results flow

It will not give you:

- real payments
- real AI
- real domain availability
- production persistence
