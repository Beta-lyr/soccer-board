"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Swords,
  Users,
  LayoutList,
  Trophy,
  BarChart3,
  Dumbbell,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "首页", icon: LayoutDashboard },
  { href: "/tactics/", label: "战术板", icon: Swords },
  { href: "/players/", label: "球员", icon: Users },
  { href: "/lineup/", label: "阵容", icon: LayoutList },
  { href: "/matches/", label: "比赛", icon: Trophy },
  { href: "/stats/", label: "数据", icon: BarChart3 },
  { href: "/training/", label: "训练", icon: Dumbbell },
  { href: "/calendar/", label: "日历", icon: Calendar },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 border-r bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <span className="text-xl">⚽</span>
        <span className="font-bold text-lg">足球队管理</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.replace(/\/$/, ""));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-4">
        <p className="text-xs text-muted-foreground text-center">
          Soccer Board v1.0
        </p>
      </div>
    </aside>
  );
}
