"use client";

import React from "react";
import { formatBriefAsText, formatScopeAsText } from "../utils/briefExport";
import { BriefOutput, ScopeOutput } from "../lib/types";

interface BriefActionsBarProps {
  brief: BriefOutput;
  scope: ScopeOutput;
  onSave: () => void;
  onRegenerate: () => void;
  isSaving: boolean;
}

export function BriefActionsBar({
  brief,
  scope,
  onSave,
  onRegenerate,
  isSaving,
}: BriefActionsBarProps) {
  const handleCopyBrief = () => {
    const text = formatBriefAsText(brief);
    navigator.clipboard.writeText(text);
    alert("Brief copied to clipboard!");
  };

  const handleCopyScope = () => {
    const text = formatScopeAsText(scope);
    navigator.clipboard.writeText(text);
    alert("Scope copied to clipboard!");
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = () => {
    if (confirm("This will overwrite your current output. Are you sure?")) {
      onRegenerate();
    }
  };

  return (
    <div className="panel" style={{ position: "sticky", bottom: "var(--space-4)", zIndex: 10, display: "flex", gap: "var(--space-2)", flexWrap: "wrap", justifyContent: "center", boxShadow: "var(--shadow-lg)" }}>
      <button
        className="button button--primary"
        onClick={onSave}
        disabled={isSaving}
      >
        {isSaving ? "Saving..." : "Save to CRM"}
      </button>

      <button className="button button--ghost" onClick={handleCopyBrief}>
        Copy Brief
      </button>

      <button className="button button--ghost" onClick={handleCopyScope}>
        Copy Scope
      </button>

      <button className="button button--ghost" onClick={handlePrint}>
        Export / Print
      </button>

      <button className="button button--ghost" onClick={handleRegenerate}>
        Regenerate
      </button>

      <button className="button button--ghost" disabled title="Coming in Build 5">
        Use in Proposal
      </button>

      <style jsx>{`
        @media print {
          .panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
