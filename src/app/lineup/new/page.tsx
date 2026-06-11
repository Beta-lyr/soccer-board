"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormationPicker } from "@/components/tactics/formation-picker";
import { PitchSvg } from "@/components/tactics/pitch-svg";
import { ResponsiveCanvas } from "@/components/ui/responsive-canvas";
import { usePlayers } from "@/hooks/use-players";
import { useLineupTemplates } from "@/hooks/use-lineup";
import { FORMATIONS, type LineupStarter } from "@/types";
import { Save, Trash2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { Player } from "@/types";
import { toast } from "sonner";

const PITCH_W = 500;
const PITCH_H = 625;

export default function NewLineupPage() {
  const router = useRouter();
  const { players } = usePlayers();
  const { addTemplate } = useLineupTemplates();
  const [name, setName] = useState("");
  const [playerCount, setPlayerCount] = useState<number>(11);
  const [formation, setFormation] = useState("4-4-2");
  const [starters, setStarters] = useState<Map<number, string>>(new Map());
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const formationPositions = FORMATIONS[formation] ?? [];
  const starterPlayerIds = new Set(starters.values());
  const availablePlayers = players.filter((p) => !starterPlayerIds.has(p.id) && p.status === "healthy");

  const resetStarters = useCallback(() => {
    setStarters(new Map());
    setSelectedIndex(null);
  }, []);

  const handlePlayerCountChange = useCallback((count: number) => {
    setPlayerCount(count);
    resetStarters();
  }, [resetStarters]);

  const handleFormationChange = useCallback((f: string) => {
    setFormation(f);
    resetStarters();
  }, [resetStarters]);

  const handlePositionClick = (idx: number) => {
    setSelectedIndex(selectedIndex === idx ? null : idx);
  };

  const handlePlayerSelect = (player: Player) => {
    if (selectedIndex === null) return;
    const next = new Map(starters);
    for (const [k, v] of next) {
      if (v === player.id) next.delete(k);
    }
    next.set(selectedIndex, player.id);
    setStarters(next);
    setSelectedIndex(null);
  };

  const handleRemoveStarter = (idx: number) => {
    const next = new Map(starters);
    next.delete(idx);
    setStarters(next);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("请输入阵容名称");
      return;
    }
    if (starters.size === 0) {
      toast.error("请选择至少一名首发球员");
      return;
    }
    const lineupStarters: LineupStarter[] = [];
    for (const [idx, playerId] of starters) {
      const fp = formationPositions[idx];
      if (fp) lineupStarters.push({ playerId, position: fp.position, x: fp.x, y: fp.y });
    }
    await addTemplate({
      name: name.trim(),
      formation,
      starters: lineupStarters,
      substitutes: availablePlayers.map((p) => p.id),
    });
    toast.success("阵容已保存");
    router.push("/lineup/");
  };

  return (
    <PageTransition>
      <Header
        title="新建阵容"
        actions={
          <div className="flex gap-2 items-center">
            <Input placeholder="阵容名称" value={name} onChange={(e) => setName(e.target.value)} className="w-36 h-8 text-sm" />
            <Button size="sm" onClick={handleSave} disabled={!name.trim() || starters.size === 0}>
              <Save className="h-4 w-4 mr-1" />保存
            </Button>
            <Link href="/lineup/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
            </Link>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* 左侧控制面板 */}
          <div className="w-full xl:w-64 space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-medium">人数 & 阵型</span>
              <FormationPicker
                value={formation}
                onChange={handleFormationChange}
                playerCount={playerCount}
                onPlayerCountChange={handlePlayerCountChange}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">首发 ({starters.size}/{playerCount})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {formationPositions.map((fp, idx) => {
                  const playerId = starters.get(idx);
                  const player = playerId ? players.find((p) => p.id === playerId) : null;
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => handlePositionClick(idx)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${
                        isSelected ? "bg-primary text-primary-foreground" : player ? "bg-muted hover:bg-muted/80" : "border border-dashed hover:bg-accent/50"
                      }`}
                    >
                      <span className="w-8 text-xs font-mono font-bold opacity-60">{fp.position}</span>
                      {player ? (
                        <>
                          <Avatar className="h-6 w-6">
                            {player.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{player.number}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate font-medium">{player.name}</span>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveStarter(idx); }} className="opacity-40 hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">{isSelected ? "← 选择球员" : "点击选择"}</span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">可选球员 ({availablePlayers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {availablePlayers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">{players.length === 0 ? "请先添加球员" : "所有健康球员已选入"}</p>
                ) : (
                  availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className={`flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer transition-colors ${selectedIndex !== null ? "hover:bg-accent/50" : "opacity-50 cursor-not-allowed"}`}
                    >
                      <Avatar className="h-6 w-6">
                        {player.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}
                        <AvatarFallback className="text-[10px]">{player.number}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{player.name}</span>
                      <span className="text-xs text-muted-foreground">{player.positions[0]}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右侧球场 */}
          <div className="flex-1 flex justify-center">
            <ResponsiveCanvas width={PITCH_W} height={PITCH_H}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative" style={{ width: PITCH_W, height: PITCH_H }}>
              <PitchSvg width={PITCH_W} height={PITCH_H} />
              {formationPositions.map((fp, idx) => {
                const playerId = starters.get(idx);
                const player = playerId ? players.find((p) => p.id === playerId) : null;
                const x = (fp.x / 100) * PITCH_W;
                const y = (fp.y / 100) * PITCH_H;
                const isSelected = selectedIndex === idx;
                return (
                  <motion.div key={idx} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} className="absolute flex flex-col items-center" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
                    <div
                      onClick={() => handlePositionClick(idx)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shadow-md transition-all ${
                        isSelected ? "bg-yellow-400 text-black ring-2 ring-yellow-300 scale-110" : player ? "bg-white text-gray-900 ring-2 ring-white/50" : "bg-white/70 text-gray-500 border border-dashed border-white/50"
                      }`}
                    >
                      {player ? player.number : fp.position}
                    </div>
                    {player && <span className="text-[9px] text-white font-medium mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-16 text-center">{player.name}</span>}
                  </motion.div>
                );
              })}
            </motion.div>
            </ResponsiveCanvas>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
