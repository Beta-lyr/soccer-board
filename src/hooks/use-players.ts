"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Player, PlayerAbilities, PlayerStatus, PreferredFoot } from "@/types";

const api = createApiClient<Player>("players");

export function usePlayers() {
  const players = useApiQuery(() => api.list({ orderBy: "createdAt" }), []) ?? [];

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

  const deletePlayer = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  const getPlayer = useCallback(async (id: string) => {
    return api.get(id);
  }, []);

  return { players, addPlayer, updatePlayer, deletePlayer, getPlayer };
}

export function usePlayer(id: string) {
  const player = useApiQuery(() => api.get(id), [id]);
  return player;
}
