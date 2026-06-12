"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Player, PlayerAbilities, PlayerStatus, PreferredFoot, Match, Training, Team, LineupTemplate } from "@/types";

const api = createApiClient<Player>("players");
const matchesApi = createApiClient<Match>("matches");
const trainingsApi = createApiClient<Training>("trainings");
const teamsApi = createApiClient<Team>("teams");
const lineupsApi = createApiClient<LineupTemplate>("lineupTemplates");

export function usePlayers() {
  const { data: players = [], isLoading, error } = useApiQuery(() => api.list({ orderBy: "createdAt" }), []);

  const addPlayer = useCallback(async (data: {
    name: string;
    number: number;
    height?: number;
    weight?: number;
    preferredFoot: PreferredFoot;
    positions: string[];
    status: PlayerStatus;
    abilities: PlayerAbilities;
    avatar?: string;
  }) => {
    await api.add(data as Omit<Player, "id" | "createdAt" | "updatedAt">);
  }, []);

  const updatePlayer = useCallback(async (id: string, data: Partial<Omit<Player, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  /**
   * 删除球员并清理关联数据
   * - 从所有比赛阵容中移除
   * - 从所有比赛事件中移除
   * - 从所有训练考勤中移除
   * - 从所有队伍成员中移除
   * - 从所有阵容模板中移除
   */
  const deletePlayer = useCallback(async (id: string) => {
    // 并行获取所有关联数据
    const [matches, trainings, teams, lineups] = await Promise.all([
      matchesApi.list(),
      trainingsApi.list(),
      teamsApi.list(),
      lineupsApi.list(),
    ]);

    // 清理比赛数据
    for (const match of matches) {
      const needsUpdate =
        match.lineup.some((l) => l.playerId === id) ||
        match.homeLineup?.some((l) => l.playerId === id) ||
        match.awayLineup?.some((l) => l.playerId === id) ||
        match.events.some((e) => e.playerId === id || e.relatedPlayerId === id) ||
        match.ratings.some((r) => r.playerId === id);

      if (needsUpdate) {
        await matchesApi.update(match.id, {
          lineup: match.lineup.filter((l) => l.playerId !== id),
          homeLineup: match.homeLineup?.filter((l) => l.playerId !== id),
          awayLineup: match.awayLineup?.filter((l) => l.playerId !== id),
          events: match.events.filter((e) => e.playerId !== id && e.relatedPlayerId !== id),
          ratings: match.ratings.filter((r) => r.playerId !== id),
        });
      }
    }

    // 清理训练考勤
    for (const training of trainings) {
      if (training.attendance?.some((a) => a.playerId === id)) {
        await trainingsApi.update(training.id, {
          attendance: training.attendance.filter((a) => a.playerId !== id),
        });
      }
    }

    // 清理队伍成员
    for (const team of teams) {
      if (team.playerIds.includes(id)) {
        await teamsApi.update(team.id, {
          playerIds: team.playerIds.filter((pid) => pid !== id),
        });
      }
    }

    // 清理阵容模板
    for (const lineup of lineups) {
      const needsUpdate =
        lineup.starters.some((s) => s.playerId === id) ||
        lineup.substitutes.includes(id);

      if (needsUpdate) {
        await lineupsApi.update(lineup.id, {
          starters: lineup.starters.filter((s) => s.playerId !== id),
          substitutes: lineup.substitutes.filter((pid) => pid !== id),
        });
      }
    }

    // 最后删除球员
    await api.remove(id);
  }, []);

  const getPlayer = useCallback(async (id: string) => {
    return api.get(id);
  }, []);

  return { players, isLoading, error, addPlayer, updatePlayer, deletePlayer, getPlayer };
}

export function usePlayer(id: string) {
  const { data: player, isLoading, error } = useApiQuery(() => api.get(id), [id]);
  return { player, isLoading, error };
}
