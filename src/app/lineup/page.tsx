"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLineupTemplates } from "@/hooks/use-lineup";
import { useI18n } from "@/lib/i18n";
import { FORMATIONS, FORMATION_GROUPS } from "@/types";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Plus, Users, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

/** 根据阵型名推断人数 */
function guessPlayerCount(formation: string): number | null {
  for (const [countStr, group] of Object.entries(FORMATION_GROUPS)) {
    if (formation in group) return Number(countStr);
  }
  const positions = FORMATIONS[formation];
  return positions?.length ?? null;
}

export default function LineupListPage() {
  const { t } = useI18n();
  const { templates, deleteTemplate } = useLineupTemplates();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({ description: `确认删除阵容「${name}」？`, variant: "destructive" });
    if (ok) {
      await deleteTemplate(id);
      toast.success("阵容已删除");
    }
  };


  return (
    <PageTransition>
      <Header
        title={t("lineup.title")}
        description={templates.length > 0 ? `${templates.length} 个阵容模板` : t("lineup.desc")}
        actions={
          <Link href="/lineup/new/">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />新建阵容</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        {templates.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">暂无阵容模板，点击「新建阵容」开始</p>
            <Link href="/lineup/new/">
              <Button variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" />新建阵容</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {templates.map((tmpl) => {
              const playerCount = guessPlayerCount(tmpl.formation);
              return (
                <motion.div
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/lineup/detail/?id=${tmpl.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-sm truncate">{tmpl.name}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-[10px]">{tmpl.formation}</Badge>
                              {playerCount != null && (
                                <span className="text-[10px] text-muted-foreground">{playerCount}人制</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(tmpl.id, tmpl.name); }}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 首发预览 */}
                        <div className="flex flex-wrap gap-1">
                          {tmpl.starters.slice(0, 6).map((s) => (
                            <span key={s.playerId} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {s.position}
                            </span>
                          ))}
                          {tmpl.starters.length > 6 && (
                            <span className="text-[10px] text-muted-foreground px-1">+{tmpl.starters.length - 6}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {tmpl.starters.length}首发{tmpl.substitutes.length > 0 && ` · ${tmpl.substitutes.length}替补`}
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
      {ConfirmDialog}
    </PageTransition>
  );
}
