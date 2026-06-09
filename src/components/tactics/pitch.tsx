"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as fabric from "fabric";
import { PitchSvg } from "./pitch-svg";
import type { FormationPosition } from "@/types";

const PLAYER_RADIUS = 20;

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
  const readyRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
      transparentCorners: false,
      backgroundColor: "transparent",
    });

    // 让 fabric 的 canvas-container 浮在 SVG 上层
    const container = containerRef.current;
    const wrapperDiv = container.querySelector(".canvas-container") as HTMLElement;
    if (wrapperDiv) {
      wrapperDiv.style.position = "absolute";
      wrapperDiv.style.top = "0";
      wrapperDiv.style.left = "0";
      wrapperDiv.style.zIndex = "10";
    }

    // 添加初始球员标记
    addPlayerMarkers(canvas, formation);

    fabricRef.current = canvas;
    readyRef.current = true;
    onCanvasReady?.(canvas);

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
    // 清除旧球员
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.FabricObject).get("data");
      return data?.type === "player";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
    // 添加新球员
    addPlayerMarkers(canvas, formation);
    canvas.renderAll();
  }, [formation, width, height]);

  return (
    <div
      ref={containerRef}
      className="relative inline-block rounded-xl overflow-hidden shadow-lg border-2 border-white/10"
      style={{ width, height }}
    >
      <PitchSvg width={width} height={height} />
      <canvas ref={canvasRef} />
    </div>
  );
}

function addPlayerMarkers(canvas: fabric.Canvas, positions: FormationPosition[]) {
  const w = canvas.getWidth();
  const h = canvas.getHeight();

  positions.forEach((pos, i) => {
    const x = (pos.x / 100) * w;
    const y = (pos.y / 100) * h;

    // 白色圆圈
    const circle = new fabric.Circle({
      radius: PLAYER_RADIUS,
      fill: "rgba(255,255,255,0.95)",
      stroke: "rgba(0,0,0,0.4)",
      strokeWidth: 2,
      originX: "center",
      originY: "center",
      shadow: new fabric.Shadow({
        color: "rgba(0,0,0,0.3)",
        blur: 5,
        offsetY: 2,
      }),
    });

    // 位置文字
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

    // 组合
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
