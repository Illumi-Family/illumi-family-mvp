# BETTER_AUTH_SECRET 问题排查与修复 Runbook

## 1. 背景
- 现象：本地开发时出现 `Unhandled error Error: Missing BETTER_AUTH_SECRET`。
- 当前仓库分支 `fix-issues` 不包含 `better-auth` 代码；该错误来自 `dev` 分支的认证模块。
- `dev` 分支中，`/api/auth/*` 路由会调用 `createAuth(c.env)`，若缺少 `BETTER_AUTH_SECRET` 会直接抛错。

## 2. 根因
- Cloudflare Dashboard 中配置的 `wrangler secret` 主要用于远端 Worker（部署后环境）。
- 本地 `pnpm dev`（`CLOUDFLARE_ENV=dev vite`）不会自动读取 Dashboard secret 明文。
- 本地开发需要通过 `.dev.vars` / `.dev.vars.dev` 注入 secret。

## 3. 结论
- 线上 `dev` 有 secret，不代表本地 `pnpm dev` 能读到。
- `BETTER_AUTH_SECRET` 不应写入 `wrangler.json`（敏感信息）。
- 正确方式：
  - 远端：`wrangler secret put ...`
  - 本地：`.dev.vars.dev`

## 4. 执行步骤（在 `dev` 分支）

### 4.1 切换分支并安装依赖
```bash
git switch dev
pnpm install
```

### 4.2 确认远端 dev secret 是否存在
```bash
pnpm exec wrangler whoami
pnpm exec wrangler secret list --env dev | grep BETTER_AUTH_SECRET
```

如果没有，补充：
```bash
pnpm exec wrangler secret put BETTER_AUTH_SECRET --env dev
```

### 4.3 配置本地开发变量（关键）
在项目根目录创建或更新 `.dev.vars.dev`（推荐先复制模板）：
```bash
cp .dev.vars.example .dev.vars.dev
```

然后填写：
```env
BETTER_AUTH_SECRET=与你线上dev一致的值
BETTER_AUTH_BASE_URL=http://localhost:5173
```

说明：
- `BETTER_AUTH_SECRET`：可与线上 dev 同值。
- `BETTER_AUTH_BASE_URL`：本地建议用 `http://localhost:5173`。

### 4.4 启动并验证
```bash
pnpm dev
```

另开终端验证：
```bash
curl -i http://localhost:5173/api/health
curl -i http://localhost:5173/api/auth/get-session
```

预期：
- 不再出现 `Missing BETTER_AUTH_SECRET`。
- `/api/auth/get-session` 返回受控业务响应（未登录也应是可预期认证响应，而非配置缺失崩溃）。

## 5. 常见坑
- 只配置了 Dashboard secret，没配本地 `.dev.vars.dev`。
- 把 secret 写进 `wrangler.json`（不安全且不推荐）。
- `.dev.vars.dev` 存在时，误以为 `.env` 仍会兜底生效。
- `BETTER_AUTH_BASE_URL` 仍指向线上域名，导致本地回调/来源校验异常。

## 6. 安全与协作建议
- `.dev.vars*` 已在 `.gitignore` 中，勿提交真实 secret。
- 若你手里没有线上 dev secret 明文，只能生成新值并同时更新：
  - 本地 `.dev.vars.dev`
  - Cloudflare `--env dev` secret
- 生产环境若启用同一认证逻辑，也需单独配置 prod secret。
