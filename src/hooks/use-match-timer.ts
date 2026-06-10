"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "@/lib/db";
import type { MatchTimerState } from "@/lib/db";

const DEFAULT: Omit<MatchTimerState, "matchId"> = {
  startedAt: 0,
  pausedElapsed: 0,
  isRunning: false,
};

function getElapsed(state: MatchTimerState): number {
  const base = state.pausedElapsed;
  if (state.isRunning && state.startedAt > 0) {
    return base + (Date.now() - state.startedAt);
  }
  return base;
}

export function useMatchTimer(matchId: string) {
  const [state, setState] = useState<MatchTimerState>({ matchId, ...DEFAULT });
  const [minute, setMinute] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    db.matchTimers.get(matchId).then((saved) => {
      if (cancelled) return;
      if (saved) {
        setState(saved);
        setMinute(Math.floor(getElapsed(saved) / 60000));
      }
    });
    return () => { cancelled = true; };
  }, [matchId]);

  // Tick every second when running
  useEffect(() => {
    if (state.isRunning) {
      tickRef.current = setInterval(() => {
        setMinute(Math.floor(getElapsed(state) / 60000));
      }, 1000);
    }
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [state.isRunning, state.startedAt, state.pausedElapsed]);

  const save = useCallback(async (next: MatchTimerState) => {
    setState(next);
    await db.matchTimers.put(next);
  }, []);

  const start = useCallback(async () => {
    await save({ ...state, startedAt: Date.now(), isRunning: true });
  }, [state, save]);

  const pause = useCallback(async () => {
    const elapsed = getElapsed(state);
    await save({ ...state, pausedElapsed: elapsed, startedAt: 0, isRunning: false });
  }, [state, save]);

  const reset = useCallback(async () => {
    if (tickRef.current) clearInterval(tickRef.current);
    await save({ matchId, ...DEFAULT });
    setMinute(0);
  }, [matchId, save]);

  return { minute, isRunning: state.isRunning, start, pause, reset };
}
