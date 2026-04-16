# Docs Index And Tracking Policy

## Purpose
Define which `docs/` content is long-lived source-of-truth (must be versioned) and which content is temporary working material (ignored by default).

## Directory Classification
- `docs/core/`: stable business/architecture baseline (tracked)
- `docs/brainstorms/`: Stores early-stage, tentative, and exploratory creative and design documents, following a "think first, build later" principle to document all ideas prior to formal development.(ignored by default)
- `docs/runbooks/`: operational runbooks and execution checklists (tracked)
- `docs/plans/`: implementation plans and task breakdowns (ignored by default)
- `docs/research/`: exploratory analysis and options comparison (ignored by default)
- `docs/notes/`: brainstorming and ad-hoc notes (ignored by default)
- `docs/tmp/`: scratch space and temporary exports (ignored by default)

## Tracked (Versioned)
Canonical docs that should stay in Git history:

- `docs/README.md`
- `docs/core/**`
- `docs/runbooks/**`
  - `docs/runbooks/better-auth-secret-runbook.md`
  - `docs/runbooks/development-deployment-cicd-runbook.md`

## Not Tracked (Ignored By Default)
Temporary working spaces:
- `docs/brainstorms/**`
- `docs/plans/**`
- `docs/research/**`
- `docs/notes/**`
- `docs/tmp/**`

## Promotion Rules (When Temporary Docs Should Be Versioned)
Promote a temporary document into tracked space only when all conditions are met:

1. The content defines a stable contract/process that will be reused.
2. The content affects architecture, API contract, deployment, migration, environment bindings, or ops baseline.
3. The content has been validated against current repository implementation.

Promotion action:

1. Move/merge content into `docs/core/` or `docs/runbooks/`.
2. Keep temporary sources in ignored folders (or delete after merge if obsolete).
3. Keep `.gitignore` and this file synchronized whenever classification changes.

## Update Rules
1. If API contracts, environment bindings, migrations, deployment commands, or architecture changes, update tracked docs in the same change set.
2. Do not put one-off plans or investigation logs directly into tracked docs.
3. Keep this file and `.gitignore` consistent; no stale whitelist paths.
