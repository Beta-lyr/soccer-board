"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as fabric from "fabric";
import { PitchSvg } from "./pitch-svg";
import type { FormationPosition } from "@/types";

const PLAYER_RADIUS = 18;

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

  const addPlayers = useCallback(
    (canvas: fabric.Canvas, positions: FormationPosition[]) => {
      positions.forEach((pos, i) => {
        const x = (pos.x / 100) * width;
        const y = (pos.y / 100) * height;

        const circle = new fabric.Circle({
          radius: PLAYER_RADIUS,
          fill: "rgba(255,255,255,0.95)",
          stroke: "#166534",
          strokeWidth: 2.5,
          originX: "center",
          originY: "center",
          shadow: new fabric.Shadow({
            color: "rgba(0,0,0,0.3)",
            blur: 4,
            offsetY: 2,
          }),
        });

        const text = new fabric.Text(pos.position, {
          fontSize: 11,
          fontWeight: "bold",
          fill: "#166534",
          originX: "center",
          originY: "center",
          fontFamily: "sans-serif",
        });

        const group = new fabric.Group([circle, text], {
          left: x,
          top: y,
          originX: "center",
          originY: "center",
          hasControls: false,
        });

        group.set("data", { type: "player", index: i, position: pos.position });
        canvas.add(group);
      });
    },
    [width, height]
  );

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
      transparentCorners: false,
    });

    // 让 canvas 浮在 SVG 上层
    const container = containerRef.current;
    const canvasEl = container.querySelector("canvas");
    if (canvasEl) {
      canvasEl.style.position = "absolute";
      canvasEl.style.top = "0";
      canvasEl.style.left = "0";
    }

    fabricRef.current = canvas;
    addPlayers(canvas, formation);
    setReady(true);
    onCanvasReady?.(canvas);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !fabricRef.current) return;
    const canvas = fabricRef.current;
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.Group).get("data");
      return data?.type === "player";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
    addPlayers(canvas, formation);
    canvas.renderAll();
  }, [formation, ready, addPlayers]);

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
