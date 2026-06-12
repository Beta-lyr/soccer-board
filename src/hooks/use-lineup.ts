"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { LineupTemplate } from "@/types";

const api = createApiClient<LineupTemplate>("lineupTemplates");

export function useLineupTemplates() {
  const { data: templates = [], isLoading, error } = useApiQuery(() => api.list({ orderBy: "createdAt" }), []);

  const addTemplate = useCallback(async (data: Omit<LineupTemplate, "id" | "createdAt" | "updatedAt">) => {
    return api.add(data);
  }, []);

  const updateTemplate = useCallback(async (id: string, data: Partial<Omit<LineupTemplate, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteTemplate = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  return { templates, isLoading, error, addTemplate, updateTemplate, deleteTemplate };
}
