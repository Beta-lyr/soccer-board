"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCompetitions } from "@/hooks/use-competitions";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Plus, Trophy, Swords, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

const TYPE_LABELS: Record<string, string> = { league: "联赛", cup: "杯赛", friendly: "友谊赛" };
const TYPE_ICONS: Record<string, typeof Trophy> = { league: Trophy, cup: Swords, friendly: Trophy };
const TYPE_COLORS: Record<string, string> = { league: "bg-amber-500/15 text-amber-600", cup: "bg-violet-500/15 text-violet-600", friendly: "bg-emerald-500/15 text-emerald-600" };

export default function CompetitionsPage() {
  const { competitions, deleteCompetition } = useCompetitions();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({ description: `确认删除赛事「${name}」？`, variant: "destructive" });
    if (ok) {
      await deleteCompetition(id);
      toast.success("赛事已删除");
    }
  };

  return (
    <PageTransition>
      <Header
        title="赛事管理"
        description={competitions.length > 0 ? `${competitions.length} 个赛事` : "联赛 · 杯赛"}
        actions={
          <Link href="/competitions/new/">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />新建赛事</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        {competitions.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">暂无赛事，点击「新建赛事」创建联赛或杯赛</p>
            <Link href="/competitions/new/">
              <Button variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" />新建赛事</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {competitions.map((comp) => {
              const Icon = TYPE_ICONS[comp.type] ?? Trophy;
              return (
                <motion.div
                  key={comp.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/competitions/detail/?id=${comp.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${TYPE_COLORS[comp.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm truncate">{comp.name}</h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[comp.type]}</Badge>
                                <span className="text-[10px] text-muted-foreground">{comp.format === "round_robin" ? "单循环" : "淘汰制"}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(comp.id, comp.name); }}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{comp.teams.length} 支队伍</span>
                          <span>{comp.matchIds.length} 场比赛</span>
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
