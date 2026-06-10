"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Training } from "@/types";

const api = createApiClient<Training>("trainings");

export function useTrainings() {
  const trainings = useApiQuery(() => api.list({ orderBy: "date" }), []) ?? [];

  const addTraining = useCallback(async (data: Omit<Training, "id" | "createdAt" | "updatedAt">) => {
    return api.add(data);
  }, []);

  const updateTraining = useCallback(async (id: string, data: Partial<Omit<Training, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteTraining = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  return { trainings, addTraining, updateTraining, deleteTraining };
}
