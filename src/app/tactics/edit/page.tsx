"use client";

import { Suspense, useState, useRef, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as fabric from "fabric";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pitch } from "@/components/tactics/pitch";
import { FormationPicker } from "@/components/tactics/formation-picker";
import { DrawingTools, type DrawMode } from "@/components/tactics/drawing-tools";
import { FORMATIONS, FORMATION_LIST, type TacticType } from "@/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

if (typeof window !== "undefined") {
  try {
    const customs = JSON.parse(localStorage.getItem("customFormations") || "{}");
    Object.entries(customs).forEach(([name, positions]) => {
      if (!FORMATIONS[name]) {
        FORMATIONS[name] = positions as typeof FORMATIONS[string];
        if (!FORMATION_LIST.includes(name)) FORMATION_LIST.push(name);
      }
    });
  } catch {}
}

function EditTacticContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [name, setName] = useState("");
  const [tacticType, setTacticType] = useState<TacticType>("open_play");
  const [formation, setFormation] = useState("4-4-2");
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const drawModeRef = useRef<DrawMode>("select");
  const isDrawingRef = useRef(false);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [saving, setSaving] = useState(false);
  const eventsRegisteredRef = useRef(false);
  const savedDrawingsRef = useRef<unknown>(null);

  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);

  useEffect(() => {
    if (!id) return;
    db.tactics.get(id).then((tactic) => {
      if (tactic) {
        setName(tactic.name);
        setTacticType(tactic.type);
        setFormation(tactic.formation);
        savedDrawingsRef.current = tactic.drawings;
      }
      setLoading(false);
    });
  }, [id]);

  const saveToHistory = useCallback(() => {
    if (!canvasRef.current) return;
    try {
      const json = JSON.stringify(canvasRef.current.toObject());
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
      historyRef.current.push(json);
      historyIndexRef.current = historyRef.current.length - 1;
    } catch {}
  }, []);

  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
    if (savedDrawingsRef.current) {
      canvas.loadFromJSON(savedDrawingsRef.current).then(() => { canvas.renderAll(); saveToHistory(); });
    } else {
      saveToHistory();
    }

    if (eventsRegisteredRef.current) return;
    eventsRegisteredRef.current = true;

    canvas.on("mouse:down", (opt: fabric.TPointerEventInfo) => {
      const mode = drawModeRef.current;
      if (mode === "select" || mode === "move") return;
      const pointer = canvas.getScenePoint(opt.e);
      drawStartRef.current = { x: pointer.x, y: pointer.y };
      isDrawingRef.current = true;
    });

    canvas.on("mouse:up", (opt: fabric.TPointerEventInfo) => {
      const mode = drawModeRef.current;
      if (!isDrawingRef.current || !drawStartRef.current) { isDrawingRef.current = false; return; }
      if (mode === "select" || mode === "move") { drawStartRef.current = null; isDrawingRef.current = false; return; }

      const pointer = canvas.getScenePoint(opt.e);
      const start = drawStartRef.current;
      const dx = pointer.x - start.x;
      const dy = pointer.y - start.y;
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) { drawStartRef.current = null; isDrawingRef.current = false; return; }

      if (mode === "run") {
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], { stroke: "#ffffff", strokeWidth: 3, strokeDashArray: [10, 5], selectable: true, evented: true });
        path.set("data", { type: "drawing" }); canvas.add(path);
      } else if (mode === "pass") {
        const line = new fabric.Line([start.x, start.y, pointer.x, pointer.y], { stroke: "#facc15", strokeWidth: 3, selectable: true, evented: true });
        line.set("data", { type: "drawing" }); canvas.add(line);
        const angle = Math.atan2(dy, dx);
        const arrow = new fabric.Triangle({ left: pointer.x, top: pointer.y, width: 14, height: 14, fill: "#facc15", angle: (angle * 180) / Math.PI + 90, originX: "center", originY: "center", selectable: false, evented: false });
        arrow.set("data", { type: "drawing" }); canvas.add(arrow);
      } else if (mode === "dribble") {
        const path = new fabric.Line([start.x, start.y, pointer.x, pointer.y], { stroke: "#38bdf8", strokeWidth: 4, selectable: true, evented: true });
        path.set("data", { type: "drawing" }); canvas.add(path);
      } else if (mode === "defend") {
        const rect = new fabric.Rect({ left: Math.min(start.x, pointer.x), top: Math.min(start.y, pointer.y), width: Math.abs(dx), height: Math.abs(dy), fill: "rgba(239, 68, 68, 0.15)", stroke: "rgba(239, 68, 68, 0.5)", strokeWidth: 1, selectable: true, evented: true });
        rect.set("data", { type: "drawing" }); canvas.add(rect);
      }

      drawStartRef.current = null;
      isDrawingRef.current = false;
      canvas.renderAll();
      saveToHistory();
    });
  }, [saveToHistory]);

  const updateCanvasMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode); drawModeRef.current = mode;
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.selection = mode === "select";
    canvas.getObjects().forEach((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      if (data?.type === "drawing") { obj.selectable = mode === "select"; obj.evented = mode === "select"; }
    });
    canvas.renderAll();
  }, []);

  const handleUndo = () => { if (historyIndexRef.current <= 0 || !canvasRef.current) return; historyIndexRef.current--; canvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvasRef.current?.renderAll()); };
  const handleRedo = () => { if (historyIndexRef.current >= historyRef.current.length - 1 || !canvasRef.current) return; historyIndexRef.current++; canvasRef.current.loadFromJSON(historyRef.current[historyIndexRef.current]).then(() => canvasRef.current?.renderAll()); };
  const handleClear = () => { if (!canvasRef.current) return; canvasRef.current.getObjects().filter((obj) => (obj as fabric.FabricObject).get("data")?.type === "drawing").forEach((obj) => canvasRef.current!.remove(obj)); canvasRef.current.renderAll(); saveToHistory(); };
  const handleExport = () => { if (!canvasRef.current) return; const link = document.createElement("a"); link.download = `tactic_${name || "untitled"}.png`; link.href = canvasRef.current.toDataURL({ format: "png", multiplier: 2 }); link.click(); };

  const handleSave = async () => {
    if (!name || !id) { toast.error("请先输入战术名称"); return; }
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const thumbnail = canvas.toDataURL({ format: "png", multiplier: 0.5 });
      await db.tactics.update(id, { name, type: tacticType, formation, drawings: canvas.toObject(), thumbnail, updatedAt: new Date().toISOString() });
      toast.success("已保存");
    } catch { toast.error("保存失败"); } finally { setSaving(false); }
  };

  const TACTIC_TYPES: { value: TacticType; key: string }[] = [
    { value: "open_play", key: "tactics.openPlay" },
    { value: "corner", key: "tactics.corner" },
    { value: "free_kick", key: "tactics.freeKick" },
    { value: "throw_in", key: "tactics.throwIn" },
  ];

  if (loading) return <PageTransition><Header title="加载中..." /><div className="flex-1 p-6 text-center text-muted-foreground">加载中...</div></PageTransition>;

  return (
    <PageTransition>
      <Header
        title={`编辑: ${name}`}
        actions={<Link href="/tactics/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button></Link>}
      />
      <div className="flex-1 p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          <div className="w-full lg:w-56 space-y-4 shrink-0">
            <div className="space-y-2"><Label>{t("tactics.tacticName")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{t("tactics.tacticType")}</Label>
              <Select value={tacticType} onValueChange={(v) => v && setTacticType(v as TacticType)}>
                <SelectTrigger><SelectValue>{TACTIC_TYPES.find((tt) => tt.value === tacticType) ? t(TACTIC_TYPES.find((tt) => tt.value === tacticType)!.key) : tacticType}</SelectValue></SelectTrigger>
                <SelectContent>{TACTIC_TYPES.map((tt) => <SelectItem key={tt.value} value={tt.value}>{t(tt.key)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>{t("tactics.formation")}</Label><FormationPicker value={formation} onChange={setFormation} /></div>
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <p className="font-medium text-sm">{t("tactics.tips")}</p>
              <p className="text-muted-foreground">• 选择模式：点击选中画线</p>
              <p className="text-muted-foreground">• 拖拽模式：拖动元素</p>
              <p className="text-muted-foreground">• 跑位/传球/带球/防守：拖拽画线</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-x-auto">
            <DrawingTools mode={drawMode} onModeChange={updateCanvasMode} onUndo={handleUndo} onRedo={handleRedo} onClear={handleClear} onExport={handleExport} onSave={handleSave} />
            <div className="flex justify-center"><Pitch formation={FORMATIONS[formation]} onCanvasReady={handleCanvasReady} /></div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function EditTacticPage() {
  return <Suspense fallback={<div className="flex-1 p-6 text-center text-muted-foreground">加载中...</div>}><EditTacticContent /></Suspense>;
}
