"use client";

import { StatusBadge } from "./status-badge";
import { useI18n } from "@/lib/i18n";
import type { Player } from "@/types";

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  const { t } = useI18n();
  const avgScore = (Object.values(player.abilities).reduce((a, b) => a + b, 0) / 6).toFixed(1);

  return (
    <div
      className="cursor-pointer rounded-xl border bg-card text-card-foreground shadow-sm hover:shadow-lg hover:border-primary/40 transition-all p-4"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full overflow-hidden ring-2 ring-primary/20 flex-shrink-0">
          {player.avatar ? (
            <img
              src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`}
              alt={player.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-primary text-primary-foreground text-lg font-black">
              {player.number}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{player.name}</span>
            <StatusBadge status={player.status} />
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {player.positions.join(" · ")}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-primary tabular-nums">{avgScore}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {t("players.overall")}
          </div>
        </div>
      </div>
    </div>
  );
}
