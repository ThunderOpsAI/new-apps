# AGENT_HANDOVER — FreelanceOS Follow-Up System (Build 3)

## What You Are Building

A follow-up queue and AI message generator that plugs into the existing FreelanceOS CRM (Build 1/2 context). Freelancers see who needs a follow-up message, generate one via AI, copy it, and mark it as sent. No auto-send. No email API.

---

## Project Context

```
FreelanceOS is an existing React app.
Build 1: AI Business Name + Domain Checker
Build 2: Invoice + Profit Margin Calculator
Existing modules: Outreach Engine, CRM / Lead Tracker
This is Build 3. It extends the CRM — do not rebuild it.
```

Assume the CRM already has lead records with at minimum:
- `id`, `lead_name`, `business_name`, `service_offered`, `status`
- `last_contacted_date`, `next_follow_up_date`, `follow_up_count`
- `communication_history[]`

If those fields are missing from the current CRM model, add them.

---

## File Structure to Create

```
src/
  pages/
    FollowUps.jsx               ← main queue page
  components/follow-up/
    FollowUpQueue.jsx           ← table/list of leads needing follow-up
    FollowUpFilters.jsx         ← filter bar (All / Overdue / Today / Upcoming)
    FollowUpDrawer.jsx          ← side panel: lead context + generator
    MessageTypeSelector.jsx     ← tabs: email1, email2, final, linkedin, sms
    ToneSelector.jsx            ← professional / friendly / firm
    GeneratedMessage.jsx        ← editable textarea + copy + mark sent
    ScheduleNextFollowUp.jsx    ← date picker after marking sent
  hooks/
    useFollowUpQueue.js         ← derives queue from CRM leads
    useFollowUpGenerator.js     ← calls Anthropic API
  utils/
    followUpCadence.js          ← calculates next_follow_up_date from rules
    followUpPriority.js         ← assigns overdue / today / upcoming
```

---

## Step-by-Step Build Order

### Step 1 — Extend CRM Data Model

In whatever store the CRM uses (localStorage, context, zustand, etc.), ensure each lead has:

```typescript
follow_up_count: number           // default 0
next_follow_up_date: string       // ISO date, nullable
last_contacted_date: string       // ISO date, nullable
communication_history: []         // array of CommunicationEntry objects
previous_outreach_summary: string // nullable, plain text
```

### Step 2 — Build `followUpCadence.js`

Export a pure function:

```javascript
// Returns ISO date string
export function getNextFollowUpDate(lastContactedDate, followUpCount) {
  const offsets = { 0: 2, 1: 5, 2: 10 }
  const days = offsets[followUpCount] ?? 10
  const base = new Date(lastContactedDate)
  base.setDate(base.getDate() + days)
  return base.toISOString().split('T')[0]
}
```

### Step 3 — Build `followUpPriority.js`

```javascript
export function getPriority(nextFollowUpDate) {
  const today = new Date().toISOString().split('T')[0]
  if (nextFollowUpDate < today) return 'overdue'
  if (nextFollowUpDate === today) return 'today'
  return 'upcoming'
}
```

### Step 4 — Build `useFollowUpQueue.js`

Reads all CRM leads. Filters to those with a `next_follow_up_date` set or `last_contacted_date` set. Derives `days_since_contact` and `priority`. Returns sorted array (overdue first).

### Step 5 — Build `FollowUpQueue.jsx`

Renders a table or card list. Each row/card has:
- Lead name, business, status
- Days since contact (highlight red if overdue)
- Next follow-up date
- "Follow Up" button → opens drawer for that lead

### Step 6 — Build `FollowUpFilters.jsx`

Pill/tab filter: All | Overdue | Due Today | Upcoming. Updates displayed queue.

### Step 7 — Build `useFollowUpGenerator.js`

```javascript
export async function generateFollowUp(lead, options) {
  const { tone, messageType, followUpNumber } = options
  const prompt = buildPrompt(lead, tone, messageType, followUpNumber)

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a professional freelance sales assistant. Generate follow-up messages
that are warm, concise, and non-pushy. Never sound desperate. Always personalise
to the lead context provided. Return plain text only. No markdown formatting.`,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  const data = await response.json()
  return data.content[0].text
}
```

Build `buildPrompt()` using all lead fields. Include `days_since_contact`, `service_offered`, `previous_outreach_summary`, `tone`, `follow_up_number`, and `message_type`.

### Step 8 — Build `FollowUpDrawer.jsx`

Right-side panel or modal. Layout:

```
[Lead name] — [Business]
Status: [badge]   Last contact: [date]   Days since: [N days]

--- Message Type Tabs ---
[Email 1] [Email 2] [Final] [LinkedIn] [SMS]

--- Tone ---
[Professional] [Friendly] [Firm]

[Generate Follow-Up]

--- Output ---
[Editable textarea]

[Copy]  [Mark as Sent]
```

Disable "Generate" while loading. Show spinner in button.

### Step 9 — Build `ScheduleNextFollowUp.jsx`

Shown after "Mark as Sent" is clicked. Pre-fills with calculated next date. User can change. On confirm:
- Updates CRM lead record
- Closes drawer
- Removes lead from queue (or moves to "Upcoming")

### Step 10 — CRM Update Logic

On "Mark as Sent":

```javascript
function markAsSent(leadId, messageText, method) {
  updateLead(leadId, {
    last_contacted_date: today(),
    follow_up_count: lead.follow_up_count + 1,
    communication_history: [
      ...lead.communication_history,
      {
        date: today(),
        type: 'follow_up',
        message_preview: messageText.substring(0, 120),
        method
      }
    ]
  })
}
```

`next_follow_up_date` is updated only after the user confirms in `ScheduleNextFollowUp`.

---

## AI Prompt Template

```
Generate a [MESSAGE_TYPE] follow-up message for a freelance service provider.

Lead: [LEAD_NAME]
Business: [BUSINESS_NAME]
Service offered: [SERVICE_OFFERED]
Previous contact summary: [PREVIOUS_OUTREACH_SUMMARY]
Current status: [LEAD_STATUS]
Days since last contact: [DAYS]
This is follow-up number: [N]
Tone: [TONE]

Keep it under 200 words for email, under 50 words for LinkedIn DM or SMS.
Do not include a subject line unless this is an email message type.
Return plain text only.
```

---

## Behaviours to Enforce

- "Mark as Sent" button is the **only** action that modifies CRM data
- No message is ever sent programmatically — clipboard only
- "Generate" does not save anything — it only populates the textarea
- Regenerating overwrites the textarea — no history needed in MVP
- If AI call fails: show inline error "Couldn't generate message. Try again." with retry

---

## Do Not Build (MVP Scope)

- Gmail / SMTP / email API integration
- Bulk follow-up generation
- Follow-up templates library
- Read receipts or open tracking
- Automated scheduling or cron jobs
- Follow-up analytics dashboard

---

## Definition of Done

- [ ] `/follow-ups` page renders queue from CRM data
- [ ] Overdue leads are visually distinct (red badge or highlight)
- [ ] Selecting a lead opens the generator panel
- [ ] All 5 message types generate successfully via AI
- [ ] All 3 tone options produce different outputs
- [ ] Copy button works in browser
- [ ] Mark as sent updates CRM record correctly
- [ ] Next follow-up date saves and lead moves in queue
- [ ] Empty state renders when no follow-ups are due
- [ ] No auto-send path exists in the code
