import { useState, useEffect } from "react";
import { getNextFollowUpDate } from "../utils/followUpCadence";
import { normaliseDateInput, formatDateForInput } from "../../../lib/format";
import type { Lead } from "../../leads/lib/leadDefaults";

type ScheduleNextFollowUpProps = {
  lead: Lead;
  onConfirm: (nextDate: string) => void;
  onCancel: () => void;
};

export function ScheduleNextFollowUp({ lead, onConfirm, onCancel }: ScheduleNextFollowUpProps) {
  const [nextDate, setNextDate] = useState("");

  useEffect(() => {
    const today = new Date().toISOString();
    const calculated = getNextFollowUpDate(today, lead.followUpCount);
    setNextDate(formatDateForInput(calculated));
  }, [lead.followUpCount]);

  const handleSave = () => {
    const isoDate = normaliseDateInput(nextDate);
    if (isoDate) {
      onConfirm(isoDate);
    }
  };

  return (
    <div className="drawer-section">
      <div className="drawer-section__heading">
        <h2>Schedule Next Follow-Up</h2>
      </div>
      <div className="drawer-form-grid">
        <div className="field drawer-field--full">
          <label htmlFor="next-follow-up-date">Next Follow-Up Date</label>
          <input
            id="next-follow-up-date"
            className="input"
            type="date"
            value={nextDate}
            onChange={(e) => setNextDate(e.target.value)}
          />
        </div>
      </div>
      <div className="drawer-actions">
        <button className="button button--primary" onClick={handleSave}>Confirm Date</button>
        <button className="button button--ghost" onClick={onCancel}>Skip / Leave as is</button>
      </div>
    </div>
  );
}
