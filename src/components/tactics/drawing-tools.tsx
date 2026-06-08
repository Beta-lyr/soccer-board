"use client";

import { Button } from "@/components/ui/button";
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

const TOOLS: { mode: DrawMode; icon: typeof MousePointer2; label: string }[] = [
  { mode: "select", icon: MousePointer2, label: "选择" },
  { mode: "move", icon: Move, label: "拖拽" },
  { mode: "run", icon: Pen, label: "跑位" },
  { mode: "pass", icon: ArrowRight, label: "传球" },
  { mode: "dribble", icon: Minus, label: "带球" },
  { mode: "defend", icon: Square, label: "防守" },
];

export function DrawingTools({
  mode,
  onModeChange,
  onUndo,
  onRedo,
  onClear,
  onExport,
  onSave,
}: DrawingToolsProps) {
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

      <Button variant="ghost" size="sm" onClick={onUndo} title="撤销">
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onRedo} title="重做">
        <Redo2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} title="清空画线">
        <Trash2 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      <Button variant="ghost" size="sm" onClick={onExport} title="导出 PNG">
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onSave} title="保存">
        <Save className="h-4 w-4" />
      </Button>
    </div>
  );
}
