"use client";

import React, { useState } from "react";

interface BriefSectionProps {
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  defaultExpanded?: boolean;
}

export function BriefSection({
  title,
  children,
  highlight = false,
  defaultExpanded = true,
}: BriefSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`panel ${highlight ? "highlight-amber" : ""}`} style={{ marginBottom: "var(--space-4)" }}>
      <button
        type="button"
        className="section-header"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "none",
          border: "none",
          padding: "0",
          cursor: "pointer",
          textAlign: "left",
          color: "inherit",
          font: "inherit",
          fontWeight: "600",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>{title}</span>
        <span>{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div style={{ marginTop: "var(--space-4)" }}>
          {children}
        </div>
      )}

      <style jsx>{`
        .highlight-amber {
          border-left: 4px solid var(--color-warning, #f59e0b);
          background-color: var(--color-warning-light, rgba(245, 158, 11, 0.05));
        }
      `}</style>
    </div>
  );
}
