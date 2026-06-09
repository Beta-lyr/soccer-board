"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FormationPicker } from "@/components/tactics/formation-picker";
import { PitchSvg } from "@/components/tactics/pitch-svg";
import { usePlayers } from "@/hooks/use-players";
import { useLineupTemplates } from "@/hooks/use-lineup";
import { useI18n } from "@/lib/i18n";
import { FORMATIONS, type FormationPosition, type LineupStarter } from "@/types";
import { Save, Trash2, FolderOpen } from "lucide-react";
import { motion } from "framer-motion";
import type { Player } from "@/types";

const PITCH_W = 500;
const PITCH_H = 625;

export default function LineupPage() {
  const { t } = useI18n();
  const { players } = usePlayers();
  const { templates, addTemplate, deleteTemplate } = useLineupTemplates();
  const [formation, setFormation] = useState("4-4-2");
  const [starters, setStarters] = useState<Map<string, string>>(new Map()); // position -> playerId
  const [templateName, setTemplateName] = useState("");
  const [selectedPos, setSelectedPos] = useState<string | null>(null);

  const formationPositions = FORMATIONS[formation];
  const starterPlayerIds = new Set(starters.values());
  const availablePlayers = players.filter((p) => !starterPlayerIds.has(p.id) && p.status === "healthy");
  const substitutes = players.filter((p) => !starterPlayerIds.has(p.id));

  // 阵型切换时清空
  useEffect(() => {
    setStarters(new Map());
    setSelectedPos(null);
  }, [formation]);

  const handlePositionClick = (pos: string) => {
    setSelectedPos(selectedPos === pos ? null : pos);
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectedPos) return;
    const next = new Map(starters);
    // 如果该球员已在其他位置，先移除
    for (const [k, v] of next) {
      if (v === player.id) next.delete(k);
    }
    next.set(selectedPos, player.id);
    setStarters(next);
    setSelectedPos(null);
  };

  const handleRemoveStarter = (pos: string) => {
    const next = new Map(starters);
    next.delete(pos);
    setStarters(next);
  };

  const handleSaveTemplate = async () => {
    if (!templateName || starters.size === 0) return;
    const lineupStarters: LineupStarter[] = [];
    for (const [pos, playerId] of starters) {
      const fp = formationPositions.find((p) => p.position === pos);
      if (fp) {
        lineupStarters.push({ playerId, position: pos, x: fp.x, y: fp.y });
      }
    }
    await addTemplate({
      name: templateName,
      formation,
      starters: lineupStarters,
      substitutes: substitutes.map((p) => p.id),
    });
    setTemplateName("");
    alert("阵容已保存！");
  };

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;
    setFormation(template.formation);
    const next = new Map<string, string>();
    template.starters.forEach((s) => next.set(s.position, s.playerId));
    setStarters(next);
  };

  return (
    <PageTransition>
      <Header
        title={t("lineup.title")}
        description={t("lineup.desc")}
        actions={
          <div className="flex gap-2">
            <Input
              placeholder="阵容名称"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-32 h-8 text-sm"
            />
            <Button size="sm" onClick={handleSaveTemplate} disabled={!templateName || starters.size === 0}>
              <Save className="h-4 w-4 mr-1" />
              保存
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col xl:flex-row gap-6">
          {/* 左侧：球员列表 */}
          <div className="w-full xl:w-64 space-y-4">
            <div className="space-y-2">
              <Label>{t("tactics.formation")}</Label>
              <FormationPicker value={formation} onChange={setFormation} />
            </div>

            {/* 已选首发 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">
                  首发 ({starters.size}/11)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {formationPositions.map((fp, idx) => {
                  const playerId = starters.get(fp.position);
                  const player = playerId ? players.find((p) => p.id === playerId) : null;
                  const isSelected = selectedPos === fp.position;
                  return (
                    <div
                      key={`${fp.position}-${idx}`}
                      onClick={() => handlePositionClick(fp.position)}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-sm transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : player
                          ? "bg-muted hover:bg-muted/80"
                          : "border border-dashed hover:bg-accent/50"
                      }`}
                    >
                      <span className="w-8 text-xs font-mono font-bold opacity-60">{fp.position}</span>
                      {player ? (
                        <>
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                              {player.number}
                            </AvatarFallback>
                          </Avatar>
                          <span className="flex-1 truncate font-medium">{player.name}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemoveStarter(fp.position); }}
                            className="opacity-40 hover:opacity-100"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-xs">
                          {isSelected ? "← 选择球员" : "点击选择"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 可选球员 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs uppercase tracking-wider">
                  可选球员 ({availablePlayers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                {availablePlayers.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    {players.length === 0 ? "请先添加球员" : "所有健康球员已选入"}
                  </p>
                ) : (
                  availablePlayers.map((player) => (
                    <div
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className={`flex items-center gap-2 p-1.5 rounded text-sm cursor-pointer transition-colors ${
                        selectedPos ? "hover:bg-accent/50" : "opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">{player.number}</AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">{player.name}</span>
                      <span className="text-xs text-muted-foreground">{player.positions[0]}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* 已保存模板 */}
            {templates.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wider">阵容模板</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {templates.map((tmpl) => (
                    <div key={tmpl.id} className="flex items-center gap-2 p-1.5 rounded text-sm">
                      <button onClick={() => handleLoadTemplate(tmpl.id)} className="flex-1 flex items-center gap-2 hover:text-primary truncate text-left">
                        <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{tmpl.name}</span>
                      </button>
                      <Badge variant="outline" className="text-[10px] shrink-0">{tmpl.formation}</Badge>
                      <button onClick={() => deleteTemplate(tmpl.id)} className="opacity-40 hover:opacity-100 shrink-0">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧：球场视图 */}
          <div className="flex-1 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
              style={{ width: PITCH_W, height: PITCH_H }}
            >
              <PitchSvg width={PITCH_W} height={PITCH_H} />

              {/* 球员标记 */}
              {formationPositions.map((fp, idx) => {
                const playerId = starters.get(fp.position);
                const player = playerId ? players.find((p) => p.id === playerId) : null;
                const x = (fp.x / 100) * PITCH_W;
                const y = (fp.y / 100) * PITCH_H;
                const isSelected = selectedPos === fp.position;

                return (
                  <motion.div
                    key={`${fp.position}-pitch-${idx}`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="absolute flex flex-col items-center"
                    style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
                  >
                    <div
                      onClick={() => handlePositionClick(fp.position)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer shadow-md transition-all ${
                        isSelected
                          ? "bg-yellow-400 text-black ring-2 ring-yellow-300 scale-110"
                          : player
                          ? "bg-white text-gray-900 ring-2 ring-white/50"
                          : "bg-white/70 text-gray-500 border border-dashed border-white/50"
                      }`}
                    >
                      {player ? player.number : fp.position}
                    </div>
                    {player && (
                      <span className="text-[9px] text-white font-medium mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] truncate max-w-16 text-center">
                        {player.name}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
