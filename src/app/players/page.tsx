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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-lg">
              {players.length === 0 ? t("players.noPlayers") : t("players.noMatch")}
            </p>
            <p className="text-sm mt-1">
              {players.length === 0 && t("players.addPlayer")}
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
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
          >
            {filtered.map((player) => (
              <motion.div
                key={player.id}
                variants={{
                  hidden: { opacity: 0, y: 16, scale: 0.97 },
                  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
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
