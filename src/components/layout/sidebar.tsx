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
import { ThemeToggle } from "./theme-toggle";

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
    <aside className="fixed left-0 top-0 z-40 h-screen w-56 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm">
          ⚽
        </div>
        <div>
          <span className="font-bold text-sm tracking-tight">SOCCER</span>
          <span className="font-bold text-sm tracking-tight text-sidebar-primary"> BOARD</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
          功能模块
        </p>
        <ul className="space-y-0.5">
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
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground/90"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 flex items-center justify-between">
        <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-wider">
          v1.0
        </p>
        <ThemeToggle />
      </div>
    </aside>
  );
}
