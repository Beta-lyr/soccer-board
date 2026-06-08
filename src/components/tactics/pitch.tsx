"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as fabric from "fabric";
import type { FormationPosition } from "@/types";

const PITCH_COLOR = "#2d8a4e";
const LINE_COLOR = "#ffffff";
const PLAYER_RADIUS = 18;

interface PitchProps {
  formation: FormationPosition[];
  onCanvasReady?: (canvas: fabric.Canvas) => void;
  width?: number;
  height?: number;
}

export function Pitch({ formation, onCanvasReady, width = 600, height = 750 }: PitchProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [ready, setReady] = useState(false);

  const drawPitch = useCallback((canvas: fabric.Canvas) => {
    const w = width;
    const h = height;
    const lw = 2;

    // 背景
    const bg = new fabric.Rect({
      left: 0, top: 0, width: w, height: h,
      fill: PITCH_COLOR, selectable: false, evented: false,
    });
    canvas.add(bg);

    // 边线
    const margin = 30;
    const border = new fabric.Rect({
      left: margin, top: margin,
      width: w - margin * 2, height: h - margin * 2,
      fill: "transparent", stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    });
    canvas.add(border);

    // 中线
    const midY = h / 2;
    canvas.add(new fabric.Line([margin, midY, w - margin, midY], {
      stroke: LINE_COLOR, strokeWidth: lw, selectable: false, evented: false,
    }));

    // 中圈
    canvas.add(new fabric.Circle({
      left: w / 2 - 50, top: midY - 50,
      radius: 50, fill: "transparent",
      stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
      originX: "center", originY: "center",
      scaleX: 1, scaleY: 1,
    }));
    // 中圈用 left/top 表示圆心
    const centerCircle = new fabric.Circle({
      radius: 50, fill: "transparent",
      stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    });
    centerCircle.set({ left: w / 2, top: midY, originX: "center", originY: "center" });
    canvas.add(centerCircle);

    // 中点
    const centerDot = new fabric.Circle({
      radius: 4, fill: LINE_COLOR,
      selectable: false, evented: false,
    });
    centerDot.set({ left: w / 2, top: midY, originX: "center", originY: "center" });
    canvas.add(centerDot);

    // 上禁区 (对方)
    const boxW = 320;
    const boxH = 120;
    canvas.add(new fabric.Rect({
      left: (w - boxW) / 2, top: margin,
      width: boxW, height: boxH,
      fill: "transparent", stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    }));

    // 上小禁区
    const smallBoxW = 160;
    const smallBoxH = 50;
    canvas.add(new fabric.Rect({
      left: (w - smallBoxW) / 2, top: margin,
      width: smallBoxW, height: smallBoxH,
      fill: "transparent", stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    }));

    // 下禁区 (己方)
    canvas.add(new fabric.Rect({
      left: (w - boxW) / 2, top: h - margin - boxH,
      width: boxW, height: boxH,
      fill: "transparent", stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    }));

    // 下小禁区
    canvas.add(new fabric.Rect({
      left: (w - smallBoxW) / 2, top: h - margin - smallBoxH,
      width: smallBoxW, height: smallBoxH,
      fill: "transparent", stroke: LINE_COLOR, strokeWidth: lw,
      selectable: false, evented: false,
    }));

    // 上弧 (罚球弧)
    const penaltyArcTop = new fabric.Circle({
      radius: 50, fill: "transparent",
      stroke: LINE_COLOR, strokeWidth: lw,
      startAngle: 0, endAngle: Math.PI,
      selectable: false, evented: false,
    });
    penaltyArcTop.set({
      left: w / 2, top: margin + boxH,
      originX: "center", originY: "center",
      clipPath: new fabric.Rect({
        left: -55, top: 0, width: 110, height: 55,
        absolutePositioned: true,
      }),
    });
    canvas.add(penaltyArcTop);

    // 下弧
    const penaltyArcBottom = new fabric.Circle({
      radius: 50, fill: "transparent",
      stroke: LINE_COLOR, strokeWidth: lw,
      startAngle: Math.PI, endAngle: Math.PI * 2,
      selectable: false, evented: false,
    });
    penaltyArcBottom.set({
      left: w / 2, top: h - margin - boxH,
      originX: "center", originY: "center",
    });
    canvas.add(penaltyArcBottom);

    // 角球弧
    const cornerR = 12;
    const corners = [
      { x: margin, y: margin, sa: Math.PI * 1.5, ea: Math.PI * 2 },
      { x: w - margin, y: margin, sa: Math.PI, ea: Math.PI * 1.5 },
      { x: margin, y: h - margin, sa: 0, ea: Math.PI * 0.5 },
      { x: w - margin, y: h - margin, sa: Math.PI * 0.5, ea: Math.PI },
    ];
    corners.forEach(({ x, y, sa, ea }) => {
      const arc = new fabric.Circle({
        radius: cornerR, fill: "transparent",
        stroke: LINE_COLOR, strokeWidth: lw,
        startAngle: sa, endAngle: ea,
        selectable: false, evented: false,
      });
      arc.set({ left: x, top: y, originX: "center", originY: "center" });
      canvas.add(arc);
    });
  }, [width, height]);

  const addPlayers = useCallback((canvas: fabric.Canvas, positions: FormationPosition[]) => {
    positions.forEach((pos, i) => {
      const x = (pos.x / 100) * width;
      const y = (pos.y / 100) * height;

      // 球员圆圈
      const circle = new fabric.Circle({
        radius: PLAYER_RADIUS,
        fill: "#ffffff",
        stroke: "#1a1a1a",
        strokeWidth: 2,
        originX: "center",
        originY: "center",
      });

      // 球员位置标签
      const text = new fabric.Text(pos.position, {
        fontSize: 11,
        fontWeight: "bold",
        fill: "#1a1a1a",
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
  }, [width, height]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      selection: false,
    });

    fabricRef.current = canvas;
    drawPitch(canvas);
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
    // 清除旧球员（保留背景和线）
    const toRemove = canvas.getObjects().filter((obj) => {
      const data = (obj as fabric.Group).get("data");
      return data?.type === "player";
    });
    toRemove.forEach((obj) => canvas.remove(obj));
    addPlayers(canvas, formation);
    canvas.renderAll();
  }, [formation, ready, addPlayers]);

  return (
    <div className="border rounded-lg overflow-hidden bg-[#2d8a4e] inline-block">
      <canvas ref={canvasRef} />
    </div>
  );
}
