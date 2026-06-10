"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Team } from "@/types";

export function useTeams() {
  const teams = useLiveQuery(() => db.teams.orderBy("createdAt").reverse().toArray()) ?? [];

  const addTeam = async (data: Omit<Team, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    return db.teams.add({
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateTeam = async (id: string, data: Partial<Omit<Team, "id" | "createdAt">>) => {
    await db.teams.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteTeam = async (id: string) => {
    await db.teams.delete(id);
  };

  return { teams, addTeam, updateTeam, deleteTeam };
}

export function useTeam(id: string) {
  return useLiveQuery(() => db.teams.get(id), [id]);
}
