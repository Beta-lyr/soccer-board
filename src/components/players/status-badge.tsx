import { Badge } from "@/components/ui/badge";
import type { PlayerStatus } from "@/types";

const STATUS_MAP: Record<PlayerStatus, { label: string; className: string }> = {
  healthy: {
    label: "健康",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  minor_injury: {
    label: "轻伤",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  injured: {
    label: "伤病",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  },
  leave: {
    label: "请假",
    className: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/20",
  },
};

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const { label, className } = STATUS_MAP[status];
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
