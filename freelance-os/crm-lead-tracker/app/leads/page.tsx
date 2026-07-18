"use client";

import { useMemo, useState } from "react";
import { LeadCard } from "./components/LeadCard";
import { LeadDrawer } from "./components/LeadDrawer";
import { FilterBar } from "./components/FilterBar";
import {
  LeadTable,
  type LeadSortDirection,
  type LeadSortKey,
} from "./components/LeadTable";
import { QuickCapture } from "./components/QuickCapture";
import { useLeads } from "./hooks/useLeads";
import {
  formatCurrency,
  type Lead,
  type LeadDraft,
  type LeadStatus,
} from "./lib/leadDefaults";
import { downloadLeadsCsv } from "./lib/exportLeads";

function matchesSearch(lead: Lead, searchTerm: string) {
  const haystack = `${lead.name} ${lead.company} ${lead.email}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

export default function LeadsPage() {
  const { leads, addLead, updateLead, deleteLead, stats, hasHydrated } = useLeads();
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<LeadStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<LeadSortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<LeadSortDirection>("desc");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filteredLeads = useMemo(() => {
    const nextLeads = leads.filter((lead) => {
      const matchesStatus = activeStatus === "all" || lead.status === activeStatus;
      const matchesTerm = !searchTerm.trim() || matchesSearch(lead, searchTerm.trim());
      return matchesStatus && matchesTerm;
    });

    return [...nextLeads].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortKey === "value") {
        return (a.value - b.value) * direction;
      }

      if (sortKey === "status") {
        return a.status.localeCompare(b.status) * direction;
      }

      const leftValue = a[sortKey];
      const rightValue = b[sortKey];

      if (leftValue === rightValue) {
        return 0;
      }

      if (leftValue === null || leftValue === "") {
        return 1;
      }

      if (rightValue === null || rightValue === "") {
        return -1;
      }

      const leftDate = new Date(leftValue).getTime();
      const rightDate = new Date(rightValue).getTime();
      const bothDates = !Number.isNaN(leftDate) && !Number.isNaN(rightDate);

      if (bothDates) {
        return (leftDate - rightDate) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue)) * direction;
    });
  }, [activeStatus, leads, searchTerm, sortDirection, sortKey]);

  const selectedLead = selectedLeadId
    ? leads.find((lead) => lead.id === selectedLeadId) ?? null
    : null;

  const handleQuickCapture = (draft: LeadDraft) => {
    return addLead(draft);
  };

  const handleSortChange = (key: LeadSortKey) => {
    if (key === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection(key === "createdAt" ? "desc" : "asc");
  };

  const handleDeleteLead = (lead: Lead) => {
    const shouldDelete = window.confirm(
      "Delete this lead? This cannot be undone.",
    );

    if (!shouldDelete) {
      return;
    }

    deleteLead(lead.id);
    if (selectedLeadId === lead.id) {
      setSelectedLeadId(null);
    }
  };

  const handleExportCsv = () => {
    downloadLeadsCsv(filteredLeads);
  };

  return (
    <main className="shell">
      <section className="hero-card">
        <div className="row row--between">
          <div>
            <div className="eyebrow">Pipeline Workspace</div>
            <h1 className="page-title">Lead Tracker</h1>
            <p className="page-subtitle">Your freelance pipeline</p>
          </div>
          <button
            className="button button--primary"
            type="button"
            onClick={() => setIsCaptureOpen((current) => !current)}
          >
            + Add Lead
          </button>
        </div>
      </section>

      <div className="section-stack">
        <section className="stats-grid" aria-label="Lead stats">
          <article className="stat-card">
            <p className="stat-card__label">Total Leads</p>
            <p className="stat-card__value">{stats.total}</p>
          </article>
          <article className="stat-card">
            <p className="stat-card__label">Active</p>
            <p className="stat-card__value">{stats.active}</p>
          </article>
          <article className="stat-card">
            <p className="stat-card__label">Proposals Out</p>
            <p className="stat-card__value">{stats.proposalsSent}</p>
          </article>
          <article className="stat-card">
            <p className="stat-card__label">Won</p>
            <p className="stat-card__value">{stats.won}</p>
          </article>
          <article className="stat-card">
            <p className="stat-card__label">Pipeline Value ($)</p>
            <p className="stat-card__value">{formatCurrency(stats.pipelineValue)}</p>
          </article>
        </section>

        <QuickCapture
          isOpen={isCaptureOpen}
          onCancel={() => setIsCaptureOpen(false)}
          onSave={handleQuickCapture}
        />

        <FilterBar
          leads={leads}
          activeStatus={activeStatus}
          searchTerm={searchTerm}
          onStatusChange={setActiveStatus}
          onSearchChange={setSearchTerm}
          onExport={handleExportCsv}
        />

        <section className="panel" aria-label="Lead list">
          <div className="row row--between" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ margin: 0 }}>Leads</h2>
              <p style={{ margin: "6px 0 0", color: "var(--muted)" }}>
                Showing your pipeline across desktop and mobile views.
              </p>
            </div>
            <p style={{ margin: 0, color: "var(--muted)" }}>
              Showing {filteredLeads.length} of {leads.length}
            </p>
          </div>

          {!hasHydrated ? (
            <div className="empty-state">Loading saved leads...</div>
          ) : filteredLeads.length === 0 ? (
            <div className="empty-state">
              No leads yet. Add your first lead above.
            </div>
          ) : (
            <div className="lead-results">
              <div className="desktop-only">
                <LeadTable
                  leads={filteredLeads}
                  sortKey={sortKey}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  onOpenLead={(lead) => setSelectedLeadId(lead.id)}
                  onDeleteLead={handleDeleteLead}
                />
              </div>
              <div className="mobile-only lead-card-stack">
                {filteredLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onOpenLead={(nextLead) => setSelectedLeadId(nextLead.id)}
                    onDeleteLead={handleDeleteLead}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {selectedLead ? (
        <LeadDrawer
          key={selectedLead.id}
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onSave={updateLead}
          onDelete={handleDeleteLead}
        />
      ) : null}
    </main>
  );
}
