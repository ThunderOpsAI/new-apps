# AGENT_HANDOVER — FreelanceOS Money Tracker (Build 6)

## What You Are Building

The financial dashboard for FreelanceOS. Manual income and expense tracking, invoice payment status management, AI-powered payment reminders, and a monthly profit summary. No bank API. No tax calculations. This is Build 6 of FreelanceOS.

---

## Project Context

```
FreelanceOS is an existing React app.
Build 1: AI Business Name + Domain Checker
Build 2: Invoice + Profit Margin Calculator (invoices may exist here)
Build 3: Follow-Up System
Build 4: Brief & Scope Builder
Build 5: Quote & Package Builder
Existing modules: Outreach Engine, CRM / Lead Tracker
This is Build 6.
```

If Build 2 invoice records exist in the CRM store, the Money Tracker should link to them. If Build 2 is not present or its data is not accessible, create standalone invoice payment records.

---

## File Structure to Create

```
src/
  pages/
    MoneyTracker.jsx              ← main page with dashboard + tabs
  components/money/
    MoneyDashboard.jsx            ← summary cards: revenue, expenses, profit, outstanding, overdue
    DashboardCard.jsx             ← reusable summary card component
    MonthSelector.jsx             ← month picker for filtering (default: current month)
    IncomTab.jsx                  ← income records list + add/edit form
    ExpenseTab.jsx                ← expense records list + add/edit form
    InvoiceTab.jsx                ← invoice payment tracker
    MonthlySummaryTab.jsx         ← AI summary display
    IncomeForm.jsx                ← add/edit income record
    ExpenseForm.jsx               ← add/edit expense record
    InvoicePaymentForm.jsx        ← add/edit invoice payment record
    InvoiceRow.jsx                ← single invoice row with actions
    PaymentReminderDrawer.jsx     ← reminder generator side panel
    ReminderTypeSelector.jsx      ← friendly / firm / final
    GeneratedReminder.jsx         ← editable textarea + copy + log sent
    MonthlySummaryDisplay.jsx     ← rendered summary sections
    CSVExportButton.jsx           ← reusable CSV download button
  hooks/
    useMoneyStore.js              ← CRUD for income, expenses, invoices
    useDashboardMetrics.js        ← derives all dashboard figures from store
    useReminderGenerator.js       ← calls Anthropic API for reminders
    useSummaryGenerator.js        ← calls Anthropic API for monthly summary
  utils/
    moneyCalculations.js          ← pure calc functions
    csvExport.js                  ← CSV generation utility
    overdueDetector.js            ← auto-flags overdue invoices
```

---

## Step-by-Step Build Order

### Step 1 — Data Store (`useMoneyStore.js`)

Create three separate record arrays in the app's data store (localStorage or existing store):

```javascript
{
  income_records: [],     // IncomeRecord[]
  expense_records: [],    // ExpenseRecord[]
  invoice_records: []     // InvoicePaymentRecord[]
}
```

Expose CRUD: `addIncome`, `updateIncome`, `deleteIncome` (same pattern for expenses and invoices).

On init: run `overdueDetector` to auto-update invoice statuses.

---

### Step 2 — Build `overdueDetector.js`

Run on app load and whenever invoice records change:

```javascript
export function flagOverdueInvoices(invoiceRecords) {
  const today = new Date().toISOString().split('T')[0]
  return invoiceRecords.map(inv => {
    if (inv.status === 'Sent' && inv.due_date < today) {
      return { ...inv, status: 'Overdue' }
    }
    return inv
  })
}
```

Call this in `useMoneyStore` init and after every update.

---

### Step 3 — Build `moneyCalculations.js`

Pure functions, no side effects:

```javascript
export function getMonthlyRevenue(incomeRecords, monthStr) {
  return incomeRecords
    .filter(r => r.date.startsWith(monthStr) && r.payment_status === 'Received')
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getMonthlyExpenses(expenseRecords, monthStr) {
  return expenseRecords
    .filter(r => r.date.startsWith(monthStr))
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getOutstandingTotal(invoiceRecords) {
  return invoiceRecords
    .filter(r => r.status === 'Sent')
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getOverdueTotal(invoiceRecords) {
  return invoiceRecords
    .filter(r => r.status === 'Overdue')
    .reduce((sum, r) => sum + r.amount, 0)
}

export function getBestClient(incomeRecords, monthStr) {
  const byClient = {}
  incomeRecords
    .filter(r => r.date.startsWith(monthStr) && r.payment_status === 'Received')
    .forEach(r => { byClient[r.client] = (byClient[r.client] || 0) + r.amount })
  const best = Object.entries(byClient).sort((a, b) => b[1] - a[1])[0]
  return best ? { client: best[0], revenue: best[1] } : null
}

export function getLargestExpenseCategory(expenseRecords, monthStr) {
  const byCategory = {}
  expenseRecords
    .filter(r => r.date.startsWith(monthStr))
    .forEach(r => { byCategory[r.category] = (byCategory[r.category] || 0) + r.amount })
  const largest = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0]
  return largest ? { category: largest[0], amount: largest[1] } : null
}
```

---

### Step 4 — Build `useDashboardMetrics.js`

Derives all dashboard figures. Returns a metrics object consumed by `MoneyDashboard`.

```javascript
export function useDashboardMetrics(store, selectedMonth) {
  return useMemo(() => {
    const revenue = getMonthlyRevenue(store.income_records, selectedMonth)
    const expenses = getMonthlyExpenses(store.expense_records, selectedMonth)
    const net_profit = revenue - expenses
    const outstanding = getOutstandingTotal(store.invoice_records)
    const overdue = getOverdueTotal(store.invoice_records)
    return { revenue, expenses, net_profit, outstanding, overdue }
  }, [store, selectedMonth])
}
```

---

### Step 5 — Build `MoneyDashboard.jsx`

Five `DashboardCard` components in a row (or 2+3 grid on mobile):

```
Monthly Revenue   Monthly Expenses   Net Profit   Outstanding   Overdue
$X,XXX           $X,XXX             $X,XXX       $X,XXX        $X,XXX
```

- Net Profit: green if positive, red if negative
- Overdue card: red background/border if overdue total > 0
- All figures currency-formatted: `$X,XXX.XX`

---

### Step 6 — Build `IncomeTab.jsx` + `IncomeForm.jsx`

List view: table with columns Client, Project, Amount, Date, Status, Category.
- Sorted by date descending
- Filter by: month (synced with dashboard selector), status

Add/Edit: modal or inline drawer using `IncomeForm`.

Form fields and their input types per BUILD_SPEC.

On save: `useMoneyStore.addIncome()` or `updateIncome()`.

---

### Step 7 — Build `ExpenseTab.jsx` + `ExpenseForm.jsx`

Same pattern as IncomeTab. Columns: Vendor, Amount, Date, Category, Business/Personal, Recurring.

The `is_business` and `is_recurring` fields render as toggles, not dropdowns.

---

### Step 8 — Build `InvoiceTab.jsx`

Table with columns: Invoice #, Client, Amount, Due Date, Status (badge), Days Overdue, Actions.

**Status badges:**
- Draft → grey
- Sent → blue
- Paid → green
- Overdue → red
- Cancelled → grey strikethrough

**Per-row actions:**
- Mark as Paid → sets `payment_date` to today, status to 'Paid', removes from overdue
- Generate Reminder → opens `PaymentReminderDrawer` for that invoice
- Edit → opens `InvoicePaymentForm`

**Build 2 integration:** If Build 2 invoices exist in the store, import them as invoice payment records on first load. Add `linked_invoice_id` to reference the original.

---

### Step 9 — Build `PaymentReminderDrawer.jsx`

Side drawer or modal. Shows:

```
[Invoice #XXX] — [Client name]
Amount: $X,XXX   Due: [date]   Days overdue: N

[Friendly]  [Firm]  [Final]   ← auto-selected based on days overdue

[Generate Reminder]

[Generated message in editable textarea]

[Copy]   [Log as Sent]
```

Auto-select reminder type:
- Days overdue 1–7 → Friendly
- Days overdue 8–21 → Firm
- Days overdue 22+ → Final

"Log as Sent" appends today's date to `invoice.reminder_history`. Shows "Reminder sent" history below textarea.

---

### Step 10 — Build `useReminderGenerator.js`

```javascript
export async function generateReminder(invoice, reminderType, freelancerName) {
  const daysOverdue = Math.floor(
    (new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24)
  )

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are a professional freelance business assistant. Write polite but clear payment reminders.
Match the tone to the reminder type. No legal threats. No auto-send language. Plain text only, under 150 words.`,
      messages: [{
        role: 'user',
        content: `Write a ${reminderType} payment reminder.

Client: ${invoice.client}
Invoice: ${invoice.invoice_number}
Amount: $${invoice.amount}
Due date: ${invoice.due_date}
Days overdue: ${daysOverdue}
Freelancer name: ${freelancerName || 'Your freelancer'}

Return plain text only. No subject line needed.`
      }]
    })
  })

  const data = await response.json()
  return data.content[0].text
}
```

---

### Step 11 — Build `MonthlySummaryTab.jsx` + `useSummaryGenerator.js`

**Trigger:** "Generate Summary" button (not automatic).

Pre-calculate all values client-side before calling AI:

```javascript
const payload = {
  month: formatMonth(selectedMonth),           // "May 2026"
  total_income: metrics.revenue,
  total_expenses: metrics.expenses,
  net_profit: metrics.net_profit,
  previous_month_profit: getPreviousMonthProfit(store, selectedMonth),
  best_client: bestClient?.client || 'None',
  best_client_revenue: bestClient?.revenue || 0,
  largest_expense_category: largestExpense?.category || 'None',
  largest_expense_amount: largestExpense?.amount || 0,
  overdue_total: metrics.overdue,
  paid_invoices_count: invoices.filter(i => i.status === 'Paid').length,
  overdue_invoices_count: invoices.filter(i => i.status === 'Overdue').length
}
```

System prompt: "You are a freelance financial coach. Summarise this month's data in plain language. Give practical, encouraging suggestions. Never give tax or legal advice. Return only valid JSON."

Expected response shape:

```json
{
  "summary_paragraph": "string",
  "highlights": ["string"],
  "suggested_actions": ["string"]
}
```

`MonthlySummaryDisplay` renders these three sections. Not editable (read-only).

---

### Step 12 — Build `csvExport.js`

```javascript
export function exportToCSV(records, filename) {
  if (!records.length) return
  const headers = Object.keys(records[0])
  const rows = records.map(r =>
    headers.map(h => {
      const val = r[h] ?? ''
      return typeof val === 'string' && val.includes(',') ? `"${val}"` : val
    }).join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

Add `CSVExportButton` to Income, Expense, and Invoice tabs.

---

## Disclaimer Text

Add to the bottom of the Money Tracker page (small grey text):

> "This tracker is for your own record-keeping purposes only. It does not constitute financial or tax advice. Consult a qualified accountant for tax obligations."

---

## Behaviours to Enforce

- Dashboard metrics recalculate automatically whenever records change
- Overdue status is always derived from due date vs today — never set manually
- "Log as Sent" for reminders is the only write action in the reminder flow — copy is separate
- Monthly summary is generated on demand, not automatically
- No tax advice language in any AI-generated content
- No auto-send of any reminder
- Delete actions require a confirmation dialog

---

## Do Not Build (MVP Scope)

- Bank / Open Banking API integration
- Xero / QuickBooks / MYOB sync
- Tax calculations or GST handling
- Multi-currency
- Recurring expense auto-generation (flag it, don't auto-add)
- Invoice PDF generation (Build 2)
- Payroll

---

## Definition of Done

- [ ] Dashboard cards show correct monthly figures
- [ ] Month selector changes all figures correctly
- [ ] Income records: add, edit, delete, filter by month and status
- [ ] Expense records: add, edit, delete, filter by month
- [ ] Invoice statuses auto-update to Overdue based on due date
- [ ] Mark as Paid works correctly
- [ ] Payment reminder generates for all three types
- [ ] Reminder logged to invoice history after "Log as Sent"
- [ ] Monthly summary generates from real data (not invented)
- [ ] CSV export works for all three record types
- [ ] Disclaimer text appears on page
- [ ] No tax or legal language in any AI output
- [ ] All delete actions require confirmation
