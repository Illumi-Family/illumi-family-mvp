---
date: 2026-05-04
topic: mobile-wechat-share-seo-cards
---

# 移动端微信分享与 SEO 卡片优化需求

## Problem Frame
当前站点在首页与视频页都缺少面向移动端传播的“就地分享”入口，且分享卡片信息未按页面/视频动态区分，导致微信内转发时传播效率与点击意愿偏低。  
本次目标是在不扩展多平台分享的前提下，先完成微信场景的最小可用闭环：移动端右下角悬浮分享按钮 + 可预期的微信分享路径 + 可控的 SEO 卡片三要素（title、description、image）。

## Requirements

**移动端分享入口**
- R1. 首页（`/`）与视频页（`/video/{streamVideoId}`）在移动端展示右下角悬浮分享按钮。
- R2. 分享按钮仅在移动端视口展示；桌面端不展示，避免干扰现有桌面信息结构。
- R3. 点击分享按钮后，展示“微信内分享指引浮层”，至少包含：引导用户使用微信右上角菜单分享、以及一键复制当前页链接。

**分享目标与链接策略**
- R4. 视频分享使用独立路径 ` /video/{streamVideoId} `，不使用 query 形式作为主分享链接。
- R5. 分享按钮复制的链接必须是当前页面可直接访问的 canonical 链接（首页复制首页，视频页复制对应视频页）。

**SEO / 社交卡片**
- R6. 首页需提供稳定可抓取的分享卡片三要素：`title`、`description`、`image`。
- R7. 每个视频详情页需提供按视频区分的分享卡片三要素：  
  - `title`：视频标题（已有视频标题体系）  
  - `description`：统一模板生成（本期不做后台单独维护）  
  - `image`：优先视频 `posterUrl`，缺失时回退站点默认图
- R8. 分享卡片内容在微信内打开链接时可被稳定读取（不依赖用户先执行前端 JS 才能生成关键 meta）。

## Success Criteria
- 在移动端首页与视频页，用户可在 2 步内完成“点击分享 -> 获取可转发链接”。
- 任取一个视频页链接在微信会话内打开，卡片可展示该视频对应的 `title`，且 `image` 为视频封面或默认图回退。
- 首页分享链接与视频页分享链接的卡片信息可区分，不再全部落为同一套站点默认文案。

## Scope Boundaries
- 本期仅覆盖微信分享场景，不接入微博/X/QQ/小红书等其他媒体。
- 本期不引入每视频独立运营文案后台；视频 `description` 先采用统一模板。
- 本期不改造后台视频管理信息架构（仅消费已有视频标题与封面信息）。
- 本期不追求完整 SEO 体系升级（如结构化数据、sitemap 增强等）。

## Key Decisions
- 采用“微信内分享指引浮层 + 复制链接”，而非直接依赖系统原生分享唤起：微信内可用性更可控。
- 视频链接采用 path 语义（`/video/{streamVideoId}`）作为对外分享主链接：提升平台抓取稳定性与可读性。
- 视频卡片 `description` 采用统一模板：先确保上线速度和一致性，再按传播数据决定是否进入后台可编辑。
- 视频卡片 `image` 采用“poster 优先，默认图回退”：在实现复杂度与传播辨识度之间取平衡。

## Dependencies / Assumptions
- 依赖公开视频数据中可读取视频标题与封面字段（已存在公开视频列表能力）。
- 假设微信抓取链路可读取服务端返回 HTML 中的 meta 信息；仅客户端运行时改 meta 不足以保证抓取一致性。
- 假设分享默认图资产可长期稳定访问，且具备适配移动端卡片的尺寸质量。

## Outstanding Questions

### Resolve Before Planning
- 无

### Deferred to Planning
- [Affects R1-R3][Technical] 悬浮按钮在各页面的挂载层级与复用方式如何设计，以最小侵入现有路由结构。
- [Affects R6-R8][Technical] 现有前端 SPA + Worker 资产路由下，如何为首页/视频页输出可抓取的动态 meta（包括渲染路径与缓存策略）。
- [Affects R7][Needs research] 视频 `description` 模板文案的最终格式与长度上限（兼顾中文可读性与卡片截断风险）。
- [Affects R7][Technical] `posterUrl` 缺失或异常时的回退判定与默认图地址规范（绝对 URL、域名一致性、缓存行为）。

## Next Steps
-> /ce:plan for structured implementation planning

## Review Addendum (2026-05-04)

基于首轮实现与联调，本需求当前状态为“已完成实现探索，但暂缓上线”。  
补充审查结论如下：

- 首页与视频页走 worker-first 可满足卡片抓取诉求，但会改变原有静态资源直出路径，存在页面 TTFB 增压风险。
- 视频详情链接在无效 ID 场景下的期望行为仍需再统一（当前实现趋向 404，历史前端语义趋向回退首个可播）。
- 为保证开发环境可运行，加入了 fallback HTML 与 react-refresh preamble 兜底；生产 fallback 策略需再做环境分层约束。

结论：当前版本建议仅作为 `feat/share` 备份分支保留，不直接部署到 dev/prod，也不合入 `feat/mvp`，待下一轮重构方案确认后再推进发布。
