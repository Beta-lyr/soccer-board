"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n";
import { usePlayers } from "@/hooks/use-players";
import { ArrowLeft, Upload, FileSpreadsheet, Check } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Papa from "papaparse";
import type { PlayerAbilities, PlayerStatus, PreferredFoot } from "@/types";

interface ParsedPlayer {
  name: string;
  number: number;
  height?: number;
  weight?: number;
  preferredFoot: PreferredFoot;
  positions: string[];
  status: PlayerStatus;
  abilities: PlayerAbilities;
  valid: boolean;
  error?: string;
}

const CSV_TEMPLATE = `姓名,号码,身高,体重,惯用脚,擅长位置,速度,射门,传球,防守,体能,意识
张三,10,175,70,右,CM CAM,7,6,8,5,7,7
李四,9,180,75,左,ST,8,8,5,3,7,6
王五,5,185,80,右,CB,5,2,4,9,8,7`;

export default function ImportPlayersPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { addPlayer } = usePlayers();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedPlayer[]>([]);
  const [importing, setImporting] = useState(false);

  const parseCSV = (text: string) => {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const players: ParsedPlayer[] = [];

    for (const row of result.data as Record<string, string>[]) {
      try {
        const name = (row["姓名"] ?? row["name"] ?? "").trim();
        const number = parseInt(row["号码"] ?? row["number"] ?? "0");
        if (!name || !number) {
          players.push({ name: name || "未知", number: number || 0, preferredFoot: "right", positions: [], status: "healthy", abilities: { speed: 5, shooting: 5, passing: 5, defending: 5, stamina: 5, awareness: 5 }, valid: false, error: "缺少姓名或号码" });
          continue;
        }

        const foot = (row["惯用脚"] ?? row["preferredFoot"] ?? "右").trim();
        const preferredFoot: PreferredFoot = foot === "左" ? "left" : foot === "双脚" ? "both" : "right";

        const positions = (row["擅长位置"] ?? row["positions"] ?? "").trim().split(/[\s,]+/).filter(Boolean);

        const abilities: PlayerAbilities = {
          speed: Math.min(10, Math.max(1, parseInt(row["速度"] ?? row["speed"] ?? "5") || 5)),
          shooting: Math.min(10, Math.max(1, parseInt(row["射门"] ?? row["shooting"] ?? "5") || 5)),
          passing: Math.min(10, Math.max(1, parseInt(row["传球"] ?? row["passing"] ?? "5") || 5)),
          defending: Math.min(10, Math.max(1, parseInt(row["防守"] ?? row["defending"] ?? "5") || 5)),
          stamina: Math.min(10, Math.max(1, parseInt(row["体能"] ?? row["stamina"] ?? "5") || 5)),
          awareness: Math.min(10, Math.max(1, parseInt(row["意识"] ?? row["awareness"] ?? "5") || 5)),
        };

        players.push({
          name,
          number,
          height: parseInt(row["身高"] ?? row["height"] ?? "0") || undefined,
          weight: parseInt(row["体重"] ?? row["weight"] ?? "0") || undefined,
          preferredFoot,
          positions,
          status: "healthy",
          abilities,
          valid: true,
        });
      } catch {
        players.push({
          name: row["姓名"] ?? "解析错误", number: 0,
          preferredFoot: "right", positions: [], status: "healthy",
          abilities: { speed: 5, shooting: 5, passing: 5, defending: 5, stamina: 5, awareness: 5 },
          valid: false, error: "数据格式错误",
        });
      }
    }

    setParsed(players);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseCSV(reader.result as string);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const valid = parsed.filter((p) => p.valid);
    if (valid.length === 0) return;
    setImporting(true);
    try {
      for (const p of valid) {
        await addPlayer(p);
      }
      toast.success(`成功导入 ${valid.length} 名球员`);
      router.push("/players/");
    } catch (e) {
      toast.error("导入失败: " + (e instanceof Error ? e.message : "未知错误"));
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsed.filter((p) => p.valid).length;

  return (
    <PageTransition>
      <Header
        title={t("players.batchImport")}
        actions={
          <Link href="/players/">
            <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />{t("common.back")}</Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-4xl">
        {/* 上传区 */}
        <Card>
          <CardHeader><CardTitle className="text-sm">上传 CSV 文件</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">点击选择 CSV 文件</p>
              <p className="text-xs text-muted-foreground mt-1">支持中文和英文表头</p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">CSV 格式示例：</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "球员导入模板.csv";
                  link.click();
                }}
              >
                下载模板
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 预览 */}
        {parsed.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>预览 ({parsed.length} 条，{validCount} 条有效)</span>
                <Button size="sm" onClick={handleImport} disabled={validCount === 0 || importing}>
                  <Check className="h-4 w-4 mr-1" />
                  {importing ? "导入中..." : `导入 ${validCount} 名球员`}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>状态</TableHead>
                      <TableHead>号码</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>位置</TableHead>
                      <TableHead>惯用脚</TableHead>
                      <TableHead>速度</TableHead>
                      <TableHead>射门</TableHead>
                      <TableHead>传球</TableHead>
                      <TableHead>防守</TableHead>
                      <TableHead>体能</TableHead>
                      <TableHead>意识</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.map((p, i) => (
                      <TableRow key={i} className={p.valid ? "" : "bg-destructive/10"}>
                        <TableCell>{p.valid ? "✅" : "❌"}</TableCell>
                        <TableCell>{p.number}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.positions.join(", ")}</TableCell>
                        <TableCell>{p.preferredFoot === "left" ? "左" : p.preferredFoot === "both" ? "双" : "右"}</TableCell>
                        <TableCell>{p.abilities.speed}</TableCell>
                        <TableCell>{p.abilities.shooting}</TableCell>
                        <TableCell>{p.abilities.passing}</TableCell>
                        <TableCell>{p.abilities.defending}</TableCell>
                        <TableCell>{p.abilities.stamina}</TableCell>
                        <TableCell>{p.abilities.awareness}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageTransition>
  );
}
