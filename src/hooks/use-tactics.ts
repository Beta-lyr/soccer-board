"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Tactic } from "@/types";

const api = createApiClient<Tactic>("tactics");

export function useTactics() {
  const tactics = useApiQuery(() => api.list({ orderBy: "createdAt" }), []) ?? [];

  const addTactic = useCallback(async (data: Omit<Tactic, "id" | "createdAt" | "updatedAt">) => {
    return api.add(data);
  }, []);

  const updateTactic = useCallback(async (id: string, data: Partial<Omit<Tactic, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteTactic = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  return { tactics, addTactic, updateTactic, deleteTactic };
}

export function useTactic(id: string) {
  return useApiQuery(() => api.get(id), [id]);
}
