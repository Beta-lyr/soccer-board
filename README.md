<h1 align="center">⚽ Soccer Board</h1>

<p align="center">
  大学足球队管理系统 / University Soccer Team Management System
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#部署">部署</a>
</p>

---

<p align="center">
  <strong>🌐 English</strong> | <a href="#中文">中文</a>
</p>

## Features

- **📊 [Dashboard](src/app/dashboard/page.tsx)** — Overview of team stats, upcoming matches, and recent activities
- **👥 [Players](src/app/players/page.tsx)** — Player roster with abilities radar chart, status tracking, and batch CSV import
- **⚽ [Matches](src/app/matches/page.tsx)** — Match management with live timer, events (goals/assists/cards), and player ratings
- **🏆 [Competitions](src/app/competitions/page.tsx)** — League (round-robin) and cup (knockout) tournament management with auto-generated schedules
- **🎯 [Tactics](src/app/tactics/page.tsx)** — Interactive tactics board with 3-layer canvas (SVG pitch + Fabric.js players + Canvas2D drawings)
- **📋 [Lineup](src/app/lineup/page.tsx)** — Lineup templates with drag-and-drop formation builder
- **🏃 [Training](src/app/training/page.tsx)** — Training session planning with attendance tracking
- **📅 [Calendar](src/app/calendar/page.tsx)** — Calendar view for matches and training sessions
- **📈 [Stats](src/app/stats/page.tsx)** — Team and player statistics with charts
- **👥 [Teams](src/app/teams/page.tsx)** — Multi-team management with roster assignment

### Tactics Board

The tactics board supports 4 drawing tools:
- **Run** — White dashed lines for movement routes
- **Pass** — Yellow arrows for passing lanes
- **Dribble** — Blue lines for dribbling paths
- **Defend** — Red semi-transparent zones for defensive areas

Formations support 5/7/8/9/11-a-side with 20+ preset formations and custom formation input.

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | [Next.js 16](https://nextjs.org/) (App Router, Static Export) + [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Backend | [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) (Edge Serverless) |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite) with [Dexie.js](https://dexie.org/) offline fallback |
| Storage | [Cloudflare R2](https://developers.cloudflare.com/r2/) (Avatar images) |
| Canvas | [Fabric.js 7](http://fabricjs.com/) (Player markers) + Canvas2D (Tactical drawings) |
| Charts | [Recharts](https://recharts.org/) (Radar charts, statistics) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| i18n | Custom React Context (zh/en) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm or yarn or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/soccer-board.git
cd soccer-board

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build static site → out/
npm run lint     # Run ESLint check
```

### Environment Variables

For local development with Cloudflare backend, create a `.dev.vars` file in the project root:

```env
AUTH_PASSWORD=your-password
SESSION_SECRET=your-secret-key (min 32 chars)
```

For production, set these as [Cloudflare Pages secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets).

## Project Structure

```
soccer-board/
├── src/
│   ├── app/              # Next.js App Router pages
│   ├── components/       # React components by domain
│   │   ├── ui/           # shadcn/ui base components
│   │   ├── tactics/      # Tactics board components
│   │   ├── players/      # Player-related components
│   │   └── layout/       # Layout components (Header, PageTransition)
│   ├── hooks/            # Custom React hooks (one per domain)
│   ├── lib/              # Utilities, API client, rendering logic
│   ├── locales/          # i18n translation files (zh.json, en.json)
│   └── types/            # TypeScript type definitions
├── functions/            # Cloudflare Pages Functions (backend)
│   └── api/              # REST API endpoints
│       ├── auth/         # Login/logout
│       ├── avatar/       # Avatar upload/serve (R2)
│       └── [resource]/   # CRUD endpoints for each entity
├── public/               # Static assets
└── components.json       # shadcn/ui configuration
```

### Data Flow

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   React UI  │────▶│  API Client      │────▶│  CF Pages   │
│  (Hooks)    │◀────│  (api.ts)        │◀────│  Functions  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────┐         ┌─────────────┐
                    │  IndexedDB   │         │  Cloudflare │
                    │  (Fallback)  │         │  D1 + R2    │
                    └──────────────┘         └─────────────┘
```

The API client auto-detects Cloudflare availability and falls back to local IndexedDB when offline.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate with password |
| POST | `/api/auth/logout` | Clear session |
| GET/POST | `/api/players` | List / Create players |
| GET/PUT/DELETE | `/api/players/:id` | Get / Update / Delete player |
| GET/POST | `/api/matches` | List / Create matches |
| GET/POST | `/api/tactics` | List / Create tactics |
| GET/POST | `/api/competitions` | List / Create competitions |
| GET/POST | `/api/teams` | List / Create teams |
| GET/POST | `/api/trainings` | List / Create trainings |
| GET/POST | `/api/lineupTemplates` | List / Create lineup templates |
| POST | `/api/avatar/upload` | Upload avatar to R2 |
| GET | `/api/avatar/serve?key=` | Serve avatar from R2 |

## Deployment

This project is designed for [Cloudflare Pages](https://pages.cloudflare.com/):

1. Push to GitHub
2. Connect repository in Cloudflare Pages dashboard
3. Set build configuration:
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
4. Add [D1 database binding](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases) (name: `DB`)
5. Add [R2 bucket binding](https://developers.cloudflare.com/pages/functions/bindings/#r2-buckets) (name: `AVATAR_BUCKET`)
6. Add [secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets): `AUTH_PASSWORD`, `SESSION_SECRET`

---

<p id="中文" align="center">
  <a href="#features">English</a> | <strong>🌐 中文</strong>
</p>

## 功能特性

- **📊 [仪表盘](src/app/dashboard/page.tsx)** — 球队数据概览、即将到来的比赛、最近活动
- **👥 [球员管理](src/app/players/page.tsx)** — 球员花名册，能力雷达图，状态追踪，支持 CSV 批量导入
- **⚽ [比赛管理](src/app/matches/page.tsx)** — 比赛管理，实时计时器，事件记录（进球/助攻/红黄牌），球员评分
- **🏆 [赛事管理](src/app/competitions/page.tsx)** — 联赛（循环赛）和杯赛（淘汰赛）管理，自动生成赛程
- **🎯 [战术板](src/app/tactics/page.tsx)** — 交互式战术板，3 层画布架构（SVG 球场 + Fabric.js 球员 + Canvas2D 战术线条）
- **📋 [阵容模板](src/app/lineup/page.tsx)** — 阵容模板，拖拽式阵型构建
- **🏃 [训练管理](src/app/training/page.tsx)** — 训练计划，考勤记录
- **📅 [日历](src/app/calendar/page.tsx)** — 比赛和训练日历视图
- **📈 [数据统计](src/app/stats/page.tsx)** — 球队和球员统计图表
- **👥 [队伍管理](src/app/teams/page.tsx)** — 多队伍管理，阵容分配

### 战术板

战术板支持 4 种绘图工具：
- **跑位** — 白色虚线，表示球员移动路线
- **传球** — 黄色箭头，表示传球线路
- **盘带** — 蓝色线条，表示带球路径
- **防守** — 红色半透明区域，表示防守区域

阵型支持 5/7/8/9/11 人制，提供 20+ 种预设阵型，并支持自定义阵型输入。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | [Next.js 16](https://nextjs.org/)（App Router，静态导出）+ [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| 样式 | [Tailwind CSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| 后端 | [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/)（边缘无服务器） |
| 数据库 | [Cloudflare D1](https://developers.cloudflare.com/d1/)（SQLite），[Dexie.js](https://dexie.org/) 离线降级 |
| 存储 | [Cloudflare R2](https://developers.cloudflare.com/r2/)（头像图片） |
| 画布 | [Fabric.js 7](http://fabricjs.com/)（球员标记）+ Canvas2D（战术线条） |
| 图表 | [Recharts](https://recharts.org/)（雷达图、数据统计） |
| 动画 | [Framer Motion](https://www.framer.com/motion/) |
| 国际化 | 自定义 React Context（中文/英文） |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) 18+
- npm 或 yarn 或 pnpm

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/soccer-board.git
cd soccer-board

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000)。

### 可用脚本

```bash
npm run dev      # 启动开发服务器
npm run build    # 构建静态站点 → out/
npm run lint     # 运行 ESLint 检查
```

### 环境变量

本地开发使用 Cloudflare 后端时，在项目根目录创建 `.dev.vars` 文件：

```env
AUTH_PASSWORD=你的密码
SESSION_SECRET=你的密钥（至少 32 个字符）
```

生产环境请在 [Cloudflare Pages Secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets) 中配置。

## 项目结构

```
soccer-board/
├── src/
│   ├── app/              # Next.js App Router 页面
│   ├── components/       # React 组件（按功能域分组）
│   │   ├── ui/           # shadcn/ui 基础组件
│   │   ├── tactics/      # 战术板组件
│   │   ├── players/      # 球员相关组件
│   │   └── layout/       # 布局组件（Header, PageTransition）
│   ├── hooks/            # 自定义 React Hooks（每个域一个）
│   ├── lib/              # 工具库、API 客户端、渲染逻辑
│   ├── locales/          # i18n 翻译文件（zh.json, en.json）
│   └── types/            # TypeScript 类型定义
├── functions/            # Cloudflare Pages Functions（后端）
│   └── api/              # REST API 端点
│       ├── auth/         # 登录/登出
│       ├── avatar/       # 头像上传/读取（R2）
│       └── [resource]/   # 各实体的 CRUD 端点
├── public/               # 静态资源
└── components.json       # shadcn/ui 配置
```

### 数据流

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   React UI  │────▶│  API 客户端       │────▶│  CF Pages   │
│  (Hooks)    │◀────│  (api.ts)        │◀────│  Functions  │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │                        │
                           ▼                        ▼
                    ┌──────────────┐         ┌─────────────┐
                    │  IndexedDB   │         │  Cloudflare │
                    │  （离线降级）  │         │  D1 + R2    │
                    └──────────────┘         └─────────────┘
```

API 客户端自动检测 Cloudflare 可用性，离线时降级到本地 IndexedDB。

## API 端点

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/api/auth/login` | 密码认证 |
| POST | `/api/auth/logout` | 清除会话 |
| GET/POST | `/api/players` | 获取/创建球员列表 |
| GET/PUT/DELETE | `/api/players/:id` | 获取/更新/删除球员 |
| GET/POST | `/api/matches` | 获取/创建比赛 |
| GET/POST | `/api/tactics` | 获取/创建战术 |
| GET/POST | `/api/competitions` | 获取/创建赛事 |
| GET/POST | `/api/teams` | 获取/创建队伍 |
| GET/POST | `/api/trainings` | 获取/创建训练 |
| GET/POST | `/api/lineupTemplates` | 获取/创建阵容模板 |
| POST | `/api/avatar/upload` | 上传头像到 R2 |
| GET | `/api/avatar/serve?key=` | 从 R2 读取头像 |

## 部署

本项目专为 [Cloudflare Pages](https://pages.cloudflare.com/) 设计：

1. 推送代码到 GitHub
2. 在 Cloudflare Pages 控制台连接仓库
3. 设置构建配置：
   - **构建命令**：`npm run build`
   - **构建输出目录**：`out`
4. 添加 [D1 数据库绑定](https://developers.cloudflare.com/pages/functions/bindings/#d1-databases)（名称：`DB`）
5. 添加 [R2 存储桶绑定](https://developers.cloudflare.com/pages/functions/bindings/#r2-buckets)（名称：`AVATAR_BUCKET`）
6. 添加 [Secrets](https://developers.cloudflare.com/pages/functions/bindings/#secrets)：`AUTH_PASSWORD`、`SESSION_SECRET`

---

<p align="center">
  Made with ❤️ for university soccer teams
</p>
