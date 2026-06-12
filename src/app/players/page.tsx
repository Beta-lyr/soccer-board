"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/players/status-badge";
import { PlayerForm } from "@/components/players/player-form";
import { usePlayers } from "@/hooks/use-players";
import { Plus, Upload, Search, GitCompareArrows } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function PlayersPage() {
  const { players, addPlayer } = usePlayers();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const { t } = useI18n();

  const filtered = players.filter(
    (p) =>
      p.name.includes(search) ||
      p.number.toString().includes(search) ||
      p.positions.some((pos) => pos.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <PageTransition>
      <Header
        title={t("players.title")}
        description={t("players.count", { count: players.length })}
        actions={
          <div className="flex gap-2">
            <Link href="/players/compare/">
              <Button variant="outline" size="sm">
                <GitCompareArrows className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("players.compare")}</span>
              </Button>
            </Link>
            <Link href="/players/import/">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t("players.batchImport")}</span>
              </Button>
            </Link>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{t("players.addPlayer")}</span>
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-sm"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("players.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </motion.div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">
              {players.length === 0 ? t("players.noPlayers") : t("players.noMatch")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((player) => {
              const avgScore = (Object.values(player.abilities).reduce((a, b) => a + b, 0) / 6).toFixed(1);
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/players/detail/?id=${player.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                            {player.avatar && (
                              <AvatarImage
                                src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`}
                                alt={player.name}
                              />
                            )}
                            <AvatarFallback className="text-lg font-black bg-primary text-primary-foreground">
                              {player.number}
                            </AvatarFallback>
                          </Avatar>
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
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <PlayerForm
        key={showForm ? "open" : "closed"}
        open={showForm}
        onOpenChange={setShowForm}
        onSubmit={async (data) => {
          await addPlayer(data);
          setShowForm(false);
        }}
      />
    </PageTransition>
  );
}
