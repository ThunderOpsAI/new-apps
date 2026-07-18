export interface QuoteInput {
  project_type: string;
  deliverables: string;
  estimated_hours: number;
  hourly_rate: number;
  desired_margin: number;
  buffer_percentage: number;
  complexity: 'Low' | 'Medium' | 'High' | 'Enterprise';
  timeline: string;
  client_budget: number | null;
  revision_allowance: number;
}

export interface Package {
  name: 'Basic' | 'Standard' | 'Premium';
  price: number;
  deliverables: string[];
  timeline: string;
  revision_limit: number;
  payment_terms: string;
  best_fit: string;
  warning?: string | null;
}

export interface Upsell {
  name: string;
  price: number;
  description: string;
}

export interface QuoteRecord {
  id: string;
  created_at: string;
  updated_at: string;
  linked_lead_id?: string;
  linked_project_id?: string;
  linked_brief_id?: string;
  input: QuoteInput;
  packages: Package[];
  upsells: Upsell[];
  selected_package_name: 'Basic' | 'Standard' | 'Premium' | null;
  selected_upsells: string[];
  pricing_notes: string;
}
