This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase setup

1. Copy `.env.example` to `.env.local` and fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (server routes) `SUPABASE_SERVICE_ROLE_KEY`.
2. Optional (dev only): set `ENABLE_DEV_AUTH_AUTOCONFIRM=true` (server) and `NEXT_PUBLIC_ENABLE_DEV_AUTH_AUTOCONFIRM=true` (client) to allow the API route `/api/auth/dev-provision` to auto-confirm/create Supabase auth users using the service role. Keep this **off in prod**.
2. A lightweight health endpoint is available at `/api/health` and will ping the `users` table.
3. Basic Supabase-backed user APIs live under `/api/users` (GET list, POST create/upsert by email).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Type Checking & Linting

- Run `npm run lint` for ESLint (Next.js rules).
- Run `npm run typecheck` to run `tsc --noEmit` and catch TypeScript issues before deploys.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
