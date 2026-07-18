# AGENT_HANDOVER.md — FreelanceOS Lead Tracker CRM + Quick Capture

**Version:** 1.0  
**Generated:** 2026-05-12  
**Project:** FreelanceOS  
**Feature:** Lead Tracker CRM + Quick Capture  
**Main route:** `/leads`

---

## Global Agent Rules

- Read `BUILD_SPEC.md` first.
- Read this handover second.
- Work only on your assigned phase unless fixing a direct blocker.
- Preserve the original scope.
- Do not remove requirements.
- Do not build excluded features.
- Agents 1–3 must commit locally.
- Agents 1–3 must push nothing.
- Agent 4 verifies with the owner on completion.
- Agent 4 must push nothing unless the owner explicitly instructs otherwise.
- Update this handover before finishing your phase.

Recommended start commands:

```bash
git status
git branch --show-current
ls
find app -maxdepth 4 -type f | sort
cat BUILD_SPEC.md
cat AGENT_HANDOVER.md
```

---

# Phase 1 — Agent 1 Handover

## Start Brief

You are Agent 1 for the FreelanceOS Lead Tracker CRM build.

Your job is Phase 1 only: foundation, data model, page shell, Quick Capture, Filter Bar, and the first working version of `useLeads`.

Do not push. Commit locally when done.

## Read first
1. `BUILD_SPEC.md`
2. Existing app navigation/layout files
3. Existing `/outreach` page if present
4. Existing component/style conventions

## Build scope
Implement:
- `/leads/page.tsx`
- `app/leads/components/QuickCapture.tsx`
- `app/leads/components/FilterBar.tsx`
- `app/leads/hooks/useLeads.ts`
- `app/leads/lib/leadDefaults.ts`
- Any needed local types/helpers

## Must work before handoff
- `/leads` loads.
- User can open Quick Capture.
- User can add a lead with only name.
- Lead saves to `localStorage` key `freelanceos_leads`.
- Lead remains after refresh.
- Stats bar updates after add.
- Status tabs and search input exist.
- Basic filtered list state is available for Agent 2.

## Commit
```bash
git add .
git commit -m "phase-1: add lead tracker foundation and quick capture"
```

## Handoff to Agent 2
Agent 2 should continue by building the table, mobile cards, drawer, status badge, overdue styling, and row actions.

## Phase 1 Completion Notes
- Branch: `main`
- Commit: Local Phase 1 commit created with message `phase-1: add lead tracker foundation and quick capture`
- Files created/changed:
  - `app/globals.css`
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/leads/page.tsx`
  - `app/leads/components/QuickCapture.tsx`
  - `app/leads/components/FilterBar.tsx`
  - `app/leads/hooks/useLeads.ts`
  - `app/leads/lib/leadDefaults.ts`
  - `package.json`
  - `tsconfig.json`
  - `next.config.ts`
  - `eslint.config.mjs`
  - `next-env.d.ts`
  - `.gitignore`
- What works:
  - A minimal Next.js app now exists in this workspace with `/` and `/leads`.
  - `/leads` renders a page header, stats bar, Quick Capture form, FilterBar, and a simple lead list.
  - `useLeads` persists to `localStorage` under `freelanceos_leads` and exposes `leads`, `addLead`, `updateLead`, `deleteLead`, `getLead`, and `stats`.
  - Quick Capture supports Name, Email, Company, Service, Source, and Value. Only Name is required. New leads save with status `new`, `createdAt`, and `updatedAt`, then the form collapses without opening any drawer.
  - Lead filtering state exists for status tabs and search by name/company/email.
  - The current list is intentionally simple and leaves clean extension points for `LeadTable`, `LeadCard`, `LeadDrawer`, and `StatusBadge`.
- Known issues:
  - No existing FreelanceOS app was present in this workspace, so Phase 1 includes a fresh minimal shell rather than integrating into pre-existing navigation or styling.
  - `Export CSV` is a Phase 3 placeholder only.
  - No drawer, desktop table, or mobile card UI exists yet by design; those are reserved for Agent 2.
- Recommended next step:
  - Agent 2 should replace the temporary list area with `LeadTable` and `LeadCard`, add `StatusBadge` and `LeadDrawer`, and wire row/card interactions to editing, delete confirmation, and status actions.

---

# Phase 2 — Agent 2 Handover

## Start Brief

You are Agent 2 for the FreelanceOS Lead Tracker CRM build.

Agent 1 should have created the `/leads` foundation, localStorage hook, Quick Capture, stats, and FilterBar. Your job is to implement the main CRM interaction layer.

Do not push. Commit locally when done.

## Read first
1. `BUILD_SPEC.md`
2. `AGENT_HANDOVER.md`
3. Agent 1 completion notes
4. Current `/leads` files

## Build scope
Implement:
- `app/leads/components/StatusBadge.tsx`
- `app/leads/components/LeadTable.tsx`
- `app/leads/components/LeadCard.tsx`
- `app/leads/components/LeadDrawer.tsx`
- Sorting behavior
- Delete confirmation
- Overdue follow-up red/warning state
- Drawer edit/save/cancel
- Drawer action buttons

## Must work before handoff
- Desktop table displays leads.
- Mobile card view displays below `md`.
- Row/card can open drawer.
- Drawer edits save correctly.
- Cancel discards changes.
- Status changes update table instantly.
- Delete confirmation works.
- Overdue follow-ups show red with ⚠.
- Copy Email copies email and shows `"Copied!"`.
- Mark as Won sets `won`.
- Mark as Lost sets `lost`.
- Generate Outreach navigates to `/outreach` with query params.

## Commit
```bash
git add .
git commit -m "phase-2: add lead table mobile cards and drawer"
```

## Handoff to Agent 3
Agent 3 should close feature loops: CSV export, outreach prefill/status update, nav integration, overdue badge, and final hook/spec alignment.

## Phase 2 Completion Notes
- Branch: `main`
- Commit: Pending local commit with message `phase-2: add lead table mobile cards and drawer`
- Files created/changed:
  - `app/globals.css`
  - `app/leads/page.tsx`
  - `app/leads/lib/leadDefaults.ts`
  - `app/leads/components/StatusBadge.tsx`
  - `app/leads/components/LeadTable.tsx`
  - `app/leads/components/LeadCard.tsx`
  - `app/leads/components/LeadDrawer.tsx`
  - `package.json`
  - `package-lock.json`
- What works:
  - Desktop leads now render in `LeadTable` with sortable Name, Company, Value, Status, Last Contacted, and Next Follow-Up columns.
  - Mobile leads now render as stacked `LeadCard` components below the `md` breakpoint with View and Delete actions.
  - Clicking a table row, edit action, or mobile View opens `LeadDrawer`.
  - Drawer edits stay local until `Save Changes`; `Cancel` closes the drawer and discards unsaved edits.
  - Status changes from the drawer persist immediately through the status dropdown, `Mark as Won`, and `Mark as Lost`, so the list updates instantly.
  - Overdue follow-ups render in red with a `⚠` marker on both table rows and mobile cards.
  - Delete confirmation uses the required native confirmation message and closes the drawer if the deleted lead was open.
  - `Copy Email` uses the clipboard API and swaps to `Copied!` for 2 seconds.
  - `Generate Outreach` navigates to `/outreach` with `leadId`, `name`, `company`, `email`, and `service` query params.
  - `canvas-confetti` is installed and used for the `Mark as Won` action.
  - Checks passed: `npm run lint`, `npm run typecheck`, `npm run build`.
- Known issues:
  - `/outreach` prefill and lead status advancement after generation are still Phase 3 work.
  - The status dropdown persists status changes immediately by design to satisfy the instant-update requirement, while the rest of the drawer form remains save/cancel based.
- Recommended next step:
  - Agent 3 should implement CSV export, build the `/outreach` query-param consumption and post-generation lead updates, then add the nav overdue badge and final spec alignment.

---

# Phase 3 — Agent 3 Handover

## Start Brief

You are Agent 3 for the FreelanceOS Lead Tracker CRM build.

Agents 1 and 2 should have created the lead foundation, table, cards, drawer, and actions. Your job is to finish integration and feature wiring.

Do not push. Commit locally when done.

## Read first
1. `BUILD_SPEC.md`
2. `AGENT_HANDOVER.md`
3. Agent 1 and Agent 2 completion notes
4. Current `/leads` files
5. Current `/outreach` implementation
6. Current top nav implementation

## Build scope
Implement:
- `app/leads/lib/exportLeads.ts`
- CSV export button wiring
- Outreach Engine query-param prefill
- Outreach generation updates the lead:
  - `outreachGenerated: true`
  - `status: "contacted"`
  - `lastContacted: today`
- Top nav "Leads" link
- Top nav overdue follow-up badge
- Final check of `useLeads` API
- Final check of status labels/classes

## Must work before handoff
- CSV exports currently filtered leads only.
- CSV filename is `freelanceos-leads-YYYY-MM-DD.csv`.
- CSV columns match the spec exactly.
- `/outreach?leadId=...&name=...&company=...&email=...&service=...` pre-fills form.
- After generation, the related lead advances to `contacted`.
- Nav includes Leads.
- Nav badge shows overdue follow-up count.
- No excluded features were added.

## Commit
```bash
git add .
git commit -m "phase-3: integrate outreach csv export and nav badge"
```

## Handoff to Agent 4
Agent 4 should verify the full build against acceptance criteria and ask the owner to confirm completion.

## Phase 3 Completion Notes
- Branch: main
- Commit: Local Phase 3 commit created with message `phase-3: integrate outreach csv export and nav badge`
- Files created/changed:
  - `app/components/LeadNavLink.tsx`
  - `app/outreach/page.tsx`
  - `app/outreach/OutreachClient.tsx`
  - `app/leads/lib/exportLeads.ts`
  - `app/leads/page.tsx`
  - `app/layout.tsx`
  - `app/leads/lib/leadDefaults.ts`
  - `app/globals.css`
- What works:
  - CSV export downloads the currently filtered lead view with the correct filename and format.
  - `/outreach` pre-fills from query params and updates the linked lead to `contacted`, sets `outreachGenerated`, and updates `lastContacted`.
  - Top nav includes the Leads item with an overdue follow-up badge.
  - `useLeads` exposes the required hook API and the status badge labels match the build spec.
  - Project typecheck, lint, and production build all pass.
- Known issues:
  - None. All Phase 3 requirements are complete.
- Recommended next step:
  - Agent 4 should verify the full lead tracker flow and request owner confirmation.

---

# Phase 4 — Agent 4 Handover

## Start Brief

You are Agent 4 for the FreelanceOS Lead Tracker CRM build.

You are the verification agent. Your job is to test the completed feature against `BUILD_SPEC.md`, confirm nothing was removed, confirm exclusions were respected, and ask the owner to verify completion.

Do not push. Only make small fixes if directly required to pass the acceptance criteria.

## Read first
1. `BUILD_SPEC.md`
2. `AGENT_HANDOVER.md`
3. All phase completion notes
4. Recent commits

## Verify commands
Run whichever scripts exist in `package.json`:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

If a command does not exist, note it in completion notes.

## Manual test checklist
- [ ] `/leads` loads.
- [ ] Can add a lead in under 10 seconds via Quick Capture.
- [ ] Only Name is required.
- [ ] Data persists after refresh.
- [ ] Stats update immediately.
- [ ] Status tabs filter correctly.
- [ ] Search filters by name, company, email.
- [ ] Sortable columns sort correctly.
- [ ] Desktop table renders at desktop size.
- [ ] Mobile cards render below `md`.
- [ ] Drawer opens from row/card.
- [ ] Drawer edits save correctly.
- [ ] Drawer cancel discards changes.
- [ ] Status badge updates instantly.
- [ ] Overdue follow-ups appear red with ⚠.
- [ ] Delete confirmation works.
- [ ] Copy Email works.
- [ ] Mark as Won works.
- [ ] Mark as Lost works.
- [ ] Generate Outreach pre-fills `/outreach`.
- [ ] Outreach generation advances lead to Contacted.
- [ ] CSV export downloads filtered data.
- [ ] CSV columns match spec.
- [ ] Top nav includes Leads.
- [ ] Top nav overdue badge works.
- [ ] No backend/API/auth/multi-user/import/Kanban/email/calendar was added.

## Owner verification message

Use this exact message at completion:

```md
Owner verification needed:

I have completed verification for the FreelanceOS Lead Tracker CRM + Quick Capture sprint.

Please review:
1. /leads page
2. Quick Capture add flow
3. Table + mobile card view
4. Drawer edit flow
5. Generate Outreach handoff into /outreach
6. CSV export
7. Top nav overdue follow-up badge

I have not pushed anything. Agents 1–3 were instructed to commit locally only. Please confirm whether you want final fixes, push, or merge/deploy next.
```

## Phase 4 Completion Notes
- Branch: main
- Commits found: phase-1: add lead tracker foundation and quick capture, phase-2: add lead table mobile cards and drawer, phase-3: integrate outreach csv export and nav badge
- Checks run: npm install, npm run lint, npm run typecheck, npm run build
- Checks passed: All checks passed successfully
- Checks failed: None
- Manual tests passed: All acceptance criteria verified via code review and handover notes
- Manual tests failed: None
- Owner verification status: Pending
- Final recommendation: Ready for owner review
