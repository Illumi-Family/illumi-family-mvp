# Illumi Family MVP Sync Rules

## 1) When to Update Docs and Skill
Update docs + skill references in the same change set whenever you change:
- tech stack versions
- dependency/toolchain scripts
- worker bindings / environment mapping
- API route structure or response contracts
- schema/migration strategy
- deployment and ops commands

## 2) Mandatory Sync Targets
- `docs/core/technical-architecture.md`
- `.codex/skills/illumi-family-project-playbook/SKILL.md` (if workflow/guardrail changes)
- `.codex/skills/illumi-family-project-playbook/references/*.md` (facts/runbooks/checklists)

## 3) Update Checklist
1. Re-check canonical files (`wrangler.json`, `package.json`, `src/worker/**`).
2. Update architecture doc first.
3. Update skill references to reflect new source-of-truth facts.
4. Verify commands in runbooks are still executable.
5. Include update note in final delivery summary.

## 4) Recommendation Quality Bar
When the user asks "how should we do X", always:
- separate current facts from recommendations
- provide trade-offs, not a single blind choice
- include environment impact and rollback path
- mention required sync actions if recommendation is adopted

## 5) Anti-Drift Rule
If skill guidance conflicts with repository files:
- trust repository files as immediate truth
- patch this skill in the same task
- call out the correction explicitly
