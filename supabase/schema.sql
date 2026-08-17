-- Execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  q1 smallint not null check (q1 between 0 and 3),
  q2 smallint not null check (q2 between 0 and 3),
  q3 smallint not null check (q3 between 0 and 3),
  q4 smallint not null check (q4 between 0 and 3),
  q5 smallint not null check (q5 between 0 and 3),
  score smallint not null check (score between 0 and 15),
  challenge text,
  result jsonb,
  source text not null default 'fallback'
);

create table if not exists public.company_leads (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  name text not null, role text not null, company text not null, email text not null,
  priority text not null, stage text not null, challenge text not null,
  consent boolean not null default false, status text not null default 'new'
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  email text not null unique, consent boolean not null default true
);

create table if not exists public.resident_interests (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  email text not null, consent boolean not null default true
);

create table if not exists public.startup_inquiries (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  name text, startup text, email text, website text, solution text, maturity text,
  challenge text, consent boolean not null default false, status text not null default 'new'
);

alter table public.diagnostics enable row level security;
alter table public.company_leads enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.resident_interests enable row level security;
alter table public.startup_inquiries enable row level security;
-- O servidor usa a service role; não exponha essa chave no navegador.
