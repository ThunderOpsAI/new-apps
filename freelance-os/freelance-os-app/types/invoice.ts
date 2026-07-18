export type InvoiceLineItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  taxRate: number;
};

export type BusinessDetails = {
  businessName: string;
  companyNumber: string;
  email: string;
  phone: string;
  address: string;
};

export type ClientDetails = {
  clientName: string;
  clientEmail: string;
  clientAddress: string;
};

export type InvoiceMeta = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  paymentTerms: string;
  notes: string;
};

export type SavedInvoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  profit: number;
  margin: number;
  createdAt: string;
  status: "draft" | "sent" | "paid" | "manual";
};
