"use client";

interface PitchSvgProps {
  width?: number;
  height?: number;
  className?: string;
}

export function PitchSvg({ width = 600, height = 750, className }: PitchSvgProps) {
  const m = 30; // 边距
  const w = width;
  const h = height;
  const pw = w - m * 2; // 场地宽
  const ph = h - m * 2; // 场地高
  const lw = 2; // 线宽

  // 禁区尺寸（按比例）
  const penW = pw * 0.44; // 罚球区宽
  const penH = ph * 0.16; // 罚球区高
  const goalW = pw * 0.22; // 球门区宽
  const goalH = ph * 0.065; // 球门区高
  const penArcR = penW * 0.31; // 罚球弧半径
  const centerR = pw * 0.16; // 中圈半径
  const cornerR = 10; // 角球弧半径

  const cx = w / 2; // 中心X

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 草皮背景 */}
      <rect x="0" y="0" width={w} height={h} fill="#1a7a3a" rx="4" />

      {/* 草纹条纹 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="0"
          y={i * (h / 12)}
          width={w}
          height={h / 24}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent"}
        />
      ))}

      {/* 场地边线 */}
      <rect
        x={m}
        y={m}
        width={pw}
        height={ph}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* 中线 */}
      <line x1={m} y1={h / 2} x2={w - m} y2={h / 2} stroke="white" strokeWidth={lw} />

      {/* 中圈 */}
      <circle
        cx={cx}
        cy={h / 2}
        r={centerR}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* 中点 */}
      <circle cx={cx} cy={h / 2} r={3} fill="white" />

      {/* ===== 上方（对方）禁区 ===== */}
      {/* 罚球区 */}
      <rect
        x={cx - penW / 2}
        y={m}
        width={penW}
        height={penH}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* 球门区 */}
      <rect
        x={cx - goalW / 2}
        y={m}
        width={goalW}
        height={goalH}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* 罚球点 */}
      <circle cx={cx} cy={m + penH * 0.7} r={3} fill="white" />

      {/* 罚球弧 */}
      <path
        d={describeArc(cx, m + penH, penArcR, -55, 55)}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* ===== 下方（己方）禁区 ===== */}
      <rect
        x={cx - penW / 2}
        y={h - m - penH}
        width={penW}
        height={penH}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      <rect
        x={cx - goalW / 2}
        y={h - m - goalH}
        width={goalW}
        height={goalH}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      <circle cx={cx} cy={h - m - penH * 0.7} r={3} fill="white" />

      <path
        d={describeArc(cx, h - m - penH, penArcR, 125, 235)}
        fill="none"
        stroke="white"
        strokeWidth={lw}
      />

      {/* 角球弧 */}
      {/* 左上 */}
      <path d={describeArc(m, m, cornerR, 0, 90)} fill="none" stroke="white" strokeWidth={lw} />
      {/* 右上 */}
      <path d={describeArc(w - m, m, cornerR, 90, 180)} fill="none" stroke="white" strokeWidth={lw} />
      {/* 左下 */}
      <path d={describeArc(m, h - m, cornerR, 270, 360)} fill="none" stroke="white" strokeWidth={lw} />
      {/* 右下 */}
      <path d={describeArc(w - m, h - m, cornerR, 180, 270)} fill="none" stroke="white" strokeWidth={lw} />
    </svg>
  );
}

/** 生成 SVG 弧线 path */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const start = {
    x: cx + radius * Math.cos(toRad(startAngle)),
    y: cy + radius * Math.sin(toRad(startAngle)),
  };
  const end = {
    x: cx + radius * Math.cos(toRad(endAngle)),
    y: cy + radius * Math.sin(toRad(endAngle)),
  };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
