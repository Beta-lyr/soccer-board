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

const TYPE_OPTIONS: { value: MatchType; label: string }[] = [
  { value: "league", label: "联赛" },
  { value: "cup", label: "杯赛" },
  { value: "friendly", label: "友谊赛" },
  { value: "training", label: "训练赛" },
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
      if (!opponent) { toast.error("请输入对手名称"); return; }
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
      if (!homeTeam) { toast.error("请选择主队"); return; }
      if (!awayTeam) { toast.error("请选择客队"); return; }
      if (homeTeam === awayTeam) { toast.error("主客队不能相同"); return; }
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
              <div className="font-medium text-sm">校外比赛</div>
              <div className="text-xs text-muted-foreground">对手为外校队伍</div>
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
              <div className="font-medium text-sm">校内比赛</div>
              <div className="text-xs text-muted-foreground">院系/社团之间的比赛</div>
            </div>
          </button>
        </div>

        {/* 基本信息 */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">基本信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>时间</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>场地</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="输入场地" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>比赛类型</Label>
                <Select value={matchType} onValueChange={(v) => v && setMatchType(v as MatchType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>所属赛事（可选）</Label>
                <Select value={competitionId} onValueChange={handleCompetitionChange}>
                  <SelectTrigger><SelectValue placeholder="无" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">无</SelectItem>
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
              <CardHeader className="pb-3"><CardTitle className="text-sm">对手</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>对手队名 *</Label>
                  <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="输入对手名称" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">本队出场阵容 ({selectedPlayers.length}/{players.length})</CardTitle>
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
                {players.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">请先添加球员</p>}
              </CardContent>
            </Card>
          </>
        )}

        {/* 校内比赛表单 */}
        {scope === "internal" && (
          <>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">对阵双方</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>主队 *</Label>
                    {compTeams.length > 0 ? (
                      <Select value={homeTeam} onValueChange={(v) => v && setHomeTeam(v)}>
                        <SelectTrigger><SelectValue placeholder="选择主队" /></SelectTrigger>
                        <SelectContent>
                          {compTeams.filter((t) => t !== awayTeam).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="输入主队名" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>客队 *</Label>
                    {compTeams.length > 0 ? (
                      <Select value={awayTeam} onValueChange={(v) => v && setAwayTeam(v)}>
                        <SelectTrigger><SelectValue placeholder="选择客队" /></SelectTrigger>
                        <SelectContent>
                          {compTeams.filter((t) => t !== homeTeam).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="输入客队名" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">主队出场阵容 ({homeSelectedPlayers.length}/{players.length})</CardTitle>
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
                {players.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">请先添加球员</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">客队阵容（可选，每行: 姓名 位置）</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={awayLineupText}
                  onChange={(e) => setAwayLineupText(e.target.value)}
                  placeholder={"张三 前锋\n李四 中场\n王五 后卫"}
                  className="min-h-[100px] text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  共 {parseAwayLineup().length} 人 · 格式: 姓名 + 空格 + 位置
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Button onClick={handleSubmit} className="w-full" size="lg">
          创建比赛
        </Button>
      </div>
    </PageTransition>
  );
}
