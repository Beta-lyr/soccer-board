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
import { useCompetitions, generateRoundRobinSchedule, generateKnockoutBracket, initStandings } from "@/hooks/use-competitions";
import { useTeams } from "@/hooks/use-teams";
import { ArrowLeft, Trophy, Swords, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { db } from "@/lib/db";

export default function NewCompetitionPage() {
  const router = useRouter();
  const { addCompetition } = useCompetitions();
  const { teams: allTeams } = useTeams();

  const [name, setName] = useState("");
  const [type, setType] = useState<"league" | "cup">("league");
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [defaultDate, setDefaultDate] = useState("");
  const [defaultVenue, setDefaultVenue] = useState("");
  const [loading, setLoading] = useState(false);

  const toggleTeam = (id: string) => {
    setSelectedTeamIds((prev) => prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]);
  };

  const selectedTeams = useMemo(() => allTeams.filter((t) => selectedTeamIds.includes(t.id)), [allTeams, selectedTeamIds]);
  const teamNames = selectedTeams.map((t) => t.shortName ?? t.name);
  const canSubmit = name.trim() && selectedTeams.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const format = type === "league" ? "round_robin" : "knockout";
      const matchIds: string[] = [];

      if (autoGenerate) {
        const schedule = format === "round_robin"
          ? generateRoundRobinSchedule(teamNames)
          : generateKnockoutBracket(teamNames);

        for (const [home, away] of schedule) {
          // 根据队伍名找到对应的 Team，获取球员
          const homeTeam = selectedTeams.find((t) => (t.shortName ?? t.name) === home);
          const awayTeam = selectedTeams.find((t) => (t.shortName ?? t.name) === away);

          // 获取球员信息填充阵容
          const homePlayers = homeTeam ? await Promise.all(homeTeam.playerIds.map(async (pid) => {
            const p = await db.players.get(pid);
            return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
          })) : [];
          const awayPlayers = awayTeam ? await Promise.all(awayTeam.playerIds.map(async (pid) => {
            const p = await db.players.get(pid);
            return p ? { playerId: pid, playerName: p.name, position: p.positions[0] ?? "" } : null;
          })) : [];

          const matchId = crypto.randomUUID();
          const now = new Date().toISOString();
          const hLineup = homePlayers.filter(Boolean) as NonNullable<typeof homePlayers[number]>[];
          const aLineup = awayPlayers.filter(Boolean) as NonNullable<typeof awayPlayers[number]>[];
          await db.matches.add({
            id: matchId,
            date: defaultDate || "",
            venue: defaultVenue,
            type,
            scope: "internal",
            homeTeam: home,
            awayTeam: away,
            opponent: away,
            homeLineup: hLineup,
            awayLineup: aLineup,
            // 兼容字段：用主队阵容填充
            lineup: hLineup.filter((p) => p.playerId).map((p) => ({ playerId: p.playerId!, position: p.position })),
            status: "upcoming",
            events: [],
            ratings: [],
            competitionId: undefined,
            createdAt: now,
            updatedAt: now,
          });
          matchIds.push(matchId);
        }

        const compId = await addCompetition({
          name: name.trim(),
          type,
          format,
          teams: teamNames,
          matchIds,
          standings: format === "round_robin" ? initStandings(teamNames) : undefined,
          currentRound: 1,
        });

        // 回填 competitionId 到比赛
        for (const mid of matchIds) {
          await db.matches.update(mid, { competitionId: compId as string });
        }

        toast.success(`赛事已创建，共 ${schedule.length} 场比赛`);
      } else {
        // 不自动生成比赛，只创建赛事
        await addCompetition({
          name: name.trim(),
          type,
          format,
          teams: teamNames,
          matchIds: [],
          standings: format === "round_robin" ? initStandings(teamNames) : undefined,
          currentRound: 1,
        });
        toast.success("赛事已创建，可手动添加比赛");
      }

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
        actions={
          <Link href="/competitions/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
          </Link>
        }
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
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "league" as const, label: "联赛", desc: "单循环积分制", icon: Trophy, color: "border-amber-500/50 bg-amber-500/5" },
              { value: "cup" as const, label: "杯赛", desc: "淘汰制", icon: Swords, color: "border-violet-500/50 bg-violet-500/5" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  type === opt.value ? opt.color : "border-muted hover:border-muted-foreground/20"
                )}
              >
                <opt.icon className="h-5 w-5 mb-2" />
                <div className="font-medium text-sm">{opt.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 选择参赛队伍 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />参赛队伍 ({selectedTeams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allTeams.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm mb-2">暂无队伍</p>
                <Link href="/teams/new/">
                  <Button variant="outline" size="sm">先去创建队伍</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {allTeams.map((team) => (
                  <label
                    key={team.id}
                    className={cn(
                      "flex items-center gap-2 p-2.5 rounded-md border cursor-pointer transition-colors",
                      selectedTeamIds.includes(team.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50"
                    )}
                  >
                    <Checkbox
                      checked={selectedTeamIds.includes(team.id)}
                      onCheckedChange={() => toggleTeam(team.id)}
                    />
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {team.logo ? (
                        <img src={`/api/avatar/serve?key=${encodeURIComponent(team.logo)}`} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-muted-foreground">{(team.shortName ?? team.name)[0]}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium truncate">{team.name}</span>
                  </label>
                ))}
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>默认日期</Label>
                  <Input type="date" value={defaultDate} onChange={(e) => setDefaultDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>默认场地</Label>
                  <Input value={defaultVenue} onChange={(e) => setDefaultVenue(e.target.value)} placeholder="例如：西操场" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">可在赛事详情页逐场修改</p>
            </CardContent>
          </Card>
        )}

        {/* 预览 */}
        {canSubmit && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">赛程预览</CardTitle>
            </CardHeader>
            <CardContent>
              {autoGenerate ? (
                <p className="text-sm text-muted-foreground">
                  {type === "league"
                    ? `单循环赛制，共 ${selectedTeams.length * (selectedTeams.length - 1) / 2} 场比赛`
                    : `淘汰赛制，首轮 ${Math.pow(2, Math.ceil(Math.log2(selectedTeams.length)))} 进 ${Math.pow(2, Math.ceil(Math.log2(selectedTeams.length))) / 2}`
                  }
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">创建后可在赛事详情页手动添加比赛</p>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTeams.map((t) => (
                  <span key={t.id} className="text-xs px-2 py-0.5 rounded bg-muted">{t.shortName ?? t.name}</span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 提交 */}
        <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full" size="lg">
          {loading ? "创建中..." : `创建赛事${canSubmit && autoGenerate ? ` (${type === "league" ? selectedTeams.length * (selectedTeams.length - 1) / 2 : Math.pow(2, Math.ceil(Math.log2(selectedTeams.length))) - 1} 场)` : ""}`}
        </Button>
      </div>
    </PageTransition>
  );
}
