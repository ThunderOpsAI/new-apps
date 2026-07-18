"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLeads } from "../leads/hooks/useLeads";
import { formatDateForDisplay, type LeadStatus } from "../leads/lib/leadDefaults";

type OutreachClientProps = {
  initialSearchParams: Record<string, string | string[] | undefined>;
};

export function OutreachClient({ initialSearchParams }: OutreachClientProps) {
  const leadId = typeof initialSearchParams.leadId === "string" ? initialSearchParams.leadId : "";
  const initialPrefill = useMemo(
    () => ({
      name: typeof initialSearchParams.name === "string" ? initialSearchParams.name : "",
      company: typeof initialSearchParams.company === "string" ? initialSearchParams.company : "",
      email: typeof initialSearchParams.email === "string" ? initialSearchParams.email : "",
      service: typeof initialSearchParams.service === "string" ? initialSearchParams.service : "",
    }),
    [initialSearchParams],
  );

  const [form, setForm] = useState(initialPrefill);
  const [success, setSuccess] = useState(false);
  const { getLead, updateLead } = useLeads();
  const linkedLead = leadId ? getLead(leadId) : undefined;

  const handleFieldChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGenerate = () => {
    if (!leadId || !linkedLead) {
      return;
    }

    updateLead(leadId, {
      outreachGenerated: true,
      status: "contacted" as LeadStatus,
      lastContacted: new Date().toISOString(),
    });
    setSuccess(true);
  };

  return (
    <main className="shell">
      <section className="hero-card">
        <div className="row row--between">
          <div>
            <div className="eyebrow">Outreach Engine</div>
            <h1 className="page-title">Prepare Outreach</h1>
            <p className="page-subtitle">
              Pre-filled from your lead details. Submitting will mark the lead as contacted and save the outreach state.
            </p>
          </div>
          <Link href="/leads" className="button button--ghost">
            Back to Leads
          </Link>
        </div>
      </section>

      <div className="section-stack">
        <section className="panel">
          <div className="row row--between" style={{ marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0 }}>Outreach details</h2>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Fields are populated from query parameters.
              </p>
            </div>
          </div>

          <div className="drawer-form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="field">
              <label htmlFor="outreach-name">Name</label>
              <input
                id="outreach-name"
                className="input"
                value={form.name}
                onChange={(event) => handleFieldChange("name", event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="outreach-company">Company</label>
              <input
                id="outreach-company"
                className="input"
                value={form.company}
                onChange={(event) => handleFieldChange("company", event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="outreach-email">Email</label>
              <input
                id="outreach-email"
                className="input"
                type="email"
                value={form.email}
                onChange={(event) => handleFieldChange("email", event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="outreach-service">Service</label>
              <input
                id="outreach-service"
                className="input"
                value={form.service}
                onChange={(event) => handleFieldChange("service", event.target.value)}
              />
            </div>
            <div className="field drawer-field--full">
              <label htmlFor="outreach-message">Message</label>
              <textarea
                id="outreach-message"
                className="textarea"
                rows={6}
                value={`Hello ${form.name},\n\nI wanted to follow up about your interest in ${form.service} for ${form.company}.\n\nBest regards,\nYour freelance team`}
                readOnly
              />
            </div>
          </div>

          {linkedLead ? (
            <div className="drawer-section" style={{ marginTop: 24 }}>
              <div className="drawer-section__heading">
                <h2>Lead linkage</h2>
              </div>
              <p style={{ margin: 0 }}>
                This outreach is connected to <strong>{linkedLead.name}</strong> and will update their status to <strong>Contacted</strong>.
              </p>
              <p style={{ margin: "10px 0 0", color: "var(--muted)" }}>
                Last contacted will be set to {formatDateForDisplay(new Date().toISOString())}.
              </p>
            </div>
          ) : (
            <div className="empty-state" style={{ marginTop: 24 }}>
              No linked lead was found for <code>leadId={leadId}</code>.
            </div>
          )}

          <div className="row" style={{ gap: 12, marginTop: 24 }}>
            <button
              className="button button--primary"
              type="button"
              onClick={handleGenerate}
              disabled={!linkedLead}
            >
              Generate Outreach
            </button>
            {success ? (
              <span style={{ color: "var(--success-text)", alignSelf: "center" }}>
                Outreach generated and lead updated.
              </span>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
