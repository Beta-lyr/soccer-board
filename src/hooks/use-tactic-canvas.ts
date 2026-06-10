import { useState, useRef, useCallback, useEffect } from "react";
import type { DrawMode } from "@/components/tactics/drawing-tools";
import type { Drawing, Point } from "@/lib/drawing-types";
import { renderAll, hitTest } from "@/lib/drawing-renderer";

function isDrawMode(mode: DrawMode): mode is Exclude<DrawMode, "select" | "move"> {
  return mode !== "select" && mode !== "move";
}

export function useTacticCanvas() {
  const [drawMode, setDrawMode] = useState<DrawMode>("select");
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 事件处理器通过 ref 读取当前状态，避免闭包陈旧
  const drawModeRef = useRef<DrawMode>("select");
  const drawingsRef = useRef<Drawing[]>([]);
  const isDrawingRef = useRef(false);
  const startRef = useRef<Point | null>(null);
  const selectedIdRef = useRef<string | null>(null);

  // 历史记录
  const historyRef = useRef<Drawing[][]>([[]]);
  const historyIdxRef = useRef(0);

  // 事件监听器引用（用于清理）
  const listenersRef = useRef<{ down: (e: PointerEvent) => void; up: (e: PointerEvent) => void } | null>(null);

  // 同步 state → ref
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { drawingsRef.current = drawings; }, [drawings]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // 每次 drawings 变化时重绘画布
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderAll(ctx, drawings, canvas.width, canvas.height, selectedId);
  }, [drawings, selectedId]);

  // ── 历史操作 ──

  const pushHistory = useCallback((newDrawings: Drawing[]) => {
    const idx = historyIdxRef.current;
    historyRef.current = historyRef.current.slice(0, idx + 1);
    historyRef.current.push(structuredClone(newDrawings));
    historyIdxRef.current = historyRef.current.length - 1;
  }, []);

  // ── 模式切换 ──

  const updateCanvasMode = useCallback((mode: DrawMode) => {
    setDrawMode(mode);
    drawModeRef.current = mode;
    // 选中模式外清除选中
    if (mode !== "select") {
      setSelectedId(null);
      selectedIdRef.current = null;
    }
  }, []);

  // ── 创建画线 ──

  const createDrawing = useCallback((canvas: HTMLCanvasElement, start: Point, end: Point) => {
    const mode = drawModeRef.current;
    if (!isDrawMode(mode)) return;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;

    const id = crypto.randomUUID();
    let newDrawing: Drawing;

    if (mode === "defend") {
      newDrawing = {
        id, type: "defend",
        topLeft: { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y) },
        bottomRight: { x: Math.max(start.x, end.x), y: Math.max(start.y, end.y) },
      };
    } else {
      newDrawing = { id, type: mode, start, end };
    }

    const updated = [...drawingsRef.current, newDrawing];
    setDrawings(updated);
    drawingsRef.current = updated;
    pushHistory(updated);
  }, [pushHistory]);

  // ── 初始化画布 ──

  const initCanvas = useCallback((width: number, height: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    // 避免重复注册
    if (listenersRef.current) {
      canvas.removeEventListener("pointerdown", listenersRef.current.down);
      canvas.removeEventListener("pointerup", listenersRef.current.up);
    }

    const getCanvasPoint = (e: PointerEvent): Point => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height),
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      const mode = drawModeRef.current;

      if (mode === "select") {
        // 碰撞检测，选中/取消选中
        const pt = getCanvasPoint(e);
        const hit = hitTest(pt, drawingsRef.current);
        const newId = hit?.id ?? null;
        setSelectedId(newId);
        selectedIdRef.current = newId;
        // 触发重绘
        const ctx = canvas.getContext("2d");
        if (ctx) renderAll(ctx, drawingsRef.current, canvas.width, canvas.height, newId);
        return;
      }

      if (!isDrawMode(mode)) return;

      startRef.current = getCanvasPoint(e);
      isDrawingRef.current = true;
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isDrawingRef.current || !startRef.current) {
        isDrawingRef.current = false;
        return;
      }
      isDrawingRef.current = false;

      const mode = drawModeRef.current;
      if (!isDrawMode(mode)) {
        startRef.current = null;
        return;
      }

      const end = getCanvasPoint(e);
      createDrawing(canvas, startRef.current, end);
      startRef.current = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    listenersRef.current = { down: onPointerDown, up: onPointerUp };
  }, [createDrawing]);

  // 加载保存的画线数据
  const loadDrawings = useCallback((data: Drawing[]) => {
    setDrawings(data);
    drawingsRef.current = data;
    historyRef.current = [structuredClone(data)];
    historyIdxRef.current = 0;
  }, []);

  // ── 撤销 / 重做 / 清除 / 删除 ──

  const handleUndo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx <= 0) return;
    const newIdx = idx - 1;
    historyIdxRef.current = newIdx;
    const d = structuredClone(historyRef.current[newIdx]);
    setDrawings(d);
    drawingsRef.current = d;
  }, []);

  const handleRedo = useCallback(() => {
    const idx = historyIdxRef.current;
    if (idx >= historyRef.current.length - 1) return;
    const newIdx = idx + 1;
    historyIdxRef.current = newIdx;
    const d = structuredClone(historyRef.current[newIdx]);
    setDrawings(d);
    drawingsRef.current = d;
  }, []);

  const handleClear = useCallback(() => {
    const updated: Drawing[] = [];
    setDrawings(updated);
    drawingsRef.current = updated;
    pushHistory(updated);
  }, [pushHistory]);

  const handleDeleteSelected = useCallback(() => {
    const id = selectedIdRef.current;
    if (!id) return;
    const updated = drawingsRef.current.filter((d) => d.id !== id);
    setDrawings(updated);
    drawingsRef.current = updated;
    setSelectedId(null);
    selectedIdRef.current = null;
    pushHistory(updated);
  }, [pushHistory]);

  return {
    drawMode,
    drawings,
    selectedId,
    canvasRef,
    updateCanvasMode,
    initCanvas,
    loadDrawings,
    handleUndo,
    handleRedo,
    handleClear,
    handleDeleteSelected,
  };
}
