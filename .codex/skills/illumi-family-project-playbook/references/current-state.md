# Illumi Family MVP Current State

Last verified: 2026-03-05

## 1) Canonical Fact Sources
- `wrangler.json`
- `package.json`
- `src/worker/**`
- `drizzle.config.ts`
- `drizzle/migrations/**`
- `template.config.json`
- `tools/create-illumi-family-app/**`
- `docs/technical-architecture.md`

## 2) Tech Stack Snapshot
- Frontend: React 19 + Vite 6 + TanStack Router + TanStack Query
- Backend runtime: Hono 4 on Cloudflare Workers
- Auth: Better Auth + Resend (email verification) + Google OAuth
- Data: D1 + Drizzle ORM, KV, R2
- Validation: Zod + `@hono/zod-validator`
- Tests: Vitest
- Package manager: pnpm

## 3) Runtime Architecture
- Single Worker serves both SPA assets and `/api/*`.
- Worker layering pattern:
  - Router -> Controller -> Service -> Repository
  - Shared middleware for request-id and error handling
- API response shape:
  - Success: `{ success: true, data, requestId }`
  - Failure: `{ success: false, error, requestId }`

## 4) Environment Model (Important)
- `prod` uses top-level `wrangler.json` config.
- `dev` uses `wrangler.json -> env.dev` config.
- Environment distinction is **not** based on Git branch.

## 5) Resource Mapping
- prod
  - Worker: `illumi-family-mvp`
  - D1: `illumi-family-db`
  - KV: `ILLUMI_CACHE`
  - R2: `illumi-family-files`
  - Primary URL: `https://illumi-family.com`
  - workers.dev fallback URL: `https://illumi-family-mvp.lguangcong0712.workers.dev`
  - Custom domain route in wrangler: `illumi-family.com`
- dev
  - Worker: `illumi-family-mvp-dev`
  - D1: `illumi-family-db-dev`
  - KV: `ILLUMI_CACHE_DEV`
  - R2: `illumi-family-files-dev`
  - Primary URL: `https://dev.illumi-family.com`
  - workers.dev fallback URL: `https://illumi-family-mvp-dev.lguangcong0712.workers.dev`
  - Custom domain route in wrangler: `dev.illumi-family.com`

## 6) Current API Endpoints
- `GET /api/`
- `GET /api/health`
- `/api/auth/*` (Better Auth endpoints, includes email/password + Google)
- `POST /api/auth/identities/rollback`
- `GET /api/users`
- `POST /api/users`

## 7) Data Model (Current)
- Legacy table:
  - `users` (`id`, `email`, `name`, `created_at`, `updated_at`)
- Auth tables:
  - `auth_users`
  - `auth_sessions`
  - `auth_accounts`
  - `auth_verifications`
- App identity tables:
  - `app_users`
  - `user_identities`
  - `user_security_events`

## 8) Known Execution Notes
- In sandbox, Wrangler may print `EPERM` log-path warnings for `~/Library/Preferences/.wrangler`; command exit code is the true success signal.
- For dry-run checks in multi-env config, always pass explicit `--env`.
- Asset routing strategy uses `assets.run_worker_first = ["/api/*"]`, so SPA routes (`/auth`, `/users`, etc.) are handled by the asset layer, while API paths are handled by Worker.

## 9) Template Tooling (Local Scaffold)
- Commands:
  - `pnpm template:new -- --name <app> --dir <path> [--no-install]`
  - `pnpm template:sync` (default dry-run)
  - `pnpm template:sync -- --apply --force`
  - `pnpm template:doctor`
- Files:
  - `template.config.json` controls whitelist/blacklist + replacement config.
  - `tools/create-illumi-family-app/templates/base` stores the template snapshot.
  - `tools/create-illumi-family-app/templates/base/template.manifest.json` stores file hashes and generation time.
