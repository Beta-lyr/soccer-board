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
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/lib/i18n";
import { Bracket } from "@/components/competitions/bracket";
import { ArrowLeft, Trash2, Trophy, Swords, ChevronRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { createApiClient } from "@/lib/api";
import type { Match } from "@/types";

const matchesApi = createApiClient<Match>("matches");

const STATUS_KEYS: Record<string, string> = { upcoming: "comp.notStarted", live: "comp.inProgress", finished: "comp.finished" };
const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600", finished: "bg-gray-500/15 text-gray-600" };

/** 格式化日期时间 */
function formatDateTime(dateStr: string, tbd: string): string {
  if (!dateStr) return tbd;
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
  const { t } = useI18n();
  const id = searchParams.get("id");
  const { competitions, updateCompetition, deleteCompetition } = useCompetitions();
  const { confirm, ConfirmDialog } = useConfirm();
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
    if (isNaN(h) || isNaN(a)) { toast.error(t("comp.invalidScore")); return; }
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
    toast.success(t("common.save"));
  };

  // 删除比赛
  const handleDeleteMatch = async (matchId: string) => {
    if (!comp || !(await confirm({ description: t("comp.confirmDelete"), variant: "destructive" }))) return;
    await deleteMatch(matchId);
    await updateCompetition(comp.id, { matchIds: comp.matchIds.filter((id) => id !== matchId) });
    toast.success(t("comp.deleted"));
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
      const matchId = await matchesApi.add({
        date: "", venue: "", type: comp.type, scope: "internal",
        homeTeam: home, awayTeam: away, opponent: away,
        homeLineup: [], awayLineup: [], lineup: [], status: "upcoming",
        events: [], ratings: [], competitionId: comp.id, round: comp.currentRound + 1,
      });
      newMatchIds.push(matchId);
    }
    await updateCompetition(comp.id, { matchIds: newMatchIds, currentRound: comp.currentRound + 1 });
    toast.success(`已生成第 ${comp.currentRound + 1} 轮`);
  };

  if (!comp) {
    return (
      <PageTransition>
        <Header title={t("comp.info")} />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-3">{t("common.noData")}</p>
            <Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const handleDelete = async () => {
    if (await confirm({ description: t("comp.confirmDelete"), variant: "destructive" })) {
      // 级联删除关联比赛
      for (const m of compMatches) {
        await deleteMatch(m.id);
      }
      await deleteCompetition(comp.id);
      toast.success(t("comp.deleted"));
      router.push("/competitions/");
    }
  };

  return (
    <PageTransition>
      <Header
        title={comp.name}
        description={`${comp.type === "league" ? t("comp.league") : t("comp.cup")} · ${comp.teams.length} ${t("comp.team")} · ${compMatches.length} ${t("comp.matchesCount")}`}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" />{t("common.delete")}</Button>
            <Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button></Link>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 积分榜（联赛） */}
        {comp.type === "league" && standings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />{t("comp.standings")}</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground border-b">
                        <th className="text-left py-2 pr-3">#</th>
                        <th className="text-left py-2 pr-3">{t("comp.team")}</th>
                        <th className="text-center py-2 px-2">{t("stats.played")}</th>
                        <th className="text-center py-2 px-2">{t("comp.w")}</th>
                        <th className="text-center py-2 px-2">{t("comp.d")}</th>
                        <th className="text-center py-2 px-2">{t("comp.l")}</th>
                        <th className="text-center py-2 px-2">{t("comp.gf")}</th>
                        <th className="text-center py-2 px-2">{t("comp.ga")}</th>
                        <th className="text-center py-2 px-2">{t("comp.gd")}</th>
                        <th className="text-center py-2 pl-2 font-bold">{t("comp.pts")}</th>
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

        {/* 杯赛对阵图 */}
        {comp.type === "cup" && compMatches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Swords className="h-4 w-4" />{t("comp.bracket")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Bracket matches={compMatches} />
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
                  <Swords className="h-4 w-4" />{t("comp.schedule")}
                  <span className="text-muted-foreground font-normal">({finishedMatches.length}/{compMatches.length})</span>
                </CardTitle>
                <div className="flex gap-2">
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {sortedMatches.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t("common.noData")}</p>
              ) : (
                sortedMatches.map((m) => {
                  const isFinished = m.status === "finished";
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors group">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-medium truncate">{m.homeTeam || t("matches.scopeExternal")}</span>
                        <span className="text-xs text-muted-foreground shrink-0">vs</span>
                        <span className="text-sm font-medium truncate">{m.awayTeam || m.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{formatDateTime(m.date, t("comp.tbd"))}</span>
                        {m.venue && <span className="text-xs text-muted-foreground">@{m.venue}</span>}
                        {isFinished && m.score ? (
                          <span className="text-sm font-bold tabular-nums">{m.score.home} - {m.score.away}</span>
                        ) : null}
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[m.status]}`}>{t(STATUS_KEYS[m.status])}</Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!isFinished && (
                            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openScoreDialog(m.id)}>{t("matches.matchInfo")}</Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => openDateDialog(m.id)}>{t("common.edit")}</Button>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-destructive" onClick={() => handleDeleteMatch(m.id)}>{t("common.delete")}</Button>
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

      {ConfirmDialog}
      {/* 补录比分弹窗 */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("matches.matchInfo")}</DialogTitle></DialogHeader>
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="text-center"><Label className="text-xs">{t("matches.homeTeam")}</Label><Input type="number" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} /></div>
            <span className="text-2xl font-bold">-</span>
            <div className="text-center"><Label className="text-xs">{t("matches.awayTeam")}</Label><Input type="number" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="w-20 text-center text-lg font-bold" min={0} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScoreDialogOpen(false)}>{t("common.cancel")}</Button><Button onClick={handleSubmitScore}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 设置日期弹窗 */}
      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.edit")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>{t("matches.date")}</Label><Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("matches.time")}</Label><Input type="time" value={matchTime} onChange={(e) => setMatchTime(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>{t("matches.venue")}</Label><Input value={matchVenue} onChange={(e) => setMatchVenue(e.target.value)} placeholder={t("matches.venue")} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDateDialogOpen(false)}>{t("common.cancel")}</Button><Button onClick={handleSubmitDate}>{t("common.save")}</Button></DialogFooter>
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
