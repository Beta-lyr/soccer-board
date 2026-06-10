"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCompetitions, generateRoundRobinSchedule, generateKnockoutBracket, initStandings } from "@/hooks/use-competitions";
import { useMatches } from "@/hooks/use-matches";
import { ArrowLeft, Trophy, Swords, Plus, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewCompetitionPage() {
  const router = useRouter();
  const { addCompetition } = useCompetitions();
  const { addMatch } = useMatches();

  const [name, setName] = useState("");
  const [type, setType] = useState<"league" | "cup">("league");
  const [teams, setTeams] = useState<string[]>([""]);
  const [bulkInput, setBulkInput] = useState("");
  const [loading, setLoading] = useState(false);

  const addTeam = () => setTeams([...teams, ""]);
  const removeTeam = (idx: number) => setTeams(teams.filter((_, i) => i !== idx));
  const updateTeam = (idx: number, value: string) => {
    const next = [...teams];
    next[idx] = value;
    setTeams(next);
  };

  const handleBulkImport = () => {
    const names = bulkInput.split(/[\n,，、]+/).map((s) => s.trim()).filter(Boolean);
    if (names.length > 0) {
      setTeams(names);
      setBulkInput("");
    }
  };

  const validTeams = teams.filter((t) => t.trim());
  const canSubmit = name.trim() && validTeams.length >= 2;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);

    try {
      const format = type === "league" ? "round_robin" : "knockout";
      const schedule = format === "round_robin"
        ? generateRoundRobinSchedule(validTeams)
        : generateKnockoutBracket(validTeams);

      // 批量创建比赛
      const matchIds: string[] = [];
      for (const [, away] of schedule) {
        const matchData = {
          date: "",
          opponent: away,
          venue: "",
          type: type as "league" | "cup",
          status: "upcoming" as const,
          lineup: [],
        };
        const id = await addMatch(matchData);
        if (typeof id === "string") matchIds.push(id);
      }

      // 创建赛事
      await addCompetition({
        name: name.trim(),
        type,
        format,
        teams: validTeams,
        matchIds,
        standings: format === "round_robin" ? initStandings(validTeams) : undefined,
      });

      toast.success(`赛事已创建，共 ${schedule.length} 场比赛`);
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

        {/* 参赛队伍 */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">参赛队伍 ({validTeams.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={addTeam}>
                <Plus className="h-3.5 w-3.5 mr-1" />添加
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {teams.map((team, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={team}
                  onChange={(e) => updateTeam(idx, e.target.value)}
                  placeholder={`队伍 ${idx + 1}`}
                  className="h-9"
                />
                {teams.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeTeam(idx)} className="shrink-0 px-2">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            {/* 批量导入 */}
            <div className="pt-3 border-t">
              <Label className="text-xs text-muted-foreground">批量导入（每行一个或用逗号分隔）</Label>
              <div className="flex gap-2 mt-1.5">
                <Textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder={"队伍A\n队伍B\n队伍C"}
                  className="min-h-[60px] text-sm"
                />
                <Button variant="outline" size="sm" onClick={handleBulkImport} className="shrink-0">
                  导入
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 预览 */}
        {canSubmit && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">赛程预览</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {type === "league"
                  ? `单循环赛制，共 ${validTeams.length * (validTeams.length - 1) / 2} 场比赛`
                  : `淘汰赛制，首轮 ${Math.pow(2, Math.ceil(Math.log2(validTeams.length)))} 进 ${Math.pow(2, Math.ceil(Math.log2(validTeams.length))) / 2}`
                }
              </p>
            </CardContent>
          </Card>
        )}

        {/* 提交 */}
        <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="w-full" size="lg">
          {loading ? "创建中..." : `创建赛事${canSubmit ? ` (${type === "league" ? validTeams.length * (validTeams.length - 1) / 2 : Math.pow(2, Math.ceil(Math.log2(validTeams.length))) - 1} 场)` : ""}`}
        </Button>
      </div>
    </PageTransition>
  );
}
