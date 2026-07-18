"use client";

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View
} from "@react-pdf/renderer";

import { BusinessDetails, ClientDetails, InvoiceLineItem, InvoiceMeta } from "@/types/invoice";
import { calculateInvoiceTotals } from "@/lib/calculations";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    color: "#16211d"
  },
  header: {
    marginBottom: 18
  },
  title: {
    fontSize: 22,
    marginBottom: 8
  },
  section: {
    marginBottom: 14
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#a6b7b0",
    paddingBottom: 6,
    marginBottom: 6
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#dde5e1"
  },
  desc: { width: "38%" },
  qty: { width: "12%" },
  price: { width: "18%" },
  total: { width: "18%" },
  summary: {
    marginTop: 18,
    marginLeft: "auto",
    width: 200
  },
  watermark: {
    position: "absolute",
    top: "47%",
    left: 100,
    transform: "rotate(-24deg)",
    fontSize: 28,
    color: "#d7dedb"
  }
});

export function InvoicePdf({
  business,
  client,
  meta,
  items,
  proUnlocked
}: {
  business: BusinessDetails;
  client: ClientDetails;
  meta: InvoiceMeta;
  items: InvoiceLineItem[];
  proUnlocked: boolean;
}) {
  const totals = calculateInvoiceTotals(items);

  return (
    <Document title={`${meta.invoiceNumber || "invoice"}.pdf`}>
      <Page size="A4" style={styles.page}>
        {!proUnlocked ? (
          <Text style={styles.watermark}>Generated with MarginInvoice</Text>
        ) : null}

        <View style={styles.header}>
          <Text style={styles.title}>{business.businessName || "Your business"}</Text>
          <Text>{business.email}</Text>
          <Text>{business.address}</Text>
        </View>

        <View style={[styles.section, styles.row]}>
          <View>
            <Text>Invoice: {meta.invoiceNumber || "Draft"}</Text>
            <Text>Issue date: {meta.issueDate || "-"}</Text>
            <Text>Due date: {meta.dueDate || "-"}</Text>
          </View>
          <View>
            <Text>Bill to</Text>
            <Text>{client.clientName || "Client name"}</Text>
            <Text>{client.clientEmail || "client@example.com"}</Text>
            <Text>{client.clientAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.tableHead}>
            <Text style={styles.desc}>Description</Text>
            <Text style={styles.qty}>Qty</Text>
            <Text style={styles.price}>Unit price</Text>
            <Text style={styles.total}>Line total</Text>
          </View>
          {totals.lines.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.desc}>{item.description || "Untitled item"}</Text>
              <Text style={styles.qty}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.price}>
                {meta.currency} {item.unitPrice.toFixed(2)}
              </Text>
              <Text style={styles.total}>
                {meta.currency} {item.revenue.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <Text>
            Subtotal: {meta.currency} {totals.subtotal.toFixed(2)}
          </Text>
          <Text>
            Tax: {meta.currency} {totals.taxTotal.toFixed(2)}
          </Text>
          <Text>
            Total: {meta.currency} {totals.total.toFixed(2)}
          </Text>
          <Text>
            Profit: {meta.currency} {totals.totalProfit.toFixed(2)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text>Payment terms: {meta.paymentTerms || "-"}</Text>
          <Text>Notes: {meta.notes || "-"}</Text>
        </View>
      </Page>
    </Document>
  );
}
