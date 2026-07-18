# Agent Handover — Invoice + Profit Margin Calculator Micro-SaaS

## Project Overview

You are building a Week 1 fast-cash micro-SaaS: an **Invoice + Profit Margin Calculator** for freelancers, solo operators, dropshippers, and small ecommerce sellers.

The product should let users quickly calculate profit margins, create professional invoices, export PDFs, and optionally email invoices to clients. The goal is not to build full accounting software. The goal is to launch a small paid utility fast.

There are only **3 phases**:

1. **Coder 1 — Core product build**
2. **Coder 2 — Monetisation, persistence, and completion**
3. **Verification Agent — QA, security, calculation validation, and launch readiness**

Use `BUILD_SPEC.md` as the source of truth.

---

# Phase 1 — Coder 1 Handover

## Role

You are the first implementation agent. Your job is to create the functional product foundation.

Focus on:

- Landing page
- Invoice generator UI
- Profit margin calculator UI
- Calculation logic
- Live preview
- Clean responsive layout
- Basic local state
- Unit-tested calculation utilities

Do **not** spend time on advanced accounting, integrations, or unnecessary polish.

---

## Starting Context

> **Repo state:** Before writing any code, inspect the repo to confirm the current framework, routing convention, styling system, and any existing auth/payment/database utilities. Update this section with your findings before handing to Coder 2. If this is a fresh Next.js project with no prior utilities, state that explicitly so Coder 2 does not go looking for things that do not exist.

This is **Build 2** in the Week 1 fast-cash plan. Build 1 is the Business Name + Domain Checker. Both are intended to be live by end of week. The Proposal Builder is planned for the following week — do not include proposal functionality here.

The product should be simple enough to launch quickly and useful enough that freelancers/sellers could pay for it.

Expected monetisation:

- Free: basic calculator + invoice preview / watermarked PDF
- Paid: branded PDF, unlimited invoices, email sending, saved history

---

## Tasks for Coder 1

### 1. Project inspection

Before coding:

- Check current framework and routing setup.
- Check existing styling system.
- Check existing auth/payment/database utilities if present.
- Follow current project conventions.
- Record findings in your handover notes at the end of Phase 1.

### 2. Build landing page

Create or update the product landing page with:

- Headline
- Short value proposition
- CTA to invoice generator
- CTA to margin calculator
- Basic pricing section
- Use cases for freelancers, ecommerce sellers, dropshippers, and service businesses

### 3. Build invoice generator UI

Required sections:

- Business details
- Client details
- Invoice metadata
- Line items
- Notes/payment terms
- Live totals
- Invoice preview

Line items must support:

- Description
- Quantity
- Unit price
- Unit cost
- Tax rate
- Add/remove row

### 4. Build profit margin calculator

Required modes:

- Sell price known
- Target margin

Outputs must include:

- Net revenue
- Total cost
- Gross profit
- Net profit
- Margin percentage
- Markup percentage
- Suggested status
- Suggested sell price in target-margin mode

### 5. Add calculation utilities

Create reusable calculation functions for:

- Revenue
- Cost
- Profit
- Margin percentage
- Markup percentage
- Tax
- Invoice totals
- Required sell price from target margin

### 6. Add tests

Add basic unit tests for calculation logic.

Minimum test coverage:

- Normal profitable item
- Zero-cost item
- Loss-making item
- Multiple invoice line items
- Tax calculation
- Target margin calculation

---

## Definition of Done for Coder 1

Coder 1 is finished when:

- The app has a usable landing page.
- The invoice generator works in-browser.
- The margin calculator works in-browser.
- Totals update live.
- Calculation helpers exist and are not buried inside UI components.
- Calculation tests pass.
- The UI is responsive enough for desktop and mobile testing.
- The code is committed locally or clearly ready for the next agent.

---

## Coder 1 Must Leave for Coder 2

At the end of Phase 1, leave notes covering:

- **Repo state confirmed:** framework, routing, styling system, existing utilities found
- Files created/modified
- Calculation utility location
- Any unfinished UI issues
- Any assumptions made
- Any known bugs
- What Coder 2 should start with

---

# Phase 2 — Coder 2 Handover

## Role

You are the second implementation agent. Coder 1 has built the core UI and calculation foundation. Your job is to turn it into a monetisable product.

Focus on:

- Auth integration
- Database persistence
- Invoice saving/history
- PDF export
- Stripe checkout and webhook
- Paid feature gating
- Email invoice sending
- Production readiness improvements

---

## What Coder 1 Should Have Completed

Coder 1 should have completed:

- Landing page
- Invoice generator UI
- Margin calculator UI
- Live invoice preview
- Calculation utility functions
- Basic unit tests
- Responsive baseline layout

Before starting, inspect the repo and confirm these exist. If anything is missing, complete only what blocks Phase 2.

---

## Tasks for Coder 2

### 1. Auth and user state

Use the existing auth stack if present.

Required:

- Identify signed-in user.
- Protect dashboard/invoice history routes.
- Allow anonymous/free calculator use if possible.
- Require sign-in for saving invoice history.

### 2. Database schema

Add persistence for:

- Invoices
- Invoice line items
- User entitlements/subscriptions if not already present

Use the schema from `BUILD_SPEC.md` unless project conventions require adjustment.

### 3. Invoice history

Build a simple dashboard/history view:

- List saved invoices
- Show client name
- Invoice number
- Total
- Profit
- Margin
- Status
- Created date
- Open invoice detail page

### 4. PDF generation

Use **`@react-pdf/renderer`** for all PDF output. Do not use Playwright or any headless browser approach.

Free users:

- Watermarked PDF or preview-only if PDF gating is easier.

Paid users:

- No watermark
- Cleaner branded PDF
- Optional logo if feasible

PDF must meet the acceptance criteria defined in `BUILD_SPEC.md` Section 4.4 before being considered done.

PDF generation must not expose other users' invoices.

### 5. Stripe monetisation

Implement or connect:

- Stripe checkout session
- Stripe webhook
- Entitlement update
- Server-side paid feature checks

Paid-only features:

- Remove watermark
- Save unlimited invoices
- Email invoice
- Add branding/logo if implemented

### 6. Email sending

**Use Resend.** Do not use any other email provider.

Required:

- Send invoice email to client.
- Include subject and short message.
- Attach PDF or include secure invoice link.
- Handle failures cleanly.

If `RESEND_API_KEY` is not set in the environment, stub the email endpoint with a clear config flag and log a warning — do not silently fail.

### 7. Error/loading/empty states

Add user-friendly states for:

- PDF generation loading/failure
- Email sending loading/failure/success
- Empty invoice history
- Payment required
- Unauthorized access

---

## Definition of Done for Coder 2

Coder 2 is finished when:

- Users can save invoices.
- Users can view invoice history.
- PDF export works via @react-pdf/renderer and meets acceptance criteria.
- Stripe checkout works in test mode.
- Stripe webhook updates paid entitlement.
- Paid-only features are enforced server-side.
- Email sending via Resend works or is cleanly stubbed behind a `RESEND_API_KEY` config flag.
- Basic security checks are in place.
- The app is ready for verification.

---

## Coder 2 Must Leave for Verification Agent

At the end of Phase 2, leave notes covering:

- Files created/modified
- Database changes/migrations
- Required environment variables (list every one)
- Stripe product/price assumptions
- Webhook endpoint path
- Resend configuration assumptions
- Known bugs or incomplete items
- Exact test steps the verification agent should run

---

# Phase 3 — Verification Agent Handover

## Role

You are the final verification agent. Your job is to validate the product against the build spec, find bugs, check security boundaries, and prepare the final launch-readiness report.

Do not add new features unless required to fix critical defects.

---

## What Coder 2 Should Have Completed

Coder 2 should have completed:

- Auth/user handling
- Invoice persistence
- Invoice history/dashboard
- PDF export via @react-pdf/renderer
- Stripe checkout and webhook
- Paid feature gating
- Email sending via Resend or configured fallback
- Error/loading/empty states

Before verification, read:

- `BUILD_SPEC.md`
- Coder 1 notes
- Coder 2 notes
- Recent commits/diffs

---

## Verification Tasks

### 1. Calculation verification

Manually verify:

- Revenue calculation
- Cost calculation
- Profit calculation
- Margin percentage
- Markup percentage
- Tax/GST calculation
- Invoice total calculation
- Target margin suggested price

Test with:

- Profitable invoice
- Break-even invoice
- Loss-making invoice
- Zero tax
- Non-zero tax
- Multiple line items
- Decimal values

### 2. PDF acceptance criteria check

Verify each generated PDF meets all criteria from `BUILD_SPEC.md` Section 4.4:

- Business name renders correctly
- Client name and email render correctly
- All line items render with description, quantity, unit price, and line total
- Subtotal, tax, and total render correctly
- Due date renders correctly
- Layout is legible at A4 size
- No content clipped or overflowing
- Watermark present on free-user PDFs
- Watermark absent on paid-user PDFs

### 3. Free-user flow

Verify:

- Anonymous/free user can access calculator.
- Free user can create invoice preview.
- Free user cannot access paid-only features without checkout.
- Any watermarks/paywalls behave as expected.

### 4. Paid-user flow

Verify:

- User can sign in.
- User can complete Stripe checkout in test mode.
- Webhook updates entitlement.
- Paid user can save invoice.
- Paid user can export unwatermarked/branded PDF.
- Paid user can email invoice via Resend.
- Paid user can view invoice history.

### 5. Security checks

Verify:

- User cannot access another user's invoice by changing URL/id.
- Paid-only routes/actions check entitlement server-side.
- Stripe webhook verifies signature.
- Secret keys are not exposed client-side.
- Email endpoint validates recipient and ownership.

### 6. UX checks

Verify:

- Mobile layout is acceptable.
- Empty states are clear.
- Error messages are useful.
- Form validation works.
- PDF output meets acceptance criteria.
- Buttons are clear and not misleading.

### 7. Build/deploy checks

Run:

- Lint
- Typecheck
- Tests
- Build

Record any failures clearly.

---

## Definition of Done for Verification Agent

Verification is complete when:

- All critical user flows have been tested.
- Calculation logic is validated.
- PDF output meets all acceptance criteria.
- Security boundaries are checked.
- Paid gating is verified.
- Stripe test flow is verified or blockers are documented.
- A concise launch-readiness report is produced.

---

## Final Handover Output

The final verification agent must leave a report with:

```text
Status: Ready / Ready with minor fixes / Not ready

Critical blockers:
- ...

Minor fixes:
- ...

Verified working:
- ...

Environment variables required:
- ...

Manual launch steps:
- ...

Recommended next agent/task:
- ...
```

The final section must clearly state **what needs to be done by the following agent**.

If no further coding agent is required, the following agent should be a **Launch Agent** responsible for:

- Final copy pass
- Screenshots
- Product Hunt/Indie Hackers/Reddit launch posts
- Stripe live-mode switch checklist
- Monitoring first users
