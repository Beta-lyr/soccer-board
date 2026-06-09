"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { db } from "@/lib/db";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";

const TYPE_KEYS: Record<string, string> = {
  open_play: "tactics.openPlay",
  corner: "tactics.corner",
  free_kick: "tactics.freeKick",
  throw_in: "tactics.throwIn",
};

export default function TacticsPage() {
  const { t } = useI18n();
  const tactics = useLiveQuery(() => db.tactics.orderBy("createdAt").reverse().toArray()) ?? [];
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    await db.tactics.delete(deleteId);
    setDeleteId(null);
    toast.success("已删除");
  };

  return (
    <PageTransition>
      <Header
        title={t("tactics.title")}
        description={t("tactics.count", { count: tactics.length })}
        actions={
          <Link href="/tactics/new/">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />{t("tactics.newTactic")}</Button>
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
              <motion.div key={tactic.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <Card className="group cursor-pointer hover:border-primary/30 hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <Link href={`/tactics/edit/?id=${tactic.id}`}>
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
                          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteId(tactic.id); }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {tactic.thumbnail && (
                        <div className="mt-3 rounded overflow-hidden border bg-white">
                          <img src={tactic.thumbnail} alt={tactic.name} className="w-full h-auto max-h-40 object-contain" />
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(tactic.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">删除后无法恢复，确认要删除此战术方案吗？</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageTransition>
  );
}
