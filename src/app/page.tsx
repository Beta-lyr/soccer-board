"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Swords, Trophy, Calendar } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-2xl text-center space-y-8">
          <div className="text-6xl">⚽</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Soccer <span className="text-primary">Board</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            大学足球队管理系统 — 战术板、球员管理、比赛记录、训练日程一站式搞定
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            {[
              { icon: Swords, label: "战术板", desc: "可视化阵型与路线" },
              { icon: Users, label: "球员管理", desc: "档案与能力评估" },
              { icon: Trophy, label: "比赛记录", desc: "实时事件与评分" },
              { icon: Calendar, label: "训练日程", desc: "出勤与主题管理" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border p-4 text-center space-y-2">
                <item.icon className="h-6 w-6 mx-auto text-primary" />
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <Link href="/dashboard/">
            <Button size="lg" className="text-base px-8">
              进入系统 <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-xs text-muted-foreground">
        Soccer Board © {new Date().getFullYear()}
      </div>
    </div>
  );
}
