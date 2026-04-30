# AGENTS.md

## 项目定位
`illumi-family-mvp` 项目级代理协作说明。

## Skills
### Available skills
- illumi-family-project-playbook: 项目技术栈/架构/开发/部署/运维统一手册。用于本仓库内任何涉及实现、调试、部署、迁移、运维、技术建议的任务。  
  文件路径：`/Users/luoguangcong/code/illumi-family/illumi-family-mvp/.codex/skills/illumi-family-project-playbook/SKILL.md`

## Trigger rules
- 当任务涉及本项目代码、架构、部署、迁移、运维或建议输出时，优先使用 `illumi-family-project-playbook`。
- 当任务涉及环境区分（dev/prod）时，必须先按该 skill 的环境规则执行，不得按 Git 分支推断运行环境。

## Maintenance rules
- 当以下内容发生变更时，必须同步更新 skill：
  - 技术架构、技术栈版本与依赖
  - `wrangler.json` 环境与资源绑定
  - API 路由与响应契约
  - 数据库 schema/migration 流程
  - 部署与运维命令
  - UI 组件规范与组件库使用策略（如 shadcn CLI 约束）
- 同步目标：
  - `docs/core/technical-architecture.md`
  - `.codex/skills/illumi-family-project-playbook/SKILL.md`
  - `.codex/skills/illumi-family-project-playbook/references/*.md`

## UI 组件规范
- 默认优先使用 shadcn CLI 生成组件：`pnpm dlx shadcn@latest add <component>`。
- 只有在组件库不存在或无法满足需求时，才允许自定义封装；需先明确原因。
- 新增自定义 UI 组件时，需保持与现有 `src/react-app/components/ui` 风格一致（`cn` 合并、命名和导出方式一致）。
- 修改 UI 前先搜索是否已有可复用组件，避免重复实现导致风格漂移。

## Git 提交规则
- 本仓库 `git commit` 的 message 仅允许英文（English-only），不要使用中文。
- 建议统一使用简洁英文前缀风格（如 `feat:`、`fix:`、`docs:`）以便检索与审阅。
