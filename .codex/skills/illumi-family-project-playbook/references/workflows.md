# Illumi Family MVP Workflows

## 1) Local Development
1. Install dependencies:
```bash
pnpm install
```
2. Start dev server:
```bash
pnpm dev
```
Default uses `dev` bindings. Use `pnpm run dev:prod` only when explicitly validating prod binding behavior locally.

## 2) Quality Gates
Minimum before commit:
```bash
pnpm test
```

Recommended full local gate before opening PR:
```bash
pnpm test
pnpm run lint
pnpm run build
```

Gate matrix (must follow):
- commit: `pnpm test`
- dev deploy: `pnpm test && pnpm run check && pnpm run db:migrate:dev && pnpm exec wrangler d1 migrations list DB --env dev --remote`
- prod deploy: `pnpm test && pnpm run check:prod && pnpm run db:migrate:prod && pnpm exec wrangler d1 migrations list DB --remote`
- deployment allow condition: migration list output must include `No migrations to apply`

## 2.1) Commit Message Rule
- `git commit` messages must be English-only (no Chinese).
- Recommended style: concise Conventional Commit prefixes such as `feat:`, `fix:`, `docs:`.

## 3) Template Scaffold Workflow
1. Preview template sync changes (default dry-run):
```bash
pnpm template:sync
```
2. Apply template snapshot update:
```bash
pnpm template:sync -- --apply --force
```
3. Validate template integrity:
```bash
pnpm template:doctor
```
4. Create a new project:
```bash
pnpm template:new -- --name my-app --dir ../my-app --no-install
```
5. Before first deploy in generated project, replace Cloudflare resource bindings in `wrangler.json`.

## 4) Migration Workflow (D1 + Drizzle)
1. Update schema in `src/worker/shared/db/schema/*`.
2. Generate migration:
```bash
pnpm db:generate
```
3. Apply to local first (avoid local runtime/schema mismatch):
```bash
pnpm db:migrate:local
```
4. Check migration status explicitly:
```bash
pnpm exec wrangler d1 migrations list DB --env dev --local
pnpm exec wrangler d1 migrations list DB --env dev --remote
```
5. Apply to dev remote:
```bash
pnpm db:migrate
```
6. Validate on dev API (include locale contract):
```bash
curl -s 'https://dev.illumi-family.com/api/content/home?locale=zh-CN'
curl -s 'https://dev.illumi-family.com/api/content/home?locale=en-US'
curl -s 'https://dev.illumi-family.com/api/content/videos'
```
7. Apply to prod:
```bash
pnpm db:migrate:prod
```
8. For CMS schema changes, verify seeded home sections on dev:
```bash
pnpm exec wrangler d1 execute DB --env dev --remote --command "SELECT entry_key,status,published_revision_id FROM cms_entries ORDER BY entry_key;"
```

## 5) Deployment Workflow
### Deploy dev
```bash
pnpm test
pnpm run check
pnpm run db:migrate:dev
pnpm exec wrangler d1 migrations list DB --env dev --remote | grep -q 'No migrations to apply'
pnpm run deploy
```
Current routing baseline: `assets.run_worker_first = ["/api/*"]` (SPA routes handled by assets, Worker handles API).

### Deploy prod
```bash
pnpm test
pnpm run check:prod
pnpm exec wrangler d1 migrations list DB --env dev --remote | grep -q 'No migrations to apply'
pnpm run db:migrate:prod
pnpm exec wrangler d1 migrations list DB --remote | grep -q 'No migrations to apply'
pnpm run deploy:prod
```
`deploy:prod` uses `wrangler deploy --config wrangler.json --env=""` to explicitly target top-level prod config.

## 5.1) Stream Video Reuse Workflow (Across local/dev/prod)
1. First upload can happen in any environment via `POST /api/admin/videos/upload-url`.
2. Reuse in another environment via `POST /api/admin/videos/import` with existing `streamVideoId` (no new Stream upload object).
3. For batch reconciliation, run `POST /api/admin/videos/sync-catalog` (manual full sync to current env D1):
   - new records default to `draft`,
   - existing records refresh metadata while preserving `publishStatus`,
   - missing remote videos downgrade only after 2 consecutive full-sync misses,
   - partial page failures skip missing-video downgrade for that run.
4. Keep upload capability enabled in all environments; enforce cost control through workflow guidance (prefer sync/import when asset already exists).

## 5.2) Admin Home Shared-Section Workflow
1. Editable shared keys are:
   - `home.main_video`
   - `home.character_videos`
   - `home.family_story_videos`
2. Save/publish for shared keys is mirrored to both locales (`zh-CN` + `en-US`) even when operator edits from a single locale tab.
3. Publish gate for shared keys enforces:
   - main video required,
   - character videos >= 1,
   - family story videos must not contain duplicate `streamVideoId`,
   - selected videos must still be `ready + published`.
4. Cache invalidation for shared-key publish always clears all supported home locales (`cms:home:published:v1:zh-CN` + `cms:home:published:v1:en-US`).
5. Admin frontend route baseline:
   - `/admin` redirects to `/admin/profile`
   - `/admin/profile`, `/admin/cms`, and `/admin/videos` are the backend navigation entries in admin header.

## 6) Post-Deploy Smoke Checks
- Health endpoint should match target environment:
```bash
curl -s https://dev.illumi-family.com/api/health | grep -q '"appEnv":"dev"'
curl -s https://illumi-family.com/api/health | grep -q '"appEnv":"prod"'
# fallback
curl -s https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health
curl -s https://illumi-family-mvp.lguangcong0712.workers.dev/api/health
```
- Confirm key API paths:
  - `GET /api/auth/ok`
  - `GET /api/users/me`
  - `PATCH /api/users/me` (JSON content-type, e.g. `{ "name": "New Name" }`)
  - `GET /api/content/home?locale=zh-CN`
  - `GET /api/content/home?locale=en-US`
  - `GET /api/content/home?locale=zh-CN` response should include `heroSlogan` and `featuredVideos`
  - `GET /api/content/videos`
  - `GET /api/admin/me` (unauthenticated should return `401`)
  - `GET /api/admin/content/home?locale=zh-CN` (unauthenticated should return `401`)
  - `POST /api/admin/assets/upload` (unauthenticated should return `401`)
  - `GET /api/admin/videos` (unauthenticated should return `401`)
  - `POST /api/admin/videos/import` (unauthenticated should return `401`)
  - `POST /api/admin/videos/sync-catalog` (unauthenticated should return `401`)
  - `HEAD /admin` on admin domains returns redirect to `/admin/profile`
  - `HEAD /admin/cms` on admin domains returns `200` HTML

## 6.1) Auth Secrets Setup (Before Auth Deploy)
Set secrets per environment with Wrangler (do not commit secrets):
```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET --env dev
pnpm exec wrangler secret put GOOGLE_CLIENT_ID --env dev
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --env dev
pnpm exec wrangler secret put RESEND_API_KEY --env dev
pnpm exec wrangler secret put STREAM_API_TOKEN --env dev
pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET --env dev
```

Prod:
```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET
pnpm exec wrangler secret put GOOGLE_CLIENT_ID
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
pnpm exec wrangler secret put RESEND_API_KEY
pnpm exec wrangler secret put STREAM_API_TOKEN
pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET
```

## 7) Operational Response Basics
1. Identify affected environment (`dev`/`prod`) first.
2. Reproduce with explicit target URL and command.
3. Check deployment bindings (`wrangler deploy --dry-run --config wrangler.json --env ...`).
4. If schema-related, confirm migration status in D1 (`--local` and `--remote`).
5. If error is `no such column`/`no such table`, prioritize migration apply on the affected environment.
6. Roll forward with fix when possible; avoid risky manual hot edits.

## 8) Custom Domain Onboarding (When Needed)
1. Prepare domain in Cloudflare zone.
2. Configure `routes` / `env.dev.routes` with `custom_domain: true` in `wrangler.json`.
3. Deploy target environment explicitly.
4. Verify both static frontend and `/api/health` on new domain.
