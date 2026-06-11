"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";
import { usePlayers } from "@/hooks/use-players";
import { useCompetitions } from "@/hooks/use-competitions";
import { ArrowLeft, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import type { MatchType, MatchScope, MatchLineupEntry } from "@/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TYPE_OPTIONS: { value: MatchType; key: string }[] = [
  { value: "league", key: "matches.league" },
  { value: "cup", key: "matches.cup" },
  { value: "friendly", key: "matches.friendly" },
  { value: "training", key: "matches.training" },
];

export default function NewMatchPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { addMatch } = useMatches();
  const { players } = usePlayers();
  const { competitions } = useCompetitions();

  const [scope, setScope] = useState<MatchScope>("external");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("14:00");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("friendly");
  const [competitionId, setCompetitionId] = useState<string>("");

  // 校外
  const [opponent, setOpponent] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // 校内
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeSelectedPlayers, setHomeSelectedPlayers] = useState<string[]>([]);
  const [awayLineupText, setAwayLineupText] = useState("");

  const togglePlayer = (id: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(id) ? list.filter((p) => p !== id) : [...list, id]);
  };

  // 从赛事获取队伍列表
  const comp = competitions.find((c) => c.id === competitionId);
  const compTeams = comp?.teams ?? [];

  const handleCompetitionChange = (id: string | null) => {
    if (!id) return;
    setCompetitionId(id);
    if (id === "") {
      setMatchType("friendly");
      return;
    }
    const c = competitions.find((comp) => comp.id === id);
    if (c) {
      setMatchType(c.type);
      setScope("internal");
    }
  };

  // 解析客队阵容文本（每行: 名字 位置）
  const parseAwayLineup = (): MatchLineupEntry[] => {
    return awayLineupText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(/[\s,，、]+/);
        return { playerName: parts[0], position: parts[1] ?? "" };
      });
  };

  const handleSubmit = async () => {
    if (scope === "external") {
      if (!opponent) { toast.error(t("matches.enterOpponentName")); return; }
      await addMatch({
        date: `${date}T${time}`,
        opponent,
        venue,
        type: matchType,
        scope: "external",
        homeTeam: "我方",
        awayTeam: opponent,
        homeLineup: selectedPlayers.map((id) => ({ playerId: id, position: "" })),
        awayLineup: [],
        status: "upcoming",
        lineup: selectedPlayers.map((id) => ({ playerId: id, position: "" })),
        competitionId: competitionId || undefined,
      });
    } else {
      if (!homeTeam) { toast.error(t("matches.selectHomeTeam")); return; }
      if (!awayTeam) { toast.error(t("matches.selectAwayTeam")); return; }
      if (homeTeam === awayTeam) { toast.error(t("matches.sameTeamError")); return; }
      await addMatch({
        date: `${date}T${time}`,
        opponent: awayTeam,
        venue,
        type: matchType,
        scope: "internal",
        homeTeam,
        awayTeam,
        homeLineup: homeSelectedPlayers.map((id) => ({ playerId: id, position: "" })),
        awayLineup: parseAwayLineup(),
        status: "upcoming",
        lineup: homeSelectedPlayers.map((id) => ({ playerId: id, position: "" })),
        competitionId: competitionId || undefined,
      });
    }
    router.push("/matches/");
  };

  return (
    <PageTransition>
      <Header
        title={t("matches.newMatch")}
        actions={
          <Link href="/matches/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl space-y-5">
        {/* 校内/校外切换 */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScope("external")}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
              scope === "external" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20"
            )}
          >
            <Globe className="h-5 w-5" />
            <div>
              <div className="font-medium text-sm">{t("matches.scopeExternal")}</div>
              <div className="text-xs text-muted-foreground">{t("matches.scopeExternalDesc")}</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setScope("internal")}
            className={cn(
              "flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all",
              scope === "internal" ? "border-primary bg-primary/5" : "border-muted hover:border-muted-foreground/20"
            )}
          >
            <Building2 className="h-5 w-5" />
            <div>
              <div className="font-medium text-sm">{t("matches.scopeInternal")}</div>
              <div className="text-xs text-muted-foreground">{t("matches.scopeInternalDesc")}</div>
            </div>
          </button>
        </div>

        {/* 基本信息 */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("matches.basicInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("matches.date")}</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>{t("matches.time")}</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("matches.venue")}</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder={t("matches.venue")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("matches.matchType")}</Label>
                <Select value={matchType} onValueChange={(v) => v && setMatchType(v as MatchType)}>
                  <SelectTrigger><SelectValue>{t(TYPE_OPTIONS.find(o => o.value === matchType)?.key ?? "matches.friendly")}</SelectValue></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("matches.competition")}</Label>
                <Select value={competitionId} onValueChange={handleCompetitionChange}>
                  <SelectTrigger><SelectValue>{competitionId ? competitions.find(c => c.id === competitionId)?.name ?? t("matches.none") : t("matches.none")}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("matches.none")}</SelectItem>
                    {competitions.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 校外比赛表单 */}
        {scope === "external" && (
          <>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">{t("matches.opponent")}</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>{t("matches.opponentName")}</Label>
                  <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder={t("matches.enterOpponent")} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("matches.ourLineup")} ({selectedPlayers.length}/{players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {players.map((player) => (
                    <label
                      key={player.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                        selectedPlayers.includes(player.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedPlayers.includes(player.id)}
                        onCheckedChange={() => togglePlayer(player.id, selectedPlayers, setSelectedPlayers)}
                      />
                      <span className="text-sm font-medium truncate">#{player.number} {player.name}</span>
                    </label>
                  ))}
                </div>
                {players.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("matches.addPlayerFirst")}</p>}
              </CardContent>
            </Card>
          </>
        )}

        {/* 校内比赛表单 */}
        {scope === "internal" && (
          <>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">{t("matches.versus")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("matches.homeTeam")}</Label>
                    {compTeams.length > 0 ? (
                      <Select value={homeTeam} onValueChange={(v) => v && setHomeTeam(v)}>
                        <SelectTrigger><SelectValue>{homeTeam || t("matches.selectHome")}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {compTeams.filter((t) => t !== awayTeam).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder={t("matches.inputHome")} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>{t("matches.awayTeam")}</Label>
                    {compTeams.length > 0 ? (
                      <Select value={awayTeam} onValueChange={(v) => v && setAwayTeam(v)}>
                        <SelectTrigger><SelectValue>{awayTeam || t("matches.selectAway")}</SelectValue></SelectTrigger>
                        <SelectContent>
                          {compTeams.filter((t) => t !== homeTeam).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder={t("matches.inputAway")} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{t("matches.homeLineup")} ({homeSelectedPlayers.length}/{players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {players.map((player) => (
                    <label
                      key={player.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                        homeSelectedPlayers.includes(player.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50"
                      )}
                    >
                      <Checkbox
                        checked={homeSelectedPlayers.includes(player.id)}
                        onCheckedChange={() => togglePlayer(player.id, homeSelectedPlayers, setHomeSelectedPlayers)}
                      />
                      <span className="text-sm font-medium truncate">#{player.number} {player.name}</span>
                    </label>
                  ))}
                </div>
                {players.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">{t("matches.addPlayerFirst")}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">{t("matches.awayLineup")}</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={awayLineupText}
                  onChange={(e) => setAwayLineupText(e.target.value)}
                  placeholder={"张三 前锋\n李四 中场\n王五 后卫"}
                  className="min-h-[100px] text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t("matches.awayLineupHint")} · {parseAwayLineup().length} {t("stats.team")}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Button onClick={handleSubmit} className="w-full" size="lg">
          {t("matches.createMatch")}
        </Button>
      </div>
    </PageTransition>
  );
}
