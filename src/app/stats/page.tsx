"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { motion } from "framer-motion";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function StatsPage() {
  const { t } = useI18n();
  const players = useLiveQuery(() => db.players.toArray()) ?? [];
  const matches = useLiveQuery(() => db.matches.toArray()) ?? [];

  // 球员排行数据
  const playerStats = players.map((p) => {
    const appearances = matches.filter((m) => m.status === "finished" && m.lineup.some((l) => l.playerId === p.id)).length;
    const goals = matches.reduce((sum, m) => sum + m.events.filter((e) => e.type === "goal" && e.playerId === p.id).length, 0);
    const assists = matches.reduce((sum, m) => sum + m.events.filter((e) => e.type === "goal" && e.relatedPlayerId === p.id).length, 0);
    const yellowCards = matches.reduce((sum, m) => sum + m.events.filter((e) => e.type === "yellow_card" && e.playerId === p.id).length, 0);
    const redCards = matches.reduce((sum, m) => sum + m.events.filter((e) => e.type === "red_card" && e.playerId === p.id).length, 0);
    const ratings = matches.filter((m) => m.ratings.some((r) => r.playerId === p.id));
    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, m) => sum + (m.ratings.find((r) => r.playerId === p.id)?.score ?? 0), 0) / ratings.length).toFixed(1)
      : "-";
    return { ...p, appearances, goals, assists, yellowCards, redCards, avgRating };
  }).sort((a, b) => b.goals - a.goals);

  // 球队统计
  const finishedMatches = matches.filter((m) => m.status === "finished");
  const wins = finishedMatches.filter((m) => (m.score?.home ?? 0) > (m.score?.away ?? 0)).length;
  const draws = finishedMatches.filter((m) => (m.score?.home ?? 0) === (m.score?.away ?? 0)).length;
  const losses = finishedMatches.filter((m) => (m.score?.home ?? 0) < (m.score?.away ?? 0)).length;
  const goalsFor = finishedMatches.reduce((sum, m) => sum + (m.score?.home ?? 0), 0);
  const goalsAgainst = finishedMatches.reduce((sum, m) => sum + (m.score?.away ?? 0), 0);

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
      <div className="flex-1 p-4 md:p-6">
        <Tabs defaultValue="players" className="space-y-4">
          <TabsList>
            <TabsTrigger value="players">球员排行</TabsTrigger>
            <TabsTrigger value="team">球队统计</TabsTrigger>
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
              {/* 概览 */}
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
                {/* 胜平负饼图 */}
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

                {/* 进失球柱状图 */}
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
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
}
