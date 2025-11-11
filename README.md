# Intellex — Web App

Next.js App Router project that coordinates planner, browser, extractor, synthesizer, and verifier agents to produce cited research briefs. This repo deploys to Vercel and talks to Supabase (DB/Auth) plus an AWS Lambda scraper.

## Stack

- Next.js 14 (App Router) + React 18
- Supabase (auth, Postgres, Realtime, pgvector)
- TailwindCSS + shadcn/ui primitives
- BYOK-friendly LLM/search provider registry

## Getting Started

```bash
pnpm install
pnpm dev
```

Create a `.env.local` from `.env.example` and paste real keys:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `LLM_PROVIDER` + optional `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
- `SEARCH_PROVIDER` + optional `SEARCH_API_KEY`
- `SCRAPER_INVOKE_URL` + `SCRAPER_TOKEN`

## Repo layout

```
app/                # App Router routes
components/         # UI primitives + feature blocks
lib/                # Supabase, LLM, scraper, parser helpers
scripts/            # Future automation (seed, migrations)
types/              # Supabase typed definitions
```

## Development targets

1. Scaffold projects CRUD via Supabase client helpers.
2. Implement `/api/projects` route handler for Planner queueing.
3. Wire Browser → Lambda fetch → Sources table writes.
4. Add Extractor/Synthesizer flows and realtime project page.

See `../plans/intellex-implementation-plan.md` for the full roadmap.
