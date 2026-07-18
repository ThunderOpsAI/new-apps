import { useMemo } from "react";
import { useLeads } from "../../leads/hooks/useLeads";
import { getPriority, type FollowUpPriority } from "../utils/followUpPriority";
import type { Lead, CommunicationEntry } from "../../leads/lib/leadDefaults";

export interface FollowUpItem extends Lead {
  daysSinceContact: number;
  priority: FollowUpPriority;
}

export function useFollowUpQueue() {
  const { leads, updateLead, hasHydrated } = useLeads();

  const queue = useMemo<FollowUpItem[]>(() => {
    return leads
      .filter((lead) => lead.status !== "won" && lead.status !== "lost" && (lead.nextFollowUp || lead.lastContacted))
      .map((lead) => {
        let daysSinceContact = 0;
        if (lead.lastContacted) {
          const last = new Date(lead.lastContacted);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - last.getTime());
          daysSinceContact = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        }

        let priority: FollowUpPriority = "upcoming";
        if (lead.nextFollowUp) {
          priority = getPriority(lead.nextFollowUp);
        } else if (lead.lastContacted) {
            // fallback if no next follow up date but last contacted is set
            priority = getPriority(lead.lastContacted);
        }

        return {
          ...lead,
          daysSinceContact,
          priority,
        };
      })
      .sort((a, b) => {
        const priorityScore = { overdue: 0, today: 1, upcoming: 2 };
        const scoreA = priorityScore[a.priority];
        const scoreB = priorityScore[b.priority];
        if (scoreA !== scoreB) return scoreA - scoreB;
        return b.daysSinceContact - a.daysSinceContact;
      });
  }, [leads]);

  const markAsSent = (leadId: string, messageText: string, method: CommunicationEntry["method"]) => {
    const lead = leads.find((l) => l.id === leadId);
    if (!lead) return;

    const today = new Date().toISOString();
    
    updateLead(leadId, {
      lastContacted: today,
      followUpCount: lead.followUpCount + 1,
      communicationHistory: [
        ...lead.communicationHistory,
        {
          date: today,
          type: "follow_up",
          messagePreview: messageText.substring(0, 120),
          method,
        },
      ],
    });
  };

  return {
    queue,
    updateLead,
    markAsSent,
    hasHydrated
  };
}
