import type { DomainCheckResult } from "@/lib/types";

function buildPurchaseUrl(domain: string) {
  return `https://www.namecheap.com/domains/registration/results/?domain=${encodeURIComponent(domain)}`;
}

function extractExtension(domain: string) {
  const parts = domain.split(".");
  return parts.length > 2 ? `.${parts.slice(1).join(".")}` : `.${parts[1] ?? ""}`;
}

async function lookupWithProvider(domain: string) {
  const endpoint = process.env.DOMAIN_CHECK_API_URL;
  if (!endpoint) {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.DOMAIN_CHECK_API_KEY
        ? { Authorization: `Bearer ${process.env.DOMAIN_CHECK_API_KEY}` }
        : {}),
    },
    body: JSON.stringify({ domain }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Domain provider failed with ${response.status}`);
  }

  const payload = (await response.json()) as { status?: string };
  if (!payload.status) {
    return null;
  }

  if (payload.status === "available" || payload.status === "taken" || payload.status === "unknown") {
    return payload.status;
  }

  return "unknown";
}

export async function checkDomainAvailability(domain: string): Promise<DomainCheckResult> {
  const checkedAt = new Date().toISOString();

  try {
    const status = await lookupWithProvider(domain);
    return {
      domain,
      extension: extractExtension(domain),
      status: status ?? "unknown",
      purchaseUrl: buildPurchaseUrl(domain),
      checkedAt,
    };
  } catch {
    return {
      domain,
      extension: extractExtension(domain),
      status: "unknown",
      purchaseUrl: buildPurchaseUrl(domain),
      checkedAt,
    };
  }
}
