"use client";

import confetti from "canvas-confetti";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "./StatusBadge";
import {
  formatDateForInput,
  leadStatuses,
  normaliseDateInput,
  sourceLabels,
  statusLabels,
  type Lead,
  type LeadSource,
  type LeadStatus,
} from "../lib/leadDefaults";

type LeadDrawerProps = {
  lead: Lead;
  onClose: () => void;
  onSave: (id: string, changes: Partial<Lead>) => Lead | undefined;
  onDelete: (lead: Lead) => void;
};

type LeadFormState = {
  name: string;
  company: string;
  email: string;
  source: LeadSource;
  service: string;
  value: string;
  status: LeadStatus;
  lastContacted: string;
  nextFollowUp: string;
  notes: string;
};

function createFormState(lead: Lead): LeadFormState {
  return {
    name: lead.name,
    company: lead.company,
    email: lead.email,
    source: lead.source,
    service: lead.service,
    value: String(lead.value),
    status: lead.status,
    lastContacted: formatDateForInput(lead.lastContacted),
    nextFollowUp: formatDateForInput(lead.nextFollowUp),
    notes: lead.notes,
  };
}

export function LeadDrawer({
  lead,
  onClose,
  onSave,
  onDelete,
}: LeadDrawerProps) {
  const router = useRouter();
  const [form, setForm] = useState<LeadFormState>(createFormState(lead));
  const [copied, setCopied] = useState(false);

  const updateField = <K extends keyof LeadFormState>(
    field: K,
    value: LeadFormState[K],
  ) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const persistChanges = (changes: Partial<Lead>) => {
    const updatedLead = onSave(lead.id, changes);
    if (updatedLead) {
      setForm(createFormState(updatedLead));
    }
  };

  const handleSave = () => {
    persistChanges({
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      source: form.source,
      service: form.service.trim(),
      value:
        form.value.trim() === "" || Number.isNaN(Number(form.value))
          ? 0
          : Number(form.value),
      status: form.status,
      lastContacted: normaliseDateInput(form.lastContacted),
      nextFollowUp: normaliseDateInput(form.nextFollowUp),
      notes: form.notes.trim(),
    });
    onClose();
  };

  const handleCopyEmail = async () => {
    if (!lead.email) {
      return;
    }

    await navigator.clipboard.writeText(lead.email);
    setCopied(true);
  };

  const handleQuickStatusChange = (nextStatus: LeadStatus) => {
    updateField("status", nextStatus);
    persistChanges({ status: nextStatus });
  };

  const handleMarkAsWon = async () => {
    handleQuickStatusChange("won");
    await confetti({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 },
      ticks: 180,
    });
  };

  const handleMarkAsLost = () => {
    handleQuickStatusChange("lost");
  };

  const handleGenerateOutreach = () => {
    const params = new URLSearchParams({
      leadId: lead.id,
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      service: form.service.trim(),
    });

    router.push(`/outreach?${params.toString()}`);
  };

  return (
    <>
      <button className="drawer-overlay" type="button" aria-label="Close drawer" onClick={onClose} />
      <aside className="lead-drawer" aria-modal="true" role="dialog" aria-label={`Edit ${lead.name}`}>
        <div className="lead-drawer__header">
          <div className="lead-drawer__heading">
            <input
              className="drawer-title-input"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              aria-label="Lead name"
            />
            <div className="drawer-status-row">
              <StatusBadge status={form.status} />
              <select
                className="select drawer-status-select"
                value={form.status}
                onChange={(event) =>
                  handleQuickStatusChange(event.target.value as LeadStatus)
                }
                aria-label="Change status"
              >
                {leadStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="lead-drawer__body">
          <section className="drawer-section">
            <div className="drawer-section__heading">
              <h2>Details</h2>
            </div>
            <div className="drawer-form-grid">
              <div className="field">
                <label htmlFor="drawer-name">Contact Name</label>
                <input
                  id="drawer-name"
                  className="input"
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-company">Company</label>
                <input
                  id="drawer-company"
                  className="input"
                  value={form.company}
                  onChange={(event) => updateField("company", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-email">Email</label>
                <input
                  id="drawer-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-source">Source</label>
                <select
                    id="drawer-source"
                  className="select"
                  value={form.source}
                  onChange={(event) =>
                    updateField("source", event.target.value as LeadSource)
                  }
                >
                  {Object.entries(sourceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="drawer-service">Service</label>
                <input
                  id="drawer-service"
                  className="input"
                  value={form.service}
                  onChange={(event) => updateField("service", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-value">Est. Value</label>
                <input
                  id="drawer-value"
                  className="input"
                  inputMode="numeric"
                  value={form.value}
                  onChange={(event) => updateField("value", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-last-contacted">Last Contacted</label>
                <input
                  id="drawer-last-contacted"
                  className="input"
                  type="date"
                  value={form.lastContacted}
                  onChange={(event) =>
                    updateField("lastContacted", event.target.value)
                  }
                />
              </div>
              <div className="field">
                <label htmlFor="drawer-next-follow-up">Next Follow-Up</label>
                <input
                  id="drawer-next-follow-up"
                  className="input"
                  type="date"
                  value={form.nextFollowUp}
                  onChange={(event) =>
                    updateField("nextFollowUp", event.target.value)
                  }
                />
              </div>
              <div className="field drawer-field--full">
                <label htmlFor="drawer-notes">Notes</label>
                <textarea
                  id="drawer-notes"
                  className="textarea"
                  rows={4}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <div className="drawer-section__heading">
              <h2>Actions</h2>
            </div>
            <div className="drawer-actions">
              <button className="button button--primary" type="button" onClick={handleGenerateOutreach}>
                💌 Generate Outreach
              </button>
              <button
                className="button button--ghost"
                type="button"
                onClick={async () => {
                  await handleCopyEmail();
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                disabled={!lead.email}
              >
                {copied ? "Copied!" : "📋 Copy Email"}
              </button>
              <button className="button button--ghost" type="button" onClick={handleMarkAsWon}>
                ✅ Mark as Won
              </button>
              <button className="button button--ghost button--danger" type="button" onClick={handleMarkAsLost}>
                ❌ Mark as Lost
              </button>
              <button
                className="button button--ghost button--danger"
                type="button"
                onClick={() => onDelete(lead)}
              >
                🗑 Delete Lead
              </button>
            </div>
          </section>
        </div>

        <div className="lead-drawer__footer">
          <button className="button button--primary" type="button" onClick={handleSave}>
            Save Changes
          </button>
          <button className="button button--ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </aside>
    </>
  );
}
