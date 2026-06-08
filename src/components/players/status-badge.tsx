"use client";

import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import type { PlayerStatus } from "@/types";

const STATUS_KEYS: Record<PlayerStatus, { key: string; className: string }> = {
  healthy: { key: "players.healthy", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  minor_injury: { key: "players.minorInjury", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  injured: { key: "players.injured", className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20" },
  leave: { key: "players.leave", className: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20" },
};

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const { t } = useI18n();
  const { key, className } = STATUS_KEYS[status];
  return (
    <Badge variant="outline" className={className}>
      {t(key)}
    </Badge>
  );
}
