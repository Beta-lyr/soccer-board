"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { LineupTemplate } from "@/types";

export function useLineupTemplates() {
  const templates = useLiveQuery(() => db.lineupTemplates.orderBy("createdAt").reverse().toArray()) ?? [];

  const addTemplate = async (data: Omit<LineupTemplate, "id" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    await db.lineupTemplates.add({
      id: crypto.randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateTemplate = async (id: string, data: Partial<Omit<LineupTemplate, "id" | "createdAt">>) => {
    await db.lineupTemplates.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteTemplate = async (id: string) => {
    await db.lineupTemplates.delete(id);
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}
