# BUILD_SPEC — FreelanceOS Quote & Package Builder (Build 5)

## Overview

A pricing module that helps freelancers create three-tier package options from a project brief. Calculates labour cost, margin, and effective hourly rate. Suggests upsells. Outputs a structured quote that can be pushed into the proposal builder.

---

## Stack Assumptions

- React (same stack as existing FreelanceOS builds)
- Existing CRM store (leads, projects, briefs from Build 4)
- Anthropic API (`claude-sonnet-4-20250514`) for package suggestions and pricing sanity checks
- All pricing calculations are client-side — no server required

---

## Pages & Components

### 1. Quote Builder Page (`/quote-builder`)

Two-column layout on desktop, stacked on mobile.

**Left column:** Input form  
**Right column:** Generated package cards + margin calculator

---

### 2. Input Form Fields

| Field | Type | Required |
|---|---|---|
| Project type | Select / text | Yes |
| Deliverables | Textarea | Yes |
| Estimated hours | Number | Yes |
| Hourly rate (AUD) | Number | Yes |
| Desired profit margin % | Number | No (default: 20%) |
| Complexity level | Select | Yes |
| Timeline | Text | No |
| Client budget (if known) | Number | No |
| Revision allowance | Number | No (default: 2) |

**Complexity levels:** Low / Medium / High / Enterprise

**Import from Brief (Build 4 integration):** Button to pull `project_type`, `deliverables`, and `timeline` from a saved brief. Shows dropdown of saved briefs from CRM.

---

### 3. Live Cost Calculator

Displayed immediately as user types — no generate required.

**Calculated fields:**

| Field | Formula |
|---|---|
| Estimated labour cost | `hours × rate` |
| Buffer amount | `labour_cost × buffer_pct` |
| Total cost (pre-margin) | `labour_cost + buffer` |
| Profit margin amount | `total_cost × (margin / 100)` |
| **Recommended price** | `total_cost + margin_amount` |
| Effective hourly rate | `recommended_price / hours` |

**Default buffer:** 15% (user-adjustable via a slider or input)

Display all figures prominently. Colour-code effective hourly rate: green if above user's hourly rate, amber if equal, red if below.

---

### 4. Package Generator

Triggered by "Generate Packages" button. Calls AI with full form context.

Generates three package cards:

| Package | Position |
|---|---|
| Basic | Entry-level, reduced scope |
| Standard | Core deliverables, recommended |
| Premium | Full scope + extras, highest value |

**Each card displays:**

| Field | Description |
|---|---|
| Package name | Basic / Standard / Premium |
| Price | Editable after generation |
| Deliverables | List, editable |
| Timeline | String |
| Revision limit | Number |
| Payment terms | Text (e.g. "50% upfront, 50% on delivery") |
| Best-fit client type | Short description |

**Standard package is visually highlighted** as the recommended option.

---

### 5. Upsell Suggestions

Below the three packages, AI returns a list of optional upsell items.

Default upsell categories:
- Rush delivery
- Monthly maintenance / support
- Extra revision rounds
- Analytics / reporting
- Training / handover session
- Documentation
- Ongoing retainer

Each upsell shows: name, suggested price, short description. User can toggle on/off and edit price.

---

### 6. Pricing Warnings

AI must flag if:
- Any package price appears below sustainable cost (price < recommended_price × 0.8)
- Scope appears too broad for the quoted price
- Client budget is significantly below recommended price

Warnings appear as inline amber banners beneath the relevant package card.

---

### 7. Actions

- **Save Quote** — saves to CRM against linked lead/project
- **Use in Proposal** — passes selected package to Outreach Engine / Proposal Builder
- **Copy Quote** — copies selected package as plain text
- **Regenerate** — re-runs AI (with confirmation)

---

## AI Prompt Spec

**System prompt:**

```
You are a freelance pricing strategist. Given project details, generate three pricing packages
(Basic, Standard, Premium) and upsell suggestions. Be realistic — do not suggest prices
below sustainable rates. Warn if scope seems underpriced. Write in client-friendly language.
Return only valid JSON.
```

**User prompt payload:**

```json
{
  "project_type": "string",
  "deliverables": "string",
  "estimated_hours": number,
  "hourly_rate": number,
  "recommended_price": number,
  "complexity": "string",
  "timeline": "string",
  "client_budget": number | null,
  "revision_allowance": number
}
```

**Expected JSON response:**

```json
{
  "packages": [
    {
      "name": "Basic" | "Standard" | "Premium",
      "price": number,
      "deliverables": ["string"],
      "timeline": "string",
      "revision_limit": number,
      "payment_terms": "string",
      "best_fit": "string",
      "warning": "string | null"
    }
  ],
  "upsells": [
    {
      "name": "string",
      "price": number,
      "description": "string"
    }
  ],
  "pricing_notes": "string"
}
```

---

## Data Model

### Saved Quote Record

```typescript
interface QuoteRecord {
  id: string
  created_at: string
  updated_at: string
  linked_lead_id?: string
  linked_project_id?: string
  linked_brief_id?: string
  input: QuoteInput
  packages: Package[]
  upsells: Upsell[]
  selected_package_name: 'Basic' | 'Standard' | 'Premium' | null
  selected_upsells: string[]
  pricing_notes: string
}
```

---

## UI States

| State | Behaviour |
|---|---|
| Form filling | Live cost calculator updates in real time |
| Before generation | Package area shows "Generate packages to see options" |
| Generating | Loading spinner in package area |
| Output ready | Three package cards render, Standard highlighted |
| Warning present | Amber banner below affected package |
| Package selected | Card gets selected state border |
| Saved | Success toast with CRM record name |

---

## MVP Constraints

- All calculations are client-side only
- No payment processing
- No invoice generation from quote (Build 6 handles invoices)
- No client-facing quote URL / shareable link
- "Use in Proposal" can be a stub if Outreach Engine integration is not yet complete

---

## Success Criteria

- [ ] Live calculator updates in real-time as user types
- [ ] Effective hourly rate is colour-coded correctly
- [ ] Three package cards generate from AI
- [ ] Pricing warnings appear when packages are underpriced
- [ ] All package fields are editable after generation
- [ ] Upsell items are selectable and editable
- [ ] Quote saves correctly to CRM
- [ ] Import from brief pre-fills relevant fields
- [ ] Mobile layout is usable
