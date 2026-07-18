"use client";

import { createLocalStore } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { ProjectBrief } from "../lib/types";

const { useStore, read, write } = createLocalStore<ProjectBrief[]>(
  STORAGE_KEYS.BRIEFS,
  []
);

export function useBriefs() {
  const { data: briefs, hasHydrated, write: setBriefs } = useStore();

  const addBrief = (brief: Omit<ProjectBrief, "id" | "createdAt" | "updatedAt">) => {
    const timestamp = new Date().toISOString();
    const newBrief: ProjectBrief = {
      ...brief,
      id: createBriefId(),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setBriefs([newBrief, ...briefs]);
    return newBrief;
  };

  const updateBrief = (id: string, updates: Partial<ProjectBrief>) => {
    setBriefs(
      briefs.map((b) =>
        b.id === id
          ? { ...b, ...updates, updatedAt: new Date().toISOString() }
          : b
      )
    );
  };

  const deleteBrief = (id: string) => {
    setBriefs(briefs.filter((b) => b.id !== id));
  };

  const getBrief = (id: string) => briefs.find((b) => b.id === id);

  return { briefs, hasHydrated, addBrief, updateBrief, deleteBrief, getBrief };
}

function createBriefId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `brief_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
