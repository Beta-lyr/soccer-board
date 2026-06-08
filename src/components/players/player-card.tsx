"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "./status-badge";
import type { Player } from "@/types";

interface PlayerCardProps {
  player: Player;
  onClick?: () => void;
}

export function PlayerCard({ player, onClick }: PlayerCardProps) {
  const avgScore = (
    Object.values(player.abilities).reduce((a, b) => a + b, 0) / 6
  ).toFixed(1);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg font-bold bg-primary text-primary-foreground">
              {player.number}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{player.name}</span>
              <StatusBadge status={player.status} />
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              {player.positions.join(", ")}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{avgScore}</div>
            <div className="text-xs text-muted-foreground">综合</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
