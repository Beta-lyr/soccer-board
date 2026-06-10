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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useCompetitions, updateStanding, initStandings } from "@/hooks/use-competitions";
import { useMatches } from "@/hooks/use-matches";
import { useTeams } from "@/hooks/use-teams";
import { ArrowLeft, Trash2, Trophy, Swords, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { db } from "@/lib/db";

const STATUS_LABELS: Record<string, string> = { upcoming: "未开始", live: "进行中", finished: "已结束" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600", finished: "bg-gray-500/15 text-gray-600" };

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

function CompetitionDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { competitions, updateCompetition, deleteCompetition } = useCompetitions();
  const { matches, updateMatch, deleteMatch } = useMatches();
  useTeams();

  const comp = competitions.find((c) => c.id === id);

  // 补录比分弹窗
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [scoreMatchId, setScoreMatchId] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");

  // 设置日期弹窗
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [dateMatchId, setDateMatchId] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [matchTime, setMatchTime] = useState("");
  const [matchVenue, setMatchVenue] = useState("");

  // 添加比赛弹窗
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addHome, setAddHome] = useState("");
  const [addAway, setAddAway] = useState("");
  const [addDate, setAddDate] = useState("");
  const [addTime, setAddTime] = useState("");
  const [addVenue, setAddVenue] = useState("");

  const compMatches = useMemo(() => matches.filter((m) => comp?.matchIds.includes(m.id)), [matches, comp]);
  const finishedMatches = useMemo(() => compMatches.filter((m) => m.status === "finished"), [compMatches]);

  // 按时间排序（有日期的在前，按日期正序；无日期的在后）
  const sortedMatches = useMemo(() => {
    return [...compMatches].sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      if (da === 0 && db === 0) return 0;
      if (da === 0) return 1;
      if (db === 0) return -1;
      return da - db;
    });
  }, [compMatches]);

  // 自动重算积分榜
  const standings = useMemo(() => {
    if (!comp || comp.type !== "league") return [];
    const fresh = initStandings(comp.teams);
    for (const m of finishedMatches) {
      if (!m.score) continue;
      const updated = updateStanding(fresh, m.homeTeam, m.awayTeam, m.score.home, m.score.away);
      for (let i = 0; i < fresh.length; i++) Object.assign(fresh[i], updated[i]);
    }
    return fresh.sort((a, b) => b.points - a.points || (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst));
  }, [comp, finishedMatches]);

  // 补录比分
  const openScoreDialog = (matchId: string) => {
    const m = compMatches.find((m) => m.id === matchId);
    setScoreMatchId(matchId);
    setHomeScore(m?.score?.home?.toString() ?? "");
    setAwayScore(m?.score?.away?.toString() ?? "");
    setScoreDialogOpen(true);
  };
  const handleSubmitScore = async () => {
    const h = parseInt(homeScore), a = parseInt(awayScore);
    if (isNaN(h) || isNaN(a)) { toast.error("请输入有效比分"); return; }
    await updateMatch(scoreMatchId, { score: { home: h, away: a }, status: "finished" });
    setScoreDialogOpen(false);
    toast.success("比分已更新");
  };

  // 设置日期
  const openDateDialog = (matchId: string) => {
    const m = compMatches.find((m) => m.id === matchId);
    setDateMatchId(matchId);
    if (m?.date) {
      const d = new Date(m.date);
      setMatchDate(d.toISOString().slice(0, 10));
      setMatchTime(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
    } else {
      setMatchDate("");
      setMatchTime("14:00");
    }
    setMatchVenue(m?.venue ?? "");
    setDateDialogOpen(true);
  };
  const handleSubmitDate = async () => {
    const dateTime = matchDate ? `${matchDate}T${matchTime || "14:00"}` : "";
    await updateMatch(dateMatchId, { date: dateTime, venue: matchVenue });
    setDateDialogOpen(false);
    toast.success("已更新");
  };

  // 删除比赛
  const handleDeleteMatch = async (matchId: string) => {
    if (!comp || !confirm("确认删除此比赛？")) return;
    await deleteMatch(matchId);
    await updateCompetition(comp.id, { matchIds: comp.matchIds.filter((id) => id !== matchId) });
    toast.success("比赛已删除");
  };

  // 添加比赛
  const handleAddMatch = async () => {
    if (!comp) return;
    if (!addHome || !addAway) { toast.error("请选择主客队"); return; }
    if (addHome === addAway) { toast.error("主客队不能相同"); return; }
    const dateTime = addDate ? `${addDate}T${addTime || "14:00"}` : "";
    const matchId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.matches.add({
      id: matchId, date: dateTime, venue: addVenue, type: comp.type, scope: "internal",
      homeTeam: addHome, awayTeam: addAway, opponent: addAway,
      homeLineup: [], awayLineup: [], lineup: [], status: "upcoming",
      events: [], ratings: [], competitionId: comp.id, createdAt: now, updatedAt: now,
    });
    await updateCompetition(comp.id, { matchIds: [...comp.matchIds, matchId] });
    setAddDialogOpen(false);
    setAddHome(""); setAddAway(""); setAddDate(""); setAddTime(""); setAddVenue("");
    toast.success("比赛已添加");
  };

  // 杯赛晋级
  const handleGenerateNextRound = async () => {
    if (!comp) return;
    const currentRoundMatches = compMatches.filter((m) => m.round === comp.currentRound);
    if (!currentRoundMatches.every((m) => m.status === "finished")) { toast.error("当前轮次尚未全部结束"); return; }
    const winners = currentRoundMatches.map((m) => !m.score ? m.homeTeam : (m.score.home > m.score.away ? m.homeTeam : m.awayTeam));
    const nextRound: [string, string][] = [];
    for (let i = 0; i < winners.length; i += 2) { if (i + 1 < winners.length) nextRound.push([winners[i], winners[i + 1]]); }
    if (nextRound.length === 0) { toast.success("赛事已结束！"); return; }
    const newMatchIds = [...comp.matchIds];
    for (const [home, away] of nextRound) {
      const matchId = crypto.randomUUID();
      const now = new Date().toISOString();
      await db.matches.add({
        id: matchId, date: "", venue: "", type: comp.type, scope: "internal",
        homeTeam: home, awayTeam: away, opponent: away,
        homeLineup: [], awayLineup: [], lineup: [], status: "upcoming",
        events: [], ratings: [], competitionId: comp.id, round: comp.currentRound + 1,
        createdAt: now, updatedAt: now,
      });
      newMatchIds.push(matchId);
    }
    await updateCompetition(comp.id, { matchIds: newMatchIds, currentRound: comp.currentRound + 1 });
    toast.success(`已生成第 ${comp.currentRound + 1} 轮`);
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
        description={`${comp.type === "league" ? "联赛" : "杯赛"} · ${comp.teams.length} 支队伍 · ${compMatches.length} 场比赛`}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" />删除</Button>
            <Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button></Link>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 积分榜（联赛） */}
        {comp.type === "league" && standings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />积分榜</CardTitle></CardHeader>
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

        {/* 赛程 */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Swords className="h-4 w-4" />赛程
                  <span className="text-muted-foreground font-normal">({finishedMatches.length}/{compMatches.length})</span>
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />添加比赛
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {sortedMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">暂无比赛，点击「添加比赛」开始</p>
              ) : (
                sortedMatches.map((m) => {
                  const isFinished = m.status === "finished";
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{m.homeTeam || "我方"}</span>
                        <span className="text-xs text-muted-foreground shrink-0">vs</span>
                        <span className="text-sm font-medium truncate">{m.awayTeam || m.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDateTime(m.date)}</span>
                        {m.venue && <span className="text-xs text-muted-foreground">@{m.venue}</span>}
                        {isFinished && m.score ? (
                          <span className="text-sm font-bold tabular-nums">{m.score.home} - {m.score.away}</span>
                        ) : null}
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[m.status]}`}>{STATUS_LABELS[m.status]}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isFinished && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openScoreDialog(m.id)}>比分</Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openDateDialog(m.id)}>编辑</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive" onClick={() => handleDeleteMatch(m.id)}>删除</Button>
                        </div>
                        <Link href={`/matches/detail/?id=${m.id}`}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>
                      </div>
                    </div>
                  );
                })
              )}

              {/* 杯赛晋级 */}
              {comp.type === "cup" && (() => {
                const currentRoundMatches = compMatches.filter((m) => m.round === comp.currentRound);
                const allFinished = currentRoundMatches.length > 0 && currentRoundMatches.every((m) => m.status === "finished");
                if (!allFinished) return null;
                return (
                  <div className="pt-3 border-t">
                    <Button onClick={handleGenerateNextRound} className="w-full">生成下一轮（胜者晋级）</Button>
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
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center"><Label className="text-xs">主队</Label><Input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} /></div>
            <span className="text-2xl font-bold">-</span>
            <div className="text-center"><Label className="text-xs">客队</Label><Input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScoreDialogOpen(false)}>取消</Button><Button onClick={handleSubmitScore}>确认</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置日期弹窗 */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>编辑比赛</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>日期</Label><Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>时间</Label><Input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>场地</Label><Input value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} placeholder="输入场地" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDateDialogOpen(false)}>取消</Button><Button onClick={handleSubmitDate}>确认</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 添加比赛弹窗 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>添加比赛</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>主队</Label>
                <Select value={addHome} onValueChange={(v) => v && setAddHome(v)}>
                  <SelectTrigger><SelectValue placeholder="选择主队" /></SelectTrigger>
                  <SelectContent>
                    {comp.teams.filter((t) => t !== addAway).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>客队</Label>
                <Select value={addAway} onValueChange={(v) => v && setAddAway(v)}>
                  <SelectTrigger><SelectValue placeholder="选择客队" /></SelectTrigger>
                  <SelectContent>
                    {comp.teams.filter((t) => t !== addHome).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>日期</Label><Input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>时间</Label><Input type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>场地</Label><Input value={addVenue} onChange={(e) => setAddVenue(e.target.value)} placeholder="输入场地" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddDialogOpen(false)}>取消</Button><Button onClick={handleAddMatch}>添加</Button></DialogFooter>
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
