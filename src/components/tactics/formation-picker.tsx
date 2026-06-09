"use client";

import { useState } from "react";
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
import { FORMATION_LIST, FORMATIONS, type FormationPosition } from "@/types";
import { Plus } from "lucide-react";

interface FormationPickerProps {
  value: string;
  onChange: (formation: string) => void;
  onCustomFormation?: (name: string, positions: FormationPosition[]) => void;
}

export function FormationPicker({ value, onChange, onCustomFormation }: FormationPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customPositions, setCustomPositions] = useState<string>("GK 50 92\nLB 15 72\nCB 35 75\nCB 65 75\nRB 85 72\nLM 15 48\nCM 38 50\nCM 62 50\nRM 85 48\nST 38 22\nST 62 22");

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
      if (positions.length < 1 || positions.length > 11) throw new Error("需要 1-11 个位置");
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
      alert(`格式错误: ${e instanceof Error ? e.message : "未知错误"}\n\n每行格式: 位置 X Y\n例如: GK 50 92`);
    }
  };

  return (
    <>
      <div className="flex gap-1.5">
        <Select value={value} onValueChange={(v) => v && onChange(v)}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="选择阵型" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(FORMATIONS).map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setShowCustom(true)} title="自定义阵型">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showCustom} onOpenChange={setShowCustom}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>自定义阵型</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>阵型名称</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="例如: 4-3-3-攻击" />
            </div>
            <div className="space-y-2">
              <Label>球员位置（每行: 位置 X Y，X/Y 为百分比 0-100）</Label>
              <textarea
                value={customPositions}
                onChange={(e) => setCustomPositions(e.target.value)}
                className="w-full h-48 p-2 border rounded-md text-sm font-mono bg-background"
                placeholder="GK 50 92&#10;LB 15 72&#10;CB 35 75"
              />
              <p className="text-xs text-muted-foreground">
                共 {customPositions.trim().split("\n").filter((l) => l.trim()).length} 个位置 ·
                X: 0(左)~100(右) · Y: 0(上/对方)~100(下/己方)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustom(false)}>取消</Button>
            <Button onClick={handleSaveCustom}>保存阵型</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
