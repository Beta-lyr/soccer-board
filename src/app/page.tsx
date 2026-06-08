import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Swords, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "球员总数", value: "0", icon: Users, accent: "bg-blue-500/10 text-blue-500" },
  { label: "战术方案", value: "0", icon: Swords, accent: "bg-emerald-500/10 text-emerald-500" },
  { label: "比赛场次", value: "0", icon: Trophy, accent: "bg-amber-500/10 text-amber-500" },
  { label: "训练次数", value: "0", icon: Calendar, accent: "bg-purple-500/10 text-purple-500" },
];

const QUICK_LINKS = [
  { label: "新建战术", href: "/tactics/new/", emoji: "📝", desc: "创建阵型与路线" },
  { label: "添加球员", href: "/players/", emoji: "👤", desc: "管理球员档案" },
  { label: "新建比赛", href: "/matches/new/", emoji: "⚽", desc: "记录比赛事件" },
  { label: "训练日程", href: "/training/", emoji: "🏃", desc: "安排训练出勤" },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="首页" description="球队管理看板" />
      <div className="flex-1 p-6 space-y-6">
        {/* 欢迎横幅 */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary p-6 text-primary-foreground">
          <div className="relative z-10">
            <h2 className="text-xl font-bold">欢迎使用 Soccer Board</h2>
            <p className="text-sm mt-1 opacity-80">
              管理你的球队 — 战术、球员、比赛、训练一站搞定
            </p>
          </div>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none">
            ⚽
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.accent}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 近期赛程 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                近期赛程
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无赛程安排</p>
              </div>
            </CardContent>
          </Card>

          {/* 快速入口 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                快速入口
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {QUICK_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
                  >
                    <span className="text-lg">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
