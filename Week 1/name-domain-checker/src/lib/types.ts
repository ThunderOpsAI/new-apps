export const AVAILABLE_EXTENSIONS = [".com", ".com.au", ".ai", ".io", ".co"] as const;
export const AVAILABLE_TONES = [
  "Premium",
  "Playful",
  "Professional",
  "Tech",
  "Local",
  "Bold",
] as const;
export const AVAILABLE_COUNTRIES = ["Global", "AU", "US"] as const;

export type Extension = (typeof AVAILABLE_EXTENSIONS)[number];
export type DomainStatus = "available" | "taken" | "unknown";
export type PaymentStatus = "free" | "paid" | "subscription";

export type GeneratedName = {
  name: string;
  rationale: string;
  tagline: string;
  toneFit: string;
  bestFor: string;
  domainCandidates: string[];
};

export type DomainCheckResult = {
  domain: string;
  extension: string;
  status: DomainStatus;
  purchaseUrl?: string;
  checkedAt: string;
};

export type ReportInput = {
  businessIdea: string;
  industry: string;
  tone: string;
  country?: string;
  extensions: string[];
  email?: string;
};

export type ReportRecord = {
  id: string;
  createdAt: string;
  email?: string;
  businessIdea: string;
  industry: string;
  tone: string;
  country?: string;
  aiOutput: { names: GeneratedName[] };
  domainResults: Record<string, DomainCheckResult[]>;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
  unlockToken: string;
};
