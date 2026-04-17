# Illumi Family MVP 开发与部署运行规范（Local / Dev / Prod / CI/CD）

## 0. 文档信息
- 文档名称：开发与部署运行规范（Runbook）
- 适用仓库：`illumi-family-mvp`
- 最近更新：2026-04-17
- 适用对象：
  - 人类开发者（手动开发、手动发布、排障）
  - AI 代理（阅读后可按规范执行变更与发布）

## 1. 目标与原则
1. 环境隔离优先：`local`、`dev`、`prod` 的数据与配置必须隔离。
2. 先验证后发布：所有发布以可执行检查命令和结果为准，不以主观判断为准。
3. 先 dev 后 prod：任何数据库迁移和接口契约变化必须先在 `dev` 验证。
4. 文档与代码同源：当 API/迁移/命令/绑定变化，必须同步更新文档。
5. 回滚优先“前滚修复”：避免高风险回滚数据库结构，优先通过代码前滚止血。
6. 每次发布都做 schema parity gate：先迁移、再确认无 pending migration、最后部署。

## 2. 环境与资源映射（事实基线）

### 2.1 环境区分规则
- `prod`：`wrangler.json` 顶层配置。
- `dev`：`wrangler.json -> env.dev` 配置。
- 不能依据 Git 分支判断环境，必须依据 Wrangler 参数判断。

### 2.2 资源映射
| 维度 | prod | dev |
| --- | --- | --- |
| Worker | `illumi-family-mvp` | `illumi-family-mvp-dev` |
| D1 | `illumi-family-db` | `illumi-family-db-dev` |
| KV | `ILLUMI_CACHE` | `ILLUMI_CACHE_DEV` |
| R2 | `illumi-family-files` | `illumi-family-files-dev` |
| 主域名 | `https://illumi-family.com` | `https://dev.illumi-family.com` |
| 管理域名 | `https://admin.illumi-family.com` | `https://admin-dev.illumi-family.com` |
| workers.dev | `https://illumi-family-mvp.lguangcong0712.workers.dev` | `https://illumi-family-mvp-dev.lguangcong0712.workers.dev` |

## 3. CI/CD 模式定义

### 3.1 当前实际模式（Manual CI/CD）
当前仓库没有托管 CI 工作流（无 `.github/workflows`），所以现行流程是“命令门禁 + 人工触发部署”：

- CI（提交前/部署前质量门禁）
```bash
pnpm test
pnpm run check         # dev dry-run gate
pnpm run check:prod    # prod dry-run gate
```

- Schema parity gate（每次部署前，按目标环境执行）
```bash
# dev
pnpm run db:migrate:dev
pnpm exec wrangler d1 migrations list DB --env dev --remote

# prod
pnpm run db:migrate:prod
pnpm exec wrangler d1 migrations list DB --remote
```

- CD（人工部署）
```bash
pnpm run deploy:dev
pnpm run deploy:prod
```

### 3.1.1 强制门禁矩阵（当前生效）
| 阶段 | 必跑命令 | 备注 |
| --- | --- | --- |
| Commit 前（本地） | `pnpm test` | 最低门禁 |
| Merge 前（准备合并） | `pnpm test` + `pnpm run check` | 默认以 dev 目标验证 |
| Dev 部署前 | `pnpm test` + `pnpm run check` + `pnpm run db:migrate:dev` + `pnpm exec wrangler d1 migrations list DB --env dev --remote` | 输出必须含 `No migrations to apply` |
| Prod 部署前 | `pnpm test` + `pnpm run check:prod` + `pnpm run db:migrate:prod` + `pnpm exec wrangler d1 migrations list DB --remote` | 发布前需确认 dev 已完成同批 migration + smoke |
| Schema 变更开发阶段 | `pnpm run db:migrate:local` + `pnpm run db:migrate:dev` + dev smoke | 再考虑 prod |

### 3.2 建议的自动化 CI/CD（后续可落地）
建议将 3.1 固化为流水线阶段：
1. `PR CI`：`pnpm install` -> `pnpm test` -> `pnpm run check`
2. `Merge to dev`：`db:migrate:dev` -> `deploy:dev` -> smoke check
3. `Release to prod`：人工审批后执行 `check:prod` + `db:migrate:prod` + `deploy:prod` + smoke check

> 说明：这是建议蓝图，不代表仓库当前已启用自动化平台。

## 4. 本地开发规范（Local）

### 4.1 首次准备
```bash
pnpm install
cp .dev.vars.example .dev.vars.dev
```

编辑 `.dev.vars.dev` 至少包含：
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_BASE_URL=http://localhost:5173`

### 4.2 本地启动
```bash
pnpm dev
```

### 4.3 本地数据库迁移（常见缺表/缺列修复）
```bash
pnpm run db:migrate:local
```

### 4.4 本地最小冒烟
```bash
curl -s 'http://localhost:5173/api/health'
curl -s 'http://localhost:5173/api/content/home?locale=zh-CN'
curl -s 'http://localhost:5173/api/content/videos'
```

## 5. 变更类型与执行流程

### 5.1 仅前端变更（无 API/DB 变更）
1. 修改前端代码。
2. 运行：`pnpm test`。
3. 运行：`pnpm run check`。
4. 执行 schema parity gate：`pnpm run db:migrate:dev`，并确认 `pnpm exec wrangler d1 migrations list DB --env dev --remote` 输出 `No migrations to apply`。
5. 部署：`pnpm run deploy:dev`。
6. 验证后按流程部署 prod。

### 5.2 API 契约变更（无 DB 变更）
1. 更新 controller/service/schema 与前端 API 类型。
2. 更新测试（worker + frontend client）。
3. 更新文档（契约与运行手册）。
4. 执行 `check` / `check:prod`。
5. 对目标环境执行 schema parity gate（`db:migrate:*` + `migrations list` 无 pending）。
6. 先 dev 后 prod。

### 5.3 数据库 Schema 变更（高风险）
必须执行“Local -> Dev -> Prod”三级推进：
1. 更新 `src/worker/shared/db/schema/*`。
2. 生成 migration：`pnpm db:generate`。
3. 本地迁移：`pnpm run db:migrate:local`。
4. 本地回归（接口 + 测试）。
5. Dev 远程迁移：`pnpm run db:migrate:dev`。
6. Dev 冒烟（必须覆盖受影响 API）。
7. Prod 迁移：`pnpm run db:migrate:prod`。

### 5.4 视频能力层变更（Stream 集成）
1. 后端改动需同步覆盖 `admin/videos`、`content/videos`、`webhooks/stream` 三类入口。
2. 复用导入与新上传必须语义分离：
   - 新上传：`POST /api/admin/videos/upload-url`（会创建新的 Stream 计费对象）；
   - 导入复用：`POST /api/admin/videos/import`（只在当前环境写入 D1，不新增 Stream 视频对象）。
3. 推荐协作流程：任一环境可首传，其他环境优先使用导入复用；不做环境级上传禁用。
4. 前端改动需同步校验 `/admin/videos` 与 `/videos` 两条页面路径。
5. 变更后至少执行：
   - `pnpm test`
   - `pnpm run build`
6. 需要新增/修改 Stream 配置时，按 8.2 的 secret 流程处理，不得写入仓库。

### 5.5 首页关键区块配置变更（Slogan + Featured Videos）
1. 共享配置 entry key：
   - `home.hero_slogan`
   - `home.main_video`
   - `home.character_videos`
2. 共享配置在 save/publish 时会镜像写入 `zh-CN` + `en-US`，不得假设只影响当前 locale。
3. 发布门禁必须覆盖：
   - slogan 主句/副句非空；
   - 核心视频已选择；
   - 角色视频列表至少 1 条；
   - 所选视频均为 `ready + published`。
4. 发布验证失败时，优先检查 `/admin/videos` 的 processing/publish 状态漂移，不要在前端绕过门禁。
5. 变更后至少执行：
   - `pnpm test`
   - `pnpm run build`
   - dev smoke：`/api/content/home?locale=zh-CN|en-US` 响应包含 `heroSlogan`、`featuredVideos`

## 6. 数据库迁移治理细则

### 6.1 必做检查
- 迁移文件是否进入版本库（`drizzle/migrations/*.sql` 与 `meta/_journal.json`）。
- 迁移 SQL 是否具备幂等性与顺序安全。
- 是否有历史数据回填语句。
- 是否明确 dev/prod 的执行顺序。

### 6.2 迁移执行顺序（强约束）
1. `local`
2. `dev --remote`
3. `prod --remote`

### 6.3 迁移状态检查命令
```bash
pnpm exec wrangler d1 migrations list DB --env dev --local
pnpm exec wrangler d1 migrations list DB --env dev --remote
pnpm exec wrangler d1 migrations list DB --remote
```

### 6.4 常见错误与处理
- 错误：`no such column: xxx`
  - 原因：代码已升级但当前环境未迁移。
  - 处理：对对应环境执行 migration（local/dev/prod）。

### 6.5 发布前 Schema Parity Gate（每次部署强制）
- 无论本次是否修改 schema，目标环境部署前都必须执行 `pnpm run db:migrate:<env>`。
- `db:migrate:*` 为幂等步骤：无 pending migration 时会 no-op。
- 迁移执行后必须再跑对应 `wrangler d1 migrations list`，输出必须包含 `No migrations to apply`；否则禁止部署。
- Prod 发布额外约束：同批 migration 必须已在 dev 成功应用并通过 smoke。

## 7. 部署流程（Dev / Prod）

### 7.1 Dev 发布（标准）
```bash
pnpm test
pnpm run check
pnpm run db:migrate:dev
pnpm exec wrangler d1 migrations list DB --env dev --remote | grep -q 'No migrations to apply'
pnpm run deploy:dev
curl -s https://dev.illumi-family.com/api/health | grep -q '\"appEnv\":\"dev\"'
curl -s https://dev.illumi-family.com/api/health | grep -q '\"apiVersion\":\"v1\"'
curl -s 'https://dev.illumi-family.com/api/content/home?locale=zh-CN' | grep -q '"heroSlogan"'
curl -s 'https://dev.illumi-family.com/api/content/home?locale=en-US' | grep -q '"featuredVideos"'
curl -s -i 'https://dev.illumi-family.com/api/content/videos'
curl -s -i 'https://dev.illumi-family.com/api/admin/content/home?locale=zh-CN' # 未登录应为 401
curl -s -i 'https://dev.illumi-family.com/api/admin/videos'  # 未登录应为 401
curl -s -i -X POST 'https://dev.illumi-family.com/api/admin/videos/import' -H 'content-type: application/json' -d '{"streamVideoId":"stream-test"}' # 未登录应为 401
```

### 7.2 Prod 发布（标准）
```bash
pnpm test
pnpm run check:prod
pnpm exec wrangler d1 migrations list DB --env dev --remote | grep -q 'No migrations to apply'
pnpm run db:migrate:prod
pnpm exec wrangler d1 migrations list DB --remote | grep -q 'No migrations to apply'
pnpm run deploy:prod
curl -s https://illumi-family.com/api/health | grep -q '\"appEnv\":\"prod\"'
curl -s https://illumi-family.com/api/health | grep -q '\"apiVersion\":\"v1\"'
curl -s 'https://illumi-family.com/api/content/home?locale=zh-CN' | grep -q '"heroSlogan"'
curl -s 'https://illumi-family.com/api/content/home?locale=en-US' | grep -q '"featuredVideos"'
curl -s -i 'https://illumi-family.com/api/content/videos'
curl -s -i 'https://illumi-family.com/api/admin/content/home?locale=zh-CN' # 未登录应为 401
curl -s -i 'https://illumi-family.com/api/admin/videos'      # 未登录应为 401
curl -s -i -X POST 'https://illumi-family.com/api/admin/videos/import' -H 'content-type: application/json' -d '{"streamVideoId":"stream-test"}' # 未登录应为 401
```

### 7.3 回滚策略
1. 代码回滚 SOP（推荐）：
   - 先确定最近稳定 commit（`git log --oneline`）。
   - 切到稳定 commit 并重新部署目标环境（`pnpm run deploy:dev` 或 `pnpm run deploy:prod`）。
   - 回滚后必须执行 health + content smoke（含 `appEnv` 断言）。
2. 数据库问题 SOP（禁止盲目结构回滚）：
   - 不直接回滚已执行 migration。
   - 通过新增补丁 migration 前滚修复（兼容读取逻辑 + 数据修复）。
   - 顺序：`local -> dev -> prod`。
3. 缓存问题 SOP：
   - 对内容缓存按 locale 维度处理：`cms:home:published:v1:{locale}`。
   - `zh-CN` 发布相关故障优先清理所有受支持 locale 的 home cache。
4. 停止条件（Rollback Done）：
   - `/api/health` 的 `appEnv` 与目标环境一致；
   - `/api/content/home?locale=zh-CN` 与 `en-US` 返回 200；
   - 关键用户路径（`/auth`、`/users`、`/admin`）无阻断错误。

## 8. 参数/配置变更治理

### 8.1 `wrangler.json` 变更（高风险）
涉及以下项必须走完整评审与双环境验证：
- `vars`
- `d1_databases`
- `kv_namespaces`
- `r2_buckets`
- `assets.run_worker_first`
- `routes`

### 8.2 Secret 变更
禁止将 secret 写入仓库；使用 Wrangler secret 命令按环境写入。

视频能力层相关 secret：
- `STREAM_API_TOKEN`
- `STREAM_WEBHOOK_SECRET`

建议按环境分别执行（示例）：
```bash
pnpm exec wrangler secret put STREAM_API_TOKEN --env dev
pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET --env dev
pnpm exec wrangler secret put STREAM_API_TOKEN
pnpm exec wrangler secret put STREAM_WEBHOOK_SECRET
```

### 8.3 参数变更后的必验项
- `/api/health`
- `/api/content/home?locale=zh-CN`
- `/api/content/home?locale=en-US`
- `/api/content/videos`
- `/api/admin/content/home?locale=zh-CN`（未登录期望 `401`）
- `/api/admin/videos`（未登录期望 `401`）
- `/api/admin/videos/import`（未登录期望 `401`）
- 鉴权基本链路（至少 session 获取）

## 9. i18n 与内容发布专项规则

### 9.1 Locale 规则
- Canonical locale：`zh-CN`、`en-US`
- alias：`zh-* -> zh-CN`，`en-* -> en-US`

### 9.2 内容接口
- `GET /api/content/home?locale=...`
- 响应含：`locale`、`fallbackFrom`

### 9.3 缓存失效矩阵（发布动作）
- 发布共享 entry key（`home.hero_slogan` / `home.main_video` / `home.character_videos`）：失效全部受支持 locale 的 home cache（当前 `zh-CN` + `en-US`）
- 发布非共享 `zh-CN`：失效全部受支持 locale 的 home cache
- 发布非共享 `en-US`：仅失效 `en-US`

### 9.4 Admin 接口 locale 规范
- list/save/publish 均接受 locale query。
- 缺省 locale：回落 `zh-CN`。
- 非法 locale：返回 400。
- 共享 key（`home.hero_slogan` / `home.main_video` / `home.character_videos`）在 save/publish 时会镜像写入并发布 `zh-CN` + `en-US`。
- 共享 key 发布门禁会校验“必填完整性 + 视频 ready/published 状态”，失败返回 `details.issues` 字段级错误。

## 10. AI 代理执行协议（接手规范）
AI 代理在执行开发/部署任务时，必须按以下顺序：
1. 读取本 runbook + `docs/core/technical-architecture.md` + playbook references。
2. 明确目标环境（local/dev/prod）。
3. 执行最小必要改动并补测试。
4. 先跑 `pnpm test`，再跑对应 `check` 命令。
5. 每次部署先执行 schema parity gate（`db:migrate:*` + `migrations list` 必须为 `No migrations to apply`）。
6. 若目标为 prod，先确认 dev 环境同批迁移已完成并通过 smoke。
7. 输出可复现命令、结果与回滚点。

## 11. 交接清单（人类/AI 通用）
发布前 checklist：
- [ ] 目标环境确认（dev/prod）
- [ ] 目标环境 schema parity gate 完成（`db:migrate:*` 已执行，且 `migrations list` 为 `No migrations to apply`）
- [ ] 若目标为 prod，已确认 dev 无 pending migration 且 dev smoke 已通过
- [ ] `pnpm test` 通过
- [ ] `pnpm run check` 或 `pnpm run check:prod` 通过
- [ ] 部署成功并记录 Version ID
- [ ] 核心 smoke check 返回 200
- [ ] 若涉及视频能力，已验证 `/api/content/videos`、`/api/admin/content/home`、`/api/admin/videos`、`/api/admin/videos/import` 未登录返回 401
- [ ] 文档同步（架构 + runbook + playbook references）

发布后 checklist：
- [ ] 核心接口与页面可用
- [ ] 关键日志无持续错误
- [ ] 若出现异常，按回滚策略执行并记录
