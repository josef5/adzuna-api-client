# Project Guidelines

## Code Style

- This is a Vite + React + TypeScript SPA with Zustand, Tailwind v4, Vitest, and Neon Auth.
- Match the style of the file you edit instead of reformatting globally: app files in `src/` usually use double quotes and semicolons (see `src/App.tsx`, `src/hooks/useFetchJobs.ts`), while config/scaffold files may use single quotes and no semicolons (see `eslint.config.js`, `src/main.tsx`).
- Keep Tailwind utilities inline in JSX. Base styling is minimal and lives in `src/index.css` and `src/App.css`.
- Reuse centralized constants and types from `src/constants.ts` and `src/types/index.ts` rather than hardcoding strings.

## Architecture

- `src/App.tsx` is the main orchestrator: it reads auth state, triggers fetching, updates the store, and renders the tabbed job UI.
- `src/hooks/useFetchJobs.ts` handles Adzuna fetches, derives `newId`, and deduplicates results before they enter the store.
- `src/store/useStore.ts` is the source of truth for job buckets (`new`, `saved`, `applied`, `archived`) and current tab state.
- Store behavior is project-specific: jobs are sorted with frontend-relevant roles first and then newest first; `setTab()` only switches derived `displayJobs`.
- Persistence is ID-only and intended to be user-scoped in Neon via the Data API so the app remains compatible with GitHub Pages. Store hydration/sync should be orchestrated from `src/App.tsx` and `src/lib/jobStateApi.ts`.

## Build and Test

- Install dependencies with: `pnpm install`
- Start dev server: `pnpm dev`
- Build production bundle: `pnpm build`
- Run lint: `pnpm lint`
- Run tests: `pnpm test`
- Watch tests: `pnpm test:watch`
- Coverage: `pnpm test:coverage`
- Preview build: `pnpm preview`

## Project Conventions

- Job identity is `job.newId`, not the API `id`; `newId` is derived from title/company/location in `src/hooks/useFetchJobs.ts`.
- Frontend relevance is keyword-based via `isFrontendJob()` in `src/lib/utils.ts`; preserve that heuristic unless the user asks to change ranking/filtering behavior.
- Tabs come from `TAB_OPTIONS`; use those labels/actions rather than duplicating UI text.
- DOM tests explicitly opt into jsdom per file; Vitest defaults to `node` in `vite.config.ts`.
- Shared test cleanup is in `src/tests/setup.ts`; keep mocks compatible with it.

## Integration Points

- Auth uses browser-side Neon Auth in `src/lib/auth.ts`; `src/App.tsx` uses `authClient.useSession()`, `signIn.social({ provider: "github" })`, and `signOut()`.
- External data comes directly from the Adzuna API in `src/hooks/useFetchJobs.ts` using `VITE_API_URL`, `VITE_APP_ID`, and `VITE_APP_KEY`.
- Deployment targets static hosting / GitHub Pages; keep the Vite base path in `vite.config.ts` in mind when changing routing or callback URLs.

## Security

- Treat all `VITE_*` values as client-exposed configuration, not secrets.
- GitHub OAuth callback/origin settings must match local and deployed app URLs.
- Treat all `VITE_*` values as client-exposed. Use Neon Data API + RLS for browser persistence; do not expose `DATABASE_URL` in this Vite app.
