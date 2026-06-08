"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { PlayerAbilities } from "@/types";

const LABELS: Record<keyof PlayerAbilities, string> = {
  speed: "速度",
  shooting: "射门",
  passing: "传球",
  defending: "防守",
  stamina: "体能",
  awareness: "意识",
};

export function AbilityRadar({ abilities }: { abilities: PlayerAbilities }) {
  const data = (Object.keys(LABELS) as (keyof PlayerAbilities)[]).map((key) => ({
    subject: LABELS[key],
    value: abilities[key],
    fullMark: 10,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fontSize: 10 }} />
        <Radar
          name="能力"
          dataKey="value"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.3}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
