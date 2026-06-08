"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { StaggerList } from "@/components/ui/stagger-list";
import { HoverCard } from "@/components/ui/hover-card";
import { Trophy, Users, Swords, Calendar, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function DashboardPage() {
  const { t } = useI18n();

  const STATS = [
    { label: t("dashboard.totalPlayers"), value: 0, icon: Users, accent: "bg-blue-500/10 text-blue-500" },
    { label: t("dashboard.totalTactics"), value: 0, icon: Swords, accent: "bg-violet-500/10 text-violet-500" },
    { label: t("dashboard.totalMatches"), value: 0, icon: Trophy, accent: "bg-amber-500/10 text-amber-500" },
    { label: t("dashboard.totalTrainings"), value: 0, icon: Calendar, accent: "bg-rose-500/10 text-rose-500" },
  ];

  const QUICK_LINKS = [
    { label: t("dashboard.newTactic"), href: "/tactics/new/", emoji: "📝", desc: t("dashboard.newTacticDesc") },
    { label: t("dashboard.addPlayer"), href: "/players/", emoji: "👤", desc: t("dashboard.addPlayerDesc") },
    { label: t("dashboard.newMatch"), href: "/matches/new/", emoji: "⚽", desc: t("dashboard.newMatchDesc") },
    { label: t("dashboard.trainingSchedule"), href: "/training/", emoji: "🏃", desc: t("dashboard.trainingScheduleDesc") },
  ];

  return (
    <PageTransition>
      <Header title={t("common.dashboard")} />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 欢迎横幅 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/90 to-primary p-5 md:p-6 text-primary-foreground"
        >
          <div className="relative z-10">
            <h2 className="text-lg md:text-xl font-bold">{t("dashboard.welcome")}</h2>
            <p className="text-sm mt-1 opacity-80">{t("dashboard.welcomeDesc")}</p>
          </div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 0.1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl select-none"
          >
            ⚽
          </motion.div>
        </motion.div>

        {/* 统计卡片 */}
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STATS.map((stat) => (
            <HoverCard key={stat.label}>
              <Card className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </CardTitle>
                  <div className={`p-1.5 rounded-lg ${stat.accent}`}>
                    <stat.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <AnimatedCounter
                    value={stat.value}
                    className="text-2xl md:text-3xl font-bold tracking-tight"
                  />
                </CardContent>
              </Card>
            </HoverCard>
          ))}
        </StaggerList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 近期赛程 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  {t("dashboard.upcomingMatches")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t("dashboard.noMatches")}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* 快速入口 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">
                  {t("dashboard.quickActions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {QUICK_LINKS.map((item, i) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.08 }}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors group"
                      >
                        <span className="text-lg">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
