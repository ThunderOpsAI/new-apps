"use client";

import { statusTabs, type Lead, type LeadStatus } from "../lib/leadDefaults";

type FilterBarProps = {
  leads: Lead[];
  activeStatus: LeadStatus | "all";
  searchTerm: string;
  onStatusChange: (value: LeadStatus | "all") => void;
  onSearchChange: (value: string) => void;
  onExport: () => void;
};

export function FilterBar({
  leads,
  activeStatus,
  searchTerm,
  onStatusChange,
  onSearchChange,
  onExport,
}: FilterBarProps) {
  const countFor = (status: LeadStatus | "all") => {
    if (status === "all") {
      return leads.length;
    }

    return leads.filter((lead) => lead.status === status).length;
  };

  return (
    <section className="panel filters" aria-label="Lead filters">
      <div className="filters__top">
        <div className="tabs" role="tablist" aria-label="Lead status tabs">
          {statusTabs.map((tab) => {
            const isActive = tab.value === activeStatus;

            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`tab${isActive ? " tab--active" : ""}`}
                onClick={() => onStatusChange(tab.value)}
              >
                <span>{tab.label}</span>
                <span className="tab__count">{countFor(tab.value)}</span>
              </button>
            );
          })}
        </div>

        <div className="filters__right">
          <div className="search-field">
            <label className="filter-label" htmlFor="lead-search">
              Search
            </label>
            <input
              id="lead-search"
              className="search-input"
              value={searchTerm}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by name, company, email..."
            />
          </div>
          <div className="field">
            <span className="filter-label">Export</span>
            <button className="button button--ghost" type="button" onClick={onExport}>
              Export CSV
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
