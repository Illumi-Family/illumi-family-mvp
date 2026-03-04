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

## 2) Quality Gates
Run before commit:
```bash
pnpm test
pnpm run lint
pnpm run build
```

## 3) Migration Workflow (D1 + Drizzle)
1. Update schema in `src/worker/shared/db/schema/*`.
2. Generate migration:
```bash
pnpm db:generate
```
3. Apply to dev first:
```bash
pnpm db:migrate:dev
```
4. Validate on dev API.
5. Apply to prod:
```bash
pnpm db:migrate:prod
```

## 4) Deployment Workflow
### Deploy dev
```bash
pnpm run check:dev
pnpm exec wrangler deploy --config wrangler.json --env dev
```

### Deploy prod
```bash
pnpm run check
pnpm exec wrangler deploy --config wrangler.json
```

## 5) Post-Deploy Smoke Checks
- Health endpoint should match target environment:
```bash
curl -s https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health
curl -s https://illumi-family-mvp.lguangcong0712.workers.dev/api/health
```
- Confirm key API paths:
  - `GET /api/users`
  - `POST /api/users` (JSON content-type)

## 6) Operational Response Basics
1. Identify affected environment (`dev`/`prod`) first.
2. Reproduce with explicit target URL and command.
3. Check deployment bindings (`wrangler deploy --dry-run --config wrangler.json --env ...`).
4. If schema-related, confirm migration status in D1.
5. Roll forward with fix when possible; avoid risky manual hot edits.

## 7) Custom Domain Onboarding (When Needed)
1. Prepare domain in Cloudflare zone.
2. Configure `routes` / `env.dev.routes` with `custom_domain: true` in `wrangler.json`.
3. Deploy target environment explicitly.
4. Verify both static frontend and `/api/health` on new domain.
