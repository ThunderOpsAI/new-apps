import {
  AVAILABLE_COUNTRIES,
  AVAILABLE_EXTENSIONS,
  AVAILABLE_TONES,
  type ReportInput,
} from "@/lib/types";

const spamPatterns = [
  /https?:\/\//i,
  /\bviagra\b/i,
  /\bcasino\b/i,
  /\bcrypto giveaway\b/i,
  /(.)\1{7,}/i,
];

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateReportInput(input: unknown): ReportInput {
  const raw = (input ?? {}) as Record<string, unknown>;
  const businessIdea = cleanString(raw.businessIdea);
  const industry = cleanString(raw.industry);
  const tone = cleanString(raw.tone);
  const country = cleanString(raw.country);
  const email = cleanString(raw.email);
  const extensions = Array.isArray(raw.extensions)
    ? raw.extensions
        .map((value) => cleanString(value))
        .filter((value): value is string =>
          AVAILABLE_EXTENSIONS.includes(value as (typeof AVAILABLE_EXTENSIONS)[number]),
        )
    : [];

  if (businessIdea.length < 20 || businessIdea.length > 500) {
    throw new Error("Business idea must be between 20 and 500 characters.");
  }

  if (!industry) {
    throw new Error("Industry is required.");
  }

  if (!AVAILABLE_TONES.includes(tone as (typeof AVAILABLE_TONES)[number])) {
    throw new Error("Select a supported brand tone.");
  }

  if (country && !AVAILABLE_COUNTRIES.includes(country as (typeof AVAILABLE_COUNTRIES)[number])) {
    throw new Error("Select a supported country.");
  }

  if (spamPatterns.some((pattern) => pattern.test(businessIdea))) {
    throw new Error("That submission looks invalid. Please enter a real business brief.");
  }

  return {
    businessIdea,
    industry,
    tone,
    country: country || "Global",
    extensions: extensions.length > 0 ? extensions : [".com", ".com.au", ".ai"],
    email: email || undefined,
  };
}

export function validateGeneratedNames(value: unknown) {
  const raw = (value ?? {}) as { names?: unknown[] };
  if (!Array.isArray(raw.names) || raw.names.length !== 20) {
    throw new Error("AI output did not return exactly 20 names.");
  }

  return {
    names: raw.names.map((item) => {
      const entry = (item ?? {}) as Record<string, unknown>;
      const name = cleanString(entry.name);
      const rationale = cleanString(entry.rationale);
      const tagline = cleanString(entry.tagline);
      const toneFit = cleanString(entry.toneFit);
      const bestFor = cleanString(entry.bestFor);
      const domainCandidates = Array.isArray(entry.domainCandidates)
        ? entry.domainCandidates
            .map((candidate) => cleanString(candidate).toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        : [];

      if (!name || !rationale || !tagline || !toneFit || !bestFor || domainCandidates.length === 0) {
        throw new Error("AI output had missing required fields.");
      }

      return {
        name,
        rationale,
        tagline,
        toneFit,
        bestFor,
        domainCandidates,
      };
    }),
  };
}
