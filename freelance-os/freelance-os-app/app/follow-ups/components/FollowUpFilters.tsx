import { type FollowUpPriority } from "../utils/followUpPriority";

type FollowUpFiltersProps = {
  activeFilter: FollowUpPriority | "all";
  onFilterChange: (filter: FollowUpPriority | "all") => void;
  counts: Record<FollowUpPriority | "all", number>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
};

export function FollowUpFilters({ activeFilter, onFilterChange, counts, searchTerm, onSearchChange }: FollowUpFiltersProps) {
  const tabs: Array<{ label: string; value: FollowUpPriority | "all" }> = [
    { label: "All", value: "all" },
    { label: "Overdue", value: "overdue" },
    { label: "Due Today", value: "today" },
    { label: "Upcoming", value: "upcoming" },
  ];

  return (
    <div className="filters__top">
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tab ${activeFilter === tab.value ? "tab--active" : ""}`}
            onClick={() => onFilterChange(tab.value)}
          >
            {tab.label}
            <span className="tab__count">{counts[tab.value]}</span>
          </button>
        ))}
      </div>
      <div className="filters__right">
        <div className="search-field">
          <input
            type="search"
            className="search-input"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
