"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Competition, Standing } from "@/types";

export function useCompetitions() {
  const competitions = useLiveQuery(() => db.competitions.orderBy("createdAt").reverse().toArray()) ?? [];

  const addCompetition = async (data: Omit<Competition, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    return db.competitions.add({
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateCompetition = async (id: string, data: Partial<Omit<Competition, "id" | "createdAt">>) => {
    await db.competitions.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteCompetition = async (id: string) => {
    await db.competitions.delete(id);
  };

  const addMatchToCompetition = async (competitionId: string, matchId: string) => {
    const comp = await db.competitions.get(competitionId);
    if (!comp) return;
    const matchIds = [...new Set([...comp.matchIds, matchId])];
    await db.competitions.update(competitionId, { matchIds, updatedAt: new Date().toISOString() });
  };

  return { competitions, addCompetition, updateCompetition, deleteCompetition, addMatchToCompetition };
}

export function useCompetition(id: string) {
  return useLiveQuery(() => db.competitions.get(id), [id]);
}

/** 轮转法生成单循环赛程 */
export function generateRoundRobinSchedule(teams: string[]): [string, string][] {
  const n = teams.length;
  if (n < 2) return [];

  // 奇数队加一个 bye
  const list = n % 2 === 0 ? [...teams] : [...teams, "BYE"];
  const count = list.length;
  const rounds: [string, string][] = [];

  for (let round = 0; round < count - 1; round++) {
    for (let i = 0; i < count / 2; i++) {
      const home = list[i];
      const away = list[count - 1 - i];
      if (home !== "BYE" && away !== "BYE") {
        rounds.push([home, away]);
      }
    }
    // 轮转：固定第一个，其余右移
    const last = list.pop()!;
    list.splice(1, 0, last);
  }

  return rounds;
}

/** 淘汰制配对 */
export function generateKnockoutBracket(teams: string[]): [string, string][] {
  // 补齐到 2^n
  const n = Math.ceil(Math.log2(teams.length));
  const size = Math.pow(2, n);
  const padded = [...teams];
  while (padded.length < size) padded.push("BYE");

  const bracket: [string, string][] = [];
  for (let i = 0; i < size; i += 2) {
    bracket.push([padded[i], padded[i + 1]]);
  }
  return bracket;
}

/** 初始化积分榜 */
export function initStandings(teams: string[]): Standing[] {
  return teams.map((team) => ({
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
  }));
}

/** 更新积分榜（根据一场比赛结果） */
export function updateStanding(
  standings: Standing[],
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): Standing[] {
  return standings.map((s) => {
    if (s.team === homeTeam) {
      return {
        ...s,
        played: s.played + 1,
        wins: s.wins + (homeScore > awayScore ? 1 : 0),
        draws: s.draws + (homeScore === awayScore ? 1 : 0),
        losses: s.losses + (homeScore < awayScore ? 1 : 0),
        goalsFor: s.goalsFor + homeScore,
        goalsAgainst: s.goalsAgainst + awayScore,
        points: s.points + (homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0),
      };
    }
    if (s.team === awayTeam) {
      return {
        ...s,
        played: s.played + 1,
        wins: s.wins + (awayScore > homeScore ? 1 : 0),
        draws: s.draws + (homeScore === awayScore ? 1 : 0),
        losses: s.losses + (awayScore < homeScore ? 1 : 0),
        goalsFor: s.goalsFor + awayScore,
        goalsAgainst: s.goalsAgainst + homeScore,
        points: s.points + (awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0),
      };
    }
    return s;
  });
}
