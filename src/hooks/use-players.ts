"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Player, PlayerAbilities, PlayerStatus, PreferredFoot } from "@/types";

function generateId() {
  return crypto.randomUUID();
}

export function usePlayers() {
  const players = useLiveQuery(() => db.players.orderBy("number").toArray()) ?? [];

  const addPlayer = async (data: {
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
    const now = new Date().toISOString();
    await db.players.add({
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updatePlayer = async (id: string, data: Partial<Omit<Player, "id" | "createdAt">>) => {
    await db.players.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const deletePlayer = async (id: string) => {
    await db.players.delete(id);
  };

  const getPlayer = async (id: string) => {
    return db.players.get(id);
  };

  return { players, addPlayer, updatePlayer, deletePlayer, getPlayer };
}

export function usePlayer(id: string) {
  const player = useLiveQuery(() => db.players.get(id), [id]);
  return player;
}
