"use client";

import React, { useEffect } from "react";
import { BriefInput, PROJECT_TYPES, TONE_OPTIONS } from "../lib/types";
import { useLeads } from "@/app/leads/hooks/useLeads";

interface BriefInputFormProps {
  input: BriefInput;
  onChange: (input: BriefInput) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function BriefInputForm({ input, onChange, onGenerate, loading }: BriefInputFormProps) {
  const { leads } = useLeads();

  const handleFieldChange = (field: keyof BriefInput, value: string) => {
    const next = { ...input, [field]: value };
    
    // If linking a lead, prefill client name
    if (field === "linked_lead_id" && value) {
      const selectedLead = leads.find(l => l.id === value);
      if (selectedLead) {
        next.client_name = selectedLead.name;
        // If the lead has notes, maybe prefill project type or goal? 
        // For now just name as per spec.
      }
    }
    
    onChange(next);
  };

  const isReady = input.client_name && input.project_type && input.client_goal;

  return (
    <div className="section-stack">
      <div className="panel">
        <h2 className="section-title">Project Details</h2>
        
        <div className="field">
          <label className="label">Link to Lead (Optional)</label>
          <select
            className="select"
            value={input.linked_lead_id || ""}
            onChange={(e) => handleFieldChange("linked_lead_id", e.target.value)}
          >
            <option value="">-- No Link --</option>
            {leads.map((lead) => (
              <option key={lead.id} value={lead.id}>
                {lead.name} {lead.company ? `(${lead.company})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Client / Business Name*</label>
          <input
            className="input"
            type="text"
            value={input.client_name}
            onChange={(e) => handleFieldChange("client_name", e.target.value)}
            placeholder="e.g. Acme Corp"
            required
          />
        </div>

        <div className="field">
          <label className="label">Project Type*</label>
          <select
            className="select"
            value={input.project_type}
            onChange={(e) => handleFieldChange("project_type", e.target.value)}
            required
          >
            <option value="">Select type...</option>
            {PROJECT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Main Goal / Problem to Solve*</label>
          <textarea
            className="textarea"
            value={input.client_goal}
            onChange={(e) => handleFieldChange("client_goal", e.target.value)}
            placeholder="What does the client want to achieve?"
            required
          />
        </div>
      </div>

      <div className="panel">
        <h2 className="section-title">Additional Context</h2>
        
        <div className="field">
          <label className="label">Known Requirements</label>
          <textarea
            className="textarea"
            value={input.known_requirements}
            onChange={(e) => handleFieldChange("known_requirements", e.target.value)}
            placeholder="List any specific features or tasks..."
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div className="field">
            <label className="label">Budget (if known)</label>
            <input
              className="input"
              type="text"
              value={input.budget}
              onChange={(e) => handleFieldChange("budget", e.target.value)}
              placeholder="e.g. $5,000"
            />
          </div>
          <div className="field">
            <label className="label">Timeline (if known)</label>
            <input
              className="input"
              type="text"
              value={input.timeline}
              onChange={(e) => handleFieldChange("timeline", e.target.value)}
              placeholder="e.g. 4 weeks"
            />
          </div>
        </div>

        <div className="field">
          <label className="label">Tone / Style Preference</label>
          <select
            className="select"
            value={input.tone}
            onChange={(e) => handleFieldChange("tone", e.target.value)}
          >
            <option value="">Select tone...</option>
            {TONE_OPTIONS.map((tone) => (
              <option key={tone} value={tone}>
                {tone}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Transcript / Raw Notes</label>
          <textarea
            className="textarea"
            value={input.notes}
            onChange={(e) => handleFieldChange("notes", e.target.value)}
            placeholder="Paste meeting transcript or rough notes here..."
            style={{ minHeight: "200px" }}
          />
        </div>

        <button
          className="button button--primary"
          onClick={onGenerate}
          disabled={!isReady || loading}
          style={{ width: "100%", marginTop: "var(--space-4)" }}
        >
          {loading ? "Structuring Brief..." : "Generate Brief & Scope"}
        </button>
      </div>
    </div>
  );
}
