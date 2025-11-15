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
- Hosted LLM creds: configure at least one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `TOGETHER_API_KEY`, or `OPENROUTER_API_KEY` (optionally set `OPENROUTER_SITE_URL` for routing metadata)
- `SEARCH_PROVIDER` (`free` uses DuckDuckGo HTML; `mock` returns seeded links for offline dev) + optional `SEARCH_API_KEY`
- `SCRAPER_INVOKE_URL` + `SCRAPER_TOKEN`
- `HEADLESS_SNS_TOPIC_ARN` + `AWS_REGION` if you want failed scrapes to fan out to a Playwright worker

## Repo layout

```
app/                # App Router routes
components/         # UI primitives + feature blocks
lib/                # Supabase, LLM, scraper, parser helpers
  search/           # DuckDuckGo-backed free SERP helper
  workflows/        # Planner → Browser → Extractor → Synth orchestrators
scripts/            # Future automation (seed, migrations)
types/              # Supabase typed definitions
```

## Planner → Browser pipeline (MVP)

- `POST /api/projects` stores the request, returns `202 Accepted`, then schedules `lib/pipeline-overrides/pipeline.ts` via a background `setImmediate` so the HTTP handler can respond immediately.
- Steps:
  1. Planner LLM → `task_graph` JSON saved on the project row.
  2. Browser → DuckDuckGo HTML SERP → call AWS Lambda scraper per result.
  3. Extractor → Readability text → heuristic fact extraction saved to Supabase.
  4. Synthesizer → lightweight markdown builder (`reports` table).
- `/p/[id]` streams Supabase Realtime updates (projects/sources/facts/reports) so the UI reflects each stage without polling.
- If your network blocks DuckDuckGo scraping, set `SEARCH_PROVIDER=mock` locally to seed deterministic URLs while the Lambda fetcher and downstream logic continue to run.

## Development targets

1. Scaffold projects CRUD via Supabase client helpers.
2. Implement `/api/projects` route handler for Planner queueing.
3. Wire Browser → Lambda fetch → Sources table writes with retries + proxy tiering.
4. Add Extractor/Synthesizer flows, BYOK ingest, and realtime project/admin pages.

## Admin dashboards

- `/admin/sources` surfaces failing domains + raw scrape logs so you can decide when to pay for proxies or mirrors.
- `/admin/model-sources` provides a lightweight CMS to edit the curated AI model registry (keywords, RSS feeds, mirrored assets, etc.).

See `../plans/intellex-implementation-plan.md` for the full roadmap.
- **Goal coverage verifier:** Intellex rotates across the hosted mesh (GPT-4o mini, Claude 3 Haiku, Gemini Flash, Groq Llama 3.1, Together, OpenRouter) to score each brief. Responses are cached for a few minutes and, if every provider errors, we degrade to a heuristic token-overlap summary.
