# Illumi Family MVP Current State

Last verified: 2026-03-04

## 1) Canonical Fact Sources
- `wrangler.json`
- `package.json`
- `src/worker/**`
- `drizzle.config.ts`
- `drizzle/migrations/**`
- `docs/technical-architecture.md`

## 2) Tech Stack Snapshot
- Frontend: React 19 + Vite 6
- Backend runtime: Hono 4 on Cloudflare Workers
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
  - URL: `https://illumi-family-mvp.lguangcong0712.workers.dev`
- dev
  - Worker: `illumi-family-mvp-dev`
  - D1: `illumi-family-db-dev`
  - KV: `ILLUMI_CACHE_DEV`
  - R2: `illumi-family-files-dev`
  - URL: `https://illumi-family-mvp-dev.lguangcong0712.workers.dev`

## 6) Current API Endpoints
- `GET /api/`
- `GET /api/health`
- `GET /api/users`
- `POST /api/users`

## 7) Data Model (Current)
- Table: `users`
  - `id` (PK)
  - `email` (unique)
  - `name`
  - `created_at`
  - `updated_at`

## 8) Known Execution Notes
- In sandbox, Wrangler may print `EPERM` log-path warnings for `~/Library/Preferences/.wrangler`; command exit code is the true success signal.
- For dry-run checks in multi-env config, always pass explicit `--env`.
