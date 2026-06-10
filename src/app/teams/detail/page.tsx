"use client";

import { Suspense, useState, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeams } from "@/hooks/use-teams";
import { usePlayers } from "@/hooks/use-players";
import { ArrowLeft, Trash2, Save, Camera, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function TeamDetailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const { teams, updateTeam, deleteTeam } = useTeams();
  const { players } = usePlayers();

  const team = teams.find((t) => t.id === id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team?.name ?? "");
  const [shortName, setShortName] = useState(team?.shortName ?? "");
  const [logo, setLogo] = useState(team?.logo ?? "");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(team?.playerIds ?? []);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 同步 team 数据到编辑状态
  useState(() => {
    if (team) {
      setName(team.name);
      setShortName(team.shortName ?? "");
      setLogo(team.logo ?? "");
      setSelectedPlayers(team.playerIds);
    }
  });

  const togglePlayer = (pid: string) => {
    setSelectedPlayers((prev) => prev.includes(pid) ? prev.filter((p) => p !== pid) : [...prev, pid]);
  };

  const compressImage = useCallback(async (file: File): Promise<Blob> => {
    const MAX_DIM = 256;
    const img = new Image();
    const url = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed")); };
      img.src = url;
    });
  }, []);

  const handleLogoUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const reader = new FileReader();
      const base64: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(compressed);
      });
      const res = await fetch("/api/avatar/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64, type: "image/jpeg" }),
      });
      if (!res.ok) throw new Error("Upload failed");
      const { key } = await res.json();
      setLogo(key);
    } catch {
      toast.error("Logo 上传失败");
    } finally {
      setUploading(false);
    }
  }, [compressImage]);

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    await updateTeam(id, {
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      logo: logo || undefined,
      playerIds: selectedPlayers,
    });
    setEditing(false);
    toast.success("队伍已更新");
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm(`确认删除队伍「${team?.name}」？`)) {
      await deleteTeam(id);
      toast.success("队伍已删除");
      router.push("/teams/");
    }
  };

  if (!team) {
    return (
      <PageTransition>
        <Header title="队伍详情" />
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="mb-3">队伍不存在或已删除</p>
            <Link href="/teams/"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回列表</Button></Link>
          </div>
        </div>
      </PageTransition>
    );
  }

  const teamPlayers = team.playerIds.map((pid) => players.find((p) => p.id === pid)).filter(Boolean);

  return (
    <PageTransition>
      <Header
        title={editing ? "编辑队伍" : team.name}
        description={editing ? undefined : (team.shortName ?? `${team.playerIds.length} 名成员`)}
        actions={
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={handleSave}><Save className="h-4 w-4 mr-1" />保存</Button>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>取消</Button>
              </>
            ) : (
              <>
                <Button size="sm" onClick={() => setEditing(true)}>编辑</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-1" />删除</Button>
                <Link href="/teams/">
                  <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
                </Link>
              </>
            )}
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl space-y-5">
        {editing ? (
          /* 编辑模式 */
          <>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">队伍信息</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="relative group cursor-pointer shrink-0" onClick={() => inputRef.current?.click()}>
                    <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                      {logo ? (
                        <img src={`/api/avatar/serve?key=${encodeURIComponent(logo)}`} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-muted-foreground">{name[0] ?? "?"}</span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Camera className="h-5 w-5 text-white" />}
                    </div>
                    {logo && !uploading && (
                      <button type="button" className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); setLogo(""); }}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.currentTarget.value = ""; }} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2"><Label>队伍名称 *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                    <div className="space-y-2"><Label>简称</Label><Input value={shortName} onChange={(e) => setShortName(e.target.value)} /></div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">队伍成员 ({selectedPlayers.length}/{players.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {players.map((player) => (
                    <label key={player.id} className={cn("flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors", selectedPlayers.includes(player.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50")}>
                      <input type="checkbox" checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayer(player.id)} className="rounded" />
                      <Avatar className="h-6 w-6">{player.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}<AvatarFallback className="text-[10px]">{player.number}</AvatarFallback></Avatar>
                      <span className="text-sm truncate">#{player.number} {player.name}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* 查看模式 */
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                    {team.logo ? (
                      <img src={`/api/avatar/serve?key=${encodeURIComponent(team.logo)}`} alt={team.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-muted-foreground">{team.shortName?.[0] ?? team.name[0]}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{team.name}</h2>
                    {team.shortName && <p className="text-sm text-muted-foreground">简称: {team.shortName}</p>}
                    <p className="text-sm text-muted-foreground">{team.playerIds.length} 名成员</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">队伍成员 ({teamPlayers.length})</CardTitle></CardHeader>
              <CardContent>
                {teamPlayers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">暂无成员，点击编辑添加</p>
                ) : (
                  <div className="space-y-2">
                    {teamPlayers.map((p) => p && (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg border">
                        <Avatar className="h-8 w-8">
                          {p.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(p.avatar)}`} />}
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">{p.number}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm">{p.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">#{p.number}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{p.positions.join(" · ")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageTransition>
  );
}

export default function TeamDetailPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-muted-foreground">加载中...</div>}>
      <TeamDetailContent />
    </Suspense>
  );
}
