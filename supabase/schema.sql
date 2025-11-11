-- Supabase schema derived from plans/intellex-implementation-plan.md
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  query text not null,
  status text check (status in ('queued','running','done','error')) default 'queued',
  depth text check (depth in ('quick','standard','deep')) default 'standard',
  task_graph jsonb,
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
