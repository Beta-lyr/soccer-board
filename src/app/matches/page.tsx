"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard } from "@/components/ui/hover-card";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";

const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600 animate-pulse", finished: "bg-gray-500/15 text-gray-600" };
const TYPE_LABELS: Record<string, string> = { league: "联赛", friendly: "友谊赛", training: "训练赛" };

export default function MatchesPage() {
  const { t } = useI18n();
  const { matches, deleteMatch } = useMatches();

  const handleDelete = async (id: string) => {
    if (confirm("确认删除此比赛？")) await deleteMatch(id);
  };

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
      <div className="flex-1 p-4 md:p-6">
        {matches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t("matches.noMatches")}</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } }}
            className="space-y-3"
          >
            {matches.map((match) => (
              <motion.div key={match.id} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } }}>
                <HoverCard>
                  <Card className="group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <Link href={`/matches/detail/?id=${match.id}`} className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">vs {match.opponent}</span>
                                <Badge variant="outline" className={STATUS_COLORS[match.status]}>
                                  {match.status === "live" && "● "}{STATUS_LABELS[match.status]}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{new Date(match.date).toLocaleDateString("zh-CN")}</span>
                                {match.venue && <span>@ {match.venue}</span>}
                                <span>{TYPE_LABELS[match.type]}</span>
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
                </HoverCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
