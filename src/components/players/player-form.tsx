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
import { useI18n } from "@/lib/i18n";
import type { Player, PlayerAbilities, PlayerStatus, PreferredFoot } from "@/types";

const POSITIONS = [
  "GK", "CB", "LB", "RB", "LWB", "RWB",
  "CDM", "CM", "CAM", "LM", "RM",
  "LW", "RW", "CF", "ST",
];

interface PlayerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Player, "id" | "createdAt" | "updatedAt">) => void;
  initialData?: Player;
}

export function PlayerForm({ open, onOpenChange, onSubmit, initialData }: PlayerFormProps) {
  const { t } = useI18n();
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

  const STATUS_OPTIONS: { value: PlayerStatus; key: string }[] = [
    { value: "healthy", key: "players.healthy" },
    { value: "minor_injury", key: "players.minorInjury" },
    { value: "injured", key: "players.injured" },
    { value: "leave", key: "players.leave" },
  ];

  const FOOT_OPTIONS: { value: PreferredFoot; key: string }[] = [
    { value: "right", key: "players.rightFoot" },
    { value: "left", key: "players.leftFoot" },
    { value: "both", key: "players.bothFeet" },
  ];

  const ABILITY_KEYS: Record<keyof PlayerAbilities, string> = {
    speed: "players.speed", shooting: "players.shooting", passing: "players.passing",
    defending: "players.defending", stamina: "players.stamina", awareness: "players.awareness",
  };

  const togglePosition = (pos: string) => {
    setSelectedPositions((prev) => prev.includes(pos) ? prev.filter((p) => p !== pos) : [...prev, pos]);
  };

  const resetForm = () => {
    setName(""); setNumber(""); setHeight(""); setWeight("");
    setPreferredFoot("right"); setSelectedPositions([]); setStatus("healthy");
    setAbilities({ speed: 5, shooting: 5, passing: 5, defending: 5, stamina: 5, awareness: 5 });
  };

  const handleSubmit = async () => {
    if (!name || !number) return;
    try {
      await onSubmit({
        name, number: parseInt(number),
        height: height ? parseInt(height) : undefined,
        weight: weight ? parseInt(weight) : undefined,
        preferredFoot, positions: selectedPositions, status, abilities,
        avatar: initialData?.avatar,
      });
      onOpenChange(false);
    } catch (e) {
      console.error("Failed to save player:", e);
    }
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
          <DialogTitle>{initialData ? t("common.edit") : t("players.addPlayer")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("common.name")} *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.name")} />
            </div>
            <div className="space-y-2">
              <Label>{t("players.number")} *</Label>
              <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1-99" min={1} max={99} />
            </div>
            <div className="space-y-2">
              <Label>{t("players.height")} (cm)</Label>
              <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="175" />
            </div>
            <div className="space-y-2">
              <Label>{t("players.weight")} (kg)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
            </div>
            <div className="space-y-2">
              <Label>{t("players.preferredFoot")}</Label>
              <Select value={preferredFoot} onValueChange={(v) => v && setPreferredFoot(v as PreferredFoot)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FOOT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("common.status")}</Label>
              <Select value={status} onValueChange={(v) => v && setStatus(v as PlayerStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("players.position")}</Label>
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

          <div className="space-y-3">
            <Label>{t("players.abilities")} (1-10)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(Object.keys(abilities) as (keyof PlayerAbilities)[]).map((key) => (
                <div key={key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{t(ABILITY_KEYS[key])}</Label>
                  <Input type="number" value={abilities[key]} onChange={(e) => updateAbility(key, e.target.value)} min={1} max={10} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
          <Button onClick={handleSubmit} disabled={!name || !number}>
            {initialData ? t("common.save") : t("common.add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
