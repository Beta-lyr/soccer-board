"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";
import { usePlayers } from "@/hooks/use-players";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import type { MatchType } from "@/types";

export default function NewMatchPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { addMatch } = useMatches();
  const { players } = usePlayers();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("14:00");
  const [opponent, setOpponent] = useState("");
  const [venue, setVenue] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("friendly");
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const togglePlayer = (id: string) => {
    setSelectedPlayers((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!opponent) return;
    await addMatch({
      date: `${date}T${time}`,
      opponent,
      venue,
      type: matchType,
      status: "upcoming",
      lineup: selectedPlayers.map((id) => ({ playerId: id, position: "" })),
    });
    router.push("/matches/");
  };

  const TYPE_OPTIONS: { value: MatchType; key: string }[] = [
    { value: "league", key: "比赛" },
    { value: "friendly", key: "友谊赛" },
    { value: "training", key: "训练赛" },
  ];

  return (
    <PageTransition>
      <Header
        title={t("matches.newMatch")}
        actions={
          <Link href="/matches/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">比赛信息</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>日期</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>时间</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>对手 *</Label>
              <Input value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="输入对手名称" />
            </div>
            <div className="space-y-2">
              <Label>场地</Label>
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="输入场地" />
            </div>
            <div className="space-y-2">
              <Label>比赛性质</Label>
              <Select value={matchType} onValueChange={(v) => v && setMatchType(v as MatchType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.key}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">选择参赛球员 ({selectedPlayers.length}/{players.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {players.map((player) => (
                <label
                  key={player.id}
                  className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                    selectedPlayers.includes(player.id) ? "bg-primary/10 border-primary/30" : "hover:bg-accent/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlayers.includes(player.id)}
                    onCheckedChange={() => togglePlayer(player.id)}
                  />
                  <span className="text-sm font-medium truncate">#{player.number} {player.name}</span>
                </label>
              ))}
            </div>
            {players.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">请先添加球员</p>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} disabled={!opponent} className="w-full">
          创建比赛
        </Button>
      </div>
    </PageTransition>
  );
}
