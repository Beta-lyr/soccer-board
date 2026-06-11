"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { StaggerList } from "@/components/ui/stagger-list";
import { HoverCard } from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Swords, Calendar, ArrowRight, Award, Shield, TrendingUp, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useMemo } from "react";
import { usePlayers } from "@/hooks/use-players";
import { useTactics } from "@/hooks/use-tactics";
import { useMatches } from "@/hooks/use-matches";
import { useCompetitions } from "@/hooks/use-competitions";
import { useTeams } from "@/hooks/use-teams";

function formatMatchDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const { players } = usePlayers();
  const { tactics } = useTactics();
  const { matches } = useMatches();
  const { competitions } = useCompetitions();
  const { teams } = useTeams();

  const playerCount = players.length;
  const tacticCount = tactics.length;
  const matchCount = matches.length;
  const compCount = competitions.length;
  const teamCount = teams.length;

  // 近期赛程（未开始的比赛，按日期排序，取前5）
  const upcomingMatches = useMemo(() => {
    return matches
      .filter((m) => m.status === "upcoming" && m.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [matches]);

  // 最近战绩（已结束的比赛，按日期倒序，取前5）
  const recentResults = useMemo(() => {
    return matches
      .filter((m) => m.status === "finished" && m.score)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [matches]);

  // 胜率统计
  const finishedMatches = matches.filter((m) => m.status === "finished" && m.score);
  const wins = finishedMatches.filter((m) => (m.score?.home ?? 0) > (m.score?.away ?? 0)).length;
  const draws = finishedMatches.filter((m) => (m.score?.home ?? 0) === (m.score?.away ?? 0)).length;
  const losses = finishedMatches.filter((m) => (m.score?.home ?? 0) < (m.score?.away ?? 0)).length;
  const winRate = finishedMatches.length > 0 ? Math.round((wins / finishedMatches.length) * 100) : 0;
  const goalsFor = finishedMatches.reduce((s, m) => s + (m.score?.home ?? 0), 0);
  const goalsAgainst = finishedMatches.reduce((s, m) => s + (m.score?.away ?? 0), 0);

  const STATS = [
    { label: t("dashboard.totalPlayers"), value: playerCount, icon: Users, accent: "bg-blue-500/10 text-blue-500" },
    { label: t("dashboard.totalMatches"), value: matchCount, icon: Trophy, accent: "bg-amber-500/10 text-amber-500" },
    { label: t("dashboard.totalCompetitions"), value: compCount, icon: Award, accent: "bg-violet-500/10 text-violet-500" },
    { label: t("dashboard.totalTeams"), value: teamCount, icon: Shield, accent: "bg-emerald-500/10 text-emerald-500" },
  ];

  const QUICK_LINKS = [
    { label: t("dashboard.newCompetition"), href: "/competitions/new/", emoji: "🏆", desc: t("dashboard.newCompetitionDesc") },
    { label: t("dashboard.newMatch"), href: "/matches/new/", emoji: "⚽", desc: t("dashboard.newMatchDesc") },
    { label: t("dashboard.addPlayer"), href: "/players/", emoji: "👤", desc: t("dashboard.addPlayerDesc") },
    { label: t("dashboard.manageTeams"), href: "/teams/", emoji: "🛡️", desc: t("dashboard.manageTeamsDesc") },
    { label: t("dashboard.newTactic"), href: "/tactics/new/", emoji: "📝", desc: t("dashboard.newTacticDesc") },
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
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl select-none opacity-10">
            ⚽
          </div>
        </motion.div>

        {/* 统计卡片 */}
        <StaggerList className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {STATS.map((stat) => (
            <HoverCard key={stat.label}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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

        {/* 战绩概览 */}
        {finishedMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t("dashboard.recentResults")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-500">{wins}</p>
                    <p className="text-xs text-muted-foreground">{t("comp.w")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{draws}</p>
                    <p className="text-xs text-muted-foreground">{t("comp.d")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{losses}</p>
                    <p className="text-xs text-muted-foreground">{t("comp.l")}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{winRate}%</p>
                    <p className="text-xs text-muted-foreground">{t("dashboard.winRate")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-muted-foreground">{t("dashboard.goalsFor")}:</span>
                    <span className="font-bold">{goalsFor}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    <span className="text-muted-foreground">{t("dashboard.goalsAgainst")}:</span>
                    <span className="font-bold">{goalsAgainst}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 近期赛程 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t("dashboard.upcomingMatches")}
                  </CardTitle>
                  {matches.length > 0 && (
                    <Link href="/matches/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {t("dashboard.viewAll")} →
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {upcomingMatches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t("dashboard.noMatches")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingMatches.map((m) => (
                      <Link
                        key={m.id}
                        href={`/matches/detail/?id=${m.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-sm font-medium truncate">{m.homeTeam || "我方"}</span>
                          <span className="text-xs text-muted-foreground shrink-0">vs</span>
                          <span className="text-sm font-medium truncate">{m.awayTeam || m.opponent}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span className="text-xs text-muted-foreground">{formatMatchDate(m.date)}</span>
                          {m.venue && <span className="text-xs text-muted-foreground hidden sm:inline">@{m.venue}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 最近战绩 */}
            {recentResults.length > 0 && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {t("comp.finished")}
                    </CardTitle>
                    <Link href="/matches/" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                      {t("dashboard.viewAll")} →
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {recentResults.map((m) => {
                      const isWin = (m.score?.home ?? 0) > (m.score?.away ?? 0);
                      const isDraw = (m.score?.home ?? 0) === (m.score?.away ?? 0);
                      return (
                        <Link
                          key={m.id}
                          href={`/matches/detail/?id=${m.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Badge variant="outline" className={`text-[10px] shrink-0 ${isWin ? "bg-emerald-500/15 text-emerald-600" : isDraw ? "bg-amber-500/15 text-amber-600" : "bg-red-500/15 text-red-600"}`}>
                              {isWin ? t("comp.w") : isDraw ? t("comp.d") : t("comp.l")}
                            </Badge>
                            <span className="text-sm font-medium truncate">{m.homeTeam || "我方"}</span>
                            <span className="text-sm font-bold tabular-nums shrink-0">{m.score!.home} - {m.score!.away}</span>
                            <span className="text-sm font-medium truncate">{m.awayTeam || m.opponent}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatMatchDate(m.date)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* 快速入口 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card>
              <CardHeader className="pb-3">
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
                      transition={{ delay: 0.5 + i * 0.06 }}
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
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground md:opacity-0 md:group-hover:opacity-100 md:group-hover:translate-x-0.5 transition-all" />
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
