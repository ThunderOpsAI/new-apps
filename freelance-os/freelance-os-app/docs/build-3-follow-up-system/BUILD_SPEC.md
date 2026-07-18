# BUILD_SPEC — FreelanceOS Follow-Up System (Build 3)

## Overview

A follow-up engine layered on top of the existing CRM. Turns passive lead records into an active queue: who needs a message, when, and what to say. AI generates context-aware follow-up copy across five formats.

---

## Stack Assumptions

- React (same stack as existing FreelanceOS builds)
- LocalStorage or existing CRM data store (no new backend required for MVP)
- Anthropic API (`claude-sonnet-4-20250514`) for message generation
- No Gmail/email API in MVP — copy-and-send only

---

## Pages & Components

### 1. Follow-Up Queue Page (`/follow-ups`)

The main view. Shows all leads requiring action.

**Table columns:**

| Column | Source |
|---|---|
| Lead name | CRM record |
| Business / client | CRM record |
| Status | CRM record |
| Last contacted | CRM `last_contacted_date` |
| Next follow-up | Calculated or manually set |
| Days since contact | Today minus `last_contacted_date` |
| Priority | Derived: Overdue > Due today > Upcoming |

**Filters:**
- All / Overdue / Due Today / Upcoming
- Sort by: Priority (default), Days since contact, Name

**Empty state:** "No follow-ups due. You're on top of things."

---

### 2. Follow-Up Generator Panel

Triggered by selecting a lead from the queue. Renders as a right-side drawer or modal.

**Displays lead context (read-only):**
- Lead name, business, service offered
- Previous outreach / proposal summary
- Lead status
- Days since last contact

**Tone selector:** Professional / Friendly / Firm

**Message type tabs:**
- Friendly first follow-up
- Second follow-up
- Final polite close
- LinkedIn DM version
- Short SMS-style version

**Actions:**
- Generate (calls AI)
- Regenerate
- Edit in-place (textarea)
- Copy message
- Mark as sent → triggers CRM update

---

### 3. Schedule Next Follow-Up

After marking as sent, a simple date picker appears:
- Auto-suggests next date based on cadence rules
- User can override manually
- Saves `next_follow_up_date` back to CRM record

---

## Follow-Up Cadence Rules

```
Follow-up 1: last_contacted_date + 2 days
Follow-up 2: last_contacted_date + 5 days
Final follow-up: last_contacted_date + 10 days
```

Cadence is calculated automatically. Manual date override always wins.

---

## CRM Fields Updated on "Mark as Sent"

```
last_contacted_date     → today's date
follow_up_count         → incremented by 1
next_follow_up_date     → user-set or auto-calculated
lead_status             → optionally updated (user confirms)
communication_history   → new entry appended:
                          { date, type: "follow_up", message_preview, method }
```

---

## AI Prompt Spec

**System prompt:**

```
You are a professional freelance sales assistant. Generate follow-up messages
that are warm, concise, and non-pushy. Never sound desperate. Always personalise
to the lead context provided.
```

**User prompt payload:**

```json
{
  "lead_name": "string",
  "business_name": "string",
  "service_offered": "string",
  "previous_outreach_summary": "string",
  "lead_status": "string",
  "days_since_contact": number,
  "follow_up_number": 1 | 2 | 3,
  "tone": "professional" | "friendly" | "firm",
  "message_type": "email_first" | "email_second" | "email_final" | "linkedin" | "sms"
}
```

**Output format:**

Return plain text only. No markdown. Under 200 words for email, under 50 words for SMS/LinkedIn DM. Do not include subject lines unless the message type is email.

---

## Data Model

### Follow-Up Queue Item (derived from CRM lead)

```typescript
interface FollowUpItem {
  id: string
  lead_name: string
  business_name: string
  service_offered: string
  status: LeadStatus
  last_contacted_date: string        // ISO date
  next_follow_up_date: string        // ISO date
  days_since_contact: number         // computed
  follow_up_count: number
  priority: 'overdue' | 'today' | 'upcoming'
  previous_outreach_summary?: string
  communication_history: CommunicationEntry[]
}

interface CommunicationEntry {
  date: string
  type: 'outreach' | 'follow_up' | 'reply' | 'meeting' | 'note'
  message_preview: string
  method: 'email' | 'linkedin' | 'sms' | 'call' | 'other'
}
```

---

## UI States

| State | Behaviour |
|---|---|
| Queue empty | Friendly empty state message |
| Lead selected, no message generated | Show lead context + Generate button |
| Generating | Loading spinner, button disabled |
| Message ready | Display in editable textarea |
| Marked as sent | Success toast, schedule next follow-up prompt |
| Error from AI | Inline error with retry option |

---

## MVP Constraints

- No auto-send under any circumstances
- No Gmail / SMTP integration
- No bulk generation
- Copy button uses `navigator.clipboard.writeText()`
- "Mark as sent" is the only write action — always explicit, never automatic

---

## Success Criteria

- [ ] Overdue leads visible immediately on page load
- [ ] Follow-up generated in under 10 seconds
- [ ] Copy + mark as sent works without errors
- [ ] CRM lead record updates correctly after marking sent
- [ ] Next follow-up date saves and appears in queue
- [ ] No message ever sends automatically
