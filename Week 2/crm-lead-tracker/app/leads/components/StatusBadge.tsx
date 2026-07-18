"use client";

import { statusBadgeClasses, statusLabels, type LeadStatus } from "../lib/leadDefaults";

type StatusBadgeProps = {
  status: LeadStatus;
  className?: string;
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  return (
    <span className={`${statusBadgeClasses[status]} ${className}`.trim()}>
      {statusLabels[status]}
    </span>
  );
}
