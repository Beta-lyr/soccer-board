"use client";

import { useState, useRef, useCallback } from "react";
import * as fabric from "fabric";
import { Header } from "@/components/layout/header";
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

const TACTIC_TYPES: { value: TacticType; label: string }[] = [
  { value: "open_play", label: "进攻战术" },
  { value: "corner", label: "角球" },
  { value: "free_kick", label: "任意球" },
  { value: "throw_in", label: "界外球" },
];

export default function NewTacticPage() {
  const [name, setName] = useState("");
  const [tacticType, setTacticType] = useState<TacticType>("open_play");
  const [formation, setFormation] = useState("4-4-2");
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);

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
        // 虚线曲线 (跑位)
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#ffffff",
          strokeWidth: 3,
          strokeDashArray: [8, 4],
          selectable: true,
          evented: true,
        });
        path.set("data", { type: "drawing" });
        canvas.add(path);
      } else if (drawMode === "pass") {
        // 实线箭头 (传球)
        const line = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#ffcc00",
          strokeWidth: 3,
          selectable: true,
          evented: true,
        });
        line.set("data", { type: "drawing" });
        canvas.add(line);

        // 箭头
        const angle = Math.atan2(pointer.y - start.y, pointer.x - start.x);
        const arrowSize = 12;
        const arrow = new fabric.Triangle({
          left: pointer.x,
          top: pointer.y,
          width: arrowSize,
          height: arrowSize,
          fill: "#ffcc00",
          angle: (angle * 180) / Math.PI + 90,
          originX: "center",
          originY: "center",
          selectable: false,
          evented: false,
        });
        arrow.set("data", { type: "drawing" });
        canvas.add(arrow);
      } else if (drawMode === "dribble") {
        // 带球路线 (粗实线)
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], {
          stroke: "#00ccff",
          strokeWidth: 4,
          selectable: true,
          evented: true,
        });
        path.set("data", { type: "drawing" });
        canvas.add(path);
      } else if (drawMode === "defend") {
        // 防守区域 (半透明矩形)
        const left = Math.min(start.x, pointer.x);
        const top = Math.min(start.y, pointer.y);
        const width = Math.abs(pointer.x - start.x);
        const height = Math.abs(pointer.y - start.y);
        const rect = new fabric.Rect({
          left, top, width, height,
          fill: "rgba(255, 0, 0, 0.15)",
          stroke: "rgba(255, 0, 0, 0.5)",
          strokeWidth: 1,
          selectable: true,
          evented: true,
        });
        rect.set("data", { type: "drawing" });
        canvas.add(rect);
      }

      drawStartRef.current = null;
      setIsDrawing(false);
      saveToHistory();
    });
  }, [drawMode, isDrawing, saveToHistory]);

  // 更新 canvas 的 drawing mode
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
    const json = historyRef.current[historyIndexRef.current];
    canvasRef.current.loadFromJSON(json).then(() => canvasRef.current?.renderAll());
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1 || !canvasRef.current) return;
    historyIndexRef.current++;
    const json = historyRef.current[historyIndexRef.current];
    canvasRef.current.loadFromJSON(json).then(() => canvasRef.current?.renderAll());
  };

  const handleClear = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return data?.type === "drawing";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
    canvas.renderAll();
    saveToHistory();
  };

  const handleExport = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL({ format: "png", multiplier: 2 });
    const link = document.createElement("a");
    link.download = `战术_${name || "未命名"}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleSave = async () => {
    if (!canvasRef.current || !name) return;
    const canvas = canvasRef.current;
    const positions = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return data?.type === "player";
    }).map((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return {
        playerId: "",
        x: ((obj.left ?? 0) / 600) * 100,
        y: ((obj.top ?? 0) / 750) * 100,
        label: data?.position,
      };
    });

    const thumbnail = canvas.toDataURL({ format: "png", multiplier: 0.5 });

    await db.tactics.add({
      id: crypto.randomUUID(),
      name,
      type: tacticType,
      formation,
      players: positions,
      drawings: canvas.toObject(),
      thumbnail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    alert("战术已保存！");
  };

  return (
    <>
      <Header
        title="新建战术"
        actions={
          <Link href="/tactics/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-1" />
              返回
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左侧：设置 */}
          <div className="w-full lg:w-64 space-y-4">
            <div className="space-y-2">
              <Label>战术名称</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入战术名称"
              />
            </div>

            <div className="space-y-2">
              <Label>战术类型</Label>
              <Select value={tacticType} onValueChange={(v) => v && setTacticType(v as TacticType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TACTIC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>阵型</Label>
              <FormationPicker
                value={formation}
                onChange={setFormation}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p className="font-medium">操作提示</p>
              <p className="text-muted-foreground">• 拖拽模式：拖动球员位置</p>
              <p className="text-muted-foreground">• 跑位：虚线表示跑位路线</p>
              <p className="text-muted-foreground">• 传球：黄色箭头表示传球</p>
              <p className="text-muted-foreground">• 带球：蓝色实线表示带球</p>
              <p className="text-muted-foreground">• 防守：红色半透明区域</p>
            </div>
          </div>

          {/* 右侧：画板 */}
          <div className="flex-1 space-y-3">
            <DrawingTools
              mode={drawMode}
              onModeChange={updateCanvasMode}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onExport={handleExport}
              onSave={handleSave}
            />
            <Pitch
              formation={FORMATIONS[formation]}
              onCanvasReady={handleCanvasReady}
            />
          </div>
        </div>
      </div>
    </>
  );
}
