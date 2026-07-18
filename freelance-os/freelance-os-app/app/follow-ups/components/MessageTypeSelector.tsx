import { type MessageType } from "../hooks/useFollowUpGenerator";

type MessageTypeSelectorProps = {
  messageType: MessageType;
  onChange: (type: MessageType) => void;
};

export function MessageTypeSelector({ messageType, onChange }: MessageTypeSelectorProps) {
  const types: Array<{ label: string; value: MessageType }> = [
    { label: "Email 1", value: "email_first" },
    { label: "Email 2", value: "email_second" },
    { label: "Final", value: "email_final" },
    { label: "LinkedIn", value: "linkedin" },
    { label: "SMS", value: "sms" },
  ];

  return (
    <div className="field drawer-field--full">
      <label>Message Type</label>
      <div className="tabs">
        {types.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${messageType === t.value ? "tab--active" : ""}`}
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
