"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { usePlayers } from "@/hooks/use-players";
import { useMatches } from "@/hooks/use-matches";
import { useCompetitions } from "@/hooks/use-competitions";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";
import { Trophy, Swords, TrendingUp, Users } from "lucide-react";
import type { Match, Player } from "@/types";

/** 计算球员统计数据 */
function calcPlayerStats(players: Player[], matches: Match[]) {
  const finished = matches.filter((m) => m.status === "finished");
  return players
    .map((p) => {
      const appearances = finished.filter((m) =>
        m.homeLineup?.some((l) => l.playerId === p.id) ||
        m.lineup?.some((l) => l.playerId === p.id)
      ).length;
      const goals = finished.reduce((s, m) => s + m.events.filter((e) => e.type === "goal" && e.playerId === p.id).length, 0);
      const assists = finished.reduce((s, m) => s + m.events.filter((e) => e.type === "goal" && e.relatedPlayerId === p.id).length, 0);
      const yellowCards = finished.reduce((s, m) => s + m.events.filter((e) => e.type === "yellow_card" && e.playerId === p.id).length, 0);
      const redCards = finished.reduce((s, m) => s + m.events.filter((e) => e.type === "red_card" && e.playerId === p.id).length, 0);
      const rated = finished.filter((m) => m.ratings.some((r) => r.playerId === p.id));
      const avgRating =
        rated.length > 0
          ? (rated.reduce((s, m) => s + (m.ratings.find((r) => r.playerId === p.id)?.score ?? 0), 0) / rated.length).toFixed(1)
          : "-";
      return { ...p, appearances, goals, assists, yellowCards, redCards, avgRating };
    })
    .filter((p) => p.appearances > 0)
    .sort((a, b) => b.goals - a.goals);
}

/** 计算各队统计数据（仅校内比赛） */
function calcTeamStats(matches: Match[]) {
  const finished = matches.filter((m) => m.status === "finished" && m.score && m.scope === "internal");
  const map = new Map<string, { team: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }>();

  for (const m of finished) {
    if (!m.score) continue;
    for (const team of [m.homeTeam, m.awayTeam]) {
      if (!team) continue;
      if (!map.has(team)) map.set(team, { team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
    }
    const home = map.get(m.homeTeam!);
    const away = map.get(m.awayTeam!);
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += m.score.home;
    home.goalsAgainst += m.score.away;
    away.goalsFor += m.score.away;
    away.goalsAgainst += m.score.home;

    if (m.score.home > m.score.away) { home.wins++; away.losses++; }
    else if (m.score.home < m.score.away) { away.wins++; home.losses++; }
    else { home.draws++; away.draws++; }
  }

  return [...map.values()]
    .map((t) => ({ ...t, points: t.wins * 3 + t.draws, goalDiff: t.goalsFor - t.goalsAgainst }))
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff);
}

export default function StatsPage() {
  const { t } = useI18n();
  const { players } = usePlayers();
  const { matches: allMatches } = useMatches();
  const { competitions } = useCompetitions();

  const [filterId, setFilterId] = useState<string>("all");

  // 根据筛选条件过滤比赛
  const matches = useMemo(() => {
    if (filterId === "all") return allMatches;
    if (filterId === "no-comp") return allMatches.filter((m) => !m.competitionId);
    return allMatches.filter((m) => m.competitionId === filterId);
  }, [allMatches, filterId]);

  const playerStats = useMemo(() => calcPlayerStats(players, matches), [players, matches]);
  const teamStats = useMemo(() => calcTeamStats(matches), [matches]);
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const wins = finishedMatches.filter((m) => (m.score?.home ?? 0) > (m.score?.away ?? 0)).length;
  const draws = finishedMatches.filter((m) => (m.score?.home ?? 0) === (m.score?.away ?? 0)).length;
  const losses = finishedMatches.filter((m) => (m.score?.home ?? 0) < (m.score?.away ?? 0)).length;
  const goalsFor = finishedMatches.reduce((s, m) => s + (m.score?.home ?? 0), 0);
  const goalsAgainst = finishedMatches.reduce((s, m) => s + (m.score?.away ?? 0), 0);

  const recordData = [
    { name: "胜", value: wins, color: "#22c55e" },
    { name: "平", value: draws, color: "#f59e0b" },
    { name: "负", value: losses, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const goalsData = [
    { name: "进球", value: goalsFor },
    { name: "失球", value: goalsAgainst },
  ];

  return (
    <PageTransition>
      <Header title={t("stats.title")} description={t("stats.desc")} />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* 赛事筛选 */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">筛选:</span>
          <Select value={filterId} onValueChange={(v) => v && setFilterId(v)}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部比赛</SelectItem>
              <SelectItem value="no-comp">非赛事比赛</SelectItem>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">球员排行</TabsTrigger>
            <TabsTrigger value="team">球队统计</TabsTrigger>
            <TabsTrigger value="competitions">赛事统计</TabsTrigger>
          </TabsList>

          {/* 球员排行 */}
          <TabsContent value="players">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader><CardTitle className="text-sm">球员数据排行</CardTitle></CardHeader>
                <CardContent>
                  {playerStats.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">{t("stats.noStats")}</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>球员</TableHead>
                            <TableHead className="text-center">出场</TableHead>
                            <TableHead className="text-center">进球</TableHead>
                            <TableHead className="text-center">助攻</TableHead>
                            <TableHead className="text-center">黄牌</TableHead>
                            <TableHead className="text-center">红牌</TableHead>
                            <TableHead className="text-center">评分</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {playerStats.map((p, i) => (
                            <TableRow key={p.id}>
                              <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-7 w-7">
                                    <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{p.number}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{p.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{p.appearances}</TableCell>
                              <TableCell className="text-center font-bold">{p.goals}</TableCell>
                              <TableCell className="text-center">{p.assists}</TableCell>
                              <TableCell className="text-center">{p.yellowCards}</TableCell>
                              <TableCell className="text-center">{p.redCards}</TableCell>
                              <TableCell className="text-center font-bold text-primary">{p.avgRating}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* 球队统计 */}
          <TabsContent value="team">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "总场次", value: finishedMatches.length },
                  { label: "胜率", value: finishedMatches.length > 0 ? `${Math.round((wins / finishedMatches.length) * 100)}%` : "-" },
                  { label: "总进球", value: goalsFor },
                  { label: "总失球", value: goalsAgainst },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="p-4 text-center">
                      <p className="text-xs text-muted-foreground uppercase">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-sm">战绩分布</CardTitle></CardHeader>
                  <CardContent>
                    {recordData.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">暂无数据</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={recordData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name} ${value}`}>
                            {recordData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-sm">进失球对比</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={goalsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* 各队对比表（仅校内比赛） */}
              {teamStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />各队对比（校内比赛）
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>队伍</TableHead>
                            <TableHead className="text-center">场</TableHead>
                            <TableHead className="text-center">胜</TableHead>
                            <TableHead className="text-center">平</TableHead>
                            <TableHead className="text-center">负</TableHead>
                            <TableHead className="text-center">进</TableHead>
                            <TableHead className="text-center">失</TableHead>
                            <TableHead className="text-center">净</TableHead>
                            <TableHead className="text-center font-bold">分</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamStats.map((s, i) => (
                            <TableRow key={s.team}>
                              <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                              <TableCell className="font-medium">{s.team}</TableCell>
                              <TableCell className="text-center">{s.played}</TableCell>
                              <TableCell className="text-center">{s.wins}</TableCell>
                              <TableCell className="text-center">{s.draws}</TableCell>
                              <TableCell className="text-center">{s.losses}</TableCell>
                              <TableCell className="text-center">{s.goalsFor}</TableCell>
                              <TableCell className="text-center">{s.goalsAgainst}</TableCell>
                              <TableCell className="text-center">{s.goalDiff}</TableCell>
                              <TableCell className="text-center font-bold">{s.points}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* 赛事统计 */}
          <TabsContent value="competitions">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              {competitions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">暂无赛事数据</p>
                  </CardContent>
                </Card>
              ) : (
                competitions.map((comp) => {
                  const compMatches = allMatches.filter((m) => m.competitionId === comp.id);
                  const compFinished = compMatches.filter((m) => m.status === "finished");
                  const compGoals = compFinished.reduce((s, m) => s + (m.score?.home ?? 0) + (m.score?.away ?? 0), 0);
                  const avgGoals = compFinished.length > 0 ? (compGoals / compFinished.length).toFixed(1) : "-";

                  // 射手榜（该赛事内）
                  const scorers = new Map<string, { name: string; team: string; goals: number }>();
                  for (const m of compFinished) {
                    for (const e of m.events) {
                      if (e.type !== "goal") continue;
                      const player = players.find((p) => p.id === e.playerId);
                      const key = e.playerId;
                      const existing = scorers.get(key);
                      if (existing) {
                        existing.goals++;
                      } else {
                        scorers.set(key, {
                          name: player?.name ?? "未知",
                          team: m.homeTeam === "我方" ? "我方" : (m.homeLineup?.some((l) => l.playerId === e.playerId) ? m.homeTeam : m.awayTeam),
                          goals: 1,
                        });
                      }
                    }
                  }
                  const topScorers = [...scorers.values()].sort((a, b) => b.goals - a.goals).slice(0, 3);

                  const Icon = comp.type === "cup" ? Swords : Trophy;

                  return (
                    <Card key={comp.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {comp.name}
                          </CardTitle>
                          <span className="text-xs text-muted-foreground">
                            {comp.type === "league" ? "联赛" : "杯赛"} · {comp.teams.length} 队
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold">{compFinished.length}/{compMatches.length}</p>
                            <p className="text-[10px] text-muted-foreground">已完成/总场次</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{compGoals}</p>
                            <p className="text-[10px] text-muted-foreground">总进球</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{avgGoals}</p>
                            <p className="text-[10px] text-muted-foreground">场均进球</p>
                          </div>
                        </div>

                        {topScorers.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1.5">射手榜</p>
                            <div className="flex flex-wrap gap-2">
                              {topScorers.map((s, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-muted">
                                  {s.name}({s.team}) {s.goals}球
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}

              {/* 非赛事比赛统计 */}
              {(() => {
                const noCompMatches = allMatches.filter((m) => !m.competitionId);
                const noCompFinished = noCompMatches.filter((m) => m.status === "finished");
                if (noCompMatches.length === 0) return null;
                return (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />其他比赛（友谊赛/训练赛）
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-bold">{noCompFinished.length}/{noCompMatches.length}</p>
                          <p className="text-[10px] text-muted-foreground">已完成/总场次</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{noCompFinished.reduce((s, m) => s + (m.score?.home ?? 0) + (m.score?.away ?? 0), 0)}</p>
                          <p className="text-[10px] text-muted-foreground">总进球</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{noCompFinished.length > 0 ? (noCompFinished.reduce((s, m) => s + (m.score?.home ?? 0) + (m.score?.away ?? 0), 0) / noCompFinished.length).toFixed(1) : "-"}</p>
                          <p className="text-[10px] text-muted-foreground">场均进球</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
