import { useState } from "react";
import { ToneSelector } from "./ToneSelector";
import { MessageTypeSelector } from "./MessageTypeSelector";
import { GeneratedMessage } from "./GeneratedMessage";
import { ScheduleNextFollowUp } from "./ScheduleNextFollowUp";
import { useFollowUpGenerator, type Tone, type MessageType } from "../hooks/useFollowUpGenerator";
import { StatusBadge } from "../../leads/components/StatusBadge";
import type { FollowUpItem } from "../hooks/useFollowUpQueue";
import type { CommunicationEntry } from "../../leads/lib/leadDefaults";

type FollowUpDrawerProps = {
  lead: FollowUpItem;
  onClose: () => void;
  onMarkSent: (leadId: string, messageText: string, method: CommunicationEntry["method"]) => void;
  onScheduleNext: (leadId: string, nextDate: string) => void;
};

export function FollowUpDrawer({ lead, onClose, onMarkSent, onScheduleNext }: FollowUpDrawerProps) {
  const [tone, setTone] = useState<Tone>("professional");
  const [messageType, setMessageType] = useState<MessageType>("email_first");
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [showSchedule, setShowSchedule] = useState(false);
  
  const { generateFollowUp, isGenerating, error } = useFollowUpGenerator();

  const handleGenerate = async () => {
    let followUpNumber = lead.followUpCount + 1;
    if (messageType === "email_first") followUpNumber = 1;
    if (messageType === "email_second") followUpNumber = 2;
    if (messageType === "email_final") followUpNumber = 3;

    const result = await generateFollowUp(lead, lead.daysSinceContact, { tone, messageType, followUpNumber });
    if (result) {
      setGeneratedMessage(result);
    }
  };

  const handleMarkSent = (method: CommunicationEntry["method"]) => {
    onMarkSent(lead.id, generatedMessage, method);
    setShowSchedule(true);
  };

  const handleScheduleConfirm = (nextDate: string) => {
    onScheduleNext(lead.id, nextDate);
    onClose();
  };

  const getMethodFromType = (type: MessageType): CommunicationEntry["method"] => {
    if (type === "linkedin") return "linkedin";
    if (type === "sms") return "sms";
    return "email";
  };

  return (
    <>
      <button className="drawer-overlay" type="button" aria-label="Close drawer" onClick={onClose} />
      <aside className="lead-drawer" aria-modal="true" role="dialog" aria-label={`Follow up with ${lead.name}`}>
        <div className="lead-drawer__header">
          <div className="lead-drawer__heading">
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{lead.name} — {lead.company || "No Company"}</h2>
            <div className="drawer-status-row">
              <StatusBadge status={lead.status} />
              <span className="eyebrow" style={{ marginLeft: 8 }}>
                {lead.daysSinceContact} days since contact
              </span>
            </div>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="lead-drawer__body">
          {showSchedule ? (
            <ScheduleNextFollowUp
              lead={lead}
              onConfirm={handleScheduleConfirm}
              onCancel={onClose}
            />
          ) : (
            <>
              <section className="drawer-section">
                <MessageTypeSelector messageType={messageType} onChange={setMessageType} />
                <ToneSelector tone={tone} onChange={setTone} />
                
                <div className="drawer-actions" style={{ marginTop: 12 }}>
                  <button 
                    className="button button--primary" 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? "Generating..." : generatedMessage ? "Regenerate" : "Generate Follow-Up"}
                  </button>
                  {error && <p style={{ color: "var(--danger-text)", margin: 0, fontSize: "0.9rem" }}>{error}</p>}
                </div>
              </section>

              {generatedMessage && (
                <GeneratedMessage
                  message={generatedMessage}
                  onChange={setGeneratedMessage}
                  onCopy={() => {}}
                  onMarkSent={handleMarkSent}
                  defaultMethod={getMethodFromType(messageType)}
                />
              )}
            </>
          )}
        </div>
      </aside>
    </>
  );
}
