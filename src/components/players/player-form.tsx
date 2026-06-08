"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Player, PlayerAbilities, PlayerStatus, PreferredFoot } from "@/types";

const POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "CF", "ST",
];

const STATUS_OPTIONS: { value: PlayerStatus; label: string }[] = [
  { value: "healthy", label: "健康" },
  { value: "minor_injury", label: "轻伤" },
  { value: "injured", label: "伤病" },
  { value: "leave", label: "请假" },
];

const FOOT_OPTIONS: { value: PreferredFoot; label: string }[] = [
  { value: "right", label: "右脚" },
  { value: "left", label: "左脚" },
  { value: "both", label: "双脚" },
];

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Player, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: Player;
}

export function PlayerForm({ open, onOpenChange, onSubmit, initialData }: PlayerFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [number, setNumber] = useState(initialData?.number?.toString() ?? "");
  const [height, setHeight] = useState(initialData?.height?.toString() ?? "");
  const [weight, setWeight] = useState(initialData?.weight?.toString() ?? "");
  const [preferredFoot, setPreferredFoot] = useState<PreferredFoot>(initialData?.preferredFoot ?? "right");
  const [selectedPositions, setSelectedPositions] = useState<string[]>(initialData?.positions ?? []);
  const [status, setStatus] = useState<PlayerStatus>(initialData?.status ?? "healthy");
  const [abilities, setAbilities] = useState<PlayerAbilities>(
    initialData?.abilities ?? { speed: 5, shooting: 5, passing: 5, defending: 5, stamina: 5, awareness: 5 }
  );

  const togglePosition = (pos: string) => {
    setSelectedPositions((prev) =>
      prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]
    );
  };

  const handleSubmit = () => {
    if (!name || !number) return;
    onSubmit({
      name,
      number: parseInt(number),
      height: height ? parseInt(height) : undefined,
      weight: weight ? parseInt(weight) : undefined,
      preferredFoot,
      positions: selectedPositions,
      status,
      abilities,
      avatar: initialData?.avatar,
    });
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setNumber("");
    setHeight("");
    setWeight("");
    setPreferredFoot("right");
    setSelectedPositions([]);
    setStatus("healthy");
    setAbilities({ speed: 5, shooting: 5, passing: 5, defending: 5, stamina: 5, awareness: 5 });
  };

  const updateAbility = (key: keyof PlayerAbilities, value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return;
    setAbilities((prev) => ({ ...prev, [key]: Math.min(10, Math.max(1, num)) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "编辑球员" : "添加球员"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>姓名 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="球员姓名" />
            </div>
            <div className="space-y-2">
              <Label>球衣号码 *</Label>
              <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1-99" min={1} max={99} />
            </div>
            <div className="space-y-2">
              <Label>身高 (cm)</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
            </div>
            <div className="space-y-2">
              <Label>体重 (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
            <div className="space-y-2">
              <Label>惯用脚</Label>
              <Select value={preferredFoot} onValueChange={(v) => v && setPreferredFoot(v as PreferredFoot)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOOT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>状态</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v as PlayerStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 擅长位置 */}
          <div className="space-y-2">
            <Label>擅长位置</Label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => togglePosition(pos)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedPositions.includes(pos)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </div>

          {/* 能力评分 */}
          <div className="space-y-3">
            <Label>能力评分 (1-10)</Label>
            <div className="grid grid-cols-3 gap-4">
              {(Object.keys(abilities) as (keyof PlayerAbilities)[]).map((key) => {
                const labels: Record<keyof PlayerAbilities, string> = {
                  speed: "速度", shooting: "射门", passing: "传球",
                  defending: "防守", stamina: "体能", awareness: "意识",
                };
                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{labels[key]}</Label>
                    <Input
                      type="number"
                      value={abilities[key]}
                      onChange={(e) => updateAbility(key, e.target.value)}
                      min={1}
                      max={10}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleSubmit} disabled={!name || !number}>
            {initialData ? "保存" : "添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
