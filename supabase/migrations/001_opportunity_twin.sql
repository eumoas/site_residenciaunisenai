-- Opportunity Twin · migração compatível com a captação atual.
-- Não remove nem renomeia diagnostics/company_leads existentes.

create table if not exists public.diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'started' check (status in ('started','confirmed','qualified','contacted','completed','expired')),
  locale text not null default 'pt-BR',
  entry_channel text not null default 'hub_web',
  challenge text not null,
  interpretation jsonb,
  rubric_version text not null default '1.0.0',
  prompt_version text,
  model_provider text,
  model_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.opportunity_profiles (
  session_id uuid primary key references public.diagnostic_sessions(id) on delete cascade,
  category text not null default 'other',
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.diagnostic_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  question_id text not null,
  answer jsonb not null,
  answered_at timestamptz not null default now(),
  unique (session_id, question_id)
);

create table if not exists public.scorecards (
  session_id uuid primary key references public.diagnostic_sessions(id) on delete cascade,
  rubric_version text not null,
  dimensions jsonb not null,
  confidence smallint not null check (confidence between 0 and 100),
  route text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.lead_identities (
  session_id uuid primary key references public.diagnostic_sessions(id) on delete cascade,
  name text not null,
  email text not null,
  company text not null,
  role text not null,
  consent boolean not null,
  consent_text_version text not null default 'lead-contact-1.0',
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.diagnostic_sessions(id) on delete cascade,
  event_name text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists diagnostic_sessions_status_created_idx on public.diagnostic_sessions(status, created_at desc);
create index if not exists diagnostic_answers_session_idx on public.diagnostic_answers(session_id, answered_at);
create index if not exists diagnostic_events_session_idx on public.diagnostic_events(session_id, created_at);

alter table public.diagnostic_sessions enable row level security;
alter table public.opportunity_profiles enable row level security;
alter table public.diagnostic_answers enable row level security;
alter table public.scorecards enable row level security;
alter table public.lead_identities enable row level security;
alter table public.diagnostic_events enable row level security;

-- Escritas passam exclusivamente pelo Worker com service_role.
