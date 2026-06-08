import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Swords, Calendar } from "lucide-react";

const STATS = [
  { label: "球员总数", value: "0", icon: Users, color: "text-blue-500" },
  { label: "战术方案", value: "0", icon: Swords, color: "text-green-500" },
  { label: "比赛场次", value: "0", icon: Trophy, color: "text-orange-500" },
  { label: "训练次数", value: "0", icon: Calendar, color: "text-purple-500" },
];

export default function DashboardPage() {
  return (
    <>
      <Header title="首页" description="球队管理看板" />
      <div className="flex-1 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>近期赛程</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">暂无赛程安排</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快速入口</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "新建战术", href: "/tactics/new/", emoji: "📝" },
                { label: "添加球员", href: "/players/", emoji: "👤" },
                { label: "新建比赛", href: "/matches/new/", emoji: "⚽" },
                { label: "训练日程", href: "/training/", emoji: "🏃" },
              ].map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-lg border p-4 hover:bg-accent transition-colors"
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
