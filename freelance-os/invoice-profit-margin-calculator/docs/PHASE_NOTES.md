# Phase Notes

## Repo state confirmed

- Framework: fresh Next.js 16 App Router project created manually in this repo
- Routing: `src/app` route structure
- Styling: plain global CSS in `src/app/globals.css`
- Existing auth/payment/database utilities found: none

## Files created

- App routes: `src/app/*`
- UI components: `src/components/*`
- Calculation utilities and tests: `src/lib/calculations.ts`, `src/lib/calculations.test.ts`
- Local persistence helper: `src/lib/storage.ts`
- Types: `src/types/invoice.ts`
- Config: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`

## Calculation utility location

- Shared calculation logic lives in `src/lib/calculations.ts`

## Unfinished items

- Stripe checkout/webhook are stub routes only
- Resend email sending is stubbed
- Invoice history is local-storage based instead of database-backed
- No auth layer is implemented yet

## Assumptions made

- Building Phase 1 foundation plus extension points was the correct interpretation because the repo started empty and no backend credentials or prior stack existed
- Free vs Pro behavior is demonstrated in-browser with a `Pro preview` toggle

## Known bugs

- Logo upload, branded theming, and saved server-side invoice detail pages are not implemented
- Dashboard links route back to `/invoice` because there is no persisted detail store yet

## What the next agent should start with

- Replace local storage history with database persistence
- Add auth and user ownership checks
- Implement real Stripe checkout, webhook verification, and entitlement storage
- Implement Resend email sending with attached/generated PDF
