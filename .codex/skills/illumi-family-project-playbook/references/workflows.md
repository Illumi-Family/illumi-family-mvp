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
Run before commit:
```bash
pnpm test
pnpm run lint
pnpm run build
```

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
3. Apply to dev first:
```bash
pnpm db:migrate
```
4. If local dev hits missing-table errors, apply local dev migrations:
```bash
pnpm db:migrate:local
```
5. Validate on dev API.
6. Apply to prod:
```bash
pnpm db:migrate:prod
```
7. For CMS schema changes, verify seeded home sections on dev:
```bash
pnpm exec wrangler d1 execute DB --env dev --remote --command "SELECT entry_key,status,published_revision_id FROM cms_entries ORDER BY entry_key;"
```

## 5) Deployment Workflow
### Deploy dev
```bash
pnpm run check
pnpm run deploy
```
Current routing baseline: `assets.run_worker_first = ["/api/*"]` (SPA routes handled by assets, Worker handles API).

### Deploy prod
```bash
pnpm run check:prod
pnpm run deploy:prod
```
`deploy:prod` uses `wrangler deploy --config wrangler.json --env=""` to explicitly target top-level prod config.

## 6) Post-Deploy Smoke Checks
- Health endpoint should match target environment:
```bash
curl -s https://dev.illumi-family.com/api/health
curl -s https://illumi-family.com/api/health
# fallback
curl -s https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health
curl -s https://illumi-family-mvp.lguangcong0712.workers.dev/api/health
```
- Confirm key API paths:
  - `GET /api/auth/ok`
  - `GET /api/users/me`
  - `PATCH /api/users/me` (JSON content-type, e.g. `{ "name": "New Name" }`)
  - `GET /api/content/home`
  - `GET /api/admin/me` (unauthenticated should return `401`)
  - `POST /api/admin/assets/upload` (unauthenticated should return `401`)
  - `HEAD /admin` on admin domains returns `200` HTML

## 6.1) Auth Secrets Setup (Before Auth Deploy)
Set secrets per environment with Wrangler (do not commit secrets):
```bash
wrangler secret put BETTER_AUTH_SECRET --env dev
wrangler secret put GOOGLE_CLIENT_ID --env dev
wrangler secret put GOOGLE_CLIENT_SECRET --env dev
wrangler secret put RESEND_API_KEY --env dev
```

Prod:
```bash
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put RESEND_API_KEY
```

## 7) Operational Response Basics
1. Identify affected environment (`dev`/`prod`) first.
2. Reproduce with explicit target URL and command.
3. Check deployment bindings (`wrangler deploy --dry-run --config wrangler.json --env ...`).
4. If schema-related, confirm migration status in D1.
5. Roll forward with fix when possible; avoid risky manual hot edits.

## 8) Custom Domain Onboarding (When Needed)
1. Prepare domain in Cloudflare zone.
2. Configure `routes` / `env.dev.routes` with `custom_domain: true` in `wrangler.json`.
3. Deploy target environment explicitly.
4. Verify both static frontend and `/api/health` on new domain.
