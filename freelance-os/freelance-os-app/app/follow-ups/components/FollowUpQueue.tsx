import { formatDateForDisplay } from "../../../lib/format";
import { type FollowUpItem } from "../hooks/useFollowUpQueue";
import { StatusBadge } from "../../leads/components/StatusBadge";

type FollowUpQueueProps = {
  queue: FollowUpItem[];
  onSelectLead: (lead: FollowUpItem) => void;
};

export function FollowUpQueue({ queue, onSelectLead }: FollowUpQueueProps) {
  if (queue.length === 0) {
    return (
      <div className="empty-state">
        No follow-ups due. You're on top of things.
      </div>
    );
  }

  return (
    <div className="table-shell">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Lead Name</th>
            <th>Business</th>
            <th>Status</th>
            <th>Last Contacted</th>
            <th>Next Follow-Up</th>
            <th>Days Since Contact</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((item) => (
            <tr key={item.id} className="lead-table__row" onClick={() => onSelectLead(item)}>
              <td>
                <div className="lead-primary">
                  <span className="lead-primary__name">{item.name}</span>
                </div>
              </td>
              <td>{item.company || "—"}</td>
              <td>
                <StatusBadge status={item.status} />
              </td>
              <td>{formatDateForDisplay(item.lastContacted)}</td>
              <td>{formatDateForDisplay(item.nextFollowUp)}</td>
              <td>
                <span className={item.priority === "overdue" ? "overdue-text" : ""}>
                  {item.daysSinceContact} days
                </span>
              </td>
              <td>
                <button className="button button--ghost" onClick={(e) => { e.stopPropagation(); onSelectLead(item); }}>
                  Follow Up
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
