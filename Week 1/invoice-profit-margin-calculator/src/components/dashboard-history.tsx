"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getSavedInvoices } from "@/lib/storage";
import { SavedInvoice } from "@/types/invoice";

export function DashboardHistory() {
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);

  useEffect(() => {
    setInvoices(getSavedInvoices());
  }, []);

  if (invoices.length === 0) {
    return (
      <section className="panel">
        <p className="eyebrow">Invoice history</p>
        <h1>No saved invoices yet</h1>
        <p className="lede">
          In this MVP, saved history is kept in local storage when Pro preview is enabled.
        </p>
      </section>
    );
  }

  return (
    <section className="panel stack">
      <div>
        <p className="eyebrow">Invoice history</p>
        <h1>Recent saved invoices</h1>
      </div>
      <div className="table-wrap">
        <table className="line-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Total</th>
              <th>Profit</th>
              <th>Margin</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>
                  <Link href="/invoice">{invoice.invoiceNumber}</Link>
                </td>
                <td>{invoice.clientName || invoice.clientEmail}</td>
                <td>${invoice.total.toFixed(2)}</td>
                <td>${invoice.profit.toFixed(2)}</td>
                <td>{invoice.margin.toFixed(2)}%</td>
                <td>{invoice.status}</td>
                <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
