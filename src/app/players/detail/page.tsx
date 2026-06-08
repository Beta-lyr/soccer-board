"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/players/status-badge";
import { AbilityRadar } from "@/components/players/ability-radar";
import { PlayerForm } from "@/components/players/player-form";
import { db } from "@/lib/db";
import type { Player } from "@/types";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const FOOT_KEYS: Record<string, string> = { left: "players.leftFoot", right: "players.rightFoot", both: "players.bothFeet" };
const ABILITY_KEYS: Record<string, string> = { speed: "players.speed", shooting: "players.shooting", passing: "players.passing", defending: "players.defending", stamina: "players.stamina", awareness: "players.awareness" };

function PlayerDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [player, setPlayer] = useState<Player | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    if (id) db.players.get(id).then((p) => p && setPlayer(p));
  }, [id]);

  if (!id) {
    return (
      <PageTransition>
        <Header title={t("players.playerDetail")} />
        <div className="flex-1 p-4 md:p-6 text-center text-muted-foreground">
          <p>{t("players.notSpecified")}</p>
          <Link href="/players/" className="text-primary underline mt-2 inline-block">{t("common.back")}</Link>
        </div>
      </PageTransition>
    );
  }

  if (!player) {
    return (
      <PageTransition>
        <Header title={t("players.playerDetail")} />
        <div className="flex-1 p-4 md:p-6 text-center text-muted-foreground"><p>{t("common.loading")}</p></div>
      </PageTransition>
    );
  }

  const avgScore = (Object.values(player.abilities).reduce((a, b) => a + b, 0) / 6).toFixed(1);

  const handleDelete = async () => {
    if (confirm(t("players.confirmDelete", { name: player.name }))) {
      await db.players.delete(id);
      router.push("/players/");
    }
  };

  const handleUpdate = async (data: Omit<Player, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    await db.players.update(id, { ...data, updatedAt: now });
    const updated = await db.players.get(id);
    if (updated) setPlayer(updated);
    setShowEdit(false);
  };

  return (
    <PageTransition>
      <Header
        title={player.name}
        actions={
          <div className="flex gap-2">
            <Link href="/players/">
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}><Pencil className="h-4 w-4 mr-1" />{t("common.edit")}</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" />{t("common.delete")}</Button>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 ring-4 ring-primary/10">
                    <AvatarFallback className="text-2xl sm:text-3xl font-black bg-primary text-primary-foreground">{player.number}</AvatarFallback>
                  </Avatar>
                </motion.div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold">{player.name}</h2>
                    <StatusBadge status={player.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">{t("players.number")}：</span><span className="font-medium">#{player.number}</span></div>
                    <div><span className="text-muted-foreground">{t("players.position")}：</span><span className="font-medium">{player.positions.join(", ")}</span></div>
                    <div><span className="text-muted-foreground">{t("players.preferredFoot")}：</span><span className="font-medium">{t(FOOT_KEYS[player.preferredFoot])}</span></div>
                    <div><span className="text-muted-foreground">{t("players.overall")}：</span><span className="font-bold text-primary text-lg">{avgScore}</span></div>
                    {player.height && <div><span className="text-muted-foreground">{t("players.height")}：</span><span className="font-medium">{player.height} cm</span></div>}
                    {player.weight && <div><span className="text-muted-foreground">{t("players.weight")}：</span><span className="font-medium">{player.weight} kg</span></div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
          <Card>
            <CardHeader><CardTitle>{t("players.abilities")}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2"><AbilityRadar abilities={player.abilities} /></div>
                <div className="w-full md:w-1/2 space-y-3">
                  {(Object.keys(player.abilities) as (keyof typeof player.abilities)[]).map((key, i) => {
                    const value = player.abilities[key];
                    return (
                      <motion.div key={key} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="flex items-center gap-3">
                        <span className="w-10 text-xs text-muted-foreground">{t(ABILITY_KEYS[key])}</span>
                        <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                          <motion.div className="bg-primary h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${(value / 10) * 100}%` }} transition={{ delay: 0.5 + i * 0.08, duration: 0.6 }} />
                        </div>
                        <span className="w-6 text-right text-sm font-medium tabular-nums">{value}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PlayerForm open={showEdit} onOpenChange={setShowEdit} initialData={player} onSubmit={handleUpdate} />
    </PageTransition>
  );
}

export default function PlayerDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 p-6 text-center text-muted-foreground">Loading...</div>}>
      <PlayerDetailContent />
    </Suspense>
  );
}
