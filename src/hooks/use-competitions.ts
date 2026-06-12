"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Competition, Standing } from "@/types";

const api = createApiClient<Competition>("competitions");

export function useCompetitions() {
  const { data: competitions = [], isLoading, error } = useApiQuery(() => api.list({ orderBy: "createdAt" }), []);

  const addCompetition = useCallback(async (data: Omit<Competition, "id" | "createdAt" | "updatedAt">) => {
    return api.add(data);
  }, []);

  const updateCompetition = useCallback(async (id: string, data: Partial<Omit<Competition, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteCompetition = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  const addMatchToCompetition = useCallback(async (competitionId: string, matchId: string) => {
    const comp = await api.get(competitionId);
    if (!comp) return;
    const matchIds = [...new Set([...comp.matchIds, matchId])];
    await api.update(competitionId, { matchIds });
  }, []);

  return { competitions, isLoading, error, addCompetition, updateCompetition, deleteCompetition, addMatchToCompetition };
}

export function useCompetition(id: string) {
  const { data: competition, isLoading, error } = useApiQuery(() => api.get(id), [id]);
  return { competition, isLoading, error };
}

// ── 赛程生成工具函数（纯计算，不涉及 API） ──

export function generateRoundRobinSchedule(teams: string[]): [string, string][] {
  const n = teams.length;
  if (n < 2) return [];
  const list = n % 2 === 0 ? [...teams] : [...teams, "BYE"];
  const count = list.length;
  const rounds: [string, string][] = [];
  for (let round = 0; round < count - 1; round++) {
    for (let i = 0; i < count / 2; i++) {
      const home = list[i], away = list[count - 1 - i];
      if (home !== "BYE" && away !== "BYE") rounds.push([home, away]);
    }
    const last = list.pop()!;
    list.splice(1, 0, last);
  }
  return rounds;
}

export function generateMultiRoundRobinSchedule(teams: string[], rounds: number): { home: string; away: string; round: number }[] {
  const single = generateRoundRobinSchedule(teams);
  const result: { home: string; away: string; round: number }[] = [];
  for (let r = 0; r < rounds; r++) {
    for (const [home, away] of single) {
      result.push(r % 2 === 0 ? { home, away, round: r + 1 } : { home: away, away: home, round: r + 1 });
    }
  }
  return result;
}

export function generateKnockoutBracket(teams: string[]): [string, string][] {
  const n = Math.ceil(Math.log2(teams.length));
  const size = Math.pow(2, n);
  const padded = [...teams];
  while (padded.length < size) padded.push("BYE");
  const bracket: [string, string][] = [];
  for (let i = 0; i < size; i += 2) bracket.push([padded[i], padded[i + 1]]);
  return bracket;
}

export function generateGroups(teams: string[], groupCount: number): { name: string; teams: string[] }[] {
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  const groups: { name: string; teams: string[] }[] = [];
  for (let i = 0; i < groupCount; i++) groups.push({ name: `${String.fromCharCode(65 + i)}组`, teams: [] });
  shuffled.forEach((team, idx) => groups[idx % groupCount].teams.push(team));
  return groups;
}

export function initStandings(teams: string[]): Standing[] {
  return teams.map((team) => ({ team, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 }));
}

export function updateStanding(standings: Standing[], homeTeam: string, awayTeam: string, homeScore: number, awayScore: number): Standing[] {
  return standings.map((s) => {
    if (s.team === homeTeam) {
      return { ...s, played: s.played + 1, wins: s.wins + (homeScore > awayScore ? 1 : 0), draws: s.draws + (homeScore === awayScore ? 1 : 0), losses: s.losses + (homeScore < awayScore ? 1 : 0), goalsFor: s.goalsFor + homeScore, goalsAgainst: s.goalsAgainst + awayScore, points: s.points + (homeScore > awayScore ? 3 : homeScore === awayScore ? 1 : 0) };
    }
    if (s.team === awayTeam) {
      return { ...s, played: s.played + 1, wins: s.wins + (awayScore > homeScore ? 1 : 0), draws: s.draws + (homeScore === awayScore ? 1 : 0), losses: s.losses + (awayScore < homeScore ? 1 : 0), goalsFor: s.goalsFor + awayScore, goalsAgainst: s.goalsAgainst + homeScore, points: s.points + (awayScore > homeScore ? 3 : homeScore === awayScore ? 1 : 0) };
    }
    return s;
  });
}
