"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Trophy, Swords } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600 animate-pulse", finished: "bg-gray-500/15 text-gray-600" };
const TYPE_LABELS: Record<string, string> = { league: "联赛", friendly: "友谊赛", training: "训练赛", cup: "杯赛" };

type FilterTab = "all" | "league" | "cup" | "friendly" | "training";

export default function MatchesPage() {
  const { t } = useI18n();
  const { matches, deleteMatch } = useMatches();
  const competitionsRaw = useLiveQuery(() => db.competitions.toArray());
  const competitions = useMemo(() => competitionsRaw ?? [], [competitionsRaw]);
  const [tab, setTab] = useState<FilterTab>("all");

  const handleDelete = async (id: string) => {
    if (confirm("确认删除此比赛？")) await deleteMatch(id);
  };

  // 按赛事分组
  const grouped = useMemo(() => {
    const filtered = tab === "all" ? matches : matches.filter((m) => m.type === tab);

    // 赛事分组
    const compMap = new Map<string, typeof matches>();
    const noComp: typeof matches = [];

    for (const m of filtered) {
      if (m.competitionId) {
        if (!compMap.has(m.competitionId)) compMap.set(m.competitionId, []);
        compMap.get(m.competitionId)!.push(m);
      } else {
        noComp.push(m);
      }
    }

    const groups: { id: string; name: string; type: string; matches: typeof matches }[] = [];

    for (const [compId, compMatches] of compMap) {
      const comp = competitions.find((c) => c.id === compId);
      groups.push({
        id: compId,
        name: comp?.name ?? "未知赛事",
        type: comp?.type ?? "league",
        matches: compMatches,
      });
    }

    if (noComp.length > 0) {
      groups.push({ id: "__other__", name: "其他比赛", type: "other", matches: noComp });
    }

    return groups;
  }, [matches, tab, competitions]);

  const TABS: { value: FilterTab; label: string }[] = [
    { value: "all", label: "全部" },
    { value: "league", label: "联赛" },
    { value: "cup", label: "杯赛" },
    { value: "friendly", label: "友谊赛" },
    { value: "training", label: "训练赛" },
  ];

  return (
    <PageTransition>
      <Header
        title={t("matches.title")}
        description={`${matches.length} 场比赛`}
        actions={
          <Link href="/matches/new/">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{t("matches.newMatch")}</Button>
          </Link>
        }
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

        {matches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t("matches.noMatches")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const Icon = group.type === "cup" ? Swords : Trophy;
              return (
                <div key={group.id}>
                  {/* 分组标题 */}
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
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
                    className="space-y-2"
                  >
                    {group.matches.map((match) => {
                      const homeName = match.homeTeam || "我方";
                      const awayName = match.awayTeam || match.opponent;
                      return (
                        <motion.div key={match.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}>
                          <Card className="group">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <Link href={`/matches/detail/?id=${match.id}`} className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold">{homeName} vs {awayName}</span>
                                        <Badge variant="outline" className={STATUS_COLORS[match.status]}>
                                          {match.status === "live" && "● "}{STATUS_LABELS[match.status]}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span>{new Date(match.date).toLocaleDateString("zh-CN")}</span>
                                        {match.venue && <span>@ {match.venue}</span>}
                                        <span>{TYPE_LABELS[match.type]}</span>
                                        {match.scope === "internal" && <span className="text-primary/60">校内</span>}
                                      </div>
                                    </div>
                                    {match.score && (
                                      <div className="text-2xl font-black tabular-nums ml-auto mr-4">
                                        {match.score.home} - {match.score.away}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(match.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
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
