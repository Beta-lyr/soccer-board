"use client";

import { useCallback } from "react";
import { createApiClient } from "@/lib/api";
import { useApiQuery } from "./use-api-query";
import type { Match, MatchEvent, MatchRating, MatchStatus } from "@/types";

const api = createApiClient<Match>("matches");

export function useMatches() {
  const matches = useApiQuery(() => api.list({ orderBy: "date" }), []) ?? [];

  const addMatch = useCallback(async (data: Omit<Match, "id" | "createdAt" | "updatedAt" | "events" | "ratings">) => {
    const id = await api.add({ ...data, events: [], ratings: [] } as Omit<Match, "id" | "createdAt" | "updatedAt">);
    return id;
  }, []);

  const updateMatch = useCallback(async (id: string, data: Partial<Omit<Match, "id" | "createdAt">>) => {
    await api.update(id, data);
  }, []);

  const deleteMatch = useCallback(async (id: string) => {
    await api.remove(id);
  }, []);

  const addEvent = useCallback(async (matchId: string, event: Omit<MatchEvent, "id" | "timestamp">) => {
    const match = await api.get(matchId);
    if (!match) return;
    const newEvent: MatchEvent = { id: crypto.randomUUID(), ...event, timestamp: new Date().toISOString() };
    await api.update(matchId, { events: [...match.events, newEvent] });
  }, []);

  const removeEvent = useCallback(async (matchId: string, eventId: string) => {
    const match = await api.get(matchId);
    if (!match) return;
    await api.update(matchId, { events: match.events.filter((e) => e.id !== eventId) });
  }, []);

  const updateRatings = useCallback(async (matchId: string, ratings: MatchRating[]) => {
    await api.update(matchId, { ratings });
  }, []);

  const finishMatch = useCallback(async (matchId: string, score: { home: number; away: number }) => {
    await api.update(matchId, { status: "finished" as MatchStatus, score });
  }, []);

  return { matches, addMatch, updateMatch, deleteMatch, addEvent, removeEvent, updateRatings, finishMatch };
}

export function useMatch(id: string) {
  return useApiQuery(() => api.get(id), [id]);
}
