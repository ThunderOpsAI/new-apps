"use client";

import { pdf } from "@react-pdf/renderer";
import { useState } from "react";

import { InvoicePdf } from "@/components/invoice-pdf";
import { calculateInvoiceTotals } from "@/lib/calculations";
import { saveInvoice } from "@/lib/storage";
import {
  BusinessDetails,
  ClientDetails,
  InvoiceLineItem,
  InvoiceMeta
} from "@/types/invoice";

const defaultBusiness: BusinessDetails = {
  businessName: "",
  companyNumber: "",
  email: "",
  phone: "",
  address: ""
};

const defaultClient: ClientDetails = {
  clientName: "",
  clientEmail: "",
  clientAddress: ""
};

const defaultMeta: InvoiceMeta = {
  invoiceNumber: "INV-1001",
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: "",
  currency: "AUD",
  paymentTerms: "Due in 7 days",
  notes: ""
};

const newLineItem = (): InvoiceLineItem => ({
  id: crypto.randomUUID(),
  description: "",
  quantity: 1,
  unitPrice: 0,
  unitCost: 0,
  taxRate: 10
});

const fieldClass = "rounded-2xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] shadow-sm outline-none transition focus:border-[var(--accent)]";

export function InvoiceBuilder() {
  const [business, setBusiness] = useState(defaultBusiness);
  const [client, setClient] = useState(defaultClient);
  const [meta, setMeta] = useState(defaultMeta);
  const [items, setItems] = useState<InvoiceLineItem[]>([newLineItem()]);
  const [proUnlocked, setProUnlocked] = useState(false);
  const [pdfState, setPdfState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  const totals = calculateInvoiceTotals(items);

  const updateItem = (id: string, key: keyof InvoiceLineItem, value: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [key]:
                key === "description" ? value : Number.isNaN(Number(value)) ? 0 : Number(value)
            }
          : item
      )
    );
  };

  const downloadPdf = async () => {
    setPdfState("loading");
    try {
      const blob = await pdf(
        <InvoicePdf
          business={business}
          client={client}
          meta={meta}
          items={items}
          proUnlocked={proUnlocked}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${meta.invoiceNumber || "invoice"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setPdfState("done");
    } catch {
      setPdfState("error");
    }
  };

  const persistInvoice = () => {
    if (!proUnlocked) {
      setSaveMessage("Saving invoice history is a Pro feature in this MVP.");
      return;
    }

    saveInvoice({
      id: crypto.randomUUID(),
      invoiceNumber: meta.invoiceNumber,
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      total: totals.total,
      profit: totals.totalProfit,
      margin: totals.margin,
      createdAt: new Date().toISOString(),
      status: "draft"
    });
    setSaveMessage("Invoice saved to local history.");
  };

  return (
    <div className="page-grid">
      <section className="panel stack">
        <div className="section-head">
          <div>
            <p className="eyebrow">Invoice generator</p>
            <h1>Create a clean invoice and margin snapshot</h1>
          </div>
          <label className="toggle">
            <input
              checked={proUnlocked}
              onChange={(event) => setProUnlocked(event.target.checked)}
              type="checkbox"
            />
            <span>Pro preview</span>
          </label>
        </div>

        <div className="form-grid">
          <div className="stack">
            <h2>Business details</h2>
            <input className={fieldClass} placeholder="Business name" value={business.businessName} onChange={(e) => setBusiness({ ...business, businessName: e.target.value })} />
            <input className={fieldClass} placeholder="ABN / company number" value={business.companyNumber} onChange={(e) => setBusiness({ ...business, companyNumber: e.target.value })} />
            <input className={fieldClass} placeholder="Business email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} />
            <input className={fieldClass} placeholder="Phone" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
            <textarea className={fieldClass} placeholder="Address" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} />
          </div>

          <div className="stack">
            <h2>Client details</h2>
            <input className={fieldClass} placeholder="Client name" value={client.clientName} onChange={(e) => setClient({ ...client, clientName: e.target.value })} />
            <input className={fieldClass} placeholder="Client email" value={client.clientEmail} onChange={(e) => setClient({ ...client, clientEmail: e.target.value })} />
            <textarea className={fieldClass} placeholder="Client address" value={client.clientAddress} onChange={(e) => setClient({ ...client, clientAddress: e.target.value })} />
          </div>
        </div>

        <div className="form-grid">
          <div className="stack">
            <h2>Invoice details</h2>
            <input className={fieldClass} placeholder="Invoice number" value={meta.invoiceNumber} onChange={(e) => setMeta({ ...meta, invoiceNumber: e.target.value })} />
            <input className={fieldClass} type="date" value={meta.issueDate} onChange={(e) => setMeta({ ...meta, issueDate: e.target.value })} />
            <input className={fieldClass} type="date" value={meta.dueDate} onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })} />
          </div>

          <div className="stack">
            <h2>Commercial details</h2>
            <input className={fieldClass} placeholder="Currency" value={meta.currency} onChange={(e) => setMeta({ ...meta, currency: e.target.value.toUpperCase() })} />
            <input className={fieldClass} placeholder="Payment terms" value={meta.paymentTerms} onChange={(e) => setMeta({ ...meta, paymentTerms: e.target.value })} />
            <textarea className={fieldClass} placeholder="Notes" value={meta.notes} onChange={(e) => setMeta({ ...meta, notes: e.target.value })} />
          </div>
        </div>

        <div className="stack">
          <div className="section-head">
            <h2>Line items</h2>
            <button className="ghost-button" onClick={() => setItems((current) => [...current, newLineItem()])} type="button">
              Add item
            </button>
          </div>

          <div className="table-wrap">
            <table className="line-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit price</th>
                  <th>Unit cost</th>
                  <th>Tax %</th>
                  <th>Profit</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const line = totals.lines.find((entry) => entry.id === item.id)!;
                  return (
                    <tr key={item.id}>
                      <td>
                        <input className={fieldClass} placeholder="Line item" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} />
                      </td>
                      <td>
                        <input className={fieldClass} type="number" min="0" step="0.01" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", e.target.value)} />
                      </td>
                      <td>
                        <input className={fieldClass} type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", e.target.value)} />
                      </td>
                      <td>
                        <input className={fieldClass} type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", e.target.value)} />
                      </td>
                      <td>
                        <input className={fieldClass} type="number" min="0" step="0.01" value={item.taxRate} onChange={(e) => updateItem(item.id, "taxRate", e.target.value)} />
                      </td>
                      <td className="profit-cell">
                        {meta.currency} {line.profit.toFixed(2)}
                      </td>
                      <td>
                        <button className="ghost-button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} type="button">
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="actions">
          <button className="primary-button" onClick={downloadPdf} type="button">
            {pdfState === "loading" ? "Generating PDF..." : proUnlocked ? "Download branded PDF" : "Download watermarked PDF"}
          </button>
          <button className="secondary-button" onClick={persistInvoice} type="button">
            Save invoice
          </button>
          <span className="hint">{saveMessage || "Free users can preview and export. Pro saves history and removes the watermark."}</span>
        </div>
      </section>

      <aside className="panel preview">
        <p className="eyebrow">Live preview</p>
        <h2>{business.businessName || "Your business"}</h2>
        <div className="preview-meta">
          <span>{meta.invoiceNumber}</span>
          <span>Due {meta.dueDate || "not set"}</span>
        </div>
        <div className="preview-block">
          <strong>{client.clientName || "Client"}</strong>
          <p>{client.clientEmail || "client@example.com"}</p>
        </div>
        <div className="preview-list">
          {totals.lines.map((line) => (
            <div className="preview-row" key={line.id}>
              <div>
                <strong>{line.description || "Untitled line"}</strong>
                <p>
                  {line.quantity} × {meta.currency} {line.unitPrice.toFixed(2)}
                </p>
              </div>
              <strong>
                {meta.currency} {line.revenue.toFixed(2)}
              </strong>
            </div>
          ))}
        </div>
        <div className="summary-card">
          <div><span>Subtotal</span><strong>{meta.currency} {totals.subtotal.toFixed(2)}</strong></div>
          <div><span>Tax</span><strong>{meta.currency} {totals.taxTotal.toFixed(2)}</strong></div>
          <div><span>Total</span><strong>{meta.currency} {totals.total.toFixed(2)}</strong></div>
          <div><span>Profit</span><strong>{meta.currency} {totals.totalProfit.toFixed(2)}</strong></div>
          <div><span>Margin</span><strong>{totals.margin.toFixed(2)}%</strong></div>
        </div>
        {!proUnlocked ? <p className="watermark-note">Generated with MarginInvoice</p> : null}
      </aside>
    </div>
  );
}
