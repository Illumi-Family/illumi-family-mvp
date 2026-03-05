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
4. Validate on dev API.
5. Apply to prod:
```bash
pnpm db:migrate:prod
```

## 5) Deployment Workflow
### Deploy dev
```bash
pnpm run check
pnpm run deploy
```

### Deploy prod
```bash
pnpm run check:prod
pnpm run deploy:prod
```
`deploy:prod` uses `wrangler deploy --config wrangler.json --env=""` to explicitly target top-level prod config.

## 6) Post-Deploy Smoke Checks
- Health endpoint should match target environment:
```bash
curl -s https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health
curl -s https://illumi-family-mvp.lguangcong0712.workers.dev/api/health
```
- Confirm key API paths:
  - `GET /api/users`
  - `POST /api/users` (JSON content-type)

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
