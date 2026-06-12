"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Team } from "@/types";

const api = createApiClient<Team>("teams");

export function useTeams() {
  const { data: teams = [], isLoading, error } = useApiQuery(() => api.list({ orderBy: "createdAt" }), []);

  const addTeam = useCallback(async (data: Omit<Team, "id" | "createdAt" | "updatedAt">) => {
    return api.add(data);
  }, []);

  const updateTeam = useCallback(async (id: string, data: Partial<Omit<Team, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteTeam = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  return { teams, isLoading, error, addTeam, updateTeam, deleteTeam };
}

export function useTeam(id: string) {
  const { data: team, isLoading, error } = useApiQuery(() => api.get(id), [id]);
  return { team, isLoading, error };
}
