"use client";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  MousePointer2,
  Move,
  Pen,
  ArrowRight,
  Minus,
  Square,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Save,
} from "lucide-react";

export type DrawMode = "select" | "move" | "run" | "pass" | "dribble" | "defend";

interface DrawingToolsProps {
  mode: DrawMode;
  onModeChange: (mode: DrawMode) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExport: () => void;
  onSave: () => void;
}

export function DrawingTools({
  mode,
  onModeChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onSave,
}: DrawingToolsProps) {
  const { t } = useI18n();

  const TOOLS: { mode: DrawMode; icon: typeof MousePointer2; label: string }[] = [
    { mode: "select", icon: MousePointer2, label: t("tactics.select") },
    { mode: "move", icon: Move, label: t("tactics.drag") },
    { mode: "run", icon: Pen, label: t("tactics.runRoute") },
    { mode: "pass", icon: ArrowRight, label: t("tactics.passRoute") },
    { mode: "dribble", icon: Minus, label: t("tactics.dribbleRoute") },
    { mode: "defend", icon: Square, label: t("tactics.defendZone") },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border rounded-lg bg-background flex-wrap">
      {TOOLS.map((tool) => (
        <Button
          key={tool.mode}
          variant={mode === tool.mode ? "default" : "ghost"}
          size="sm"
          onClick={() => onModeChange(tool.mode)}
          title={tool.label}
        >
          <tool.icon className="h-4 w-4" />
          <span className="ml-1 text-xs hidden sm:inline">{tool.label}</span>
        </Button>
      ))}

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="ghost" size="sm" onClick={onUndo} title={t("tactics.undo")}>
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} title={t("tactics.redo")}>
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} title={t("tactics.clear")}>
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="ghost" size="sm" onClick={onExport} title={t("tactics.exportPng")}>
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="default" size="sm" onClick={onSave} title={t("common.save")}>
        <Save className="h-4 w-4 mr-1" />
        <span className="text-xs">{t("common.save")}</span>
      </Button>
    </div>
  );
}
