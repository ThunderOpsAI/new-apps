"use client";

import { useState, useMemo } from "react";
import { useFollowUpQueue, type FollowUpItem } from "./hooks/useFollowUpQueue";
import { type FollowUpPriority } from "./utils/followUpPriority";
import { FollowUpQueue } from "./components/FollowUpQueue";
import { FollowUpFilters } from "./components/FollowUpFilters";
import { FollowUpDrawer } from "./components/FollowUpDrawer";

export default function FollowUpsPage() {
  const { queue, markAsSent, updateLead, hasHydrated } = useFollowUpQueue();
  const [activeFilter, setActiveFilter] = useState<FollowUpPriority | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.priority === activeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term || 
        item.name.toLowerCase().includes(term) || 
        (item.company && item.company.toLowerCase().includes(term));
      
      return matchesFilter && matchesSearch;
    });
  }, [queue, activeFilter, searchTerm]);

  const counts = useMemo(() => {
    return queue.reduce(
      (acc, item) => {
        acc.all++;
        acc[item.priority]++;
        return acc;
      },
      { all: 0, overdue: 0, today: 0, upcoming: 0 } as Record<FollowUpPriority | "all", number>
    );
  }, [queue]);

  const selectedLead = queue.find((l) => l.id === selectedLeadId) || null;

  return (
    <main className="shell">
      <section className="hero-card">
        <div className="row row--between">
          <div>
            <div className="eyebrow">Active Queue</div>
            <h1 className="page-title">Follow-Up System</h1>
            <p className="page-subtitle">Turn passive leads into an active queue. Who needs a message, when, and what to say.</p>
          </div>
        </div>
      </section>

      <div className="section-stack">
        <FollowUpFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <section className="panel">
          {!hasHydrated ? (
            <div className="empty-state">Loading queue...</div>
          ) : (
            <FollowUpQueue
              queue={filteredQueue}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
            />
          )}
        </section>
      </div>

      {selectedLead && (
        <FollowUpDrawer
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
          onMarkSent={markAsSent}
          onScheduleNext={(id, date) => updateLead(id, { nextFollowUp: date })}
        />
      )}
    </main>
  );
}
