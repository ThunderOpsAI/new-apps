import { type Tone } from "../hooks/useFollowUpGenerator";

type ToneSelectorProps = {
  tone: Tone;
  onChange: (tone: Tone) => void;
};

export function ToneSelector({ tone, onChange }: ToneSelectorProps) {
  const tones: Array<{ label: string; value: Tone }> = [
    { label: "Professional", value: "professional" },
    { label: "Friendly", value: "friendly" },
    { label: "Firm", value: "firm" },
  ];

  return (
    <div className="field drawer-field--full">
      <label>Tone</label>
      <div className="tabs">
        {tones.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`tab ${tone === t.value ? "tab--active" : ""}`}
            onClick={() => onChange(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
