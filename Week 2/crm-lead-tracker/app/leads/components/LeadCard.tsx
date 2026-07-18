"use client";

import { StatusBadge } from "./StatusBadge";
import {
  formatCurrency,
  formatDateForDisplay,
  isOverdueFollowUp,
  type Lead,
} from "../lib/leadDefaults";

type LeadCardProps = {
  lead: Lead;
  onOpenLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
};

export function LeadCard({ lead, onOpenLead, onDeleteLead }: LeadCardProps) {
  const isOverdue = isOverdueFollowUp(lead);

  return (
    <article className="lead-card">
      <div className="lead-card__header">
        <div>
          <h3 className="lead-card__title">{lead.name}</h3>
          <p className="lead-card__subtitle">{lead.company || "No company yet"}</p>
        </div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="lead-card__details">
        <div>
          <span className="lead-card__label">Value</span>
          <strong>{formatCurrency(lead.value)}</strong>
        </div>
        <div>
          <span className="lead-card__label">Next Follow-Up</span>
          <strong className={isOverdue ? "overdue-text" : undefined}>
            {isOverdue ? "⚠ " : ""}
            {formatDateForDisplay(lead.nextFollowUp)}
          </strong>
        </div>
      </div>

      <div className="lead-card__actions">
        <button className="button button--ghost" type="button" onClick={() => onOpenLead(lead)}>
          View
        </button>
        <button
          className="button button--ghost button--danger"
          type="button"
          onClick={() => onDeleteLead(lead)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
