# Illumi Family MVP Current State

Last verified: 2026-04-16

## 1) Canonical Fact Sources
- `wrangler.json`
- `package.json`
- `src/worker/**`
- `drizzle.config.ts`
- `drizzle/migrations/**`
- `template.config.json`
- `tools/create-illumi-family-app/**`
- `docs/core/technical-architecture.md`

## 2) Tech Stack Snapshot
- Frontend: React 19 + Vite 6 + TanStack Router + TanStack Query
- Video player: `@cloudflare/stream-react`
- i18n: i18next + react-i18next + dayjs
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
  - Admin URL: `https://admin.illumi-family.com`
  - workers.dev fallback URL: `https://illumi-family-mvp.lguangcong0712.workers.dev`
  - Custom domain routes in wrangler: `illumi-family.com`, `admin.illumi-family.com`
- dev
  - Worker: `illumi-family-mvp-dev`
  - D1: `illumi-family-db-dev`
  - KV: `ILLUMI_CACHE_DEV`
  - R2: `illumi-family-files-dev`
  - Primary URL: `https://dev.illumi-family.com`
  - Admin URL: `https://admin-dev.illumi-family.com`
  - workers.dev fallback URL: `https://illumi-family-mvp-dev.lguangcong0712.workers.dev`
  - Custom domain routes in wrangler: `dev.illumi-family.com`, `admin-dev.illumi-family.com`

## 6) Current API Endpoints
- `GET /api/`
- `GET /api/health`
- `/api/auth/*` (Better Auth endpoints, includes email/password + Google)
- `POST /api/auth/identities/rollback`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/content/home?locale=zh-CN|en-US|alias` (invalid locale falls back to `zh-CN`)
- `GET /api/content/assets/:assetId`
- `GET /api/admin/me` (whitelist + verified email required)
- `GET /api/admin/content/home?locale=...` (whitelist + verified email required; invalid locale => 400)
- `PUT /api/admin/content/home/:entryKey?locale=...` (whitelist + verified email required; invalid locale => 400)
- `POST /api/admin/content/home/:entryKey/publish?locale=...` (whitelist + verified email required; invalid locale => 400)
- `POST /api/admin/assets/upload` (whitelist + verified email required)
- `GET /api/admin/videos` (whitelist + verified email required)
- `POST /api/admin/videos/upload-url` (whitelist + verified email required)
- `PATCH /api/admin/videos/:videoId` (whitelist + verified email required)
- `POST /api/admin/videos/:videoId/publish` (whitelist + verified email required)
- `POST /api/admin/videos/:videoId/unpublish` (whitelist + verified email required)
- `POST /api/admin/videos/:videoId/sync-status` (whitelist + verified email required)
- `DELETE /api/admin/videos/:videoId` (whitelist + verified email required; cleanup draft/zombie records)
- `GET /api/content/videos` (public published+ready videos only)
- `POST /api/webhooks/stream` (HMAC signature via `Webhook-Signature`)

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
- CMS tables:
  - `cms_entries`
  - `cms_revisions`
  - `cms_assets`
  - `cms_entry_assets`
- Video tables:
  - `video_assets`
- CMS locale dimension:
  - `cms_entries.locale` exists (`zh-CN` default)
  - uniqueness is `UNIQUE(entry_key, locale)` (not `entry_key` only)

## 8) Known Execution Notes
- In sandbox, Wrangler may print `EPERM` log-path warnings for `~/Library/Preferences/.wrangler`; command exit code is the true success signal.
- For dry-run checks in multi-env config, always pass explicit `--env`.
- Asset routing strategy uses `assets.run_worker_first = ["/api/*"]`, so SPA routes (`/auth`, `/users`, etc.) are handled by the asset layer, while API paths are handled by Worker.
- Email/password auth path uses a custom `PBKDF2(SHA-256)` hasher (`src/worker/shared/auth/password-hasher.ts`) to stay within Worker CPU limits; re-benchmark sign-up/sign-in if hash parameters change.
- Admin access is enforced by hard-coded whitelist + verified-email check (`src/worker/shared/auth/admin-access.ts` + `requireAdminSession`).
- Public home content is served by `GET /api/content/home?locale=...` backed by D1 published revisions with KV cache key `cms:home:published:v1:{locale}`.
- Home content fallback rule: missing/invalid target-locale section falls back to `zh-CN` and returns `fallbackFrom`.
- Admin publish cache invalidation matrix:
  - publish `zh-CN` => invalidate all supported locale home caches (currently `zh-CN`, `en-US`)
  - publish `en-US` => invalidate `en-US` home cache only
- Public video list cache key: `videos:public:v1` (publish/unpublish + ready-state drift triggers invalidation)
- Stream webhook validation uses HMAC SHA-256 + header `Webhook-Signature` (`time` + `sig1`) with `STREAM_WEBHOOK_SECRET`.

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
