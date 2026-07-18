"use client";

import { createLocalStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { QuoteRecord } from "../lib/types";

const { useStore, read, write } = createLocalStore<QuoteRecord[]>(
  STORAGE_KEYS.QUOTES,
  []
);

export function useQuotes() {
  const { data: quotes, hasHydrated, write: setQuotes } = useStore();

  const addQuote = (quote: Omit<QuoteRecord, "id" | "created_at" | "updated_at">) => {
    const timestamp = new Date().toISOString();
    const newQuote: QuoteRecord = {
      ...quote,
      id: createQuoteId(),
      created_at: timestamp,
      updated_at: timestamp,
    };
    setQuotes([newQuote, ...quotes]);
    return newQuote;
  };

  const updateQuote = (id: string, updates: Partial<QuoteRecord>) => {
    setQuotes(
      quotes.map((q) =>
        q.id === id
          ? { ...q, ...updates, updated_at: new Date().toISOString() }
          : q
      )
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes(quotes.filter((q) => q.id !== id));
  };

  const getQuote = (id: string) => quotes.find((q) => q.id === id);

  return { quotes, hasHydrated, addQuote, updateQuote, deleteQuote, getQuote };
}

function createQuoteId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `quote_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
