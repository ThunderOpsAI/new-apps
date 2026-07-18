import { useState, useEffect } from "react";
import type { CommunicationEntry } from "../../leads/lib/leadDefaults";

type GeneratedMessageProps = {
  message: string;
  onChange: (msg: string) => void;
  onCopy: () => void;
  onMarkSent: (method: CommunicationEntry["method"]) => void;
  defaultMethod: CommunicationEntry["method"];
};

export function GeneratedMessage({ message, onChange, onCopy, onMarkSent, defaultMethod }: GeneratedMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="drawer-section">
      <div className="drawer-section__heading">
        <h2>Generated Message</h2>
      </div>
      <div className="drawer-form-grid">
        <div className="field drawer-field--full">
          <textarea
            className="textarea"
            rows={8}
            value={message}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      <div className="drawer-actions">
        <button className="button button--ghost" onClick={handleCopy}>
          {copied ? "Copied!" : "📋 Copy Message"}
        </button>
        <button className="button button--primary" onClick={() => onMarkSent(defaultMethod)}>
          ✅ Mark as Sent
        </button>
      </div>
    </div>
  );
}
