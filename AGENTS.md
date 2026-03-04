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
  - 技术栈版本与依赖
  - `wrangler.json` 环境与资源绑定
  - API 路由与响应契约
  - 数据库 schema/migration 流程
  - 部署与运维命令
- 同步目标：
  - `docs/technical-architecture.md`
  - `.codex/skills/illumi-family-project-playbook/SKILL.md`
  - `.codex/skills/illumi-family-project-playbook/references/*.md`
