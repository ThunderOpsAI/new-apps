# BUILD_SPEC — FreelanceOS Money Tracker (Build 6)

## Overview

The financial control centre for FreelanceOS. Tracks income, expenses, and invoice payment status. Shows a live dashboard of monthly profit. Generates AI-powered payment reminders and monthly summaries. Manual entry only — no bank integration in MVP.

---

## Stack Assumptions

- React (same stack as existing FreelanceOS builds)
- Existing CRM store (clients, projects, invoices from Build 2)
- Anthropic API (`claude-sonnet-4-20250514`) for reminders and summaries
- CSV export via client-side generation (no server)
- No bank API, no tax integration, no accounting software sync in MVP

---

## Pages & Components

### 1. Money Dashboard (`/money`)

The primary view. Split into summary cards at the top and tabbed detail below.

**Summary cards (current month, auto-calculated):**

| Card | Value |
|---|---|
| Monthly revenue | Sum of paid income records this month |
| Monthly expenses | Sum of expense records this month |
| Net profit | Revenue − Expenses |
| Outstanding invoices | Sum of sent/unpaid invoices |
| Overdue invoices | Sum of invoices past due date |

Cards refresh whenever underlying data changes.

---

### 2. Tabs (below summary cards)

| Tab | Content |
|---|---|
| Income | Income record list + add form |
| Expenses | Expense record list + add form |
| Invoices | Invoice payment tracker |
| Monthly Summary | AI-generated summary + insights |

---

### 3. Income Tab

**Income record fields:**

| Field | Type |
|---|---|
| Client | Select (from CRM) or free text |
| Project | Select (from CRM) or free text |
| Amount | Number (AUD) |
| Date received | Date |
| Payment status | Select: Pending / Received |
| Invoice link | Select from invoice records (optional) |
| Category | Select |
| Notes | Text |

**Income categories:** Project payment, Retainer, Consultation, Deposit, Bonus, Refund, Other

**List view columns:** Client, Project, Amount, Date, Status, Category

Sortable by date (default: newest first). Filterable by status and month.

---

### 4. Expenses Tab

**Expense record fields:**

| Field | Type |
|---|---|
| Vendor / supplier | Text |
| Amount | Number (AUD) |
| Date | Date |
| Category | Select |
| Business / personal | Toggle |
| Recurring | Toggle |
| Notes | Text |

**Expense categories:** Software, Marketing, Equipment, Contractors, Subscriptions, Education, Office, Travel, Other

**List view columns:** Vendor, Amount, Date, Category, Type (Business/Personal), Recurring

AI can suggest category from vendor name (optional enhancement — see AI section).

---

### 5. Invoices Tab (Payment Tracker)

Links to invoice records from Build 2 (or creates standalone invoice records if Build 2 is not present).

**Invoice fields tracked here:**

| Field | Source |
|---|---|
| Invoice number | Build 2 or manual |
| Client | CRM or manual |
| Project | CRM or manual |
| Amount | Number |
| Issue date | Date |
| Due date | Date |
| Payment date | Date (if paid) |
| Status | Draft / Sent / Paid / Overdue / Cancelled |
| Reminder history | Array of sent reminder dates |

**Status logic:**
- Overdue = status is "Sent" AND due date is in the past

**Actions per invoice:**
- Mark as Paid (sets payment date to today, updates status)
- Generate Reminder (opens AI reminder generator)
- View invoice (links to Build 2 if available)

---

### 6. Payment Reminder Generator

Triggered from Invoices tab for overdue or sent invoices.

**Reminder types:**
- Friendly reminder (1–7 days overdue)
- Firm reminder (8–21 days overdue)
- Final reminder (22+ days overdue)

Auto-suggests type based on days overdue. User can override.

Output: editable textarea. Copy button. Mark reminder as sent (logs date to `reminder_history`).

No auto-send in MVP.

---

### 7. Monthly Summary Tab

**Triggered by "Generate Summary" button or auto-generates for current month.**

AI output sections:
- Total income (with comparison to previous month if data exists)
- Total expenses
- Net profit
- Best client (highest revenue)
- Largest expense category
- Total overdue amount
- 3–5 suggested actions

All figures calculated from data — AI formats and interprets, does not invent numbers. Pass pre-calculated values to the AI prompt.

---

## AI Prompt Specs

### Payment Reminder Prompt

**System:** "You are a professional freelance business assistant. Write polite but clear payment reminders. Match the tone to the reminder type: friendly for early, firm for mid, final for late. No legal threats. No auto-send."

**User prompt payload:**

```json
{
  "client_name": "string",
  "invoice_number": "string",
  "amount": number,
  "due_date": "string",
  "days_overdue": number,
  "reminder_type": "friendly" | "firm" | "final",
  "freelancer_name": "string"
}
```

Output: plain text only, under 150 words.

---

### Monthly Summary Prompt

**System:** "You are a freelance financial coach. Summarise this month's financial data in plain language. Provide practical, encouraging next-step suggestions. Never give tax or legal advice."

**User prompt payload (pre-calculated data):**

```json
{
  "month": "string",
  "total_income": number,
  "total_expenses": number,
  "net_profit": number,
  "previous_month_profit": number | null,
  "best_client": "string",
  "best_client_revenue": number,
  "largest_expense_category": "string",
  "largest_expense_amount": number,
  "overdue_total": number,
  "paid_invoices_count": number,
  "overdue_invoices_count": number
}
```

Output: JSON with keys `summary_paragraph` (string), `highlights` (string[]), `suggested_actions` (string[]).

---

## Data Model

### Income Record

```typescript
interface IncomeRecord {
  id: string
  client: string
  project?: string
  amount: number
  date: string                    // ISO date
  payment_status: 'Pending' | 'Received'
  invoice_id?: string
  category: string
  notes?: string
  created_at: string
}
```

### Expense Record

```typescript
interface ExpenseRecord {
  id: string
  vendor: string
  amount: number
  date: string
  category: string
  is_business: boolean            // default true
  is_recurring: boolean           // default false
  notes?: string
  created_at: string
}
```

### Invoice Payment Record

```typescript
interface InvoicePaymentRecord {
  id: string
  invoice_number: string
  client: string
  project?: string
  amount: number
  issue_date: string
  due_date: string
  payment_date?: string
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled'
  reminder_history: string[]       // ISO dates of sent reminders
  linked_invoice_id?: string       // Build 2 invoice ID
  notes?: string
}
```

---

## Dashboard Calculations

All calculations are client-side, derived from stored records:

```javascript
const currentMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

const monthlyRevenue = incomeRecords
  .filter(r => r.date.startsWith(currentMonth) && r.payment_status === 'Received')
  .reduce((sum, r) => sum + r.amount, 0)

const monthlyExpenses = expenseRecords
  .filter(r => r.date.startsWith(currentMonth))
  .reduce((sum, r) => sum + r.amount, 0)

const netProfit = monthlyRevenue - monthlyExpenses

const today = new Date().toISOString().split('T')[0]

const overdueInvoices = invoiceRecords.filter(
  r => r.status === 'Sent' && r.due_date < today
)
```

---

## CSV Export

Available on Income, Expenses, and Invoices tabs.

Generates a CSV of visible/filtered records using:

```javascript
function exportCSV(records, filename) {
  const headers = Object.keys(records[0]).join(',')
  const rows = records.map(r => Object.values(r).join(','))
  const csv = [headers, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  // trigger download
}
```

---

## UI States

| State | Behaviour |
|---|---|
| No data | Friendly empty state per tab with "Add your first [income/expense/invoice]" |
| Dashboard cards | Always visible, show $0 if no data |
| Overdue invoices exist | Overdue card highlighted in red |
| Generating reminder | Button spinner, textarea disabled |
| Reminder generated | Display in editable textarea |
| Summary generating | Full-tab loading state |
| Summary ready | Sections render, not editable (read-only display) |

---

## MVP Constraints

- Manual data entry only — no bank/accounting API
- No tax calculations — add footer: "This tracker is for your records only. Consult an accountant for tax advice."
- No multi-currency — AUD only
- No invoice PDF generation here — that is Build 2's responsibility
- CSV export preferred over PDF for financial data

---

## Success Criteria

- [ ] Dashboard shows correct monthly figures on load
- [ ] Income and expense records can be added, edited, deleted
- [ ] Invoice statuses update correctly (Mark as Paid works)
- [ ] Overdue invoices are visually distinct
- [ ] Payment reminders generate and can be copied
- [ ] Reminder history logs correctly per invoice
- [ ] Monthly summary generates from real data
- [ ] CSV export works for all three record types
- [ ] No tax or legal advice language appears anywhere in generated content
