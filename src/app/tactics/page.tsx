"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard } from "@/components/ui/hover-card";
import { db } from "@/lib/db";
import type { Tactic } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const TYPE_LABELS = {
  open_play: "进攻战术",
  corner: "角球",
  free_kick: "任意球",
  throw_in: "界外球",
};

export default function TacticsPage() {
  const [tactics, setTactics] = useState<Tactic[]>([]);

  useEffect(() => {
    db.tactics.orderBy("createdAt").reverse().toArray().then(setTactics);
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm("确认删除此战术？")) {
      await db.tactics.delete(id);
      setTactics((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <PageTransition>
      <Header
        title="战术板"
        description={`共 ${tactics.length} 个战术方案`}
        actions={
          <Link href="/tactics/new/">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新建战术
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6">
        {tactics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <p className="text-lg">暂无战术方案</p>
            <p className="text-sm mt-1">点击「新建战术」开始创建</p>
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {tactics.map((tactic) => (
              <motion.div
                key={tactic.id}
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                }}
              >
                <HoverCard>
                  <Card className="group relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{tactic.name}</h3>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{TYPE_LABELS[tactic.type]}</Badge>
                            <Badge variant="outline">{tactic.formation}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(tactic.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {tactic.thumbnail && (
                        <div className="mt-3 rounded overflow-hidden border">
                          <img
                            src={tactic.thumbnail}
                            alt={tactic.name}
                            className="w-full h-auto"
                          />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(tactic.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </CardContent>
                  </Card>
                </HoverCard>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
