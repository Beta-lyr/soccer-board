"use client";

import { useState } from "react";
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
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { LanguageSwitch } from "./language-switch";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login/";
  };

  const NAV_ITEMS = [
    { href: "/dashboard/", label: t("common.dashboard"), icon: LayoutDashboard },
    { href: "/tactics/", label: t("common.tactics"), icon: Swords },
    { href: "/players/", label: t("common.players"), icon: Users },
    { href: "/lineup/", label: t("common.lineup"), icon: LayoutList },
    { href: "/matches/", label: t("common.matches"), icon: Trophy },
    { href: "/stats/", label: t("common.stats"), icon: BarChart3 },
    { href: "/training/", label: t("common.training"), icon: Dumbbell },
    { href: "/calendar/", label: t("common.calendar"), icon: Calendar },
  ];

  const navContent = (
    <>
      <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
        {t("common.modules")}
      </p>
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href.replace(/\/$/, ""));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
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
    </>
  );

  return (
    <>
      {/* 移动端顶栏 */}
      <div className="fixed top-0 left-0 right-0 z-50 h-12 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs">
            ⚽
          </div>
          <span className="font-bold text-sm text-sidebar-foreground tracking-tight">
            SOCCER <span className="text-sidebar-primary">BOARD</span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitch />
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端遮罩 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 移动端侧边栏 */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -224 }}
            animate={{ x: 0 }}
            exit={{ x: -224 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 top-12 bottom-0 z-50 w-56 bg-sidebar border-r border-sidebar-border flex flex-col md:hidden"
          >
            <nav className="flex-1 overflow-y-auto px-3 py-4">{navContent}</nav>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-56 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-sm">
            ⚽
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight">SOCCER</span>
            <span className="font-bold text-sm tracking-tight text-sidebar-primary"> BOARD</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">{navContent}</nav>

        <div className="border-t border-sidebar-border p-3 flex items-center justify-between">
          <p className="text-[10px] text-sidebar-foreground/30 uppercase tracking-wider">
            v1.0
          </p>
          <div className="flex items-center gap-1">
            <LanguageSwitch />
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-1.5 text-sidebar-foreground/40 hover:text-sidebar-foreground/80 transition-colors"
              title="退出登录"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
