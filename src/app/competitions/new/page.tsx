"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompetitions, generateMultiRoundRobinSchedule, generateKnockoutBracket, generateGroups, initStandings } from "@/hooks/use-competitions";
import { useTeams } from "@/hooks/use-teams";
import { ArrowLeft, Trophy, Swords, Users, Handshake } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";
import type { CompetitionGroup } from "@/types";

const COMP_TYPES = [
  { value: "league" as const, label: "联赛", desc: "积分制，支持单/双循环", icon: Trophy, color: "border-amber-500/50 bg-amber-500/5" },
  { value: "cup" as const, label: "杯赛", desc: "小组赛+淘汰赛 或 直接淘汰赛", icon: Swords, color: "border-violet-500/50 bg-violet-500/5" },
  { value: "friendly" as const, label: "友谊赛", desc: "两队一场比赛", icon: Handshake, color: "border-emerald-500/50 bg-emerald-500/5" },
];

export default function NewCompetitionPage() {
  const router = useRouter();
  const { addCompetition } = useCompetitions();
  const { teams: allTeams } = useTeams();

  const [name, setName] = useState("");
  const [type, setType] = useState<"league" | "cup" | "friendly">("league");
  const [format, setFormat] = useState<"round_robin" | "knockout" | "group_knockout">("round_robin");
  const [rounds, setRounds] = useState(1); // 联赛循环次数
  const [groupCount, setGroupCount] = useState(2); // 杯赛小组数
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultTime, setDefaultTime] = useState("14:00");
  const [defaultVenue, setDefaultVenue] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const selectedTeams = useMemo(() => allTeams.filter((t) => selectedTeamIds.includes(t.id)), [allTeams, selectedTeamIds]);
  const teamNames = selectedTeams.map((t) => t.shortName ?? t.name);

  // 友谊赛强制2队
  const canSubmit = type === "friendly"
    ? name.trim() && selectedTeams.length === 2
    : name.trim() && selectedTeams.length >= 2;

  // 赛程预览
  const schedulePreview = useMemo(() => {
    if (type === "friendly") return { total: 1, desc: `${teamNames[0] ?? "A"} vs ${teamNames[1] ?? "B"}` };
    if (type === "league") {
      const single = selectedTeams.length * (selectedTeams.length - 1) / 2;
      return { total: single * rounds, desc: `${rounds === 1 ? "单循环" : `${rounds}循环`}，${single * rounds} 场` };
    }
    if (format === "knockout") {
      const size = Math.pow(2, Math.ceil(Math.log2(selectedTeams.length)));
      return { total: size - 1, desc: `淘汰赛，首轮 ${size} 进 ${size / 2}` };
    }
    // group_knockout
    const perGroup = Math.floor(selectedTeams.length / groupCount);
    const groupMatches = groupCount * perGroup * (perGroup - 1) / 2;
    const knockoutMatches = groupCount - 1; // 简化
    return { total: groupMatches + knockoutMatches, desc: `${groupCount} 组 × ${perGroup} 队 → 淘汰赛` };
  }, [type, format, rounds, groupCount, selectedTeams.length, teamNames]);

  // 创建比赛的通用函数
  const createMatch = async (home: string, away: string, round?: number) => {
    const dateTime = defaultDate ? `${defaultDate}T${defaultTime || "14:00"}` : "";
    const homeTeam = selectedTeams.find((t) => (t.shortName ?? t.name) === home);
    const awayTeam = selectedTeams.find((t) => (t.shortName ?? t.name) === away);
    const hLineup = homeTeam ? (await Promise.all(homeTeam.playerIds.map(async (pid) => {
      const p = await db.players.get(pid);
      return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
    }))).filter(Boolean) : [];
    const aLineup = awayTeam ? (await Promise.all(awayTeam.playerIds.map(async (pid) => {
      const p = await db.players.get(pid);
      return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
    }))).filter(Boolean) : [];

    const matchId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.matches.add({
      id: matchId, date: dateTime, venue: defaultVenue, type, scope: "internal",
      homeTeam: home, awayTeam: away, opponent: away,
      homeLineup: hLineup as NonNullable<typeof hLineup[number]>[],
      awayLineup: aLineup as NonNullable<typeof aLineup[number]>[],
      lineup: hLineup.filter((p) => p?.playerId).map((p) => ({ playerId: p!.playerId!, position: p!.position })),
      status: "upcoming", events: [], ratings: [], competitionId: undefined, round,
      createdAt: now, updatedAt: now,
    });
    return matchId;
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const matchIds: string[] = [];
      let compStandings: ReturnType<typeof initStandings> | undefined;
      let compGroups: CompetitionGroup[] | undefined;
      let compFormat: typeof format = format;

      if (type === "friendly") {
        // 友谊赛：1场比赛
        compFormat = "round_robin";
        if (autoGenerate) {
          const mid = await createMatch(teamNames[0], teamNames[1]);
          matchIds.push(mid);
        }
      } else if (type === "league") {
        // 联赛：多循环
        compFormat = "round_robin";
        if (autoGenerate) {
          const schedule = generateMultiRoundRobinSchedule(teamNames, rounds);
          for (const m of schedule) {
            const mid = await createMatch(m.home, m.away, m.round);
            matchIds.push(mid);
          }
        }
        compStandings = initStandings(teamNames);
      } else {
        // 杯赛
        if (format === "group_knockout" && selectedTeams.length >= 4) {
          // 小组赛+淘汰赛
          const groups = generateGroups(teamNames, groupCount);
          compGroups = groups.map((g) => ({ ...g, standings: initStandings(g.teams) }));

          if (autoGenerate) {
            // 小组内循环
            for (const group of groups) {
              const schedule = generateMultiRoundRobinSchedule(group.teams, 1);
              for (const m of schedule) {
                const mid = await createMatch(m.home, m.away);
                matchIds.push(mid);
              }
            }
          }
        } else {
          // 直接淘汰赛
          compFormat = "knockout";
          if (autoGenerate) {
            const bracket = generateKnockoutBracket(teamNames);
            for (const [home, away] of bracket) {
              const mid = await createMatch(home, away, 1);
              matchIds.push(mid);
            }
          }
        }
      }

      const compId = await addCompetition({
        name: name.trim(), type, format: compFormat, teams: teamNames, matchIds,
        standings: compStandings, groups: compGroups, currentRound: 1, rounds: type === "league" ? rounds : undefined,
      });

      // 回填 competitionId
      for (const mid of matchIds) {
        await db.matches.update(mid, { competitionId: compId as string });
      }

      toast.success(`赛事已创建${autoGenerate ? `，共 ${matchIds.length} 场比赛` : ""}`);
      router.push("/competitions/");
    } catch {
      toast.error("创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <Header
        title="新建赛事"
        actions={<Link href="/competitions/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button></Link>}
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto space-y-6">
        {/* 赛事名称 */}
        <div className="space-y-2">
          <Label>赛事名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：校内联赛 2026" />
        </div>

        {/* 赛事类型 */}
        <div className="space-y-2">
          <Label>赛事类型</Label>
          <div className="grid grid-cols-3 gap-3">
            {COMP_TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { setType(opt.value); if (opt.value === "friendly") setSelectedTeamIds((prev) => prev.slice(0, 2)); }}
                className={cn("p-4 rounded-lg border-2 text-left transition-all", type === opt.value ? opt.color : "border-muted hover:border-muted-foreground/20")}
              >
                <opt.icon className="h-5 w-5 mb-2" />
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 赛制选项 */}
        {type === "league" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">赛制</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[1, 2].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRounds(r)}
                    className={cn("px-4 py-2 rounded-md border text-sm transition-colors", rounds === r ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:bg-accent")}
                  >
                    {r === 1 ? "单循环" : "双循环"}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {type === "cup" && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">赛制</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                {[
                  { value: "knockout" as const, label: "直接淘汰赛" },
                  { value: "group_knockout" as const, label: "小组赛+淘汰赛" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormat(opt.value)}
                    className={cn("px-4 py-2 rounded-md border text-sm transition-colors", format === opt.value ? "bg-primary text-primary-foreground border-primary" : "border-muted hover:bg-accent")}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {format === "group_knockout" && (
                <div className="space-y-2">
                  <Label>小组数</Label>
                  <Select value={String(groupCount)} onValueChange={(v) => v && setGroupCount(Number(v))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 6, 8].filter((n) => n <= selectedTeams.length).map((n) => (
                        <SelectItem key={n} value={String(n)}>{n} 组</SelectItem>
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
              <Users className="h-4 w-4" />参赛队伍 ({selectedTeams.length})
              {type === "friendly" && <span className="text-muted-foreground font-normal">（选择 2 支）</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTeams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm mb-2">暂无队伍</p>
                <Link href="/teams/new/"><Button variant="outline" size="sm">先去创建队伍</Button></Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allTeams.map((team) => {
                  const isSelected = selectedTeamIds.includes(team.id);
                  const disabled = type === "friendly" && !isSelected && selectedTeams.length >= 2;
                  return (
                    <label
                      key={team.id}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                        isSelected ? "bg-primary/10 border-primary/30" : disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-accent/50"
                      )}
                    >
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

        {/* 自动生成选项 */}
        <div className="flex items-center gap-3 p-3 rounded-lg border">
          <Checkbox checked={autoGenerate} onCheckedChange={(v) => setAutoGenerate(v === true)} />
          <div>
            <Label className="text-sm cursor-pointer">自动生成赛程</Label>
            <p className="text-xs text-muted-foreground">取消勾选可稍后手动添加比赛</p>
          </div>
        </div>

        {/* 默认日期/场地 */}
        {autoGenerate && (
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">默认比赛信息（可选）</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>日期</Label><Input type="date" value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} /></div>
                <div className="space-y-2"><Label>时间</Label><Input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} /></div>
                <div className="space-y-2"><Label>场地</Label><Input value={defaultVenue} onChange={(e) => setDefaultVenue(e.target.value)} placeholder="例如：西操场" /></div>
              </div>
              <p className="text-xs text-muted-foreground">可在赛事详情页逐场修改</p>
            </CardContent>
          </Card>
        )}

        {/* 预览 & 提交 */}
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
          {loading ? "创建中..." : `创建赛事${canSubmit && autoGenerate ? ` (${schedulePreview.total} 场)` : ""}`}
        </Button>
      </div>
    </PageTransition>
  );
}
