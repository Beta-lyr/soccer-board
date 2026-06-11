"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PitchSvg } from "@/components/tactics/pitch-svg";
import { useLineupTemplates } from "@/hooks/use-lineup";
import { usePlayers } from "@/hooks/use-players";
import { FORMATION_GROUPS } from "@/types";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ArrowLeft, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

const PITCH_W = 500;
const PITCH_H = 625;

function guessPlayerCount(formation: string): number | null {
  for (const [countStr, group] of Object.entries(FORMATION_GROUPS)) {
    if (formation in group) return Number(countStr);
  }
  return null;
}

function LineupDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { templates, deleteTemplate } = useLineupTemplates();
  const { players } = usePlayers();

  const template = templates.find((t) => t.id === id);
  const { confirm, ConfirmDialog } = useConfirm();

  if (!template) {
    return (
      <PageTransition>
        <Header title="阵容详情" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-3">阵容不存在或已删除</p>
            <Link href="/lineup/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回列表</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const playerCount = guessPlayerCount(template.formation);

  const handleDelete = async () => {
    if (await confirm({ description: `确认删除阵容「${template.name}」？`, variant: "destructive" })) {
      await deleteTemplate(template.id);
      toast.success("阵容已删除");
      router.push("/lineup/");
    }
  };

  return (
    <PageTransition>
      <Header
        title={template.name}
        description={`${template.formation}${playerCount ? ` · ${playerCount}人制` : ""}`}
        actions={
          <div className="flex gap-2">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />删除
            </Button>
            <Link href="/lineup/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
            </Link>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* 左侧球员列表 */}
          <div className="w-full xl:w-72 space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">首发阵容 ({template.starters.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {template.starters.map((s) => {
                  const player = players.find((p) => p.id === s.playerId);
                  return (
                    <div key={s.playerId} className="flex items-center gap-2 p-2 rounded-md text-sm bg-muted/50">
                      <span className="w-8 text-xs font-mono font-bold opacity-60">{s.position}</span>
                      <Avatar className="h-7 w-7">
                        {player?.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}
                        <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{player?.number ?? "?"}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate font-medium">{player?.name ?? "未知球员"}</span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {template.substitutes.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider">替补 ({template.substitutes.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {template.substitutes.map((playerId) => {
                    const player = players.find((p) => p.id === playerId);
                    return (
                      <div key={playerId} className="flex items-center gap-2 p-1.5 rounded text-sm">
                        <Avatar className="h-6 w-6">
                          {player?.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}
                          <AvatarFallback className="text-[10px]">{player?.number ?? "?"}</AvatarFallback>
                        </Avatar>
                        <span className="flex-1 truncate">{player?.name ?? "未知球员"}</span>
                        <span className="text-xs text-muted-foreground">{player?.positions[0] ?? ""}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧球场 */}
          <div className="flex-1 flex justify-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative" style={{ width: PITCH_W, height: PITCH_H }}>
              <PitchSvg width={PITCH_W} height={PITCH_H} />
              {template.starters.map((s, idx) => {
                const player = players.find((p) => p.id === s.playerId);
                const x = (s.x / 100) * PITCH_W;
                const y = (s.y / 100) * PITCH_H;
                return (
                  <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: idx * 0.05 }} className="absolute flex flex-col items-center" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-md bg-white text-gray-900 ring-2 ring-white/50">
                      {player?.number ?? "?"}
                    </div>
                    <span className="text-[9px] text-white font-medium mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-16 text-center">{player?.name ?? "?"}</span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
      {ConfirmDialog}
    </PageTransition>
  );
}

export default function LineupDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">加载中...</div>}>
      <LineupDetailContent />
    </Suspense>
  );
}
