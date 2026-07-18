"use client";

import React, { useState, useMemo } from "react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { createLocalStore } from "@/lib/storage";
import { generateAI } from "@/lib/ai";

// --- Types ---

interface IncomeRecord {
  id: string;
  client: string;
  project?: string;
  amount: number;
  date: string;
  payment_status: "Pending" | "Received";
  invoice_id?: string;
  category: string;
  notes?: string;
  created_at: string;
}

interface ExpenseRecord {
  id: string;
  vendor: string;
  amount: number;
  date: string;
  category: string;
  is_business: boolean;
  is_recurring: boolean;
  notes?: string;
  created_at: string;
}

interface InvoicePaymentRecord {
  id: string;
  invoice_number: string;
  client: string;
  project?: string;
  amount: number;
  issue_date: string;
  due_date: string;
  payment_date?: string;
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
  reminder_history: string[];
  linked_invoice_id?: string;
  notes?: string;
}

// --- Stores ---

const incomeStore = createLocalStore<IncomeRecord[]>(STORAGE_KEYS.INCOME, []);
const expensesStore = createLocalStore<ExpenseRecord[]>(STORAGE_KEYS.EXPENSES, []);
const invoicePaymentsStore = createLocalStore<InvoicePaymentRecord[]>(
  STORAGE_KEYS.INVOICE_PAYMENTS,
  []
);

// --- Utilities ---

function exportCSV(records: any[], filename: string) {
  if (!records || records.length === 0) return;
  const headers = Object.keys(records[0]).join(",");
  const rows = records.map((r) =>
    Object.values(r)
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(amount);

// --- Sub-components ---

function DashboardCards({
  income,
  expenses,
  invoices,
}: {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
  invoices: InvoicePaymentRecord[];
}) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const today = new Date().toISOString().split("T")[0];

  const monthlyRevenue = income
    .filter((r) => r.date.startsWith(currentMonth) && r.payment_status === "Received")
    .reduce((sum, r) => sum + r.amount, 0);

  const monthlyExpenses = expenses
    .filter((r) => r.date.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.amount, 0);

  const netProfit = monthlyRevenue - monthlyExpenses;

  const outstandingInvoicesTotal = invoices
    .filter((r) => r.status === "Sent")
    .reduce((sum, r) => sum + r.amount, 0);

  const overdueInvoices = invoices.filter((r) => r.status === "Sent" && r.due_date < today);
  const overdueInvoicesTotal = overdueInvoices.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="stats-grid" style={{ marginBottom: "24px" }}>
      <div className="stat-card">
        <p className="stat-card__label">Monthly Revenue</p>
        <p className="stat-card__value">{formatCurrency(monthlyRevenue)}</p>
      </div>
      <div className="stat-card">
        <p className="stat-card__label">Monthly Expenses</p>
        <p className="stat-card__value">{formatCurrency(monthlyExpenses)}</p>
      </div>
      <div className="stat-card">
        <p className="stat-card__label">Net Profit</p>
        <p className="stat-card__value">{formatCurrency(netProfit)}</p>
      </div>
      <div className="stat-card">
        <p className="stat-card__label">Outstanding Invoices</p>
        <p className="stat-card__value">{formatCurrency(outstandingInvoicesTotal)}</p>
      </div>
      <div
        className="stat-card"
        style={{
          border: overdueInvoicesTotal > 0 ? "1px solid var(--danger-text)" : undefined,
          backgroundColor: overdueInvoicesTotal > 0 ? "var(--danger-bg)" : undefined,
        }}
      >
        <p
          className="stat-card__label"
          style={{ color: overdueInvoicesTotal > 0 ? "var(--danger-text)" : undefined }}
        >
          Overdue Invoices
        </p>
        <p
          className="stat-card__value"
          style={{ color: overdueInvoicesTotal > 0 ? "var(--danger-text)" : undefined }}
        >
          {formatCurrency(overdueInvoicesTotal)}
        </p>
      </div>
    </div>
  );
}

function IncomeTab({ income, write }: { income: IncomeRecord[]; write: (v: IncomeRecord[]) => void }) {
  const [form, setForm] = useState<Partial<IncomeRecord>>({
    payment_status: "Received",
    category: "Project payment",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.amount || !form.date) return;
    const newRecord: IncomeRecord = {
      id: generateId(),
      client: form.client,
      project: form.project || "",
      amount: Number(form.amount),
      date: form.date,
      payment_status: form.payment_status as "Pending" | "Received",
      category: form.category || "Other",
      notes: form.notes || "",
      created_at: new Date().toISOString(),
    };
    write([newRecord, ...income]);
    setForm({ payment_status: "Received", category: "Project payment" });
  };

  const handleDelete = (id: string) => {
    write(income.filter((i) => i.id !== id));
  };

  return (
    <div className="panel">
      <div className="row row--between" style={{ marginBottom: "16px" }}>
        <h2 className="page-subtitle" style={{ color: "var(--text)", fontWeight: 700 }}>
          Income Records
        </h2>
        <button
          className="button button--ghost"
          onClick={() => exportCSV(income, "income_export.csv")}
        >
          Export CSV
        </button>
      </div>
      <form className="capture-form" onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
        <div className="field">
          <label>Client</label>
          <input
            type="text"
            className="input"
            required
            value={form.client || ""}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Amount (AUD)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            required
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            className="input"
            required
            value={form.date || ""}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            className="select"
            value={form.category || "Project payment"}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option>Project payment</option>
            <option>Retainer</option>
            <option>Consultation</option>
            <option>Deposit</option>
            <option>Bonus</option>
            <option>Refund</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select
            className="select"
            value={form.payment_status || "Received"}
            onChange={(e) => setForm({ ...form, payment_status: e.target.value as "Pending" | "Received" })}
          >
            <option value="Received">Received</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
        <div className="capture-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="button button--primary">
            Add Income
          </button>
        </div>
      </form>

      {income.length === 0 ? (
        <div className="empty-state">Add your first income record</div>
      ) : (
        <div className="table-shell">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {income.map((item) => (
                <tr key={item.id} className="lead-table__row">
                  <td>{item.date}</td>
                  <td>
                    <div className="lead-primary__name">{item.client}</div>
                    {item.project && <div className="lead-primary__email">{item.project}</div>}
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.category}</td>
                  <td>
                    <span
                      className={`badge ${
                        item.payment_status === "Received" ? "badge--green" : "badge--yellow"
                      }`}
                    >
                      {item.payment_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="icon-button icon-button--danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ExpensesTab({
  expenses,
  write,
}: {
  expenses: ExpenseRecord[];
  write: (v: ExpenseRecord[]) => void;
}) {
  const [form, setForm] = useState<Partial<ExpenseRecord>>({
    category: "Software",
    is_business: true,
    is_recurring: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vendor || !form.amount || !form.date) return;
    const newRecord: ExpenseRecord = {
      id: generateId(),
      vendor: form.vendor,
      amount: Number(form.amount),
      date: form.date,
      category: form.category || "Other",
      is_business: form.is_business ?? true,
      is_recurring: form.is_recurring ?? false,
      notes: form.notes || "",
      created_at: new Date().toISOString(),
    };
    write([newRecord, ...expenses]);
    setForm({ category: "Software", is_business: true, is_recurring: false });
  };

  const handleDelete = (id: string) => {
    write(expenses.filter((i) => i.id !== id));
  };

  return (
    <div className="panel">
      <div className="row row--between" style={{ marginBottom: "16px" }}>
        <h2 className="page-subtitle" style={{ color: "var(--text)", fontWeight: 700 }}>
          Expense Records
        </h2>
        <button
          className="button button--ghost"
          onClick={() => exportCSV(expenses, "expenses_export.csv")}
        >
          Export CSV
        </button>
      </div>
      <form className="capture-form" onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
        <div className="field">
          <label>Vendor</label>
          <input
            type="text"
            className="input"
            required
            value={form.vendor || ""}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Amount (AUD)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            required
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            className="input"
            required
            value={form.date || ""}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Category</label>
          <select
            className="select"
            value={form.category || "Software"}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option>Software</option>
            <option>Marketing</option>
            <option>Equipment</option>
            <option>Contractors</option>
            <option>Subscriptions</option>
            <option>Education</option>
            <option>Office</option>
            <option>Travel</option>
            <option>Other</option>
          </select>
        </div>
        <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={form.is_business}
            onChange={(e) => setForm({ ...form, is_business: e.target.checked })}
          />
          <label style={{ margin: 0 }}>Business Expense</label>
        </div>
        <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
          <input
            type="checkbox"
            checked={form.is_recurring}
            onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
          />
          <label style={{ margin: 0 }}>Recurring</label>
        </div>
        <div className="capture-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="button button--primary">
            Add Expense
          </button>
        </div>
      </form>

      {expenses.length === 0 ? (
        <div className="empty-state">Add your first expense record</div>
      ) : (
        <div className="table-shell">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item) => (
                <tr key={item.id} className="lead-table__row">
                  <td>{item.date}</td>
                  <td>
                    <div className="lead-primary__name">{item.vendor}</div>
                    {item.is_recurring && <div className="lead-primary__email">Recurring</div>}
                  </td>
                  <td>{formatCurrency(item.amount)}</td>
                  <td>{item.category}</td>
                  <td>{item.is_business ? "Business" : "Personal"}</td>
                  <td>
                    <button
                      className="icon-button icon-button--danger"
                      onClick={() => handleDelete(item.id)}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InvoicesTab({
  invoices,
  write,
}: {
  invoices: InvoicePaymentRecord[];
  write: (v: InvoicePaymentRecord[]) => void;
}) {
  const [form, setForm] = useState<Partial<InvoicePaymentRecord>>({
    status: "Sent",
  });
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [generatedReminder, setGeneratedReminder] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const getStatus = (inv: InvoicePaymentRecord) => {
    if (inv.status === "Sent" && inv.due_date < today) {
      return "Overdue";
    }
    return inv.status;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.client || !form.amount || !form.issue_date || !form.due_date) return;
    const newRecord: InvoicePaymentRecord = {
      id: generateId(),
      invoice_number: form.invoice_number || `INV-${Math.floor(Math.random() * 10000)}`,
      client: form.client,
      project: form.project || "",
      amount: Number(form.amount),
      issue_date: form.issue_date,
      due_date: form.due_date,
      status: form.status as any,
      reminder_history: [],
      notes: form.notes || "",
    };
    write([newRecord, ...invoices]);
    setForm({ status: "Sent" });
  };

  const handleDelete = (id: string) => {
    write(invoices.filter((i) => i.id !== id));
  };

  const markPaid = (id: string) => {
    write(
      invoices.map((i) =>
        i.id === id ? { ...i, status: "Paid", payment_date: new Date().toISOString().split("T")[0] } : i
      )
    );
  };

  const generateReminder = async (inv: InvoicePaymentRecord) => {
    setGeneratingFor(inv.id);
    setGeneratedReminder(null);
    try {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(inv.due_date).getTime()) / (1000 * 3600 * 24)
      );
      const type = daysOverdue > 21 ? "final" : daysOverdue > 7 ? "firm" : "friendly";

      const payload = {
        client_name: inv.client,
        invoice_number: inv.invoice_number,
        amount: inv.amount,
        due_date: inv.due_date,
        days_overdue: daysOverdue,
        reminder_type: type,
        freelancer_name: "Freelancer", // Mock for MVP
      };

      const result = await generateAI({
        system:
          "You are a professional freelance business assistant. Write polite but clear payment reminders. Match the tone to the reminder type: friendly for early, firm for mid, final for late. No legal threats. No auto-send.",
        prompt: `Generate a reminder: ${JSON.stringify(payload)}`,
      });
      setGeneratedReminder(result.text || "Failed to generate.");
    } catch (err) {
      console.error(err);
      setGeneratedReminder("Error generating reminder.");
    } finally {
      setGeneratingFor(null);
    }
  };

  return (
    <div className="panel">
      <div className="row row--between" style={{ marginBottom: "16px" }}>
        <h2 className="page-subtitle" style={{ color: "var(--text)", fontWeight: 700 }}>
          Invoice Tracker
        </h2>
        <button
          className="button button--ghost"
          onClick={() => exportCSV(invoices, "invoices_export.csv")}
        >
          Export CSV
        </button>
      </div>

      <form className="capture-form" onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
        <div className="field">
          <label>Invoice Number</label>
          <input
            type="text"
            className="input"
            value={form.invoice_number || ""}
            onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
            placeholder="INV-1234"
          />
        </div>
        <div className="field">
          <label>Client</label>
          <input
            type="text"
            className="input"
            required
            value={form.client || ""}
            onChange={(e) => setForm({ ...form, client: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Amount (AUD)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            required
            value={form.amount || ""}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </div>
        <div className="field">
          <label>Issue Date</label>
          <input
            type="date"
            className="input"
            required
            value={form.issue_date || ""}
            onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Due Date</label>
          <input
            type="date"
            className="input"
            required
            value={form.due_date || ""}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Status</label>
          <select
            className="select"
            value={form.status || "Sent"}
            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
          >
            <option value="Draft">Draft</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
        <div className="capture-actions" style={{ gridColumn: "1 / -1" }}>
          <button type="submit" className="button button--primary">
            Add Invoice
          </button>
        </div>
      </form>

      {generatedReminder && (
        <div className="panel" style={{ marginBottom: "24px", background: "var(--info-bg)" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem" }}>Generated Reminder</h3>
          <textarea
            className="textarea"
            value={generatedReminder}
            onChange={(e) => setGeneratedReminder(e.target.value)}
          />
          <div className="row" style={{ marginTop: "12px" }}>
            <button
              className="button button--ghost"
              onClick={() => {
                navigator.clipboard.writeText(generatedReminder);
                alert("Copied to clipboard!");
              }}
            >
              Copy
            </button>
            <button className="button button--ghost" onClick={() => setGeneratedReminder(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="empty-state">Add your first invoice to track</div>
      ) : (
        <div className="table-shell">
          <table className="lead-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((item) => {
                const status = getStatus(item);
                return (
                  <tr key={item.id} className="lead-table__row">
                    <td>{item.invoice_number}</td>
                    <td>{item.client}</td>
                    <td>{formatCurrency(item.amount)}</td>
                    <td>{item.due_date}</td>
                    <td>
                      <span
                        className={`badge ${
                          status === "Paid"
                            ? "badge--green"
                            : status === "Overdue"
                            ? "badge--pink"
                            : "badge--yellow"
                        }`}
                      >
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {status !== "Paid" && (
                          <button
                            className="button button--ghost"
                            style={{ minHeight: "32px", padding: "0 10px", fontSize: "0.85rem" }}
                            onClick={() => markPaid(item.id)}
                          >
                            Mark Paid
                          </button>
                        )}
                        {(status === "Overdue" || status === "Sent") && (
                          <button
                            className="button button--ghost"
                            style={{ minHeight: "32px", padding: "0 10px", fontSize: "0.85rem" }}
                            onClick={() => generateReminder(item)}
                            disabled={generatingFor === item.id}
                          >
                            {generatingFor === item.id ? "Generating..." : "Reminder"}
                          </button>
                        )}
                        <button
                          className="icon-button icon-button--danger"
                          onClick={() => handleDelete(item.id)}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryTab({
  income,
  expenses,
  invoices,
}: {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
  invoices: InvoicePaymentRecord[];
}) {
  const [summaryData, setSummaryData] = useState<{
    summary_paragraph: string;
    highlights: string[];
    suggested_actions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generateSummary = async () => {
    setLoading(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const today = new Date().toISOString().split("T")[0];

      const monthlyRevenue = income
        .filter((r) => r.date.startsWith(currentMonth) && r.payment_status === "Received")
        .reduce((sum, r) => sum + r.amount, 0);

      const monthlyExpenses = expenses
        .filter((r) => r.date.startsWith(currentMonth))
        .reduce((sum, r) => sum + r.amount, 0);

      const netProfit = monthlyRevenue - monthlyExpenses;

      const clientRevenue: Record<string, number> = {};
      income
        .filter((r) => r.date.startsWith(currentMonth) && r.payment_status === "Received")
        .forEach((r) => {
          clientRevenue[r.client] = (clientRevenue[r.client] || 0) + r.amount;
        });
      let bestClient = "";
      let bestClientRevenue = 0;
      Object.entries(clientRevenue).forEach(([c, r]) => {
        if (r > bestClientRevenue) {
          bestClient = c;
          bestClientRevenue = r;
        }
      });

      const expenseCat: Record<string, number> = {};
      expenses
        .filter((r) => r.date.startsWith(currentMonth))
        .forEach((r) => {
          expenseCat[r.category] = (expenseCat[r.category] || 0) + r.amount;
        });
      let largestExpenseCategory = "";
      let largestExpenseAmount = 0;
      Object.entries(expenseCat).forEach(([c, r]) => {
        if (r > largestExpenseAmount) {
          largestExpenseCategory = c;
          largestExpenseAmount = r;
        }
      });

      const overdueInvoices = invoices.filter((r) => r.status === "Sent" && r.due_date < today);
      const overdueTotal = overdueInvoices.reduce((sum, r) => sum + r.amount, 0);

      const paidInvoicesCount = invoices.filter((r) => r.status === "Paid").length;
      const overdueInvoicesCount = overdueInvoices.length;

      const payload = {
        month: currentMonth,
        total_income: monthlyRevenue,
        total_expenses: monthlyExpenses,
        net_profit: netProfit,
        previous_month_profit: null,
        best_client: bestClient,
        best_client_revenue: bestClientRevenue,
        largest_expense_category: largestExpenseCategory,
        largest_expense_amount: largestExpenseAmount,
        overdue_total: overdueTotal,
        paid_invoices_count: paidInvoicesCount,
        overdue_invoices_count: overdueInvoicesCount,
      };

      const result = await generateAI({
        system:
          "You are a freelance financial coach. Summarise this month's financial data in plain language. Provide practical, encouraging next-step suggestions. Never give tax or legal advice. Output valid JSON only with keys: summary_paragraph (string), highlights (array of strings), suggested_actions (array of strings). Do not use markdown backticks.",
        prompt: `Data: ${JSON.stringify(payload)}`,
      });

      let jsonText = result.text.trim();
      if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7, -3);
      else if (jsonText.startsWith("```")) jsonText = jsonText.slice(3, -3);

      setSummaryData(JSON.parse(jsonText));
    } catch (err) {
      console.error(err);
      alert("Failed to generate summary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <div className="row row--between" style={{ marginBottom: "24px" }}>
        <h2 className="page-subtitle" style={{ color: "var(--text)", fontWeight: 700 }}>
          Monthly Summary
        </h2>
        <button className="button button--primary" onClick={generateSummary} disabled={loading}>
          {loading ? "Generating..." : "Generate AI Summary"}
        </button>
      </div>

      {loading && <div className="empty-state">Analyzing financial data...</div>}

      {!loading && summaryData && (
        <div style={{ display: "grid", gap: "24px" }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Summary</h3>
            <p style={{ lineHeight: 1.6, color: "var(--text)" }}>{summaryData.summary_paragraph}</p>
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Highlights</h3>
            <ul style={{ paddingLeft: "20px", lineHeight: 1.6 }}>
              {summaryData.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: "1.1rem", marginBottom: "8px" }}>Suggested Actions</h3>
            <ul style={{ paddingLeft: "20px", lineHeight: 1.6 }}>
              {summaryData.suggested_actions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {!loading && !summaryData && (
        <div className="empty-state">Click "Generate AI Summary" to analyze your monthly finances.</div>
      )}
    </div>
  );
}

// --- Main Page Component ---

export default function MoneyTrackerPage() {
  const { data: income, hasHydrated: incomeHydrated, write: writeIncome } = incomeStore.useStore();
  const { data: expenses, hasHydrated: expensesHydrated, write: writeExpenses } = expensesStore.useStore();
  const { data: invoices, hasHydrated: invoicesHydrated, write: writeInvoices } = invoicePaymentsStore.useStore();

  const [activeTab, setActiveTab] = useState<"income" | "expenses" | "invoices" | "summary">("income");

  if (!incomeHydrated || !expensesHydrated || !invoicesHydrated) return null;

  return (
    <div className="shell">
      <div className="hero-card" style={{ marginBottom: "24px" }}>
        <h1 className="page-title">Money Tracker</h1>
        <p className="page-subtitle">Your financial control centre. Manage income, track expenses, and monitor outstanding invoices.</p>
      </div>

      <DashboardCards income={income} expenses={expenses} invoices={invoices} />

      <div className="tabs" style={{ marginBottom: "24px" }}>
        <button
          className={`tab ${activeTab === "income" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("income")}
        >
          Income <span className="tab__count">{income.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "expenses" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("expenses")}
        >
          Expenses <span className="tab__count">{expenses.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "invoices" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("invoices")}
        >
          Invoices <span className="tab__count">{invoices.length}</span>
        </button>
        <button
          className={`tab ${activeTab === "summary" ? "tab--active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          Monthly Summary
        </button>
      </div>

      {activeTab === "income" && <IncomeTab income={income} write={writeIncome} />}
      {activeTab === "expenses" && <ExpensesTab expenses={expenses} write={writeExpenses} />}
      {activeTab === "invoices" && <InvoicesTab invoices={invoices} write={writeInvoices} />}
      {activeTab === "summary" && <SummaryTab income={income} expenses={expenses} invoices={invoices} />}

      <footer style={{ marginTop: "40px", textAlign: "center", color: "var(--muted)", fontSize: "0.85rem" }}>
        This tracker is for your records only. Consult an accountant for tax advice.
      </footer>
    </div>
  );
}
