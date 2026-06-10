"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600 animate-pulse", finished: "bg-gray-500/15 text-gray-600" };

type FilterTab = "all" | "league" | "cup" | "friendly" | "training";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "league", label: "联赛" },
  { value: "cup", label: "杯赛" },
  { value: "friendly", label: "友谊赛" },
  { value: "training", label: "训练赛" },
];

/** 格式化日期时间 */
function formatDateTime(dateStr: string): string {
  if (!dateStr) return "待定";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${month}/${day} ${hours}:${minutes}`;
}

export default function MatchesPage() {
  const { t } = useI18n();
  const { matches } = useMatches();
  const competitionsRaw = useLiveQuery(() => db.competitions.toArray());
  const competitions = useMemo(() => competitionsRaw ?? [], [competitionsRaw]);
  const [tab, setTab] = useState<FilterTab>("all");

  // 按时间排序（有日期的在前，按日期倒序；无日期的在后）
  const sorted = useMemo(() => {
    const filtered = tab === "all" ? matches : matches.filter((m) => m.type === tab);
    return [...filtered].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da === 0 && db === 0) return 0;
      if (da === 0) return 1;
      if (db === 0) return -1;
      return db - da; // 倒序，最近的在前
    });
  }, [matches, tab]);

  // 按赛事分组
  const grouped = useMemo(() => {
    const compMap = new Map<string, typeof sorted>();
    const noComp: typeof sorted = [];

    for (const m of sorted) {
      if (m.competitionId) {
        if (!compMap.has(m.competitionId)) compMap.set(m.competitionId, []);
        compMap.get(m.competitionId)!.push(m);
      } else {
        noComp.push(m);
      }
    }

    const groups: { id: string; name: string; type: string; matches: typeof sorted }[] = [];
    for (const [compId, compMatches] of compMap) {
      const comp = competitions.find((c) => c.id === compId);
      groups.push({ id: compId, name: comp?.name ?? "未知赛事", type: comp?.type ?? "league", matches: compMatches });
    }
    if (noComp.length > 0) {
      groups.push({ id: "__other__", name: "其他比赛", type: "other", matches: noComp });
    }
    return groups;
  }, [sorted, competitions]);

  return (
    <PageTransition>
      <Header
        title={t("matches.title")}
        description={`${matches.length} 场比赛`}
      />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* 筛选 Tab */}
        <div className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-md transition-colors",
                tab === t.value ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {sorted.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t("matches.noMatches")}</p>
            <p className="text-sm mt-1">在「赛事」页面创建赛事来添加比赛</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const Icon = group.type === "cup" ? Swords : Trophy;
              return (
                <div key={group.id}>
                  {grouped.length > 1 && (
                    <div className="flex items-center gap-2 mb-2">
                      {group.type !== "other" && <Icon className="h-4 w-4 text-muted-foreground" />}
                      <h3 className="text-sm font-semibold text-muted-foreground">{group.name}</h3>
                      <span className="text-xs text-muted-foreground">({group.matches.length})</span>
                    </div>
                  )}

                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } }}
                    className="space-y-2"
                  >
                    {group.matches.map((match) => {
                      const homeName = match.homeTeam || "我方";
                      const awayName = match.awayTeam || match.opponent;
                      return (
                        <motion.div key={match.id} variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2 } } }}>
                          <Link href={`/matches/detail/?id=${match.id}`}>
                            <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-semibold text-sm">{homeName} vs {awayName}</span>
                                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[match.status]}`}>
                                        {match.status === "live" && "● "}{STATUS_LABELS[match.status]}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span>{formatDateTime(match.date)}</span>
                                      {match.venue && <span>@ {match.venue}</span>}
                                    </div>
                                  </div>
                                  {match.score && (
                                    <div className="text-2xl font-black tabular-nums">
                                      {match.score.home} - {match.score.away}
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
