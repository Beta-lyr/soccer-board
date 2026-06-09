"use client";

import type { FormationPosition } from "@/types";

interface PitchSvgProps {
  width?: number;
  height?: number;
  className?: string;
  positions?: FormationPosition[];
}

export function PitchSvg({ width = 600, height = 750, className, positions }: PitchSvgProps) {
  const m = 30;
  const w = width;
  const h = height;
  const pw = w - m * 2;
  const ph = h - m * 2;
  const lw = 2;

  const penW = pw * 0.44;
  const penH = ph * 0.16;
  const goalW = pw * 0.22;
  const goalH = ph * 0.065;
  const centerR = pw * 0.16;
  const cornerR = 10;
  const cx = w / 2;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 草皮 */}
      <rect x="0" y="0" width={w} height={h} fill="#1a7a3a" rx="4" />

      {/* 草纹 */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="0" y={i * (h / 12)}
          width={w} height={h / 24}
          fill={i % 2 === 0 ? "rgba(255,255,255,0.03)" : "transparent"}
        />
      ))}

      {/* 边线 */}
      <rect x={m} y={m} width={pw} height={ph} fill="none" stroke="white" strokeWidth={lw} />

      {/* 中线 */}
      <line x1={m} y1={h / 2} x2={w - m} y2={h / 2} stroke="white" strokeWidth={lw} />

      {/* 中圈 */}
      <circle cx={cx} cy={h / 2} r={centerR} fill="none" stroke="white" strokeWidth={lw} />

      {/* 中点 */}
      <circle cx={cx} cy={h / 2} r={3} fill="white" />

      {/* 上禁区 */}
      <rect x={cx - penW / 2} y={m} width={penW} height={penH} fill="none" stroke="white" strokeWidth={lw} />
      <rect x={cx - goalW / 2} y={m} width={goalW} height={goalH} fill="none" stroke="white" strokeWidth={lw} />
      <circle cx={cx} cy={m + penH * 0.7} r={3} fill="white" />

      {/* 下禁区 */}
      <rect x={cx - penW / 2} y={h - m - penH} width={penW} height={penH} fill="none" stroke="white" strokeWidth={lw} />
      <rect x={cx - goalW / 2} y={h - m - goalH} width={goalW} height={goalH} fill="none" stroke="white" strokeWidth={lw} />
      <circle cx={cx} cy={h - m - penH * 0.7} r={3} fill="white" />

      {/* 角球弧 */}
      <path d={describeArc(m, m, cornerR, 0, 90)} fill="none" stroke="white" strokeWidth={lw} />
      <path d={describeArc(w - m, m, cornerR, 90, 180)} fill="none" stroke="white" strokeWidth={lw} />
      <path d={describeArc(m, h - m, cornerR, 270, 360)} fill="none" stroke="white" strokeWidth={lw} />
      <path d={describeArc(w - m, h - m, cornerR, 180, 270)} fill="none" stroke="white" strokeWidth={lw} />

      {/* 球员位置标记 */}
      {positions?.map((pos, i) => {
        const x = (pos.x / 100) * w;
        const y = (pos.y / 100) * h;
        return (
          <g key={`${pos.position}-${i}`}>
            <circle
              cx={x} cy={y} r={20}
              fill="rgba(255,255,255,0.92)"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={2}
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"
            />
            <text
              x={x} y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fontWeight="bold"
              fill="#1a1a1a"
              fontFamily="sans-serif"
            >
              {pos.position}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const start = { x: cx + radius * Math.cos(toRad(startAngle)), y: cy + radius * Math.sin(toRad(startAngle)) };
  const end = { x: cx + radius * Math.cos(toRad(endAngle)), y: cy + radius * Math.sin(toRad(endAngle)) };
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
