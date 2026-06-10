"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import type { Match, MatchEvent, MatchRating, MatchStatus } from "@/types";

export function useMatches() {
  const matches = useLiveQuery(() => db.matches.orderBy("date").reverse().toArray()) ?? [];

  const addMatch = async (data: Omit<Match, "id" | "createdAt" | "updatedAt" | "events" | "ratings">) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db.matches.add({
      id,
      ...data,
      events: [],
      ratings: [],
      createdAt: now,
      updatedAt: now,
    });
    return id;
  };

  const updateMatch = async (id: string, data: Partial<Omit<Match, "id" | "createdAt">>) => {
    await db.matches.update(id, { ...data, updatedAt: new Date().toISOString() });
  };

  const deleteMatch = async (id: string) => {
    await db.matches.delete(id);
  };

  const addEvent = async (matchId: string, event: Omit<MatchEvent, "id" | "timestamp">) => {
    const match = await db.matches.get(matchId);
    if (!match) return;
    const newEvent: MatchEvent = {
      id: crypto.randomUUID(),
      ...event,
      timestamp: new Date().toISOString(),
    };
    await db.matches.update(matchId, {
      events: [...match.events, newEvent],
      updatedAt: new Date().toISOString(),
    });
  };

  const removeEvent = async (matchId: string, eventId: string) => {
    const match = await db.matches.get(matchId);
    if (!match) return;
    await db.matches.update(matchId, {
      events: match.events.filter((e) => e.id !== eventId),
      updatedAt: new Date().toISOString(),
    });
  };

  const updateRatings = async (matchId: string, ratings: MatchRating[]) => {
    await db.matches.update(matchId, {
      ratings,
      updatedAt: new Date().toISOString(),
    });
  };

  const finishMatch = async (matchId: string, score: { home: number; away: number }) => {
    await db.matches.update(matchId, {
      status: "finished" as MatchStatus,
      score,
      updatedAt: new Date().toISOString(),
    });
  };

  return { matches, addMatch, updateMatch, deleteMatch, addEvent, removeEvent, updateRatings, finishMatch };
}

export function useMatch(id: string) {
  const match = useLiveQuery(() => db.matches.get(id), [id]);
  return match;
}
