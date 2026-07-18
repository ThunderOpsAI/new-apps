"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  LEADS_STORAGE_KEY,
  makeLead,
  type Lead,
  type LeadDraft,
  type LeadStats,
} from "../lib/leadDefaults";

const EMPTY_LEADS: Lead[] = [];
const SERVER_HAS_NOT_HYDRATED = false;

function readStoredLeads(): Lead[] {
  if (typeof window === "undefined") {
    return EMPTY_LEADS;
  }

  const raw = window.localStorage.getItem(LEADS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isLeadLike).sort(sortByCreatedAtDesc);
  } catch {
    return [];
  }
}

function isLeadLike(value: unknown): value is Lead {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Lead>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
}

function sortByCreatedAtDesc(a: Lead, b: Lead) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

const LEADS_STORE_EVENT = "freelanceos_leads:changed";

function writeStoredLeads(nextLeads: Lead[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(nextLeads));
  window.dispatchEvent(new Event(LEADS_STORE_EVENT));
}

function subscribeToLeadsStore(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(LEADS_STORE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(LEADS_STORE_EVENT, handleChange);
  };
}

export function useLeads() {
  const leads = useSyncExternalStore(
    subscribeToLeadsStore,
    readStoredLeads,
    () => EMPTY_LEADS,
  );

  const hasHydrated = useSyncExternalStore(
    subscribeToLeadsStore,
    () => true,
    () => SERVER_HAS_NOT_HYDRATED,
  );

  const setAndPersist = (updater: (current: Lead[]) => Lead[]) => {
    const next = updater(readStoredLeads()).sort(sortByCreatedAtDesc);
    writeStoredLeads(next);
  };

  const addLead = (partial: LeadDraft) => {
    const nextLead = makeLead(partial);
    setAndPersist((current) => [nextLead, ...current]);
    return nextLead;
  };

  const updateLead = (id: string, changes: Partial<Lead>) => {
    let updatedLead: Lead | undefined;

    setAndPersist((current) =>
      current.map((lead) => {
        if (lead.id !== id) {
          return lead;
        }

        updatedLead = {
          ...lead,
          ...changes,
          updatedAt: new Date().toISOString(),
        };

        return updatedLead;
      }),
    );

    return updatedLead;
  };

  const deleteLead = (id: string) => {
    setAndPersist((current) => current.filter((lead) => lead.id !== id));
  };

  const getLead = (id: string) => leads.find((lead) => lead.id === id);

  const stats = useMemo<LeadStats>(() => {
    return leads.reduce<LeadStats>(
      (acc, lead) => {
        acc.total += 1;

        if (lead.status !== "won" && lead.status !== "lost") {
          acc.active += 1;
        }

        if (lead.status === "proposal_sent") {
          acc.proposalsSent += 1;
        }

        if (lead.status === "won") {
          acc.won += 1;
        }

        if (lead.status !== "lost") {
          acc.pipelineValue += lead.value;
        }

        return acc;
      },
      {
        total: 0,
        active: 0,
        proposalsSent: 0,
        won: 0,
        pipelineValue: 0,
      },
    );
  }, [leads]);

  return {
    leads,
    addLead,
    updateLead,
    deleteLead,
    getLead,
    stats,
    hasHydrated,
  };
}
