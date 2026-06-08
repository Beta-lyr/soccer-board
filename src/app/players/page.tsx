"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HoverCard } from "@/components/ui/hover-card";
import { PlayerCard } from "@/components/players/player-card";
import { PlayerForm } from "@/components/players/player-form";
import { usePlayers } from "@/hooks/use-players";
import { Plus, Upload, Search } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

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
    <PageTransition>
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
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、号码、位置..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </motion.div>

        {/* 球员列表 */}
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-lg">
              {players.length === 0 ? "暂无球员数据" : "没有匹配的球员"}
            </p>
            <p className="text-sm mt-1">
              {players.length === 0 && "点击「添加球员」开始"}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map((player) => (
              <motion.div
                key={player.id}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.97 },
                  show: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                <Link href={`/players/detail/?id=${player.id}`}>
                  <HoverCard>
                    <PlayerCard player={player} />
                  </HoverCard>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <PlayerForm
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={(data) => addPlayer(data as Parameters<typeof addPlayer>[0])}
      />
    </PageTransition>
  );
}
