"use client";

import { useState } from "react";
import {
  createEmptyLeadDraft,
  sourceLabels,
  type Lead,
  type LeadDraft,
  type LeadSource,
} from "../lib/leadDefaults";

type QuickCaptureProps = {
  isOpen: boolean;
  onCancel: () => void;
  onSave: (lead: LeadDraft) => Lead;
};

export function QuickCapture({
  isOpen,
  onCancel,
  onSave,
}: QuickCaptureProps) {
  const [form, setForm] = useState(createEmptyLeadDraft);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const reset = () => {
    setForm(createEmptyLeadDraft());
    setError("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }

    onSave({
      name: form.name,
      email: form.email,
      company: form.company,
      service: form.service,
      source: form.source as LeadSource,
      value: form.value === "" ? 0 : Number(form.value),
    });

    reset();
    onCancel();
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <section className="panel" aria-label="Quick capture">
      <form className="capture-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="lead-name">Name *</label>
          <input
            id="lead-name"
            className="input"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            placeholder="Jane Smith"
          />
        </div>

        <div className="field">
          <label htmlFor="lead-email">Email</label>
          <input
            id="lead-email"
            className="input"
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            placeholder="jane@company.com"
          />
        </div>

        <div className="field">
          <label htmlFor="lead-company">Company</label>
          <input
            id="lead-company"
            className="input"
            value={form.company}
            onChange={(event) => updateField("company", event.target.value)}
            placeholder="Acme Studio"
          />
        </div>

        <div className="field">
          <label htmlFor="lead-service">Service</label>
          <input
            id="lead-service"
            className="input"
            value={form.service}
            onChange={(event) => updateField("service", event.target.value)}
            placeholder="Brand identity"
          />
        </div>

        <div className="field">
          <label htmlFor="lead-source">Source</label>
          <select
            id="lead-source"
            className="select"
            value={form.source}
            onChange={(event) => updateField("source", event.target.value)}
          >
            {Object.entries(sourceLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="lead-value">Value</label>
          <input
            id="lead-value"
            className="input"
            inputMode="numeric"
            value={form.value}
            onChange={(event) => updateField("value", event.target.value)}
            placeholder="2500"
          />
        </div>

        <div className="capture-actions">
          <button className="button button--primary" type="submit">
            + Add Lead
          </button>
        </div>

        <div className="capture-actions">
          <button
            className="button button--ghost"
            type="button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
      {error ? (
        <p style={{ color: "var(--danger-text)", margin: "12px 0 0" }}>{error}</p>
      ) : null}
    </section>
  );
}
