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
import { useI18n } from "@/lib/i18n";
import type { PlayerAbilities } from "@/types";

export function AbilityRadar({ abilities }: { abilities: PlayerAbilities }) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const LABELS: Record<keyof PlayerAbilities, string> = {
    speed: t("players.speed"),
    shooting: t("players.shooting"),
    passing: t("players.passing"),
    defending: t("players.defending"),
    stamina: t("players.stamina"),
    awareness: t("players.awareness"),
  };

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
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 10]}
            tickCount={6}
            tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
          />
          <Radar
            name="能力"
            dataKey="value"
            stroke="var(--primary)"
            fill="var(--primary)"
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
