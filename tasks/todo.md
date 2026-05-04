# 2026-05-04 仅部署当前已提交 commit 到 dev（已完成）

## 任务清单
- [x] 确认当前部署目标为 `HEAD`（不包含未提交改动）
- [x] 创建指向 `HEAD` 的临时 worktree，隔离未提交改动
- [x] 在临时 worktree 执行 dev 部署门禁（`pnpm test`、`pnpm run check`）
- [x] 执行 dev migration gate（`pnpm run db:migrate:dev` + migrations list）
- [x] 执行 dev 部署并做 `/api/health` 冒烟
- [x] 清理临时 worktree 并回填 Review

## 验收标准
- 部署所用代码 tree 与 `HEAD` 一致，未提交改动未进入发布包。
- dev 部署命令成功返回，且 health 返回 `appEnv=dev`。

## Review（已完成）
- 部署隔离策略：
  - 当前主工作区存在未提交改动（`git status` 多文件 `M/??`），未直接在主目录部署。
  - 以 `git worktree add /private/tmp/illumi-dev-deploy-ad956f7 ad956f7d7eebc04ebd5f9d6518497b335e35fc6d` 创建临时副本，仅包含 `HEAD` 已提交内容。
  - 临时 worktree 校验 `git rev-parse HEAD` 为 `ad956f7d7eebc04ebd5f9d6518497b335e35fc6d`，确保不含未提交改动。
- 执行命令与结果：
  - `pnpm test`：通过（42 files, 177 tests）。
  - `pnpm run check`：通过（包含 `tsc + vite build + wrangler deploy --dry-run --env dev`）。
  - `pnpm run db:migrate:dev`：通过（`No migrations to apply`）。
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote`：提权后通过（`No migrations to apply`）。
  - `pnpm run deploy`：提权后通过，发布目标 `illumi-family-mvp-dev`，Version `94f6ca59-fb28-4c81-a5b1-e033f30e263a`。
  - `curl -s https://dev.illumi-family.com/api/health`：返回 `appEnv=dev`、`apiVersion=v1`、时间戳 `2026-05-04T15:21:59.737Z`。
- 风险与回滚点：
  - 本次发布未包含新 migration，风险主要在应用层行为。
  - 若需回滚，使用上一个稳定 commit 在同样隔离流程下执行 `pnpm run deploy` 到 dev。

# 2026-05-04 移动端微信分享与 SEO 卡片实现（进行中）

## 任务清单
- [x] Unit 1: 公共视频分享链接切换为 `/video/{streamVideoId}` canonical（保留旧 query 兼容）
- [x] Unit 2: 首页与视频页接入移动端右下角分享按钮与微信指引浮层（含复制链接）
- [x] Unit 3: Worker 新增首页/视频页动态 SEO 卡片输出（title/description/image）
- [x] Unit 4: 补齐回归测试与文档同步（architecture + playbook references）
- [x] 执行验证命令并回填 Review（测试结果、风险、回滚点）

## 验收标准
- 首页与视频页移动端出现分享 FAB，点击后可打开微信指引并复制 canonical 链接。
- 视频页分享链接为 `/video/{streamVideoId}`，旧 query 链接可兼容并收敛。
- 微信抓取链路可读取首页与视频页差异化卡片信息，不依赖前端运行后改 meta。
- 受影响测试通过，文档与 playbook 同步完成。

## Review（已完成）
- 关键代码改动：
  - 路由 canonical 与兼容收敛：`src/react-app/lib/video-watch-route.ts`、`src/react-app/routes/videos-page.tsx`、`src/react-app/router.tsx`
  - 移动端分享入口：`src/react-app/components/share/mobile-share-fab.tsx`、`src/react-app/components/share/wechat-share-sheet.tsx`、`src/react-app/lib/share.ts`
  - 页面接入：`src/react-app/routes/home-page.tsx`、`src/react-app/routes/videos-page.tsx`、`src/react-app/routes/root-layout.tsx`
  - Worker SEO 卡片：`src/worker/modules/seo/seo.router.ts`、`src/worker/modules/seo/seo.controller.ts`、`src/worker/modules/seo/seo.service.ts`、`src/worker/app.ts`、`wrangler.json`
- 测试与校验：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/lib/video-watch-route.test.ts src/react-app/routes/videos-page.test.tsx`
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/components/share/mobile-share-fab.test.tsx src/react-app/routes/home-page.test.tsx src/react-app/routes/videos-page.test.tsx`
  - `pnpm exec vitest run --config vitest.config.ts src/worker/modules/seo/seo.service.test.ts src/worker/modules/seo/seo.controller.test.ts src/worker/index.test.ts`
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/lib/video-watch-route.test.ts src/react-app/routes/videos-page.test.tsx src/react-app/routes/home-page.test.tsx src/react-app/routes/root-layout.test.tsx src/react-app/components/share/mobile-share-fab.test.tsx src/worker/modules/seo/seo.service.test.ts src/worker/modules/seo/seo.controller.test.ts src/worker/index.test.ts`
  - `pnpm exec eslint src/react-app/lib/video-watch-route.ts src/react-app/routes/videos-page.tsx src/react-app/router.tsx src/react-app/lib/share.ts src/react-app/components/share/mobile-share-fab.tsx src/react-app/components/share/wechat-share-sheet.tsx src/react-app/components/share/mobile-share-fab.test.tsx src/react-app/routes/home-page.tsx src/react-app/routes/home-page.test.tsx src/react-app/routes/videos-page.test.tsx src/react-app/routes/root-layout.tsx src/worker/modules/seo/seo.service.ts src/worker/modules/seo/seo.controller.ts src/worker/modules/seo/seo.router.ts src/worker/modules/seo/seo.service.test.ts src/worker/modules/seo/seo.controller.test.ts src/worker/app.ts src/worker/types.ts src/worker/index.test.ts`
  - 结果：全部通过。
- 文档同步：
  - `docs/core/technical-architecture.md`
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md`
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 风险与回滚点：
  - `run_worker_first` 扩展到 `/` 与 `/video/*` 后，如线上异常，可先回滚 `wrangler.json` 到仅 `/api/*`。
  - 前端分享按钮是独立挂载组件，可快速下线，不影响播放主链路。

## 审查结论补充（2026-05-04）
- 结论：当前改动已完成功能探索与测试，但**暂不部署、暂不合入 `feat/mvp`**，仅在 `feat/share` 分支保留备份。
- 主要原因：
  - 页面路径性能风险：`/` 与 `/video/*` 进入 worker-first 后可能抬高首屏 TTFB。
  - 无效视频 ID 语义风险：Worker SEO 404 与前端回退语义尚未统一。
  - fallback 环境策略仍需收敛：dev preamble 兜底逻辑应与生产 fallback 解耦。

# 2026-05-03 部署 prod 环境（进行中）

## 任务清单
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check:prod`
- [x] 校验 dev 迁移状态无 pending：`pnpm exec wrangler d1 migrations list DB --env dev --remote`
- [x] 执行 prod 迁移并校验无 pending：`pnpm run db:migrate:prod` + `pnpm exec wrangler d1 migrations list DB --remote`
- [x] 执行 prod 部署：`pnpm run deploy:prod`
- [x] 执行 prod 冒烟：`/api/health`
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有命令成功返回（exit code 0）。
- prod 远端 migration 状态为 `No migrations to apply`。
- `https://illumi-family.com/api/health` 返回 `appEnv=prod`。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（41 files, 176 tests）。
  - `pnpm run check:prod` 通过（`tsc + vite build + wrangler deploy --dry-run --env=""`）。
  - `wrangler` 在沙箱中有 `EPERM` 日志写入告警（`~/Library/Preferences/.wrangler/logs`），但 `check:prod` 命令退出码为 0，属于已知非阻塞项。
- 迁移门禁：
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 通过，结果 `No migrations to apply`。
  - `pnpm run db:migrate:prod` 首次在沙箱内失败（`fetch failed`），提权重试后通过，结果 `No migrations to apply`。
  - `pnpm exec wrangler d1 migrations list DB --remote` 通过，结果 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:prod`（提权执行）成功，目标 Worker：`illumi-family-mvp`。
  - 当前版本 ID：`a642206f-6311-4bcb-9562-27e403bf765a`。
  - 生效域名：`https://illumi-family.com`、`https://admin.illumi-family.com`。
- 冒烟结果：
  - `GET https://illumi-family.com/api/health` 返回 `appEnv=prod`、`apiVersion=v1`。
  - `GET https://illumi-family-mvp.lguangcong0712.workers.dev/api/health` 返回 `appEnv=prod`、`apiVersion=v1`。
- 风险与回滚点：
  - 本次 migration 无新增应用，风险主要在应用层行为变更。
  - 若需回滚，可回退到上一个稳定 commit 后重新执行 `pnpm run deploy:prod`（数据层按 forward-fix 策略处理）。

# 2026-05-03 部署 dev 环境（进行中）

## 任务清单
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check`
- [x] 执行 dev 迁移并校验无 pending：`pnpm run db:migrate:dev` + `pnpm exec wrangler d1 migrations list DB --env dev --remote`
- [x] 执行 dev 部署：`pnpm run deploy:dev`
- [x] 执行 dev 冒烟：`/api/health`
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有命令成功返回（exit code 0）。
- dev 远端 migration 状态为 `No migrations to apply`。
- `https://dev.illumi-family.com/api/health` 返回 `appEnv=dev`。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（41 files, 176 tests）。
  - `pnpm run check` 通过（`tsc + vite build + wrangler deploy --dry-run --env dev`）。
  - `wrangler` 在沙箱中仍有 `EPERM` 日志写入告警（`~/Library/Preferences/.wrangler/logs`），但命令退出码为 0，属于已知非阻塞项。
- 迁移门禁：
  - `pnpm run db:migrate:dev` 通过，结果 `No migrations to apply`。
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 通过，结果 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:dev` 成功，目标 Worker：`illumi-family-mvp-dev`。
  - 当前版本 ID：`66157513-f658-4fff-b455-e82a106c37dc`。
  - 生效域名：`https://dev.illumi-family.com`、`https://admin-dev.illumi-family.com`。
- 冒烟结果：
  - `GET https://dev.illumi-family.com/api/health` 返回 `appEnv=dev`、`apiVersion=v1`。
  - `GET https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health` 返回 `appEnv=dev`、`apiVersion=v1`。
- 风险与回滚点：
  - 本次为正常发布流程，无新增 migration；风险主要在应用层行为变更。
  - 若需回滚，可回退到上一个稳定 commit 后重新执行 `pnpm run deploy:dev`。

# 2026-05-02 后台重构与 CMS 精简需求梳理（已完成）

## 任务清单
- [x] 扫描现有后台路由、CMS 编辑台与首页数据消费链路
- [x] 与用户确认关键产品决策（后台独立 header、`/admin` 下线策略）
- [x] 产出可规划的 requirements 文档到 `docs/brainstorms/`
- [x] 回填 Review（关键决策、范围边界、下一步）

## 验收标准
- 明确后台与 C 端 header 分离策略。
- 明确后台仅保留 `/admin/cms` 与 `/admin/videos` 两个入口，`/admin` 下线。
- 明确 CMS 仅保留“首屏核心视频 / 角色视频列表 / 家庭故事列表”三项配置。
- 文档可直接作为 `/ce:plan` 输入，无阻塞性产品问题。

## Review（已完成）
- 交付物：
  - `docs/brainstorms/2026-05-02-admin-backend-cms-videos-route-split-requirements.md`
- 关键决策：
  - 后台与 C 端使用各自独立 header，不互相复用。
  - `/admin` 路径下线，不提供兼容跳转，仅保留 `/admin/cms`、`/admin/videos`。
  - CMS 页面只保留 3 个视频相关配置模块，移除其他文案编辑模块。
  - 新增“家庭故事列表”模块，交互与门禁规则对齐“角色视频列表”。
- 文档状态：
  - `Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
  - 需在 planning 阶段明确 `/admin` 下线路由实现与家庭故事配置覆盖策略（已记录为 `Deferred to Planning`）。

## 补充决策（已确认）
- `/admin` 访问时直接跳转到 `/admin/cms`。
- CMS 视频配置不区分 locale，去掉 ZH/EN 切换。
- `家庭故事列表` 不设条数上限。
- `家庭故事列表` 不允许重复视频。
- `家庭故事列表` 为空时，前台显示空态，不回退静态列表。

# 2026-05-02 后台路由拆分与 CMS 精简实施计划（已完成）

## 任务清单
- [x] 基于 requirements 文档梳理实现范围与依赖
- [x] 输出结构化实施计划到 `docs/plans/`
- [x] 将实现拆分为可落地的实施单元与测试场景
- [x] 回填 Review（关键决策、风险、下一步）

## 验收标准
- 计划文档可直接用于 `ce:work` 执行，无需再补产品边界。
- 覆盖路由/header 拆分、CMS 契约收敛、家庭故事接入、文档同步四大面。
- 包含明确 requirements trace、文件清单、测试方案与风险缓解。

## Review（已完成）
- 交付物：
  - `docs/plans/2026-05-02-002-feat-admin-cms-videos-route-split-plan.md`
- 计划摘要：
  - 共 5 个实施单元：
    - Unit 1：后台路由拆分与 `/admin -> /admin/cms` 跳转
    - Unit 2：后台 header 与 C 端 header 分离
    - Unit 3：CMS/后端契约收敛（三模块 + 家庭故事 entry + 去 locale 编辑体验）
    - Unit 4：`/admin/cms` 三模块编辑台落地（无 locale，家庭故事不可重复）
    - Unit 5：首页家庭故事改 CMS 驱动 + 架构/skill 文档同步
- 关键技术决策：
  - `/admin` 保留入口但统一跳转，不做 404。
  - locale 在 UI 层去除，后端先保留兼容接口，降低迁移风险。
  - 家庭故事列表不设业务上限，但明确“不可重复 + 空列表空态”语义。
- 风险与缓解：
  - 路由跳转与鉴权耦合、locale 兼容、无限列表性能、旧 entry 清理策略均已纳入风险表与实现顺序。
- 下一步：
  - 进入 `ce:work` 按 Unit 1 -> Unit 5 顺序实施并逐单元验证。

# 2026-05-02 后台路由拆分与 CMS 精简实现（进行中）

## 任务清单
- [x] Unit 1: 路由拆分（新增 `/admin/cms`）并实现 `/admin -> /admin/cms` 跳转
- [x] Unit 2: 后台 header 与 C 端 header 分离（后台仅 CMS 配置 + 视频管理）
- [x] Unit 3: 扩展内容契约（新增 `home.family_story_videos`，接入服务聚合与门禁）
- [x] Unit 4: 重构 CMS 页面为三模块编辑台（无 locale、家庭故事不重复）
- [x] Unit 5: 首页家庭故事改为 CMS 配置驱动，并同步技术架构与 playbook 文档
- [x] 运行受影响测试集并确认通过

## 验收标准
- `/admin` 访问自动跳转到 `/admin/cms`。
- `/admin*` 使用后台独立导航，仅保留 2 个入口。
- CMS 页面只保留“首屏核心视频 / 角色视频列表 / 家庭故事列表”。
- 家庭故事列表可配置、不可重复、空列表前台显示空态。
- 相关文档与技能参考已同步更新。

## Review（当前结果）
- 关键代码交付：
  - 路由与导航：`src/react-app/router.tsx`、`src/react-app/routes/root-layout.tsx`
  - CMS 页面重构：`src/react-app/routes/admin-page.tsx`
  - 内容契约扩展：`src/worker/modules/content/content.schema.ts`、`src/worker/modules/content/content.service.ts`、`src/worker/modules/admin/admin.service.ts`、`src/react-app/lib/api.ts`
  - 首页家庭故事来源切换：`src/react-app/routes/home-page.tsx`、`src/react-app/routes/home/home-featured-videos.ts`
  - 文档同步：`docs/core/technical-architecture.md`、`.codex/skills/illumi-family-project-playbook/references/current-state.md`、`.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/admin-page.test.tsx src/react-app/routes/root-layout.test.tsx src/react-app/routes/videos-page.test.tsx src/react-app/routes/home/home-featured-videos.test.ts src/react-app/routes/home-page.test.tsx src/react-app/routes/home-page.data.test.ts src/worker/modules/content/content.schema.test.ts src/worker/modules/content/content.service.test.ts src/worker/modules/admin/admin.service.test.ts src/react-app/lib/api.test.ts`
  - 结果：`10 passed, 51 passed`

# 2026-05-02 首页首屏骨架屏与 CLS/防屏闪需求梳理（进行中）

## 任务清单
- [x] 扫描首页主视频现状与相关既有 brainstorm 文档
- [x] 确认本次主方向（稳定优先：骨架与播放容器一致、避免屏闪）
- [x] 新建独立 requirements 文档（聚焦 CLS 与首屏大视频防屏闪）
- [x] 执行文档 review 并吸收必要修订
- [x] 回填 Review（关键决策、范围边界、下一步）

## 验收标准
- 形成独立文档，不与既有“单击即播”文档混写。
- 需求包含：问题定义、可验证 requirements、success criteria、scope boundaries、关键决策。
- 文档可直接作为 `/ce:plan` 输入，无阻塞性未决产品问题。

## Review（已完成）
- 交付物：
  - `docs/brainstorms/2026-05-02-homepage-main-video-skeleton-cls-stability-requirements.md`
- 关键决策：
  - 采用“稳定优先”主方向，要求骨架态/可播态/错误态共用同一外层容器几何与边界。
  - 将“固定 16:9 首屏占位 + 同容器层内切换 + 防一帧黑白闪”定义为硬约束。
  - 与 `2026-04-30-homepage-main-video-single-click-stream-ux-requirements.md` 做互补分工，不重复定义播放交互链路。
- 文档评审结论：
  - 要求项具备稳定 ID（R1-R9），并覆盖问题、范围、成功标准、边界与后续规划问题。
  - `Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
- 剩余问题已下沉到 `Deferred to Planning`，不阻塞进入实施规划。

# 2026-05-02 首页首屏主视频 CLS 稳定性实施计划（已完成）

## 任务清单
- [x] 读取 requirements 文档并映射实施范围
- [x] 产出结构化实施计划到 `docs/plans/`
- [x] 补齐实现单元、测试场景、风险与验证策略
- [x] 回填 Review（交付物与下一步）

## 验收标准
- 计划文档包含 requirements trace、implementation units、验证方案与风险缓解。
- 文件路径使用 repo-relative 路径，且可直接用于 `ce:work` 执行。

## Review（已完成）
- 交付物：
  - `docs/plans/2026-05-02-001-feat-homepage-main-video-cls-stability-plan.md`
- 计划结构：
  - 3 个实施单元（统一 shell、覆盖层防闪、回归资产补齐）
  - 明确需求映射（R1-R9）、范围边界、系统影响与风险缓解
  - 提供最小验证命令（vitest + eslint）与可选截图验收
- 下一步：
  - 进入 `ce:work` 按 Unit 1 -> Unit 2 -> Unit 3 顺序实施。

# 2026-05-03 首页首屏主视频 CLS 稳定性实现（已完成）

## 任务清单
- [x] 重构 `HomeMainVideoSection` 为统一 shell（加载/错误/缺失/可播同容器）
- [x] 调整主视频覆盖层切换结构，保留同容器内过渡语义
- [x] 更新并补齐 `home-main-video-section` 相关测试断言
- [x] 执行最小验证（vitest + eslint）
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页主视频在关键状态路径下共用同一几何容器，不再切换独立块布局。
- 组件测试覆盖容器一致性与 fallback 标识。
- 定向测试与 lint 均通过。

## Review（已完成）
- 改动文件：
  - `src/react-app/routes/home/sections/home-main-video-section.tsx`
  - `src/react-app/routes/home/sections/home-main-video-section.test.tsx`
  - `docs/plans/2026-05-02-001-feat-homepage-main-video-cls-stability-plan.md`（状态回填）
- 实现结果：
  - 抽离统一 `MAIN_VIDEO_SHELL_CLASS`，让 `isLoading / isError / missing / ready` 全部渲染在同一 `aspect-video` shell 内。
  - 查询错误态改为 shell 内覆盖层，不再渲染独立错误卡片容器。
  - 主播放器 fallback 底图新增 `data-testid="home-main-video-poster-fallback"`，便于回归验证首帧前稳定底图策略。
  - 启动 loading 覆盖层增加过渡类（`transition-opacity duration-300`），收敛为同容器层内切换语义。
  - 测试新增/更新：共享 shell 断言、missing/error 路径 shell 断言、poster 缺失 fallback 标识断言。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx` 通过（6 tests）。
  - `pnpm exec eslint src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx` 通过。
- 风险与后续：
  - 当前主要是结构与断言收敛，尚未做浏览器级视觉截图对比；若需要，可在下一轮补充桌面/移动 smoke 截图验收。

# 2026-05-02 部署到 prod 环境（进行中）

## 任务清单
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check:prod`
- [x] 执行 prod 迁移并校验无 pending：`pnpm run db:migrate:prod` + `pnpm exec wrangler d1 migrations list DB --remote`
- [x] 执行 prod 部署：`pnpm run deploy:prod`
- [x] 执行 prod 冒烟：`/api/health`
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有命令成功返回（exit code 0）。
- prod 远端 migration 状态为 `No migrations to apply`。
- `https://illumi-family.com/api/health` 返回 `appEnv=prod`。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（40 files, 173 tests）。
  - `pnpm run check:prod` 通过（`tsc + vite build + wrangler deploy --dry-run --env=""`）。
  - 备注：sandbox 中 wrangler 仍有 `EPERM` 写日志提示，但不影响退出码（0）。
- 迁移门禁：
  - `pnpm run db:migrate:prod` 成功，prod D1 已应用 5 条 migration（`0001` 到 `0005`）。
  - `pnpm exec wrangler d1 migrations list DB --remote` 返回 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:prod` 成功，目标 Worker：`illumi-family-mvp`。
  - 当前版本 ID：`2e20f667-c554-49ca-b45e-cce0a4f4c6c9`。
  - 生效域名：`https://illumi-family.com`、`https://admin.illumi-family.com`。
- 冒烟结果：
  - `GET /api/health` 返回成功，`appEnv=prod`、`apiVersion=v1`。
- 风险与回滚点：
  - 本次 prod D1 首次应用历史 migration，虽然执行成功，但建议发布后优先完成一次 admin 视频与 CMS 发布路径冒烟（尤其 `home.main_video` / `home.character_videos`）。
  - 若需回滚，可回退到上一个稳定 commit 后执行 `pnpm run deploy:prod`；数据库 migration 已前进，需按 forward-fix 策略处理数据层问题。

# 2026-05-02 二维码样式调整部署到 dev（进行中）

## 任务清单
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check`
- [x] 执行 dev 迁移并校验无 pending：`pnpm run db:migrate:dev` + `pnpm exec wrangler d1 migrations list DB --env dev --remote`
- [x] 执行 dev 部署：`pnpm run deploy:dev`
- [x] 执行 dev 冒烟：`/api/health`、`/api/content/home?locale=zh-CN`、`/api/content/videos`
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有命令成功返回（exit code 0）。
- dev 远端 migration 状态为 `No migrations to apply`。
- `https://dev.illumi-family.com/api/health` 返回 `appEnv=dev`。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（40 files, 173 tests）。
  - `pnpm run check` 通过（`tsc + vite build + wrangler deploy --dry-run --env dev`）。
  - 备注：wrangler 在沙箱内有 `EPERM` 写日志告警，命令仍成功返回（exit code 0），属于已知非阻塞项。
- 迁移门禁：
  - `pnpm run db:migrate:dev` 通过，结果 `No migrations to apply`。
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 通过，结果 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:dev` 成功，目标 Worker：`illumi-family-mvp-dev`。
  - 当前版本 ID：`155d5cae-7307-424c-b827-a7334bbd805d`。
  - 生效域名：`https://dev.illumi-family.com`、`https://admin-dev.illumi-family.com`。
  - 静态资源新增上传包含 4 张二维码图（`/images/social/*.jpg`）。
- 冒烟结果：
  - `GET /api/health` 返回 `{"appEnv":"dev","apiVersion":"v1"}`。
  - `GET /api/content/home?locale=zh-CN` 返回成功，含 `heroSlogan` / `featuredVideos`。
  - `GET /api/content/videos` 返回成功，视频列表结构正常。
- 风险与回滚点：
  - 本次为前端静态资源与样式调整，无 schema 变更，风险较低。
  - 若需回滚，可回退到上一个稳定 commit 后重新执行 `pnpm run deploy:dev`。

# 2026-05-02 首页社媒二维码替换与统一排版（进行中）

## 任务清单
- [x] 定位首页二维码数据源与渲染区块
- [x] 将 4 个平台二维码替换为 `public/images/social` 新图片
- [x] 调整为统一美观的 2×2 排列并优化二维码显示不裁切
- [x] 执行最小验证（eslint/类型检查中的相关文件检查）
- [x] 回填 Review（结果与风险）

## 验收标准
- 首页“多平台内容矩阵”展示 4 张新二维码（小红书/B站/抖音/微信视频号）。
- 四张图在桌面与移动端均为统一风格、整齐排列。

# 2026-05-03 删除视频草稿危险说明与二次确认需求梳理（已完成）

## 任务清单
- [x] 扫描当前“删除草稿”前后端实现与提示文案
- [x] 核实 dev/prod 与 Stream 资源关系
- [x] 与用户确认二次确认强度与口令策略
- [x] 产出可进入规划的 requirements 文档
- [x] 回填 Review（关键决策、范围边界、下一步）

## 验收标准
- 明确“删除草稿会删除 Stream 源文件”的风险表达要求。
- 明确“dev/prod 共用 Stream，任一环境删除即跨环境生效”的提示要求。
- 明确二次确认规则：必须输入目标 `streamVideoId` 完全匹配才允许删除。
- 文档可直接作为 `/ce:plan` 输入，无阻塞性产品问题。

## Review（已完成）
- 交付物：
  - `docs/brainstorms/2026-05-03-admin-video-draft-delete-danger-confirmation-requirements.md`
- 关键决策：
  - 采用“输入 `streamVideoId`”作为二次确认口令（不采用固定词）。
  - 保留删除能力，不做硬禁用；通过危险说明 + 二次确认降低误删风险。
  - 本轮聚焦需求与交互收敛，不引入环境资源隔离架构改造。
- 文档状态：
  - `Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
  - 已将“Dialog 形态选择”“失败反馈分类”下沉至 `Deferred to Planning`。

# 2026-05-03 删除视频草稿危险说明与二次确认实施计划（已完成）

## 任务清单
- [x] 基于 requirements 文档梳理实现范围与依赖
- [x] 产出结构化实施计划到 `docs/plans/`
- [x] 将工作拆分为可执行实施单元并补齐验证方案
- [x] 回填 Review（关键决策、风险、下一步）

## 验收标准
- 计划文档可直接用于 `ce:work` 执行，无需再补产品边界。
- 覆盖危险提示、二次确认、行为兼容、回归验证四个实现面。
- 包含 requirements trace、文件清单、测试场景、风险缓解与验证命令。

## Review（已完成）
- 交付物：
  - `docs/plans/2026-05-03-002-feat-admin-video-draft-delete-danger-confirmation-plan.md`
- 计划摘要：
  - 共 4 个实施单元：
    - Unit 1：删除触发数据流改为携带完整目标对象（含 `streamVideoId`）
    - Unit 2：危险说明 + 输入 `streamVideoId` 二次确认交互
    - Unit 3：删除成功/取消/失败反馈兼容与清晰化
    - Unit 4：测试回归门禁（文案、匹配规则、链路兼容）
- 关键技术决策：
  - 采用受控弹窗确认流替代单次原生 `confirm`。
  - 二次确认口令固定为目标 `streamVideoId`，完全匹配才放行。
  - 后端删除语义与权限边界不改，保持最小改动策略。
- 下一步：
  - 进入 `ce:work` 按 Unit 1 -> Unit 4 顺序实施并逐单元验证。

# 2026-05-03 删除视频草稿危险说明与二次确认实现（已完成）

## 任务清单
- [x] 删除回调链路改为传递完整视频对象（含 `streamVideoId`）
- [x] 删除前增加危险操作说明与跨环境影响提示
- [x] 增加二次确认输入：必须精确输入目标 `streamVideoId`
- [x] 保持删除成功/取消/失败反馈可区分
- [x] 补充匹配规则测试并通过最小验证

## 验收标准
- 未输入或输入不匹配时删除被阻止。
- 文案明确“删除 Stream 源文件 + dev/prod 共用资源 + 不可恢复”。
- 删除成功后仍保持既有刷新与提示行为。
- 相关 lint 与测试通过。

## Review（已完成）
- 关键代码交付：
  - `src/react-app/routes/admin-videos-page.tsx`
  - `src/react-app/components/video/admin/video-list.tsx`
  - `src/react-app/routes/admin-videos-page.delete-confirm.ts`
  - `src/react-app/routes/admin-videos-page.delete-confirm.test.ts`
- 验证结果：
  - `pnpm exec eslint src/react-app/routes/admin-videos-page.tsx src/react-app/components/video/admin/video-list.tsx src/react-app/components/video/admin/video-list-row.tsx src/react-app/routes/admin-videos-page.delete-confirm.ts`
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/admin-videos-page.test.tsx src/react-app/routes/admin-videos-page.delete-confirm.test.ts`
  - 结果：`2 passed, 3 passed`
- 无新增 lint 报错。

## Review（已完成）
- 改动文件：
  - `src/react-app/routes/home-page.data.ts`
  - `src/react-app/routes/home/sections/home-content-matrix-section.tsx`
- 实现结果：
  - 已将内容矩阵 4 个平台二维码替换为 `public/images/social` 目录下对应图片：
    - 小红书：`/images/social/xhs.jpg`
    - B 站：`/images/social/bilibili.jpg`
    - 抖音：`/images/social/douyin.jpg`
    - 微信视频号：`/images/social/wechat.jpg`
  - 布局由“桌面 4 列”改为“统一 2×2 网格”，并优化为 `object-contain + 内边距`，保证二维码完整不裁切、视觉间距统一。
- 验证结果：
  - `pnpm exec eslint src/react-app/routes/home/sections/home-content-matrix-section.tsx src/react-app/routes/home-page.data.ts` 通过。
  - `pnpm exec tsc -p tsconfig.app.json --noEmit` 未通过，失败为仓库既有问题（`section-heading.tsx` 未使用变量、`legal-pages.test.tsx`/`root-layout.test.tsx`/`videos-page.test.tsx` 既有类型错误），与本次改动无直接关联。
- 风险与回滚点：
- 本次仅涉及首页内容矩阵静态资源路径和样式，功能风险低。
- 若需回滚，仅恢复上述两个文件即可。

# 2026-05-03 Auth/Users 页面重构与后台权限收敛需求梳理（进行中）

## 任务清单
- [x] 扫描现有 auth/users/header 与权限边界实现
- [x] 与用户确认目标方向与关键决策（封闭注册、后台父路由收敛、`/admin/profile`）
- [x] 产出 requirements 文档到 `docs/brainstorms/`
- [x] 进行文档审查并补齐可规划信息
- [x] 回填 Review（关键决策、范围边界、下一步）

## 验收标准
- 明确 `auth` 仅保留登录（邮箱/Google），不再承载注册入口。
- 明确删除独立 `/users` 页面，并新增 `/admin/profile` 承载“我的账号信息”。
- 明确 `/admin/*` 统一走白名单管理员权限模型。
- 文档可直接作为 `/ce:plan` 输入，无阻塞性产品问题。

## Review（已完成）
- 交付物：
  - `docs/brainstorms/2026-05-03-admin-auth-profile-restructure-requirements.md`
- 关键决策：
  - 采用封闭式账号策略：`/auth` 仅保留邮箱/Google 登录，移除公开注册入口。
  - 删除独立 `/users`，新增后台内 `\`/admin/profile\`` 作为“我的账号信息”唯一入口。
  - `/admin` 默认落点收敛到 `\`/admin/profile\``，后台导航保留最小入口集合。
  - `\`/admin/*\`` 全面执行白名单管理员权限校验，非白名单不得访问后台任意页面。
- 文档状态：
  - 已包含 R1-R9 稳定需求 ID、成功标准、范围边界与关键决策。
  - `Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
  - 仍有 3 项实现性问题下沉到 `Deferred to Planning`，不阻塞规划。

# 2026-05-03 Auth/Users 重构实施计划（进行中）

## 任务清单
- [x] 读取 requirements 文档并映射实现范围
- [x] 扫描路由、布局、auth 与用户信息相关代码与测试落点
- [x] 产出结构化实施计划到 `docs/plans/`
- [x] 回填 Review（实施单元、验证策略、风险）

## 验收标准
- 计划文档包含 requirements trace、implementation units、依赖顺序与可执行验证清单。
- 覆盖 `auth` 收敛、`/users` 下线、`/admin/profile` 新增、`/admin/*` 权限一致性与导航瘦身。
- 文件路径全部为 repo-relative，且可直接作为 `ce:work` 输入。

## Review（已完成）
- 交付物：
  - `docs/plans/2026-05-03-001-feat-admin-auth-profile-restructure-plan.md`
- 计划摘要：
  - 共 5 个实施单元：
    - Unit 1：路由重构（删除 `/users`、新增 `/admin/profile`、`/admin` 默认跳转切换）
    - Unit 2：`auth` 页面收敛为纯登录（邮箱/Google）并调整回跳目标
    - Unit 3：后台 profile 页面落地并复用现有用户信息 API
    - Unit 4：导航与布局瘦身（`auth` 独立布局、后台最小导航集合）
    - Unit 5：测试与文案/i18n 清理，确保 `/users` 退场后一致性
- 关键技术决策：
  - `/admin/profile` 复用现有 `requireAdminAccess`（前端）与 `requireAdminSession`（后端）边界，不新增并行权限模型。
  - `auth` 独立布局采用 `root-layout` 条件分支最小改造，不新增复杂路由嵌套层级。
  - `admin/profile` 首版使用现有 `/api/users/me` 字段集（email/name/id/createdAt/updatedAt），避免引入新的后端契约。
- 下一步：
  - 进入 `ce:work` 按 Unit 1 -> Unit 5 顺序实施并逐单元验证。

# 2026-05-03 Auth/Users 重构实施（已完成）

## 任务清单
- [x] Unit 1：路由重构（下线 `/users`、新增 `/admin/profile`、`/admin` 默认跳转切换）
- [x] Unit 2：`auth` 页面收敛为纯登录（邮箱/Google），移除注册流
- [x] Unit 3：新增后台 `admin/profile` 页面并承接账号信息编辑
- [x] Unit 4：布局与导航收敛（`/auth` 无 utility nav、`/admin*` 最小后台导航）
- [x] Unit 5：测试/i18n/文档同步与回归验证

## 验收标准
- `/auth` 只保留登录链路，不再提供注册入口。
- `/users` 不再存在前端可达路由。
- `/admin/profile` 作为后台账号页可访问，且沿用管理员权限边界。
- `/admin` 自动跳转到 `/admin/profile`。
- 关键测试与 eslint 校验通过。

## Review（已完成）
- 关键交付：
  - 路由：`src/react-app/router.tsx`
  - 新页面：`src/react-app/routes/admin-profile-page.tsx`
  - 认证页：`src/react-app/routes/auth-page.tsx`
  - 布局导航：`src/react-app/routes/root-layout.tsx`
  - i18n 与路径测试：`src/react-app/i18n/messages/*/auth.json`、`src/react-app/i18n/messages/*/common.json`、`src/react-app/i18n/detector.test.ts`
  - 文档同步：`docs/core/technical-architecture.md`、`.codex/skills/illumi-family-project-playbook/references/current-state.md`、`.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/root-layout.test.tsx src/react-app/routes/admin-profile-page.test.tsx src/react-app/routes/videos-page.test.tsx src/react-app/lib/api.test.ts src/react-app/i18n/detector.test.ts` 通过（29 tests passed）。
  - `pnpm exec eslint src/react-app/router.tsx src/react-app/routes/auth-page.tsx src/react-app/routes/admin-profile-page.tsx src/react-app/routes/root-layout.tsx src/react-app/routes/admin-profile-page.test.tsx` 通过。

# 2026-04-30 首页视频播放页模式实施计划（已完成）

# 2026-05-02 部署到 dev 环境（已完成）

## 任务清单
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check`
- [x] 执行 dev 迁移并校验无 pending：`pnpm run db:migrate:dev` + `pnpm exec wrangler d1 migrations list DB --env dev --remote`
- [x] 执行 dev 部署：`pnpm run deploy:dev`
- [x] 执行 dev 冒烟：`/api/health`、`/api/content/home`（`zh-CN` 与 `en-US`）、`/api/content/videos`
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有命令成功返回（exit code 0）。
- dev 远端 migration 状态为 `No migrations to apply`。
- `https://dev.illumi-family.com/api/health` 返回 `appEnv=dev`。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（40 files, 173 tests）。
  - `pnpm run check` 通过（`tsc + vite build + wrangler deploy --dry-run --env dev`）。
  - 备注：wrangler 日志写入出现 `EPERM` 告警（沙箱已知行为），不影响命令退出码与部署结果。
- 迁移门禁：
  - `pnpm run db:migrate:dev` 通过，返回 `No migrations to apply`。
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 通过，返回 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:dev` 成功，目标 Worker：`illumi-family-mvp-dev`。
  - 当前版本 ID：`36ac4da5-9a8b-4e4e-8920-1318861a9e42`。
  - 生效域名：`https://dev.illumi-family.com`、`https://admin-dev.illumi-family.com`。
- 冒烟结果：
  - `GET /api/health` 返回 `{"appEnv":"dev","apiVersion":"v1"}`。
  - `GET /api/content/home?locale=zh-CN` 返回成功，含 `heroSlogan` / `featuredVideos`。
  - `GET /api/content/home?locale=en-US` 返回成功，`locale=en-US`（当前数据 `fallbackFrom:["zh-CN"]`）。
  - `GET /api/content/videos` 返回 `HTTP 200`，视频列表结构正常。
- 风险与回滚点：
  - 本次无代码改动与 schema 变更，风险主要在环境配置漂移；当前 smoke 未发现异常。
  - 如需回滚，可切回稳定 commit 后执行 `pnpm run deploy:dev` 重新发布。

## 任务清单
- [x] 基于需求文档梳理实现范围与依赖关系
- [x] 输出结构化实施计划到 `docs/plans/`
- [x] 补齐实施单元测试场景、系统影响与风险缓解
- [x] 回填 Review（交付物与下一步）

## 验收标准
- 计划文档包含需求映射、实施单元、文件清单、测试场景、风险与边界。
- 计划可直接用于后续 `ce:work` 执行，不需要再补产品行为定义。

## Review（已完成）
- 已完成：生成计划文档 `docs/plans/2026-04-30-003-feat-home-video-watch-page-plan.md`。
- 已完成：计划覆盖 4 个实施单元，按依赖顺序推进（`/videos` 主播放区改造 -> 首页跳转改造 -> UI 语义收敛 -> 回归边界验证）。
- 已完成：明确关键策略
  - `v` query 作为当前视频单一事实来源；
  - 用户切换视频使用 `push`，无效参数纠偏使用 `replace`；
  - 首页与 `/videos` 公共链路移除弹窗播放，`VideoPlayerModal` 仅保留给 `/admin/videos`。
- 下一步：进入 `ce:work` 按计划实施并执行前端回归测试。

# 2026-04-30 首页视频播放页模式实现（已完成）

## 任务清单
- [x] 将 `/videos` 从弹窗播放改造为“顶部主播放器 + 下方列表”模式
- [x] 增加 `v` query 解析与无效参数回退策略（replace）
- [x] 将首页角色/家庭故事卡片点击改为跳转 `/videos?v=...`
- [x] 为列表增加当前播放项高亮能力，并保持 admin 弹窗预览不受影响
- [x] 更新相关测试并执行最小回归（vitest + eslint）
- [x] 回填 Review（结果、验证、风险）

## 验收标准
- 首页点击角色/家庭故事视频后进入 `/videos`，不再弹窗播放。
- `/videos` 页面具备常驻主播放器与列表切换能力，且支持 URL 直达。
- `/admin/videos` 仍保留 `VideoPlayerModal` 预览能力。
- 受影响测试与 lint 通过。

## Review（已完成）
- 主要改动：
  - `src/react-app/routes/videos-page.tsx`：重构为页内主播放器 + 列表切换；以 `v` query 驱动当前视频；无效参数使用 `replace` 回退。
  - `src/react-app/routes/home-page.tsx`：首页视频卡片点击改为跳转 `buildVideosWatchHref(streamVideoId)`，移除前台弹窗播放依赖。
  - `src/react-app/components/video/public/public-video-card.tsx` 与 `src/react-app/components/video/public/public-video-grid.tsx`：新增当前播放项高亮能力（`active`）。
  - `src/react-app/lib/video-watch-route.ts`（新增）：统一 watch 路由参数解析、URL 生成、active 解析与回退判定。
  - 测试更新：`src/react-app/lib/video-watch-route.test.ts`（新增），并更新 `videos-page/home-page` 相关测试断言。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/lib/video-watch-route.test.ts src/react-app/routes/videos-page.test.tsx src/react-app/routes/home-page.test.tsx src/react-app/routes/home/sections/home-character-videos-section.test.tsx src/react-app/components/video/video-player-modal.test.tsx src/react-app/routes/admin-videos-page.test.tsx` 通过（6 files, 21 tests）。
  - `pnpm exec eslint src/react-app/routes/videos-page.tsx src/react-app/routes/home-page.tsx src/react-app/components/video/public/public-video-grid.tsx src/react-app/components/video/public/public-video-card.tsx src/react-app/lib/video-watch-route.ts src/react-app/lib/video-watch-route.test.ts src/react-app/routes/videos-page.test.tsx src/react-app/routes/home-page.test.tsx` 通过。
- 风险与回滚点：
  - 风险主要在浏览器历史栈与 query 同步细节；当前策略已将纠偏路径收敛为 `replace`。
  - 如需回滚，可恢复 `home-page` 与 `videos-page` 的 `VideoPlayerModal` 路径，不影响后端与 admin。

# 2026-05-01 视频路由职责重构（已完成）

## 任务清单
- [x] C 端播放路由从 `/videos` 迁移到 `/video`
- [x] `/videos` 从路由树下线（不做兼容跳转）
- [x] `/video` 页面隐藏 utility nav（避免出现 admin 入口）
- [x] `/admin/videos` 保留管理能力并升级为页内主播放区 + 列表切换
- [x] 更新并补齐受影响测试（路由、layout、home、admin）
- [x] 执行 lint 与最小回归测试并回填结果

## 验收标准
- 首页视频点击进入 `/video?v=...`，且该页无 utility nav。
- `/videos` 不再是可用 C 端路由入口。
- `/admin/videos` 管理能力不回归，且具备页内主播放区预览能力。
- 受影响 lint 与测试通过。

## Review（已完成）
- 主要改动：
  - 路由与入口：
    - `src/react-app/router.tsx`：`VideosPage` 路由改为 `path: "/video"`，移除 `/videos`。
    - `src/react-app/lib/video-watch-route.ts`：`buildPublicVideoWatchHref()` 输出 `/video?v=...`。
    - `src/react-app/routes/home-page.tsx`：首页卡片跳转改为 `/video`。
  - 导航显隐：
    - `src/react-app/routes/root-layout.tsx`：`/video` 与首页一致隐藏 utility nav。
    - 新增 `src/react-app/routes/root-layout.test.tsx` 覆盖该约束。
  - Admin 播放增强：
    - `src/react-app/routes/admin-videos-page.tsx`：从 modal 主预览改为页内主播放区（`Stream`）+ 列表切换。
    - `src/react-app/components/video/admin/video-list.tsx` 与 `video-list-row.tsx`：新增 active 预览高亮能力。
  - 测试更新：
    - `src/react-app/lib/video-watch-route.test.ts`
    - `src/react-app/routes/videos-page.test.tsx`
    - `src/react-app/routes/admin-videos-page.test.tsx`
    - `src/react-app/routes/home-page.test.tsx`
    - `src/react-app/components/video/video-player-modal.test.tsx`
- 验证结果：
  - `pnpm exec eslint src/react-app/router.tsx src/react-app/routes/root-layout.tsx src/react-app/routes/root-layout.test.tsx src/react-app/routes/home-page.tsx src/react-app/routes/videos-page.tsx src/react-app/routes/videos-page.test.tsx src/react-app/routes/admin-videos-page.tsx src/react-app/routes/admin-videos-page.test.tsx src/react-app/components/video/admin/video-list.tsx src/react-app/components/video/admin/video-list-row.tsx src/react-app/lib/video-watch-route.ts src/react-app/lib/video-watch-route.test.ts` 通过。
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/lib/video-watch-route.test.ts src/react-app/routes/videos-page.test.tsx src/react-app/routes/root-layout.test.tsx src/react-app/routes/home-page.test.tsx src/react-app/routes/admin-videos-page.test.tsx src/react-app/components/video/video-player-modal.test.tsx` 通过（6 files, 21 tests）。
- 风险与回滚点：
  - 风险集中在旧 `/videos` 外链访问不可达，这是本次明确产品决策；若后续需要兼容，可单独加过渡重定向策略。
  - 如需回滚，可恢复 `router.tsx` 的 `/videos` 路由和 `video-watch-route` 的旧路径构造函数。

# 2026-04-30 首页角色视频跳转播放页（B站/YouTube 模式）需求方案（进行中）

## 任务清单
- [x] 扫描当前首页角色视频与 `/videos` 播放交互实现，确认复用边界
- [x] 输出详细方案并固化为需求文档（含路由、交互、状态、验收）
- [x] 对需求文档执行一轮审查并修正阻塞问题
- [x] 回填 Review（关键决策、风险、下一步）

## 验收标准
- 形成可执行的需求文档，明确“非弹窗、播放页主播放区+列表”的目标行为。
- 文档包含稳定需求编号、范围边界、成功标准和上线阶段划分。
- 无阻塞问题时可直接进入 `/ce:plan`。

## Review（已完成）
- 已完成：核对现状实现，确认首页角色/家庭故事与 `/videos` 当前均使用弹窗播放器，存在与目标模式不一致的问题。
- 已完成：产出需求文档 `docs/brainstorms/2026-04-30-home-character-videos-to-watch-page-requirements.md`，覆盖路由、播放页结构、状态处理、边界和成功标准。
- 已完成：文档自审通过，`Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
- 关键决策：
  - 首发采用 `/videos?v=<streamVideoId>` 承载“主播放区 + 列表”模式。
  - 取消首页与 `/videos` 的弹窗播放主路径，全屏统一交给播放器原生能力。
  - 改造范围仅限前台播放链路，不改后端视频契约与 admin 配置。
- 风险与回滚点：
  - 主要风险是路由参数与页面状态同步（前进/后退一致性）；通过规划阶段明确 URL 回写策略可控。
  - 若上线后需回滚，可先恢复首页点击弹窗路径与 `/videos` 原弹窗播放逻辑，不影响后端。

# 2026-04-30 部署到 dev 环境（进行中）

## 任务清单
- [x] 执行部署前质量门禁：`pnpm test` 与 `pnpm run check`
- [x] 执行 dev 迁移并校验无 pending：`pnpm run db:migrate:dev` + `wrangler d1 migrations list`
- [x] 执行 dev 部署：`pnpm run deploy:dev`
- [x] 执行 dev 冒烟：`/api/health` 与关键内容接口
- [x] 回填 Review（命令结果、风险、回滚点）

## 验收标准
- 所有门禁命令成功返回。
- dev 远端 migration 状态为 `No migrations to apply`。
- `https://dev.illumi-family.com/api/health` 返回 `appEnv=dev` 且服务可用。

## Review（已完成）
- 质量门禁：
  - `pnpm test` 通过（36 files, 155 tests）。
  - `pnpm run check` 通过（`tsc + vite build + wrangler deploy --dry-run --env dev`）。
  - 备注：Wrangler 在沙箱内出现 `EPERM` 写日志告警，但命令退出码为 0，且属于已知非阻塞项。
- 迁移门禁：
  - `pnpm run db:migrate:dev` 结果 `No migrations to apply`。
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 结果 `No migrations to apply`。
- 部署结果：
  - `pnpm run deploy:dev` 成功，目标 Worker：`illumi-family-mvp-dev`。
  - 当前版本 ID：`e41cdf0f-7a56-4283-a4c4-a4adccba50d0`。
  - 生效域名：`https://dev.illumi-family.com`、`https://admin-dev.illumi-family.com`。
- 冒烟结果：
  - `GET /api/health` 返回 `{"status":"ok","appEnv":"dev","apiVersion":"v1"}`。
  - `GET /api/content/home?locale=zh-CN` 返回成功，含 `heroSlogan`/`featuredVideos`。
  - `GET /api/content/home?locale=en-US` 返回成功，`locale=en-US`（当前数据带 `fallbackFrom:["zh-CN"]`）。
  - `GET /api/content/videos` 返回 `HTTP 200`，视频列表结构正常。
- 风险与回滚点：
  - 本次无 schema 变更与代码改动，主要风险为运行时配置异常（当前 smoke 未见）。
  - 如需回滚，可按稳定版本重新执行 `pnpm run deploy:dev`（指定对应 commit）。

# 2026-04-30 组件治理规范同步（已完成）

## 任务清单
- [x] 将“shadcn CLI 优先”写入项目级 `AGENTS.md`
- [x] 将同一规则写入 `illumi-family-project-playbook` skill
- [x] 更新 playbook `references/sync-rules.md`，补充 UI 组件治理同步要求
- [x] 在 `tasks/lessons.md` 记录本次纠偏与预防规则
- [x] 回填 Review

## 验收标准
- 项目规范中明确“组件优先来自 shadcn CLI”。
- skill 与 references 中有一致规则，避免文档漂移。
- lessons 中有可执行的预防条目。

## Review（已完成）
- 已更新：
  - `AGENTS.md`：新增 `UI 组件规范` 章节，并把 UI 组件治理纳入 maintenance 同步触发条件。
  - `.codex/skills/illumi-family-project-playbook/SKILL.md`：新增 `UI Component Guardrails`。
  - `.codex/skills/illumi-family-project-playbook/references/sync-rules.md`：新增 UI 组件治理同步检查项。
  - `tasks/lessons.md`：新增 2026-04-30 纠偏记录（shadcn-first 规则）。
- 风险与回滚点：
  - 本次为文档/规范变更，无运行时代码影响。
  - 如需回滚，恢复以上 4 个文件对应段落即可。

# 2026-04-30 首页角色视频标题来源排查（已完成）

## 任务清单
- [x] 定位 C 端首页“角色视频列表”数据来源（前端函数与后端 API）
- [x] 核对 `/admin/videos` 的标题编辑写入字段与存储位置
- [x] 对齐 C 端读取字段与 admin 写入字段，确认不生效根因（含缓存/发布状态影响）
- [x] 给出最小修复方案与验证步骤
- [x] 回填 Review（结论、影响范围、回滚点）

## 验收标准
- 明确指出 C 端标题最终来源字段（含文件路径/接口路径）。
- 明确解释“为什么 admin 改了标题但 C 端不变”。
- 给出可执行修复动作（必要时附代码改动点）。

## Review（已完成）
- 结论：C 端首页角色视频卡片标题来自 `GET /api/content/videos` 返回的 `PublicVideoRecord.title`，并由 `resolveHomeFeaturedVideos`/`resolveConfiguredVideoList` 映射到卡片展示；`home.character_videos` 配置只存 `streamVideoId` 顺序，不存标题文本。
- 根因：后端 `VideoService.listPublicVideos` 使用 KV 缓存 `videos:public:v1`（TTL 120 秒）；`/admin/videos` 标题编辑走 `updateVideoMetadata`，原实现未在“已发布视频元数据变更”后清缓存，导致 C 端继续读旧标题直到缓存过期。
- 修复：`updateVideoMetadata` 新增 `env` 参数，并在更新结果为 `published` 时调用 `invalidatePublicCache`；controller 同步传入 `c.env`。
- 影响范围：仅影响“已发布视频在 admin 修改标题/封面后的 C 端可见时效”，不改变发布状态与排序逻辑。
- 验证：
  - `pnpm exec vitest run --config vitest.config.ts src/worker/modules/video/video.service.test.ts src/worker/modules/video/admin-video.controller.test.ts` 通过（2 files, 26 tests）。
  - 新增单测覆盖：`published` 元数据更新会清缓存；`draft` 更新不会清缓存。
- 回滚点：可回滚 `src/worker/modules/video/video.service.ts` 与 `src/worker/modules/video/admin-video.controller.ts` 本次改动。

# 2026-04-30 首页首屏 Stream 单击即播交互落地（已完成）

## 任务清单
- [x] 实施 Unit 1：首屏主视频改为常驻 Stream 挂载 + 单击播放意图
- [x] 实施 Unit 2：首页进入即主视频预热联动（metadata 策略）
- [x] 实施 Unit 3：播放埋点补充 `surface` 与 `play_intent/loadstart`
- [x] 更新相关测试并完成回归验证

## 验收标准
- 首屏点击播放后不再出现“灰屏 -> 再出现首帧+按钮”的二次交互。
- 首页主视频具备 `preload="metadata"` 预备加载路径。
- 埋点可区分 `home-main` 与 `video-modal` 场景，并覆盖启动关键事件。

## Review（已完成）
- 改动文件：
  - `src/react-app/routes/home/sections/home-main-video-section.tsx`
  - `src/react-app/lib/video-playback-metrics.ts`
  - `src/react-app/components/video/video-player-modal.tsx`
  - `src/react-app/routes/home/sections/home-main-video-section.test.tsx`
  - `src/react-app/lib/video-playback-metrics.test.ts`
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx src/react-app/lib/video-playback-metrics.test.ts src/react-app/components/video/video-player-modal.test.tsx src/react-app/lib/video-player-warmup.test.ts` 通过（4 files, 18 tests）。
  - `pnpm exec eslint src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/lib/video-playback-metrics.ts src/react-app/components/video/video-player-modal.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx src/react-app/lib/video-playback-metrics.test.ts` 通过。
  - `pnpm exec tsc -p tsconfig.app.json --noEmit` 未通过，存在仓库既有问题：`src/react-app/routes/home/components/section-heading.tsx` 中 `Badge` 与 `description` 未使用（非本次改动引入）。

# 2026-04-30 首页首屏 Stream 单击即播优化计划（已完成）

## 任务清单
- [x] 读取 origin 需求文档并抽取 R1-R11
- [x] 扫描当前实现与可复用模式（home main video / warmup / metrics / modal state machine）
- [x] 产出结构化实施计划文档到 `docs/plans/`
- [x] 回填执行与验证建议

## 验收标准
- 计划文档包含：问题框架、需求追踪、范围边界、实施单元、测试场景、风险与验证方案。
- 所有文件路径为 repo-relative，且可直接用于后续 `ce:work` 实施。

## Review（已完成）
- 已新增计划文档：`docs/plans/2026-04-30-002-feat-homepage-main-video-single-click-stream-startup-plan.md`。
- 计划将实现拆分为 3 个单元：首屏状态机重构、首页预备加载联动、指标场景维度补齐。
- 已明确验证命令与回归范围，下一步可直接进入 `ce:work` 执行。

# 2026-04-30 首页移动端导航抽屉重构（已完成）

## 任务清单
- [x] 将首页移动端入口改为右上角单一菜单 icon（保留桌面端导航）
- [x] 实现“自上而下”移动端抽屉，抽屉内承载导航列表与中英文切换
- [x] 实现抽屉关闭行为：icon toggle、遮罩点击、Escape 键
- [x] 实现导航点击流程：先关闭抽屉，再滚动到目标 section
- [x] 补齐中英文 i18n 导航 aria 文案键
- [x] 更新受影响测试并执行快速验证
- [x] 回填 Review

## 验收标准
- 移动端头部显示菜单 icon，点击后出现顶部抽屉。
- 抽屉内包含首页导航项和语言切换按钮。
- 点击抽屉导航项后，抽屉先关闭，再滚动到对应板块，URL 不出现 hash。
- 抽屉支持再次点击菜单按钮关闭、点击遮罩关闭、Escape 关闭。
- 桌面端导航结构与行为保持不变。

## Review（已完成）
- 已完成：`src/react-app/routes/home-page.tsx` 移除旧移动端横向滚动导航，改为 `lg:hidden` 菜单按钮 + 顶部抽屉交互。
- 已完成：新增抽屉打开态生命周期处理（body 滚动锁定、Escape 关闭、遮罩关闭）。
- 已完成：新增 `handleMobileNavSelection`（`src/react-app/routes/home-page.scroll.ts`）并在测试中验证“close -> raf -> scroll”顺序。
- 已完成：补充导航 aria 文案键：
  - `src/react-app/i18n/messages/zh-CN/home.json`
  - `src/react-app/i18n/messages/en-US/home.json`
- 已完成：更新 `src/react-app/routes/home-page.test.tsx`，覆盖移动端菜单入口渲染与“先关后滚”逻辑。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx src/react-app/routes/home-page.data.test.ts` 通过（2 files, 8 tests）。
  - `pnpm exec tsc -p tsconfig.app.json --noEmit` 失败，阻塞项为仓库既有未使用变量：
    - `src/react-app/routes/home/components/section-heading.tsx`（`Badge`/`description` 未使用）
  - `pnpm run lint -- <受影响文件>` 失败，同样被上述仓库既有错误阻塞，非本次改动引入。

# 2026-04-30 首页五大板块重构（已完成）

## 任务清单
- [x] 基于需求文档输出实施计划：`docs/plans/2026-04-30-001-refactor-homepage-five-sections-plan.md`
- [x] 重构首页数据模型与导航配置（去 hash，补齐五大板块配置）
- [x] 改造首屏主视频为“点击后播放”（默认不自动播放）
- [x] 重排首页结构并接入 JS 滚动导航（刷新回首屏）
- [x] 新增家塾起源 / 家庭故事 / 内容矩阵 / 商务合作板块
- [x] 补齐中英文文案与测试回归
- [x] 执行受影响测试并回填 Review

## 验收标准
- 首页结构顺序为：导航 -> 首屏视频 -> 家塾起源 -> 角色介绍 -> 家庭故事 -> 内容矩阵 -> 商务合作。
- 首屏视频默认不自动播放，点击中心播放按钮后才开始播放。
- 导航点击后通过 JS 滚动到目标板块，URL 不出现 hash，刷新后回到首屏顶部。
- 家庭故事视频列表与角色介绍视频列表保持一致布局风格。
- 内容矩阵仅展示四个平台二维码（小红书、B 站、抖音、微信视频号），不做跳转。
- 商务合作展示手机号 `13570380204` 与邮箱 `contact@illumi-family.com`。

## Review（已完成）
- 已完成：将“IP 介绍 + 品牌愿景”完整文案以配置形式写死在首页数据中（`homeOriginContent`），并同步写入需求/计划文档。
- 已完成：首页结构重排为“导航 -> 首屏视频 -> 家塾起源 -> 角色介绍 -> 家庭故事 -> 内容矩阵 -> 商务合作”。
- 已完成：导航从 hash 锚点切换为 JS 滚动；首页初始化滚动逻辑改为统一回顶。
- 已完成：首屏主视频改为“中心播放按钮点击后播放”，默认不自动播放。
- 已完成：家庭故事视频区复用角色介绍卡片样式，数据源为首页配置的 `streamVideoIds` 列表。
- 已完成：内容矩阵与商务合作板块上线（二维码静态展示、不跳转；联系方式固定手机号与邮箱）。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.data.test.ts src/react-app/routes/home-page.test.tsx src/react-app/routes/home/home-featured-videos.test.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx src/react-app/routes/home/sections/home-character-videos-section.test.tsx` 通过（5 files, 18 tests）。
  - `pnpm exec tsc -p tsconfig.app.json --noEmit` 通过。
  - `pnpm run lint -- <受影响文件列表>` 通过（仅仓库既有 `worker-configuration.d.ts` 2 条 warning，非本次引入）。

# 2026-04-30 顶部导航改为全宽悬浮（已完成）

## 任务清单
- [x] 审查 `RootLayout` 导航结构并确认最小影响改动点
- [x] 将顶部导航改为全宽并固定悬浮在顶部（移除卡片式容器感）
- [x] 为主内容区域补齐顶部间距，避免被悬浮导航遮挡
- [x] 运行受影响范围的快速验证（至少 lint/root-layout 相关检查）
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 非首页路由顶部导航横向撑满视口宽度，不再是居中卡片容器样式。
- 顶部导航悬浮在页面顶部，滚动时保持可见。
- 页面主内容不会被导航遮挡，交互与跳转行为保持正常。

## Review（已完成）
- 已完成：`src/react-app/routes/root-layout.tsx` 顶部导航由普通流式块改为 `fixed inset-x-0 top-0`，实现全宽悬浮；移除 `max-w-6xl` 居中容器，取消卡片式视觉包裹感。
- 已完成：`main#app-main-content` 在展示工具导航时增加 `pt-16`，避免固定导航遮挡页面主体。
- 已完成：快速验证命令 `pnpm run lint -- src/react-app/routes/root-layout.tsx` 通过（0 error）；仅存在仓库既有 `worker-configuration.d.ts` 的 2 条 warning，与本次改动无关。
- 风险与后续：导航为固定定位后，若未来导航高度增加（如新增第二行）需同步调整 `pt-16` 以防内容重叠。

# 2026-04-18 手动全量同步 Stream 目录到当前环境 D1（已完成）

## 任务清单
- [x] 扩展 Stream client：支持分页读取目录（list）
- [x] 扩展 `video_assets` schema 与 migration：同步状态字段（缺失 streak / last seen）
- [x] 实现 `VideoService` 全量同步编排（并发锁、分页 partial、缺失两次下架）
- [x] 新增 admin API：`POST /api/admin/videos/sync-catalog`
- [x] 新增前端顶部主按钮与摘要反馈（同步中禁用、冲突提示）
- [x] 补全 worker/frontend 测试覆盖
- [x] 同步 runbook/architecture/playbook 文档
- [x] 回填 Review（结果、风险、后续）

## 验收标准
- `/api/admin/videos/sync-catalog` 在 admin 鉴权下可用，未登录返回 401。
- 新增同步记录默认 `draft`；已存在记录覆盖元数据但保留 `publishStatus`。
- 远端缺失需连续两次同步命中才自动下架并标记 `failed`。
- 分页中途失败时，本次允许已成功页入库，但跳过缺失下架。
- `/admin/videos` 顶部按钮可直接触发同步，页面仅展示摘要数字（新增/更新/下架/失败）。

## Review（已完成）
- 关键改动：
  - 后端新增手动同步 API：`POST /api/admin/videos/sync-catalog`。
  - 新增 Stream 目录读取能力（list API），按页同步到当前环境 D1。
  - `video_assets` 新增同步状态字段：`missing_from_stream_streak`、`last_seen_in_stream_at`（migration `0005_video_assets_stream_sync_state.sql`）。
  - 同步规则落地：新增默认 `draft`；已存在覆盖元数据保留 `publishStatus`；远端缺失连续 2 次才自动下架；分页失败时跳过缺失下架。
  - `/admin/videos` 顶部新增“同步 Stream 目录”按钮，执行中禁用，完成后仅展示摘要数字。
- 测试结果：
  - 受影响用例通过：
    - `src/worker/modules/video/video.service.test.ts`
    - `src/worker/modules/video/admin-video.controller.test.ts`
    - `src/worker/index.test.ts`
    - `src/react-app/lib/api.test.ts`
    - `src/react-app/routes/admin-videos-page.test.tsx`
  - `pnpm run build` 通过。
  - 全量 `pnpm test` 仍有 2 个既有失败（未由本次改动引入）：
    - `src/react-app/routes/home/sections/home-main-video-section.test.tsx`
    - `src/react-app/routes/home/sections/home-character-videos-section.test.tsx`
- 风险与后续建议：
  - 当前同步锁基于 KV（短 TTL + 双重校验），如后续出现高并发冲突再升级为 D1 强一致锁表。
  - 建议在 dev/prod 分别跑一次真实 `sync-catalog` 冒烟，验证“第二次缺失才下架”在远端数据上的行为符合预期。
  - 已确认并修复根因：Cloudflare Stream list 真实响应为 `result: { videos, total, range }`，同步解析已兼容对象/数组两种形态。

# 2026-04-17 部署规范修订：强制 migration 门禁（已完成）

## 任务清单
- [x] 审计 `technical-architecture` 与 `runbook` 的部署流程一致性
- [x] 明确“未遵守流程”与“规范缺陷”各自结论并写入 Review
- [x] 修订 runbook：将 migration 状态检查/应用设为每次发布强制步骤
- [x] 修订 technical-architecture：同步强制发布顺序与门禁定义
- [x] 同步 playbook `references/workflows.md`，避免 AI 执行口径漂移
- [x] 回填 Review（改动点、风险、后续执行要求）

## 验收标准
- 两份主文档对发布流程无冲突，并明确写出“先迁移后部署”。
- playbook reference 与 runbook 口径一致，不再保留旧流程。
- 下次执行 `dev/prod` 发布时，按文档无法跳过 migration parity gate。

## Review（已完成）
- 审计结论（双因）：
  - 未遵守流程：上次发布时未执行 runbook 里已有的“迁移状态检查”要求，导致代码部署先于 schema 对齐。
  - 规范缺陷：runbook 的“强制门禁矩阵 / 标准发布命令”与“迁移治理条款”存在口径不一致，前者未把 migration gate 写成每次发布强制项，导致执行时容易遗漏。
- 已修订文件：
  - `docs/runbooks/development-deployment-cicd-runbook.md`
  - `docs/core/technical-architecture.md`
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md`
  - `.codex/skills/illumi-family-project-playbook/SKILL.md`
- 关键规范收敛：
  - 明确 `deploy*` 只发布 Worker/静态资源，不包含 D1 migration。
  - 明确每次发布必须先执行 schema parity gate：`db:migrate:*` + `migrations list` 输出 `No migrations to apply`。
  - dev/prod 标准发布命令序列已内嵌上述 gate，不再只写 `check + deploy`。
  - 发布前 checklist 从“若有 DB 变更再看迁移”升级为“每次发布都必须完成 migration gate”。
- 风险与后续执行要求：
  - 风险：若执行人绕过 runbook 直接手敲 `deploy*`，仍可能跳过 gate。
  - 要求：后续所有发布记录必须附上目标环境 `migrations list` 的 `No migrations to apply` 结果。

# 2026-04-17 dev 视频接口 500 故障排查与修复（已完成）

## 任务清单
- [x] 复现 dev 视频相关接口 500 并记录错误响应
- [x] 核对 dev 远端 D1 migration 状态与视频相关表结构
- [x] 修复缺失迁移（若存在）并记录执行结果
- [x] 回归验证视频接口恢复
- [x] 回填 Review（根因、修复、风险与防再发）

## 验收标准
- dev 视频相关公开接口（至少 `/api/content/videos`）恢复 200 且返回业务数据结构。
- 确认 dev 远端 D1 migration 状态与仓库迁移文件一致（无遗漏）。
- `tasks/todo.md` 留存可复现命令、结果与结论。

## Review（已完成）
- 故障复现：
  - `curl -i https://dev.illumi-family.com/api/content/videos` 返回 `500`，错误体为 `INTERNAL_SERVER_ERROR`。
- 根因确认：
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` 显示 dev 远端仍有待执行迁移：`0004_stream_video_assets.sql`。
  - `pnpm exec wrangler d1 migrations list DB --env dev --local` 显示本地为 `No migrations to apply`，说明是“远端漏跑”而非“迁移文件缺失”。
- 修复动作：
  - 执行 `pnpm db:migrate`（`wrangler d1 migrations apply DB --env dev --remote`）成功应用 `0004_stream_video_assets.sql`。
- 回归结果：
  - `pnpm exec wrangler d1 migrations list DB --env dev --remote` => `No migrations to apply`
  - `curl -i https://dev.illumi-family.com/api/content/videos` => `200`，返回 `{"success":true,"data":{"videos":[]}}`
  - `pnpm exec wrangler d1 execute DB --env dev --remote --command "SELECT name FROM sqlite_master WHERE type='table' AND name='video_assets';"` 查到 `video_assets` 表已存在
  - `GET /api/admin/videos`（未登录）与 `POST /api/admin/videos/import`（未登录）均返回 `401`（不再是 500）
- 为什么会遗漏：
  - 本次只执行了代码部署（`pnpm run deploy`），但该脚本不会自动执行数据库迁移。
  - 发布前未执行“远端 migration 状态检查/应用”步骤，导致新代码访问 `video_assets` 时命中缺表而 500。
- 防再发：
  - 以后 dev 发布执行顺序固定为：`pnpm test` -> `pnpm run check` -> `pnpm db:migrate` -> `pnpm run deploy` -> smoke。
  - 任何涉及视频/CMS/鉴权 schema 变更的发布，必须在发布记录里附上 `wrangler d1 migrations list --remote` 结果截图/文本。

# 2026-04-17 dev 环境部署（已完成）

## 任务清单
- [x] 读取 playbook 与部署 runbook，确认 dev 标准流程
- [x] 执行部署前门禁：`pnpm test` 与 `pnpm run check`
- [x] 执行 dev 部署：`pnpm run deploy`
- [x] 执行 dev 健康检查与关键 smoke：`/api/health`（含 `appEnv=dev`）
- [x] 回填 Review（命令结果、风险与回滚点）

## 验收标准
- `pnpm test` 与 `pnpm run check` 通过。
- `pnpm run deploy` 成功并发布到 dev Worker。
- `https://dev.illumi-family.com/api/health` 返回包含 `"appEnv":"dev"`。
- `tasks/todo.md` 已回填本次执行结果，可审计可复现。

## Review（已完成）
- 已完成：按 playbook 执行门禁命令。
  - `pnpm test`：失败（2 个用例）
    - `src/react-app/routes/home/sections/home-character-videos-section.test.tsx`
    - `src/react-app/routes/home/sections/home-main-video-section.test.tsx`
  - `pnpm run check`：通过（`tsc` + `vite build` + `wrangler deploy --dry-run --env dev`）。
- 已完成：执行真实 dev 部署 `pnpm run deploy`，发布成功。
  - Worker：`illumi-family-mvp-dev`
  - Version ID：`540b8691-78f7-4e00-9b8f-ddbf5a5adcf7`
  - Triggers：`dev.illumi-family.com`、`admin-dev.illumi-family.com`、`illumi-family-mvp-dev.lguangcong0712.workers.dev`
- 已完成：执行 smoke 检查。
  - `curl -sS https://dev.illumi-family.com/api/health` 返回 `success=true` 且 `appEnv=dev`
  - `curl -I https://admin-dev.illumi-family.com/admin` 返回 `200`
  - `curl https://dev.illumi-family.com/api/admin/me`（未登录）返回 `401`
  - `curl https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health` 在当前终端网络下出现 TLS `SSL_ERROR_SYSCALL`（自定义 dev 域名健康检查正常）
- 风险与回滚点：
  - 风险：当前分支存在 2 个失败测试，未满足“全绿门禁”。
  - 回滚点：若需回退，按 runbook `7.3` 选择稳定 commit 后重新执行 `pnpm run deploy:dev`，再做 health/smoke 复核。

# 2026-04-17 首页主片黑边（letterbox）透明化（已完成）

## 任务清单
- [x] 定位黑边来源：Cloudflare Stream letterbox/pillarbox 默认底色
- [x] 首页主片传入 `letterboxColor=\"transparent\"` 消除非全屏黑边
- [x] 更新测试断言锁定参数，避免回归
- [x] 运行受影响测试与 lint 验证
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页主片在非全屏状态下不再出现黑色 letterbox/pillarbox 边缘。
- 主片仍保持 16:9 与既有 autoplay/muted/loop/controls 行为。
- 受影响测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：确认 `@cloudflare/stream-react` 支持 `letterboxColor`，官方说明可设置为 `transparent` 去除非全屏黑边。
- 已完成：在首页主片 `Stream` 增加 `letterboxColor=\"transparent\"`，保持其余播放参数不变。
- 已完成：更新 `home-main-video-section.test.tsx`，新增 `data-letterbox-color=\"transparent\"` 断言。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过，4 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）
- 风险与回滚点：若部分终端对 `transparent` 的渲染不一致，可改为与页面背景一致的浅色值，避免视觉突兀。

# 2026-04-17 首页角色卡片与 /videos 样式交互一致化（已完成）

## 任务清单
- [x] 对比 `/videos` 与首页角色区卡片实现，明确差异点
- [x] 抽齐共享卡片能力（支持不可播放态）且不回归 `/videos`
- [x] 首页角色区改为复用 `/videos` 卡片样式和交互
- [x] 更新受影响测试并通过验证
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页角色区卡片在视觉样式与交互行为上与 `/videos` 卡片一致。
- 可播放卡片保持 hover/focus/touch 预热与点击播放；不可播放卡片保留禁用态。
- 受影响测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：定位首页卡片使用独立样式实现，未复用 `PublicVideoCard`，是差异根因。
- 已完成：扩展 `PublicVideoCard` 支持 `disabled` 与自定义 `ariaLabel`，并将预热/点击交互统一封装在共享组件内。
- 已完成：首页角色区改为直接复用 `PublicVideoCard`，移除原先独立卡片结构、额外徽标与文案行，视觉/交互与 `/videos` 对齐。
- 已完成：受影响测试更新并通过：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-character-videos-section.test.tsx src/react-app/routes/videos-page.test.tsx`（通过，4 tests）
  - `pnpm run lint -- src/react-app/components/video/public/public-video-card.tsx src/react-app/routes/home/sections/home-character-videos-section.tsx src/react-app/routes/home/sections/home-character-videos-section.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）
- 风险与回滚点：不可播放卡片仍使用统一外观但禁用点击；若产品后续要求“不可播放卡片视觉显著区分”，可在 `PublicVideoCard` 增加可选 `variant`，不再回到页面内重复实现。

# 2026-04-17 首页主片移除背景色避免黑边（已完成）

## 任务清单
- [x] 确认需求：主片容器不需要背景色
- [x] 移除主片运行态容器背景色（保持 16:9 与现有播放行为）
- [x] 运行受影响测试与 lint 验证无回归
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页主片容器无背景底色，不再出现由底色引起的黑边观感。
- 主片仍保持 16:9，且 autoplay/muted/loop/controls 行为不变。
- 受影响测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：确认本次为视觉收敛需求，采用最小样式改动，不调整数据和播放逻辑。
- 已完成：移除 `MainVideoPlayer` 运行态容器 `bg-[#181412]`，避免背景底色造成黑边观感。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过，4 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）
- 风险与回滚点：若后续发现首帧未到前透明背景影响观感，可改为更浅暖色背景而非黑色底。

# 2026-04-17 首页主片固定 16:9 宽高比（已完成）

## 任务清单
- [x] 明确需求：首页主片容器固定为 16:9，契合视频比例
- [x] 将主片容器从 `min-h` 高度策略改为固定 `aspect-video`
- [x] 同步加载占位容器比例，避免状态切换布局跳动
- [x] 更新受影响测试断言并验证通过
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页主片区域在 PC/Mobile 下均保持 16:9。
- 视频画面撑满容器，不再出现比例失真或异常留黑。
- 受影响测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：确认需求目标为“固定比例优先”，容器高度不再按 `dvh` 动态拉伸。
- 已完成：`MainVideoPlayer` 运行态容器改为 `aspect-video w-full`，固定 16:9。
- 已完成：首页视频 loading 占位容器同步改为 `aspect-video w-full`，避免状态切换时高度跳变。
- 已完成：更新 `home-main-video-section.test.tsx`，新增 `aspect-video` 断言，锁定比例回归。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过，4 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）
- 风险与回滚点：固定 16:9 后主片在超宽屏下可视高度会低于此前 `dvh` 方案；若后续希望“更高更沉浸”，需在 16:9 外层追加可控 max-width/布局策略，而不是放弃固定比例。

# 2026-04-17 首页主片未撑满容器修复（已完成）

## 任务清单
- [x] 读取 playbook 与首页主片相关实现，定位容器与播放器尺寸不一致点
- [x] 修复首页主片播放器未撑满容器的问题（最小改动）
- [x] 更新受影响测试断言，锁定回归
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（根因、改动、验证、风险）

## 验收标准
- 首页“主片”在 PC/Mobile 下均可撑满其黑色圆角容器，不再只显示左上角小尺寸画面。
- 保持现有 autoplay/muted/loop/controls 行为不变。
- 受影响测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：根据截图与代码定位，`MainVideoPlayer` 的 `Stream` 未传递 `width/height`，在 `responsive={false}` 下出现播放器按默认尺寸渲染，未填满容器。
- 已完成：在 `src/react-app/routes/home/sections/home-main-video-section.tsx` 为 `Stream` 增加 `width=\"100%\"` 与 `height=\"100%\"`，保持现有 autoplay/muted/loop/controls 行为不变，仅修复尺寸填充。
- 已完成：更新 `src/react-app/routes/home/sections/home-main-video-section.test.tsx`，将主片播放器断言改为必须包含 `data-width=\"100%\"` 与 `data-height=\"100%\"`，防止回归。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过，4 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）
- 风险与回滚点：若后续发现某些设备上 Stream 对 `width/height` 兼容异常，可回滚该两行 props，退回默认渲染策略并改为容器级比例布局修复。

# 2026-04-17 首页进入自动跳到底部修复（已完成）

## 任务清单
- [x] 读取 playbook 与相关代码，定位触发链路（hash/scroll restore）
- [x] 实现首页首次进入回到顶部的最小修复
- [x] 保持显式锚点跳转能力不回归
- [x] 补充/更新测试覆盖该行为
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（根因、改动、验证、风险）

## 验收标准
- 进入首页时不再自动跳到底部。
- 用户主动点击首页锚点导航仍可正常跳转到目标 section。
- 受影响前端测试通过，无新增 lint/build 阻塞。

## Review（已完成）
- 已完成：完成代码面排查，首页未发现显式 `scrollTo`，当前行为更可能由滚动位置恢复/残留 hash 触发。
- 已完成：新增 `scheduleHomeEntryScrollReset`（`src/react-app/routes/home-page.scroll.ts`），仅在 URL 无 hash 时于首页挂载后调度 `scrollTo({ top: 0 })`，避免进入首页被历史滚动位置拉到底部。
- 已完成：`HomePage` 接入该逻辑，并在 cleanup 中取消 `requestAnimationFrame`，保持副作用收敛。
- 已完成：补充 `home-page.test.tsx` 两个回归用例，覆盖“无 hash 重置顶部”与“有显式 hash 不强制重置”。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx`（通过，3 tests）
  - `pnpm run lint -- src/react-app/routes/home-page.tsx src/react-app/routes/home-page.scroll.ts src/react-app/routes/home-page.test.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` warning）

# 2026-04-17 ce:work /admin 首页关键板块可编辑化落地（进行中）

## 任务清单
- [x] 读取执行输入（`006` plan + project playbook + 相关实现文件）
- [x] Unit 1：扩展 content schema/service 契约（slogan/main video/character videos）与测试
- [x] Unit 2：实现 admin shared-config 镜像写入/发布与视频状态门禁（`ready + published`）及测试
- [x] Unit 3：扩展 `/admin` 编辑台三块新 section 交互（含排序、上限、错误提示）及测试
- [x] Unit 4：首页消费发布配置并移除固定 6 槽位依赖（含回归测试）
- [x] Unit 5：同步 architecture/runbook/playbook references 文档
- [x] 运行验证（目标测试 + `pnpm test` + `pnpm run lint` + `pnpm run build`）
- [x] 回填 Review（改动摘要、验证结果、风险与后续）

## 验收标准
- `/admin` 可编辑并发布 `home.hero_slogan`、`home.main_video`、`home.character_videos` 三块内容。
- 保存/发布阶段后端强制校验视频为 `ready + published`，非法配置被阻断并返回结构化错误。
- 首页首段与视频区由已发布配置驱动，角色视频列表改为动态数量与手动排序，不再依赖固定 6 槽位常量。
- 既有首页后半段内容顺序与行为不回归，`/api/content/videos` 与 `/api/admin/videos` 语义保持不变。

## Review（进行中）
- 已完成：读取并确认执行输入，当前分支 `feat/mvp` 命名有效且可直接继续开发。
- 已完成：建立本轮任务分解，按 Unit 1-5 与验证链路推进。
- 已完成：content 层新增 `home.hero_slogan`、`home.main_video`、`home.character_videos` 三个 section 契约，并将 `heroSlogan/featuredVideos` 聚合进 `getPublishedHomeContent` payload（保留 locale fallback 机制）。
- 已完成：补充 `content.schema.test.ts` 与 `content.service.test.ts` 新场景；执行 `pnpm test -- src/worker/modules/content/content.schema.test.ts src/worker/modules/content/content.service.test.ts` 通过。
- 已完成：admin 后端新增 shared section 双 locale 镜像 save/publish、发布前完整门禁（必填 + `ready + published`），并补 `admin.service.test.ts` 新场景覆盖。
- 已完成：`/admin` 编辑台新增 Slogan/核心视频/角色视频三块交互，接入 `/admin/videos` 候选筛选、角色手动排序、12 条上限、顶部汇总 + 字段级错误提示。
- 已完成：首页视频入口改为发布配置驱动：`home-featured-videos` 去固定 6 槽位常量，`home-page` 改读 `heroSlogan/featuredVideos` 并保留 Slogan fallback。
- 已完成：文档与 playbook references 同步更新：
  - `docs/core/technical-architecture.md`
  - `docs/runbooks/development-deployment-cicd-runbook.md`
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md`
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 已完成：验证命令
  - `pnpm test`（35 files / 138 tests 全通过）
  - `pnpm run lint`（通过；仅仓库既有 `worker-configuration.d.ts` 两条 warning）
  - `pnpm run build`（通过；Wrangler 仍有既有 `EPERM` 日志写入告警，不影响退出码）
- 已完成：根据用户反馈“新增 tab 点击无效”修复前端选中 key 回退逻辑（不再依赖后端已有 section），并新增 `admin-page.test.tsx` 回归用例锁定“缺少 revision 仍可编辑新 key”。

# 2026-04-17 ce:plan /admin 首页关键板块可编辑化（已完成）

## 任务清单
- [x] 读取执行输入（origin requirements + 当前 `/admin`/`/home` 代码基线 + project playbook）
- [x] 完成 planning 级研究（内容模型、admin 草稿/发布链路、视频状态模型、测试现状）
- [x] 收敛 deferred 决策（共享配置映射、角色列表上限、角色标签策略、发布错误反馈方式）
- [x] 产出实施计划文档（Implementation Units + 测试场景 + 风险与系统影响）
- [x] 回填 Review 与 handoff 选项

## 验收标准
- 计划文件落盘到 `docs/plans/2026-04-17-006-feat-admin-home-editable-slogan-videos-plan.md`。
- 计划覆盖 origin requirements 的 R1-R19，并给出 requirements trace。
- 每个 feature-bearing unit 均包含 repo-relative 文件与具体测试场景。
- 明确“共享配置 + 发布门禁 + 动态角色列表”的实现策略与风险缓解。

## Review（已完成）
- 已完成：识别现状中 `/admin` 仅支持 4 个 home section，Slogan/视频仍依赖静态配置文件。
- 已完成：确定本次不做数据库 schema 迁移，沿用 `cms_entries/cms_revisions` 模型扩展 entry key。
- 已完成：将“全站共用配置”技术策略收敛为 shared section 双 locale 镜像写入/发布。
- 已完成：新增实施计划文档 `docs/plans/2026-04-17-006-feat-admin-home-editable-slogan-videos-plan.md`，包含 5 个 implementation units、系统影响与风险矩阵。

# 2026-04-17 ce:work Stream 视频跨环境复用改造（已完成）

## 任务清单
- [x] 读取执行输入（requirements + `005` plan + project playbook）
- [x] Unit 1：后端导入 API 契约（`/api/admin/videos/import`）+ 控制器测试
- [x] Unit 2：导入服务与 Repository 幂等落库（先校验 Stream，再写 D1）+ service 测试
- [x] Unit 3：补导入/新上传行为日志字段（actionType/operator/env/streamVideoId）+ 测试
- [x] Unit 4：`/admin/videos` 新增“导入已有视频”入口与“新上传计费提示”+ 前端测试
- [x] Unit 5：文档同步（runbook + technical architecture）
- [x] 运行验证（目标测试）
- [x] 回填 Review（改动摘要、验证结果、风险与后续）

## 验收标准
- 新增 admin 导入接口，支持 `streamVideoId` 复用导入且受 admin 鉴权保护。
- 导入流程具备幂等：同环境重复导入同一 `streamVideoId` 不会重复创建记录。
- 导入前会校验 Stream 视频可达性；无效 ID 不落库。
- `/admin/videos` 提供导入入口并明确“新上传会新增 Stream 计费对象”。
- 现有发布门禁与公开视频链路不回归。

## Review（已完成）
- 已完成：确认执行输入与范围边界；当前分支 `feat/mvp` 可直接继续开发。
- 已完成：完成改造位点盘点（worker video module + admin videos page + api client + docs）。
- 已完成：新增后端导入契约 `POST /api/admin/videos/import`，接入 admin 鉴权、JSON 校验、结构化响应；控制器测试新增导入成功与非法 body 场景。
- 已完成：`VideoService#importExistingVideo` 与 `VideoRepository#findOrCreateImportedDraft` 落地“先 Stream 校验再幂等写入 D1”，并覆盖首次导入、重复导入、无效 Stream ID 不落库。
- 已完成：为 `issueUploadUrl` 与 `importExistingVideo` 增加 `video_action` 结构化日志字段（`actionType`、`streamVideoId`、`operator`、`env`、`reused`）。
- 已完成：`/admin/videos` 新增“导入已有 Stream 视频”表单；新增“新上传会创建新的 Stream 计费对象”提示；前端 API client 新增 `importAdminVideo`。
- 已完成：文档同步
  - `docs/runbooks/development-deployment-cicd-runbook.md`
  - `docs/core/technical-architecture.md`
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md`
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 已完成：验证命令
  - `pnpm test -- src/worker/index.test.ts src/worker/modules/video/admin-video.controller.test.ts src/worker/modules/video/video.service.test.ts src/react-app/lib/api.test.ts src/react-app/routes/admin-videos-page.test.tsx`
  - `pnpm test -- src/worker/modules/video/video.service.test.ts`
  - `pnpm run lint -- src/worker/modules/video/video.schema.ts src/worker/modules/video/admin-video.controller.ts src/worker/modules/video/admin-video.router.ts src/worker/modules/video/video.repository.ts src/worker/modules/video/video.service.ts src/worker/modules/video/admin-video.controller.test.ts src/worker/modules/video/video.service.test.ts src/worker/index.test.ts src/react-app/lib/api.ts src/react-app/lib/api.test.ts src/react-app/routes/admin-videos-page.tsx src/react-app/routes/admin-videos-page.test.tsx`
  - `pnpm run build`
- 已完成：两次测试运行均通过（Vitest 全量测试集通过，无新增失败）。
- 已完成：lint 通过；仅存在仓库既有 `worker-configuration.d.ts` 两条 warning。
- 已完成：build 通过；出现 Wrangler 既有 `EPERM` 日志文件告警（不影响退出码与构建产物）。

# 2026-04-17 ce:work 视频播放器 Poster Aura loading 升级（已完成）

## 任务清单
- [x] 读取执行输入（`004` 计划 + origin requirements + project playbook）
- [x] Unit 1：先改测试断言，再实现 `VideoPlayerModal` 的 Aura 零文案 loading 结构
- [x] Unit 2：补慢节奏动效与 reduced-motion 降级（`index.css` + modal 退场细节）
- [x] Unit 3：补三入口回归测试（含新增 `home-page.test.tsx`）
- [x] 运行验证（目标测试 + lint）
- [x] 回填 Review（改动摘要、验证结果、风险与后续）

## 验收标准
- loading 呈现 `Poster Aura` 视觉风格，且不出现 loading 文案与 spinner。
- loading 动效符合慢节奏基线，`prefers-reduced-motion` 下自动降级。
- `/videos`、`/admin/videos`、`/home` 三入口对统一 `VideoPlayerModal` 的复用行为不回归。

## Review（进行中）
- 已完成：确认本轮按 `docs/plans/2026-04-17-004-feat-video-player-poster-aura-loading-plan.md` 执行。
- 已完成：按 TDD 先更新 `video-player-modal.test.tsx` 断言，再执行测试确认红灯（缺少 Aura 标记且仍有旧文案）。
- 已完成：`video-player-modal.tsx` 落地 `Poster Aura` 分层（封面层/抽象氛围层/暗角柔光层），移除 loading 文案与 spinner 入口。
- 已完成：`index.css` 新增 `video-aura-breathe`、`video-aura-drift` 关键帧，并在 `prefers-reduced-motion` 下显式降级为静态。
- 已完成：新增 `src/react-app/routes/home-page.test.tsx`，补齐 `/home` 入口对统一 `VideoPlayerModal` 的回归覆盖。
- 已完成：验证命令
  - `pnpm test -- src/react-app/components/video/video-player-modal.test.tsx`（先红后绿）
  - `pnpm test -- src/react-app/components/video/video-player-modal.test.tsx src/react-app/routes/videos-page.test.tsx src/react-app/routes/admin-videos-page.test.tsx src/react-app/routes/home-page.test.tsx`
  - `pnpm run lint -- src/react-app/components/video/video-player-modal.tsx src/react-app/components/video/video-player-modal.test.tsx src/react-app/index.css src/react-app/routes/home-page.test.tsx`
- 已完成：测试全部通过；lint 无新增 error（存在仓库既有 `worker-configuration.d.ts` warning，且 CSS 文件被 eslint 忽略 warning）。
- 已完成：根据用户“仍无 loading 感知”反馈，追加中心动态 loading signal 与最短可见时长（420ms），并将覆盖层提升到更高层级防止被播放器内容遮挡。
- 已完成：根据用户“呼吸效果再明显一些”反馈，增强中心光核与双光环动画（更大振幅、更高亮度、更强层次感）。
- 已完成：根据用户“首帧卡住后才自动播放”反馈，移除强制最短停留逻辑；改为 `loadeddata` 保持 loading、`playing` 立即退场，消除首帧停顿感。

# 2026-04-17 ce:plan 视频播放器 Poster Aura loading 升级（进行中）

## 任务清单
- [x] 读取 origin requirements（含 R14-R19）与既有 `002` 计划基线
- [x] 完成本地代码研究并识别受影响入口（`/videos`、`/admin/videos`、`/home`）
- [x] 产出增量实施计划文档（`2026-04-17-004-*.md`）
- [x] 补齐 requirements trace、风险、测试场景与多入口一致性约束
- [x] 回填 Review 与 handoff 选项

## 验收标准
- 计划聚焦 loading 视觉升级，不扩展到后端或重型架构改造。
- 明确覆盖 `Poster Aura + 零文案 + 慢节奏 + reduced-motion` 的落地路径。
- 每个 feature-bearing unit 均包含 repo-relative 文件路径与具体测试场景。

## Review（进行中）
- 已完成：判定旧计划 `002` 为已执行基线，本次采用新建 `004` 增量计划避免历史混淆。
- 已完成：新增计划文档 `docs/plans/2026-04-17-004-feat-video-player-poster-aura-loading-plan.md`。
- 已完成：补充 `/home` 入口回归测试要求，确保三入口复用边界被测试锁定。
- 已完成：执行一轮计划质量自检（章节完整性、requirements trace、feature-bearing unit 测试场景），未发现阻塞级问题。

# 2026-04-17 ce:brainstorm 视频播放 loading 高级感升级（进行中）

## 任务清单
- [x] 复用并确认现有需求文档基线（`2026-04-17-video-playback-startup-ux-requirements.md`）
- [x] 与用户确认续写而非重开
- [x] 收敛“高级感 loading”视觉方向与优先级
- [x] 输出 2-3 个可落地方向并给出推荐
- [x] 更新需求文档并补充本次新增决策
- [x] 回填 Review 与 handoff 选项

## 验收标准
- 新增需求保持 scope 收敛：只增强播放 loading 体验，不扩展到后端或业务流程重构。
- 输出具备可执行性：含明确交互要求、视觉约束、移动端行为与成功标准。
- 方案兼容现有 `/videos` 与 `/admin/videos` 统一播放器实现。

## Review（进行中）
- 已完成：定位当前 loading 实现为“封面 + 黑色遮罩 + 文案”，高级感不足。
- 已完成：识别同主题 requirements 已存在，选择在原文档基础上迭代。
- 已完成：与用户收敛最终方向为 `Poster Aura + 零文案 + 慢节奏`。
- 已完成：更新 `docs/brainstorms/2026-04-17-video-playback-startup-ux-requirements.md`，新增 R14-R19 与对应成功标准、范围边界、关键决策。
- 已完成：按用户选择进入 `/ce:plan`，并生成 `004` 增量实施计划。

# 2026-04-17 ce:work 首页视频优先布局改造（已完成）

## 任务清单
- [x] 读取并确认执行输入（origin requirements + ce:plan + project playbook）
- [x] Unit 1：固定清单配置与视频映射模型（含测试）
- [x] Unit 2：首段纯文字 Slogan 与主视频区重构（含测试）
- [x] Unit 3：6 角色视频列表与沉浸弹窗接线（含测试）
- [x] Unit 4：首页组装收口与非目标板块回归保护（含测试）
- [x] 运行验证（目标测试 + `pnpm test` + `pnpm run lint`）
- [x] 回填 Review（改动摘要、验证结果、风险与后续）

## 验收标准
- 首页首段呈现“纯文字 Slogan + 主视频”，主视频满足自动静音循环与视口暂停策略。
- 主视频后固定展示 6 条角色视频入口，点击后沉浸弹窗播放。
- PC/Mobile 自适应布局稳定，无横向溢出；断点口径覆盖 390/768/1280。
- 非目标板块（理念、日思、故事、共学、知我、页脚）内容与顺序不回归。

## Review（已完成）
- 已完成：确认计划文件 `docs/plans/2026-04-17-003-feat-homepage-video-first-layout-plan.md` 为唯一执行输入，并开始按 Unit 顺序落地。
- 已完成：新增固定清单映射层 `src/react-app/routes/home/home-featured-videos.ts`，并补 `home-featured-videos.test.ts` 覆盖固定顺序、缺失回退、重复 ID 检测。
- 已完成：`hero-section.tsx` 重构为纯文字 Slogan；新增 `home-main-video-section.tsx` 落地主视频自动静音循环与视口暂停逻辑。
- 已完成：新增 `home-character-videos-section.tsx`，接入 6 角色视频列表、intent warmup 与沉浸弹窗播放。
- 已完成：`home-page.tsx` 接入 public videos query、首页视频编排与弹窗状态；`home-page.data.test.ts` 增加固定清单不变量断言。
- 已完成：i18n 新增 `homeVideo` 文案键（zh-CN/en-US）。
- 已完成：验证命令
  - `pnpm test -- src/react-app/routes/home/home-featured-videos.test.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx src/react-app/routes/home/sections/home-character-videos-section.test.tsx src/react-app/routes/home-page.data.test.ts`
  - `pnpm run lint`
- 已完成：测试通过；lint 仅保留仓库既有 `worker-configuration.d.ts` 两条 warning。

# 2026-04-17 本地视频状态卡在 processing 排查与修复（进行中）

## 任务清单
- [x] 读取 playbook/代码路径，定位“Cloudflare 已完成但本地仍 processing”的根因
- [x] 实现“刷新时批量同步处理中视频状态”并保持现有单条同步入口不变
- [x] 为新增同步辅助逻辑补测试
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（改动摘要、验证结果、风险与回滚点）

## 验收标准
- 点击“手动刷新”后，会先尝试同步当前处于 `processing` 的视频，再刷新列表。
- 本地开发（Webhook 不可达）场景下，无需逐条点“更多 -> 同步状态”也能批量推进状态。
- 保持现有 API 契约不变，不新增后端路由。

## Review（已完成）
- 已完成：根因定位为“列表刷新仅 refetch 本地 DB，不触发 `sync-status` 补偿；本地开发又无法稳定接收 Cloudflare webhook 回调”。
- 已完成：`/admin/videos` 的“手动刷新”升级为“批量同步处理中视频（最多 12 条）+ 刷新列表”，自动刷新阶段复用同一逻辑。
- 已完成：新增 `src/react-app/lib/video-sync.ts` 与 `src/react-app/lib/video-sync.test.ts`，覆盖处理中筛选与批量同步结果汇总。
- 已完成：验证命令
  - `pnpm test -- src/react-app/lib/video-sync.test.ts src/react-app/routes/admin-videos-page.test.tsx src/react-app/lib/api.test.ts`
  - `pnpm run lint -- src/react-app/routes/admin-videos-page.tsx src/react-app/lib/video-sync.ts src/react-app/lib/video-sync.test.ts`
  - `pnpm test -- src/react-app/lib/video-sync.test.ts src/react-app/routes/admin-videos-page.test.tsx`
- 已完成：所有命令通过；lint 仅剩仓库既有 `worker-configuration.d.ts` 两条 warning。

# 2026-04-17 ce:plan 首页视频优先布局改造（已完成）

## 任务清单
- [x] 读取 origin requirements 并继承关键决策与边界（主视频自动静音循环、角色视频弹窗播放、其余板块不变）
- [x] 完成本地代码与模式研究（首页 section 结构、公开视频查询、播放器弹窗复用能力）
- [x] 输出实施计划文档（Implementation Units + Test Scenarios + Risk + Impact）
- [x] 执行一轮文档审查式修正，消除范围越界与不必要改动项
- [x] 回填任务记录与 handoff 选项，准备进入 `/ce:work`

## 验收标准
- 计划文件落盘到 `docs/plans/2026-04-17-003-feat-homepage-video-first-layout-plan.md`。
- 计划覆盖 R1-R16，并给出明确 requirements trace。
- 每个 feature-bearing unit 均包含 repo-relative 文件清单与具体测试场景。
- 明确不变量：后端视频 API 不变、首页后半段板块不变。

## Review（已完成）
- 已完成：新增计划文档 `docs/plans/2026-04-17-003-feat-homepage-video-first-layout-plan.md`。
- 已完成：将实现拆分为 4 个 unit（固定清单映射、首段主视频区、角色视频列表接线、整页收口回归）。
- 已完成：补齐系统影响、风险缓解与断点验收口径（390/768/1280）。
- 已完成：文档审查中移除潜在越界项（不再要求修改 `stories-section`，不强制改动无关 query/modal 文件）。

# 2026-04-17 ce:brainstorm 首页视频化升级与高级感布局（已完成）

## 任务清单
- [x] 读取并确认输入（用户诉求 + `ce:brainstorm` + `design-taste-frontend` + 项目 playbook）
- [x] 扫描首页现状与可复用视频能力边界（`/api/content/home` + `/api/content/videos`）
- [x] 输出 2-3 个改版方案并完成推荐（含风险与适配场景）
- [x] 固化需求文档到 `docs/brainstorms/*-homepage-video-layout-upgrade-requirements.md`
- [x] 回填 Review 与 handoff 选项（进入 `ce:plan` 或继续补充）

## 验收标准
- 需求明确：顶部纯文字 Slogan、首屏主视频、6 个角色视频自适应列表、其余板块不变。
- 要求可执行：包含稳定需求编号、成功标准、范围边界、关键决策。
- 视觉约束明确：遵循高级感与移动端优先退化，不引入 AI 模板化布局。

## Review（已完成）
- 已完成：确认当前首页 Hero 为静态图文，故事区为 `home.stories` 三卡片；公开视频能力已存在于 `/api/content/videos`，可直接复用。
- 已完成：基于用户选择收敛为 Approach B（首屏“纯文字 Slogan + 全家福主视频”+ 6 角色视频独立列表），排除自动聚合与后台编排扩 scope 方案。
- 已完成：新增需求文档 `docs/brainstorms/2026-04-17-homepage-video-layout-upgrade-requirements.md`，固化 R1-R16、成功标准、范围边界与关键决策。
- 已完成：执行一轮 document-review 风格自审并自动修正歧义项（明确导航区不受 R1 约束、补充主视频可视高度基线、补充 390/768/1280 断点验收口径）。

# 2026-04-17 ce:work 视频首播黑屏性能与交互优化（进行中）

## 任务清单
- [x] 读取并确认执行输入（requirements + plan + playbook）
- [x] Unit 1：先补 `VideoPlayerModal` 启动/失败/重试测试，再实现非黑屏启动状态机
- [x] Unit 2：新增轻量预热基础设施（`index.html` 连接预热 + `video-player-warmup.ts`）
- [x] Unit 3：在 `/videos` 与 `/admin/videos` 接入意图预热并统一播放上下文传参
- [x] Unit 4：新增首播时序指标工具并在弹窗落点采集（冷/热启动可区分）
- [x] 运行验证（目标测试 + `pnpm test` + `pnpm run lint`）
- [x] 回填 Review（改动摘要、验证结果、风险与后续）

## 验收标准
- 点击播放后立即出现可理解的非黑屏反馈（封面或骨架 + 加载提示）。
- 播放失败可见可恢复错误态，支持重试。
- `/videos` 与 `/admin/videos` 复用同一弹窗行为并具备意图预热接线。
- 预热具备幂等与网络降级，不引入额外外部 telemetry。
- 本地时序指标覆盖 `click` / `loadeddata` / `playing` / `error`，可区分冷/热启动。

## Review（进行中）
- 已完成：执行前置确认（文档输入、分支 `feat/mvp`、playbook 基线）并开始按 Unit 落地。
- 已完成：`VideoPlayerModal` 引入启动状态机与非黑屏覆盖层，支持加载反馈、错误态与重试。
- 已完成：新增 `video-player-warmup`（SDK 空闲预加载 + 意图预热 + 弱网降级 + 幂等保护）并在 `/videos`、`/admin/videos` 接线。
- 已完成：新增 `video-playback-metrics`，在弹窗统一采集 `click/loadeddata/playing/error` 且区分冷/热启动。
- 已完成：新增/更新测试（modal、warmup、metrics、两页面回归）；`pnpm test` 与 `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。

# 2026-04-17 ce:brainstorm + ce:plan 视频首播黑屏性能与交互优化（已完成）

## 任务清单
- [x] 扫描现有播放链路与代码约束，确认黑屏触发点与可复用边界
- [x] 输出需求文档（Problem Frame、Requirements、Success Criteria、Scope）
- [x] 输出实施计划文档（Implementation Units、测试场景、风险与不变量）
- [x] 回填任务记录与交付路径，准备进入 `ce:work`

## 验收标准
- `docs/brainstorms` 新增本次主题 requirements 文档，且含稳定需求编号。
- `docs/plans` 新增本次主题 plan 文档，且含可执行 units 与测试场景。
- 方案明确“不改后端契约，仅优化前端播放启动体验与可观测性”。

## Review（已完成）
- 已完成：新增需求文档 `docs/brainstorms/2026-04-17-video-playback-startup-ux-requirements.md`。
- 已完成：新增计划文档 `docs/plans/2026-04-17-002-feat-video-playback-startup-performance-plan.md`。
- 已完成：方案收敛为“交互兜底 + 轻量预热 + 本地指标闭环”，并显式保留后端不变量。

# 2026-04-17 UI smoke 验证 admin 视频列表交互（已完成）

## 任务清单
- [x] 启动本地 `vite` 服务并验证 `/admin/videos` 可加载
- [x] 通过浏览器真实渲染执行桌面端交互 smoke（更多菜单、Esc 关闭、抽屉、冲突提示）
- [x] 通过浏览器真实渲染执行移动端交互 smoke（抽屉全宽覆盖样式）
- [x] 清理临时 smoke 验证文件，确保仓库无额外测试工件

## 验收标准
- 桌面端 smoke 输出 `SMOKE_PASS`。
- 移动端 smoke 输出 `SMOKE_PASS`。
- 验证覆盖：菜单打开/关闭、Esc、抽屉打开、刷新冲突提示、移动端抽屉宽度。
- 不引入新的仓库文件残留。

## Review（已完成）
- 已完成：桌面端截图证据 `/tmp/admin-videos-smoke-desktop.png`，状态标签显示 `SMOKE_PASS`。
- 已完成：移动端截图证据 `/tmp/admin-videos-smoke-mobile.png`，状态标签显示 `SMOKE_PASS`。
- 已完成：临时文件 `public/smoke-driver.html`、`public/smoke-sw.js` 已删除。

# 2026-04-17 ce:work 实现 admin 视频单列表工作面（已完成）

## 任务清单
- [x] Unit 1：`video-state.ts` 改为单列表排序与动作策略模型，并更新对应测试
- [x] Unit 2：`/admin/videos` 管理区从看板改为单列表，移除旧看板组件
- [x] Unit 3：新增“更多菜单 + 编辑抽屉”低频操作入口
- [x] Unit 4：收口页面编排，保留上传/自动刷新/发布门禁链路
- [x] 运行验证（lint + 目标测试）

## 验收标准
- `/admin/videos` 展示“视频列表”而非“状态看板”。
- 行内仅保留 `预览`、`发布/下线`，低频动作进入“更多”菜单。
- 编辑信息在抽屉完成，且编辑态不被轮询结果覆盖。
- 旧看板组件文件已下线，不再被引用。

## Review（已完成）
- 已完成：新增组件 `video-list.tsx`、`video-list-row.tsx`、`video-row-more-menu.tsx`、`video-edit-drawer.tsx`，并重写 `admin-videos-page.tsx` 数据流。
- 已完成：删除旧组件 `video-status-board.tsx`、`video-status-column.tsx`、`video-record-card.tsx`、`video-inline-preview.tsx`。
- 已完成：更新测试 `video-state.test.ts`、`admin-videos-page.test.tsx`，目标测试 7/7 通过。
- 已完成：`pnpm run lint` 通过（仅 `worker-configuration.d.ts` 既有 2 条 warning，无新增 error）。
- 已完成：修复 `src/react-app/lib/video-upload-task.test.ts` 中 `Array.prototype.at` 兼容性问题，`pnpm run build` 通过（存在既有 Wrangler `EPERM` 日志告警但 exit code=0）。

# 2026-04-17 ce:plan 细化菜单交互与移动端抽屉规范（已完成）

## 任务清单
- [x] 在现有计划中补充“更多菜单”交互细则（触发、关闭、危险动作规则）
- [x] 在现有计划中补充移动端抽屉行为规范（断点、关闭条件、滚动锁定）
- [x] 补充自动刷新与编辑态冲突处理规则
- [x] 将新增规则同步到 Unit 3/4 的测试场景与风险项

## 验收标准
- 计划文档包含可直接执行的菜单/抽屉交互规则，不再停留在“实现时再定”。
- Unit 3/4 测试场景覆盖键盘关闭、焦点回收、移动端展示、编辑冲突提示。
- 风险表新增可访问性回归风险与缓解策略。

## Review（已完成）
- 已完成：在 `docs/plans/2026-04-17-001-feat-admin-videos-single-list-workbench-plan.md` 新增 `Interaction Detail Addendum`，明确菜单/抽屉/刷新冲突规则。
- 已完成：将 “更多菜单键盘可达性” 从 Deferred 升级为已决策项，减少实现阶段二次决策成本。
- 已完成：同步补齐 Unit 3/4 的 Integration 级测试场景与风险项。

# 2026-04-17 ce:plan 视频管理页单页合并与列表化实施计划（已完成）

## 任务清单
- [x] 读取并继承 origin requirements（单页合并 + 列表化）
- [x] 完成本地代码模式研究并确认可复用组件/测试落点
- [x] 输出实施计划文档（Implementation Units + Test Scenarios + 风险）
- [x] 执行计划自审（需求追踪、范围边界、未决项）
- [x] 回填 Review 并给出 handoff 选项

## 验收标准
- 计划文档完整落盘到 `docs/plans/2026-04-17-001-*.md`。
- 计划明确替换“状态看板”为“视频列表行内状态”，并保留上传/发布核心链路。
- 每个 feature-bearing unit 均给出具体测试场景与测试文件路径。
- 计划明确未变更的后端权限与发布门禁不变量。

## Review（已完成）
- 已完成：继承 origin requirements，并将 R1-R18 全量映射到计划中的 Requirements Trace 与 Implementation Units。
- 已完成：本地研究聚焦 `admin-videos-page.tsx`、`video-state.ts`、上传状态机与现有测试基线，未发明不存在路径。
- 已完成：计划文件落盘 `docs/plans/2026-04-17-001-feat-admin-videos-single-list-workbench-plan.md`。
- 已完成：自审通过，计划明确了不变量（发布门禁/鉴权/API 契约不变）与 4 个可执行单元。

# 2026-04-17 视频管理页合并与列表化精简 brainstorm（已完成）

## 任务清单
- [x] 基于既有 requirements 文档完成“单页合并 + 列表化”方向改写
- [x] 固化用户已确认交互决策（精简行、主操作、更多菜单、默认排序）
- [x] 明确 scope boundary，删除无效交互与冗余展示
- [x] 进行文档审查并修正潜在矛盾
- [x] 回填 Review 并给出 handoff 选项

## 验收标准
- Requirements 明确要求 `/admin/videos` 仅保留一个主工作面，不再采用看板分列交互。
- 视频列表采用行内状态展示，保留核心链路（上传 -> 处理 -> 预览 -> 发布/下线）。
- 行内直接操作仅保留 `预览` 与 `发布/下线`，编辑信息/同步状态/删除草稿进入“更多”或抽屉。
- 默认排序为“最近更新时间倒序”。

## Review（已完成）
- 已完成：基于既有文档改写为“单页合并 + 列表化”版本，文件路径保持不变，避免产生重复文档。
- 已完成：固化用户决策：精简行、行内仅 `预览` 与 `发布/下线`、其他动作进“更多”菜单、编辑在抽屉、默认更新时间倒序。
- 已完成：删除“看板分列”导向需求，改为“行内状态展示 + 单列表扫读”导向，范围更收敛。
- 已完成：执行一轮手动文档审查（替代子代理 `document-review`），未发现阻塞级冲突；保留 3 条 planning 阶段技术待定项。

# 2026-04-16 修复 Stream webhook 验签并补充配置指引（进行中）

## 任务清单
- [x] 对齐 Cloudflare Stream `Webhook-Signature` 验签协议（`time` + `sig1`）
- [x] 更新相关测试（helper/service/controller）
- [x] 同步 playbook current-state 中的 webhook 头部事实
- [x] 运行最小验证（`pnpm test` + `pnpm run lint`）
- [x] 输出 webhook 配置与 `STREAM_WEBHOOK_SECRET` 获取步骤

## 验收标准
- Worker 使用 `Webhook-Signature` 头进行验签，旧自定义头不再作为事实口径。
- 验签采用 `${time}.${rawBody}` HMAC SHA-256，支持 `sig1` 比对与时间窗口校验。
- 测试通过并给出可执行配置命令。

## Review（进行中）
- 已完成：确认当前实现仍使用自定义头 `x-illumi-stream-signature`，需要修正。
- 已完成：`stream-webhook.ts` 改为 Cloudflare 官方 `Webhook-Signature`，验签逻辑改为 `${time}.${rawBody}` + `sig1` 比对，并新增 300s 时间窗口校验。
- 已完成：相关测试通过（`stream-webhook.test.ts`、`video.service.test.ts`、`stream-webhook.controller.test.ts`）。
- 已完成：`current-state.md` webhook 事实口径同步到 `Webhook-Signature`。
- 已完成：`pnpm run lint`（0 error，2 既有 warning）。
- 已完成：`pnpm test` 通过（24 files, 84 tests）。
- 已完成：定位上传报错 `10005` 根因为 Stream direct_upload 强制要求 `maxDurationSeconds`；已在 `stream-client.ts` 增加默认值 `3600` 并验证官方 API 返回 200。

# 2026-04-16 上传失败自动清理草稿/僵尸记录（进行中）

## 任务清单
- [x] 新增后端清理接口：删除本地草稿并清理 Stream 端占位视频
- [x] 前端上传失败时自动调用清理接口（best effort）
- [x] 前端新增手动“Delete Draft”按钮（仅草稿可用）
- [x] 增补 API/Service/Controller 测试覆盖上传失败清理链路
- [x] 运行验证（`pnpm test` + `pnpm run lint`）

## 验收标准
- 上传失败后，不保留本地草稿脏数据。
- 能自动尝试清理 Stream 端对应视频占位记录。
- 失败清理不影响用户拿到明确错误信息。

## Review（进行中）
- 已完成：确认当前上传失败路径只有报错提示，没有自动清理逻辑。
- 已完成：新增 `DELETE /api/admin/videos/:videoId`，后端在草稿态下执行“本地删除 + Stream 远端删除尝试（404 视为已删除）”。
- 已完成：前端上传失败时自动触发草稿清理 API，清理失败仅警告不覆盖原始错误提示。
- 已完成：`/admin/videos` 操作区新增 `Delete Draft`，仅 `publishStatus=draft` 可点击，支持二次确认。
- 已完成：测试通过（`video.service.test.ts` 新增 3 条 cleanup 场景，`admin-video.controller.test.ts`/`api.test.ts` 新增清理接口用例）。
- 已完成：`pnpm test`（24 files, 90 tests）与 `pnpm run lint`（0 errors，2 既有 warnings）通过。

# 2026-04-16 将视频实施计划转换为 Ralph prd.json（ralph-codex）

## 任务清单
- [x] 解析 `docs/plans/2026-04-15-002-feat-video-upload-playback-capability-plan.md` 的 Implementation Units 与依赖顺序
- [x] 生成符合 Ralph 格式的 `userStories`（按依赖排序、每条可单轮迭代）
- [x] 写入 `scripts/ralph/prd.json` 并替换默认模板内容
- [x] 校验 JSON 结构与故事优先级顺序
- [x] 回填 Review 与验收结果

## 验收标准
- `scripts/ralph/prd.json` 的 `project`、`branchName`、`description`、`userStories` 字段完整。
- `userStories` 覆盖视频计划核心单元（Unit 1-7），并按依赖顺序编排优先级。
- 每条 story 具备可验证验收项，包含 `Typecheck passes`。

## Review（已完成）
- 已完成：读取计划文档并提取 Unit 1-7 目标、依赖、测试场景与验证口径。
- 已完成：将 Unit 1-7 映射为 `scripts/ralph/prd.json` 的 8 条 `userStories`（将体量较大的 Unit 6 拆分为 API 契约与 UI 交付两条故事）。
- 已完成：设置 `project=illumi-family-mvp`、`branchName=ralph/video-upload-playback-capability`，并按依赖链设置 `priority=1..8`。
- 已完成：使用 `jq` 校验 JSON 与验收字段（stories 数量=8，全部包含 `Typecheck passes`）。

# 2026-04-16 ce:work 执行视频上传与播放能力计划（进行中）

## 任务清单
- [x] 读取并确认执行计划：`docs/plans/2026-04-15-002-feat-video-upload-playback-capability-plan.md`
- [x] Unit 1：视频领域 schema + bindings（migration/schema/type）
- [x] Unit 2：Stream client + admin upload-url API
- [x] Unit 3：Stream webhook 入站与状态回写
- [x] Unit 4：admin 视频生命周期 API（list/edit/publish/unpublish/sync）
- [x] Unit 5：公开视频列表 API + 缓存契约
- [x] Unit 6：前端 admin 视频管理页 + 公网播放页 + 播放弹窗
- [x] Unit 7：架构/runbook/playbook 文档同步
- [x] 运行测试与质量门禁（至少 `pnpm test`）
- [x] 回填 Review（变更文件、验证结果、风险与回滚点）

## 验收标准
- 后端形成上传签发 -> webhook 回写 -> 发布门禁 -> 公网列表的可测试闭环。
- 前端形成后台管理与公网播放的可演示路径（含失败态与空态）。
- 文档与 playbook 引用与实现保持一致，不产生架构漂移。

## Review（进行中）
- 已完成：读取 `ce:work` 与项目 playbook，确认执行基线与文档同步规则。
- 已完成：锁定执行输入为视频能力计划文档（2026-04-15-002）。
- 已完成：Unit 1（新增 `0004_stream_video_assets.sql`、`video_assets` schema、Stream bindings 字段、状态 schema 基线），并通过 `video.test.ts`。
- 已完成：Unit 2-5 后端落地（Stream client + webhook 校验、video 模块 admin/public/webhook 路由、发布门禁与缓存失效），并新增 `video/*.test.ts` 覆盖服务与控制器行为。
- 已完成：Unit 6 前端落地（`/admin/videos` 管理页、`/videos` 公网列表页、`VideoPlayerModal` + `@cloudflare/stream-react`、API client/query options 扩展、路由接入）。
- 已完成：Unit 7 文档同步（`docs/core/technical-architecture.md`、`docs/runbooks/development-deployment-cicd-runbook.md`、playbook references `current-state.md` 与 `workflows.md`）。
- 验证结果：
  - `pnpm run lint` 通过（仅 `worker-configuration.d.ts` 既有 warning，无新增 error）。
  - `pnpm test` 通过（24 files, 83 tests）。
  - `pnpm run check:dev` 通过（dry-run 绑定校验通过）。
  - `pnpm run check:prod` 通过（构建 + dry-run 通过；Wrangler 日志写入存在 `EPERM` 提示但 exit code=0）。
  - `pnpm run build` 通过（存在 Wrangler 日志写入 `EPERM` 提示，但构建与打包成功，exit code=0）。

# 2026-04-16 在当前项目安装 Ralph（ralph-codex）

## 任务清单
- [x] 确认 `ralph-codex` 安装脚本与目标仓库路径
- [x] 执行安装脚本并初始化 `scripts/ralph/prd.json`
- [x] 校验安装产物完整性（`ralph.sh`/`CODEX.md`/`prd.json.example`/`prd.json`）
- [x] 回填 Review 与验收结果

## 验收标准
- 仓库内新增 `scripts/ralph/` 目录与 Ralph 运行模板文件。
- `scripts/ralph/prd.json` 已初始化，可直接编辑 project/branchName/userStories。
- 安装命令在当前仓库根目录可复现，且不依赖手工拷贝文件。

## Review（已完成）
- 已完成：确认技能脚本存在于 `~/.codex/skills/ralph-codex/scripts/install_ralph_codex.sh`。
- 已完成：在仓库根目录执行 `bash /Users/luoguangcong/.codex/skills/ralph-codex/scripts/install_ralph_codex.sh --init-prd`，命令返回 `Done.`。
- 已完成：校验 `scripts/ralph/ralph.sh`（可执行）、`scripts/ralph/CODEX.md`、`scripts/ralph/prd.json.example`、`scripts/ralph/prd.json` 已生成。

# 2026-04-15 视频上传与播放技术架构 brainstorm（进行中）

## 任务清单
- [x] 核对当前项目能力边界（现有 CMS 资产链路、内容模型、前端展示结构）
- [x] 与用户一问一答收敛关键产品与架构决策（上传来源、播放形态、发布策略）
- [x] 输出 2-3 套可落地架构方案对比并给出推荐
- [x] 生成 requirements 文档（`docs/brainstorms/*-requirements.md`）
- [x] 运行文档审查并回填结论
- [ ] 输出 handoff 选项（是否进入 `/ce:plan`）

## 验收标准
- 方案对比至少覆盖：存储/播放链路、改造范围、复杂度、成本、风险与回滚点。
- Requirements 文档包含：Problem Frame、Requirements（稳定 ID）、Scope、Success Criteria。
- 推荐方案与当前仓库事实一致（Worker+R2+D1+CMS 分层），不引入未验证前提。

## Review（进行中）
- 已完成：仓库扫描，确认当前仅支持图片资产上传与回源（`/api/admin/assets/upload` + `/api/content/assets/:assetId`），尚无视频上传、转码、播放专用链路。
- 已完成：关键方向收敛（Cloudflare Stream、公开播放、`@cloudflare/stream-react`、前端直传 Stream）。
- 范围调整：按用户指示移除 stories 集成讨论，本阶段仅输出“通用视频上传与播放能力层”架构。
- 已完成：视频域发布与状态策略收敛（草稿/发布、仅 `ready` 可发布、自动回填+可编辑）。
- 已完成：requirements 文档落盘 `docs/brainstorms/2026-04-15-video-upload-playback-architecture-requirements.md`。
- 已完成：文档审查修正（状态模型拆分、webhook 校验要求显式化）。

# 2026-04-15 视频能力层实施计划 ce:plan（已完成）

## 任务清单
- [x] 读取 requirements 文档并继承问题框架、范围边界与决策
- [x] 基于当前仓库模式形成实现分解（Worker/D1/React/Docs）
- [x] 生成实施计划文档（含实现单元、测试场景、风险与依赖）
- [x] 完成计划自审加固（测试落点与依赖顺序一致性）

## 验收标准
- 计划文件使用 repo-relative 路径并包含可执行 implementation units。
- 每个 feature-bearing unit 均有明确 test scenarios 与 test file 路径。
- 计划覆盖 origin requirements（R1-R17）且不越界到 stories 业务集成。

## Review（已完成）
- 计划文档：`docs/plans/2026-04-15-002-feat-video-upload-playback-capability-plan.md`
- 关键设计：Cloudflare Stream 直传、webhook + 手动补偿、`ready` 发布门禁、公开列表 + 弹窗播放。
- 加固修正：补齐前端页面测试文件与 Unit 1 独立 schema 测试，消除实现顺序冲突。

# 2026-04-15 SEO 技术架构 ce:plan（实施计划生成）

## 任务清单
- [x] 读取 origin requirements 并完成需求追踪映射
- [x] 完成本地上下文研究（代码模式、架构边界、已有缓存与发布机制）
- [x] 生成实施计划文档（含实现单元、依赖顺序、测试场景、风险与回滚）
- [x] 执行置信度加固（补充成功指标与路由白名单约束）
- [x] 完成文档审查并合并自动修正
- [ ] 输出 post-generation 选项（是否进入 `/ce:work`）

## 验收标准
- 计划文档采用仓库规范命名并写入 `docs/plans/`。
- 每个 feature-bearing unit 都包含明确测试场景与测试文件路径。
- 计划保持“只定义 HOW，不实现代码”的边界。
- 已标注 origin、范围边界、开放问题与延后事项。

## Review（进行中）
- 已生成：`docs/plans/2026-04-15-001-feat-seo-technical-architecture-plan.md`。
- 已加固：新增 `Success Metrics`，并明确 worker-first 精确路径白名单策略。
- 进行中：等待用户选择下一步（`/ce:work` 或继续审阅）。

# 2026-04-15 SEO 技术架构 brainstorm（方案对比与落盘）

## 任务清单
- [x] 基于仓库现状整理 3 套 SEO 技术架构方案（最小改造/混合渲染/全量 SSR）
- [x] 明确推荐方案、分阶段改造路径、风险与回滚点
- [x] 生成 requirements 文档（`docs/brainstorms/*-requirements.md`）
- [x] 运行文档审查并回填结论
- [ ] 输出 handoff 选项（是否进入 `/ce:plan`）

## 验收标准
- 方案对比覆盖：改造幅度、SEO 上限、复杂度、风险、回滚。
- Requirements 文档包含：Problem Frame、Requirements（稳定 ID）、Scope、Success Criteria。
- 推荐方案不依赖“内容选题”，仅基于技术架构决策。

## Review（进行中）
- 已完成：仓库现状核对（SPA 架构、Worker 路由边界、SEO 基础能力缺口）。
- 已完成：`docs/brainstorms/2026-04-15-seo-technical-architecture-requirements.md` 落盘（含 13 条稳定需求 ID）。
- 已完成：文档审查 1 轮（补充 `Alternatives Considered` 对比表，未发现阻塞级问题）。
- 进行中：handoff 选项确认。

# 2026-03-18 docs 目录梳理与版本纳管策略校准

## 任务清单
- [x] 盘点 `docs/` 目录文件并完成分类（`core/runbooks/plans/research/notes`）
- [x] 校验当前 `git` 跟踪与忽略状态，确认实际纳管边界
- [x] 修正 `docs` policy 不一致项（`docs/README.md` 与 `.gitignore` 路径）
- [x] 明确“应纳管/不应纳管/条件纳管”标准并落盘
- [x] 完成自检并回填 Review

## 验收标准
- `docs` 规则与实际文件路径一致，不存在失效白名单路径。
- `core/runbooks/README` 纳入版本管理；`plans/research/notes/tmp` 默认忽略。
- 每类文档是否纳管有明确结论与可执行判定规则。

## Review（已完成）
- 盘点结果：
  - 当前 `docs` 文件共 23 个，分布为 `core(2)`、`runbooks(2)`、`plans(14)`、`research(2)`、`notes(1)`、`README(1)`。
- 规则修正：
  - `docs/README.md` 中失效路径 `docs/better-auth-secret-runbook.md` 已更正为 `docs/runbooks/better-auth-secret-runbook.md`。
  - `.gitignore` 中同一失效白名单已删除，避免“规则可读但无效”的歧义。
  - 补充了“条件纳管”判定规则：仅当临时文档沉淀为稳定契约/流程并校验通过后，迁移到 `docs/core` 或 `docs/runbooks`。
- 自检结论：
  - `git ls-files docs` 仅包含 `docs/README.md`、`docs/core/**`、`docs/runbooks/**`。
  - `git check-ignore` 验证 `docs/plans/**`、`docs/research/**`、`docs/notes/**` 均为 ignored。
  - `docs` 目录当前纳管边界与文档策略一致。

# 2026-03-18 GitHub+分支 CI/CD 方案设计（两分支版）

## 任务清单
- [x] 探索项目上下文（现有 runbook、架构文档、脚本、提交历史）
- [x] 澄清核心约束（审批强度、OIDC、分支模型）
- [x] 根据用户纠正收敛为 `dev/main` 两分支模型（不使用 `release/*` 长期分支）
- [x] 输出 2-3 套可落地方案并给出推荐（结合大厂成熟实践）
- [x] 分章节确认设计（分支策略、CI/CD 流程、安全治理、发布回滚）
- [x] 落盘设计文档到 `docs/plans/2026-03-18-cicd-github-branch-design.md`
- [x] 调用 writing-plans 生成实施计划

## 验收标准
- 方案与仓库现状一致（Cloudflare `dev/prod`、现有 `pnpm` 脚本、无现成 workflows）。
- 明确回答“`release` 与 `main` 的关系”并给出是否需要 `release` 的决策依据。
- 给出可执行的 GitHub Actions 触发矩阵、分支保护、审批门禁与 OIDC 权限边界。

## Review（已完成）
- 设计结论：
  - 用户最终选择两分支模型：`dev/main`，不使用 `release/*`。
  - `dev` 自动部署；`prod` 仅通过 `workflow_dispatch` 手动触发。
- 关键产出：
  - 设计文档：`docs/plans/2026-03-18-cicd-github-branch-design.md`
  - 实施计划：`docs/plans/2026-03-18-cicd-github-branch-implementation-plan.md`
- 事实校验：
  - 基于官方文档补充了 `workflow_dispatch`、branch protection、environment reviewers、Cloudflare GitHub Actions 认证路径约束。

# 2026-03-18 文档纳管与重分类

## 任务清单
- [x] 调整 `.gitignore`：默认忽略 docs，仅白名单纳管核心文档
- [x] 重组 `docs` 目录结构并迁移文件（core/runbooks/research/notes/plans）
- [x] 更新文档内部引用，确保 runbook 与架构文档链接有效
- [x] 自检 git 跟踪状态，确认仅核心文档进入版本管理

## 验收标准
- 核心文档（架构、运行规范、关键 runbook）可被 git 跟踪。
- `docs/plans`、`docs/research`、`docs/notes` 默认不纳管。
- 文档引用路径无断链。

## Review（已完成）
- 规则变更：
  - `.gitignore` 从“忽略整个 docs”改为“忽略 docs 默认 + 白名单纳管核心文档”。
- 目录归类：
  - 新增 `docs/core/`、`docs/research/`、`docs/notes/`、`docs/runbooks/`。
  - `docs/biz-background.md` -> `docs/core/biz-background.md`。
  - `docs/seo-ssr-roadmap.md` -> `docs/research/seo-ssr-roadmap.md`。
  - `docs/seo-title-description-options.md` -> `docs/research/seo-title-description-options.md`。
  - `docs/官网设计想法.md` -> `docs/notes/官网设计想法.md`。
- 规范索引：
  - 新增 `docs/README.md`，定义 tracked 与 ignored 的文档边界。
- 自检结论：
  - `git status --untracked-files=all` 仅显示核心文档（`technical-architecture`、`development-deployment-cicd-runbook`、`better-auth-secret-runbook`、`core/biz-background`、`docs/README`）。
  - `git check-ignore` 验证 `plans/research/notes` 已被忽略，核心文档按白名单放行。

# 2026-03-18 修复 dev 内容服务并补齐开发部署规范

## 任务清单
- [x] 定位并修复 dev 环境“内容服务不可用”问题（D1 schema 与代码不一致）
- [x] 执行并验证 dev 远程数据库迁移（`0003_calm_ling.sql`）
- [x] 新增一份覆盖本地/dev/prod 的开发与部署规范文档（含 CI/CD、参数变更、数据库迁移、回滚）
- [x] 同步更新架构文档与 playbook 引用文档，避免文档漂移
- [x] 启动子代理审查新规范文档并按审查意见补齐

## 验收标准
- `dev` 环境 `/api/content/home?locale=zh-CN` 返回 `200`，不再触发前端 fallback 提示。
- 规范文档可支持“人类接手 + AI 代理执行”两类场景，包含完整的流程、门禁、回滚和检查清单。
- 文档与仓库事实一致（脚本、wrangler 绑定、迁移流程、环境区分）。

## Review（已完成）
- 问题修复：
  - 根因：`dev` 远程 D1 未应用 `0003_calm_ling.sql`，导致 `cms_entries.locale` 缺列。
  - 处理：执行 `pnpm run db:migrate:dev`，并验证 `migrations list --remote` 为 `No migrations to apply`。
  - 结果：`https://dev.illumi-family.com/api/content/home?locale=zh-CN` 返回 `HTTP 200`。
- 新增/更新文档：
  - 新增 `docs/development-deployment-cicd-runbook.md`（本地/dev/prod + 手动 CI/CD + 参数变更 + 迁移 + 回滚 + AI 协议）
  - 更新 `docs/technical-architecture.md`（v1.1.0，补齐 i18n Phase1/2 与 runbook 入口）
  - 更新 `.codex/skills/illumi-family-project-playbook/references/current-state.md`
  - 更新 `.codex/skills/illumi-family-project-playbook/references/workflows.md`
- 子代理审查：
  - 第一轮发现 5 个覆盖缺口，已全部修复。
  - 复审结论：`✅ 文档审查通过`。

# 2026-03-18 Task 1 质量评审修复（子代理）

## 任务清单
- [x] 统一 locale 解析规则（`parseLocaleFromLangParam` 与 `normalizeLocale` 一致支持 `en-*`/`zh-*`）
- [x] 抽离 `AppLocale` 单一来源（`src/react-app/i18n/types.ts`），消除 API 与 i18n 重复定义及跨层耦合
- [x] 补测试：locale 区域别名、`setLangQuery`/`setLocaleCookie` 副作用、home query key locale 分片
- [x] 修复 `home-page.tsx` `md~lg` 语言切换入口重复显示
- [x] 运行相关测试与检查并通过

## Review（已完成）
- 关键修复：
  - `?lang=en-GB`、`?lang=zh-HK` 与 cookie 中同类值可正确归一化到 canonical locale。
  - `AppLocale` 统一由 `i18n/types.ts` 提供，`home-page.data.ts` 不再依赖 API 层类型。
  - 语言切换副作用（URL query + cookie）和 query key 分片行为已有单测覆盖。
  - 首页语言切换器在 `md~lg` 仅保留一个入口。

# 2026-03-18 Task 1 子代理：Phase 1 前端 i18n 基线

## 任务清单
- [ ] RED：补充 i18n detector / locale 解析与 `getHomeContent(locale)` 请求参数测试，并先验证失败
- [ ] 引入 `i18next + react-i18next` 并建立 `src/react-app/i18n/{config,detector,provider,format}.ts(x)`
- [ ] 新增消息字典目录：`messages/{zh-CN,en-US}/{common,home,auth,users,admin}.json`
- [ ] 页面接入：`home-page.tsx` / `home-page.data.ts` / `auth-page.tsx` / `users-page.tsx` / `root-layout.tsx`
- [ ] 语言切换控件：切换时写 `illumi_locale` cookie 并更新 URL `?lang=zh|en`
- [ ] `getHomeContent` 请求透传 locale（Phase 2 预留）
- [ ] 使用 `format.ts` 在真实页面完成日期/数字格式化接入（至少 users 页面时间字段）
- [ ] 运行受影响测试并通过
- [ ] 回填 Review（变更文件、测试结果、`git diff --stat`）

## 验收标准
- 检测优先级满足：`query(lang) > cookie(illumi_locale) > navigator.language > zh-CN`。
- 页面可切换中英，刷新后可保持语言状态。
- 前端请求 `/api/content/home` 带上 locale 参数。
- 至少一个真实页面使用 `format.ts` 输出日期/数字。
- 新增/更新单测覆盖 detector 或 locale 解析与 API locale 参数。

# 2026-03-18 执行 i18n Phase1 + Phase2（subagent-driven-development）

## 任务清单
- [x] Task 1（Phase 1）：落地前端 i18n 基线（query/cookie 检测、i18next provider、语言切换、首页/认证/用户/壳层文案字典化、日期数字格式化基线）
- [x] Task 1 Review A：规格符合性评审（实现是否严格满足 Phase 1）
- [x] Task 1 Review B：代码质量评审（可维护性、边界处理、测试充分性）
- [x] Task 2（Phase 2）：落地 API + D1 + KV 国际化（locale schema/migration、内容 fallback、按 locale 缓存与失效矩阵、admin locale 写入/发布链路、前端 API/admin locale 接入）
- [x] Task 2 Review A：规格符合性评审（实现是否严格满足 Phase 2）
- [x] Task 2 Review B：代码质量评审（可维护性、边界处理、测试充分性）
- [x] 自动化测试：运行并通过 `pnpm test` 与 `pnpm run check`
- [x] 回填 Review：记录变更文件、关键实现、测试结果

## 验收标准
- Phase 1：`?lang` / `illumi_locale` 生效，刷新后保持；关键页面文案可切换中英；日期/数字格式化可按 locale 输出。
- Phase 2：`GET /api/content/home?locale=` 返回 locale 与 fallback 信息；D1 按 `(entry_key, locale)` 唯一；发布缓存失效符合矩阵；admin 保存/发布显式携带 locale。
- 自动化测试：`pnpm test`、`pnpm run check` 均通过。

## Review（已完成）
- 关键交付：
  - Phase 1：新增 `src/react-app/i18n/**`（detector/config/provider/format/messages）、页面接入（home/auth/users/root-layout）、语言切换写入 cookie 与 `?lang`、`getHomeContent(locale)` 透传。
  - Phase 2：新增迁移 `drizzle/migrations/0003_calm_ling.sql` 与 worker locale 工具，完成 content/admin locale 改造、fallback + `fallbackFrom`、按 locale 缓存 key 与发布失效矩阵、admin locale 切换与请求透传。
  - 通过子代理流程完成两阶段评审：Task 1/Task 2 均执行“规格评审 -> 代码质量评审 -> 修复 -> 复审”，最终 `Final review passed`。
- 自动化测试：
  - `pnpm test`：通过（16 files, 55 tests）。
  - `pnpm run check`：通过（`tsc + vite build + wrangler --dry-run`；存在 sandbox 下 wrangler 日志 `EPERM` 告警但命令 exit code 为 0）。

# 2026-03-18 i18n 架构方案评审意见回填

## 任务清单
- [x] 提取外部 review 的确认项与补充项，并映射到原文档章节
- [x] 更新 `docs/plans/2026-03-17-i18n-architecture-plan.md` 的 Phase 1/2/3 执行细节
- [x] 将第 10 节从“待确认”改为“评审结论（已确认）”
- [x] 自检文档结构与风险清单一致性

## 验收标准
- 文档显式体现 10.1/10.2/10.3 三项“已确认”结论。
- 文档补齐 fallback 口径、Admin locale 编辑、日期数字格式化、静态资源国际化四个缺口。
- 风险章节与执行章节口径一致，不出现冲突描述。

## Review（已完成）
- 变更文件：
  - `docs/plans/2026-03-17-i18n-architecture-plan.md`
  - `tasks/todo.md`
- 关键更新：
  - Phase 1 明确 `i18next + react-i18next` 与日期/数字格式化基线。
  - Phase 2 明确“条目级回退 + 结构校验”并新增 Admin 多语言编辑约束。
  - 新增静态资源国际化策略，补齐带文字图片的 locale 管理口径。
  - 第 10 节改为评审结论，三项确认结论已落盘。

# 2026-03-17 中英多语言方案修订（可执行落地版）

## 任务清单
- [x] 基于现有代码核对发布链路、缓存行为与 schema 约束
- [x] 将 i18n 方案修订为可执行版（补充执行命令、迁移步骤、验证清单、回滚策略）
- [x] 明确缓存失效矩阵与 fallback 一致性规则
- [x] 明确 `query/cookie -> path-based` 升级条件与操作步骤
- [x] 更新 lessons（记录“文档需落到可执行粒度”的纠正模式）
- [x] 回填 review 与最小校验结果

## 验收标准
- 文档包含可执行步骤（命令/SQL草案/验收口径），可直接作为实施蓝图。
- 风险、回滚点、分环境执行顺序明确，避免上线临场决策。
- 与当前代码事实一致，不出现无法在现有架构执行的动作描述。

## Review（已完成）
- 变更文件：
  - `docs/plans/2026-03-17-i18n-architecture-plan.md`（重写为可执行 runbook 版本）
  - `tasks/lessons.md`（新增 2026-03-17 纠正模式）
  - `tasks/todo.md`（任务追踪与 review）
- 关键修订：
  - 补齐了可执行细节：`D1 迁移 SQL 草案`、`分环境执行命令`、`阶段验收清单`、`回滚动作`。
  - 明确了缓存失效矩阵：发布 `zh-CN` 时同时失效 `zh/en`，发布 `en-US` 时只失效 `en`。
  - 修正了能力边界：在当前 `run_worker_first=/api/*` 下，Phase 3 不承诺边缘 301，先采用客户端跳转。
- 最小校验：
  - 已核对文档与代码事实一致（发布链路、缓存 key、索引约束）。
  - 已校对文档包含可直接执行的命令与验证步骤。

# 2026-03-17 中英多语言切换技术架构规划

## 任务清单
- [x] 梳理当前前端文案分布、路由结构与 API 返回契约，明确 i18n 改造边界
- [x] 形成中英双语技术方案（至少两种选型 + 推荐方案 + 风险与回滚）
- [x] 输出落地实施路线图（Phase 1-3）与验收标准（功能/SEO/性能）
- [x] 同步更新主架构文档并建立与详细方案文档的链接
- [x] 回填 review（变更文件、关键决策、最小校验结果）

## 验收标准
- 文档明确当前事实、方案对比、推荐结论，不依赖口头说明即可评审。
- 方案覆盖中英切换的 URL 策略、字典组织、SSR/SEO、缓存与发布流程。
- 给出分阶段执行路径与可回滚点，便于后续按步骤实施。

## Review（已完成）
- 变更文件：
  - `docs/plans/2026-03-17-i18n-architecture-plan.md`（新增）
  - `docs/technical-architecture.md`（更新：补充 i18n 规划入口与变更记录）
  - `tasks/todo.md`（更新：任务追踪与 review）
- 关键决策：
  - 对比 3 种方案后，推荐“渐进式方案”：先 `query/cookie`，再升级 `URL 前缀 + API locale + CMS locale 发布`（方案 B）。
  - URL 规范在 Phase 2 收敛为“中文默认 `/`，英文 `/en`”，兼顾改造风险与 SEO 可发现性。
  - 多语言内容按 locale 分片缓存（KV key 增加 `:locale` 后缀），避免全量缓存抖动。
- 最小校验：
  - 已校验新增规划文档可读、章节完整（现状/方案对比/推荐/路线图/回滚）。
  - 已校验主架构文档存在指向规划文档的明确入口。

# 2026-03-17 下载第二个 X 视频（1961005850887164079）

## 任务清单
- [x] 使用已安装 `twitter-media-downloader` 能力下载 `https://x.com/influxy_ai/status/1961005850887164079`
- [x] 校验文件落地并输出文件信息（路径、大小、编码、时长）

## 验收标准
- 目标帖子视频下载成功并保存在本地。
- 提供可直接访问的绝对路径与基础元信息。

## Review（已完成）
- 下载命令：`gallery-dl --cookies-from-browser chrome ... https://x.com/influxy_ai/status/1961005850887164079`
- 下载成功文件（原始落地）：
  - `/Users/luoguangcong/code/illumi-family/illumi-family-mvp/downloads/twitter-media/twitter/influxy_ai/twitter_None_1961005850887164079_1.mp4`
- 为便于统一访问，额外复制到：
  - `/Users/luoguangcong/code/illumi-family/illumi-family-mvp/downloads/twitter-media/1961005850887164079_1.mp4`
- 文件信息：
  - 大小：`7.3M`（`7622123` bytes）
  - 编码/分辨率/时长：`h264` / `1280x694` / `61.60s`
  - SHA256：`cd7117a9d6beef9cdc7a9d28725d65331f742bce423bd35d30fc0a37c4bdca3b`

# 2026-03-17 安装 twitter-media-downloader skill 并下载 X 视频

## 任务清单
- [x] 使用 `skill-installer` 将 `bossjones/boss-skills@twitter-media-downloader` 安装到 `~/.codex/skills`
- [x] 读取已安装 skill 的用法并执行指定 X 帖子视频下载
- [x] 校验视频文件已落地（路径、文件大小、格式）
- [x] 回填 review（安装命令、下载命令、结果路径）

## 验收标准
- `~/.codex/skills/twitter-media-downloader` 存在且包含 `SKILL.md`。
- 指定链接 `https://x.com/influxy_ai/status/1948684652249841963` 对应视频已成功下载到本地。
- 可提供明确的本地文件路径与基本文件信息。

## Review（已完成）
- 安装结果：
  - 目标 skill 已安装到 `~/.codex/skills/twitter-media-downloader`。
  - `SKILL.md`、`scripts/download.py` 均存在。
  - 备注：`skill-installer` 官方脚本在本机环境遇到 TLS 与 git fallback 临时目录问题，已按同等目录结构手动完成安装。
- 下载执行：
  - 先执行 skill 脚本（游客模式）返回 `Unavailable`。
  - 再执行 skill 脚本（`--browser chrome`）可访问帖子，但该脚本 JSON 模式未返回文件路径。
  - 使用 skill 底层工具 `gallery-dl --cookies-from-browser chrome` 成功下载视频文件。
- 下载产物：
  - 文件：`/Users/luoguangcong/code/illumi-family/illumi-family-mvp/downloads/twitter-media/1948684652249841963_1.mp4`
  - 大小：`4.8M`（`4985005` bytes）
  - 编码/分辨率/时长：`h264` / `640x374` / `116.47s`
  - SHA256：`9afef7b89bf323d44fc010fb39751309e8c652bb3fcfbf8846b383f443d2f388`

# 2026-03-16 部署到 dev 与 main(prod)

## 任务清单
- [x] 按 playbook 执行 dev 部署前检查（`pnpm run check`）
- [x] 部署 dev（`pnpm run deploy:dev`）
- [x] 执行 dev 健康检查（自定义域名 + workers.dev）
- [x] 按 playbook 执行 prod 部署前检查（`pnpm run check:prod`）
- [x] 部署 prod/main（`pnpm run deploy:prod`）
- [x] 执行 prod 健康检查（自定义域名 + workers.dev）
- [x] 回填 review（命令、版本号、健康检查结果）

## 验收标准
- dev 与 prod 部署命令均成功退出。
- `dev` 健康检查返回 `appEnv=dev`。
- `prod` 健康检查返回 `appEnv=prod`。

## Review（已完成）
- 执行结果（2026-03-16）：
  - `pnpm run check`：通过（`dev` dry-run 成功）。
  - `pnpm run deploy:dev`：通过；Version ID `eac806fa-bfff-4305-9469-d08b7c802a61`。
  - `pnpm run check:prod`：通过（`prod` dry-run 成功）。
  - `pnpm run deploy:prod`：通过；Version ID `add197e2-8b74-4111-817b-658167548619`。
- 健康检查：
  - `https://dev.illumi-family.com/api/health` -> `HTTP 200`，`appEnv=dev`。
  - `https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health` -> `HTTP 200`，`appEnv=dev`。
  - `https://illumi-family.com/api/health` -> `HTTP 200`，`appEnv=prod`。
  - `https://illumi-family-mvp.lguangcong0712.workers.dev/api/health` -> `HTTP 200`，`appEnv=prod`。

# 2026-03-16 首页 Hero 大图高度自适应

## 任务清单
- [x] 确认首页大图实现位置与当前高度策略
- [x] 将 Hero 区块从固定视口最小高度改为内容驱动的高度自适应
- [x] 运行最小验证，确保改动不引入语法/构建问题
- [x] 回填 review（变更文件与验证结果）

## 验收标准
- 首页首屏大图不再依赖固定 `78svh` 高度。
- Hero 区块高度可随内容与不同终端宽度自适应变化。
- 页面结构与现有文案、按钮、遮罩视觉保持一致。

## Review（已完成）
- 变更文件：
  - `src/react-app/routes/home/sections/hero-section.tsx`
  - `tasks/todo.md`
- 实现说明：
  - 删除 Hero 外层 section 的 `min-h-[78svh]`，不再锁定首屏最小高度。
  - 删除 Hero 内容层的 `min-h-[78svh]`，改为由文本与按钮自然撑开高度。
  - 保留背景图、遮罩层、文案结构和 CTA，不改视觉层级与交互语义。
- 验证结果：
  - `pnpm exec eslint src/react-app/routes/home/sections/hero-section.tsx` 通过（exit code 0）。

# 2026-03-06 全局 Skills 总览文档沉淀任务

## 任务清单
- [x] 盘点 `~/.codex/skills` 当前已安装 skill，并提取 name/description
- [x] 在 `docs` 目录新增全局 skills 速查文档（含“做什么 / 什么时候用”）
- [x] 在文档中补充“一目了然”的快速决策树
- [x] 回填 review（文件清单与校验结果）

## 验收标准
- 文档位于 `docs` 目录，便于团队直接查阅。
- 覆盖当前全局已安装 skills，且每个 skill 都有“用途 + 适用场景”说明。
- 文档包含快速路由/决策指引，能支持快速选型。

## Review（已完成）
- 变更文件：
  - 新增全局文档 `/Users/luoguangcong/.codex/skills/global-skills-guide.md`（全局 skills 决策树 + 分组清单）。
  - 删除项目内副本 `docs/global-skills-guide.md`（避免与全局文档重复）。
  - 更新 `tasks/todo.md`（记录本次计划、验收标准与 review）。
- 文档结果：
  - 速查文档已沉淀为一页式手册，包含“10 秒选型”与“按场景分组”的全量说明。
  - 文档内已覆盖当前全局 skill 列表，并补齐 `taste-skill`。
- 校验结果：
  - 覆盖校验命令结果：`actual 48 / listed 48 / missing 0`。
  - 文档路径：`/Users/luoguangcong/.codex/skills/global-skills-guide.md`。

# 2026-03-06 BETTER_AUTH_SECRET 本地缺失修复（按 runbook 落地）

## 任务清单
- [x] 阅读 `docs/better-auth-secret-runbook.md` 并核对当前仓库配置差异
- [x] 新增本地变量模板（`.dev.vars.example`）并准备 `.dev.vars.dev` 占位
- [x] 优化 `Missing BETTER_AUTH_SECRET` 报错，给出本地/远端可执行指引
- [x] 增加对应单测并执行最小验证
- [x] 回填 review（变更文件、验证结果、用户待执行项）

## 验收标准
- 本地缺失 `BETTER_AUTH_SECRET` 时，报错信息包含 `.dev.vars.dev` 指引。
- 仓库包含可复制的 `.dev.vars` 模板，不包含真实 secret。
- 相关测试通过，且不引入新 lint/test 回归。

## Review（已完成）
- 变更文件：
  - 更新 `docs/better-auth-secret-runbook.md`（补充模板复制步骤，验证接口改为 `/api/auth/get-session`）。
  - 新增 `.dev.vars.example`（本地变量模板）。
  - 更新 `src/worker/shared/auth/better-auth.ts`（缺失 `BETTER_AUTH_SECRET` / `BETTER_AUTH_BASE_URL` 的可操作报错）。
  - 更新 `src/worker/shared/auth/better-auth.hosts.test.ts`（新增缺 secret 报错测试）。
  - 更新 `README.md`（本地启动前先准备 `.dev.vars.dev`）。
- 本地占位文件：
  - 已创建 `.dev.vars.dev`，当前为占位值，未写入真实 secret。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/worker/shared/auth/better-auth.hosts.test.ts` 通过（3/3）。
  - `pnpm exec eslint src/worker/shared/auth/better-auth.ts src/worker/shared/auth/better-auth.hosts.test.ts` 通过。
  - `pnpm dev` 本地联调通过（Vite 自动切到 `http://localhost:5173`）：
    - `GET /api/health` -> `200`（`appEnv=dev`）
    - `GET /api/auth/get-session` -> `200` + `null`（未登录预期）
- 用户待执行：
  - 在 `.dev.vars.dev` 中填写真实 `BETTER_AUTH_SECRET`。
  - 启动 `pnpm dev` 并验证 `/api/health` 与 `/api/auth/session`。

# 2026-03-06 dev + prod 双环境部署任务

## 任务清单
- [x] 执行 `dev` 部署前检查（`pnpm run check`）
- [x] 执行 `dev` 部署（`pnpm run deploy:dev`）
- [x] 执行 `prod` 部署前检查（`pnpm run check:prod`）
- [x] 执行 `prod` 部署（`pnpm run deploy:prod`）
- [x] 执行四个健康检查（dev/prod 自定义域名 + workers.dev）
- [x] 回填 review（版本号与健康检查结果）

## 验收标准
- `dev` 与 `prod` 部署命令均成功退出。
- 两套环境 `/api/health` 均返回 `HTTP 200`。
- `dev` 返回 `appEnv=dev`，`prod` 返回 `appEnv=prod`。

## Review（已完成）
- 执行结果（2026-03-06）：
  - `pnpm run check`：通过（`dev` dry-run OK，含既有 Wrangler `EPERM` 日志告警）。
  - `pnpm run deploy:dev`：通过；Version ID `5f6c4a15-7f8a-4084-92c0-eb8500e61917`。
  - `pnpm run check:prod`：通过（`prod` dry-run OK，变量为 prod 套）。
  - `pnpm run deploy:prod`：通过；Version ID `57dce332-f238-43f7-8d96-c297eab8af31`。
- 健康检查（全部 `HTTP/2 200`）：
  - `https://dev.illumi-family.com/api/health` -> `appEnv=dev`
  - `https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health` -> `appEnv=dev`
  - `https://illumi-family.com/api/health` -> `appEnv=prod`
  - `https://illumi-family-mvp.lguangcong0712.workers.dev/api/health` -> `appEnv=prod`

# 2026-03-06 prod 环境恢复部署任务（保留 prod 变量）

## 任务清单
- [x] 记录用户纠正：prod 必须保留自己的变量
- [x] 执行标准 prod dry-run（不带变量覆盖）确认目标变量
- [x] 执行标准 prod 重新部署（不带变量覆盖）恢复配置
- [x] 执行 prod 部署后 smoke check（`/api/health`）
- [x] 回填 review（命令、版本号、验证结果）

## 验收标准
- dry-run 成功显示 prod 资源绑定且变量为 prod 配置值。
- 正式恢复部署成功并返回新版本 ID。
- `https://illumi-family.com/api/health` 返回 `HTTP 200`。

## Review（已完成）
- 用户纠正后已停止“测试变量覆盖”策略，改为标准 prod 恢复流程。
- 恢复验证：
  - `pnpm run check:prod`：通过，dry-run 显示
    - `APP_ENV=prod`
    - `BETTER_AUTH_BASE_URL=https://illumi-family.com`
  - `pnpm run deploy:prod`：恢复部署成功。
  - 当前恢复后版本：`b795a362-714a-4ea7-b313-e034f5a88d8f`
- 过程记录（便于追踪）：
  - 误覆盖时部署版本：`24dd5b1b-bb53-4fe4-a6cb-455fe6facddd`
  - 恢复后部署版本：`b795a362-714a-4ea7-b313-e034f5a88d8f`
- Smoke check（恢复后）：
  - `curl -s -i https://illumi-family.com/api/health` -> `HTTP/2 200`，`appEnv=prod`
  - `curl -s -i https://illumi-family-mvp.lguangcong0712.workers.dev/api/health` -> `HTTP/2 200`，`appEnv=prod`

# 2026-03-06 dev 环境部署任务

## 任务清单
- [x] 读取 playbook 与部署工作流，确认 `dev` 命令与验收口径
- [x] 执行部署前检查（`pnpm run check`）
- [x] 执行 `dev` 部署（`pnpm run deploy:dev`）
- [x] 执行部署后 smoke check（至少 `/api/health`）
- [x] 回填 review 结果（含命令与关键输出）

## 验收标准
- `pnpm run check` 成功通过（包含 `--env dev` 干跑）。
- `pnpm run deploy:dev` 成功返回部署结果。
- `https://dev.illumi-family.com/api/health` 返回健康响应。

## Review（已完成）
- 参考基线：
  - 已按 `illumi-family-project-playbook` 的 deployment workflow 执行 `check -> deploy -> smoke check`。
- 执行结果（2026-03-06）：
  - `pnpm run check`：通过（退出码 `0`）；出现 Wrangler 已知日志写入 `EPERM` 告警，不影响命令成功。
  - `pnpm run deploy:dev`：通过，发布 Worker `illumi-family-mvp-dev`。
  - 发布地址：
    - `https://illumi-family-mvp-dev.lguangcong0712.workers.dev`
    - `https://dev.illumi-family.com`
  - Version ID：`bf1813f4-ec34-451e-bb89-833b63f4e842`
  - Smoke check：
    - `curl -s -i https://dev.illumi-family.com/api/health` -> `HTTP/2 200`，`appEnv=dev`。
    - `curl -s -i https://illumi-family-mvp-dev.lguangcong0712.workers.dev/api/health` -> `HTTP/2 200`，`appEnv=dev`。

# 2026-03-05 官网改造实施任务（按官方设计实现规划）

## 任务清单
- [x] 读取并审阅 `docs/plans/2026-03-05-official-website-design-implementation-plan.md`
- [x] Phase 0：梳理 `docs/官网设计想法.md` 文案并重建 `home-page.data.ts` 数据模型
- [x] Phase 1：在 `index.css` 落地新中式纸感视觉 token、字体与 reduced-motion 基线
- [x] Phase 2：按 `routes/home/sections` + `routes/home/components` 拆分首页结构，`home-page.tsx` 仅做组装
- [x] Phase 3：完成锚点导航、故事状态（`published/coming_soon`）与交互态（hover/focus）统一
- [x] Phase 4：补齐可访问性细节（alt、ARIA、焦点可见）并完成桌面/移动端回归
- [x] 运行验证：`pnpm run lint`、`pnpm run build`、`pnpm test`

## 验收标准
- Hero 首屏完整呈现家庭 IP 主视觉、双 Slogan 与简介文案。
- “理念 / 日思 / 故事 / 共学 / About / Footer” 六大文案块均与规划映射一致。
- 组件结构符合规划：`home-page.tsx` 仅组合，文案集中在 `home-page.data.ts`。
- 页面在桌面和移动端无明显溢出、遮挡、错位，且 `prefers-reduced-motion` 生效。
- 不使用 emoji 作为功能图标，统一采用 `lucide-react`。

## Review（已完成）
- 结构与实现：
  - 首页已按规划拆分为 `routes/home/sections` 与 `routes/home/components`，`home-page.tsx` 仅保留组装逻辑。
  - `home-page.data.ts` 已重建为“导航 + Hero + 理念 + 日思 + 故事 + 共学 + About + Footer”数据驱动结构。
  - 新增故事状态徽标与 `published/coming_soon` 交互分支，移动端快捷锚点导航已保留。
- 视觉系统：
  - `index.css` 已落地规划中的品牌色 token（宣纸暖白/墨黑/原木棕/浅金）与纸感背景纹理。
  - 字体切换为“`LXGW WenKai TC` + `Noto Sans SC`”，并保留 reduced-motion 降级规则。
- 可访问性与语义：
  - Hero/About 图片已补齐语义化 `alt`。
  - 焦点态统一由全局 `focus-visible` 与按钮/链接样式承接。
  - 根布局已改为首页隐藏系统导航，避免主页重复 header 与重复主内容锚点冲突。
- 验证结果：
  - `pnpm run lint`：通过（仅 `worker-configuration.d.ts` 既有 2 条 warning）。
  - `pnpm run build`：通过（存在 Wrangler 日志目录 `EPERM` 既有告警，不影响退出码）。
  - `pnpm test`：通过（7 files / 19 tests），新增 `home-page.data.test.ts` 用于首页数据结构约束。
- 风险与后续：
  - 当前故事“已上线”链接仍为占位锚点，需替换为真实动画链接。
  - Hero/About 目前复用同一张家庭 IP 图，待你提供最终主理人头像后可细化区分。

# 2026-03-05 登录/注册 UIUX 高级化重构任务（鉴权流程）

## 任务清单
- [x] 对当前登录/注册页面做 UI 问题盘点与设计方向确认（参考 Clerk/Figma 质感）
- [x] 基于 `ui-ux-pro-max` 建立视觉规范（配色、排版、动效、反馈态、移动端）
- [x] 重构 `auth-page` 结构与样式，保留原有鉴权行为（邮箱登录/注册、Google、验证邮件、退出）
- [x] 补充可访问性细节（`aria-live`、错误/成功态可感知、键盘焦点可见）
- [x] 运行最小验证（类型/构建），确认改动不破坏现有流程

## 验收标准
- 登录/注册页面具备明显高质感（层次、间距、对比、组件状态）且非模板化观感。
- 桌面与移动端都可正常使用，不出现布局错位或交互遮挡。
- 原有鉴权关键动作仍可触发：`signIn.email`、`signUp.email`、`signIn.social`、`sendVerificationEmail`、`signOut`。
- 错误与提示信息具备可访问播报语义。

## Review（已完成）
- 设计与实现：
  - 页面由单卡片改为双栏布局（品牌信息侧栏 + 鉴权主卡片），并支持移动端单栏折叠。
  - 视觉风格采用“高对比中性色 + 蓝色强调 + 轻玻璃层次 + 柔和渐变背景”，对齐现代登录流程质感。
  - 登录/注册切换改为分段控件，增强路径清晰度与当前态识别。
- 行为保持：
  - 保留并复用原有鉴权动作：`signUp.email`、`signIn.email`、`signIn.social`、`sendVerificationEmail`、`signOut`。
  - 新增输入预校验（注册姓名非空、重发验证前邮箱非空），降低无效请求。
- 可访问性：
  - 消息区域增加 `aria-live`，错误使用 `role="alert"`、成功使用 `role="status"`。
  - 维持清晰焦点态与足够文本对比度。
- 验证结果：
  - `pnpm run build` 通过（存在 Wrangler 日志目录 `EPERM` 历史告警，不影响构建退出码）。
  - `pnpm exec eslint src/react-app/routes/auth-page.tsx` 通过。

# 2026-03-05 鉴权域名配置收敛任务（仅配置，不部署 prod）

## 任务清单
- [x] 将 prod `BETTER_AUTH_BASE_URL` 更新为 `https://illumi-family.com`
- [x] 在 `wrangler.json` 写回 `dev/prod` custom domain `routes`
- [x] 同步技术文档与 playbook 事实映射（URL 与 smoke check）
- [x] 执行最小验证（配置解析 + dev dry-run），明确未部署 prod

## 验收标准
- `wrangler.json` 顶层 `BETTER_AUTH_BASE_URL` 已使用 prod 自定义域名。
- `wrangler.json` 顶层与 `env.dev` 均存在 `custom_domain` 路由配置。
- `docs/technical-architecture.md` 与 playbook references 已同步新事实。
- 不执行 `deploy:prod`，只做本地/干跑验证。

## Review（已完成）
- 配置改动：
  - `wrangler.json` 顶层 `BETTER_AUTH_BASE_URL` 已改为 `https://illumi-family.com`。
  - 新增顶层 `routes`：`illumi-family.com`（`custom_domain: true`）。
  - 新增 `env.dev.routes`：`dev.illumi-family.com`（`custom_domain: true`）。
- 文档同步：
  - 已同步 `docs/technical-architecture.md`（版本升至 `v0.9.2`，更新 URL/route 事实）。
  - 已同步 playbook references：`current-state.md`、`workflows.md`。
- 验证结果：
  - `node -e "JSON.parse(...)"` -> `wrangler.json parse ok`。
  - `pnpm run check:dev` -> 成功（`--dry-run`，未部署 prod）。
- 边界确认：
  - 本轮未执行 `pnpm run deploy:prod`，也未变更 prod secret。

# 2026-03-05 登录鉴权环境变量与自定义域名全局检查任务

## 任务清单
- [x] 盘点登录鉴权相关配置来源（`wrangler.json` + 代码读取点）
- [x] 核对 `dev/prod` 环境区分方式与是否需要两套参数
- [x] 线上验证 `dev.illumi-family.com` / `illumi-family.com` 健康与鉴权关键端点
- [x] 输出差异、风险与修正建议（本轮只检查，不改线上配置）

## 验收标准
- 明确回答：`better-auth` / `resend` / `google` 是否应为 `dev/prod` 两套参数。
- 明确指出：当前仓库配置中 `dev/prod` 哪些变量已分离、哪些仍需修正。
- 对两个自定义域名给出可用性检查结果（至少 `/api/health`、`/api/auth/ok`）。
- 结论附带可执行的下一步修正建议。

## Review（已完成）
- 配置现状：
  - `wrangler.json` 使用顶层 `prod` + `env.dev` 区分环境，D1/KV/R2 已为两套独立资源。
  - 鉴权相关非密钥变量在 `vars` 中：`APP_ENV`、`API_VERSION`、`BETTER_AUTH_BASE_URL`、`RESEND_FROM_EMAIL`。
  - 鉴权密钥变量在代码侧必需/可选：`BETTER_AUTH_SECRET`（必需）、`GOOGLE_CLIENT_ID/SECRET`（可选但启用 Google 时必需）、`RESEND_API_KEY`（发邮件时必需）。
- 关键差异：
  - `dev` 的 `BETTER_AUTH_BASE_URL` 已指向自定义域 `https://dev.illumi-family.com`。
  - `prod` 的 `BETTER_AUTH_BASE_URL` 仍是 `workers.dev`，未切到 `https://illumi-family.com`。
  - `wrangler.json` 未声明 `routes` / `env.dev.routes`，当前自定义域名更像是 Dashboard 手工绑定，存在 IaC 漂移风险。
- 线上检查（2026-03-05）：
  - `https://dev.illumi-family.com/api/health` -> 200，`appEnv=dev`。
  - `https://illumi-family.com/api/health` -> 200，`appEnv=prod`。
  - `https://dev.illumi-family.com/api/auth/ok` -> 200（鉴权路由在线）。
  - `https://illumi-family.com/api/auth/ok` -> 404（prod 当前未暴露同等鉴权路由行为）。
- 结论：
  - 环境分层框架是正确的，但 prod 鉴权域名与鉴权路由发布状态仍不一致，需单独修正后再做 Google OAuth/邮件链路验收。

# 2026-03-05 微信视频号接入网站调研任务（直链优先）

## 任务清单
- [x] 核对当前站点“旧视频号内容”模块现状与可接入点
- [x] 调研微信视频号在站外网页展示的官方能力边界（小程序/网页）
- [x] 输出 3 种可执行方案（直链跳转、半自动同步、抓流地址）
- [x] 给出推荐方案、风险、实施步骤与回滚点
- [x] 回填 review，明确本轮仅调研不改业务代码

## 验收标准
- 明确回答“是否能在当前网站直接内嵌播放视频号视频”。
- 明确回答“是否建议直接抓视频流链接（mp4）”。
- 至少提供 2 种替代路径，并给出推荐结论与风险说明。
- 方案与当前仓库结构一致（前端 `legacyVideoItems` 区块可对接）。

## Review（已完成）
- 现状核对：
  - 当前首页已存在“旧视频号内容”卡片区块，但 `LegacyVideoItem` 尚无外链字段，按钮未接跳转。
  - 直接接入点位于 `src/react-app/routes/home-page.data.ts` 与 `src/react-app/routes/home-page.tsx`。
- 调研结论：
  - 微信官方开放能力聚焦在“小程序内打开视频号内容/直播”，未提供面向外部 H5 网站的通用嵌入播放器能力。
  - `channel-video` 组件能力在生态文档支持矩阵中仅覆盖微信小程序，不覆盖 H5。
  - “直接抓流媒体 URL”可行性与稳定性、合规风险都较差，不建议作为主路径。
- 推荐路径：
  - MVP 采用“视频号链接归档 + 网站卡片跳转微信内打开”，不上传视频文件。
  - 如需站内播放体验，建议中期走“自有视频资产（R2/第三方视频云）+ 合规复用”。
- 本轮产出边界：仅输出调研与实施建议，不修改业务代码与部署配置。

---

# 2026-03-05 域名治理规划任务（illumi-family.com）

## 任务清单
- [x] 基于当前架构梳理域名约束与目标（prod/dev、单 Worker）
- [x] 输出主站/API/Admin/CMS 推荐子域名矩阵与命名规范
- [x] 输出 DNS、SSL、WAF、Access、CORS/Cookie 策略
- [x] 设计分阶段落地与回滚方案（先低风险、后隔离）
- [x] 在 `docs/plans` 产出计划文档并回填 review

## 验收标准
- 有明确的 `prod/dev` 子域名映射表，并包含主站/API/Admin/CMS。
- 明确给出“当前单 Worker 架构”的推荐落地方式，不与现状冲突。
- 包含 Cloudflare 侧执行步骤、验证方法、风险与回滚点。
- 本轮仅输出计划文档，不修改运行配置。

## Review（已完成）
- 文档产物：`docs/plans/2026-03-05-domain-management-plan.md`。
- 推荐结论：采用“方案 B（子域治理 + 单 Worker 复用）”，先建立域名边界，再按流量和安全需求渐进拆分服务。
- 子域名规划：覆盖 `prod/dev` 的主站/API/Admin/CMS，并保留 `workers.dev` 作为回滚与应急入口。
- 内容覆盖：方案对比、Cloudflare 落地阶段、DNS/TLS/Access/WAF/CORS/Cookie 基线、验证与回滚清单。

---

# 2026-03-04 技术架构文档任务

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 在 `docs` 目录编写技术架构文档（React + Vite + Hono + Cloudflare Workers）
- [x] 校验文档与当前仓库配置一致（代码与配置逐项核对）
- [x] 输出 review 结论并收尾

## 验收标准
- 文档文件位于 `docs` 目录，结构清晰，可直接作为后续配置演进的基线文档。
- 文档内容与当前仓库真实状态一致，不虚构未存在的模块或流程。
- 包含后续维护规则，便于后续每次配置调整时同步更新。

## Review（已完成）
- 文档产物：`docs/technical-architecture.md`。
- 一致性核对：已对照 `package.json`、`wrangler.json`、`src/worker/index.ts`、`src/react-app/App.tsx`。
- 验证命令：`npm run build` 执行成功，产物生成正常。
- 备注：构建期间 Wrangler 尝试写入 `~/Library/Preferences/.wrangler` 日志目录时出现 `EPERM` 告警，但未影响退出码与构建结果。

---

# 2026-03-04 SEO/SSR 架构评估文档任务

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 阅读 `README.md` 与 `docs/technical-architecture.md`，补充关键配置事实核对
- [x] 新建独立文档，输出 SEO 能力评估与 SSR 可行性结论
- [x] 给出分阶段演进方案（当前可做、改造后可做）与风险清单
- [x] 回填 review 结果并完成一致性自检

## 验收标准
- 新文档与原技术架构文档解耦，单独可读。
- 结论明确回答“当前能否 SSR、未来如何做 SEO”，且基于仓库真实配置。
- 方案包含可执行步骤，不要求本次改代码。

## Review（已完成）
- 文档产物：`docs/seo-ssr-roadmap.md`。
- 结论摘要：当前为 CSR SPA，当前不具备 SSR；通过补齐 SSR 入口、构建链路与 Worker HTML 路由可实现 SSR；推荐“基础 SEO -> 公开页 SSG -> 动态页按需 SSR”三阶段演进。
- 一致性核对：已对照 `README.md`、`docs/technical-architecture.md`、`wrangler.json`、`src/worker/index.ts`、`package.json`。
- 核对命令：`rg -n 'not_found_handling|single-page-application|assets|main' wrangler.json && rg -n 'app.get\\(\"/api/\"' src/worker/index.ts && rg -n '\"build\": \"tsc -b && vite build\"' package.json`。

---

# 2026-03-04 Base UI + shadcn/ui + Tailwind v4 配置任务

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 安装 Tailwind CSS v4 与 Base UI / shadcn 所需依赖
- [x] 配置 Vite 与 TypeScript alias（`@ -> src/react-app`）
- [x] 配置 `components.json` 与 shadcn 基础文件（`cn`、`Button`）
- [x] 更新示例页面验证组件可用
- [x] 运行构建校验并更新技术架构文档

## 验收标准
- 项目可使用 Tailwind v4 utility class。
- 项目具备 shadcn/ui 基础设施（`components.json` + `@/` alias + `cn` + 基础组件）。
- 项目已接入 Base UI 依赖，并有至少一个可运行示例。
- `npm run build` 通过。
- `docs/technical-architecture.md` 同步记录本次架构配置变化。

## Review（已完成）
- 依赖安装：`tailwindcss`、`@tailwindcss/vite`、`@base-ui/react`、`class-variance-authority`、`clsx`、`tailwind-merge`、`lucide-react`、`tw-animate-css`。
- 配置变更：
  - `vite.config.ts`：新增 Tailwind v4 插件与 `@ -> src/react-app` alias。
  - `tsconfig.json` / `tsconfig.app.json`：新增 `@/*` 路径映射。
  - `components.json`：新增 shadcn 配置文件。
  - `src/react-app/index.css`：切换为 Tailwind v4 + shadcn token 体系。
  - `src/react-app/lib/utils.ts` 与 `src/react-app/components/ui/button.tsx`：新增基础组件能力。
  - `src/react-app/App.tsx`：新增 shadcn Button 与 Base UI Switch 可运行示例。
- 构建验证：`npm run build` 成功通过。
- 备注：构建过程中 Wrangler 仍有 `~/Library/Preferences/.wrangler` 日志目录 `EPERM` 告警，不影响产物生成与退出码。

---

# 2026-03-04 后端能力（Cloudflare + Drizzle）设计文档任务

## 任务清单
- [x] 创建任务计划并定义“先文档后执行”的边界
- [x] 核对当前仓库基线（Worker、Wrangler、目录结构）
- [x] 核对 Cloudflare / Drizzle 官方语法要点（env、bindings、migrations）
- [x] 输出详细实施文档（环境分层 + D1/KV/R2 + Drizzle + API 分层 + 绑定步骤）
- [x] 回填 review 结论并标记“等待用户确认后执行”

## 验收标准
- 文档位于 `docs/plans`，可直接作为后续实施依据。
- 清晰覆盖 `dev/staging/prod`、D1/KV/R2、Drizzle、API 分层。
- 包含可复制命令与 Cloudflare 资源绑定步骤。
- 明确本轮不改实现代码，待用户确认后再执行。

## Review（已完成）
- 文档产物：`docs/plans/2026-03-04-backend-foundation-design.md`。
- 关键内容：提供方案对比与推荐、目录分层、Wrangler 环境配置草案、数据层职责、Drizzle 迁移流、Cloudflare 资源创建/绑定命令、实施分阶段计划。
- 事实核对来源：
  - 本仓库：`wrangler.json`、`src/worker/index.ts`、`worker-configuration.d.ts`。
  - 本地工具：`wrangler@4.56.0 --help` 命令输出。
  - 官方文档：Cloudflare Workers/D1、Drizzle ORM 文档。
- 状态：文档阶段完成，等待用户确认后进入实施阶段。

---

# 2026-03-04 shadcn 组件扩展示例任务

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 新增 shadcn 风格基础组件（`card`、`input`、`label`、`textarea`、`badge`）
- [x] 用新增组件重写 `App.tsx` 为可交互示例
- [x] 运行 `lint/build` 校验并记录结果

## 验收标准
- `src/react-app/components/ui` 下新增多份 shadcn 风格组件文件并可被引用。
- `App.tsx` 中实际使用新增组件，不仅保留 button。
- `npm run lint`、`npm run build` 无新增 error。

## Review（已完成）
- 新增组件文件：
  - `src/react-app/components/ui/card.tsx`
  - `src/react-app/components/ui/input.tsx`
  - `src/react-app/components/ui/label.tsx`
  - `src/react-app/components/ui/textarea.tsx`
  - `src/react-app/components/ui/badge.tsx`
- 页面示例：
  - `src/react-app/App.tsx` 改为 `Profile Editor + Live Preview` 双栏交互页面，演示 `Button/Card/Input/Label/Textarea/Badge` 与 Base UI `Switch` 混合使用。
- 验证命令：
  - `npm run lint`：通过（仅保留仓库既有 `worker-configuration.d.ts` warnings）。
  - `npm run build`：通过（Wrangler 日志目录 `EPERM` 告警不影响产物与退出码）。

---

# 2026-03-04 npm -> pnpm 迁移任务

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 更新项目脚本与文档中的包管理命令为 pnpm
- [x] 生成 `pnpm-lock.yaml` 并移除 `package-lock.json`
- [x] 运行 `pnpm run lint` 与 `pnpm run build` 校验

## 验收标准
- 仓库包含 `pnpm-lock.yaml`，不再使用 `package-lock.json`。
- `README.md`、`docs/technical-architecture.md` 的常用命令切换为 `pnpm`。
- `package.json` 明确声明 `pnpm` 作为包管理器。
- `pnpm run lint`、`pnpm run build` 通过（允许既有告警）。

## Review（已完成）
- 包管理器切换：
  - `package.json` 新增 `packageManager: pnpm@10.10.0`。
  - `preview` 脚本由 `npm run build` 切换为 `pnpm run build`。
- 锁文件切换：
  - 生成 `pnpm-lock.yaml`。
  - 删除 `package-lock.json`。
- 文档同步：
  - `README.md` 全部常用命令切换为 `pnpm`。
  - `docs/technical-architecture.md` 升级到 `v0.3.0` 并更新命令链路说明。
- 验证结果：
  - `pnpm run lint`：通过（仅保留仓库既有 `worker-configuration.d.ts` warnings）。
  - `pnpm run build`：通过（Wrangler 日志目录 `EPERM` 告警不影响产物与退出码）。

---

# 2026-03-04 Hono 最佳实践调研与文档回写任务

## 任务清单
- [x] 创建任务计划并定义验收标准（仅调研与文档更新）
- [x] 调研 Hono 官方最佳实践与稳定模式（优先官方文档）
- [x] 将结论落地到 `docs/plans/2026-03-04-backend-foundation-design.md`
- [x] 自检文档一致性并输出待确认项

## 验收标准
- 文档新增 Hono 最佳实践章节，且与当前后端改造方案一致。
- 每条实践有明确落地动作（改哪些模块/约束什么代码习惯）。
- 给出“待确认后进入实现”的边界，不提前改实现代码。

## Review（已完成）
- 文档更新：`docs/plans/2026-03-04-backend-foundation-design.md` 已新增 `8.4 Hono 官方最佳实践` 章节。
- 落地内容：补充了 10 条实践到本项目的执行约束（handler 薄层、Factory、链式路由、`notFound/onError`、中间件顺序、`Content-Type` 校验、Bindings/Variables 类型化、`executionCtx`、RPC、测试策略）。
- 实施计划同步：`Phase 0/3/5` 已加入 Hono 最佳实践相关实施项；决策点新增“是否首阶段启用 Hono RPC”。
- 调研来源（官方）：Hono Best Practices / Middleware / Validation / RPC / Testing / Context 文档。
- 状态：文档阶段完成，等待用户确认后进入实现阶段。

---

# 2026-03-04 后端方案按用户反馈收敛（dev/prod + 现有 D1 + 域名策略）

## 任务清单
- [x] 根据用户反馈将环境模型从 `dev/staging/prod` 收敛为 `dev/prod`
- [x] 在方案中对齐用户已创建 D1（`illumi-family-db` / `illumi-family-db-dev`）
- [x] 补充 Cloudflare 前端 `dev/prod` 独立域名配置路径（workers.dev / custom domains）
- [x] 回填任务 review，并保持“待确认后再实现”边界

## 验收标准
- 文档中不再出现 `staging` 方案依赖。
- D1 章节明确复用现有数据库并给出获取 `database_id` 步骤。
- 前端域名章节明确回答“如何做 dev/prod 独立访问域名”。
- 仅改文档，不改实现代码。

## Review（已完成）
- 更新文档：`docs/plans/2026-03-04-backend-foundation-design.md`。
- 关键调整：
  - 环境改为 `prod` + `env.dev`。
  - D1 绑定改为用户现有库名：`illumi-family-db` / `illumi-family-db-dev`。
  - 新增 `5.6` 节：前端域名双方案（workers.dev 立即可用 + custom domains 生产推荐）。
  - 资源创建命令与部署命令改为 dev/prod 双环境。
- 参考核对：Cloudflare Workers environments / routes(custom_domain) 官方文档。
- 状态：文档已更新，等待用户确认后进入实现阶段。

---

# 2026-03-04 后端基础能力实施任务（dev/prod）

## 任务清单
- [x] 获取并确认 Cloudflare 账号、D1 现有信息（`illumi-family-db` / `illumi-family-db-dev`）
- [x] 创建并确认 KV（`ILLUMI_CACHE`、`ILLUMI_CACHE_DEV` + preview）与 R2（`illumi-family-files`、`illumi-family-files-dev`）
- [x] 更新 `wrangler.json` 为 `prod + env.dev` 资源绑定与变量分层
- [x] 安装并配置 Drizzle（依赖、`drizzle.config.ts`、schema、migrations 目录）
- [x] 落地 Hono API 分层骨架（app/router/controller/service/repository/middleware）
- [x] 实现最小 `users` 模块（D1 + Drizzle 读写示例）与 `health` 路由
- [x] 补充最小测试与校验命令（至少包含 API 行为验证）
- [x] 运行 `cf-typegen`、`lint`、`build` 校验并回填文档

## 验收标准
- Worker 可在 `dev/prod` 两环境部署，且绑定到各自 D1/KV/R2。
- 代码中具备 Hono 分层结构与统一错误处理、请求 ID 中间件。
- `users` 模块具备至少一个查询与一个创建接口（含入参校验）。
- Drizzle schema 与迁移流程可执行。
- `pnpm run lint` 与 `pnpm run build` 通过（允许仓库既有 warning）。

## Review（已完成）
- 资源创建结果：
  - D1（已存在）：
    - `illumi-family-db`: `1c23c866-1950-439b-8379-520e7be083e2`
    - `illumi-family-db-dev`: `37f69f1e-7eb7-44d5-8683-f552cf2ab4c0`
  - KV（新建）：
    - `ILLUMI_CACHE`: `477a5460c50d4f03963d193fae3f69ac`
    - `ILLUMI_CACHE_preview`: `251631bdcb474b3b8cab2402329e6198`
    - `ILLUMI_CACHE_DEV`: `056845d903544d788875e31d7799b25c`
    - `ILLUMI_CACHE_DEV_preview`: `e1daa9522cd64d4f91447aa505c1fc91`
  - R2（新建）：
    - `illumi-family-files`
    - `illumi-family-files-dev`
- 代码落地：
  - `wrangler.json` 已配置 `prod + env.dev` 的 D1/KV/R2/vars 绑定。
  - 新增 Drizzle 配置与 schema：`drizzle.config.ts`、`src/worker/shared/db/schema/users.ts`、`drizzle/migrations/0000_jittery_siren.sql`。
  - Worker 分层重构：`src/worker/app.ts`、`src/worker/modules/*`、`src/worker/shared/http/*`、`src/worker/shared/db/*`。
  - 新增 API：
    - `GET /api/health`
    - `GET /api/users`
    - `POST /api/users`（JSON + Zod 校验）
- 数据库迁移执行：
  - `pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.json --env dev`：成功
  - `pnpm exec wrangler d1 migrations apply DB --remote --config wrangler.json`：成功
  - 验证 `users` 表存在（dev/prod）：`wrangler d1 execute ... SELECT name FROM sqlite_master ...`
- 部署结果：
  - dev: `https://illumi-family-mvp-dev.lguangcong0712.workers.dev`
  - prod: `https://illumi-family-mvp.lguangcong0712.workers.dev`
- 线上接口验证（dev）：
  - `GET /api/health`：返回 `appEnv=dev`
  - `POST /api/users` + `GET /api/users`：创建与查询成功
  - `GET /api/does-not-exist`：返回结构化 `ROUTE_NOT_FOUND`
  - `POST /api/users` 缺失 JSON content-type：返回 `UNSUPPORTED_MEDIA_TYPE` (415)
- 校验命令：
  - `pnpm test`：通过（2/2）

---

# 2026-03-04 项目模板化雏形设计任务

## 任务清单
- [x] 阅读项目上下文与约束（`AGENTS.md`、`README.md`、`docs/technical-architecture.md`、近期提交）
- [x] 明确模板使用形式与边界（用户确认：本地内部脚手架优先，不发 npm）
- [x] 输出 2-3 种模板化路径对比并给出推荐
- [x] 编写雏形设计文档（`docs/plans/2026-03-04-template-foundation-design.md`）
- [x] 用户确认后转入实现计划

## 验收标准
- 方案能回答“如何把当前仓库作为可复用模板”且不阻塞当前基建继续演进。
- 输出包含至少两种可执行路径及取舍（复杂度、维护成本、迁移成本）。
- 设计文档可直接作为后续实现依据（目录、命令、约束、验收口径完整）。

## Review（已完成）
- 已完成用户访谈确认：
  - 模板创建方式：脚手架；
  - 发布范围：仅本地/内部命令，暂不发布 npm；
  - 关键约束：不影响当前业务与基建持续开发。
- 已完成方案对比并推荐：
  - 方案 A（推荐）本仓内脚本 + 本地模板快照；
  - 方案 B 复制仓库 + 初始化脚本；
  - 方案 C 独立 template 分支。
- 已输出设计文档：
  - `docs/plans/2026-03-04-template-foundation-design.md`
  - 覆盖目录边界、命令接口、白/黑名单同步策略、防误操作机制、验收标准与回滚。
- 已转入实施计划：
  - `docs/plans/2026-03-04-template-foundation-implementation-plan.md`
  - 包含 TDD 任务拆分、文件级改动清单、验证命令与 DoD。

---

# 2026-03-04 TanStack 技术栈接入调研任务

## 任务清单
- [x] 阅读 `docs/` 目录文档并提炼当前前端架构与演进方向
- [x] 调研 TanStack 官方产品能力（Router/Query/Start/Table/Form/Virtual）
- [x] 对比当前仓库能力差异，评估接入必要性与边界
- [x] 输出结论与分阶段接入建议，并回填 Review

## 验收标准
- 结论明确回答“是否需要接入 TanStack”且给出理由，不泛泛而谈。
- 至少覆盖与本项目相关的 TanStack 子产品能力差异。
- 建议包含“现在可做”和“后续按需做”的分层策略。

## Review（已完成）
- 现状核对：
  - `docs/technical-architecture.md`：当前前端为 SPA，后端为 Hono + Worker，尚未引入前端路由与数据缓存层。
  - `docs/seo-ssr-roadmap.md`：已识别 SEO/SSR 演进诉求（当前非 SSR）。
  - `src/react-app/App.tsx`：前端数据请求仍为手写 `fetch`，未引入 server-state 管理。
- TanStack 官方调研范围：
  - 核对 `Query/Router/Start/Table/Form/Virtual` 能力与定位。
  - 参考 TanStack 官网产品状态：`Start (RC)`、`DB (BETA)`、`Pacer (BETA)`、`Store (ALPHA)`。
- 结论摘要：
  - 建议优先接入 `TanStack Query`（低改造、高收益）。
  - `TanStack Router` 在进入多页面阶段时接入；与 Query 组合能统一数据加载范式。
  - `TanStack Start` 暂不建议立刻切换（改造面大），可在正式启动 SSR/混合渲染阶段再评估。

---

# 2026-03-04 TanStack Router + Query 分阶段接入实施任务

## 任务清单
- [x] 阶段 1：安装并接入 `@tanstack/react-router`、`@tanstack/react-query`（不引入 Start/Table/Form/Virtual）
- [x] 阶段 2：按 TDD 增加前端 API 客户端测试（先失败后通过）
- [x] 阶段 3：实现多页面路由与 Query 数据流，页面可见路由切换与数据刷新效果
- [x] 阶段 4：更新架构文档并完成测试/构建验证

## 验收标准
- 前端入口已使用 `RouterProvider + QueryClientProvider`。
- 至少包含两个页面路由，用户可看到页面切换效果。
- 页面数据读取使用 `TanStack Query`，并体现缓存失效后的自动刷新效果。
- 明确未引入 `TanStack Start/Table/Form/Virtual`。

## Review（已完成）
- 依赖接入：
  - 新增 `@tanstack/react-router@^1.163.3`、`@tanstack/react-query@^5.90.21`。
  - 未安装 `TanStack Start/Table/Form/Virtual` 相关包。
- 前端实现：
  - 入口改造：`src/react-app/main.tsx` 使用 `QueryClientProvider + RouterProvider`。
  - 路由树：`src/react-app/router.tsx`，新增 `Home`/`Users` 两个路由页面。
  - 路由布局：`src/react-app/routes/root-layout.tsx`，顶部导航支持路由切换并显示当前路径。
  - Query 能力：
    - `Home` 页查询 `/api/health`，展示 `pending/success/fetching` 状态与 `Refetch` 可见效果。
    - `Users` 页查询 `/api/users` + `POST /api/users`，创建成功后 `invalidateQueries` 自动刷新列表。
  - API 客户端：`src/react-app/lib/api.ts`、`src/react-app/lib/query-options.ts`。
- TDD 记录：
  - 新增测试 `src/react-app/lib/api.test.ts`。
  - 红灯 1：`vitest include` 仅匹配 worker 测试（已修 `vitest.config.ts`）。
  - 红灯 2：`Cannot find module './api'`（补实现后转绿）。
- 验证命令：
  - `pnpm test src/react-app/lib/api.test.ts`：通过（3/3）
  - `pnpm test`：通过（5/5，包含 worker + react-api）
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）
  - `pnpm run build`：通过（存在既有 Wrangler 日志目录 `EPERM` 告警，不影响退出码）
- 文档同步：
  - `docs/technical-architecture.md` 升级到 `v0.6.0`，补充 TanStack Router + Query 落地信息。

---

# 2026-03-04 注册项目技能到 AGENTS 任务

## 任务清单
- [x] 检查仓库是否已有 `AGENTS.md`
- [x] 在项目根目录创建或更新 `AGENTS.md` 并注册 `illumi-family-project-playbook`
- [x] 校验路径与触发说明可用，并回填 review

## 验收标准
- 项目存在 `AGENTS.md`。
- `AGENTS.md` 中包含 `illumi-family-project-playbook` 的名称、用途和路径。
- 明确项目架构/技术栈变更时需同步更新该 skill。

## Review（已完成）
- 仓库内未发现已有 `AGENTS.md`，已新建项目级 `AGENTS.md`。
- 已注册 skill：`illumi-family-project-playbook`，包含用途、路径、触发规则。
- 已补充维护规则：架构/技术栈/部署流程变更时，需同步更新文档与 skill references。

---

# 2026-03-04 文档小同步（Router/Query 与测试范围表述）

## 任务清单
- [x] 创建任务计划并定义验收标准
- [x] 同步 `docs/technical-architecture.md` 中 `vitest.config.ts` 描述为全仓测试范围
- [x] 同步 playbook `references/current-state.md` 的前端技术栈表述（补充 TanStack Router/Query）
- [x] 进行最小一致性核对并回填 review

## 验收标准
- `docs/technical-architecture.md` 对 `vitest.config.ts` 的描述与当前配置 `include: ["src/**/*.test.ts"]` 一致。
- `references/current-state.md` 的前端技术栈快照明确包含 TanStack Router 与 TanStack Query。
- 本次改动不影响代码行为，仅为文档/技能参考同步。

## Review（已完成）
- 文档同步：
  - `docs/technical-architecture.md`：`vitest.config.ts` 注释已改为“全仓 Vitest 测试配置（Worker API + 前端 API client）”。
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md`：前端快照已补充 `TanStack Router + TanStack Query`。
- 一致性核对：
  - `rg -n "vitest.config.ts|全仓 Vitest 测试配置" docs/technical-architecture.md`
  - `rg -n "Frontend: React 19 \\+ Vite 6" .codex/skills/illumi-family-project-playbook/references/current-state.md`
- 影响范围：仅文档/技能参考文本，未改运行时代码逻辑。

---

# 2026-03-04 提交信息语言规范同步任务

## 任务清单
- [x] 定位仓库中最适合承载提交规范的位置
- [x] 在 `AGENTS.md` 增加“commit message 仅英文”规则
- [x] 在 playbook `references/workflows.md` 增加同样规则以保持一致
- [x] 在 `tasks/lessons.md` 记录本次纠正与防错规则

## 验收标准
- 项目级说明和 skill workflow 同时包含英文提交信息要求。
- lessons 已记录本次纠正，后续提交前可复用。

## Review（已完成）
- 已更新文件：`AGENTS.md`、`.codex/skills/illumi-family-project-playbook/references/workflows.md`、`tasks/lessons.md`。
- 规则文本统一为：`git commit` message 英文-only，不使用中文。

---

# 2026-03-04 默认环境切换为 dev（保留显式 prod）

## 任务清单
- [x] 设计并落地“默认 dev、显式 prod”的脚本策略
- [x] 更新 `package.json` 脚本（`dev/check/deploy/db:migrate` 默认指向 dev）
- [x] 新增显式 prod 命令（`dev:prod`、`check:prod`、`deploy:prod`）
- [x] 同步 `docs/technical-architecture.md` 与 playbook `references/workflows.md`
- [x] 执行最小验证并记录结果

## 验收标准
- 本地 `pnpm dev` 默认加载 `env.dev` 绑定。
- `pnpm run deploy` 默认发 dev，prod 需显式使用 `pnpm run deploy:prod`。
- 文档与 skill workflow 的命令说明与脚本保持一致。

## Review（已完成）
- 脚本变更：
  - 默认 dev：`dev`、`check`、`deploy`、`db:migrate`。
  - 显式 prod：`dev:prod`、`check:prod`、`deploy:prod`、`db:migrate:prod`。
- 文档同步：
  - `docs/technical-architecture.md` 升级到 `v0.7.0`，更新命令策略与变更记录。
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md` 同步部署与迁移命令。
- 验证命令：
  - `pnpm run build`：通过（存在既有 Wrangler 日志写入 `EPERM` 告警，不影响退出码）。

---

# 2026-03-05 模板脚手架实现任务（依据 2026-03-04 设计与实施计划）

## 任务清单
- [x] Task 1：搭建 `tools/create-illumi-family-app` 目录骨架、`template.config.json`、`template:*` 脚本与最小存在性测试
- [x] Task 2：实现 `template:new` 参数解析与安全校验（`--name`、目标目录非空保护等）并补测试
- [x] Task 3：实现 `template:new` 模板复制与项目标识替换（`package.json`、`wrangler.json`、`README`）并补测试
- [x] Task 4：实现 `template:sync` 的白/黑名单同步与 `--dry-run`/`--apply` 行为并补测试
- [x] Task 5：实现 `template.manifest.json` 生成与 `template:doctor` 校验并补测试
- [x] Task 6：同步 `README.md`、`docs/technical-architecture.md`、playbook references（`current-state.md`、`workflows.md`）
- [x] 运行最终验证：`pnpm test`、`pnpm run lint`、`pnpm run build`、`pnpm template:doctor`

## 验收标准
- 可通过 `pnpm template:new -- --name <app> --dir <path>` 在仓库外生成项目。
- 新项目的 `package.json.name`、`wrangler.json.name`、`wrangler.json.env.dev.name` 已按项目名替换。
- `template:sync` 默认 dry-run，显式 `--apply` 才写入模板目录。
- `template:sync` 会输出并写入 `template.manifest.json`（含文件哈希与时间）。
- `template:doctor` 能识别模板缺失/manifest 缺失并返回非零退出码。
- 主仓既有开发链路（test/lint/build）行为不受破坏。

## Review（已完成）
- 实现摘要：
  - 新增本地模板工具：`template:new`、`template:sync`、`template:doctor`。
  - 新增模板配置：`template.config.json`（白名单/黑名单/替换规则）。
  - 新增模板快照与 manifest：`tools/create-illumi-family-app/templates/base/*`。
  - `template:new` 生成时会自动移除 `template:*` 内部脚本与 `template.manifest.json`。
  - 新增工具测试：`scaffold.test.ts`、`create.test.ts`、`sync-template.test.ts`。
  - 文档与 playbook 已同步模板工具说明与工作流。
- 关键验证结果（主仓）：
  - `pnpm test`：通过（13/13）。
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）。
  - `pnpm run build`：通过（Wrangler 日志目录 `EPERM` 告警，不影响退出码）。
  - `pnpm template:doctor`：通过。
- 端到端模板验证（仓库外临时目录）：
  - `pnpm template:new -- --name demo-app --dir /tmp/.../demo-app --no-install`：成功生成。
  - 生成项目执行 `pnpm install && pnpm run build && pnpm test`：全部通过。
- 中途发现并修复的问题：
  - 白名单遗漏 `worker-configuration.d.ts`，导致新项目 `tsc -b` 失败（已补并同步快照）。
  - 白名单遗漏 `index.html`，导致前端构建仅生成 fallback 入口（已补并同步快照）。
  - `vitest`/`eslint` 范围被模板快照污染：已收窄 `vitest` include 并在 ESLint ignores 中排除模板快照目录。

---

# 2026-03-05 官网主站 UIUX 设计与前端实现任务

## 任务清单
- [x] 基于 `docs/biz-background.md` 提炼首页信息架构与转化路径
- [x] 结合 `ui-ux-pro-max` 产出视觉方向（风格/色彩/排版/交互）
- [x] 以假数据实现官网主站首页（仅前端）并替换现有 Home 演示页
- [x] 补充响应式、可访问性与动效细节（含 reduced-motion）
- [x] 执行 `pnpm run lint` 与 `pnpm run build` 验证
- [x] 回填本节 Review（产物、验证结果、风险）

## 验收标准
- `/` 路由呈现“童蒙家塾”官网主站风格页面，不再是技术演示内容。
- 页面包含业务文档要求的核心版块：品牌首屏、栏目入口、最新内容、视频归档入口、信任区、强 CTA、法律/合规摘要。
- 内容均为可替换假数据，不依赖后端 API。
- 移动端可用（导航、版块布局、CTA 可见），并具备基础可访问性（焦点态、对比度、语义结构）。
- `pnpm run lint` 与 `pnpm run build` 通过（允许既有、与本任务无关的历史 warning）。

## Review（已完成）
- 主要产物：
  - `src/react-app/routes/home-page.tsx`：重写为官网主站首页（Hero、栏目、最新内容、旧视频号归档、信任区、CTA、法律摘要、页脚）。
  - `src/react-app/routes/home-page.data.ts`：新增首页假数据与类型定义，便于后续替换真实内容。
  - `src/react-app/routes/root-layout.tsx`：改为简洁站点壳层并新增 `Skip to content`。
  - `src/react-app/index.css`：升级暖色设计 token、中文字体组合、入场动画与 `prefers-reduced-motion` 适配。
- 设计与交互决策：
  - 色彩采用米白/暖棕/陶土橙系，避免冷科技感与紫色偏置。
  - 组件交互以颜色/阴影反馈为主，避免会造成布局跳动的缩放 hover。
  - 顶部浮动导航 + 强 CTA，移动端保留主 CTA 可见。
- 验证结果：
  - `pnpm run lint`：通过（仅仓库既有 `worker-configuration.d.ts` warning）。
  - `pnpm run build`：通过（Wrangler 写日志 `EPERM` 为已知环境告警，不影响退出码）。
- 风险与待补充：
  - 企微、表单、商务联系方式仍为占位文案，待业务信息补齐后替换。
  - 目前仅完成首页主站 UI；栏目页/详情页等仍待后续路由页面化实现。

---

# 2026-03-05 首页 SEO 元信息优化与文案备选任务

## 任务清单
- [x] 检查当前首页 `title/description` 基线
- [x] 更新 `index.html` 的默认 SEO 元信息（title、description、OG、Twitter）
- [x] 生成多版本 `title + description` 备选文案文档
- [x] 运行最小构建验证并回填 Review

## 验收标准
- 首页不再使用模板默认 `Vite + React + TS` 标题。
- 首页具备可用 `description` 与基础社交分享元信息。
- 提供至少 4 套可替换的 `title + description` 中文备选文案。
- 文档明确后续 favicon 接入点。

## Review（已完成）
- 代码变更：
  - `index.html` 已更新默认 `title`、`description`、`og:*`、`twitter:*` 元信息，并将页面语言改为 `zh-CN`。
- 文档产物：
  - `docs/seo-title-description-options.md`，提供 6 套首页 `title + description` 备选文案与适用场景。
  - 文档中已注明 favicon 后续接入建议资源清单。
- 验证结果：
  - `pnpm run build` 通过（Wrangler 日志写入 `EPERM` 为环境告警，不影响构建退出码与产物）。

---

# 2026-03-05 鉴权组件详细对比文档（含 Cloudflare 与 Resend）任务

## 任务清单
- [x] 统一输出手机号/邮箱/Google 三入口的鉴权方案对比
- [x] 纳入 Cloudflare 能力边界评估（是否可单独承担完整鉴权）
- [x] 将“邮件通道采用 Resend”写入方案与推荐架构
- [x] 形成可评审的文档结论（推荐路径、风险、分阶段建议）
- [x] 补充“用户数据形式与存储策略”维度（各方案数据主存位置、扩展能力、迁移风险）

## 验收标准
- 文档覆盖 `Better Auth`、`Clerk`、`Supabase Auth`、`Firebase Auth`、`Auth0`、`AWS Cognito` 与 `Cloudflare`。
- 文档明确 Cloudflare 在鉴权体系中的角色定位，不混淆 Zero Trust 与 B2C 用户系统。
- 文档明确记录邮件通道使用 `Resend`，并说明与不同鉴权方案的组合方式。
- 文档给出可执行推荐（快速上线路径与长期自控路径）。
- 文档包含“用户数据形式与存储”对比：身份数据主存位置、用户对象形态、自定义字段方式、业务数据建议落点、迁移风险。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-05-auth-provider-comparison.md`
- 关键结论：
  - Cloudflare 不建议作为唯一 B2C 鉴权中心，更适合作为边缘安全层。
  - 邮件通道统一采用 `Resend`，并给出在各鉴权平台下的适配建议。
  - 新增“用户数据形式与存储策略”章节，明确各方案的数据边界与迁移复杂度。
  - 推荐路径分为：
    - 快速上线：`Clerk + Cloudflare + Resend（业务邮件）`
    - 长期自控：`Better Auth/Supabase + Resend + 短信供应商 + Cloudflare`

---

# 2026-03-05 方案 B（Better Auth + Resend）架构调整设计文档任务

## 任务清单
- [x] 基于用户确认的方案 B 输出单独落地架构文档
- [x] 明确本期范围：仅邮箱 + Google，手机号仅预留扩展位
- [x] 补充详细数据模型与迁移策略（身份域/业务域解耦）
- [x] 补充环境变量、安全基线、回滚策略与分阶段实施路径
- [x] 在选型文档中补充“已选方案落地文档”引用

## 验收标准
- 生成独立文档，能作为后续实现依据，不与横向对比混杂。
- 明确标注“待确认后执行”，本轮不落地代码实现。
- 文档中包含手机号未来扩展设计，但无本期实现动作。
- 文档包含用户需确认的执行开关清单，便于下一步直接推进实施。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-05-better-auth-resend-architecture-adjustment-plan.md`
  - `docs/plans/2026-03-05-auth-provider-comparison.md`（新增落地文档引用）
- 关键内容：
  - 已将方案收敛为 `Better Auth + Resend`，并锁定首期仅邮箱 + Google。
  - 数据层采用“鉴权域与业务域解耦”策略：`auth_* + app_users + user_identities + user_security_events`。
  - 手机号登录仅预留 provider/字段/配置，不做接口与 UI 实现。
  - 文档末尾新增“待你确认的执行开关（6 项）”，用于进入实施前最终确认。

---

# 2026-03-05 Better Auth 实施前文档补充任务（按 6 项确认值固化）

## 任务清单
- [x] 将“待确认执行开关”固化为已确认决策（邮箱+密码、注册即验证、自动合并、直接迁移、审计 180 天、手机号仅预留）
- [x] 补充自动合并硬条件与误合并回滚机制，降低账号接管风险
- [x] 补充直接迁移 runbook（预检/回填/核对/切流/失败回退）
- [x] 补充可执行回滚策略（触发阈值、步骤顺序、RTO）
- [x] 补充审计与会话清理策略（TTL、执行频率、告警）与 dev/prod 配置矩阵
- [x] 回填 Review 与最小核对结果

## 验收标准
- `docs/plans/2026-03-05-better-auth-resend-architecture-adjustment-plan.md` 不再包含未决策开关，改为已确认策略。
- 文档明确自动合并的“允许条件/拒绝条件/异常处理/可回滚路径”。
- 文档包含可执行的迁移与回滚 runbook，具备步骤和判定条件。
- 文档明确审计保留为 180 天，并给出清理执行机制。
- 本轮仅修改文档，不改运行时代码。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-05-better-auth-resend-architecture-adjustment-plan.md`
- 关键补充：
  - 6 项执行开关已全部固化为已确认值，文档从“待确认”转为“可实施基线”。
  - 新增自动合并硬条件（邮箱标准化一致 + 双侧已验证 + 风控通过）与误合并可逆机制。
  - 新增直接迁移执行清单：预检 SQL、回填 SQL、核对 SQL、切流条件、失败回退条件。
  - 新增回滚 runbook：触发阈值、回滚步骤顺序、RTO（30 分钟）与环境执行顺序。
  - 新增审计与数据清理策略：审计默认 180 天，session/verification/重试日志的清理频率与告警要求。
  - 新增 dev/prod 配置矩阵、启动前阻断校验与密钥轮换建议。
- 最小核对：
  - `rg -n \"待确认|是否确认|待你确认\" docs/plans/2026-03-05-better-auth-resend-architecture-adjustment-plan.md` 结果为空，说明未决项已清除。
  - `rg -n \"已确认的执行开关|直接迁移执行清单|回滚策略（Runbook）|数据保留与清理策略\" docs/plans/2026-03-05-better-auth-resend-architecture-adjustment-plan.md` 命中关键新增章节。
- 变更边界：仅文档更新，未修改运行时代码与部署配置。

---

# 2026-03-05 Better Auth + Resend 全流程实施任务

## 任务清单
- [x] 引入 Better Auth/Resend 依赖并扩展 Worker 环境类型与配置读取
- [x] 新增鉴权与身份域 schema（auth_* + app_users + user_identities + user_security_events）并生成 migration
- [x] 实现 `/api/auth/*` 路由接入（邮箱密码 + 邮箱验证 + Google OAuth）
- [x] 实现身份映射与自动合并规则（含硬条件与审计记录）
- [x] 实现误合并回滚能力的最小数据结构与服务层入口
- [x] 接入 Resend 邮件发送器（验证邮件）与失败审计
- [x] 前端新增鉴权页与会话入口（登录/注册/回调），接入 auth client
- [x] 将用户列表页改为需要会话（未登录跳转）并提供登出
- [x] 增加/更新测试（核心流程单测 + API 路由测试）
- [x] 运行 `pnpm test`、`pnpm run lint`、`pnpm run build` 验证并回填 review

## 验收标准
- Worker 提供可用的 `/api/auth/*` 鉴权入口，并与 Better Auth 正常连接。
- 邮箱+密码注册登录、注册即验证、Google OAuth 映射策略在代码中落地。
- 自动合并仅在硬条件满足时触发，且审计事件可追踪。
- D1 schema/migration 与文档模型一致，包含审计与身份映射表。
- 前端提供最小可用鉴权入口，未登录访问受保护页面会被拦截。
- 核心命令 `pnpm test`、`pnpm run lint`、`pnpm run build` 通过（允许既有非阻断 warning）。

## Review（已完成）
- 代码与配置产物：
  - Worker auth 入口：`src/worker/modules/auth/*`、`src/worker/shared/auth/*`、`src/worker/shared/email/auth-mailer.ts`。
  - DB schema：`src/worker/shared/db/schema/auth.ts`、`src/worker/shared/db/schema/identity.ts`。
  - Migration：`drizzle/migrations/0001_special_jocasta.sql`（含 `users -> app_users/user_identities` 回填）。
  - 前端 auth：`src/react-app/lib/auth-client.ts`、`src/react-app/routes/auth-page.tsx`、`src/react-app/router.tsx`、`src/react-app/routes/root-layout.tsx`。
  - 受保护页面：`src/worker/modules/users/users.controller.ts`（新增 session 校验）。
- 文档同步：
  - `docs/technical-architecture.md` 升级到 `v0.9.0`。
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md`、`references/workflows.md` 同步 auth 现状与运维命令。
- 数据库执行结果：
  - `pnpm run db:migrate`（dev remote）执行成功，`0001_special_jocasta.sql` 已应用到 `illumi-family-db-dev`。
- 验证结果：
  - `pnpm test`：通过（14/14）。
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）。
  - `pnpm run build`：通过（Wrangler 日志写入 `EPERM` 为环境告警，不影响退出码）。
  - `pnpm run check`：通过（dry-run 正常，绑定含 `BETTER_AUTH_BASE_URL`/`RESEND_FROM_EMAIL`）。
- 已知待配项（上线前）：
  - 需在 Cloudflare secret 中配置：`BETTER_AUTH_SECRET`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`RESEND_API_KEY`。

---

# 2026-03-05 Better Auth + Resend 全流程实施收尾（dev 联调推进）

## 任务清单
- [x] 复跑实现阶段核心校验（`test/lint/build/check`）
- [x] 执行 dev 部署，确认 Worker 已切到新鉴权版本
- [x] 配置 dev 核心 secret（`BETTER_AUTH_SECRET`）修复 `/api/auth/*` 启动阻断
- [x] 执行远端 smoke check（`/api/health`、`/api/users`、`/api/auth/ok`）
- [x] 输出剩余阻断项与下一步执行命令（仅第三方密钥）

## 验收标准
- `dev` 环境已部署最新实现，`/api/health` 正常返回 `appEnv=dev`。
- `/api/auth/ok` 不再因缺少 `BETTER_AUTH_SECRET` 返回 500。
- 明确列出当前仍阻断“注册/验证/Google 登录”的必需密钥。

## Review（已完成）
- 执行结果：
  - `pnpm test`：通过（14/14）。
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）。
  - `pnpm run build`：通过（Wrangler 日志写入 `EPERM` 为环境告警，不影响退出码）。
  - `pnpm run check`：通过（dev dry-run 正常）。
  - `pnpm run deploy:dev`：成功，Version ID `29963258-4912-4771-b4cb-08fd5ec15041`。
- 远端接口校验：
  - `GET /api/health` -> `200`，返回 `appEnv: dev`。
  - `GET /api/users` -> `401`（未登录符合预期）。
  - `GET /api/auth/ok` -> `200`（`BETTER_AUTH_SECRET` 生效后恢复）。
  - `GET /api/auth/get-session` -> `200` + `null`（未登录符合预期）。
- secret 现状（dev）：
  - 已配置：`BETTER_AUTH_SECRET`。
  - 未配置：`RESEND_API_KEY`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`。
- 结论：
  - 代码与基础部署链路已打通；剩余阻断仅为第三方密钥未注入，导致“邮件验证发送”和“Google 登录”无法完成真实联调。

---

# 2026-03-05 Better Auth + Resend 全流程联调（dev secrets 注入后）

## 任务清单
- [x] 写入 dev 密钥：`RESEND_API_KEY`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`
- [x] 验证 `/api/auth/sign-up/email` 与未验证登录拦截
- [x] 验证 `/api/auth/send-verification-email` 可执行
- [x] 验证 `/api/auth/sign-in/social`（Google）返回 OAuth 跳转 URL
- [x] 查询 `user_security_events`，确认审计事件落库

## 验收标准
- `wrangler secret list --env dev` 包含 4 个鉴权核心 secret。
- 邮箱注册后，未验证登录返回 `EMAIL_NOT_VERIFIED`（403）。
- 验证邮件重发接口返回成功状态，不出现 `verification_email_failed` 事件。
- Google social 登录入口可返回 `accounts.google.com` 授权 URL。

## Review（已完成）
- secret 注入结果（dev）：
  - 已配置：`BETTER_AUTH_SECRET`、`RESEND_API_KEY`、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`。
- 远端联调结果：
  - `POST /api/auth/sign-up/email` -> `200`（新用户创建成功，`emailVerified=false`）。
  - `POST /api/auth/sign-in/email`（未验证账号）-> `403` + `EMAIL_NOT_VERIFIED`（符合策略）。
  - `POST /api/auth/send-verification-email` -> `200` + `{"status":true}`。
  - `POST /api/auth/sign-in/social` -> `200`，返回 Google OAuth 授权 URL。
- 审计核对（D1 dev）：
  - 最近事件包含：`sign_up_completed`、`identity_linked`（provider=`email`）。
  - `verification_email_failed` 计数为 `0`。
- 备注：
  - 提供的 `GOOGLE_CLIENT_ID` 末尾包含 `.`，当前已按原值写入并可生成 OAuth URL；建议在 Google Cloud Console 再次核对该值是否为最终正式 client id，避免回调阶段失败。

---

# 2026-03-05 dev 自定义域名鉴权基准切换（Google OAuth 回调对齐）

## 任务清单
- [x] 将 `env.dev.BETTER_AUTH_BASE_URL` 更新为 `https://dev.illumi-family.com`
- [x] 同步技术架构文档与 playbook 引用中的 dev 主 URL
- [x] 部署 dev 并验证 OAuth 授权地址中的 `redirect_uri` 使用自定义域名
- [x] 更新经验沉淀（lessons）避免后续 OAuth 参数误填

## 验收标准
- dev 环境生成的 Google OAuth 授权 URL 中 `redirect_uri` 为 `https://dev.illumi-family.com/api/auth/callback/google`。
- playbook 的当前状态与 smoke 命令均反映 dev 自定义域名主地址。
- 变更不影响既有 `workers.dev` fallback 使用。

## Review（已完成）
- 配置变更：
  - `wrangler.json` 中 `env.dev.vars.BETTER_AUTH_BASE_URL` 已改为 `https://dev.illumi-family.com`。
- 文档同步：
  - `docs/technical-architecture.md` 升级到 `v0.9.1` 并更新 dev URL 映射。
  - `.codex/skills/illumi-family-project-playbook/references/current-state.md` 更新 dev 主 URL 与 fallback URL。
  - `.codex/skills/illumi-family-project-playbook/references/workflows.md` 的 dev smoke 命令优先自定义域名。
- 验证结果：
  - 部署后 `POST /api/auth/sign-in/social` 返回的 Google URL 中，`redirect_uri` 为 `https://dev.illumi-family.com/api/auth/callback/google`。

---

# 2026-03-05 Google OAuth 联调验证与 1102 修复（dev）

## 任务清单
- [x] 对 `dev.illumi-family.com` 进行注册/登录/重发验证邮件/Google 跳转联调
- [x] 定位 `503 error code 1102` 根因
- [x] 修复 CPU 超限问题并重新部署 dev
- [x] 回归验证邮箱链路与 Google 跳转链路
- [x] 补充哈希器单测

## 验收标准
- `sign-up` 与 `sign-in` 不再出现 `1102`。
- `sign-up` 正常 `200`；未验证 `sign-in` 返回 `403 EMAIL_NOT_VERIFIED`。
- Google social 登录返回 URL 的 `redirect_uri` 为 `https://dev.illumi-family.com/api/auth/callback/google`。
- 新增测试通过，无新增 lint error。

## Review（已完成）
- 发现问题：
  - `POST /api/auth/sign-up/email` 与 `POST /api/auth/sign-in/email` 返回 `503 (1102)`。
  - `wrangler tail` 日志显示：`Worker exceeded CPU time limit`，触发点在 email/password 路径。
- 修复方案：
  - 为 Better Auth 的 `emailAndPassword.password` 注入自定义哈希实现，替换默认高开销 Scrypt。
  - 新增 `PBKDF2(SHA-256)` 哈希器：`src/worker/shared/auth/password-hasher.ts`。
  - 接入点：`src/worker/shared/auth/better-auth.ts`。
  - 新增测试：`src/worker/shared/auth/password-hasher.test.ts`。
- 验证结果：
  - `pnpm test`：通过（16/16）。
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）。
  - 重新部署 dev 成功，Version ID：`d2476fc7-44d9-4155-b4eb-d3a161d5b824`。
  - `POST /api/auth/sign-up/email` -> `200`。
  - `POST /api/auth/sign-in/email`（未验证）-> `403` + `EMAIL_NOT_VERIFIED`。
  - `POST /api/auth/send-verification-email` -> `200` + `{\"status\":true}`。
  - `POST /api/auth/sign-in/social` -> `200`，`redirect_uri=https://dev.illumi-family.com/api/auth/callback/google`。

---

# 2026-03-05 verify-email 回跳 Not Found 修复（dev）

## 任务清单
- [x] 复现用户提供的 verify-email URL 并抓完整重定向链
- [x] 定位根因：Worker 接管非 API 路径导致 `/users`、`/auth` 返回 404
- [x] 修复 Cloudflare 资产路由策略（仅 `/api/*` 先走 Worker）
- [x] 修正前端验证邮件回跳路径（`/auth`）
- [x] 部署并复测 `/auth`、`/users`、verify-email 跳转链

## 验收标准
- 直达 `/auth`、`/users` 返回 SPA `index.html`（200），不再是 404。
- `verify-email` 链接返回 `302 -> /users` 后，最终落到 SPA 页面（200）。
- `/api/*` 未知路径仍保持 JSON 404 响应。

## Review（已完成）
- 根因：
  - `verify-email` API 实际成功，返回 `302 /users`；
  - 但非 API 路径被 Worker 默认 404 接管，导致用户看到 Not Found。
- 修复项：
  - `wrangler.json`：`assets.run_worker_first` 调整为 `["/api/*"]`。
  - `src/react-app/routes/auth-page.tsx`：注册/重发验证邮件 `callbackURL` 从 `/users` 改为 `/auth`。
  - `src/worker/app.ts`：移除非 API catch-all 资产转发逻辑，保留 `/api/*` 结构化 404。
- 线上验证：
  - `/auth` -> `200`（HTML）。
  - `/users` -> `200`（HTML，交由前端路由守卫处理登录态）。
  - 用户提供的 `verify-email` 链接 -> `302 /users` -> `200`（HTML）。
  - `/api/does-not-exist` -> `404` JSON（`ROUTE_NOT_FOUND`）。
  - 部署版本：`6b352bd3-b7aa-46dd-8c7d-77241ac7571c`。

---

# 2026-03-05 官网设计规划任务（基于官网设计想法文档）

## 任务清单
- [x] 阅读 `docs/官网设计想法.md`，提炼品牌定位、核心文案与区块结构
- [x] 基于 `ui-ux-pro-max` 检索 product/style/typography/color/landing/ux/stack 设计依据
- [x] 对齐当前前端实现结构（`home-page.tsx` / `home-page.data.ts` / `index.css`）
- [x] 产出可直接给 Claude Code 执行的详细设计与实施规划文档
- [x] 回填任务 Review，明确本轮仅输出规划，不改业务实现

## 验收标准
- 新增的规划文档覆盖：视觉系统、信息架构、区块规格、组件拆分、数据模型、阶段实施、验收与风险。
- 规划内容与 `docs/官网设计想法.md` 的核心文案与设计方向一致，不偏离“新中式 + 家风家学”基调。
- 文档可直接作为 Claude Code 的执行输入，包含文件级落地建议与验证命令。
- 本轮不修改业务代码，仅新增规划文档与任务台账。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-05-official-website-design-implementation-plan.md`
- 规划覆盖：
  - 将原始想法映射为可执行官网 IA（Hero/理念/日思/故事/共学/About/Footer）。
  - 输出品牌 token（配色/字体/背景/动效）与 A11y 基线。
  - 给出 Claude Code 级别文件拆分方案（section 组件化 + 数据驱动）。
  - 给出分阶段实施路径（Phase 0-4）与明确验收标准。
  - 补充风险与回滚策略，避免字体授权、素材缺失和性能问题阻塞。
- 变更边界：
  - 本轮仅新增规划文档与 `tasks/todo.md` 记录，未变更运行时代码。

---

# 2026-03-06 Admin CMS 架构深度方案（白名单鉴权 + 子域 + Markdown/R2）

## 任务清单
- [x] 复核现有架构约束（单 Worker、Better Auth、D1/KV/R2、/api 分层）
- [x] 设计“admin 子域 + 白名单鉴权”的端到端链路（登录、会话、路由保护、跨域约束）
- [x] 设计“内容结构 + Markdown + R2 图片”的统一数据模型（含版本与发布态）
- [x] 合并为最优目标架构并给出分阶段实施方案（优先实现层，弱化业务文案）
- [x] 落地设计文档到 `docs/plans/` 并回填 review

## 验收标准
- 输出文档清晰区分：现状架构、目标架构、实现路径、风险与回滚。
- 同时覆盖两条主线：鉴权与子域、内容模型与存储。
- 方案与仓库现有技术栈一致，不引入不必要新基础设施。
- 本轮仅产出方案文档，不修改运行时代码与线上配置。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-06-admin-cms-architecture-plan.md`
- 覆盖重点：
  - 将“白名单鉴权 + admin 子域”与“Markdown + R2 + D1 版本化模型”统一为单一目标架构。
  - 明确了模块级落点（`app.ts`、`session.ts`、`better-auth.ts`、`schema/cms.ts`、`modules/admin|content`）。
  - 给出从域名/鉴权到数据模型/API/缓存/发布/回滚的分阶段实现路径。
- 决策结论：
  - 推荐在当前单 Worker 体系下采用 `admin 子域 + 白名单双层鉴权 + D1结构版本 + R2资产 + KV缓存`。
- 变更边界：
  - 本轮未改任何运行时代码、未执行 migration、未改线上环境，仅新增方案文档与任务记录。

---

# 2026-03-06 Admin CMS 实施计划编写任务（Execution Plan）

## 任务清单
- [x] 基于架构文档拆解可执行实施任务（TDD + 小步提交）
- [x] 明确每个任务的文件路径、命令、预期输出与验收标准
- [x] 生成 implementation plan 文档到 `docs/plans/`
- [x] 回填 review（说明本轮仅编写计划，不改运行时代码）

## 验收标准
- 计划文档可直接按任务执行，不依赖口头补充说明。
- 每个任务包含：测试先行、最小实现、验证命令、提交建议。
- 计划与当前仓库技术栈、目录结构和环境模型一致。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-06-admin-cms-implementation-plan.md`
- 计划特征：
  - 按 `writing-plans` 规则输出了可执行任务：每个任务包含文件列表、失败测试、执行命令、最小实现、验证与 commit 建议。
  - 覆盖完整实施链路：白名单鉴权、admin 子域、CMS 表结构与迁移、内容发布接口、R2 资产、前端接入、文档同步、部署验证。
  - 执行粒度偏小步（TDD + 频繁提交），可直接交由执行型会话逐任务落地。
- 变更边界：
  - 本轮仅新增实施计划文档并更新任务记录，未修改运行时代码、未执行迁移和部署。

---

# 2026-03-06 Admin CMS 实施执行任务（Subagent-Driven）

## 任务清单
- [x] Task 1 admin-access 工具与测试
- [x] Task 2 requireAdminSession 与测试
- [x] Task 3 `/api/admin/me` 路由与基础守卫
- [x] Task 4 better-auth admin host/origin 放行
- [x] Task 5 CMS schema + Zod 契约
- [x] Task 6 migration 生成并迁移 dev（含首页四分块 seed）
- [x] Task 7 `/api/content/home` + KV 缓存
- [x] Task 8 admin 内容草稿/发布 API
- [x] Task 9 admin 资产上传 + 公网资产读取 API
- [x] Task 10 前端 API/query 扩展
- [x] Task 11 `/admin` 页面与首页改 API 数据源
- [x] Task 12 wrangler/docs 同步 + 全量验证 + dev 部署 smoke check

## 验收标准
- 仅白名单且邮箱已验证用户可访问 `/api/admin/*`。
- `admin.illumi-family.com` / `admin-dev.illumi-family.com` 已纳入 Wrangler 路由。
- 首页四分块内容由 `/api/content/home` 驱动，支持后台草稿/发布。
- R2 资产上传与读取链路可用（未登录访问 admin 上传接口应 401）。
- `lint + test + build + check + check:prod` 均通过。

## Review（已完成）
- 关键实现：
  - 新增 admin 鉴权工具与中间件：`admin-access.ts`、`requireAdminSession`。
  - 新增 API 模块：`/api/admin/*`、`/api/content/*`。
  - 新增 CMS 数据模型与迁移：`cms_entries`、`cms_revisions`、`cms_assets`、`cms_entry_assets`。
  - 新增前端 `/admin` 页面与首页内容 API 化读取。
  - 更新 `wrangler.json` admin 路由与架构文档同步。
- 关键验证：
  - `pnpm run lint`：通过（仅 `worker-configuration.d.ts` 既有 warnings）。
  - `pnpm test`：通过（12 files / 31 tests）。
  - `pnpm run build`：通过。
  - `pnpm run check`、`pnpm run check:prod`：通过。
  - `pnpm run db:migrate:dev`：通过（`0002_yummy_hairball.sql` 应用成功）。
  - `pnpm run deploy:dev`：通过，Version `e0806861-4c36-4ca9-bbef-6aa448634b82`。
  - smoke:
    - `GET https://dev.illumi-family.com/api/health` -> 200 (`appEnv=dev`)
    - `GET https://dev.illumi-family.com/api/content/home` -> 200（返回四分块内容）
  - `GET https://admin-dev.illumi-family.com/api/admin/me`（未登录）-> 401
  - `POST https://admin-dev.illumi-family.com/api/admin/assets/upload`（未登录）-> 401

---

# 2026-03-06 C 端/Admin 交互流程与 Markdown/图片处理增强

## 任务清单
- [x] 启动子 agent 执行 C 端与 Admin 端交互/UI 设计改造
- [x] 新增通用 Markdown 渲染组件并接入 C 端核心文案位点
- [x] 增强 Admin 编辑流程（分步引导、编辑/预览分栏、即时 C 端预览）
- [x] 接入 Admin 图片上传闭环（上传、生成 URL、插入 markdown 片段）
- [x] 扩展前端 API 客户端与测试（`uploadAdminAsset`）
- [x] 执行 lint/test/build/check 与 dev 部署 smoke 验证

## 验收标准
- C 端在不破坏现有布局前提下支持 markdown 基本语法与图片渲染。
- Admin 端形成可操作流程：选分块 -> 编辑 -> 上传图 -> 保存草稿 -> 发布。
- 上传后可获得资产 URL 和 markdown 片段并可插入正文。
- 质量门禁与 dev 链路验证通过。

## Review（已完成）
- 主要前端改动：
  - 新增：`src/react-app/components/common/markdown-renderer.tsx`
  - 重构：`src/react-app/routes/admin-page.tsx`
  - 接入 markdown 渲染：
    - `src/react-app/routes/home/sections/philosophy-section.tsx`
    - `src/react-app/routes/home/sections/daily-notes-section.tsx`
    - `src/react-app/routes/home/sections/stories-section.tsx`
    - `src/react-app/routes/home/sections/colearning-section.tsx`
    - `src/react-app/routes/home/sections/about-section.tsx`
  - API 客户端扩展：
    - `src/react-app/lib/api.ts`
    - `src/react-app/lib/api.test.ts`
- 交互结果：
  - Admin 页面增加 5 步流程引导、Markdown 预览、C 端即时预览、图片上传并插入正文。
  - C 端核心长文本字段支持 markdown（标题/粗体/链接/列表/图片）渲染。
  - 首页内容 API 异常时展示兜底提示并继续使用 fallback 内容。
- 验证结果：
  - `pnpm run lint`：通过（仅既有 `worker-configuration.d.ts` warnings）。
  - `pnpm test`：通过（12 files / 32 tests）。
  - `pnpm run build`：通过。
  - `pnpm run check`：通过。
  - `pnpm run deploy:dev`：通过，Version `3e34a49d-6e6c-4de5-86d7-eca6d0918e32`。
  - smoke：
    - `HEAD https://admin-dev.illumi-family.com/admin` -> 200
    - `HEAD https://dev.illumi-family.com/` -> 200
    - `GET https://dev.illumi-family.com/api/content/home` -> 200
# 2026-03-06 Admin UIUX + 可视化内容编辑器调研与方案整理

## 任务清单
- [x] 读取项目 playbook 与现有 admin/C 端内容链路代码，确认痛点与约束
- [x] 调研市面高质量 admin 方案（开源/商业模板、设计系统、可维护性）
- [x] 调研可视化编辑器方案（Tiptap / Lexical / Milkdown / MDXEditor 等）
- [x] 评估“图片上传到 R2 并嵌入内容”端到端方案与安全边界
- [x] 输出适配当前仓库的分阶段实施方案（含 C 端渲染契约调整）
- [x] 回填 review（结论、推荐栈、风险、下一步）

## 验收标准
- 输出至少 3 套 admin 方案与 3 套编辑器方案，包含优劣和适配度结论。
- 明确给出推荐路线（MVP 与升级路线）及不推荐项。
- 给出当前仓库对应的改造边界：前端、Worker API、DB schema、渲染契约。
- 给出可执行里程碑和回滚点。

## Review（已完成）
- 当前实现问题（基于仓库代码）：
  - Admin 编辑入口仍是 `Textarea` + 手工 JSON，主要在 `src/react-app/routes/admin-page.tsx`。
  - Markdown 渲染是自研子集解析器，语法覆盖有限，位置在 `src/react-app/components/common/markdown-renderer.tsx`。
  - 资产上传已接 R2，但是 JSON Base64 传输，链路可优化（体积膨胀/内存占用），后端在 `src/worker/modules/admin/admin.service.ts`。
  - C 端主要消费 `contentJson`，`summaryMd/bodyMd` 目前未形成统一契约渲染。
- Admin 方案调研结论（截至 2026-03-06）：
  - 推荐顺序：React-Admin > Refine > shadcn 自建后台壳 > CoreUI > Ant Design Pro（换栈成本高）。
  - 结合当前 `React + Vite + TanStack`，React-Admin 的集成确定性最高；Refine 灵活但 TanStack Router 需要额外适配层。
- 编辑器方案调研结论（截至 2026-03-06）：
  - 推荐主方案：MDXEditor（Markdown 一等输入输出 + 官方图片上传回调，和当前 API 契约最匹配）。
  - 备选：Toast UI（成熟双模）、Tiptap（能力强但官方 Markdown 扩展为 Beta）。
  - 不建议当前阶段选 Lexical 纯自建链路（工程成本高，收益滞后）。
- 推荐分阶段实施：
  - Phase 1（1-2 周）：替换 admin 编辑器为 MDXEditor，接入图片上传并自动插入 URL；保留现有 API 契约。
  - Phase 2（1 周）：C 端渲染统一到标准 Markdown 渲染库并做 XSS 防护，消除“编辑端与展示端语法漂移”。
  - Phase 3（1-2 周）：升级后台信息架构（资产库、草稿/发布差异视图、内容校验），再评估是否引入 React-Admin 或继续 shadcn 自建。
- 风险与回滚：
  - 风险：编辑器语法超出 C 端渲染支持；大图上传影响体验；历史内容兼容问题。
  - 回滚：保持 `summaryMd/bodyMd` 字段与接口不变，编辑器可按 feature flag 回退到旧 `Textarea`。

# 2026-03-06 React 可视化 Markdown 编辑器 + 图片上传候选调研（官方文档）

## 任务清单
- [x] 锁定候选与评估维度（Markdown 双向、图片上传、耦合成本、风险）
- [x] 阅读并摘录至少 5 个候选的官方文档证据
- [x] 基于当前仓库技术栈评估接入成本与改造边界
- [x] 给出推荐方案与最小实现路径（MVP）
- [x] 回填 review（结论、证据链接、适用/不适用场景）

## 验收标准
- 至少覆盖 5 个候选方案，并给出官方文档链接。
- 每个候选都回答：Markdown 双向能力、图片上传方式、项目耦合成本、风险点。
- 明确推荐 1 个主方案 + 备选方案，并给出最小落地路径。

## Review（已完成）
- 覆盖候选（6 个）：
  - Tiptap
  - MDXEditor
  - Lexical + `@lexical/markdown`
  - Milkdown
  - Plate
  - Toast UI Editor
- 当前项目适配结论：
  - 现状为 React 19 + TanStack Query + 自研 `MarkdownRenderer` + 既有上传接口 `POST /api/admin/assets/upload` 与资产访问 `GET /api/content/assets/:assetId`。
  - “Markdown 作为内容主存”是当前 CMS 契约核心，因此优先级应是“Markdown 双向稳定性 > 纯可视化能力”。
  - 推荐主方案：MDXEditor（Markdown-first + 图片上传回调直连现有 API，改造面最小）。
  - 备选方案：Tiptap（能力强但 Markdown 扩展标注 Beta，适合后续富文本增强阶段）。
- 风险提示：
  - 现有 `MarkdownRenderer` 仅支持 Markdown 子集；无论选型如何，若编辑器输出语法超出现有渲染能力，会出现“编辑可见、C 端显示不一致”。
  - 若未来改走“R2 公网 URL 直链”，需补齐域名策略与缓存策略，避免后续 URL 契约再次变更。

# 2026-03-06 Admin 前端需求与目标文档沉淀（按 design-taste-frontend）

## 任务清单
- [x] 明确本轮范围：暂停模板选型，先固定需求、目标和验收标准
- [x] 读取 `design-taste-frontend` 技能规则并映射到本项目约束
- [x] 输出需求目标文档（含 UI/UX 指标、编辑器目标、发布链路目标、C 端一致性目标）
- [x] 在文档中给出分阶段改造边界（MVP/增强）与风险回滚
- [x] 回填 review（文档路径与关键结论）

## 验收标准
- 文档明确 `In Scope / Out of Scope`，且不包含模板迁移讨论。
- 文档给出可执行指标：体验指标、性能指标、一致性指标、可访问性指标。
- 文档将 `design-taste-frontend` 规则转为项目级 UI 规范与组件约束。
- 文档可直接作为下一步实现计划输入。

## Review（已完成）
- 文档产物：
  - `docs/plans/2026-03-06-admin-frontend-requirements-and-design-taste-spec.md`
- 关键结论：
  - 当前阶段先做“需求与标准固化”，不做模板切换决策。
  - 后续实现以 `shadcn + Tailwind v4 + design-taste-frontend` 规则作为主设计约束。
  - 编辑器目标以“可见编辑 + 上传即嵌入 + C 端一致渲染”为主线，先保留现有 API 契约。

# 2026-03-06 Admin Frontend 实施任务（基于 design-taste 规范）

## 任务清单
- [x] 梳理 Admin 前端改造边界并确定最小可交付（MVP）
- [x] 重构 `/admin` 信息架构（左侧对象导航 + 中央编辑 + 右侧预览/发布）并补齐 loading/empty/error/success 状态
- [x] 落地 Markdown 可见编辑器能力（工具栏 + 视图切换 + 白名单语法约束）
- [x] 优化图片上传与正文插入闭环（上传、失败重试、插入反馈）
- [x] 增加关键前端回归测试（Markdown 白名单/编辑行为）
- [x] 执行验证（`pnpm test` + `pnpm run lint` + `pnpm run build`）
- [x] 回填 review（变更文件、验证结果、已知风险）

## 验收标准
- `/admin` 页面符合“非对称编辑台”布局：移动端单列、桌面端多区域，无横向滚动。
- `summaryMd/bodyMd` 支持可见编辑（至少标题/加粗/列表/链接/图片）并支持源码视图切换。
- 编辑器输出受白名单约束；不支持语法在保存前有明确阻断提示。
- 图片上传支持失败提示与重试，成功后可一键插入正文并即时预览。
- 保持现有 API 契约不变，保存/发布链路可继续使用。

## Review（已完成）
- 设计实现：
  - 采用三栏不对称工作台（方案 A）：左侧内容分块导航 + 中央编辑 + 右侧预览与发布。
  - 保持移动端单列退化，`contentJson` 折叠显示，关键操作按钮具备 `active:scale-[0.98]` 触感反馈。
- 关键功能：
  - 新增可复用 Markdown 编辑器组件，支持工具栏（H2/H3/加粗/列表/链接/图片）与“可见/源码”视图切换。
  - 新增 Markdown 白名单校验（代码块/行内代码/引用/分割线/表格/HTML 标签阻断），保存前强校验。
  - 优化上传流程：上传失败可重试，成功后一键插入正文并即时预览。
  - 升级渲染器：支持有序列表，补齐链接与图片 URL 安全约束，避免危险协议注入。
  - 方案选择收敛为 A 版，`/admin` 固化为三栏不对称工作台并移除临时对比路由入口。
- 变更文件：
  - 新增 `src/react-app/components/admin/markdown-editor.tsx`
  - 新增 `src/react-app/lib/markdown-editor.ts`
  - 新增 `src/react-app/lib/markdown-editor.test.ts`
  - 新增 `src/react-app/components/common/markdown-renderer.test.ts`
  - 更新 `src/react-app/routes/admin-page.tsx`
  - 更新 `src/react-app/components/common/markdown-renderer.tsx`
  - 更新 `tasks/todo.md`
- 验证结果：
  - `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。
  - `pnpm test` 通过（14 files / 41 tests）。
  - `pnpm run build` 通过。
- 已知风险：
  - 当前白名单策略为前端校验，后续可在 Worker 侧增加同构校验以避免绕过前端直接写入风险。
# 2026-03-06 /admin UXUI 优化任务（design-taste-frontend）

## 任务清单
- [x] 梳理 `/admin` 当前信息架构与关键交互断点（加载、错误、空态、发布动作）
- [x] 重构页面主布局层级（顶部状态摘要、左侧导航、中心编辑、右侧控制）并提升可读性
- [x] 优化关键操作区 UX（图片上传、JSON 折叠区、发布控制、反馈区域）并补齐可访问性细节
- [x] 优化 `MarkdownEditor` 工具条与双视图体验，统一交互反馈和移动端表现
- [x] 运行最小验证（lint + build）并回填 review（文件清单、结果、剩余风险）

## 验收标准
- `/admin` 在桌面端和移动端均保持清晰的信息层级与稳定布局，无明显拥挤或错位。
- 编辑、上传、保存、发布的状态反馈可被快速识别（含 loading/error/empty）。
- 表单与操作控件具备一致的交互反馈（hover/focus/active），并符合现有设计体系。
- 不改变现有 API 行为与数据结构，仅做 UX/UI 与可用性增强。

## Review（已完成）
- 变更文件：
  - 更新 `src/react-app/routes/admin-page.tsx`
  - 更新 `src/react-app/components/admin/markdown-editor.tsx`
  - 更新 `tasks/todo.md`
- UX/UI 结果：
  - `/admin` 新增“未保存改动/JSON 状态/最近更新时间”摘要，信息层级更清晰。
  - 发布区新增“可发布条件”清单（JSON、Markdown、标题、保存状态、版本存在性），发布按钮与条件联动。
  - 移动端新增底部 sticky 操作条（保存/发布），缩短编辑到提交路径。
  - 图片上传区增加已选文件信息与就地错误反馈；`contentJson` 区改为带状态折叠并支持“格式化/重置模板”。
  - `MarkdownEditor` 工具栏改为可横向滚动，触控面积提高，源码模式可读性提升，并补齐 `aria-pressed`。
- 验证结果：
  - `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。
  - `pnpm run build` 通过。
- 已知风险：
  - 当前“草稿已保存”由前端与最新版本快照比对推导，极端并发编辑场景仍建议后续加服务端版本锁提示。

# 2026-03-06 /admin 二次收敛（极简编辑流）

## 任务清单
- [x] 按用户反馈移除非必要模块（编辑流程、预览链路、结构化 JSON、发布说明）
- [x] 将 `MarkdownEditor` 简化为“单编辑态”（无源码切换、无预览区）
- [x] 把图片上传能力融合进正文 Markdown 编辑区域
- [x] 收敛发布区为纯双按钮（保存草稿 / 发布）并保持原有行为
- [x] 保障四大内容模块独立入口与各自文案/占位语义
- [x] 运行 `lint + build` 并回填 review

## 验收标准
- `/admin` 页面以“分块切换 + 编辑 + 双按钮提交”为主，不保留教学型或冗余说明模块。
- Markdown 编辑全程只有一个编辑视图，不出现预览与源码双态切换。
- 图片上传无需单独独立板块，能在正文编辑区直接完成上传与插入。
- 不改动后端 API 契约与核心保存/发布逻辑。

## Review（已完成）
- 变更文件：
  - 更新 `src/react-app/routes/admin-page.tsx`
  - 更新 `src/react-app/components/admin/markdown-editor.tsx`
  - 更新 `tasks/todo.md`
  - 更新 `tasks/lessons.md`
- 本轮收敛结果：
  - 删除“编辑流程说明 / 预览区 / 源码切换 / 结构化 JSON / 右侧发布说明”等非必要模块，页面聚焦“选模块 + 编辑 + 提交”。
  - `MarkdownEditor` 仅保留一个编辑态（工具栏 + 文本框），不再显示双视图或预览。
  - 图片上传融合到正文编辑区域，支持“选图 -> 上传 -> 插入正文”一条路径。
  - 发布动作收敛为两个按钮（保存草稿、发布），无额外发布说明面板。
  - 四大内容模块保留独立入口，并补充模块级占位文案，保证各模块编辑语义独立。
- 验证结果：
  - `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。
  - `pnpm run build` 通过。
- 已知风险：
  - 当前界面移除了结构化 JSON 直编能力；若后续需要精细维护 `contentJson`，需另开“高级模式”入口。

# 2026-03-06 /admin 四套独立字段编辑（可扩展）

## 任务清单
- [x] 将 `contentJson` 编辑从通用模式改为四套独立字段编辑器
- [x] 为四个模块分别落地独立字段集合与增删行交互
- [x] 将图片上传能力内嵌进每个 Markdown 字段编辑器
- [x] 保持保存/发布 API 行为不变，仅替换前端编辑体验
- [x] 运行 `lint + build` 验证

## 验收标准
- 四个模块具备各自独立编辑表单，不再依赖统一 `JSON` 或统一 `Markdown` 字段组合。
- 每个模块字段支持面向扩展的增删（items/methods/benefits）。
- 图片上传与 Markdown 编辑在同一编辑单元内完成，不需额外独立上传面板。
- 现有保存草稿/发布接口可继续使用，不改契约。

## Review（已完成）
- 变更文件：
  - 更新 `src/react-app/routes/admin-page.tsx`
  - 更新 `src/react-app/components/admin/markdown-editor.tsx`
  - 更新 `tasks/todo.md`
- 本轮结果：
  - `/admin` 新增四套独立字段编辑器：
    - 理念：`intro + items(title, description)`
    - 日思：`items(date, title, summary, tags)`
    - 故事：`items(title, summary, publishDate, duration, status, link)`
    - 共学：`intro + methods + benefits + caseHighlight(cta)`
  - 每套表单都支持增删条目，便于后续继续扩展字段。
  - `MarkdownEditor` 现支持可选内嵌上传回调，完成“上传图片 -> 插入 Markdown”闭环。
- 验证结果：
  - `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。
  - `pnpm run build` 通过。

# 2026-03-07 Kysely 本地 warning 修复（numUpdatedOrDeletedRows）

## 任务清单
- [x] 定位 warning 触发链路并确认是否可通过官方升级消除
- [x] 以最小改动移除触发 warning 的旧字段返回（仅影响 D1 Kysely 适配层）
- [x] 固化依赖补丁配置，确保 `pnpm install` 后仍生效
- [x] 运行最小验证并确认无新增类型/构建错误
- [x] 回填 Review（变更文件、验证结果、风险与回滚方式）

## 验收标准
- 本地运行时不再出现 `kysely:warning: outdated driver/plugin detected` 提示。
- 不改变业务 SQL 执行结果（`insertId`、`rows`、`numAffectedRows` 保持不变）。
- 变更可追踪、可复现，重新安装依赖后仍自动应用。

## Review（已完成）
- 变更文件：
  - 更新 `package.json`
  - 更新 `pnpm-lock.yaml`
  - 新增 `patches/@better-auth__kysely-adapter@1.5.3.patch`
  - 更新 `tasks/todo.md`
- 根因定位：
  - `kysely@0.28.11` 在查询执行层检测到 `QueryResult.numUpdatedOrDeletedRows` 会打印 warning。
  - 当前 `@better-auth/kysely-adapter@1.5.3`（官方最新 `1.5.4` 仍相同）在 D1 方言返回结果中同时携带了 `numAffectedRows` 和 `numUpdatedOrDeletedRows`，触发该提示。
- 修复方案：
  - 使用 `pnpm patch` 对 `@better-auth/kysely-adapter@1.5.3` 打补丁，仅删除 D1 方言返回对象中的 `numUpdatedOrDeletedRows`，保留 `numAffectedRows`。
  - 在 `package.json` 增加 `pnpm.patchedDependencies`，确保后续 `pnpm install` 自动应用补丁。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/worker/shared/auth/better-auth.hosts.test.ts` 通过（3/3）。
  - `pnpm run lint` 通过（仅既有 `worker-configuration.d.ts` 2 条 warning）。
  - 运行最小复现脚本对比：
    - 未补丁方言：会输出 `kysely:warning: outdated driver/plugin detected...`
    - 补丁方言：输出 `WARN_ABSENT`（无该 warning）
- 风险与回滚：
  - 风险低：仅移除已废弃兼容字段，不影响当前 Kysely 推荐字段读取路径。
  - 回滚方式：删除 `patches/@better-auth__kysely-adapter@1.5.3.patch` 与 `package.json` 中 `pnpm.patchedDependencies` 配置后执行 `pnpm install`。

# 2026-03-13 全局安装 agent-reach 与 tavily web search（官方源校验）

## 任务清单
- [x] 按 `skill-installer` 流程确认官方来源与安装命令
- [x] 从 `openai/skills` 官方列表确认目标 skill 的准确路径/名称
- [x] 安装 `agent-reach` 与 `tavily web search` 到全局 `~/.codex/skills`
- [x] 校验安装落盘与来源，并回填 review

## 验收标准
- 两个 skill 均存在于 `~/.codex/skills` 对应目录。
- 安装来源可追溯到对应官方仓库路径，并提供一致性校验。
- 给出可复核命令与结果摘要。

## Review（已完成）
- 结论：
  - `openai/skills` 官方 curated 列表不包含 `agent-reach` / `tavily web search`。
  - 已改为从各自官方仓库安装：
    - `agent-reach` ← `Panniantong/Agent-Reach` 的 `agent_reach/skill`
    - `tavily-web-search` ← `tavily-ai/skills` 的 `skills/tavily/search`
- 安装命令：
  - `python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo Panniantong/Agent-Reach --path agent_reach/skill --name agent-reach --dest ~/.codex/skills`
  - `python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo tavily-ai/skills --path skills/tavily/search --name tavily-web-search --dest ~/.codex/skills`
- 落盘结果：
  - `~/.codex/skills/agent-reach/SKILL.md`
  - `~/.codex/skills/tavily-web-search/SKILL.md`
- 验真结果（SHA256）：
  - `agent-reach/SKILL.md` 本地与官方 raw 一致。
  - `tavily-web-search/SKILL.md` 本地与官方 raw 一致。
  - `tavily-web-search/scripts/search.sh` 本地与官方 raw 一致。

# 2026-03-18 Task 2 子代理：Phase 2（API + D1 + KV 国际化）

## 任务清单
- [x] D1 schema/migration：`cms_entries` 增加 `locale`，唯一约束改为 `(entry_key, locale)`，补 locale 索引与数据回填迁移
- [x] Drizzle schema 同步：`cmsEntries` 增加 `locale` 字段并更新索引定义
- [x] RED：补测试（`content.service.test.ts` locale fallback + `fallbackFrom`、`admin.service.test.ts` 缓存失效矩阵、`api/index` locale 参数透传）
- [x] Content API locale 化：`GET /api/content/home` 支持 locale alias/canonical，按 `(entry_key, locale)` 查询并在条目级回退 `zh-CN`
- [x] 响应契约更新：home payload 增加 `locale`、`fallbackFrom`；KV key 使用 `cms:home:published:v1:{locale}`
- [x] Admin locale 写入/发布链路：list/save/publish 支持 locale，禁止无 locale 写入，repository 显式按 `(entry_key, locale)`
- [x] 发布缓存失效矩阵：发布 `zh-CN` 失效 `zh-CN+en-US`；发布 `en-US` 仅失效 `en-US`
- [x] 前端对接：`api.ts`/`query-options.ts`/`admin-page.tsx` 带 locale 参数，admin UI 增加 ZH/EN 切换；首页类型同步新字段
- [x] 运行受影响测试并确保通过
- [x] 回填 Review（改动文件、测试命令结果、`git diff --stat`、未完成项）

## 验收标准
- `cms_entries` 在数据库层与 Drizzle 层都满足 `(entry_key, locale)` 唯一。
- `/api/content/home?locale=` 可接受 alias/canonical，并返回 `locale` 与按条目回退后的 `fallbackFrom`。
- Admin 的 list/save/publish 若缺失 locale 返回 400，且写入发布均落到对应 locale。
- 发布后 KV 失效行为严格符合矩阵。
- 受影响测试集全部通过。

## Review（已完成）
- 关键变更：
  - D1 migration 新增 `drizzle/migrations/0003_calm_ling.sql`，完成 `locale` 回填、唯一索引迁移与 locale 索引创建。
  - Content API 支持 `locale` alias/canonical 归一化，响应增加 `locale`/`fallbackFrom`，并按 locale 分片 KV key。
  - Admin list/save/publish 全链路接入 locale（query），save/publish 无 locale 直接 400，发布缓存失效按矩阵执行。
  - 前端 Admin 页面新增 ZH/EN 可见切换，list/save/publish 全部带 locale；Home content API 类型增加新字段。
- 验证结果：
  - `pnpm test -- src/worker/index.test.ts src/worker/modules/content/content.service.test.ts src/worker/modules/admin/admin.service.test.ts src/react-app/lib/api.test.ts` 通过（实际跑出全量 vitest，55/55 通过）。
  - `pnpm exec tsc --noEmit` 通过。

# 2026-03-18 Task 2 Review B 代码质量评审（本轮）

## 任务清单
- [x] 收集 Task 2 指定文件 diff 与上下文（含 migration、worker、react、tests）
- [x] 按关注点审查：locale 归一化/fallback、缓存失效矩阵、接口契约
- [x] 审查 migration 安全性（索引变更顺序、兼容性、可回滚性）
- [x] 审查可维护性（职责边界、重复逻辑、类型一致性）
- [x] 审查测试覆盖与断言脆弱点，形成风险分级结论
- [x] 回填 Review 结论到 `tasks/todo.md`

## 验收标准
- 输出包含 `✅ Approved` 或 `❌ Issues found` 二选一结论。
- 若有问题，按严重度给出 `文件:行号 + 问题 + 修复建议`。
- 结论覆盖用户指定四类关注点。

## Review（已完成）
- 结论：`❌ Issues found`（2 个中风险问题 + 2 个测试缺口）。
- 重点问题：
  - `drizzle/migrations/0003_calm_ling.sql` 先 `DROP` 旧唯一索引再 `CREATE` 新组合唯一索引，存在迁移窗口写入风险。
  - `src/react-app/routes/admin-page.tsx` mutation 成功回调使用闭包 `locale` 失效，可能在切换语言后失效错误 query key。
  - `src/worker/modules/admin/admin.controller.ts` list 端点对非法 locale 静默归一化，与 save/publish 的严格校验契约不一致。
  - `src/react-app/lib/api.test.ts` 未覆盖新增 `locale/fallbackFrom` 响应字段断言，契约回归探测不足。
- 补充验证：
  - `pnpm vitest src/worker/modules/content/content.service.test.ts src/worker/modules/admin/admin.service.test.ts src/react-app/lib/api.test.ts src/worker/index.test.ts` 通过（19/19）。
  - `pnpm vitest src/react-app/lib/query-options.test.ts` 通过（2/2）。

# 2026-03-18 静态资源与视频分发方案调研（brainstorming）

## 任务清单
- [x] Explore project context：核对仓库现状、架构文档、playbook、最近提交
- [x] Ask clarifying questions：一次一个问题，明确目标/约束/成功标准
- [x] Propose 2-3 approaches：给出可选路线、权衡与推荐
- [x] Present design：按架构/组件/数据流/风控/测试分段确认
- [x] Write design doc：落盘 `docs/plans/2026-03-18-static-assets-video-strategy-design.md`
- [x] Transition to implementation：调用 writing-plans 生成实施计划

## 验收标准
- 给出可执行的资源存储与分发策略，覆盖成本、播放体验、防盗链、CDN、运维复杂度。
- 明确 dev/prod 环境资源隔离策略与回滚点。
- 形成阶段化路线：MVP 可落地，后续可扩展。

## Review（已完成）
- 产出文档：
  - `docs/plans/2026-03-18-static-assets-video-strategy-design.md`
  - `docs/plans/2026-03-18-static-assets-video-implementation-plan.md`
- 评审流程（subagent-driven-development）：
  - 规格评审：✅ `Spec compliant`（可进入实施计划）
  - 质量评审：首轮 ❌（5项问题）-> 修订后复审 ✅ `Approved`
- 关键修订：
  - 补齐签名 TTL 与缓存 TTL 协同规则（公开/非公开映射）。
  - 补齐 `dev/prod` 隔离、供应商切换序列与回滚动作。
  - 补齐告警阈值、频控与阶段验收测试矩阵。
  - 明确 B 站仅作为渠道，不与站内签名播放链路混用。

# 2026-04-16 视频上传/预览/列表/播放 UX 重构（ce:work）

## 任务清单
- [x] Unit 1: 重构 `/admin/videos` 页面骨架，抽离状态看板与视图模型
- [x] Unit 2: 实现单文件拖拽上传、上传进度、失败重试与 60s 混合刷新
- [x] Unit 3: 实现 Admin 双层预览（快速预览 + 沉浸弹窗）并保留就地动作
- [x] Unit 4: 重构 `/videos` 列表体验，保持直接弹窗播放
- [x] Unit 5: 补齐回归测试与中文文案键，验证边界不回归
- [x] 执行受影响测试并记录结果
- [x] 回填 Review（改动文件、测试结果、风险与后续项）

## 验收标准
- Admin 页面完成工作台化：上传任务区 + 状态看板 + 双层预览。
- 上传链路支持拖拽单文件，展示进度；失败可重试；上传后 60 秒每 3 秒自动刷新。
- `/videos` 保持“列表 -> 弹窗播放”路径，并具备 loading/empty/error 状态。
- 关键业务护栏不回归：Admin 受鉴权保护、仅 `ready` 可发布、公网仅展示可公开播放集合。
- 受影响测试通过。

## Review（已完成）
- 新增/重构核心前端模块：
  - Admin 组件：`video-workbench-header.tsx`、`upload-dropzone.tsx`、`upload-task-panel.tsx`、`video-status-board.tsx`、`video-status-column.tsx`、`video-record-card.tsx`、`video-inline-preview.tsx`
  - Public 组件：`public-video-grid.tsx`、`public-video-card.tsx`
  - 状态与上传工具：`video-state.ts`、`video-upload-task.ts`
  - 播放器与页面：`video-player-modal.tsx`、`admin-videos-page.tsx`、`videos-page.tsx`
- 测试更新：
  - 新增：`video-state.test.ts`、`video-upload-task.test.ts`
  - 更新：`admin-videos-page.test.tsx`、`videos-page.test.tsx`
- i18n 更新：
  - `src/react-app/i18n/messages/zh-CN/common.json`
  - `src/react-app/i18n/messages/zh-CN/admin.json`
- 验证结果：
  - `pnpm test -- src/react-app/components/video/admin/video-state.test.ts src/react-app/lib/video-upload-task.test.ts src/react-app/routes/admin-videos-page.test.tsx src/react-app/routes/videos-page.test.tsx src/react-app/lib/api.test.ts src/worker/index.test.ts src/worker/modules/video/video.service.test.ts` 通过（实际 vitest 全量 26 files / 95 tests 全通过）。
  - `pnpm exec tsc --noEmit` 通过。
- 已知后续事项（非阻塞）：
  - 目前 `en-US` 未同步新增文案键（按本次范围仅 `zh-CN`）。
  - 快速预览当前为点击触发且单活跃，后续可按真实运营反馈评估是否加 hover 或键盘快捷流。

# 2026-04-17 三套环境隔离说明文档补充（已完成）

## 任务清单
- [x] 核对 `technical-architecture` 与 runbook、`wrangler.json`、`package.json` 的环境事实一致性
- [x] 在 `docs/core/technical-architecture.md` 补充 `local/dev/prod` 隔离与共用明细（重点 D1/KV/R2/Stream）
- [x] 在 `docs/core/biz-background.md` 增加环境口径摘要与文档指引
- [x] 回填 Review（变更摘要与结论）

## 验收标准
- 文档明确回答 `local` 是否与 `dev/prod` 共用资源，不再存在歧义。
- 文档明确列出 D1/KV/R2/Stream 在 `local/dev/prod` 的隔离或共用情况。
- 内容与当前仓库配置保持一致（`wrangler.json` / `package.json` / runbook）。

## Review（已完成）
- 已完成：在 `docs/core/technical-architecture.md` 新增 `5.5 local / dev / prod 资源隔离明细（D1 / KV / R2 / Stream）`，明确 local 与远端环境关系及共用点。
- 已完成：在 `docs/core/biz-background.md` 新增 `12.1 当前环境口径（协作必读）`，提供业务侧可读摘要并指向技术权威文档。
- 已完成：口径与以下事实源对齐：`wrangler.json`、`package.json` scripts、`docs/runbooks/development-deployment-cicd-runbook.md`。

# 2026-04-17 ce:brainstorm Stream 跨环境复用与重复上传降本规划（已完成）

## 任务清单
- [x] 复核当前上传链路事实（local 上传是否写本地 D1、是否创建真实 Stream 视频）
- [x] 形成 2-3 个可选方案并给出推荐
- [x] 产出 requirements 文档（包含范围边界、成功标准、关键决策）
- [x] 回填 Review（结论与下一步）

## 验收标准
- 文档明确回答“如何避免 local/dev/prod 重复上传造成 Stream 成本增加”。
- 文档明确兼容现有环境隔离原则（D1/KV/R2 继续隔离，避免环境串库）。
- 文档可直接作为 `/ce:plan` 输入，不需要再补关键产品决策。

## Review（已完成）
- 已完成：新增需求文档 `docs/brainstorms/2026-04-17-stream-video-reuse-across-environments-requirements.md`。
- 已完成：在文档中给出 3 个方案并推荐“D1 隔离不变 + Stream 跨环境复用导入”。
- 已完成：固化 `R1-R15`、成功标准、范围边界、关键决策与待规划问题，满足 `/ce:plan` 输入条件。
- 已完成：补充详细改造规划 `docs/plans/2026-04-17-005-feat-stream-video-reuse-across-environments-plan.md`，含 Implementation Units、测试矩阵、发布顺序与风险缓解。
- 已完成：根据用户纠正更新口径为“三环境都支持新上传，不做环境级上传禁用；复用导入为推荐路径”。

# 2026-04-17 首页 Hero 精简与高级感改造（已完成）

## 任务清单
- [x] 审阅 `hero-section.tsx` 与首页上下文，锁定最小改动范围
- [x] 重构 Hero 布局为精简的非居中分栏结构，减少整体视觉篇幅
- [x] 保留现有品牌配色与信息语义，增强材质层次与细节质感
- [x] 运行最小验证（受影响测试或 lint）并记录结果
- [x] 回填 Review（改动摘要、验证结果、风险）

## 验收标准
- Hero 区块整体高度与文案体积较当前版本明显收敛，不再显得“过大”。
- 视觉风格延续现有品牌，但细节更克制、层次更高级。
- 不引入新依赖，不影响首页其他 section 的结构与交互。

## Review（已完成）
- 已完成：仅改动 `src/react-app/routes/home/sections/hero-section.tsx`，保持数据契约不变（`title/subtitle/descriptionLines`）。
- 已完成：Hero 从“大段单列文案”改为“左主文案 + 右精简信息块”的非居中分栏结构，收敛标题字号与上下留白，整体篇幅更紧凑。
- 已完成：在不引入新依赖的前提下增强材质细节（内阴影、细线高光、柔和渐变），延续现有品牌暖色基调并提升质感。
- 已完成：描述文案自动拆分为导语与条目（最多 2 条），避免首屏文本块过长导致视觉臃肿。
- 已完成：根据用户点名调整句位，确保“以经典润心，以家风养正，以家为塾，以行践学。”作为右侧模块第一句。
- 已完成：根据用户最终口径收敛为“左侧仅标题+副标题，右侧模块承载 3 句说明文案”，不再在左侧渲染导语句。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx`（通过，3 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/hero-section.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` 2 条 warning）
- 风险与回滚点：该改动未调整内容来源与交互逻辑，仅为 Hero 布局重排；若后续需要进一步压缩移动端高度，可优先下调 `md:` 前字号与 `py`，无需回滚结构。

# 2026-04-17 首页 Hero 样式二次重设计（已完成）

## 任务清单
- [x] 重做 Hero 栅格与对齐策略，修复左右模块不齐
- [x] 压缩 Hero 纵向占位（字号层级、留白、右侧模块节奏）
- [x] 保持文案规则：左侧仅标题/副标题，右侧展示 3 句说明
- [x] 运行最小验证（home-page test + hero lint）
- [x] 回填 Review（改动摘要、验证结果、风险）

## 验收标准
- Hero 视觉高度明显低于当前版本，不再显得“占据太多空间”。
- 左右模块在桌面端有明确对齐关系，不再出现漂浮或错位感。
- 风格精致、克制，且不引入新依赖、不改动数据来源。

## Review（已完成）
- 已完成：仅改动 `src/react-app/routes/home/sections/hero-section.tsx`，未引入新依赖、未修改数据契约。
- 已完成：将 Hero 栅格改为 `md:items-start` 顶部对齐，修复左标题区与右说明区的视觉错位。
- 已完成：压缩纵向占位（`py/gap` 收紧 + 标题层级重配），整体高度显著下降，首屏更干净。
- 已完成：右侧从厚重卡片改为轻量序列面板（细竖线 + 行分隔 + 紧凑行高），减少“占面积”感并提升精致度。
- 已完成：根据用户“更简版”要求再次做减法，移除右侧卡片容器感与背景装饰层。
- 已完成：按最新要求去掉右侧编号与细分割线，右侧改为纯文本三行说明。
- 已完成：文案规则保持不变：左侧仅标题/副标题；右侧固定承载前三句说明。
- 已完成：验证命令
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx`（通过，3 tests）
  - `pnpm run lint -- src/react-app/routes/home/sections/hero-section.tsx`（通过；仅仓库既有 `worker-configuration.d.ts` 2 条 warning）
- 风险与回滚点：本次为纯样式重构，不影响业务逻辑；若后续仍需再压缩高度，可继续下调 `clamp` 上限与右侧行距，不需要回滚结构。
# 2026-04-30 首页首屏 Stream 单击即播与预备加载优化（已完成）

## 任务清单
- [x] 扫描首页首屏主视频现状与交互问题（灰屏/二次交互）
- [x] 产出方案对比并确认推荐方案（已确认 `preload="metadata"`）
- [x] 新建需求文档（brainstorm requirements）
- [x] 文档自审与交付下一步建议

## 验收标准
- 首屏视频仅需一次点击即可开始播放流程，不出现“灰屏后再首帧+播放按钮”的二次体验。
- 点击后若未就绪，保留首帧海报作为底图，并展示 loading 过渡层。
- 首页进入后默认开始视频预备加载，默认策略为 `preload="metadata"`。
- 文档可直接进入 `/ce:plan`，无需补充产品行为定义。

## Review（已完成）
- 已完成：产出独立需求文档 `docs/brainstorms/2026-04-30-homepage-main-video-single-click-stream-ux-requirements.md`。
- 已完成：方案对比覆盖 A/B/C 三种方向，并确定 B 为推荐方案（首屏即挂载 + `preload="metadata"` + poster 覆层兜底）。
- 已完成：文档内明确了单击即播约束、预备加载范围、可恢复错误态、指标要求与成功标准，可直接进入 `/ce:plan`。
# 2026-04-30 首页商务合作板块新增微信联系方式（进行中）

## 任务清单
- [x] 在首页商务合作数据模型中新增 `wechat` 字段
- [x] 在中英文商务合作内容中补充微信号 `13570380204`
- [x] 更新商务合作 section UI，新增微信展示
- [x] 更新受影响测试断言并执行最小验证
- [x] 回填 Review（改动、验证、风险/回滚点）

## 验收标准
- 首页“商务合作”板块明确展示“微信：13570380204”。
- 仅影响首页商务合作板块，不改动其他业务逻辑。
- 受影响测试通过。

## Review（已完成）
- 已完成：`src/react-app/routes/home-page.data.ts` 的 `HomeBusinessContactContent` 新增 `wechat` 字段，并在中英文商务合作数据都填入 `13570380204`。
- 已完成：`src/react-app/routes/home/sections/home-business-contact-section.tsx` 商务合作联系方式卡片从 2 列扩展为 3 列，新增 `WeChat` 展示卡片。
- 已完成：`src/react-app/routes/home-page.data.test.ts` 增加 `homeBusinessContactContent.wechat` 断言。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.data.test.ts` 通过（1 file, 5 tests）。
- 风险与回滚点：
  - 风险低，仅首页静态文案展示层改动，无接口或状态逻辑变更。
  - 如需回滚，撤销上述 3 个文件中的 `wechat` 相关改动即可。
# 2026-04-30 首页主视频加载态骨架屏优化（进行中）

## 任务清单
- [x] 在首页主视频启动 loading 场景替换“主视频加载中”可见文案为骨架屏交互
- [x] 保留无障碍可读提示（屏幕阅读器可感知加载中）
- [x] 补充/更新受影响测试断言，避免回归到纯文案 loading
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（改动、验证、风险与回滚点）

## 验收标准
- 主视频播放启动时，不再在画面上直接显示“主视频加载中”文本。
- 加载态具备明显但克制的骨架屏/闪光动效，不影响播放器容器比例。
- 现有测试保持通过，且新增断言覆盖关键加载态结构。

## Review（已完成）
- 改动文件：
  - `src/react-app/components/ui/skeleton.tsx`
  - `src/react-app/routes/home/sections/home-main-video-section.tsx`
  - `src/react-app/routes/home/sections/home-main-video-section.test.tsx`
- 实现结果：
  - 使用 shadcn CLI 生成并覆盖 `Skeleton` 组件（`pnpm dlx shadcn@latest add skeleton --overwrite -y`），供后续页面统一复用。
  - 首页查询阶段（`isLoading`）改为骨架屏结构，不再渲染可见“主视频加载中”文案。
  - 播放器启动阶段（用户触发播放后 `startupPhase=loading`）改为骨架遮罩，不再直接显示可见 loading 文案。
  - 两个 loading 场景均保留 `sr-only` 文本，确保屏幕阅读器仍可感知加载状态。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home/sections/home-main-video-section.test.tsx` 通过（1 file, 5 tests）。
  - `pnpm exec eslint src/react-app/routes/home/sections/home-main-video-section.tsx src/react-app/routes/home/sections/home-main-video-section.test.tsx` 通过。
- 风险与回滚点：
  - 风险较低，主要为 loading 视觉层变化，不影响视频播放状态机与 API 交互。
  - 如需回滚，恢复上述两个文件到本次改动前版本即可。

# 2026-04-30 隐藏中英文切换入口并默认中文（进行中）

## 任务清单
- [x] 移除首页语言切换入口渲染（桌面导航与移动端抽屉）
- [x] 移除 RootLayout 工具导航语言切换入口渲染
- [x] 将前台 i18n 初始化默认语言固定为 `zh-CN`
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（改动、验证、风险与回滚点）

## 验收标准
- 页面不再显示“中文 / English”切换入口。
- 首次进入站点默认展示中文文案（`zh-CN`）。
- 改动仅影响前台语言入口与默认语言初始化，不改后端接口行为。

## Review（已完成）
- 已完成：
  - `src/react-app/routes/home-page.tsx` 移除首页顶部（桌面）与移动端抽屉内 `LanguageSwitcher` 渲染。
  - `src/react-app/routes/root-layout.tsx` 移除工具导航区 `LanguageSwitcher` 渲染。
  - `src/react-app/i18n/config.ts` 将 i18n 初始化 `lng` 从 `detectLocale()` 调整为 `DEFAULT_LOCALE`（固定 `zh-CN`）。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx src/react-app/routes/home-page.data.test.ts src/react-app/routes/videos-page.test.tsx src/react-app/i18n/detector.test.ts` 通过（4 files, 14 tests）。
  - `pnpm exec tsc -p tsconfig.app.json --noEmit` 失败，仓库既有错误未解决：
    - `src/react-app/routes/home/components/section-heading.tsx`: `Badge` / `description` 未使用（TS6133）。
- 风险与回滚点：
  - 风险低，主要影响前台语言切换可见入口与初始化语言策略。
  - 若需回滚，可恢复上述 3 个文件本次改动。

# 2026-04-30 首页导航改为左右布局（进行中）

## 任务清单
- [x] 调整首页顶部 header 结构：品牌在左，导航入口归并到右侧区域
- [x] 保持移动端菜单按钮位置与行为不变（仍在右上）
- [x] 运行受影响测试并记录结果
- [x] 回填 Review（改动、验证、风险与回滚点）

## 验收标准
- 桌面端导航入口不再处于中间视觉区，改为右侧对齐。
- 移动端抽屉菜单交互保持现有行为（开关、遮罩关闭、Esc 关闭）。
- 仅改首页顶部布局，不改业务数据与接口行为。

## Review（已完成）
- 已完成：`src/react-app/routes/home-page.tsx` 将顶部结构调整为“左侧品牌 + 右侧操作区”，桌面导航 `nav` 归并到右侧容器并 `justify-end` 对齐，不再占据中间视觉区域。
- 已完成：移动端菜单按钮仍保持右上角位置，抽屉逻辑未改（仅布局重排，无交互变更）。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/home-page.test.tsx src/react-app/routes/home-page.data.test.ts` 通过（2 files, 8 tests）。
- 风险与回滚点：
  - 风险低，属于首页顶部布局样式层调整，不影响接口与状态机。
  - 如需回滚，恢复 `src/react-app/routes/home-page.tsx` 本次 header 结构改动即可。

# 2026-05-01 Legal 页面需求 Brainstorm（进行中）

## 任务清单
- [x] 基于首页 footer 占位入口与现有信息架构，定义三类 legal 页面范围（隐私政策/未成年人保护/版权声明）
- [x] 产出需求文档到 `docs/brainstorms/`，包含稳定需求编号、范围边界、成功标准
- [x] 生成三类页面初版内容（中英双语，默认中文优先）
- [x] 对需求文档执行一轮审查并修正阻塞问题
- [x] 回填 Review（关键决策、风险、下一步）

## 验收标准
- 形成可执行需求文档，可直接进入 `/ce:plan`。
- 三类页面均有可上线的初版文案（非“待补充”占位）。
- 要求与现有首页视觉与信息架构保持一致，不引入超范围功能。

## Review（已完成）
- 已完成：
  - 生成需求文档 `docs/brainstorms/2026-05-01-legal-pages-initial-content-requirements.md`。
  - 文档包含 15 条稳定需求（R1-R15）、范围边界、成功标准、关键决策与下一步。
  - 文档已内嵌三类页面初版文案（隐私政策 / 未成年人保护 / 版权声明），含中英双语结构与统一版本字段（v0.1）。
- 审查结论：
  - `Resolve Before Planning` 为空，可直接进入 `/ce:plan`。
  - 已补充 `Alternatives Considered`，降低后续规划时的方向歧义。
- 风险与边界：
  - 本次为产品与内容初版，不构成最终法律文本；上线前需法务复核。
  - 尚未进入代码实现阶段，路由与页面组件改动待后续计划与实施执行。

# 2026-05-01 Legal 页面实施计划（进行中）

## 任务清单
- [x] 基于 requirements 文档梳理实施范围、依赖与最小改造路径
- [x] 产出结构化实施计划到 `docs/plans/`
- [x] 补齐实现单元测试场景、系统影响与风险缓解策略
- [x] 回填 Review（交付物、关键决策、下一步）

## 验收标准
- 计划文档可直接用于 `/ce:work`，无需再补产品行为定义。
- 计划包含：需求追踪、实施单元、文件清单、测试场景、风险与边界。
- 所有文件路径采用 repo-relative。

## Review（已完成）
- 已完成：生成实施计划 `docs/plans/2026-05-01-005-feat-legal-pages-initial-launch-plan.md`。
- 已完成：计划拆分 4 个实施单元（内容模型、页面路由、footer 链接替换、回归测试），并标注依赖顺序。
- 已完成：明确关键技术决策
  - 首发 `v0.1` 采用静态配置，不接 CMS；
  - 路由固定为 `/legal/privacy`、`/legal/minor-protection`、`/legal/copyright`；
  - 双语采用同路由按 locale 渲染；
  - 页面显式标注“需法务复核”。
- 下一步：进入 `/ce:work` 按计划执行代码实现与测试验证。

# 2026-05-01 Legal 页面首发实现（已完成）

## 任务清单
- [x] 新增 legal 内容模型与中英静态数据（隐私政策 / 未成年人保护 / 版权声明）
- [x] 新增统一 legal 页面组件并接入三条公开路由
- [x] 替换首页 footer 中英占位链接为 `/legal/*` 正式入口
- [x] 补充并运行最小回归测试与 lint
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- 首页 footer 三个入口可访问，不再是 `#` 占位。
- `/legal/privacy`、`/legal/minor-protection`、`/legal/copyright` 均可匿名访问。
- 页面展示 `v0.1`、更新时间、联系邮箱与返回首页入口。
- 受影响测试和 lint 通过。

## Review（已完成）
- 主要改动：
  - 新增 `src/react-app/routes/legal-pages.data.ts`：legal 文案结构化数据源（zh-CN/en-US，含版本与法务复核提示）。
  - 新增 `src/react-app/routes/legal-page.tsx`：统一 legal 页面壳（摘要、章节、联系方式、返回首页）。
  - 更新 `src/react-app/router.tsx`：新增三条公开路由。
  - 更新 `src/react-app/routes/home-page.data.ts`：footer 链接由占位改为 `/legal/*`。
  - 新增/更新测试：`legal-pages.data.test.ts`、`legal-pages.test.tsx`、`home-page.data.test.ts`。
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/legal-pages.data.test.ts src/react-app/routes/legal-pages.test.tsx src/react-app/routes/home-page.data.test.ts src/react-app/routes/root-layout.test.tsx` 通过（4 files, 12 tests）。
  - `pnpm exec eslint src/react-app/router.tsx src/react-app/routes/legal-page.tsx src/react-app/routes/legal-pages.data.ts src/react-app/routes/legal-pages.data.test.ts src/react-app/routes/legal-pages.test.tsx src/react-app/routes/home-page.data.ts src/react-app/routes/home-page.data.test.ts` 通过。
- 风险与后续：
  - 当前为 `v0.1` 初版内容，仍需法务复核后再发布 `v1.0` 正式文本。
  - 当前内容来源为静态配置；后续若需运营自助更新，可再规划迁移到 CMS。

# 2026-05-01 Legal 页面正式版收敛与上线实现（进行中）

## 任务清单
- [x] 沿用现有 brainstorm 文档并升级为正式版（v1.0）口径
- [x] 将三类 legal 文案从 `v0.1` 升级为 `v1.0` 正式版内容
- [x] 调整页面展示文案（去草案态，强化正式发布元信息）
- [x] 更新/补充测试并执行回归（vitest + eslint）
- [x] 回填 Review（改动、验证、风险）

## 验收标准
- legal 三页版本号统一为 `v1.0`，无草案/TBD/待补充文案。
- 文案覆盖项目背景中的合规强约束（未成年人隐私、版权投诉流程、统一联系通道）。
- 受影响测试与 lint 全部通过。

## Review（已完成）
- 已完成：
  - 升级并重写 requirements 文档 `docs/brainstorms/2026-05-01-legal-pages-initial-content-requirements.md`，主题收敛为正式版上线（`topic: legal-pages-formal-launch`）。
  - `src/react-app/routes/legal-pages.data.ts` 全量从 `v0.1` 升级为 `v1.0`，去除草案口径并补齐正式版措辞。
  - 三页文案强化法规与治理口径：
    - 隐私政策加入处理依据与原则（含《个人信息保护法》口径）；
    - 未成年人保护加入《未成年人网络保护条例》口径与举报提交要件；
    - 版权声明加入《著作权法》口径与侵权投诉提交要件细化。
  - 测试同步更新：
    - `src/react-app/routes/legal-pages.data.test.ts`
    - `src/react-app/routes/legal-pages.test.tsx`
- 验证结果：
  - `pnpm exec vitest run --config vitest.config.ts src/react-app/routes/legal-pages.data.test.ts src/react-app/routes/legal-pages.test.tsx src/react-app/routes/home-page.data.test.ts src/react-app/routes/root-layout.test.tsx` 通过（4 files, 13 tests）。
  - `pnpm exec eslint src/react-app/routes/legal-pages.data.ts src/react-app/routes/legal-pages.data.test.ts src/react-app/routes/legal-pages.test.tsx src/react-app/routes/legal-page.tsx` 通过。
- 风险与后续：
  - 当前为“项目背景驱动的正式版口径”；若后续收到法务逐条修订意见，建议采用 `v1.1` 做差量更新。
  - 用户新增约束：legal 页面属于 C 端审核面，不应显示 admin 导航；已在 `root-layout` 隐藏 `/legal/*` 的 utility nav 并补测试。
