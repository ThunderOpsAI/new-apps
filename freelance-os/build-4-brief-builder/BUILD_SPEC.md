# BUILD_SPEC — FreelanceOS Brief & Scope Builder (Build 4)

## Overview

A structured input form + AI output module that converts rough client notes into a clean project brief and scope of work. The output is editable, saveable to the CRM, and reusable in proposals. Designed for freelancers who need to go from vague client conversation to proposal-ready clarity fast.

---

## Stack Assumptions

- React (same stack as existing FreelanceOS builds)
- Existing CRM data store (leads, clients, projects)
- Anthropic API (`claude-sonnet-4-20250514`) for brief generation
- PDF/text export via browser print or clipboard (no server-side PDF in MVP)

---

## Pages & Components

### 1. Brief Builder Page (`/brief-builder`)

Two-column layout on desktop, stacked on mobile.

**Left column: Input form**
**Right column: AI-generated output (appears after generation)**

---

### 2. Input Form Fields

| Field | Type | Required |
|---|---|---|
| Client / business name | Text | Yes |
| Project type | Select | Yes |
| Client goal | Textarea | Yes |
| Known requirements | Textarea | No |
| Budget (if known) | Text / number | No |
| Timeline (if known) | Text | No |
| Notes / transcript | Textarea (large) | No |
| Tone / style preference | Select | No |

**Project type options:**
Website, Mobile App, Branding, Copywriting, SEO, Social Media, Marketing Campaign, Automation, Consulting, Other

**Tone options:** Professional, Conversational, Technical, Creative

**Link to CRM (optional):** Dropdown to associate with an existing lead or project. If selected, prefills Client name.

---

### 3. AI Brief Output Panel

Rendered as collapsible, editable sections after generation.

#### Section A: Project Brief

| Output field | Description |
|---|---|
| Project summary | 2–3 sentence overview |
| Client problem | What pain they're solving |
| Desired outcome | What success looks like for them |
| Key deliverables | Bullet list |
| Assumptions | What we're assuming to be true |
| Missing information | Gaps detected in the input |
| Questions to ask client | Numbered list of clarifying questions |
| Risks / red flags | Anything that could cause problems |
| Recommended next step | Single clear action |

#### Section B: Scope of Work

| Output field | Description |
|---|---|
| In-scope items | What is included |
| Out-of-scope items | What is explicitly excluded |
| Milestones | Suggested phases / checkpoints |
| Client responsibilities | What the client must provide or do |
| Acceptance criteria | How completion is defined |
| Revision limits | Suggested revision rounds |

---

### 4. Actions Bar (below output)

- **Save to CRM** — saves brief JSON against selected lead/project
- **Copy Brief** — copies Section A to clipboard as plain text
- **Copy Scope** — copies Section B to clipboard as plain text
- **Export / Print** — triggers browser print dialog (print-optimised CSS)
- **Use in Proposal** — passes brief data to Outreach Engine / Proposal Builder (future build hook)
- **Regenerate** — re-calls AI with same inputs, overwrites output (with confirmation)

---

## AI Prompt Spec

**System prompt:**

```
You are an experienced freelance project manager helping structure client briefs.
Your job is to turn rough notes into a clear, professional project brief and scope of work.
Flag vague requirements. Highlight missing information. Never invent details not provided.
Write in plain, practical language — not legal or overly formal.
Do not claim to provide legal advice.
```

**Output format instruction (in user prompt):**

Return a JSON object with two top-level keys: `brief` and `scope`. Each key contains an object with the fields listed. Use arrays for list fields. Return only the JSON — no preamble, no markdown fences.

**User prompt payload:**

```json
{
  "client_name": "string",
  "project_type": "string",
  "client_goal": "string",
  "known_requirements": "string",
  "budget": "string or null",
  "timeline": "string or null",
  "notes": "string",
  "tone": "string"
}
```

**Expected JSON response shape:**

```json
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
}
```

---

## Data Model

### Saved Brief Record

```typescript
interface ProjectBrief {
  id: string
  created_at: string                // ISO date
  updated_at: string
  linked_lead_id?: string
  linked_project_id?: string
  input: BriefInput
  brief: BriefOutput
  scope: ScopeOutput
}

interface BriefInput {
  client_name: string
  project_type: string
  client_goal: string
  known_requirements: string
  budget?: string
  timeline?: string
  notes?: string
  tone?: string
}
```

Briefs are stored in the CRM data store under the relevant lead or project. If no CRM record is linked, brief is stored as a standalone record.

---

## UI States

| State | Behaviour |
|---|---|
| Form empty | Generate button disabled |
| Form has client goal + project type | Generate button enabled |
| Generating | Full-panel loading state, spinner, "Structuring your brief..." |
| Output ready | Sections appear, all fields editable inline |
| Missing info detected | "Missing Information" section highlighted in amber |
| Saved | "Saved to [Lead/Project name]" success toast |
| Export | Browser print dialog opens |

---

## Editable Output Requirement

All AI-generated fields must be editable after generation. Use:
- Textarea for paragraph fields
- Editable list items for array fields (add / remove / reorder)

Edits are local state until the user clicks "Save to CRM."

---

## MVP Constraints

- No server-side PDF generation — browser print only
- No auto-save (explicit save action required)
- No multi-brief comparison
- "Use in Proposal" button renders but may be a stub if Proposal Builder (Build 5) is not yet complete
- No legal contract language — output must never be presented as a legal document

---

## Success Criteria

- [ ] Brief generates from minimal input (client goal + project type)
- [ ] Missing information is clearly flagged in output
- [ ] All output sections are editable
- [ ] Brief saves correctly to a CRM lead or project
- [ ] Copy brief and copy scope both work
- [ ] Export / print produces clean, readable output
- [ ] Mobile layout is usable (form stacks above output)
