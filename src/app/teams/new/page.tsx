"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTeams } from "@/hooks/use-teams";
import { usePlayers } from "@/hooks/use-players";
import { ArrowLeft, Save, Camera, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function NewTeamPage() {
  const router = useRouter();
  const { addTeam } = useTeams();
  const { players } = usePlayers();
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logo, setLogo] = useState<string>("");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  // Logo 上传（复用头像上传逻辑）
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
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
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

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error("请输入队伍名称"); return; }
    await addTeam({
      name: name.trim(),
      shortName: shortName.trim() || undefined,
      logo: logo || undefined,
      playerIds: selectedPlayers,
    });
    toast.success("队伍已创建");
    router.push("/teams/");
  };

  return (
    <PageTransition>
      <Header
        title="新建队伍"
        actions={
          <Link href="/teams/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />返回</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl space-y-5">
        {/* 基本信息 */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">队伍信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {/* Logo 上传 */}
              <div
                className="relative group cursor-pointer shrink-0"
                onClick={() => inputRef.current?.click()}
              >
                <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
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
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => { e.stopPropagation(); setLogo(""); }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.currentTarget.value = ""; }}
                />
              </div>
              {/* 名称 */}
              <div className="flex-1 space-y-3">
                <div className="space-y-2">
                  <Label>队伍名称 *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：计算机学院" />
                </div>
                <div className="space-y-2">
                  <Label>简称</Label>
                  <Input value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="例如：计算机" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 选择球员 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">队伍成员 ({selectedPlayers.length}/{players.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">请先在球员页面添加球员</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {players.map((player) => (
                  <label
                    key={player.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors",
                      selectedPlayers.includes(player.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                      className="rounded"
                    />
                    <Avatar className="h-6 w-6">
                      {player.avatar && <AvatarImage src={`/api/avatar/serve?key=${encodeURIComponent(player.avatar)}`} />}
                      <AvatarFallback className="text-[10px]">{player.number}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">#{player.number} {player.name}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={!name.trim()} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />创建队伍
        </Button>
      </div>
    </PageTransition>
  );
}
