create extension if not exists pgcrypto;

create table if not exists name_checker_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text,
  business_idea text not null,
  industry text not null,
  tone text not null,
  country text,
  ai_output jsonb not null,
  domain_results jsonb not null,
  payment_status text not null default 'free',
  stripe_session_id text,
  unlock_token text not null
);

create index if not exists idx_name_checker_reports_created_at
  on name_checker_reports (created_at desc);
