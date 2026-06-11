"use client";

import { useMemo } from "react";
import type { Match } from "@/types";

interface BracketProps {
  matches: Match[];
}

interface BracketMatch {
  id: string;
  home: string;
  away: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
  round: number;
}

/** 将比赛按轮次分组，生成对阵图数据 */
function buildBracket(matches: Match[]): { rounds: { name: string; matches: BracketMatch[] }[] } {
  const roundMap = new Map<number, BracketMatch[]>();

  for (const m of matches) {
    const round = m.round ?? 1;
    if (!roundMap.has(round)) roundMap.set(round, []);
    roundMap.get(round)!.push({
      id: m.id,
      home: m.homeTeam || "我方",
      away: m.awayTeam || m.opponent,
      homeScore: m.score?.home,
      awayScore: m.score?.away,
      status: m.status,
      round,
    });
  }

  // 按轮次排序，每轮内按创建时间排序
  const sortedRounds = [...roundMap.entries()].sort((a, b) => a[0] - b[0]);

  // 生成轮次名称
  const totalRounds = sortedRounds.length;
  const rounds = sortedRounds.map(([roundNum, roundMatches], idx) => {
    let name: string;
    if (totalRounds === 1) {
      name = "决赛";
    } else if (idx === totalRounds - 1) {
      name = "决赛";
    } else if (idx === totalRounds - 2) {
      name = "半决赛";
    } else if (idx === totalRounds - 3) {
      name = "1/4决赛";
    } else {
      name = `第${roundNum}轮`;
    }
    return { name, matches: roundMatches };
  });

  return { rounds };
}

export function Bracket({ matches }: BracketProps) {
  const { rounds } = useMemo(() => buildBracket(matches), [matches]);

  if (rounds.length === 0) return null;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max">
        {rounds.map((round, roundIdx) => (
          <div key={roundIdx} className="flex flex-col" style={{ minWidth: 200 }}>
            {/* 轮次标题 */}
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 text-center">
              {round.name}
            </div>
            {/* 比赛卡片 */}
            <div className="flex flex-col justify-around flex-1 gap-3">
              {round.matches.map((m) => {
                const homeWin = m.status === "finished" && m.homeScore !== undefined && m.awayScore !== undefined && m.homeScore > m.awayScore;
                const awayWin = m.status === "finished" && m.homeScore !== undefined && m.awayScore !== undefined && m.awayScore > m.homeScore;

                return (
                  <div
                    key={m.id}
                    className="border rounded-lg overflow-hidden bg-card"
                    style={{ minHeight: 64 }}
                  >
                    {/* 主队 */}
                    <div className={`flex items-center justify-between px-3 py-1.5 text-sm ${homeWin ? "bg-primary/10 font-bold" : ""}`}>
                      <span className="truncate flex-1">{m.home}</span>
                      {m.homeScore !== undefined && (
                        <span className="tabular-nums font-mono ml-2">{m.homeScore}</span>
                      )}
                    </div>
                    {/* 分割线 */}
                    <div className="border-t" />
                    {/* 客队 */}
                    <div className={`flex items-center justify-between px-3 py-1.5 text-sm ${awayWin ? "bg-primary/10 font-bold" : ""}`}>
                      <span className="truncate flex-1">{m.away}</span>
                      {m.awayScore !== undefined && (
                        <span className="tabular-nums font-mono ml-2">{m.awayScore}</span>
                      )}
                    </div>
                    {/* 状态 */}
                    {m.status === "upcoming" && (
                      <div className="text-[10px] text-center text-muted-foreground pb-1">待定</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
