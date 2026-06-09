# 大学足球队管理系统 — 技术实施方案

## 一、项目概述

为大学足球队打造的管理平台，核心功能包括战术画板、球员管理、阵容管理、比赛管理、数据统计、训练管理和日程日历。数据全部存储在浏览器 IndexedDB 中，纯前端应用，通过 Cloudflare Pages 免费部署。

---

## 二、技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 14+ (App Router) | 文件系统路由，静态导出 |
| 语言 | TypeScript | 类型安全 |
| UI 组件库 | shadcn/ui | 基于 Tailwind，可定制性强 |
| 样式 | Tailwind CSS 4 | 原子化 CSS |
| 战术画板 | Fabric.js | Canvas 绘制、拖拽、导出图片 |
| 本地数据库 | Dexie.js | IndexedDB 封装，API 简洁 |
| 图表 | Recharts | React 原生图表库 |
| 国际化 | next-intl | 中英文切换 |
| 部署 | Cloudflare Pages | 静态站点托管，免费 |

---

## 三、项目结构

```
soccer-board/
├── docs/                          # 文档
├── public/
│   └── locales/                   # 国际化资源
│       ├── zh/common.json
│       └── en/common.json
├── src/
│   ├── app/                       # Next.js App Router 页面
│   │   ├── layout.tsx             # 根布局（侧边栏）
│   │   ├── page.tsx               # Dashboard 首页
│   │   ├── login/page.tsx         # 登录页
│   │   ├── tactics/
│   │   │   ├── page.tsx           # 战术库列表
│   │   │   ├── new/page.tsx       # 新建战术
│   │   │   └── [id]/page.tsx      # 编辑战术
│   │   ├── players/
│   │   │   ├── page.tsx           # 球员列表
│   │   │   ├── [id]/page.tsx      # 球员详情
│   │   │   └── import/page.tsx    # 批量导入
│   │   ├── lineup/
│   │   │   ├── page.tsx           # 阵容管理
│   │   │   └── templates/page.tsx # 阵容模板
│   │   ├── matches/
│   │   │   ├── page.tsx           # 赛程列表
│   │   │   ├── new/page.tsx       # 新建比赛
│   │   │   ├── [id]/page.tsx      # 比赛详情
│   │   │   └── [id]/live/page.tsx # 实时记录
│   │   ├── stats/
│   │   │   ├── page.tsx           # 数据统计
│   │   │   ├── players/page.tsx   # 球员排行
│   │   │   └── team/page.tsx      # 球队统计
│   │   ├── training/
│   │   │   ├── page.tsx           # 训练日程
│   │   │   └── [id]/page.tsx      # 训练详情
│   │   └── calendar/page.tsx      # 日历视图
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 组件
│   │   ├── layout/                # 布局组件（sidebar, header）
│   │   ├── tactics/               # 战术画板组件
│   │   ├── players/               # 球员相关组件
│   │   ├── lineup/                # 阵容组件
│   │   ├── matches/               # 比赛组件
│   │   ├── stats/                 # 图表组件
│   │   └── calendar/              # 日历组件
│   ├── lib/
│   │   ├── db.ts                  # Dexie 数据库定义
│   │   ├── auth.ts                # 简单认证逻辑
│   │   └── utils.ts               # 工具函数
│   ├── hooks/                     # 数据 Hooks
│   └── types/index.ts             # 全局类型定义
├── next.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 四、数据模型（Dexie.js / IndexedDB）

### 4.1 球员表 (players)

```typescript
interface Player {
  id: string;
  name: string;
  number: number;
  height?: number;
  weight?: number;
  preferredFoot: 'left' | 'right' | 'both';
  positions: string[];
  avatar?: string;                    // Base64
  status: 'healthy' | 'minor_injury' | 'injured' | 'leave';
  abilities: {
    speed: number;                    // 1-10
    shooting: number;
    passing: number;
    defending: number;
    stamina: number;
    awareness: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 4.2 战术方案表 (tactics)

```typescript
interface Tactic {
  id: string;
  name: string;
  type: 'open_play' | 'corner' | 'free_kick' | 'throw_in';
  formation: string;
  players: { playerId: string; x: number; y: number; label?: string }[];
  drawings: FabricObject[];
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}
```

### 4.3 阵容模板表 (lineup_templates)

```typescript
interface LineupTemplate {
  id: string;
  name: string;
  formation: string;
  starters: { playerId: string; position: string; x: number; y: number }[];
  substitutes: string[];
  createdAt: string;
  updatedAt: string;
}
```

### 4.4 比赛表 (matches)

```typescript
interface Match {
  id: string;
  date: string;
  opponent: string;
  venue: string;
  type: 'league' | 'friendly' | 'training';
  status: 'upcoming' | 'live' | 'finished';
  lineup: { playerId: string; position: string }[];
  score?: { home: number; away: number };
  events: MatchEvent[];
  ratings: { playerId: string; score: number; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution';
  minute: number;
  playerId: string;
  relatedPlayerId?: string;
  note?: string;
  timestamp: string;
}
```

### 4.5 训练表 (trainings)

```typescript
interface Training {
  id: string;
  date: string;
  time: string;
  location: string;
  theme: 'fitness' | 'technical' | 'tactical' | 'set_piece';
  description?: string;
  attendance: { playerId: string; present: boolean; note?: string }[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 五、核心功能实现方案

### 5.1 战术画板（Fabric.js）

- 球场背景：SVG/CSS 绘制标准足球场
- 球员标记：Fabric.js Circle，可拖拽，显示号码
- 路线类型：跑位（虚线曲线）、传球（直线箭头）、带球（带标记曲线）、防守区域（半透明区域）
- 阵型预设：4-4-2、4-3-3、3-5-2、4-2-3-1
- 定位球：作为画板模式切换（进攻/角球/任意球/界外球）
- 导出：`canvas.toDataURL('image/png')`
- 保存：`canvas.toJSON()` 存入 IndexedDB

### 5.2 球员管理

- 列表：表格/卡片双视图，搜索/排序/状态筛选
- 详情：信息编辑 + 能力雷达图（Recharts RadarChart，6 维 × 10 分）
- 批量导入：CSV 上传 → 预览 → 确认导入

### 5.3 阵容管理

- 球场视图显示首发 11 人
- 拖拽球员到球场设为首发
- 阵型切换自动重排
- 保存/加载阵容模板

### 5.4 比赛管理

- 实时记录：计时器 + 事件按钮（⚽进球/🟨黄牌/🟥红牌/🔄换人）+ 备注
- 赛后回顾：事件时间线 + 球员评分（1-10）

### 5.5 数据统计

- 球员排行：出场/进球/助攻/评分
- 球队统计：胜平负/进失球/胜率饼图/趋势折线图

### 5.6 训练管理

- 训练日程：日期/时间/地点/主题
- 出勤记录：勾选出席/缺席

### 5.7 日程日历

- 月视图，颜色标记（比赛红/训练蓝/其他灰）
- 点击创建/拖拽修改事件

---

## 六、认证方案

单管理员前端密码保护：

- 首次访问引导设置密码
- 密码 SHA-256 哈希存 localStorage
- 登录状态存 sessionStorage，关闭浏览器自动退出
- 未登录跳转 `/login`

---

## 七、Cloudflare Pages 部署流程

### 7.1 Next.js 配置

```typescript
// next.config.ts
const nextConfig = {
  output: "export",        // 静态导出
  images: { unoptimized: true },
  trailingSlash: true,
};
```

### 7.2 方式一：Git 集成部署

**一次性配置，之后每次 push main 自动部署：**

1. 将代码推送到 GitHub 仓库
2. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
3. 左侧菜单 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
4. 点击 **Connect GitHub**，授权 Cloudflare 访问你的仓库
5. 选择仓库，配置构建设置：
   - **Framework preset**: Next.js (Static HTML Export)
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
6. 点击 **Save and Deploy**

**效果：**
- 每次 `git push origin main` → 自动构建部署
- 每个 PR 自动生成预览 URL
- 部署到 Cloudflare 全球 CDN，自动 HTTPS



### 7.3 自定义域名

1. Cloudflare Dashboard → Pages → 项目 → **Custom domains**
2. 添加域名（如 `soccer.yourdomain.com`）
3. 域名在 Cloudflare：自动配置 DNS
4. 域名在其他注册商：添加 CNAME 记录指向 `<project>.pages.dev`
5. SSL 自动签发

---

## 八、开发优先级

### P0 — 核心可用（约 7.5 天）

| 功能 | 工作内容 | 预估 |
|------|---------|------|
| 项目初始化 | Next.js + Tailwind + shadcn/ui + Dexie | 1 天 |
| 认证系统 | 登录页 + 前端密码保护 | 0.5 天 |
| 球员管理 | 列表、详情、新增/编辑、雷达图、状态标记 | 2 天 |
| 战术画板 | 球场绘制、球员拖拽、阵型预设、路线绘制、导出 | 3 天 |
| 侧边栏 + 路由 | 导航结构、页面空壳 | 1 天 |

### P1 — 日常使用（约 4.5 天）

| 功能 | 预估 |
|------|------|
| 阵容管理（首发/替补/模板） | 1.5 天 |
| 比赛管理（赛程/实时记录/赛后评分） | 2.5 天 |
| 批量导入 CSV | 0.5 天 |

### P2 — 锦上添花（约 4 天）

| 功能 | 预估 |
|------|------|
| 数据统计（排行/图表） | 1.5 天 |
| 日程日历 | 1.5 天 |
| 国际化中英文 | 1 天 |

### P3 — 完善体验（约 3 天）

| 功能 | 预估 |
|------|------|
| 训练管理 | 1 天 |
| 定位球专用模板 | 1 天 |
| 体验优化/PWA | 1 天 |

---

## 九、关键依赖

```json
{
  "dependencies": {
    "next": "^14/15",
    "react": "^18/19",
    "dexie": "^4.0",
    "fabric": "^6.0",
    "recharts": "^2.12",
    "next-intl": "^3.0",
    "zustand": "^4.5",
    "date-fns": "^3.0",
    "papaparse": "^5.4",
    "lucide-react": "^0.400"
  }
}
```

---

## 十、注意事项

1. **IndexedDB 存储限制**：浏览器通常数十 MB 到数百 MB，头像建议压缩
2. **Fabric.js 6.x**：API 有较大变动，注意文档版本匹配
3. **静态导出限制**：不支持 SSR、API Routes、Middleware
4. **数据备份**：建议增加 JSON 导入导出，防浏览器清数据
5. **移动端**：战术画板触屏拖拽需额外测试优化
