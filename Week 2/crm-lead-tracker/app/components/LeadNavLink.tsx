"use client";

import Link from "next/link";
import { useLeads } from "../leads/hooks/useLeads";
import { isOverdueFollowUp } from "../leads/lib/leadDefaults";

export function LeadNavLink() {
  const { leads } = useLeads();
  const overdueCount = leads.filter(isOverdueFollowUp).length;

  return (
    <Link href="/leads" className="nav__link nav__link--badge">
      <span>Leads</span>
      {overdueCount > 0 ? (
        <span className="nav-badge" aria-label={`${overdueCount} overdue follow-ups`}>
          {overdueCount}
        </span>
      ) : null}
    </Link>
  );
}
