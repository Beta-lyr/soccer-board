"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompetitions } from "@/hooks/use-competitions";
import { useMatches } from "@/hooks/use-matches";
import { ArrowLeft, Trash2, Trophy, Swords } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

const TYPE_LABELS: Record<string, string> = { league: "联赛", cup: "杯赛" };
const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600", finished: "bg-gray-500/15 text-gray-600" };

function CompetitionDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { competitions, deleteCompetition } = useCompetitions();
  const { matches } = useMatches();

  const comp = competitions.find((c) => c.id === id);

  if (!comp) {
    return (
      <PageTransition>
        <Header title="赛事详情" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-3">赛事不存在或已删除</p>
            <Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回列表</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const compMatches = matches.filter((m) => comp.matchIds.includes(m.id));
  const finishedMatches = compMatches.filter((m) => m.status === "finished");

  const handleDelete = async () => {
    if (confirm(`确认删除赛事「${comp.name}」？关联的比赛不会被删除。`)) {
      await deleteCompetition(comp.id);
      toast.success("赛事已删除");
      router.push("/competitions/");
    }
  };

  return (
    <PageTransition>
      <Header
        title={comp.name}
        description={`${TYPE_LABELS[comp.type]} · ${comp.format === "round_robin" ? "单循环" : "淘汰制"} · ${comp.teams.length} 支队伍`}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />删除
            </Button>
            <Link href="/competitions/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
            </Link>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 积分榜（联赛） */}
        {comp.type === "league" && comp.standings && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />积分榜</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left py-2 pr-3">#</th>
                        <th className="text-left py-2 pr-3">队伍</th>
                        <th className="text-center py-2 px-2">场</th>
                        <th className="text-center py-2 px-2">胜</th>
                        <th className="text-center py-2 px-2">平</th>
                        <th className="text-center py-2 px-2">负</th>
                        <th className="text-center py-2 px-2">进</th>
                        <th className="text-center py-2 px-2">失</th>
                        <th className="text-center py-2 px-2">净</th>
                        <th className="text-center py-2 pl-2 font-bold">分</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...comp.standings]
                        .sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst))
                        .map((s, idx) => (
                          <tr key={s.team} className="border-b last:border-0 hover:bg-accent/30">
                            <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{idx + 1}</td>
                            <td className="py-2 pr-3 font-medium">{s.team}</td>
                            <td className="py-2 px-2 text-center">{s.played}</td>
                            <td className="py-2 px-2 text-center">{s.wins}</td>
                            <td className="py-2 px-2 text-center">{s.draws}</td>
                            <td className="py-2 px-2 text-center">{s.losses}</td>
                            <td className="py-2 px-2 text-center">{s.goalsFor}</td>
                            <td className="py-2 px-2 text-center">{s.goalsAgainst}</td>
                            <td className="py-2 px-2 text-center">{s.goalsFor - s.goalsAgainst}</td>
                            <td className="py-2 pl-2 text-center font-bold">{s.points}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 杯赛对阵 */}
        {comp.type === "cup" && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Swords className="h-4 w-4" />对阵表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {compMatches.map((m, idx) => {
                    const homeTeam = comp.teams.find((t) => t !== m.opponent) ?? "我方";
                    return (
                      <Link key={m.id} href={`/matches/detail/?id=${m.id}`}>
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-6 text-center">{idx + 1}</span>
                            <span className="text-sm font-medium">{homeTeam}</span>
                            <span className="text-xs text-muted-foreground">vs</span>
                            <span className="text-sm font-medium">{m.opponent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.score && (
                              <span className="text-sm font-bold tabular-nums">{m.score.home} - {m.score.away}</span>
                            )}
                            <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 比赛列表 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">比赛列表 ({finishedMatches.length}/{compMatches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {compMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">暂无比赛</p>
              ) : (
                <div className="space-y-2">
                  {compMatches.map((m) => (
                    <Link key={m.id} href={`/matches/detail/?id=${m.id}`}>
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{m.opponent}</span>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</Badge>
                        </div>
                        {m.score && (
                          <span className="text-sm font-bold tabular-nums">{m.score.home} - {m.score.away}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default function CompetitionDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">加载中...</div>}>
      <CompetitionDetailContent />
    </Suspense>
  );
}
