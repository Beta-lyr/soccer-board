"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlayerCard } from "@/components/players/player-card";
import { PlayerForm } from "@/components/players/player-form";
import { usePlayers } from "@/hooks/use-players";
import { Plus, Upload, Search } from "lucide-react";
import Link from "next/link";
import type { Player } from "@/types";

export default function PlayersPage() {
  const { players, addPlayer } = usePlayers();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = players.filter(
    (p) =>
      p.name.includes(search) ||
      p.number.toString().includes(search) ||
      p.positions.some((pos) => pos.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <Header
        title="球员管理"
        description={`共 ${players.length} 名球员`}
        actions={
          <div className="flex gap-2">
            <Link href="/players/import/">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                批量导入
              </Button>
            </Link>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              添加球员
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 space-y-4">
        {/* 搜索 */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、号码、位置..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* 球员列表 */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">
              {players.length === 0 ? "暂无球员数据" : "没有匹配的球员"}
            </p>
            <p className="text-sm mt-1">
              {players.length === 0 && "点击「添加球员」开始"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((player) => (
              <Link key={player.id} href={`/players/detail/?id=${player.id}`}>
                <PlayerCard player={player} />
              </Link>
            ))}
          </div>
        )}
      </div>

      <PlayerForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => addPlayer(data as Parameters<typeof addPlayer>[0])}
      />
    </>
  );
}
