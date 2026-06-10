import type { Drawing, Point } from "./drawing-types";

// ── 样式配置 ──

const STYLES = {
  run:     { stroke: "#ffffff", lineWidth: 3, dash: [10, 5] as number[] },
  pass:    { stroke: "#facc15", lineWidth: 3, dash: [] as number[] },
  dribble: { stroke: "#38bdf8", lineWidth: 4, dash: [] as number[] },
  defend:  {
    fill: "rgba(239, 68, 68, 0.15)",
    stroke: "rgba(239, 68, 68, 0.5)",
    lineWidth: 1,
  },
} as const;

const SELECT_HIGHLIGHT = "rgba(255, 255, 255, 0.4)";

// ── 渲染 ──

export function renderAll(
  ctx: CanvasRenderingContext2D,
  drawings: Drawing[],
  width: number,
  height: number,
  selectedId?: string | null,
) {
  ctx.clearRect(0, 0, width, height);

  for (const d of drawings) {
    const isSelected = d.id === selectedId;

    if (d.type === "defend") {
      drawDefendRect(ctx, d.topLeft, d.bottomRight, isSelected);
    } else {
      drawLine(ctx, d.start, d.end, d.type, isSelected);
      if (d.type === "pass") {
        drawArrowhead(ctx, d.start, d.end, isSelected);
      }
    }
  }
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  type: "run" | "pass" | "dribble",
  isSelected: boolean,
) {
  const style = STYLES[type];
  ctx.save();
  ctx.strokeStyle = style.stroke;
  ctx.lineWidth = style.lineWidth;
  ctx.lineCap = "round";
  ctx.setLineDash(style.dash);

  // 选中高亮：画一条更宽的半透明线
  if (isSelected) {
    ctx.strokeStyle = SELECT_HIGHLIGHT;
    ctx.lineWidth = style.lineWidth + 6;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    // 恢复原样式再画一次
    ctx.strokeStyle = style.stroke;
    ctx.lineWidth = style.lineWidth;
    ctx.setLineDash(style.dash);
  }

  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  ctx.restore();
}

function drawArrowhead(
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  isSelected: boolean,
) {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headLen = 14;

  ctx.save();
  ctx.fillStyle = isSelected ? SELECT_HIGHLIGHT : "#facc15";
  ctx.translate(end.x, end.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-headLen, -headLen / 2);
  ctx.lineTo(-headLen, headLen / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawDefendRect(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  bottomRight: Point,
  isSelected: boolean,
) {
  const x = Math.min(topLeft.x, bottomRight.x);
  const y = Math.min(topLeft.y, bottomRight.y);
  const w = Math.abs(bottomRight.x - topLeft.x);
  const h = Math.abs(bottomRight.y - topLeft.y);

  ctx.save();
  if (isSelected) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  }
  ctx.fillStyle = STYLES.defend.fill;
  ctx.strokeStyle = STYLES.defend.stroke;
  ctx.lineWidth = STYLES.defend.lineWidth;
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// ── 碰撞检测 ──

export function hitTest(
  point: Point,
  drawings: Drawing[],
  threshold = 10,
): Drawing | null {
  // 从后往前遍历（后绘制的在上层）
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    if (d.type === "defend") {
      if (pointInRect(point, d.topLeft, d.bottomRight)) return d;
    } else {
      if (pointToSegmentDist(point, d.start, d.end) < threshold) return d;
    }
  }
  return null;
}

function pointToSegmentDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return Math.hypot(p.x - projX, p.y - projY);
}

function pointInRect(p: Point, topLeft: Point, bottomRight: Point): boolean {
  const x = Math.min(topLeft.x, bottomRight.x);
  const y = Math.min(topLeft.y, bottomRight.y);
  const w = Math.abs(bottomRight.x - topLeft.x);
  const h = Math.abs(bottomRight.y - topLeft.y);
  return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
}
