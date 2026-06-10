"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import * as fabric from "fabric";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pitch } from "@/components/tactics/pitch";
import { FormationPicker } from "@/components/tactics/formation-picker";
import { DrawingTools } from "@/components/tactics/drawing-tools";
import { FORMATIONS, FORMATION_LIST, FORMATION_GROUPS, type TacticType } from "@/types";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { useTacticCanvas } from "@/hooks/use-tactic-canvas";
import { isDrawingArray, type Drawing } from "@/lib/drawing-types";
import { exportCompositePng } from "@/lib/export-composite";

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

const TACTIC_TYPES: { value: TacticType; key: string }[] = [
  { value: "open_play", key: "tactics.openPlay" },
  { value: "corner", key: "tactics.corner" },
  { value: "free_kick", key: "tactics.freeKick" },
  { value: "throw_in", key: "tactics.throwIn" },
];

const CANVAS_W = 600;
const CANVAS_H = 750;

function EditTacticContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [name, setName] = useState("");
  const [tacticType, setTacticType] = useState<TacticType>("open_play");
  const [playerCount, setPlayerCount] = useState<number>(11);
  const [formation, setFormation] = useState("4-4-2");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const drawingsLoadedRef = useRef(false);

  const {
    drawMode, drawings, selectedId, canvasRef: drawingCanvasRef,
    updateCanvasMode, initCanvas, loadDrawings, handleUndo, handleRedo, handleClear, handleDeleteSelected,
  } = useTacticCanvas();

  // 画线层初始化
  useEffect(() => {
    initCanvas(CANVAS_W, CANVAS_H);
  }, [initCanvas]);

  // 加载战术数据
  useEffect(() => {
    if (!id) return;
    db.tactics.get(id).then((tactic) => {
      if (tactic) {
        setName(tactic.name);
        setTacticType(tactic.type);
        setFormation(tactic.formation);
        // 兼容旧数据：如果是新格式 Drawing[] 则加载，否则忽略
        if (isDrawingArray(tactic.drawings)) {
          loadDrawings(tactic.drawings as Drawing[]);
        }
      }
      setLoading(false);
      drawingsLoadedRef.current = true;
    });
  }, [id, loadDrawings]);

  const handleExport = async () => {
    if (!fabricCanvasRef.current || !drawingCanvasRef.current) return;
    const svgEl = svgContainerRef.current?.querySelector("svg");
    if (!svgEl) return;
    try {
      const dataUrl = await exportCompositePng({
        svgElement: svgEl,
        fabricCanvas: fabricCanvasRef.current,
        drawingCanvas: drawingCanvasRef.current,
        width: CANVAS_W,
        height: CANVAS_H,
      });
      const link = document.createElement("a");
      link.download = `tactic_${name || "untitled"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Export failed:", e);
    }
  };

  const handleSave = async () => {
    if (!name || !id) { toast.error("请先输入战术名称"); return; }
    if (!fabricCanvasRef.current) return;
    setSaving(true);
    try {
      const canvas = fabricCanvasRef.current;
      const svgEl = svgContainerRef.current?.querySelector("svg");
      let thumbnail: string | undefined;
      if (svgEl && drawingCanvasRef.current) {
        thumbnail = await exportCompositePng({
          svgElement: svgEl,
          fabricCanvas: canvas,
          drawingCanvas: drawingCanvasRef.current,
          width: CANVAS_W,
          height: CANVAS_H,
          multiplier: 0.5,
        });
      }
      await db.tactics.update(id, {
        name, type: tacticType, formation,
        drawings, thumbnail,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t("tactics.saved"));
    } catch { toast.error("保存失败"); } finally { setSaving(false); }
  };

  if (loading) return <PageTransition><Header title="加载中..." /><div className="flex-1 p-6 text-center text-muted-foreground">加载中...</div></PageTransition>;

  return (
    <PageTransition>
      <Header
        title={`编辑: ${name}`}
        actions={
          <div className="flex gap-2">
            <Link href="/tactics/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
            </Link>
            <Button size="sm" onClick={handleSave} disabled={!name || saving}>
              <Save className="h-4 w-4 mr-1" />{saving ? "..." : t("common.save")}
            </Button>
          </div>
        }
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
            <div className="space-y-2"><Label>{t("tactics.formation")}</Label><FormationPicker value={formation} onChange={setFormation} playerCount={playerCount} onPlayerCountChange={setPlayerCount} /></div>
            <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
              <p className="font-medium text-sm">{t("tactics.tips")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipMove")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipRun")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipPass")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipDribble")}</p>
              <p className="text-muted-foreground">• {t("tactics.tipDefend")}</p>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-x-auto">
            <DrawingTools
              mode={drawMode}
              onModeChange={updateCanvasMode}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onClear={handleClear}
              onExport={handleExport}
              selectedId={selectedId}
              onDeleteSelected={handleDeleteSelected}
            />
            <div className="flex justify-center" ref={svgContainerRef}>
              <Pitch
                formation={FORMATIONS[formation]}
                drawMode={drawMode}
                drawingCanvasRef={drawingCanvasRef}
                onFabricReady={(c) => { fabricCanvasRef.current = c; }}
                width={CANVAS_W}
                height={CANVAS_H}
              />
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

export default function EditTacticPage() {
  return <Suspense fallback={<div className="flex-1 p-6 text-center text-muted-foreground">加载中...</div>}><EditTacticContent /></Suspense>;
}
