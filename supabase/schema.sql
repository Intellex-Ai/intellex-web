-- Profiles hold optional BYOK credentials per user/account.
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  display_name text,
  openai_api_key text,
  anthropic_api_key text,
  gemini_api_key text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  title text not null,
  query text not null,
  status text check (status in ('queued','running','done','error')) default 'queued',
  depth text check (depth in ('quick','standard','deep')) default 'standard',
  task_graph jsonb,
  verifier_summary text,
  created_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  url text not null,
  domain text,
  title text,
  published_at timestamptz,
  content text,
  html text,
  status text,
  attempt_count int default 0,
  fetch_strategy text,
  error_code text,
  last_error text,
  proxy_used boolean default false,
  source_type text default 'scraped',
  relevance_score numeric,
  created_at timestamptz default now()
);

create table if not exists facts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_id uuid references sources(id),
  fact_type text,
  content text not null,
  snippet text,
  confidence numeric,
  verified boolean default false,
  verification_notes text,
  verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  markdown text not null,
  json_outline jsonb,
  created_at timestamptz default now()
);

create extension if not exists vector;

create table if not exists source_chunks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  idx int not null,
  text text not null,
  embedding vector(768)
);

create table if not exists model_sources (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  model_name text not null,
  primary_url text not null,
  rss_url text,
  keywords text[] default array[]::text[],
  fallback_queries text[] default array[]::text[],
  mirrors text[] default array[]::text[],
  mirrored_assets text[] default array[]::text[],
  press_pdfs text[] default array[]::text[],
  docs_url text,
  api_ref text,
  freshness_interval_hours int default 168,
  needs_proxy boolean default false,
  priority int default 0,
  last_verified_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists model_releases (
  id uuid primary key default gen_random_uuid(),
  model_source_id uuid references model_sources(id) on delete cascade,
  version text,
  release_date timestamptz,
  payload jsonb,
  summary text,
  created_at timestamptz default now()
);

create table if not exists scrape_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  url text not null,
  attempt int not null,
  strategy text not null,
  status text,
  error text,
  created_at timestamptz default now()
);
