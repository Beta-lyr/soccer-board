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

const FOOT_LABELS = { left: "左脚", right: "右脚", both: "双脚" };

const ABILITY_LABELS: Record<string, string> = {
  speed: "速度",
  shooting: "射门",
  passing: "传球",
  defending: "防守",
  stamina: "体能",
  awareness: "意识",
};

function PlayerDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const [player, setPlayer] = useState<Player | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (id) {
      db.players.get(id).then((p) => p && setPlayer(p));
    }
  }, [id]);

  if (!id) {
    return (
      <PageTransition>
        <Header title="球员详情" />
        <div className="flex-1 p-6 text-center text-muted-foreground">
          <p>未指定球员</p>
          <Link href="/players/" className="text-primary underline mt-2 inline-block">
            返回球员列表
          </Link>
        </div>
      </PageTransition>
    );
  }

  if (!player) {
    return (
      <PageTransition>
        <Header title="球员详情" />
        <div className="flex-1 p-6 text-center text-muted-foreground">
          <p>加载中...</p>
        </div>
      </PageTransition>
    );
  }

  const avgScore = (
    Object.values(player.abilities).reduce((a, b) => a + b, 0) / 6
  ).toFixed(1);

  const handleDelete = async () => {
    if (confirm(`确认删除球员「${player.name}」？`)) {
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
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                返回
              </Button>
            </Link>
            <Button variant="outline" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4 mr-1" />
              编辑
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              删除
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6 space-y-6">
        {/* 基本信息 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                >
                  <Avatar className="h-20 w-20 ring-4 ring-primary/10">
                    <AvatarFallback className="text-3xl font-black bg-primary text-primary-foreground">
                      {player.number}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">{player.name}</h2>
                    <StatusBadge status={player.status} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">号码：</span>
                      <span className="font-medium">#{player.number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">位置：</span>
                      <span className="font-medium">{player.positions.join(", ")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">惯用脚：</span>
                      <span className="font-medium">{FOOT_LABELS[player.preferredFoot]}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">综合评分：</span>
                      <span className="font-bold text-primary text-lg">{avgScore}</span>
                    </div>
                    {player.height && (
                      <div>
                        <span className="text-muted-foreground">身高：</span>
                        <span className="font-medium">{player.height} cm</span>
                      </div>
                    )}
                    {player.weight && (
                      <div>
                        <span className="text-muted-foreground">体重：</span>
                        <span className="font-medium">{player.weight} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 能力雷达图 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>能力评估</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-full md:w-1/2">
                  <AbilityRadar abilities={player.abilities} />
                </div>
                <div className="w-full md:w-1/2 space-y-3">
                  {(Object.keys(player.abilities) as (keyof typeof player.abilities)[]).map(
                    (key, i) => {
                      const value = player.abilities[key];
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.08 }}
                          className="flex items-center gap-3"
                        >
                          <span className="w-12 text-sm text-muted-foreground">
                            {ABILITY_LABELS[key]}
                          </span>
                          <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                            <motion.div
                              className="bg-primary h-2.5 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${(value / 10) * 100}%` }}
                              transition={{
                                delay: 0.5 + i * 0.08,
                                duration: 0.6,
                                ease: [0.16, 1, 0.3, 1],
                              }}
                            />
                          </div>
                          <span className="w-8 text-right text-sm font-medium tabular-nums">
                            {value}
                          </span>
                        </motion.div>
                      );
                    }
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <PlayerForm
        open={showEdit}
        onOpenChange={setShowEdit}
        initialData={player}
        onSubmit={handleUpdate}
      />
    </PageTransition>
  );
}

export default function PlayerDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 p-6 text-center text-muted-foreground">加载中...</div>
      }
    >
      <PlayerDetailContent />
    </Suspense>
  );
}
