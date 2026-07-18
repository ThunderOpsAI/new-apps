# Build Spec — Invoice + Profit Margin Calculator Micro-SaaS

## 1. Product Summary

**Product name:** Invoice + Profit Margin Calculator  
**Build type:** Micro-SaaS utility  
**Target launch:** Week 1, after Business Name + Domain Checker  
**Primary users:** Freelancers, solo operators, ecommerce sellers, dropshippers, small service businesses  
**Goal:** Ship a simple paid tool that helps users calculate margins, generate professional invoices, export branded PDFs, and optionally email invoices to clients.

This product should be fast, practical, and monetisable quickly. It does not need heavy AI. The first version should prioritise clean UX, accurate calculations, professional PDF output, Stripe payment gating, and a simple path to revenue.

---

## 2. Core Problem

Freelancers and small sellers often need to quickly answer:

- What should I charge?
- What profit will I actually make after costs and fees?
- What is my margin percentage?
- Can I create a professional invoice immediately?
- Can I export/send that invoice without using bloated accounting software?

Existing accounting tools are overkill. This build should feel like a lightweight one-page utility with a paid upgrade.

---

## 3. MVP Scope

### 3.1 Required User Flow

1. User opens landing page.
2. User chooses either:
   - **Invoice Generator**, or
   - **Profit Margin Calculator**.
3. User enters business/job/product details.
4. System calculates subtotal, cost, fees, profit, margin, and markup.
5. User previews invoice or margin report.
6. User can export a basic result for free.
7. Paid users can:
   - generate branded PDF invoices,
   - save invoice history,
   - email invoice to client,
   - remove watermark,
   - access unlimited generations.

---

## 4. Features

## 4.1 Landing Page

### Must include

- Clear headline: fast invoice + margin calculator for freelancers and sellers.
- Primary CTA: **Create Invoice**.
- Secondary CTA: **Calculate Margin**.
- Simple pricing section.
- Use cases:
  - Freelancers
  - Dropshippers
  - Service businesses
  - Small ecommerce sellers
- Trust copy: no accounting setup required.

### Suggested pricing copy

- Free: basic calculator + watermarked invoice preview.
- Pro: $9/month or $9 one-off launch deal.
- Pro includes branded PDFs, unlimited invoices, email sending, saved history.

---

## 4.2 Invoice Generator

### Required fields

#### Business details

- Business name
- ABN/company number optional
- Email
- Phone optional
- Address optional
- Logo upload optional for paid users only

#### Client details

- Client name
- Client email
- Client address optional

#### Invoice details

- Invoice number
- Issue date
- Due date
- Currency
- Payment terms
- Notes

#### Line items

Each line item must support:

- Description
- Quantity
- Unit price
- Cost per unit optional
- Tax/GST toggle or percentage

### Calculations

For each line item:

```text
Revenue = quantity × unit price
Cost = quantity × cost per unit
Gross Profit = Revenue - Cost
Margin % = Gross Profit / Revenue × 100
Markup % = Gross Profit / Cost × 100
```

Invoice totals:

```text
Subtotal = sum line revenue
Tax = subtotal × tax rate
Total = subtotal + tax
Total Cost = sum line cost
Total Profit = subtotal - total cost
Overall Margin % = total profit / subtotal × 100
```

### UX requirements

- Add/remove line items dynamically.
- Totals update live.
- Validation for empty/invalid values.
- Support decimal currency values.
- Clean invoice preview panel.

---

## 4.3 Profit Margin Calculator

### Required modes

#### Mode A — Sell Price Known

Inputs:

- Sell price
- Product/service cost
- Platform/payment fee percentage
- Fixed fee optional
- Shipping/fulfilment cost optional
- Tax/GST optional

Outputs:

- Net revenue
- Total cost
- Gross profit
- Net profit
- Margin percentage
- Markup percentage
- Suggested status:
  - Strong margin
  - Acceptable margin
  - Weak margin
  - Losing money

#### Mode B — Target Margin

Inputs:

- Cost
- Desired margin percentage
- Fees/shipping optional

Output:

- Suggested minimum sell price
- Suggested rounded sell price
- Expected profit

Formula:

```text
Required Sell Price = total cost / (1 - target margin)
```

Adjust for fees where needed.

---

## 4.4 PDF Export

### PDF library

Use **`@react-pdf/renderer`**. Do not use Playwright or any server-side headless browser for PDF generation. This keeps the stack simple and avoids infrastructure overhead at launch.

### PDF acceptance criteria

A generated invoice PDF must meet all of the following to pass QA:

- Business name renders correctly
- Client name and client email render correctly
- All line items render with description, quantity, unit price, and line total
- Subtotal, tax, and total render correctly
- Due date renders correctly
- Layout is legible at A4 size (210mm × 297mm)
- No content is clipped or overflows the page boundary
- Watermark text ("Generated with [Product Name]") is visible on free-user PDFs
- Watermark is absent on paid-user PDFs

### Free user

- Can preview invoice.
- Can download watermarked PDF.
- Watermark: "Generated with [Product Name]".

### Paid user

- No watermark.
- Custom business branding.
- Optional logo.
- Professional PDF layout.

---

## 4.5 Email Sending

### Paid-only feature

User can send invoice to client email.

Required:

- Recipient email
- Subject
- Short message
- Attached/generated invoice PDF or secure download link

**Email provider: Resend.** Use Resend for all transactional email. Do not use any other provider.

Email template should be simple and professional.

---

## 4.6 Auth + Payments

### Auth

Use whichever auth stack already exists in the repo. Preferred:

- Supabase Auth, or
- NextAuth if already configured.

### Payments

Use Stripe.

Required pricing logic:

- Free users: limited functionality.
- Paid users: unlimited/branded/email/saved history.

Minimum Stripe requirements:

- Checkout session route.
- Webhook route.
- User entitlement stored in DB.
- Server-side check for paid-only actions.

Do not rely only on frontend checks.

---

## 4.7 Saved History

Paid users should be able to save generated invoices.

### Required invoice history fields

- User ID
- Invoice ID
- Client name
- Client email
- Invoice number
- Total amount
- Profit amount
- Margin percentage
- Status: draft/sent/paid/manual
- Created date
- Updated date

This does not need full accounting reconciliation in MVP.

---

## 5. Suggested Database Tables

### `users` / `profiles`

Use existing user system where possible.

### `subscriptions` or `entitlements`

```sql
id
user_id
stripe_customer_id
stripe_subscription_id
plan
status
current_period_end
created_at
updated_at
```

### `invoices`

```sql
id
user_id
invoice_number
business_name
business_email
client_name
client_email
currency
issue_date
due_date
subtotal
tax_total
total
total_cost
total_profit
margin_percentage
status
notes
created_at
updated_at
```

### `invoice_items`

```sql
id
invoice_id
description
quantity
unit_price
unit_cost
tax_rate
line_total
line_cost
line_profit
margin_percentage
created_at
```

---

## 6. Pages / Routes

Suggested app structure:

```text
/
/pricing
/invoice
/margin-calculator
/dashboard
/dashboard/invoices
/dashboard/invoices/[id]
/api/invoices
/api/invoices/[id]
/api/pdf/invoice/[id]
/api/send-invoice
/api/stripe/checkout
/api/stripe/webhook
```

If the project already uses a different route structure, follow the existing convention.

---

## 7. Non-Functional Requirements

### Performance

- Calculator updates should feel instant.
- PDF generation should complete within a few seconds.

### Reliability

- Calculations must be deterministic and unit-tested.
- PDF generation errors must be handled clearly.
- Email sending failures must return useful messages.

### Security

- Users can only access their own invoices.
- Paid-only features must be enforced server-side.
- Stripe webhook signature must be verified.
- Do not expose secret keys to frontend.

### Privacy

- Invoice/client data should be treated as business-sensitive.
- Add simple privacy copy if deploying publicly.

---

## 8. Testing Requirements

### Unit tests

Required for:

- Margin calculation
- Markup calculation
- Target price calculation
- Tax calculation
- Invoice total calculation

### Manual QA

Verify:

- Free user can calculate margin.
- Free user can preview invoice.
- Free user cannot remove watermark.
- Paid user can generate clean PDF.
- Paid user can save invoice.
- Paid user can email invoice.
- Invalid inputs show clear errors.
- Stripe checkout works in test mode.
- Stripe webhook updates entitlement.

---

## 9. Launch Checklist

- [ ] Landing page live
- [ ] Invoice generator working
- [ ] Margin calculator working
- [ ] PDF export working (via @react-pdf/renderer)
- [ ] Stripe checkout working
- [ ] Stripe webhook working
- [ ] Paid entitlement enforced server-side
- [ ] Email sending working (via Resend)
- [ ] Basic dashboard/invoice history working
- [ ] Privacy/terms pages linked
- [ ] Analytics installed
- [ ] Error logging installed or prepared
- [ ] Product tested on desktop and mobile

---

## 10. Out of Scope for MVP

Do not build these yet:

- Full bookkeeping/accounting system
- Bank feed integrations
- Xero/QuickBooks integration
- Recurring invoices
- Automatic payment reminders
- Invoice payment processing inside the invoice
- Multi-user teams
- Advanced tax rules by country
- Inventory management

These can become later upsells.

---

## 11. Success Metrics

### Week 1 success

- Product deployed publicly.
- Stripe payment flow functional.
- At least one real user generates an invoice or margin report.
- At least one launch post published.

### Revenue target

- Short-term: first paid user within 48 hours of launch.
- Week 1 target: $300–$800 combined MRR/revenue across Week 1 tools.

### Product metrics

- Visitor → calculation completion rate
- Calculation → invoice preview rate
- Preview → PDF export rate
- Free → paid conversion rate
- Checkout completion rate

---

## 12. Recommended Build Order

### Phase 1 — Core Calculator + Invoice UI

- Build landing page.
- Build margin calculator.
- Build invoice form.
- Build live invoice preview.
- Add calculation utility functions and tests.

### Phase 2 — PDF, Auth, Save, Stripe

- Add auth.
- Add DB tables.
- Add invoice saving.
- Add PDF export via @react-pdf/renderer.
- Add Stripe checkout + webhook.
- Gate paid features server-side.
- Integrate Resend for email sending.

### Phase 3 — Verification, Polish, Launch Prep

- Test all core flows.
- Fix bugs.
- Validate calculations against PDF acceptance criteria.
- Improve mobile UI.
- Add empty/error/loading states.
- Prepare launch copy and screenshots.
