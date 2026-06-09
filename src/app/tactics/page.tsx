"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useLiveQuery } from "dexie-react-hooks";

const TYPE_KEYS: Record<string, string> = {
  open_play: "tactics.openPlay",
  corner: "tactics.corner",
  free_kick: "tactics.freeKick",
  throw_in: "tactics.throwIn",
};

export default function TacticsPage() {
  const { t } = useI18n();
  const tactics = useLiveQuery(() => db.tactics.orderBy("createdAt").reverse().toArray()) ?? [];

  const handleDelete = async (id: string) => {
    if (confirm(t("tactics.confirmDelete"))) {
      await db.tactics.delete(id);
    }
  };

  return (
    <PageTransition>
      <Header
        title={t("tactics.title")}
        description={t("tactics.count", { count: tactics.length })}
        actions={
          <Link href="/tactics/new/">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("tactics.newTactic")}
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        {tactics.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t("tactics.noTactics")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {tactics.map((tactic) => (
              <motion.div
                key={tactic.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{tactic.name}</h3>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary">{t(TYPE_KEYS[tactic.type] ?? tactic.type)}</Badge>
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
                        <img src={tactic.thumbnail} alt={tactic.name} className="w-full h-auto" />
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(tactic.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
