# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

大学足球队管理系统（soccer-board）——前端 SPA + Cloudflare Pages Functions，部署在 Cloudflare Pages。业务数据存储在浏览器 IndexedDB 中，文件存储使用 Cloudflare R2。

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
- **Dexie.js** (IndexedDB ORM) + `useLiveQuery` 为唯一数据层，5 张表：players, tactics, lineupTemplates, matches, trainings
- **shadcn/ui** (base-nova 风格) + lucide-react 图标
- **Fabric.js 7** 用于战术板球员标记拖拽
- **Recharts** 用于球员能力雷达图和数据统计图表
- **Framer Motion** 页面过渡动画
- **自定义 i18n**（React Context），支持 zh/en，不使用 next-intl（虽已安装）

## 代码架构

### 目录结构约定

```
src/
  app/           # 页面路由（App Router）
  components/    # 按功能域分目录（players/, tactics/, ui/）
  hooks/         # 自定义 hooks，每个域一个（use-players.ts, use-matches.ts 等）
  lib/           # 工具库、数据库定义、渲染逻辑
  locales/       # i18n 翻译文件
  types/         # TypeScript 类型定义（集中在一个 index.ts）
functions/       # Cloudflare Pages Functions（服务端，不在 Next.js 构建中）
```

路径别名：`@/*` → `./src/*`

### Cloudflare Pages Functions

`functions/` 目录包含服务端逻辑，由 Cloudflare Pages 自动部署，与 Next.js 静态站点独立构建。R2 Bucket 和 Secrets 通过 Cloudflare Dashboard 配置（非代码）。

- `functions/api/avatar/upload.ts` — 头像上传到 R2（POST，multipart/form-data）
- `functions/api/avatar/serve.ts` — 头像图片读取（GET，?key=avatars/xxx）

tsconfig.json 已排除 `functions/` 目录，避免 Next.js TypeScript 检查报错。

### 数据流模式

所有持久化数据通过 Dexie.js 存入 IndexedDB。每个业务域有专用 hook（如 `use-players.ts`）封装 CRUD：
- **读取**：`useLiveQuery()` 实现响应式查询，数据变更自动触发重渲染
- **写入**：async 函数直接操作 Dexie 表
- **ID 生成**：`crypto.randomUUID()`

组件本地状态用 `useState`，战术画板中用 `useRef` 避免事件处理器中的闭包陈旧问题。

### 战术画板 3 层架构

战术画板是本项目最复杂的组件，采用分层 canvas：

| 层 | 技术 | 文件 | 职责 |
|----|------|------|------|
| Layer 0 | SVG | `components/tactics/pitch-svg.tsx` | 足球场渲染（草皮条纹、线、禁区） |
| Layer 1 | Fabric.js | `components/tactics/pitch.tsx` | 可拖拽球员标记（Circle+Text 组） |
| Layer 2 | Canvas2D | `hooks/use-tactic-canvas.ts` + `lib/drawing-renderer.ts` | 战术线条绘制（4 种类型） |

导出功能（`lib/export-composite.ts`）将 3 层合并为 PNG。

绘制工具 4 种类型定义在 `lib/drawing-types.ts`：run（白色虚线）、pass（黄色箭头）、dribble（蓝色线）、defend（红色半透明矩形）。

### 阵型系统

8 种预设阵型定义在 `types/index.ts` 的 `FORMATIONS` 常量中，坐标为百分比（0-100）。自定义阵型通过文本输入存储在 `localStorage`。

### 国际化

自定义实现于 `lib/i18n.tsx`，翻译文件在 `locales/zh.json` 和 `locales/en.json`。使用 `useI18n()` hook 获取 `t()` 函数。

## 重要注意事项

- **无 SSR**：Next.js 页面均为客户端渲染，静态导出后无服务器参与
- **服务端逻辑在 `functions/`**：需要服务端的功能（如文件上传）使用 Cloudflare Pages Functions，不要在 `src/` 中添加 API routes
- **R2 token 安全**：R2 绑定和 API Keys 通过 Cloudflare Dashboard 的 Secrets 配置，绝不可写入代码或环境变量
- **zustand 已安装但未使用**：不要引入 zustand，数据层统一用 Dexie
- **next-intl 已安装但未使用**：i18n 使用自定义实现，不要引入 next-intl 的 API
- **shadcn/ui 组件**在 `components/ui/` 下，使用 `components.json` 中的配置管理
- **ESLint 使用 flat config**（`eslint.config.mjs`），非传统 `.eslintrc` 格式
- **Tailwind CSS 4 无独立配置文件**，主题变量在 `globals.css` 中通过 `@theme` 定义
