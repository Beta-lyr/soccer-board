"use client";

import { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { PitchSvg } from "./pitch-svg";
import type { FormationPosition } from "@/types";
import type { DrawMode } from "./drawing-tools";

const PLAYER_RADIUS = 20;

interface PitchProps {
  formation: FormationPosition[];
  drawMode: DrawMode;
  /** 画线层 canvas ref（由 useTacticCanvas 管理） */
  drawingCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Fabric canvas 就绪回调（用于保存时获取球员位置） */
  onFabricReady?: (fabricCanvas: fabric.Canvas) => void;
  width?: number;
  height?: number;
}

export function Pitch({
  formation,
  drawMode,
  drawingCanvasRef,
  onFabricReady,
  width = 600,
  height = 750,
}: PitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const readyRef = useRef(false);

  // 初始化 Fabric canvas（仅球员层）
  useEffect(() => {
    if (!fabricCanvasElRef.current) return;

    const canvas = new fabric.Canvas(fabricCanvasElRef.current, {
      width,
      height,
      selection: false,
      transparentCorners: false,
      backgroundColor: "transparent",
    });

    // 定位 fabric 的 canvas-container
    const container = containerRef.current;
    const wrapperDiv = container?.querySelector(".canvas-container") as HTMLElement;
    if (wrapperDiv) {
      wrapperDiv.style.position = "absolute";
      wrapperDiv.style.top = "0";
      wrapperDiv.style.left = "0";
      wrapperDiv.style.zIndex = "10";
    }

    addPlayerMarkers(canvas, formation);
    fabricRef.current = canvas;
    readyRef.current = true;
    onFabricReady?.(canvas);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
      readyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 阵型变化时更新球员标记
  useEffect(() => {
    if (!readyRef.current || !fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.getObjects().forEach((obj) => {
      if ((obj as fabric.FabricObject).get("data")?.type === "player") {
        canvas.remove(obj);
      }
    });
    addPlayerMarkers(canvas, formation);
    canvas.renderAll();
  }, [formation, width, height]);

  // 模式切换：控制 Fabric 球员可交互性
  useEffect(() => {
    if (!readyRef.current || !fabricRef.current) return;
    const canvas = fabricRef.current;
    canvas.selection = false;
    canvas.getObjects().forEach((obj) => {
      if ((obj as fabric.FabricObject).get("data")?.type === "player") {
        obj.selectable = drawMode === "move";
        obj.evented = drawMode === "move";
        obj.lockMovementX = drawMode !== "move";
        obj.lockMovementY = drawMode !== "move";
      }
    });
    canvas.renderAll();
  }, [drawMode]);

  // 画线层 pointer-events：select/画线模式拦截事件，move 模式穿透到 fabric
  const drawingPointerEvents = drawMode === "move" ? "none" : "auto";

  return (
    <div
      ref={containerRef}
      className="relative inline-block rounded-xl overflow-hidden shadow-lg border-2 border-white/10"
      style={{ width, height }}
    >
      {/* Layer 0: SVG 球场 */}
      <PitchSvg width={width} height={height} />

      {/* Layer 1: Fabric.js 球员层 */}
      <canvas ref={fabricCanvasElRef} />

      {/* Layer 2: Canvas2D 画线层 */}
      <canvas
        ref={drawingCanvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 20,
          pointerEvents: drawingPointerEvents,
          touchAction: "none",
        }}
      />
    </div>
  );
}

function addPlayerMarkers(canvas: fabric.Canvas, positions: FormationPosition[]) {
  const w = canvas.getWidth();
  const h = canvas.getHeight();

  positions.forEach((pos, i) => {
    const x = (pos.x / 100) * w;
    const y = (pos.y / 100) * h;

    const circle = new fabric.Circle({
      radius: PLAYER_RADIUS,
      fill: "rgba(255,255,255,0.95)",
      stroke: "rgba(0,0,0,0.4)",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
      shadow: new fabric.Shadow({ color: "rgba(0,0,0,0.3)", blur: 5, offsetY: 2 }),
    });

    const text = new fabric.Text(pos.position, {
      fontSize: 12,
      fontWeight: "bold",
      fill: "#1a1a1a",
      originX: "center",
      originY: "center",
      fontFamily: "sans-serif",
      selectable: false,
      evented: false,
    });

    const group = new fabric.Group([circle, text], {
      left: x,
      top: y,
      originX: "center",
      originY: "center",
      hasControls: false,
      hasBorders: false,
    });

    group.set("data", { type: "player", index: i, position: pos.position });
    canvas.add(group);
  });
}
