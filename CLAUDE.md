# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

大学足球队管理系统（soccer-board）——Next.js SPA + Cloudflare Pages Functions，部署在 Cloudflare Pages。主数据库为 Cloudflare D1（SQLite），支持离线时自动降级到本地 IndexedDB，文件存储使用 Cloudflare R2。

## 常用命令

```bash
npm run dev      # 本地开发 (next dev)
npm run build    # 构建静态站点 → out/
npm run lint     # ESLint 检查
```

无测试框架，无测试脚本。

## 技术栈

- **Next.js 16** App Router + 静态导出 (`output: "export"`)，纯 SPA
- **React 19** + TypeScript 5（strict 模式）
- **Tailwind CSS 4** — 无 `tailwind.config.ts`，通过 `globals.css` CSS 变量配置主题（oklch 色彩系统）
- **Cloudflare Pages Functions** — 边缘部署的服务端 REST API
- **Cloudflare D1** — 主数据库（SQLite），通过 `_helpers.ts` 泛型 CRUD 处理器访问
- **Dexie.js** — IndexedDB ORM，作为 API 不可用时的离线降级方案
- **shadcn/ui** (base-nova 风格) + lucide-react 图标
- **Fabric.js 7** 用于战术板球员标记拖拽
- **Recharts** 用于球员能力雷达图和数据统计图表
- **Framer Motion** 页面过渡动画
- **自定义 i18n**（React Context），支持 zh/en，不使用 next-intl（虽已安装）

## 代码架构

### 目录结构

```
src/
  app/           # 页面路由（App Router）
  components/    # 按功能域分目录（players/, tactics/, ui/）
  hooks/         # 自定义 hooks，每个域一个（use-players.ts, use-matches.ts 等）
  lib/           # 工具库、API 客户端、渲染逻辑
  locales/       # i18n 翻译文件
  types/         # TypeScript 类型定义（集中在一个 index.ts）
functions/       # Cloudflare Pages Functions（服务端，不在 Next.js 构建中）
```

路径别名：`@/*` → `./src/*`

### 数据流架构

采用双模式 API 客户端（`src/lib/api.ts`）：
- `createApiClient<T>(table)` 返回 `{ list, get, add, update, remove }`
- **生产环境**：调用 Cloudflare Pages Functions REST API（D1 数据库）
- **离线降级**：自动检测 API 不可用时，回退到本地 Dexie（IndexedDB）数据库
- 每次写操作后调用 `emitRefresh()`（`src/lib/refresh-bus.ts` 发布/订阅总线）触发 hooks 重新拉取
- 30 秒轮询作为兜底刷新机制

每个业务域有专用 hook（如 `use-players.ts`）封装 CRUD，使用 `useApiQuery` 替代旧版 `useLiveQuery`。

### Cloudflare Pages Functions

`functions/` 目录包含服务端逻辑，由 Cloudflare Pages 自动部署，与 Next.js 静态站点独立构建。

**认证系统**：
- `functions/_middleware.ts` — 边缘中间件，拦截所有请求验证 HMAC session cookie
- `functions/api/auth/login.ts` — POST，验证密码后签发 7 天 HMAC-SHA256 token
- `functions/api/auth/logout.ts` — POST，清除 session cookie
- 白名单路径：`/`, `/login`, `/api/auth`, `/api/avatar`, 静态资源

**通用 CRUD**（`functions/api/_helpers.ts`）：
- `createCrudHandler(table, indexedColumns)` 生成标准 REST 端点
- JSON 字段自动序列化/反序列化（如 players 的 positions、abilities）
- 所有资源端点（players/, matches/, tactics/ 等）都是它的薄封装

**文件存储**：
- `functions/api/avatar/upload.ts` — 头像上传到 R2（base64 JSON，max 2MB）
- `functions/api/avatar/serve.ts` — 头像读取（GET，?key=）

**Cloudflare 绑定**：D1 (`env.DB`), R2 (`env.AVATAR_BUCKET`), Secrets (`AUTH_PASSWORD`, `SESSION_SECRET`)。通过 Cloudflare Dashboard 配置，不可写入代码。

tsconfig.json 已排除 `functions/` 目录，避免 Next.js TypeScript 检查报错。

### 战术画板 3 层架构

战术画板是本项目最复杂的组件，采用分层 canvas：

| 层 | 技术 | 文件 | 职责 |
|----|------|------|------|
| Layer 0 | SVG | `components/tactics/pitch-svg.tsx` | 足球场渲染（草皮条纹、线、禁区） |
| Layer 1 | Fabric.js | `components/tactics/pitch.tsx` | 可拖拽球员标记（Circle+Text 组） |
| Layer 2 | Canvas2D | `hooks/use-tactic-canvas.ts` + `lib/drawing-renderer.ts` | 战术线条绘制（4 种类型） |

导出功能（`lib/export-composite.ts`）将 3 层合并为 PNG。

绘制工具 4 种类型定义在 `lib/drawing-types.ts`：run（白色虚线）、pass（黄色箭头）、dribble（蓝色线）、defend（红色半透明矩形）。支持完整撤销/重做历史。

球员位置保存为百分比坐标（0-100），加载时转换为像素坐标。`pitch.tsx` 支持 `savedPositions` prop 恢复上次位置。

### 阵型系统

阵型按人数分组定义在 `types/index.ts` 的 `FORMATION_GROUPS` 中：
- 5人制：2-1-1, 1-2-1
- 7人制：2-3-1, 3-2-1, 2-2-2
- 8人制：3-3-1, 3-2-2, 4-2-1, 2-3-2
- 9人制：3-3-2, 4-3-1, 3-4-1
- 11人制：4-4-2, 4-3-3, 3-5-2, 4-2-3-1, 4-5-1, 3-4-3, 5-3-2, 4-1-4-1

`FORMATIONS` 是扁平化的合并映射。自定义阵型通过 `formation-picker.tsx` 的文本输入存储到 `localStorage`（key: `customFormations`），运行时动态注册。

### 国际化

自定义实现于 `lib/i18n.tsx`，翻译文件在 `locales/zh.json` 和 `locales/en.json`。使用 `useI18n()` hook 获取 `t()` 函数，支持 `{param}` 插值和点路径 key。

## 重要注意事项

- **无 SSR**：Next.js 页面均为客户端渲染，静态导出后无服务器参与
- **服务端逻辑在 `functions/`**：需要服务端的功能使用 Cloudflare Pages Functions，不要在 `src/` 中添加 API routes
- **R2 token 安全**：R2 绑定和 API Keys 通过 Cloudflare Dashboard 的 Secrets 配置，绝不可写入代码或环境变量
- **zustand 已安装但未使用**：不要引入 zustand
- **next-intl 已安装但未使用**：i18n 使用自定义实现，不要引入 next-intl 的 API
- **shadcn/ui 组件**在 `components/ui/` 下，使用 `components.json` 中的配置管理
- **ESLint 使用 flat config**（`eslint.config.mjs`），非传统 `.eslintrc` 格式
- **Tailwind CSS 4 无独立配置文件**，主题变量在 `globals.css` 中通过 `@theme` 定义
