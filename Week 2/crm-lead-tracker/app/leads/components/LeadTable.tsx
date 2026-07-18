"use client";

import { StatusBadge } from "./StatusBadge";
import {
  formatCurrency,
  formatDateForDisplay,
  isOverdueFollowUp,
  sourceLabels,
  type Lead,
} from "../lib/leadDefaults";

export type LeadSortKey =
  | "createdAt"
  | "name"
  | "company"
  | "value"
  | "status"
  | "lastContacted"
  | "nextFollowUp";

export type LeadSortDirection = "asc" | "desc";

type LeadTableProps = {
  leads: Lead[];
  sortKey: LeadSortKey;
  sortDirection: LeadSortDirection;
  onSortChange: (key: LeadSortKey) => void;
  onOpenLead: (lead: Lead) => void;
  onDeleteLead: (lead: Lead) => void;
};

function getSortIndicator(
  sortKey: LeadSortKey,
  sortDirection: LeadSortDirection,
  columnKey: LeadSortKey,
) {
  if (sortKey !== columnKey) {
    return "↕";
  }

  return sortDirection === "asc" ? "↑" : "↓";
}

export function LeadTable({
  leads,
  sortKey,
  sortDirection,
  onSortChange,
  onOpenLead,
  onDeleteLead,
}: LeadTableProps) {
  return (
    <div className="table-shell">
      <table className="lead-table">
        <thead>
          <tr>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("name")}
              >
                <span>Name</span>
                <span>{getSortIndicator(sortKey, sortDirection, "name")}</span>
              </button>
            </th>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("company")}
              >
                <span>Company</span>
                <span>{getSortIndicator(sortKey, sortDirection, "company")}</span>
              </button>
            </th>
            <th>Service</th>
            <th>Source</th>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("value")}
              >
                <span>Value</span>
                <span>{getSortIndicator(sortKey, sortDirection, "value")}</span>
              </button>
            </th>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("status")}
              >
                <span>Status</span>
                <span>{getSortIndicator(sortKey, sortDirection, "status")}</span>
              </button>
            </th>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("lastContacted")}
              >
                <span>Last Contacted</span>
                <span>{getSortIndicator(sortKey, sortDirection, "lastContacted")}</span>
              </button>
            </th>
            <th>
              <button
                className="table-sort"
                type="button"
                onClick={() => onSortChange("nextFollowUp")}
              >
                <span>Next Follow-Up</span>
                <span>{getSortIndicator(sortKey, sortDirection, "nextFollowUp")}</span>
              </button>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const isOverdue = isOverdueFollowUp(lead);

            return (
              <tr
                key={lead.id}
                className="lead-table__row"
                onClick={() => onOpenLead(lead)}
              >
                <td>
                  <div className="lead-primary">
                    <span className="lead-primary__name">{lead.name}</span>
                    <span className="lead-primary__email">
                      {lead.email || "No email yet"}
                    </span>
                  </div>
                </td>
                <td>{lead.company || "—"}</td>
                <td>{lead.service || "—"}</td>
                <td>{sourceLabels[lead.source]}</td>
                <td>{formatCurrency(lead.value)}</td>
                <td>
                  <StatusBadge status={lead.status} />
                </td>
                <td>{formatDateForDisplay(lead.lastContacted)}</td>
                <td>
                  <span className={isOverdue ? "overdue-text" : undefined}>
                    {isOverdue ? "⚠ " : ""}
                    {formatDateForDisplay(lead.nextFollowUp)}
                  </span>
                </td>
                <td>
                  <div className="table-actions" onClick={(event) => event.stopPropagation()}>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Edit ${lead.name}`}
                      onClick={() => onOpenLead(lead)}
                    >
                      ✏
                    </button>
                    <button
                      className="icon-button icon-button--danger"
                      type="button"
                      aria-label={`Delete ${lead.name}`}
                      onClick={() => onDeleteLead(lead)}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
