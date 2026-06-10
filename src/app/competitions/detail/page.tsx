"use client";

import { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCompetitions, updateStanding, initStandings } from "@/hooks/use-competitions";
import { useMatches } from "@/hooks/use-matches";
import { ArrowLeft, Trash2, Trophy, Swords, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";

const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600", finished: "bg-gray-500/15 text-gray-600" };

function CompetitionDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { competitions, updateCompetition, deleteCompetition } = useCompetitions();
  const { matches, updateMatch } = useMatches();

  const comp = competitions.find((c) => c.id === id);

  // 补录比分弹窗
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreMatchId, setScoreMatchId] = useState<string>("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  // 设置日期弹窗
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateMatchId, setDateMatchId] = useState<string>("");
  const [matchDate, setMatchDate] = useState("");
  const [matchVenue, setMatchVenue] = useState("");

  // 批量设置日期
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchRound, setBatchRound] = useState(0);
  const [batchDate, setBatchDate] = useState("");
  const [batchVenue, setBatchVenue] = useState("");

  const compMatches = useMemo(() => matches.filter((m) => comp?.matchIds.includes(m.id)), [matches, comp]);
  const finishedMatches = useMemo(() => compMatches.filter((m) => m.status === "finished"), [compMatches]);

  // 自动重算积分榜
  const standings = useMemo(() => {
    if (!comp || comp.type !== "league") return [];
    // 从零开始重算，避免累积错误
    const fresh = initStandings(comp.teams);
    for (const m of finishedMatches) {
      if (!m.score) continue;
      const updated = updateStanding(fresh, m.homeTeam, m.awayTeam, m.score.home, m.score.away);
      for (let i = 0; i < fresh.length; i++) Object.assign(fresh[i], updated[i]);
    }
    return fresh.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  }, [comp, finishedMatches]);

  // 按轮次分组
  const rounds = useMemo(() => {
    const map = new Map<number, typeof compMatches>();
    for (const m of compMatches) {
      const r = m.round ?? 0;
      if (!map.has(r)) map.set(r, []);
      map.get(r)!.push(m);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [compMatches]);

  // 打开补录比分弹窗
  const openScoreDialog = (matchId: string) => {
    const m = compMatches.find((m) => m.id === matchId);
    setScoreMatchId(matchId);
    setHomeScore(m?.score?.home?.toString() ?? "");
    setAwayScore(m?.score?.away?.toString() ?? "");
    setScoreDialogOpen(true);
  };

  // 提交补录比分
  const handleSubmitScore = async () => {
    const h = parseInt(homeScore);
    const a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a)) { toast.error("请输入有效比分"); return; }
    await updateMatch(scoreMatchId, {
      score: { home: h, away: a },
      status: "finished",
    });
    setScoreDialogOpen(false);
    toast.success("比分已更新");
  };

  // 打开设置日期弹窗
  const openDateDialog = (matchId: string) => {
    const m = compMatches.find((m) => m.id === matchId);
    setDateMatchId(matchId);
    setMatchDate(m?.date?.slice(0, 10) ?? "");
    setMatchVenue(m?.venue ?? "");
    setDateDialogOpen(true);
  };

  const handleSubmitDate = async () => {
    await updateMatch(dateMatchId, { date: matchDate, venue: matchVenue });
    setDateDialogOpen(false);
    toast.success("日期已更新");
  };

  // 批量设置日期
  const openBatchDialog = (round: number) => {
    setBatchRound(round);
    setBatchDate("");
    setBatchVenue("");
    setBatchDialogOpen(true);
  };

  const handleSubmitBatch = async () => {
    const roundMatches = compMatches.filter((m) => (m.round ?? 0) === batchRound && m.status === "upcoming");
    for (const m of roundMatches) {
      await updateMatch(m.id, { date: batchDate, venue: batchVenue });
    }
    setBatchDialogOpen(false);
    toast.success(`已更新 ${roundMatches.length} 场比赛`);
  };

  // 杯赛晋级：生成下一轮
  const handleGenerateNextRound = async () => {
    if (!comp) return;
    const currentRoundMatches = compMatches.filter((m) => m.round === comp.currentRound);
    const allFinished = currentRoundMatches.every((m) => m.status === "finished");
    if (!allFinished) { toast.error("当前轮次尚未全部结束"); return; }

    const winners = currentRoundMatches.map((m) => {
      if (!m.score) return m.homeTeam;
      return m.score.home > m.score.away ? m.homeTeam : m.awayTeam;
    });

    const nextRound: [string, string][] = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (i + 1 < winners.length) nextRound.push([winners[i], winners[i + 1]]);
    }

    if (nextRound.length === 0) {
      toast.success("赛事已结束！");
      return;
    }

    // 创建下一轮比赛
    const newMatchIds = [...comp.matchIds];
    for (const [home, away] of nextRound) {
      const { db } = await import("@/lib/db");
      const matchId = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.matches.add({
        id: matchId,
        date: "",
        venue: "",
        type: comp.type,
        scope: "internal",
        homeTeam: home,
        awayTeam: away,
        opponent: away,
        homeLineup: [],
        awayLineup: [],
        lineup: [],
        status: "upcoming",
        events: [],
        ratings: [],
        competitionId: comp.id,
        round: comp.currentRound + 1,
        createdAt: now,
        updatedAt: now,
      });
      newMatchIds.push(matchId);
    }

    await updateCompetition(comp.id, {
      matchIds: newMatchIds,
      currentRound: comp.currentRound + 1,
    });
    toast.success(`已生成第 ${comp.currentRound + 1} 轮，${nextRound.length} 场比赛`);
  };

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
        description={`${comp.type === "league" ? "联赛" : "杯赛"} · ${comp.format === "round_robin" ? "单循环" : "淘汰制"} · ${comp.teams.length} 支队伍`}
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
        {comp.type === "league" && standings.length > 0 && (
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
                      {standings.map((s, idx) => (
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

        {/* 赛程按轮次分组 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Swords className="h-4 w-4" />赛程
                <span className="text-muted-foreground font-normal">({finishedMatches.length}/{compMatches.length} 已完成)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rounds.map(([round, roundMatches]) => {
                const roundFinished = roundMatches.filter((m) => m.status === "finished").length;
                const roundLabel = comp.type === "cup"
                  ? (roundMatches.length === 1 ? "决赛" : roundMatches.length === 2 ? "半决赛" : `第${round}轮`)
                  : `第${round}轮`;

                return (
                  <div key={round}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {roundLabel} ({roundFinished}/{roundMatches.length})
                      </h4>
                      {roundMatches.some((m) => m.status === "upcoming") && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => openBatchDialog(round)}>
                          批量设置日期
                        </Button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      {roundMatches.map((m) => {
                        const isFinished = m.status === "finished";
                        return (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-sm font-medium truncate">{m.homeTeam || "我方"}</span>
                              <span className="text-xs text-muted-foreground shrink-0">vs</span>
                              <span className="text-sm font-medium truncate">{m.awayTeam || m.opponent}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isFinished && m.score ? (
                                <span className="text-sm font-bold tabular-nums">{m.score.home} - {m.score.away}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">{m.date ? new Date(m.date).toLocaleDateString("zh-CN") : "待定"}</span>
                              )}
                              <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</Badge>
                              {!isFinished && (
                                <div className="flex gap-1 ml-1">
                                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openDateDialog(m.id)}>
                                    设置日期
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openScoreDialog(m.id)}>
                                    补录比分
                                  </Button>
                                </div>
                              )}
                              <Link href={`/matches/detail/?id=${m.id}`}>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* 杯赛晋级按钮 */}
              {comp.type === "cup" && (() => {
                const currentRoundMatches = compMatches.filter((m) => m.round === comp.currentRound);
                const allFinished = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.status === "finished");
                if (!allFinished) return null;
                return (
                  <div className="pt-3 border-t">
                    <Button onClick={handleGenerateNextRound} className="w-full">
                      生成下一轮（胜者晋级）
                    </Button>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* 补录比分弹窗 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>补录比分</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <Label className="text-xs">主队</Label>
                <Input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} />
              </div>
              <span className="text-2xl font-bold">-</span>
              <div className="text-center">
                <Label className="text-xs">客队</Label>
                <Input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitScore}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置日期弹窗 */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>设置日期</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>场地</Label>
              <Input value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} placeholder="输入场地" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDateDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitDate}>确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 批量设置日期弹窗 */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>批量设置第 {batchRound} 轮日期</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>日期</Label>
              <Input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>场地</Label>
              <Input value={batchVenue} onChange={(e) => setBatchVenue(e.target.value)} placeholder="输入场地" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmitBatch}>应用到本轮所有比赛</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
