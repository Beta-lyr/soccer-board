"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n";
import { useTrainings } from "@/hooks/use-trainings";
import { usePlayers } from "@/hooks/use-players";
import { useConfirm } from "@/components/ui/confirm-dialog";
import type { TrainingTheme } from "@/types";
import { Plus, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const THEME_MAP: Record<TrainingTheme, { label: string; color: string }> = {
  fitness: { label: "体能", color: "bg-red-500/15 text-red-600" },
  technical: { label: "技术", color: "bg-blue-500/15 text-blue-600" },
  tactical: { label: "战术", color: "bg-green-500/15 text-green-600" },
  set_piece: { label: "定位球", color: "bg-amber-500/15 text-amber-600" },
};

export default function TrainingPage() {
  const { t } = useI18n();
  const { trainings, addTraining, updateTraining, deleteTraining } = useTrainings();
  const { players } = usePlayers();
  const { confirm, ConfirmDialog } = useConfirm();
  const [showForm, setShowForm] = useState(false);
  const [showAttendance, setShowAttendance] = useState<string | null>(null);

  // 新建训练表单
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("18:00");
  const [location, setLocation] = useState("");
  const [theme, setTheme] = useState<TrainingTheme>("technical");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!location) { toast.error("请输入训练地点"); return; }
    await addTraining({
      date, time, location, theme, description: description || undefined,
      attendance: players.map((p) => ({ playerId: p.id, present: true })),
    });
    toast.success("训练已创建");
    setShowForm(false);
    setDate(new Date().toISOString().slice(0, 10));
    setTime("18:00");
    setLocation("");
    setTheme("technical");
    setDescription("");
  };

  const handleDelete = async (id: string) => {
    if (await confirm({ description: "确认删除此训练？", variant: "destructive" })) {
      await deleteTraining(id);
    }
  };

  const toggleAttendance = async (trainingId: string, playerId: string) => {
    const training = trainings.find((t) => t.id === trainingId);
    if (!training) return;
    const updated = training.attendance.map((a) =>
      a.playerId === playerId ? { ...a, present: !a.present } : a
    );
    await updateTraining(trainingId, { attendance: updated });
  };

  const currentTraining = showAttendance ? trainings.find((tr) => tr.id === showAttendance) : null;

  return (
    <PageTransition>
      <Header
        title={t("training.title")}
        description={`${trainings.length} 次训练`}
        actions={
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />{t("training.newTraining")}
          </Button>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {trainings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">{t("training.noTraining")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trainings.map((tr) => {
              const themeInfo = THEME_MAP[tr.theme];
              const presentCount = tr.attendance.filter((a) => a.present).length;
              return (
                <motion.div key={tr.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-semibold">{tr.date}</span>
                            <span className="text-sm text-muted-foreground">{tr.time}</span>
                            <Badge variant="outline" className={themeInfo.color}>{themeInfo.label}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            📍 {tr.location}
                            {tr.description && <span className="ml-3">📝 {tr.description}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowAttendance(showAttendance === tr.id ? null : tr.id)}>
                            <Users className="h-4 w-4 mr-1" />出勤 {presentCount}/{tr.attendance.length}
                          </Button>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => handleDelete(tr.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* 出勤列表 */}
                      {showAttendance === tr.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {tr.attendance.map((a) => {
                              const player = players.find((p) => p.id === a.playerId);
                              if (!player) return null;
                              return (
                                <label
                                  key={a.playerId}
                                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                                    a.present ? "bg-emerald-500/10 border-emerald-500/20" : "bg-destructive/5 border-destructive/20 opacity-60"
                                  }`}
                                >
                                  <Checkbox checked={a.present} onCheckedChange={() => toggleAttendance(tr.id, a.playerId)} />
                                  <span className="text-sm">#{player.number} {player.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 新建训练弹窗 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("training.newTraining")}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>日期</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>时间</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>地点 *</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="训练场地" /></div>
            <div className="space-y-2">
              <Label>主题</Label>
              <Select value={theme} onValueChange={(v) => v && setTheme(v as TrainingTheme)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(THEME_MAP).map(([key, val]) => (
                    <SelectItem key={key} value={key}>{val.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>描述</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="训练内容描述（可选）" rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>取消</Button>
            <Button onClick={handleCreate}>创建训练</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ConfirmDialog}
    </PageTransition>
  );
}
