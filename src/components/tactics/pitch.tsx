"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as fabric from "fabric";
import { PitchSvg } from "./pitch-svg";
import type { FormationPosition } from "@/types";

interface PitchProps {
  formation: FormationPosition[];
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  width?: number;
  height?: number;
}

export function Pitch({
  formation,
  onCanvasReady,
  width = 600,
  height = 750,
}: PitchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
      transparentCorners: false,
      backgroundColor: "transparent",
    });

    // 确保 canvas 在 SVG 上层
    const wrapper = containerRef.current;
    const canvasEls = wrapper.querySelectorAll("canvas");
    canvasEls.forEach((el) => {
      el.style.position = "absolute";
      el.style.top = "0";
      el.style.left = "0";
      el.style.pointerEvents = "auto";
    });

    fabricRef.current = canvas;
    setReady(true);
    onCanvasReady?.(canvas);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 阵型变化时更新可拖拽的球员标记（SVG 已显示位置标签）
  useEffect(() => {
    if (!ready || !fabricRef.current) return;
    const canvas = fabricRef.current;
    // 清除旧的可拖拽球员
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return data?.type === "player";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
    // 添加可拖拽的透明标记（用于拖拽交互）
    formation.forEach((pos, i) => {
      const x = (pos.x / 100) * width;
      const y = (pos.y / 100) * height;
      const marker = new fabric.Circle({
        radius: 20,
        fill: "transparent",
        stroke: "transparent",
        originX: "center",
        originY: "center",
        hasControls: false,
        hasBorders: false,
      });
      marker.set({ left: x, top: y });
      marker.set("data", { type: "player", index: i, position: pos.position });
      canvas.add(marker);
    });
    canvas.renderAll();
  }, [formation, ready, width, height]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block rounded-xl overflow-hidden shadow-lg border-2 border-white/10"
      style={{ width, height }}
    >
      <PitchSvg width={width} height={height} positions={formation} />
      <canvas ref={canvasRef} />
    </div>
  );
}
