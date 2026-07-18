# AGENT_HANDOVER — FreelanceOS Quote & Package Builder (Build 5)

## What You Are Building

A pricing module with a live cost calculator and AI-powered package generator. Freelancers enter project details, see their numbers in real time, then generate three pricing tiers (Basic, Standard, Premium) plus upsell suggestions. Output is editable and saves to CRM. This is Build 5 of FreelanceOS.

---

## Project Context

```
FreelanceOS is an existing React app.
Build 1: AI Business Name + Domain Checker
Build 2: Invoice + Profit Margin Calculator
Build 3: Follow-Up System
Build 4: Brief & Scope Builder (briefs saved in CRM store)
Existing modules: Outreach Engine, CRM / Lead Tracker
This is Build 5.
```

The CRM store already has leads, projects, and optionally brief records from Build 4. Quotes attach to those same records.

---

## File Structure to Create

```
src/
  pages/
    QuoteBuilder.jsx              ← main page, two-column layout
  components/quote-builder/
    QuoteInputForm.jsx            ← left column: all input fields
    ImportFromBrief.jsx           ← button + dropdown to pull from Build 4 brief
    LiveCostCalculator.jsx        ← right column top: real-time margin breakdown
    EffectiveRateDisplay.jsx      ← colour-coded effective hourly rate
    PackageGenerator.jsx          ← trigger + loading + package cards
    PackageCard.jsx               ← individual package (Basic/Standard/Premium)
    PackageWarning.jsx            ← amber warning banner
    UpsellPanel.jsx               ← list of optional upsells
    UpsellItem.jsx                ← individual toggleable upsell
    QuoteActionsBar.jsx           ← save, use in proposal, copy, regenerate
  hooks/
    useQuoteCalculator.js         ← pure calculation logic, no API
    usePackageGenerator.js        ← calls Anthropic API
    useQuoteStorage.js            ← save/load from CRM
  utils/
    quotePromptBuilder.js         ← builds AI prompt from form state
    quoteExport.js                ← formats quote as plain text
```

---

## Step-by-Step Build Order

### Step 1 — Page Layout (`QuoteBuilder.jsx`)

```jsx
<div className="quote-builder-layout">
  <div className="quote-input-column">
    <ImportFromBrief onImport={handleBriefImport} />
    <QuoteInputForm state={formState} onChange={setFormState} />
  </div>
  <div className="quote-output-column">
    <LiveCostCalculator values={formState} />
    {packages ? (
      <PackageGenerator packages={packages} upsells={upsells} />
    ) : (
      <EmptyPackageState />
    )}
    <QuoteActionsBar ... />
  </div>
</div>
```

---

### Step 2 — Input Form (`QuoteInputForm.jsx`)

Controlled form. State shape:

```javascript
const defaultState = {
  project_type: '',
  deliverables: '',
  estimated_hours: '',
  hourly_rate: '',
  desired_margin: 20,
  buffer_pct: 15,
  complexity: 'Medium',
  timeline: '',
  client_budget: '',
  revision_allowance: 2,
}
```

Required for Generate button to enable: `project_type`, `deliverables`, `estimated_hours`, `hourly_rate`.

---

### Step 3 — Build `useQuoteCalculator.js`

Pure calculation — no API, no side effects. Call on every form state change.

```javascript
export function calculateQuote(form) {
  const hours = parseFloat(form.estimated_hours) || 0
  const rate = parseFloat(form.hourly_rate) || 0
  const margin = parseFloat(form.desired_margin) || 20
  const buffer = parseFloat(form.buffer_pct) || 15

  const labour_cost = hours * rate
  const buffer_amount = labour_cost * (buffer / 100)
  const total_cost = labour_cost + buffer_amount
  const margin_amount = total_cost * (margin / 100)
  const recommended_price = total_cost + margin_amount
  const effective_hourly = hours > 0 ? recommended_price / hours : 0

  return {
    labour_cost,
    buffer_amount,
    total_cost,
    margin_amount,
    recommended_price,
    effective_hourly
  }
}
```

---

### Step 4 — Build `LiveCostCalculator.jsx`

Renders the calculated values. Updates on every keystroke (use `useMemo` or call `calculateQuote` in render).

Display as a clean breakdown table:

```
Estimated labour cost:    $X,XXX
Buffer (15%):            +$XXX
Total cost:               $X,XXX
Profit margin (20%):     +$XXX
──────────────────────────────────
Recommended price:        $X,XXX
```

Include a slider or number input for buffer % (default 15%, range 0–30%).
Include a number input for margin % (default 20%).

---

### Step 5 — Build `EffectiveRateDisplay.jsx`

```jsx
// Props: effectiveRate (number), hourlyRate (number)
// Green if effectiveRate > hourlyRate
// Amber if effectiveRate === hourlyRate (within 5%)
// Red if effectiveRate < hourlyRate

<div className={`rate-display rate-${status}`}>
  Effective hourly rate: ${effectiveRate.toFixed(2)}/hr
</div>
```

---

### Step 6 — Build `quotePromptBuilder.js`

```javascript
export function buildQuotePrompt(form, calculated) {
  return `Generate three pricing packages and upsell suggestions for a freelance project.

Project type: ${form.project_type}
Deliverables: ${form.deliverables}
Estimated hours: ${form.estimated_hours}
Freelancer's hourly rate: $${form.hourly_rate}
Recommended minimum price: $${calculated.recommended_price.toFixed(2)}
Complexity: ${form.complexity}
Timeline: ${form.timeline || 'Flexible'}
Client budget: ${form.client_budget ? '$' + form.client_budget : 'Unknown'}
Revision allowance: ${form.revision_allowance} rounds

Return ONLY valid JSON. No markdown. No preamble. Shape:
{
  "packages": [
    {
      "name": "Basic",
      "price": number,
      "deliverables": ["string"],
      "timeline": "string",
      "revision_limit": number,
      "payment_terms": "string",
      "best_fit": "string",
      "warning": null
    },
    { ... Standard ... },
    { ... Premium ... }
  ],
  "upsells": [
    { "name": "string", "price": number, "description": "string" }
  ],
  "pricing_notes": "string"
}

Warn (set warning field) if any package price is below $${(calculated.recommended_price * 0.8).toFixed(2)}.
The Standard package should be the recommended option.`
}
```

---

### Step 7 — Build `usePackageGenerator.js`

```javascript
export async function generatePackages(form, calculated) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a freelance pricing strategist. Generate realistic, client-friendly pricing packages.
Never suggest prices below sustainable rates. Warn when underpriced. Return only valid JSON.`,
      messages: [{ role: 'user', content: buildQuotePrompt(form, calculated) }]
    })
  })

  const data = await response.json()
  const raw = data.content[0].text
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
```

Wrap in try/catch. On error: return `{ error: true, message: 'Could not generate packages. Try again.' }`.

---

### Step 8 — Build `PackageCard.jsx`

```jsx
// Props: package (object), isSelected, onSelect, onChange
// Standard card has a "Recommended" badge
// All fields editable via inline inputs/textareas
// Warning: if package.warning is non-null, render <PackageWarning message={warning} />
```

Selected state: highlighted border (use CSS variable for accent colour).

---

### Step 9 — Build `UpsellPanel.jsx` and `UpsellItem.jsx`

```jsx
// UpsellItem: checkbox toggle, name, editable price, description
// UpsellPanel: maps over upsells array, manages selected state locally
```

Selected upsells are included in the saved quote record.

---

### Step 10 — Build `ImportFromBrief.jsx`

Only renders if Build 4 briefs exist in the CRM store. Shows a "Import from Brief" button that opens a dropdown of saved briefs. On select:

```javascript
function handleBriefImport(brief) {
  setFormState(prev => ({
    ...prev,
    project_type: brief.input.project_type || prev.project_type,
    deliverables: brief.brief.key_deliverables.join(', ') || prev.deliverables,
    timeline: brief.input.timeline || prev.timeline,
  }))
}
```

If no briefs exist, hide the component entirely.

---

### Step 11 — CRM Save Logic (`useQuoteStorage.js`)

```typescript
interface QuoteRecord {
  id: string
  created_at: string
  updated_at: string
  linked_lead_id?: string
  linked_project_id?: string
  linked_brief_id?: string
  input: object
  packages: Package[]
  upsells: Upsell[]
  selected_package_name: string | null
  selected_upsells: string[]
  pricing_notes: string
}
```

Store in a top-level `quotes[]` array. Append `quote_id` to linked lead/project records.

---

### Step 12 — Actions (`QuoteActionsBar.jsx`)

```
Save Quote        → useQuoteStorage.save(quoteRecord)
                    success toast: "Quote saved to [Lead name]"

Use in Proposal   → pass selected package to Outreach Engine
                    For now: stub with alert or navigate('/outreach?quote_id=...')

Copy Quote        → clipboard: quoteExport.formatQuoteAsText(selectedPackage, selectedUpsells)

Regenerate        → confirm dialog first, then re-call generatePackages()
```

---

## Behaviours to Enforce

- Live calculator updates on every field change — no button required
- Package generation requires all required fields filled
- Regenerate always requires confirmation (overwrites all three cards)
- A package must be selected before "Use in Proposal" or "Copy Quote" is enabled
- Prices below recommended minimum always show a warning — never hide this

---

## Do Not Build (MVP Scope)

- Payment processing
- Stripe / payment link integration
- Client-facing shareable quote URL
- Quote expiry dates
- Multi-currency (AUD is default)
- Invoice generation from quote (Build 6 handles this)

---

## Definition of Done

- [ ] Live calculator updates in real-time as user types
- [ ] Effective hourly rate is colour-coded (green/amber/red)
- [ ] Three package cards generate and display correctly
- [ ] Standard package shows "Recommended" badge
- [ ] Underpriced packages show amber warning banner
- [ ] All package fields are editable after generation
- [ ] Upsell items are toggleable and price-editable
- [ ] Quote saves to CRM against lead or project
- [ ] Import from Brief pre-fills form fields correctly
- [ ] Regenerate prompts for confirmation
- [ ] Mobile layout stacks correctly
