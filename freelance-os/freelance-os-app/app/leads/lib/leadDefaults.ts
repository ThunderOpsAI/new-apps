export const LEADS_STORAGE_KEY = "freelanceos_leads";

export const leadStatuses = [
  "new",
  "contacted",
  "replied",
  "proposal_sent",
  "won",
  "lost",
  "follow_up_later",
] as const;

export const leadSources = [
  "referral",
  "linkedin",
  "cold_email",
  "upwork",
  "fiverr",
  "inbound",
  "other",
] as const;

export type LeadStatus = (typeof leadStatuses)[number];
export type LeadSource = (typeof leadSources)[number];

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  company: string;
  email: string;
  source: LeadSource;
  service: string;
  value: number;
  status: LeadStatus;
  lastContacted: string | null;
  nextFollowUp: string | null;
  notes: string;
  outreachGenerated: boolean;
  followUpCount: number;
  communicationHistory: CommunicationEntry[];
  previousOutreachSummary: string | null;
  briefId?: string;
};

export interface CommunicationEntry {
  date: string;
  type: "outreach" | "follow_up" | "reply" | "meeting" | "note";
  messagePreview: string;
  method: "email" | "linkedin" | "sms" | "call" | "other";
}

export type LeadStats = {
  total: number;
  active: number;
  proposalsSent: number;
  won: number;
  pipelineValue: number;
};

export type LeadDraft = Partial<Lead> & {
  name: string;
};

export const statusLabels: Record<LeadStatus, string> = {
  new: "New Lead",
  contacted: "Contacted",
  replied: "Replied",
  proposal_sent: "Proposal Sent",
  won: "Won ✓",
  lost: "Lost",
  follow_up_later: "Follow Up Later",
};

export const statusBadgeClasses: Record<LeadStatus, string> = {
  new: "badge badge--blue",
  contacted: "badge badge--yellow",
  replied: "badge badge--purple",
  proposal_sent: "badge badge--orange",
  won: "badge badge--green",
  lost: "badge badge--gray",
  follow_up_later: "badge badge--pink",
};

export const sourceLabels: Record<LeadSource, string> = {
  referral: "Referral",
  linkedin: "LinkedIn",
  cold_email: "Cold Email",
  upwork: "Upwork",
  fiverr: "Fiverr",
  inbound: "Inbound",
  other: "Other",
};

export const statusTabs: Array<{ label: string; value: LeadStatus | "all" }> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Replied", value: "replied" },
  { label: "Proposal Sent", value: "proposal_sent" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
  { label: "Follow Up Later", value: "follow_up_later" },
];

export function makeLead(partial: LeadDraft): Lead {
  const timestamp = new Date().toISOString();

  return {
    id: createLeadId(),
    createdAt: timestamp,
    updatedAt: timestamp,
    name: partial.name.trim(),
    company: partial.company?.trim() ?? "",
    email: partial.email?.trim() ?? "",
    source: partial.source ?? "other",
    service: partial.service?.trim() ?? "",
    value: Number.isFinite(partial.value) ? Number(partial.value) : 0,
    status: "new",
    lastContacted: partial.lastContacted ?? null,
    nextFollowUp: partial.nextFollowUp ?? null,
    notes: partial.notes?.trim() ?? "",
    outreachGenerated: partial.outreachGenerated ?? false,
    followUpCount: partial.followUpCount ?? 0,
    communicationHistory: partial.communicationHistory ?? [],
    previousOutreachSummary: partial.previousOutreachSummary ?? null,
  };
}

export function createEmptyLeadDraft() {
  return {
    name: "",
    email: "",
    company: "",
    service: "",
    source: "other" as LeadSource,
    value: "",
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDateForInput(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function formatDateForDisplay(value: string | null) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
}

export function normaliseDateInput(value: string) {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00`).toISOString();
}

export function isOverdueFollowUp(lead: Lead) {
  if (!lead.nextFollowUp || lead.status === "won" || lead.status === "lost") {
    return false;
  }

  const followUp = new Date(lead.nextFollowUp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  followUp.setHours(0, 0, 0, 0);

  return followUp.getTime() < today.getTime();
}

export function createLeadId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
