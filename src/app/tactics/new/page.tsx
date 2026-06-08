"use client";

import { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
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
import { Pitch } from "@/components/tactics/pitch";
import { FormationPicker } from "@/components/tactics/formation-picker";
import { DrawingTools, type DrawMode } from "@/components/tactics/drawing-tools";
import { FORMATIONS, type TacticType } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";

export default function NewTacticPage() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [tacticType, setTacticType] = useState<TacticType>("open_play");
  const [formation, setFormation] = useState("4-4-2");
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

  const TACTIC_TYPES: { value: TacticType; key: string }[] = [
    { value: "open_play", key: "tactics.openPlay" },
    { value: "corner", key: "tactics.corner" },
    { value: "free_kick", key: "tactics.freeKick" },
    { value: "throw_in", key: "tactics.throwIn" },
  ];

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    const json = JSON.stringify(canvasRef.current.toObject());
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    historyRef.current.push(json);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    saveToHistory();

    canvas.on("mouse:down", (opt) => {
      if (drawMode === "select" || drawMode === "move") return;
      const pointer = canvas.getScenePoint(opt.e);
      drawStartRef.current = { x: pointer.x, y: pointer.y };
      setIsDrawing(true);
    });

    canvas.on("mouse:up", (opt) => {
      if (!isDrawing || !drawStartRef.current) return;
      const pointer = canvas.getScenePoint(opt.e);
      const start = drawStartRef.current;

      if (drawMode === "run") {
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#ffffff", strokeWidth: 3, strokeDashArray: [8, 4],
          selectable: true, evented: true,
        });
        path.set("data", { type: "drawing" });
        canvas.add(path);
      } else if (drawMode === "pass") {
        const line = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#facc15", strokeWidth: 3, selectable: true, evented: true,
        });
        line.set("data", { type: "drawing" });
        canvas.add(line);
        const angle = Math.atan2(pointer.y - start.y, pointer.x - start.x);
        const arrow = new fabric.Triangle({
          left: pointer.x, top: pointer.y, width: 12, height: 12,
          fill: "#facc15", angle: (angle * 180) / Math.PI + 90,
          originX: "center", originY: "center", selectable: false, evented: false,
        });
        arrow.set("data", { type: "drawing" });
        canvas.add(arrow);
      } else if (drawMode === "dribble") {
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#38bdf8", strokeWidth: 4, selectable: true, evented: true,
        });
        path.set("data", { type: "drawing" });
        canvas.add(path);
      } else if (drawMode === "defend") {
        const rect = new fabric.Rect({
          left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y),
          width: Math.abs(pointer.x - start.x), height: Math.abs(pointer.y - start.y),
          fill: "rgba(239, 68, 68, 0.15)", stroke: "rgba(239, 68, 68, 0.5)",
          strokeWidth: 1, selectable: true, evented: true,
        });
        rect.set("data", { type: "drawing" });
        canvas.add(rect);
      }

      drawStartRef.current = null;
      setIsDrawing(false);
      saveToHistory();
    });
  }, [drawMode, isDrawing, saveToHistory]);

  const updateCanvasMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode);
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.selection = mode === "select";
    canvas.getObjects().forEach((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      if (data?.type === "player") {
        obj.selectable = mode === "move";
        obj.evented = mode === "move" || mode === "select";
      } else if (data?.type === "drawing") {
        obj.selectable = mode === "select";
        obj.evented = mode === "select";
      }
    });
    canvas.renderAll();
  }, []);

  const handleUndo = () => {
    if (historyIndexRef.current <= 0 || !canvasRef.current) return;
    historyIndexRef.current--;
    canvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvasRef.current?.renderAll());
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !canvasRef.current) return;
    historyIndexRef.current++;
    canvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvasRef.current?.renderAll());
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    canvasRef.current.getObjects().filter((obj) => (obj as fabric.FabricObject).get("data")?.type === "drawing").forEach((obj) => canvasRef.current!.remove(obj));
    canvasRef.current.renderAll();
    saveToHistory();
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `tactic_${name || "untitled"}.png`;
    link.href = canvasRef.current.toDataURL({ format: "png", multiplier: 2 });
    link.click();
  };

  const handleSave = async () => {
    if (!canvasRef.current || !name) return;
    const canvas = canvasRef.current;
    const positions = canvas.getObjects().filter((obj) => (obj as fabric.FabricObject).get("data")?.type === "player").map((obj) => ({
      playerId: "", x: ((obj.left ?? 0) / 600) * 100, y: ((obj.top ?? 0) / 750) * 100,
      label: (obj as fabric.FabricObject).get("data")?.position,
    }));
    await db.tactics.add({
      id: crypto.randomUUID(), name, type: tacticType, formation,
      players: positions, drawings: canvas.toObject(),
      thumbnail: canvas.toDataURL({ format: "png", multiplier: 0.5 }),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    alert(t("tactics.saved"));
  };

  return (
    <PageTransition>
      <Header
        title={t("tactics.newTactic")}
        actions={
          <Link href="/tactics/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("common.back")}
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* 左侧设置 */}
          <div className="w-full lg:w-64 space-y-4">
            <div className="space-y-2">
              <Label>{t("tactics.tacticName")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("tactics.tacticNamePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("tactics.tacticType")}</Label>
              <Select value={tacticType} onValueChange={(v) => v && setTacticType(v as TacticType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TACTIC_TYPES.map((tt) => <SelectItem key={tt.value} value={tt.value}>{t(tt.key)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("tactics.formation")}</Label>
              <FormationPicker value={formation} onChange={setFormation} />
            </div>
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <p className="font-medium text-sm">{t("tactics.tips")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipMove")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipRun")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipPass")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipDribble")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipDefend")}</p>
            </div>
          </div>

          {/* 右侧画板 */}
          <div className="flex-1 space-y-3 overflow-x-auto">
            <DrawingTools
              mode={drawMode}
              onModeChange={updateCanvasMode}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onExport={handleExport}
              onSave={handleSave}
            />
            <div className="flex justify-center">
              <Pitch formation={FORMATIONS[formation]} onCanvasReady={handleCanvasReady} />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
