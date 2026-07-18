"use client";

import React, { useState } from "react";
import { BriefInputForm } from "./components/BriefInputForm";
import { BriefOutputPanel } from "./components/BriefOutputPanel";
import { BriefActionsBar } from "./components/BriefActionsBar";
import { useBriefGenerator } from "./hooks/useBriefGenerator";
import { useBriefs } from "./hooks/useBriefs";
import { useLeads } from "@/app/leads/hooks/useLeads";
import { BriefInput, BriefOutput, ScopeOutput, ProjectBrief } from "./lib/types";

export default function BriefBuilderPage() {
  const [input, setInput] = useState<BriefInput>({
    client_name: "",
    project_type: "",
    client_goal: "",
    known_requirements: "",
    budget: "",
    timeline: "",
    notes: "",
    tone: "Professional",
  });

  const [output, setOutput] = useState<{ brief: BriefOutput; scope: ScopeOutput } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const { generate, loading, error } = useBriefGenerator();
  const { addBrief, updateBrief } = useBriefs();
  const { updateLead } = useLeads();

  const handleGenerate = async () => {
    const result = await generate(input);
    if (result) {
      setOutput(result);
      // Scroll to output on mobile
      if (window.innerWidth < 768) {
        setTimeout(() => {
          document.querySelector(".brief-output-column")?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  };

  const handleSave = async () => {
    if (!output) return;
    
    setIsSaving(true);
    try {
      const newBrief = addBrief({
        input,
        brief: output.brief,
        scope: output.scope,
        linkedLeadId: input.linked_lead_id,
      });

      if (input.linked_lead_id) {
        updateLead(input.linked_lead_id, { briefId: newBrief.id });
      }

      alert(`Saved successfully!${input.linked_lead_id ? " Linked to lead." : ""}`);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save brief.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="shell">
      <header className="hero-card" style={{ marginBottom: "var(--space-8)" }}>
        <h1 className="page-title">Brief & Scope Builder</h1>
        <p className="page-subtitle">
          Convert rough notes into professional project documentation with AI.
        </p>
      </header>

      <div className="brief-builder-layout">
        <div className="brief-input-column">
          <BriefInputForm
            input={input}
            onChange={setInput}
            onGenerate={handleGenerate}
            loading={loading}
          />
        </div>

        <div className="brief-output-column">
          {error && (
            <div className="panel" style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
              <p>{error}</p>
              <button className="button button--ghost" onClick={handleGenerate} style={{ marginTop: "var(--space-2)" }}>
                Try Again
              </button>
            </div>
          )}

          {!output && !loading && !error && (
            <div className="empty-state">
              <div className="empty-state__icon">📄</div>
              <h3 className="empty-state__title">No Brief Generated Yet</h3>
              <p className="empty-state__description">
                Fill out the form on the left and click "Generate Brief" to see the magic happen.
              </p>
            </div>
          )}

          {loading && (
            <div className="empty-state">
              <div className="spinner" style={{ marginBottom: "var(--space-4)" }}></div>
              <h3 className="empty-state__title">Structuring your brief...</h3>
              <p className="empty-state__description">
                Claude is analyzing your notes and organizing the project scope.
              </p>
            </div>
          )}

          {output && (
            <>
              <BriefOutputPanel
                brief={output.brief}
                scope={output.scope}
                onBriefChange={(brief) => setOutput({ ...output, brief })}
                onScopeChange={(scope) => setOutput({ ...output, scope })}
              />
              <BriefActionsBar
                brief={output.brief}
                scope={output.scope}
                onSave={handleSave}
                onRegenerate={handleGenerate}
                isSaving={isSaving}
              />
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .brief-builder-layout {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: var(--space-8);
          align-items: start;
        }

        @media (max-width: 1024px) {
          .brief-builder-layout {
            grid-template-columns: 1fr;
          }
        }

        @media print {
          .brief-input-column {
            display: none !important;
          }
          .hero-card {
            display: none !important;
          }
          .brief-builder-layout {
            display: block !important;
          }
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--color-bg-subtle);
          border-top: 4px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
