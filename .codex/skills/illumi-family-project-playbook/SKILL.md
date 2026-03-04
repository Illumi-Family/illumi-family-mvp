---
name: illumi-family-project-playbook
description: Repository-wide playbook for illumi-family-mvp. Use for any task in this repo that touches architecture, implementation, debugging, deployment, migrations, operations, or technical recommendations. Provides canonical stack/environment facts, dev/deploy/ops workflows, and mandatory synchronization rules for docs and skill references after stack or architecture changes.
---

# Illumi Family Project Playbook

## Overview
- Use this skill as the default project operating baseline for `illumi-family-mvp`.
- Use this skill to avoid architecture drift, environment misuse, and outdated recommendations.
- Read facts from canonical files first, then give implementation or advisory output.

## Trigger Conditions
Use this skill whenever the task includes at least one of the following:
- Modify frontend or worker code in this repository.
- Discuss technical architecture, module boundaries, or data flow.
- Run or design database migrations.
- Deploy, rollback, or verify `dev/prod` environments.
- Propose operational or reliability improvements.
- Explain how to distinguish or use environments.
- Update stack versions, dependencies, or build scripts.

## Reference Loading Order
1. Read `references/current-state.md` for authoritative facts before making assumptions.
2. Read `references/workflows.md` when execution requires commands or operational steps.
3. Read `references/sync-rules.md` whenever architecture/stack/process may change.

Load only the sections needed for the current task.

## Default Execution Workflow
1. Scope the task and impacted layers.
- Identify whether the change affects frontend, worker API, data layer, deployment, or ops.

2. Map environment impact.
- Decide if the task touches `dev`, `prod`, or both.
- Enforce environment boundaries and resource isolation.

3. Validate assumptions from canonical files.
- Verify with repository files (`wrangler.json`, `package.json`, `src/worker`, `docs/technical-architecture.md`).
- Do not rely on memory for mutable project facts.

4. Execute minimal, reviewable changes.
- Preserve existing architecture style (`Router -> Controller -> Service -> Repository`).
- Keep diffs targeted and avoid unrelated refactors.

5. Verify with evidence.
- Run relevant checks (tests/build/lint/deploy dry-run/smoke checks).
- Report commands and outcomes explicitly.

6. Synchronize documentation and this skill.
- Update architecture docs and reference files when facts changed.
- Include concise change rationale and suggested follow-up actions.

## Architecture Guardrails
- Distinguish environments by Wrangler config (`top-level = prod`, `env.dev = dev`), not by Git branch.
- Keep `dev` and `prod` resources isolated (D1/KV/R2, vars, URLs).
- Apply schema migrations in order: `dev` first, `prod` second.
- Keep API behavior consistent with unified response/error conventions.
- Preserve Hono middleware ordering and centralized error handling patterns.

## Recommendation Format
When giving advice, always provide:
1. Current state (fact-based, from canonical files).
2. Options (at least 2 when trade-offs exist).
3. Recommended option with reason.
4. Risks and rollback points.
5. Required doc/skill sync updates.

## Operational Baseline
- Treat `pnpm run check` and `pnpm run check:dev` as deployment gates.
- Use smoke checks for `/api/health` after deployments.
- Record environment-specific commands explicitly to prevent accidental prod operations.

## Synchronization Policy
When stack, architecture, commands, routes, bindings, or runbooks change:
- Update `docs/technical-architecture.md` in the same change set.
- Update skill references under `references/` in the same change set.
- Keep guidance and implementation aligned; avoid stale playbook entries.

## Resources
- `references/current-state.md`: Authoritative snapshot of stack, architecture, environment mapping, and live endpoints.
- `references/workflows.md`: Copy-pastable development, migration, deployment, and operational runbooks.
- `references/sync-rules.md`: Rules and checklists for keeping docs/skill synchronized with architecture changes.
