# BUILD_SPEC.md — FreelanceOS Lead Tracker CRM + Quick Capture

**Version:** 1.1 — 4-phase agent build  
**Generated:** 2026-05-12  
**Stack:** Next.js 14 (App Router) + Tailwind CSS  
**Data layer:** `localStorage` via a single `useLeads` hook — no backend yet. Structured so Supabase can be dropped in later by swapping one file.  
**Lives at:** `/leads` — a full page inside the FreelanceOS app, accessible from a persistent top nav alongside your existing tools.

---

# Build Phases

## Phase 1 — Foundation, Data Model, Page Shell, Quick Capture, Filter Bar

**Assigned to:** Agent 1  
**Agent role:** Coder  
**Commit:** Yes  
**Push:** No

### Scope
Agent 1 owns the foundation and must implement enough for the `/leads` page to exist, create leads, persist them to `localStorage`, show stats, and filter/search the list.

### Original sections covered
- **1. Data Model**
- **2. File Structure**
- **3. Pages & Layout**
- **4. Quick Capture**
- **5. Filter Bar**
- Supporting setup for **9. `useLeads` Hook — Full API**

### Required output
- `/leads` route exists.
- Lead data model/types exist.
- `useLeads.ts` exists and persists to `localStorage`.
- Header and stats bar exist.
- Quick Capture works.
- FilterBar status tabs and search state exist.
- Export CSV button can be placeholder if Phase 3 has not implemented export yet.
- Agent commits locally and updates `AGENT_HANDOVER.md`.

---

## Phase 2 — Lead Table, Mobile Cards, Drawer, Core Actions

**Assigned to:** Agent 2  
**Agent role:** Coder  
**Commit:** Yes  
**Push:** No

### Scope
Agent 2 owns the main CRM interaction layer: desktop table, mobile cards, drawer edit flow, overdue state, delete, and core lead actions.

### Original sections covered
- **6. Lead Table**
- **7. Lead Drawer**
- Supporting implementation for **8. Status Badge Colours**

### Required output
- `LeadTable.tsx` works on desktop.
- `LeadCard.tsx` works below `md`.
- `LeadDrawer.tsx` opens from row/card actions.
- Drawer allows editing and saving.
- Cancel discards edits.
- Delete confirmation works.
- Overdue follow-ups render red with warning icon.
- Copy Email works.
- Mark as Won and Mark as Lost work.
- Generate Outreach navigates with correct query params.
- Agent commits locally and updates `AGENT_HANDOVER.md`.

---

## Phase 3 — Outreach Integration, CSV Export, Nav Badge, Final Feature Wiring

**Assigned to:** Agent 3  
**Agent role:** Coder  
**Commit:** Yes  
**Push:** No

### Scope
Agent 3 closes all feature loops that connect Lead Tracker to the rest of FreelanceOS.

### Original sections covered
- **8. Status Badge Colours**
- **9. `useLeads` Hook — Full API**
- **10. Outreach Engine Integration**
- **11. CSV Export Format**
- **12. Nav Integration**
- **13. What NOT to build in this sprint**

### Required output
- Status badge labels/classes match the spec.
- `useLeads` API matches the spec.
- CSV export works for the currently filtered view.
- Outreach page pre-fills from query params.
- After outreach generation, lead status updates to `contacted`.
- `outreachGenerated` updates to `true`.
- `lastContacted` updates to today.
- Top nav includes "Leads".
- Top nav includes overdue follow-up count badge.
- No backend/API/auth/multi-user/import/Kanban/email/calendar is added.
- Agent commits locally and updates `AGENT_HANDOVER.md`.

---

## Phase 4 — Verification, Owner Review, Acceptance Criteria

**Assigned to:** Agent 4  
**Agent role:** Verification agent  
**Commit:** Only small fixes if required  
**Push:** No

### Scope
Agent 4 verifies everything against this build spec and asks the owner to confirm completion.

### Original sections covered
- **14. Acceptance Criteria**
- Full regression over **1–13**

### Required output
- Run lint/type/build checks where available.
- Manually test the full flow.
- Verify the sprint exclusions were respected.
- Update `AGENT_HANDOVER.md` with final verification notes.
- Ask owner to confirm completion.
- Do not push.

---

# Gap Notes / Implementation Clarifications

## G1. `useLeads` filtering/sorting ambiguity
Section 9 says `leads` are "all leads, filtered/sorted by hook", but Sections 5–6 place filtering/search/sorting in UI behavior.

**Decision:** Keep the canonical list in `useLeads`. Implement active filter/search/sort in `/leads/page.tsx`, `FilterBar`, or `LeadTable`, depending on existing app patterns. Do not remove the hook API.

## G2. Client-only localStorage
`localStorage`, clipboard, and `window` access require client components.

**Decision:** Any component/hook using browser APIs must include `"use client"`.

## G3. UUID generation
The spec requires UUID-style `id`.

**Decision:** Use `crypto.randomUUID()` with fallback if needed.

## G4. Date formats
Storage wants ISO dates, date inputs need `YYYY-MM-DD`, and CSV wants `DD/MM/YYYY`.

**Decision:** Add small date helpers. Store ISO/null internally. Convert for input/display/export.

## G5. Outreach Engine linkage
The current Outreach Engine may not already use `useLeads`.

**Decision:** Reuse the same localStorage key and hook. Do not add backend routes.

## G6. `canvas-confetti`
Mark as Won requires confetti.

**Decision:** Use `canvas-confetti` if installed. If not installed, install and commit lockfile. If package install is blocked, flag it for owner/Agent 4.

## G7. Top nav overdue badge
Nav may be server-rendered.

**Decision:** Add a small client badge component if needed. It should read `freelanceos_leads` from `localStorage`.

## G8. Delete confirmation
Spec requires confirmation wording.

**Decision:** Native `window.confirm` is acceptable for MVP, but a custom dialog is preferred if fast.

## G9. Accessibility and UX
Not explicitly specified but expected.

**Decision:** Add clear button labels, sane focus states, and drawer close behavior where possible.

## G10. Existing app style
The spec does not define exact visual styling.

**Decision:** Match the existing FreelanceOS app style and component conventions.

---

# Original Build Spec — Preserved

# BUILD SPEC: FreelanceOS — Lead Tracker CRM + Quick Capture

**Version:** 1.0  
**Stack:** Next.js 14 (App Router) + Tailwind CSS  
**Data layer:** `localStorage` via a single `useLeads` hook — no backend yet. Structured so Supabase can be dropped in later by swapping one file.  
**Lives at:** `/leads` — a full page inside the FreelanceOS app, accessible from a persistent top nav alongside your existing tools.

---

## 1. Data Model

Store one JSON array in `localStorage` under the key `freelanceos_leads`.

```ts
type Lead = {
  id: string                  // uuid, generated on create
  createdAt: string           // ISO date
  updatedAt: string           // ISO date

  // Core fields
  name: string                // contact name
  company: string             // business/client name
  email: string
  source: LeadSource
  service: string             // free text, e.g. "Brand identity"
  value: number               // estimated $ value, 0 if unknown
  status: LeadStatus
  lastContacted: string | null // ISO date
  nextFollowUp: string | null  // ISO date
  notes: string

  // Outreach Engine linkage
  outreachGenerated: boolean   // true if user clicked "Generate Outreach"
}

type LeadStatus =
  | "new"
  | "contacted"
  | "replied"
  | "proposal_sent"
  | "won"
  | "lost"
  | "follow_up_later"

type LeadSource =
  | "referral"
  | "linkedin"
  | "cold_email"
  | "upwork"
  | "fiverr"
  | "inbound"
  | "other"
```

---

## 2. File Structure

```
app/
  leads/
    page.tsx              ← Lead Tracker main page
    components/
      LeadTable.tsx       ← Table with sort + filter
      LeadCard.tsx        ← Mobile card view (same data)
      LeadDrawer.tsx      ← Right-side slide-in: view + edit a lead
      QuickCapture.tsx    ← Top bar form (3 fields + Add)
      StatusBadge.tsx     ← Coloured pill for each status
      FilterBar.tsx       ← Status filter tabs + search input
    hooks/
      useLeads.ts         ← All CRUD, persists to localStorage
    lib/
      leadDefaults.ts     ← Status labels, colours, source labels
      exportLeads.ts      ← CSV export logic
```

---

## 3. Pages & Layout

### `/leads` — Main Page

**Layout (top to bottom):**

1. **Page header** — "Lead Tracker" h1 + subtitle "Your freelance pipeline" + `[+ Add Lead]` button (opens QuickCapture inline, not a modal)
2. **Stats bar** — 5 pill counters, always visible:
   - Total Leads | Active | Proposals Out | Won | Pipeline Value ($)
   - Pipeline Value = sum of `value` for all leads where status is NOT `lost`
3. **QuickCapture bar** — see Section 4
4. **FilterBar** — see Section 5
5. **LeadTable** — see Section 6
6. **LeadDrawer** — slides in from right on row click, sits over the table

---

## 4. Quick Capture

A horizontal inline form that appears below the page header when `[+ Add Lead]` is clicked. Collapses after save.

**Fields (all on one line):**
```
[Name *] [Email] [Company] [Service] [Source ▾] [Value $] [+ Add Lead] [Cancel]
```

**Behaviour:**
- Only `Name` is required. All others optional at capture time.
- On submit: creates lead with status `"new"`, `createdAt` = now, saves to localStorage, row appears at top of table, form collapses.
- Do not open the drawer after quick capture. Let user click the row to fill in details.
- `Value` field: plain number input, no currency formatting on input, display as `$X,XXX` elsewhere.
- `Source` dropdown uses the `LeadSource` enum values with human labels (e.g. `referral` → "Referral").

---

## 5. Filter Bar

Sits between QuickCapture and the table.

**Left side — Status tabs (horizontal pill tabs):**
```
All | New | Contacted | Replied | Proposal Sent | Won | Lost | Follow Up Later
```
- "All" is selected by default.
- Each tab shows a count badge of leads in that status.
- Clicking a tab filters the table. Only one tab active at a time.

**Right side:**
```
[🔍 Search by name, company, email...]  [Export CSV]
```
- Search filters in real time across `name`, `company`, `email` fields.
- Export CSV: downloads all currently filtered leads as a CSV file using `exportLeads.ts`.

---

## 6. Lead Table

Columns (desktop):

| Column | Field | Sortable |
|---|---|---|
| Name | `name` | Yes |
| Company | `company` | Yes |
| Service | `service` | No |
| Source | `source` | No |
| Value | `value` | Yes |
| Status | `status` (badge) | Yes |
| Last Contacted | `lastContacted` | Yes |
| Next Follow-Up | `nextFollowUp` | Yes |
| Actions | — | No |

**Sorting:** Click column header toggles asc/desc. Default sort: `createdAt` desc (newest first).

**Row behaviour:**
- Click anywhere on row → opens LeadDrawer.
- `nextFollowUp` date: if in the past and status is not `won`/`lost`, render in red with a ⚠ icon.
- `Actions` column: two icon buttons — `[✏ Edit]` (opens drawer) and `[🗑 Delete]` (confirm dialog: "Delete this lead? This cannot be undone." with Cancel / Delete buttons).

**Empty state:** When no leads exist, show centred message: "No leads yet. Add your first lead above." No illustration needed.

**Mobile:** Below `md` breakpoint, hide the table and render `LeadCard` components in a vertical stack instead. Each card shows: Name, Company, Status badge, Value, Next Follow-Up, and a "View" button.

---

## 7. Lead Drawer

Right-side panel, `w-[480px]`, slides in over the page with a dark overlay. Does not navigate away.

**Header:**
- Lead name (editable inline on click)
- StatusBadge (clickable dropdown to change status directly)
- `[× Close]` button top right

**Body — two sections:**

**Section 1: Details (editable form)**
```
Contact Name    [text input]
Company         [text input]
Email           [email input]
Source          [select]
Service         [text input]
Est. Value      [number input]
Last Contacted  [date input]
Next Follow-Up  [date input]
Notes           [textarea, 4 rows]
```

**Section 2: Actions**
```
[💌 Generate Outreach]   → navigates to /outreach?leadId=XXX with name, email, company, service pre-filled as query params
[📋 Copy Email]          → copies email to clipboard, shows "Copied!" for 2s
[✅ Mark as Won]         → sets status to "won", shows confetti burst (use canvas-confetti, 1.5s)
[❌ Mark as Lost]        → sets status to "lost"
```

**Footer:**
```
[Save Changes]   [Cancel]
```
- `Save Changes` updates the lead in localStorage, closes drawer.
- `Cancel` discards changes, closes drawer.
- Auto-updates `updatedAt` on every save.

---

## 8. Status Badge Colours

| Status | Label | Tailwind classes |
|---|---|---|
| `new` | New Lead | `bg-blue-100 text-blue-700` |
| `contacted` | Contacted | `bg-yellow-100 text-yellow-700` |
| `replied` | Replied | `bg-purple-100 text-purple-700` |
| `proposal_sent` | Proposal Sent | `bg-orange-100 text-orange-700` |
| `won` | Won ✓ | `bg-green-100 text-green-700` |
| `lost` | Lost | `bg-gray-100 text-gray-500` |
| `follow_up_later` | Follow Up Later | `bg-pink-100 text-pink-700` |

---

## 9. `useLeads` Hook — Full API

```ts
const {
  leads,             // Lead[] — all leads, filtered/sorted by hook
  addLead,           // (partial: Partial<Lead>) => void
  updateLead,        // (id: string, changes: Partial<Lead>) => void
  deleteLead,        // (id: string) => void
  getLead,           // (id: string) => Lead | undefined
  stats,             // { total, active, proposalsSent, won, pipelineValue }
} = useLeads()
```

- Hook reads from and writes to `localStorage` on every mutation.
- `stats` is derived from `leads` on every render — no separate store.
- `active` count = leads where status is NOT `won` or `lost`.

---

## 10. Outreach Engine Integration

When user lands on `/outreach` with query params, the Outreach Engine form must pre-fill:
```
?leadId=abc123&name=Jane+Smith&company=Acme&email=jane@acme.com&service=Brand+Identity
```

In the Outreach Engine page, on mount:
```ts
const params = useSearchParams()
// Pre-fill form fields from params if present
// After generation, if leadId is present, call updateLead(leadId, { outreachGenerated: true, status: 'contacted', lastContacted: today })
```

This closes the loop: generating outreach automatically advances the lead status.

---

## 11. CSV Export Format

Filename: `freelanceos-leads-YYYY-MM-DD.csv`

Columns in order:
```
Name, Company, Email, Source, Service, Value, Status, Last Contacted, Next Follow-Up, Notes, Created
```

- Dates formatted as `DD/MM/YYYY`.
- Value formatted as plain number (no $ sign).
- Notes: strip newlines, wrap in quotes.

---

## 12. Nav Integration

Add "Leads" to the FreelanceOS top nav between your existing tools. Use a simple pill badge on the nav item showing the count of leads with `nextFollowUp` in the past (overdue follow-ups). This is the only notification surface — no toasts, no email, no push.

---

## 13. What NOT to build in this sprint

- No authentication / user accounts
- No backend / API routes
- No multi-user / sharing
- No email sending
- No calendar integration
- No Kanban view (table only for now)
- No import (CSV export only)

---

## 14. Acceptance Criteria

- [ ] Can add a lead in under 10 seconds via Quick Capture
- [ ] Status change from drawer updates badge in table instantly (no page reload)
- [ ] Overdue follow-ups appear in red in the table
- [ ] Clicking "Generate Outreach" in drawer pre-fills the Outreach Engine form
- [ ] After outreach generation, lead status auto-advances to "Contacted"
- [ ] CSV export downloads correct data for the current filtered view
- [ ] Stats bar updates immediately on any lead change
- [ ] All data persists across page refresh
- [ ] Mobile card view renders below `md` breakpoint

