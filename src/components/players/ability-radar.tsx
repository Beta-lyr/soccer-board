"use client";

import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const data = (Object.keys(LABELS) as (keyof PlayerAbilities)[]).map((key) => ({
    subject: LABELS[key],
    value: mounted ? abilities[key] : 0,
    fullMark: 10,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          />
          <Radar
            name="能力"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.25}
            strokeWidth={2}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
