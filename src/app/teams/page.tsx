"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTeams } from "@/hooks/use-teams";
import { usePlayers } from "@/hooks/use-players";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Plus, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

export default function TeamsPage() {
  const { teams, deleteTeam } = useTeams();
  const { players } = usePlayers();
  const { confirm, ConfirmDialog } = useConfirm();

  const handleDelete = async (id: string, name: string) => {
    if (await confirm({ description: `确认删除队伍「${name}」？`, variant: "destructive" })) {
      await deleteTeam(id);
      toast.success("队伍已删除");
    }
  };

  return (
    <PageTransition>
      <Header
        title="队伍管理"
        description={teams.length > 0 ? `${teams.length} 支队伍` : "管理校内各参赛队伍"}
        actions={
          <Link href="/teams/new/">
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />新建队伍</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6">
        {teams.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">暂无队伍，点击「新建队伍」开始</p>
            <Link href="/teams/new/">
              <Button variant="outline" size="sm" className="mt-3"><Plus className="h-4 w-4 mr-1" />新建队伍</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {teams.map((team) => {
              const memberCount = team.playerIds.length;
              const memberNames = team.playerIds
                .slice(0, 4)
                .map((id) => players.find((p) => p.id === id)?.name ?? "?")
                .join("、");

              return (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={`/teams/detail/?id=${team.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Logo */}
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                            {team.logo ? (
                              <img
                                src={`/api/avatar/serve?key=${encodeURIComponent(team.logo)}`}
                                alt={team.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg font-bold text-muted-foreground">{team.shortName?.[0] ?? team.name[0]}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm truncate">{team.name}</h3>
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(team.id, team.name); }}
                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            {team.shortName && (
                              <p className="text-xs text-muted-foreground">{team.shortName}</p>
                            )}
                            <div className="flex items-center gap-1.5 mt-2">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{memberCount} 人</span>
                            </div>
                            {memberNames && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">{memberNames}{memberCount > 4 ? ` 等` : ""}</p>
                            )}
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
      {ConfirmDialog}
    </PageTransition>
  );
}
