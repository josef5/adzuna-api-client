## Adzuna API Client

A bare-bones client for the Adzuna job ads API

```bash
npm run dev
```

## Neon Auth

This app uses Neon Auth with GitHub OAuth in the browser.

Required environment variables:

- `VITE_NEON_AUTH_URL`
- `VITE_NEON_DATA_API_URL` (recommended; the app can derive it from the auth URL when Neon uses the standard hostname format)
- `VITE_API_URL`
- `VITE_APP_ID`
- `VITE_APP_KEY`

For local development, configure GitHub OAuth in Neon to allow your local Vite origin and callback URL.

## Neon Persistence

Saved/applied/archived job IDs are now intended to live in Neon via the Data API so the app can stay deployable on GitHub Pages.

- Apply the schema in [sql/001_create_user_job_states.sql](sql/001_create_user_job_states.sql) in your Neon project.
- Enable the Neon Data API and copy its URL into `VITE_NEON_DATA_API_URL`.
- The table uses `auth.user_id()` plus RLS so each signed-in user only sees their own saved jobs.
- This replaces the previous browser-only OPFS persistence model.
