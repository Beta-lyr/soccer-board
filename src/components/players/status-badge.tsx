import { Badge } from "@/components/ui/badge";
import type { PlayerStatus } from "@/types";

const STATUS_MAP: Record<PlayerStatus, { label: string; className: string }> = {
  healthy: { label: "健康", className: "bg-green-100 text-green-700 hover:bg-green-100" },
  minor_injury: { label: "轻伤", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  injured: { label: "伤病", className: "bg-red-100 text-red-700 hover:bg-red-100" },
  leave: { label: "请假", className: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
};

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const { label, className } = STATUS_MAP[status];
  return <Badge className={className}>{label}</Badge>;
}
