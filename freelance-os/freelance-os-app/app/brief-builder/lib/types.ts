export interface BriefInput {
  client_name: string;
  project_type: string;
  client_goal: string;
  known_requirements: string;
  budget: string;
  timeline: string;
  notes: string;
  tone: string;
  linked_lead_id?: string;
  linked_project_id?: string;
}

export interface BriefOutput {
  project_summary: string;
  client_problem: string;
  desired_outcome: string;
  key_deliverables: string[];
  assumptions: string[];
  missing_information: string[];
  questions_to_ask: string[];
  risks: string[];
  recommended_next_step: string;
}

export interface ScopeOutput {
  in_scope: string[];
  out_of_scope: string[];
  milestones: string[];
  client_responsibilities: string[];
  acceptance_criteria: string[];
  revision_limits: string;
}

export interface ProjectBrief {
  id: string;
  createdAt: string;
  updatedAt: string;
  linkedLeadId?: string;
  linkedProjectId?: string;
  input: BriefInput;
  brief: BriefOutput;
  scope: ScopeOutput;
}

export const PROJECT_TYPES = [
  "Website",
  "Mobile App",
  "Branding",
  "Copywriting",
  "SEO",
  "Social Media",
  "Marketing Campaign",
  "Automation",
  "Consulting",
  "Other",
] as const;

export const TONE_OPTIONS = [
  "Professional",
  "Conversational",
  "Technical",
  "Creative",
] as const;
