"use client";

import { useState } from "react";
import { generateAI } from "@/lib/ai";
import { buildBriefPrompt } from "../utils/briefPromptBuilder";
import { BriefInput, BriefOutput, ScopeOutput } from "../lib/types";

interface GenerationResult {
  brief: BriefOutput;
  scope: ScopeOutput;
}

export function useBriefGenerator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (input: BriefInput): Promise<GenerationResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const system = `You are an experienced freelance project manager helping structure client briefs.
Turn rough notes into a clear project brief and scope. Flag vague requirements.
Highlight missing info. Never invent details not provided. Write in plain, practical language.
Do not use legal language. Return only valid JSON — no markdown, no preamble.`;
      
      const prompt = buildBriefPrompt(input);
      
      const { result } = await generateAI({ system, prompt, maxTokens: 1500 });
      
      // Clean up potential markdown fences if AI included them despite instructions
      const cleanJson = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleanJson) as GenerationResult;
      
      return parsed;
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError("Failed to generate brief. Please try again.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { generate, loading, error };
}
