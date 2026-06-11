"use client";

import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FORMATION_LIST, FORMATIONS, getFormationsForPlayerCount, PLAYER_COUNTS, type FormationPosition } from "@/types";
import { Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

interface FormationPickerProps {
  value: string;
  onChange: (formation: string) => void;
  playerCount?: number;
  onPlayerCountChange?: (count: number) => void;
  onCustomFormation?: (name: string, positions: FormationPosition[]) => void;
}

export function FormationPicker({ value, onChange, playerCount, onPlayerCountChange, onCustomFormation }: FormationPickerProps) {
  const { t } = useI18n();
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCount, setCustomCount] = useState(playerCount ?? 11);
  const [customPositions, setCustomPositions] = useState("GK 50 92\nLB 15 72\nCB 35 75\nCB 65 75\nRB 85 72\nLM 15 48\nCM 38 50\nCM 62 50\nRM 85 48\nST 38 22\nST 62 22");

  // 根据当前人数过滤阵型
  const currentCount = playerCount ?? 11;
  const formationOptions = useMemo(() => {
    if (onPlayerCountChange) {
      return getFormationsForPlayerCount(currentCount);
    }
    return FORMATION_LIST;
  }, [currentCount, onPlayerCountChange]);

  // 如果当前阵型不在过滤列表中，自动切换到第一个
  const hasCurrentFormation = formationOptions.includes(value);

  const handleCountChange = (count: number) => {
    onPlayerCountChange?.(count);
    // 自动切换该人数组的第一个阵型
    const names = getFormationsForPlayerCount(count);
    if (names.length > 0 && !names.includes(value)) {
      onChange(names[0]);
    }
  };

  const handleSaveCustom = () => {
    try {
      const positions: FormationPosition[] = customPositions
        .trim()
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length !== 3) throw new Error(`Invalid line: ${line}`);
          return { position: parts[0], x: parseFloat(parts[1]), y: parseFloat(parts[2]) };
        });
      if (positions.length < 3 || positions.length > 20) throw new Error("需要 3-20 个位置");
      const name = customName.trim() || `自定义-${Date.now()}`;
      // 存到 localStorage
      const customs = JSON.parse(localStorage.getItem("customFormations") || "{}");
      customs[name] = positions;
      localStorage.setItem("customFormations", JSON.stringify(customs));
      // 注册到 FORMATIONS
      FORMATIONS[name] = positions;
      if (!FORMATION_LIST.includes(name)) FORMATION_LIST.push(name);
      onCustomFormation?.(name, positions);
      onChange(name);
      setShowCustom(false);
    } catch (e) {
      alert(`${t("tactics.formatError")}: ${e instanceof Error ? e.message : ""}\n\n每行格式: 位置 X Y\n例如: GK 50 92`);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {/* 人数选择 */}
        {onPlayerCountChange && (
          <div className="flex gap-1">
            {PLAYER_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleCountChange(n)}
                className={cn(
                  "text-xs px-2.5 h-7 rounded-md border transition-colors",
                  currentCount === n
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-input hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {n}人
              </button>
            ))}
          </div>
        )}

        {/* 阵型下拉 */}
        <div className="flex gap-1.5">
          <Select value={hasCurrentFormation ? value : (formationOptions[0] ?? "")} onValueChange={(v) => v && onChange(v)}>
            <SelectTrigger className="flex-1">
              <SelectValue>{hasCurrentFormation ? value : (formationOptions[0] ?? "")}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {formationOptions.map((f) => (
                <SelectItem key={f} value={f}>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3 w-3 opacity-40" />
                    {f}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { setCustomCount(currentCount); setShowCustom(true); }} title={t("tactics.customFormation")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tactics.customFormation")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("tactics.formationName")}</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={t("tactics.formationNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("tactics.playerCount")}</Label>
              <div className="flex gap-1">
                {[5, 7, 8, 9, 11].map((n) => (
                  <Button
                    key={n}
                    variant={customCount === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCustomCount(n)}
                    className="text-xs h-7"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("tactics.playerPositions")}</Label>
              <textarea
                value={customPositions}
                onChange={(e) => setCustomPositions(e.target.value)}
                className="w-full h-48 p-2 border rounded-md text-sm font-mono bg-background"
                placeholder="GK 50 92&#10;LB 15 72&#10;CB 35 75"
              />
              <p className="text-xs text-muted-foreground">
                {t("tactics.positionsHint", { count: customPositions.trim().split("\n").filter((l) => l.trim()).length })}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustom(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSaveCustom}>{t("tactics.saveFormation")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
