import { SavedInvoice } from "@/types/invoice";

const STORAGE_KEY = "invoice-margin-history";

export const getSavedInvoices = (): SavedInvoice[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SavedInvoice[];
  } catch {
    return [];
  }
};

export const saveInvoice = (invoice: SavedInvoice) => {
  const current = getSavedInvoices();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([invoice, ...current].slice(0, 25)));
};
