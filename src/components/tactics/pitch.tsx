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
  const readyRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) {
      console.log("[Pitch] canvas or container ref is null");
      return;
    }

    console.log("[Pitch] Creating fabric.Canvas...");
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
      transparentCorners: false,
      backgroundColor: "transparent",
    });

    // Fabric.js 创建后会生成 wrapper div，需要让整个 wrapper 浮在 SVG 上
    const container = containerRef.current;
    // fabric.js 会把原始 canvas 包在一个 div 里
    const wrapperDiv = container.querySelector(".canvas-container") as HTMLElement;
    if (wrapperDiv) {
      console.log("[Pitch] Found fabric canvas-container, setting styles");
      wrapperDiv.style.position = "absolute";
      wrapperDiv.style.top = "0";
      wrapperDiv.style.left = "0";
      wrapperDiv.style.zIndex = "10";
    } else {
      console.log("[Pitch] No .canvas-container found, setting canvas styles directly");
      const canvasEls = container.querySelectorAll("canvas");
      canvasEls.forEach((el) => {
        el.style.position = "absolute";
        el.style.top = "0";
        el.style.left = "0";
      });
    }

    fabricRef.current = canvas;
    readyRef.current = true;
    setReady(true);
    console.log("[Pitch] Canvas ready, calling onCanvasReady");
    onCanvasReady?.(canvas);

    return () => {
      console.log("[Pitch] Disposing canvas");
      canvas.dispose();
      fabricRef.current = null;
      readyRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!readyRef.current || !fabricRef.current) return;
    const canvas = fabricRef.current;
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return data?.type === "player";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
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
  }, [formation, width, height]);

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
