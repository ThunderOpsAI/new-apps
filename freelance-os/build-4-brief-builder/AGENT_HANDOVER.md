# AGENT_HANDOVER — FreelanceOS Brief & Scope Builder (Build 4)

## What You Are Building

A two-panel module: left side is an input form for rough client notes, right side is an AI-generated project brief and scope of work. All output is editable. Output saves to the CRM. This is Build 4 of FreelanceOS.

---

## Project Context

```
FreelanceOS is an existing React app.
Build 1: AI Business Name + Domain Checker
Build 2: Invoice + Profit Margin Calculator
Build 3: Follow-Up System (may or may not be complete)
Existing modules: Outreach Engine, CRM / Lead Tracker
This is Build 4.
```

Assume CRM has leads and projects. Brief records will be attached to them.

---

## File Structure to Create

```
src/
  pages/
    BriefBuilder.jsx              ← main page, two-column layout
  components/brief-builder/
    BriefInputForm.jsx            ← left column: all input fields
    ProjectTypeSelect.jsx         ← dropdown: project type options
    ToneSelect.jsx                ← dropdown: tone preference
    CRMLinkSelect.jsx             ← optional: link to existing lead/project
    BriefOutputPanel.jsx          ← right column: AI output sections
    BriefSection.jsx              ← reusable: collapsible section with editable content
    EditableList.jsx              ← reusable: add/remove/edit list items
    BriefActionsBar.jsx           ← save, copy, export, regenerate buttons
  hooks/
    useBriefGenerator.js          ← calls Anthropic API, handles JSON parse
    useBriefStorage.js            ← save/load from CRM store
  utils/
    briefPromptBuilder.js         ← builds prompt from form state
    briefExport.js                ← formats brief as plain text for clipboard/print
```

---

## Step-by-Step Build Order

### Step 1 — Page Layout (`BriefBuilder.jsx`)

```jsx
<div className="brief-builder-layout">
  <div className="brief-input-column">
    <BriefInputForm onSubmit={handleGenerate} loading={loading} />
  </div>
  <div className="brief-output-column">
    {output ? <BriefOutputPanel data={output} /> : <EmptyOutputState />}
  </div>
</div>
```

On mobile: `flex-direction: column`. Input form appears first. Output appears below after generation.

### Step 2 — Input Form (`BriefInputForm.jsx`)

Required fields to enable Generate button:
- `client_name` (text)
- `project_type` (select)
- `client_goal` (textarea)

Optional fields:
- `known_requirements` (textarea)
- `budget` (text)
- `timeline` (text)
- `notes` (textarea, larger — this is where transcripts go)
- `tone` (select)
- `crm_link` — dropdown of existing CRM leads/projects

Validation: Generate button disabled if `client_goal` or `project_type` is empty.

### Step 3 — Build `briefPromptBuilder.js`

```javascript
export function buildBriefPrompt(input) {
  return `Generate a structured project brief and scope of work for the following client engagement.

Client: ${input.client_name}
Project type: ${input.project_type}
Client goal: ${input.client_goal}
Known requirements: ${input.known_requirements || 'Not provided'}
Budget: ${input.budget || 'Not specified'}
Timeline: ${input.timeline || 'Not specified'}
Tone/style: ${input.tone || 'Professional'}
Notes / transcript:
${input.notes || 'None provided'}

Return ONLY a JSON object. No markdown. No preamble. Use this exact shape:
{
  "brief": {
    "project_summary": "string",
    "client_problem": "string",
    "desired_outcome": "string",
    "key_deliverables": ["string"],
    "assumptions": ["string"],
    "missing_information": ["string"],
    "questions_to_ask": ["string"],
    "risks": ["string"],
    "recommended_next_step": "string"
  },
  "scope": {
    "in_scope": ["string"],
    "out_of_scope": ["string"],
    "milestones": ["string"],
    "client_responsibilities": ["string"],
    "acceptance_criteria": ["string"],
    "revision_limits": "string"
  }
}`
}
```

### Step 4 — Build `useBriefGenerator.js`

```javascript
export async function generateBrief(input) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are an experienced freelance project manager helping structure client briefs.
Turn rough notes into a clear project brief and scope. Flag vague requirements.
Highlight missing info. Never invent details not provided. Write in plain, practical language.
Do not use legal language. Return only valid JSON — no markdown, no preamble.`,
      messages: [{ role: 'user', content: buildBriefPrompt(input) }]
    })
  })

  const data = await response.json()
  const raw = data.content[0].text
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
```

Wrap in try/catch. On JSON parse error, return `{ error: 'Failed to parse AI output. Please try again.' }`.

### Step 5 — Build `BriefOutputPanel.jsx`

Renders two sections using `BriefSection` component:

**Section A — Project Brief:**
- `project_summary` → paragraph field
- `client_problem` → paragraph field
- `desired_outcome` → paragraph field
- `key_deliverables` → `EditableList`
- `assumptions` → `EditableList`
- `missing_information` → `EditableList` with amber highlight if array is non-empty
- `questions_to_ask` → `EditableList`
- `risks` → `EditableList` with amber highlight if non-empty
- `recommended_next_step` → paragraph field

**Section B — Scope of Work:**
- `in_scope` → `EditableList`
- `out_of_scope` → `EditableList`
- `milestones` → `EditableList`
- `client_responsibilities` → `EditableList`
- `acceptance_criteria` → `EditableList`
- `revision_limits` → paragraph field

All fields editable after render. Local state only until saved.

### Step 6 — Build `BriefSection.jsx`

```jsx
// Collapsible section with header and content slot
// Props: title, children, highlight (boolean, adds amber border)
// Default: expanded
```

### Step 7 — Build `EditableList.jsx`

```jsx
// Props: items (string[]), onChange (fn)
// Renders each item as an input
// Add button appends empty item
// Remove (×) button on each item
// Reorder optional — not required for MVP
```

### Step 8 — Build `BriefActionsBar.jsx`

Buttons and their behaviour:

```
Save to CRM     → calls useBriefStorage.save(briefRecord)
                  shows success toast with linked record name

Copy Brief      → clipboard: formatBriefAsText(output.brief)
Copy Scope      → clipboard: formatScopeAsText(output.scope)

Export / Print  → window.print()
                  brief-output-column has print-specific CSS

Regenerate      → confirm dialog: "This will overwrite your current output."
                  on confirm: re-calls generateBrief() with same input

Use in Proposal → stub button for now (Build 5 integration)
                  passes: { client_name, project_type, brief, scope }
                  to proposal builder via shared state or URL param
```

### Step 9 — Build `briefExport.js`

```javascript
export function formatBriefAsText(brief) {
  return [
    `PROJECT BRIEF`,
    ``,
    `Summary: ${brief.project_summary}`,
    `Client Problem: ${brief.client_problem}`,
    `Desired Outcome: ${brief.desired_outcome}`,
    ``,
    `Key Deliverables:`,
    ...brief.key_deliverables.map(d => `  - ${d}`),
    // ... etc
  ].join('\n')
}
```

### Step 10 — CRM Save Logic (`useBriefStorage.js`)

```typescript
interface BriefRecord {
  id: string
  created_at: string
  updated_at: string
  linked_lead_id?: string
  linked_project_id?: string
  input: BriefInput
  brief: BriefOutput
  scope: ScopeOutput
}
```

Store in CRM data store. If linked to a lead, append `brief_id` to the lead record. If standalone, store in a top-level `briefs[]` array.

---

## Print CSS

Add a `@media print` block that:
- Hides the input column
- Hides the actions bar
- Shows only `BriefOutputPanel` at full width
- Removes collapsible behaviour (all sections expanded)

---

## Behaviours to Enforce

- Output never auto-saves — always requires explicit user action
- Regenerate always shows a confirmation dialog first
- `missing_information` and `risks` sections should be visually distinct (amber/warning colour) when non-empty
- Brief never presents itself as a legal document — add a small footer disclaimer: "This brief is a working document, not a legal contract."

---

## Do Not Build (MVP Scope)

- Server-side PDF generation
- Brief version history
- Client-facing brief sharing link
- Brief templates library
- Multi-language support
- Auto-save

---

## Definition of Done

- [ ] Brief generates from client goal + project type minimum
- [ ] All output sections are editable inline
- [ ] Missing information fields are visually highlighted when present
- [ ] Brief saves correctly to linked CRM lead or project
- [ ] Copy brief and copy scope write correct plain text to clipboard
- [ ] Print / export produces clean output
- [ ] Regenerate prompts for confirmation before overwriting
- [ ] Mobile layout stacks correctly and is usable
- [ ] No legal language appears in any generated output
