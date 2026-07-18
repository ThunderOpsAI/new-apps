import { useState } from "react";
import { generateAI } from "../../../lib/ai";
import type { Lead } from "../../leads/lib/leadDefaults";

export type Tone = "professional" | "friendly" | "firm";
export type MessageType = "email_first" | "email_second" | "email_final" | "linkedin" | "sms";

type GeneratorOptions = {
  tone: Tone;
  messageType: MessageType;
  followUpNumber: number;
};

export function useFollowUpGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFollowUp = async (lead: Lead, daysSinceContact: number, options: GeneratorOptions) => {
    setIsGenerating(true);
    setError(null);
    try {
      const isEmail = options.messageType.startsWith("email");
      const prompt = `Generate a ${options.messageType} follow-up message for a freelance service provider.

Lead: ${lead.name}
Business: ${lead.company || "Unknown"}
Service offered: ${lead.service || "Freelance services"}
Previous contact summary: ${lead.previousOutreachSummary || "None"}
Current status: ${lead.status}
Days since last contact: ${daysSinceContact}
This is follow-up number: ${options.followUpNumber}
Tone: ${options.tone}

Keep it under 200 words for email, under 50 words for LinkedIn DM or SMS.
${isEmail ? "Do not include a subject line." : "Do not include a subject line unless this is an email message type."}
Return plain text only.`;

      const response = await generateAI({
        system: `You are a professional freelance sales assistant. Generate follow-up messages that are warm, concise, and non-pushy. Never sound desperate. Always personalise to the lead context provided. Return plain text only. No markdown formatting.`,
        prompt,
      });

      return response.result as string;
    } catch (err: any) {
      setError(err.message || "Couldn't generate message. Try again.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateFollowUp, isGenerating, error };
}
