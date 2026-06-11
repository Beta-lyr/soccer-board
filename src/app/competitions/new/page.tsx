"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompetitions, generateMultiRoundRobinSchedule, initStandings } from "@/hooks/use-competitions";
import { useTeams } from "@/hooks/use-teams";
import { useI18n } from "@/lib/i18n";
import { ArrowLeft, Trophy, Swords, Users, Handshake, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createApiClient } from "@/lib/api";
import type { Match, CompetitionGroup } from "@/types";

const matchesApi = createApiClient<Match>("matches");
const playersApi = createApiClient<import("@/types").Player>("players");

const COMP_TYPE_KEYS = [
  { value: "league" as const, labelKey: "comp.league", descKey: "comp.leagueDesc", icon: Trophy, color: "border-amber-500/50 bg-amber-500/5" },
  { value: "cup" as const, labelKey: "comp.cup", descKey: "comp.cupDesc", icon: Swords, color: "border-violet-500/50 bg-violet-500/5" },
  { value: "friendly" as const, labelKey: "comp.friendly", descKey: "comp.friendlyDesc", icon: Handshake, color: "border-emerald-500/50 bg-emerald-500/5" },
];

/** 创建比赛的通用函数 */
async function createMatch(opts: {
  home: string; away: string; type: string; round?: number;
  competitionId?: string; date?: string; venue?: string;
  selectedTeams?: { name: string; playerIds: string[] }[];
}) {
  const { home, away, type, round, competitionId, date, venue, selectedTeams } = opts;
  const dateTime = date || "";
  const homeTeam = selectedTeams?.find((t) => t.name === home);
  const awayTeam = selectedTeams?.find((t) => t.name === away);
  const hLineup = homeTeam ? (await Promise.all(homeTeam.playerIds.map(async (pid) => {
    const p = await playersApi.get(pid);
    return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
  }))).filter(Boolean) : [];
  const aLineup = awayTeam ? (await Promise.all(awayTeam.playerIds.map(async (pid) => {
    const p = await playersApi.get(pid);
    return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
  }))).filter(Boolean) : [];

  return matchesApi.add({
    date: dateTime, venue: venue || "", type: type as Match["type"], scope: "internal",
    homeTeam: home, awayTeam: away, opponent: away,
    homeLineup: hLineup as NonNullable<typeof hLineup[number]>[],
    awayLineup: aLineup as NonNullable<typeof aLineup[number]>[],
    lineup: hLineup.filter((p) => p?.playerId).map((p) => ({ playerId: p!.playerId!, position: p!.position })),
    status: "upcoming", events: [], ratings: [], competitionId, round,
  });
}

export default function NewCompetitionPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { addCompetition } = useCompetitions();
  const { teams: allTeams } = useTeams();

  const [name, setName] = useState("");
  const [type, setType] = useState<"league" | "cup" | "friendly">("league");
  const [format, setFormat] = useState<"knockout" | "group_knockout">("knockout");
  const [rounds, setRounds] = useState(1);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultTime, setDefaultTime] = useState("14:00");
  const [defaultVenue, setDefaultVenue] = useState("");
  const [loading, setLoading] = useState(false);

  // 杯赛淘汰赛对阵配置：[homeIdx, awayIdx][]
  const [bracket, setBracket] = useState<[number, number][]>([]);
  // 杯赛小组赛分组：groupIdx[]
  const [groupAssignments, setGroupAssignments] = useState<number[]>([]);
  const [groupCount, setGroupCount] = useState(2);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const selectedTeams = useMemo(() => allTeams.filter((t) => selectedTeamIds.includes(t.id)), [allTeams, selectedTeamIds]);
  const teamNames = selectedTeams.map((t) => t.shortName ?? t.name);

  const canSubmit = type === "friendly"
    ? name.trim() && selectedTeams.length === 2
    : name.trim() && selectedTeams.length >= 2;

  // 初始化对阵配置
  const initBracket = () => {
    const n = selectedTeams.length;
    const pairs: [number, number][] = [];
    for (let i = 0; i < n; i += 2) {
      if (i + 1 < n) pairs.push([i, i + 1]);
    }
    setBracket(pairs);
  };

  const initGroupAssignments = () => {
    setGroupAssignments(selectedTeams.map((_, i) => i % groupCount));
  };

  // 赛程预览
  const schedulePreview = useMemo(() => {
    if (type === "friendly") return { total: 1, desc: `${teamNames[0] ?? "A"} vs ${teamNames[1] ?? "B"}` };
    if (type === "league") {
      const single = selectedTeams.length * (selectedTeams.length - 1) / 2;
      return { total: single * rounds, desc: `${rounds === 1 ? t("comp.singleRound") : `${rounds}${t("comp.round")}`}，${single * rounds} ${t("comp.matchesCount")}` };
    }
    if (format === "knockout") {
      return { total: selectedTeams.length - 1, desc: `${t("comp.knockout")}，${selectedTeams.length - 1} ${t("comp.matchesCount")}` };
    }
    const perGroup = Math.ceil(selectedTeams.length / groupCount);
    const groupMatches = groupCount * perGroup * (perGroup - 1) / 2;
    return { total: groupMatches + groupCount - 1, desc: `${groupCount} ${t("comp.group")}${t("comp.groupStage")} + ${t("comp.knockout")}` };
  }, [type, format, rounds, groupCount, selectedTeams.length, teamNames, t]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const matchIds: string[] = [];
      let compStandings: ReturnType<typeof initStandings> | undefined;
      let compGroups: CompetitionGroup[] | undefined;
      const selTeamsData = selectedTeams.map((t) => ({ name: t.shortName ?? t.name, playerIds: t.playerIds }));
      const dateTime = defaultDate ? `${defaultDate}T${defaultTime || "14:00"}` : "";

      if (type === "friendly") {
        const mid = await createMatch({ home: teamNames[0], away: teamNames[1], type, date: dateTime, venue: defaultVenue, selectedTeams: selTeamsData });
        matchIds.push(mid);
        await addCompetition({ name: name.trim(), type, format: "round_robin", teams: teamNames, matchIds, currentRound: 1 });
      } else if (type === "league") {
        const schedule = generateMultiRoundRobinSchedule(teamNames, rounds);
        for (const m of schedule) {
          const mid = await createMatch({ home: m.home, away: m.away, type, round: m.round, date: dateTime, venue: defaultVenue, selectedTeams: selTeamsData });
          matchIds.push(mid);
        }
        compStandings = initStandings(teamNames);
        await addCompetition({ name: name.trim(), type, format: "round_robin", teams: teamNames, matchIds, standings: compStandings, currentRound: 1, rounds });
      } else {
        // 杯赛
        if (format === "group_knockout") {
          // 小组赛 + 淘汰赛
          const groups: CompetitionGroup[] = [];
          for (let g = 0; g < groupCount; g++) {
            const groupTeams = teamNames.filter((_, i) => (groupAssignments[i] ?? i % groupCount) === g);
            groups.push({ name: `${String.fromCharCode(65 + g)}组`, teams: groupTeams, standings: initStandings(groupTeams) });
          }
          compGroups = groups;

          // 小组内循环
          for (const group of groups) {
            const schedule = generateMultiRoundRobinSchedule(group.teams, 1);
            for (const m of schedule) {
              const mid = await createMatch({ home: m.home, away: m.away, type: "cup", date: dateTime, venue: defaultVenue, selectedTeams: selTeamsData });
              matchIds.push(mid);
            }
          }
          await addCompetition({ name: name.trim(), type, format, teams: teamNames, matchIds, groups: compGroups, currentRound: 1 });
        } else {
          // 淘汰赛：使用用户配置的对阵
          if (bracket.length > 0) {
            // 用户配置了对阵
            for (const [homeIdx, awayIdx] of bracket) {
              const mid = await createMatch({ home: teamNames[homeIdx], away: teamNames[awayIdx], type: "cup", round: 1, date: dateTime, venue: defaultVenue, selectedTeams: selTeamsData });
              matchIds.push(mid);
            }
          } else {
            // 自动生成：按顺序配对
            for (let i = 0; i < teamNames.length; i += 2) {
              if (i + 1 < teamNames.length) {
                const mid = await createMatch({ home: teamNames[i], away: teamNames[i + 1], type: "cup", round: 1, date: dateTime, venue: defaultVenue, selectedTeams: selTeamsData });
                matchIds.push(mid);
              }
            }
          }
          await addCompetition({ name: name.trim(), type, format: "knockout", teams: teamNames, matchIds, currentRound: 1 });
        }
      }

      // 回填 competitionId
      const compId = matchIds.length > 0 ? (await matchesApi.get(matchIds[0]))?.competitionId : undefined;
      toast.success(t("comp.compCreated", { count: matchIds.length }));
      router.push("/competitions/");
    } catch {
      toast.error(t("comp.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Header
        title={t("comp.newComp")}
        actions={<Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button></Link>}
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* 赛事名称 */}
        <div className="space-y-2">
          <Label>{t("comp.compName")}</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("comp.compNamePlaceholder")} />
        </div>

        {/* 赛事类型 */}
        <div className="space-y-2">
          <Label>{t("comp.compType")}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMP_TYPE_KEYS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setType(opt.value); if (opt.value === "friendly") setSelectedTeamIds((prev) => prev.slice(0, 2)); }}
                className={cn("p-4 rounded-lg border-2 text-left transition-all", type === opt.value ? opt.color : "border-muted hover:border-muted-foreground/20")}
              >
                <opt.icon className="h-5 w-5 mb-2" />
                <div className="font-medium text-sm">{t(opt.labelKey)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t(opt.descKey)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 赛制选项 */}
        {type === "league" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">{t("comp.format")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[1, 2].map((r) => (
                  <button key={r} type="button" onClick={() => setRounds(r)}
                    className={cn("px-4 py-2 rounded-md border text-sm transition-colors", rounds === r ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:bg-accent")}>
                    {r === 1 ? t("comp.singleRound") : t("comp.doubleRound")}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {type === "cup" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">{t("comp.format")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {[
                  { value: "knockout" as const, labelKey: "comp.knockout" },
                  { value: "group_knockout" as const, labelKey: "comp.groupKnockout" },
                ].map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setFormat(opt.value)}
                    className={cn("px-4 py-2 rounded-md border text-sm transition-colors", format === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:bg-accent")}>
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
              {format === "group_knockout" && (
                <div className="space-y-2">
                  <Label>{t("comp.groupCount")}</Label>
                  <Select value={String(groupCount)} onValueChange={(v) => v && setGroupCount(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue>{groupCount} {t("comp.groups")}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4].filter((n) => n <= selectedTeams.length).map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} {t("comp.groups")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 选择参赛队伍 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />{t("comp.teams")} ({selectedTeams.length})
              {type === "friendly" && <span className="text-muted-foreground font-normal">（{t("comp.select2")}）</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTeams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm mb-2">{t("comp.noTeams")}</p>
                <Link href="/teams/new/"><Button variant="outline" size="sm">{t("comp.createTeamFirst")}</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allTeams.map((team) => {
                  const isSelected = selectedTeamIds.includes(team.id);
                  const disabled = type === "friendly" && !isSelected && selectedTeams.length >= 2;
                  return (
                    <label key={team.id} className={cn("flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors", isSelected ? "bg-primary/10 border-primary/30" : disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/50")}>
                      <Checkbox checked={isSelected} disabled={disabled} onCheckedChange={() => !disabled && toggleTeam(team.id)} />
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {team.logo ? <img src={`/api/avatar/serve?key=${encodeURIComponent(team.logo)}`} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold text-muted-foreground">{(team.shortName ?? team.name)[0]}</span>}
                      </div>
                      <span className="text-sm font-medium truncate">{team.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 杯赛淘汰赛对阵配置 */}
        {type === "cup" && format === "knockout" && selectedTeams.length >= 2 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t("comp.bracketConfig")}</CardTitle>
                <Button variant="outline" size="sm" onClick={initBracket}>{t("comp.autoGenerate")}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {bracket.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("comp.clickAutoGenerate")}</p>
              ) : (
                bracket.map(([homeIdx, awayIdx], i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded border text-sm">
                    <span className="text-xs text-muted-foreground w-6">{i + 1}</span>
                    <Select value={String(homeIdx)} onValueChange={(v) => { const next = [...bracket]; next[i] = [Number(v), next[i][1]]; setBracket(next); }}>
                      <SelectTrigger className="flex-1"><SelectValue>{selectedTeams[homeIdx]?.shortName ?? selectedTeams[homeIdx]?.name ?? ""}</SelectValue></SelectTrigger>
                      <SelectContent>{selectedTeams.map((t, idx) => <SelectItem key={t.id} value={String(idx)}>{t.shortName ?? t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <span className="text-xs text-muted-foreground">vs</span>
                    <Select value={String(awayIdx)} onValueChange={(v) => { const next = [...bracket]; next[i] = [next[i][0], Number(v)]; setBracket(next); }}>
                      <SelectTrigger className="flex-1"><SelectValue>{selectedTeams[awayIdx]?.shortName ?? selectedTeams[awayIdx]?.name ?? ""}</SelectValue></SelectTrigger>
                      <SelectContent>{selectedTeams.map((t, idx) => <SelectItem key={t.id} value={String(idx)}>{t.shortName ?? t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" className="px-1" onClick={() => setBracket(bracket.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                  </div>
                ))
              )}
              {bracket.length < Math.floor(selectedTeams.length / 2) && (
                <Button variant="outline" size="sm" onClick={() => {
                  const used = new Set(bracket.flat());
                  const avail = selectedTeams.map((_, i) => i).filter((i) => !used.has(i));
                  if (avail.length >= 2) setBracket([...bracket, [avail[0], avail[1]]]);
                }}><Swords className="h-3 w-3 mr-1" />{t("comp.addBracket")}</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* 杯赛小组赛分组配置 */}
        {type === "cup" && format === "group_knockout" && selectedTeams.length >= 4 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{t("comp.groupConfig")}</CardTitle>
                <Button variant="outline" size="sm" onClick={initGroupAssignments}>{t("comp.autoGroup")}</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {selectedTeams.map((team, i) => (
                <div key={team.id} className="flex items-center gap-2 text-sm">
                  <span className="flex-1 truncate">{team.shortName ?? team.name}</span>
                  <Select value={String.fromCharCode(65 + (groupAssignments[i] ?? 0))} onValueChange={(v) => { if (!v) return; const next = [...groupAssignments]; next[i] = v.charCodeAt(0) - 65; setGroupAssignments(next); }}>
                    <SelectTrigger className="w-20"><SelectValue>{String.fromCharCode(65 + (groupAssignments[i] ?? 0))}{t("comp.groups")}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: groupCount }, (_, g) => (
                        <SelectItem key={g} value={String.fromCharCode(65 + g)}>{String.fromCharCode(65 + g)}{t("comp.groups")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 默认日期/场地 */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">{t("comp.defaultMatchInfo")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2"><Label>{t("matches.date")}</Label><Input type="date" value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("matches.time")}</Label><Input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} /></div>
              <div className="space-y-2"><Label>{t("matches.venue")}</Label><Input value={defaultVenue} onChange={(e) => setDefaultVenue(e.target.value)} placeholder={t("matches.venue")} /></div>
            </div>
            <p className="text-xs text-muted-foreground">{t("comp.canEditLater")}</p>
          </CardContent>
        </Card>

        {/* 预览 */}
        {canSubmit && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{schedulePreview.desc}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTeams.map((t) => <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-muted">{t.shortName ?? t.name}</span>)}
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full" size="lg">
          {loading ? t("comp.creating") : `${t("comp.createComp")}${canSubmit ? ` (${schedulePreview.total} ${t("comp.matchesCount")})` : ""}`}
        </Button>
      </div>
    </PageTransition>
  );
}
