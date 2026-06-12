"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { usePlayers } from "@/hooks/use-players";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, X, Plus, Users } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Player, PlayerAbilities } from "@/types";

const CHART_COLORS = [
  { stroke: "var(--primary)", fill: "var(--primary)" },
  { stroke: "#f59e0b", fill: "#f59e0b" },
  { stroke: "#10b981", fill: "#10b981" },
];

const ABILITY_KEYS: (keyof PlayerAbilities)[] = ["speed", "shooting", "passing", "defending", "stamina", "awareness"];

export default function PlayerComparePage() {
  const { t } = useI18n();
  const { players } = usePlayers();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSelector, setShowSelector] = useState(false);

  const selectedPlayers = selectedIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
  const availablePlayers = players.filter((p) => !selectedIds.includes(p.id) && p.status === "healthy");

  const addPlayer = (id: string) => {
    if (selectedIds.length >= 3) return;
    setSelectedIds([...selectedIds, id]);
    setShowSelector(false);
  };

  const removePlayer = (id: string) => {
    setSelectedIds(selectedIds.filter((pid) => pid !== id));
  };

  const LABELS: Record<keyof PlayerAbilities, string> = {
    speed: t("players.speed"),
    shooting: t("players.shooting"),
    passing: t("players.passing"),
    defending: t("players.defending"),
    stamina: t("players.stamina"),
    awareness: t("players.awareness"),
  };

  const chartData = ABILITY_KEYS.map((key) => {
    const point: Record<string, string | number> = { subject: LABELS[key], fullMark: 10 };
    selectedPlayers.forEach((p, i) => {
      point[`player${i}`] = p.abilities[key];
    });
    return point;
  });

  const getOverall = (p: Player) => (Object.values(p.abilities).reduce((a, b) => a + b, 0) / 6).toFixed(1);

  return (
    <PageTransition>
      <Header
        title={t("players.compare")}
        actions={
          <Link href="/players/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 选择球员区 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("players.selectToCompare")} ({selectedPlayers.length}/3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <AnimatePresence mode="popLayout">
                {selectedPlayers.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <div className="flex items-center gap-2 p-2 pr-3 rounded-lg border bg-card">
                      <Avatar className="h-8 w-8">
                        {p.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(p.avatar)}`} />}
                        <AvatarFallback className="text-xs" style={{ backgroundColor: CHART_COLORS[i].fill, color: "white" }}>{p.number}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">#{p.number} · {p.positions[0]}</div>
                      </div>
                      <button onClick={() => removePlayer(p.id)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {selectedIds.length < 3 && (
                <Button variant="outline" className="h-auto py-2 px-3 border-dashed" onClick={() => setShowSelector(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {t("players.addPlayer")}
                </Button>
              )}
            </div>

            {/* 球员选择器 */}
            <AnimatePresence>
              {showSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    {availablePlayers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">{t("players.noAvailable")}</p>
                    ) : (
                      <div className="space-y-1">
                        {availablePlayers.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => addPlayer(p.id)}
                            className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left"
                          >
                            <Avatar className="h-6 w-6">
                              {p.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(p.avatar)}`} />}
                              <AvatarFallback className="text-[10px]">{p.number}</AvatarFallback>
                            </Avatar>
                            <span className="flex-1 text-sm truncate">#{p.number} {p.name}</span>
                            <span className="text-xs text-muted-foreground">{p.positions[0]}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowSelector(false)}>{t("common.cancel")}</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* 对比内容 */}
        {selectedPlayers.length >= 2 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 雷达图对比 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("players.abilityComparison")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={chartData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 10]}
                      tickCount={6}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    {selectedPlayers.map((p, i) => (
                      <Radar
                        key={p.id}
                        name={p.name}
                        dataKey={`player${i}`}
                        stroke={CHART_COLORS[i].stroke}
                        fill={CHART_COLORS[i].fill}
                        fillOpacity={0.15}
                        strokeWidth={2}
                        animationDuration={800}
                      />
                    ))}
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      formatter={(value) => <span className="text-foreground">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 数据对比表格 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t("players.dataComparison")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 pr-3 text-muted-foreground font-normal">{t("players.ability")}</th>
                        {selectedPlayers.map((p, i) => (
                          <th key={p.id} className="text-center py-2 px-2">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i].fill }} />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ABILITY_KEYS.map((key) => {
                        const values = selectedPlayers.map((p) => p.abilities[key]);
                        const max = Math.max(...values);
                        return (
                          <tr key={key} className="border-b last:border-0">
                            <td className="py-2 pr-3 text-muted-foreground">{LABELS[key]}</td>
                            {selectedPlayers.map((p, i) => {
                              const val = p.abilities[key];
                              const isMax = val === max && values.filter((v) => v === max).length === 1;
                              return (
                                <td key={p.id} className="text-center py-2 px-2">
                                  <span className={isMax ? "font-bold text-primary" : "font-medium"}>
                                    {val}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                      <tr className="border-t-2">
                        <td className="py-2 pr-3 font-medium">{t("players.overall")}</td>
                        {selectedPlayers.map((p) => (
                          <td key={p.id} className="text-center py-2 px-2">
                            <Badge variant="outline" className="font-bold">{getOverall(p)}</Badge>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 球员详情卡片 */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedPlayers.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar className="h-10 w-10">
                          {p.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(p.avatar)}`} />}
                          <AvatarFallback style={{ backgroundColor: CHART_COLORS[i].fill, color: "white" }}>{p.number}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-bold">{p.name}</div>
                          <div className="text-xs text-muted-foreground">#{p.number} · {p.positions.join(", ")}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div><span className="text-muted-foreground">{t("players.height")}:</span> {p.height ? `${p.height}cm` : "-"}</div>
                        <div><span className="text-muted-foreground">{t("players.weight")}:</span> {p.weight ? `${p.weight}kg` : "-"}</div>
                        <div><span className="text-muted-foreground">{t("players.preferredFoot")}:</span> {t(`players.${p.preferredFoot === "left" ? "leftFoot" : p.preferredFoot === "both" ? "bothFeet" : "rightFoot"}`)}</div>
                        <div><span className="text-muted-foreground">{t("players.overall")}:</span> <span className="font-bold text-primary">{getOverall(p)}</span></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>{t("players.selectAtLeast2")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
