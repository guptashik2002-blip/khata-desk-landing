-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Stores every readiness check. No names, emails, phone numbers or health data.

create table if not exists public.readiness_checks (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  visitor_id     text not null,          -- random id from the visitor's browser, used for the 5-request cap
  ip_hash        text,                   -- one-way hash of IP, only for the daily abuse backstop
  business_type  text not null,          -- Kirana / Salon / Clinic / Other
  stage          text not null,
  input          text not null,          -- the visitor's business description
  output         text not null,          -- Gemini's reply (or the guardrail sentence)
  refused        boolean not null default false,
  model          text,
  input_tokens   int,
  output_tokens  int
);

create index if not exists readiness_checks_created_at_idx on public.readiness_checks (created_at);
create index if not exists readiness_checks_visitor_idx    on public.readiness_checks (visitor_id);

-- Lock the table: only the server (service key) can read/write. The page never talks to Supabase directly.
alter table public.readiness_checks enable row level security;
