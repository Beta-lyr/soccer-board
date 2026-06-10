"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { db } from "@/lib/db";
import { useMatchTimer } from "@/hooks/use-match-timer";
import type { Match, MatchEventType, Player } from "@/types";
import { ArrowLeft, Play, Pause, RotateCcw, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const EVENT_TYPES: { type: MatchEventType; icon: string; label: string; color: string }[] = [
  { type: "goal", icon: "⚽", label: "进球", color: "bg-green-500/15 text-green-600" },
  { type: "yellow_card", icon: "🟨", label: "黄牌", color: "bg-yellow-500/15 text-yellow-600" },
  { type: "red_card", icon: "🟥", label: "红牌", color: "bg-red-500/15 text-red-600" },
  { type: "substitution", icon: "🔄", label: "换人", color: "bg-blue-500/15 text-blue-600" },
];

function MatchDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { t } = useI18n();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedType, setSelectedType] = useState<MatchEventType | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [relatedPlayer, setRelatedPlayer] = useState<string>("");
  const [note, setNote] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  const timer = useMatchTimer(id || "");

  useEffect(() => {
    if (id) {
      db.matches.get(id).then((m) => m && setMatch(m));
      db.players.toArray().then(setPlayers);
    }
  }, [id]);

  if (!id || !match) {
    return (
      <PageTransition>
        <Header title="比赛详情" />
        <div className="flex-1 p-6 text-center text-muted-foreground"><p>{t("common.loading")}</p></div>
      </PageTransition>
    );
  }

  const matchPlayers = players.filter((p) => match.lineup.some((l) => l.playerId === p.id));

  const handleAddEvent = async () => {
    if (!selectedType || !selectedPlayer) return;
    const newEvent = {
      id: crypto.randomUUID(),
      matchId: id,
      type: selectedType,
      minute: timer.minute,
      playerId: selectedPlayer,
      relatedPlayerId: relatedPlayer || undefined,
      note: note || undefined,
      timestamp: new Date().toISOString(),
    };
    await db.matches.update(id, {
      events: [...match.events, newEvent],
      updatedAt: new Date().toISOString(),
    });
    const updated = await db.matches.get(id);
    if (updated) setMatch(updated);
    setSelectedType(null);
    setSelectedPlayer("");
    setRelatedPlayer("");
    setNote("");
  };

  const handleFinish = async () => {
    await db.matches.update(id, {
      status: "finished",
      score: { home: homeScore, away: awayScore },
      updatedAt: new Date().toISOString(),
    });
    const updated = await db.matches.get(id);
    if (updated) setMatch(updated);
    timer.reset();
  };

  const getPlayerName = (pid: string) => players.find((p) => p.id === pid)?.name ?? "未知";

  const TYPE_LABELS: Record<string, string> = { league: t("matches.league"), friendly: t("matches.friendly"), training: t("matches.training"), cup: "杯赛" };
  const SCOPE_LABELS: Record<string, string> = { internal: "校内", external: "校外" };
  const STATUS_LABELS: Record<string, string> = { upcoming: t("matches.upcoming"), live: t("matches.live"), finished: t("matches.finished") };
  const STATUS_COLORS: Record<string, string> = { upcoming: "bg-blue-500/15 text-blue-600", live: "bg-red-500/15 text-red-600 animate-pulse", finished: "bg-gray-500/15 text-gray-600" };

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const homeTeamName = match.homeTeam || "我方";
  const awayTeamName = match.awayTeam || match.opponent;

  return (
    <PageTransition>
      <Header
        title={`${homeTeamName} vs ${awayTeamName}`}
        actions={
          <div className="flex gap-2">
            <Link href="/matches/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
            </Link>
            {!isFinished && (
              <Button
                size="sm"
                onClick={async () => {
                  if (match.status === "upcoming") {
                    await db.matches.update(id, { status: "live" });
                    const updated = await db.matches.get(id);
                    if (updated) setMatch(updated);
                  }
                }}
              >
                {isLive ? "比赛中" : "开始比赛"}
              </Button>
            )}
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        {/* 比赛信息 */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-bold">{homeTeamName} vs {awayTeamName}</h2>
                  <Badge variant="outline" className={STATUS_COLORS[match.status]}>
                    {match.status === "live" && "● "}{STATUS_LABELS[match.status]}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-x-3">
                  <span>{new Date(match.date).toLocaleDateString("zh-CN")}</span>
                  {match.venue && <span>@ {match.venue}</span>}
                  <span>{TYPE_LABELS[match.type]}</span>
                  <span>{SCOPE_LABELS[match.scope] ?? ""}</span>
                </div>
              </div>
              {match.score && (
                <div className="text-4xl font-black tabular-nums">
                  {match.score.home} - {match.score.away}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 双方阵容 */}
        {((match.homeLineup && match.homeLineup.length > 0) || (match.awayLineup && match.awayLineup.length > 0)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 主队阵容 */}
            {match.homeLineup && match.homeLineup.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{homeTeamName} 阵容 ({match.homeLineup.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {match.homeLineup.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded text-sm">
                        <span className="w-8 text-xs font-mono text-muted-foreground">{entry.position || "-"}</span>
                        <span className="flex-1 truncate">{entry.playerName ?? players.find((p) => p.id === entry.playerId)?.name ?? "?"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* 客队阵容 */}
            {match.awayLineup && match.awayLineup.length > 0 && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{awayTeamName} 阵容 ({match.awayLineup.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {match.awayLineup.map((entry, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-1.5 rounded text-sm">
                        <span className="w-8 text-xs font-mono text-muted-foreground">{entry.position || "-"}</span>
                        <span className="flex-1 truncate">{entry.playerName ?? players.find((p) => p.id === entry.playerId)?.name ?? "?"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* 实时记录区 */}
        {isLive && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader><CardTitle className="text-sm">实时记录</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* 计时器 */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-5xl font-black tabular-nums w-40 text-center">
                    {timer.displayTime}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant={timer.isRunning ? "destructive" : "default"} onClick={() => timer.isRunning ? timer.pause() : timer.start()}>
                      {timer.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={timer.reset}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 比分输入 */}
                <div className="flex items-center justify-center gap-4">
                  <Label className="text-xs">主</Label>
                  <Input type="number" value={homeScore} onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)} className="w-16 text-center" min={0} />
                  <span className="text-lg font-bold">-</span>
                  <Input type="number" value={awayScore} onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)} className="w-16 text-center" min={0} />
                  <Label className="text-xs">客</Label>
                </div>

                {/* 事件按钮 */}
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((et) => (
                    <Button
                      key={et.type}
                      size="sm"
                      variant={selectedType === et.type ? "default" : "outline"}
                      onClick={() => setSelectedType(selectedType === et.type ? null : et.type)}
                    >
                      {et.icon} {et.label}
                    </Button>
                  ))}
                </div>

                {/* 球员选择 */}
                {selectedType && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs">
                        {selectedType === "substitution" ? "被换下球员" : "相关球员"}
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {matchPlayers.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPlayer(p.id)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                              selectedPlayer === p.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                            }`}
                          >
                            #{p.number} {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedType === "goal" && (
                      <div className="space-y-2">
                        <Label className="text-xs">助攻球员（可选）</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {matchPlayers.filter((p) => p.id !== selectedPlayer).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setRelatedPlayer(relatedPlayer === p.id ? "" : p.id)}
                              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                relatedPlayer === p.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                              }`}
                            >
                              #{p.number} {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedType === "substitution" && (
                      <div className="space-y-2">
                        <Label className="text-xs">换上球员</Label>
                        <div className="flex flex-wrap gap-1.5">
                          {matchPlayers.filter((p) => p.id !== selectedPlayer).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setRelatedPlayer(relatedPlayer === p.id ? "" : p.id)}
                              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                                relatedPlayer === p.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                              }`}
                            >
                              #{p.number} {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-xs">备注（可选）</Label>
                      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="添加备注" className="text-sm" />
                    </div>

                    <Button size="sm" onClick={handleAddEvent} disabled={!selectedPlayer}>
                      记录事件
                    </Button>
                  </motion.div>
                )}

                {/* 结束比赛 */}
                <div className="pt-2 border-t">
                  <Button variant="destructive" size="sm" onClick={handleFinish}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    结束比赛
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 事件时间线 */}
        <Card>
          <CardHeader><CardTitle className="text-sm">比赛事件 ({match.events.length})</CardTitle></CardHeader>
          <CardContent>
            {match.events.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无事件</p>
            ) : (
              <div className="space-y-2">
                {[...match.events].reverse().map((event) => {
                  const et = EVENT_TYPES.find((e) => e.type === event.type);
                  return (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <span className="text-lg">{et?.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{getPlayerName(event.playerId)}</span>
                          {event.relatedPlayerId && (
                            <span className="text-xs text-muted-foreground">
                              {event.type === "goal" ? `助攻: ${getPlayerName(event.relatedPlayerId)}` : `← ${getPlayerName(event.relatedPlayerId)}`}
                            </span>
                          )}
                        </div>
                        {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{event.minute}&apos;</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 赛后评分 */}
        {isFinished && (
          <Card>
            <CardHeader><CardTitle className="text-sm">赛后评分</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {matchPlayers.map((p) => {
                  const rating = match.ratings.find((r) => r.playerId === p.id);
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="w-8 text-xs font-mono">#{p.number}</span>
                      <span className="flex-1 text-sm truncate">{p.name}</span>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={rating?.score ?? ""}
                        onChange={async (e) => {
                          const score = parseInt(e.target.value);
                          if (isNaN(score) || score < 1 || score > 10) return;
                          const newRatings = match.ratings.filter((r) => r.playerId !== p.id);
                          newRatings.push({ playerId: p.id, score });
                          await db.matches.update(id, { ratings: newRatings });
                          const updated = await db.matches.get(id);
                          if (updated) setMatch(updated);
                        }}
                        placeholder="-"
                        className="w-16 text-center text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}

export default function MatchDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-6 text-center text-muted-foreground">Loading...</div>}>
      <MatchDetailContent />
    </Suspense>
  );
}
