"use client";

import React from "react";
import { BriefOutput, ScopeOutput } from "../lib/types";
import { BriefSection } from "./BriefSection";
import { EditableList } from "./EditableList";

interface BriefOutputPanelProps {
  brief: BriefOutput;
  scope: ScopeOutput;
  onBriefChange: (brief: BriefOutput) => void;
  onScopeChange: (scope: ScopeOutput) => void;
}

export function BriefOutputPanel({
  brief,
  scope,
  onBriefChange,
  onScopeChange,
}: BriefOutputPanelProps) {
  const updateBriefField = (field: keyof BriefOutput, value: any) => {
    onBriefChange({ ...brief, [field]: value });
  };

  const updateScopeField = (field: keyof ScopeOutput, value: any) => {
    onScopeChange({ ...scope, [field]: value });
  };

  return (
    <div className="section-stack">
      <div className="brief-output-container">
        <h2 className="section-title">A. Project Brief</h2>
        
        <BriefSection title="Project Summary">
          <textarea
            className="input"
            value={brief.project_summary}
            onChange={(e) => updateBriefField("project_summary", e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </BriefSection>

        <BriefSection title="Client Problem">
          <textarea
            className="input"
            value={brief.client_problem}
            onChange={(e) => updateBriefField("client_problem", e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </BriefSection>

        <BriefSection title="Desired Outcome">
          <textarea
            className="input"
            value={brief.desired_outcome}
            onChange={(e) => updateBriefField("desired_outcome", e.target.value)}
            rows={3}
            style={{ width: "100%", resize: "vertical" }}
          />
        </BriefSection>

        <BriefSection title="Key Deliverables">
          <EditableList
            items={brief.key_deliverables}
            onChange={(items) => updateBriefField("key_deliverables", items)}
          />
        </BriefSection>

        <BriefSection title="Assumptions">
          <EditableList
            items={brief.assumptions}
            onChange={(items) => updateBriefField("assumptions", items)}
          />
        </BriefSection>

        <BriefSection title="Missing Information" highlight={brief.missing_information.length > 0}>
          <EditableList
            items={brief.missing_information}
            onChange={(items) => updateBriefField("missing_information", items)}
          />
        </BriefSection>

        <BriefSection title="Questions to Ask">
          <EditableList
            items={brief.questions_to_ask}
            onChange={(items) => updateBriefField("questions_to_ask", items)}
          />
        </BriefSection>

        <BriefSection title="Risks / Red Flags" highlight={brief.risks.length > 0}>
          <EditableList
            items={brief.risks}
            onChange={(items) => updateBriefField("risks", items)}
          />
        </BriefSection>

        <BriefSection title="Recommended Next Step">
          <textarea
            className="input"
            value={brief.recommended_next_step}
            onChange={(e) => updateBriefField("recommended_next_step", e.target.value)}
            rows={2}
            style={{ width: "100%", resize: "vertical" }}
          />
        </BriefSection>

        <h2 className="section-title" style={{ marginTop: "var(--space-8)" }}>B. Scope of Work</h2>

        <BriefSection title="In-Scope Items">
          <EditableList
            items={scope.in_scope}
            onChange={(items) => updateScopeField("in_scope", items)}
          />
        </BriefSection>

        <BriefSection title="Out-of-Scope Items">
          <EditableList
            items={scope.out_of_scope}
            onChange={(items) => updateScopeField("out_of_scope", items)}
          />
        </BriefSection>

        <BriefSection title="Milestones">
          <EditableList
            items={scope.milestones}
            onChange={(items) => updateScopeField("milestones", items)}
          />
        </BriefSection>

        <BriefSection title="Client Responsibilities">
          <EditableList
            items={scope.client_responsibilities}
            onChange={(items) => updateScopeField("client_responsibilities", items)}
          />
        </BriefSection>

        <BriefSection title="Acceptance Criteria">
          <EditableList
            items={scope.acceptance_criteria}
            onChange={(items) => updateScopeField("acceptance_criteria", items)}
          />
        </BriefSection>

        <BriefSection title="Revision Limits">
          <textarea
            className="input"
            value={scope.revision_limits}
            onChange={(e) => updateScopeField("revision_limits", e.target.value)}
            rows={2}
            style={{ width: "100%", resize: "vertical" }}
          />
        </BriefSection>
        
        <footer style={{ marginTop: "var(--space-8)", padding: "var(--space-4)", borderTop: "1px solid var(--color-border)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
          <p>This brief is a working document, not a legal contract.</p>
        </footer>
      </div>

      <style jsx>{`
        @media print {
          .brief-output-container {
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          :global(.panel) {
            border: 1px solid #ccc !important;
            break-inside: avoid;
          }
          :global(.section-header) {
            display: none !important;
          }
          :global(.editable-list button) {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
