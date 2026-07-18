import { BriefInput } from "../lib/types";

export function buildBriefPrompt(input: BriefInput) {
  return `Generate a structured project brief and scope of work for the following client engagement.

Client: ${input.client_name}
Project type: ${input.project_type}
Client goal: ${input.client_goal}
Known requirements: ${input.known_requirements || 'Not provided'}
Budget: ${input.budget || 'Not specified'}
Timeline: ${input.timeline || 'Not specified'}
Tone/style: ${input.tone || 'Professional'}
Notes / transcript:
${input.notes || 'None provided'}

Return ONLY a JSON object. No markdown. No preamble. Use this exact shape:
{
  "brief": {
    "project_summary": "string",
    "client_problem": "string",
    "desired_outcome": "string",
    "key_deliverables": ["string"],
    "assumptions": ["string"],
    "missing_information": ["string"],
    "questions_to_ask": ["string"],
    "risks": ["string"],
    "recommended_next_step": "string"
  },
  "scope": {
    "in_scope": ["string"],
    "out_of_scope": ["string"],
    "milestones": ["string"],
    "client_responsibilities": ["string"],
    "acceptance_criteria": ["string"],
    "revision_limits": "string"
  }
}`;
}
