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
  const stateRef = useRef(state);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep ref in sync
  stateRef.current = state;

  // Load from IndexedDB on mount
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    console.log("[Timer] Loading state for match:", matchId);
    db.matchTimers.get(matchId).then((saved) => {
      if (cancelled) return;
      if (saved) {
        console.log("[Timer] Restored state:", saved);
        setState(saved);
        setMinute(Math.floor(getElapsed(saved) / 60000));
      } else {
        console.log("[Timer] No saved state found");
      }
    });
    return () => { cancelled = true; };
  }, [matchId]);

  // Tick every second when running
  useEffect(() => {
    if (state.isRunning) {
      console.log("[Timer] Starting tick, startedAt:", state.startedAt, "pausedElapsed:", state.pausedElapsed);
      tickRef.current = setInterval(() => {
        const current = stateRef.current;
        const elapsed = getElapsed(current);
        const min = Math.floor(elapsed / 60000);
        setMinute(min);
      }, 1000);
    } else {
      console.log("[Timer] Stopped tick");
    }
    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [state.isRunning]);

  const save = useCallback(async (next: MatchTimerState) => {
    console.log("[Timer] Saving:", next);
    setState(next);
    await db.matchTimers.put(next);
  }, []);

  const start = useCallback(async () => {
    const current = stateRef.current;
    console.log("[Timer] Start clicked, current state:", current);
    await save({ ...current, startedAt: Date.now(), isRunning: true });
  }, [save]);

  const pause = useCallback(async () => {
    const current = stateRef.current;
    const elapsed = getElapsed(current);
    console.log("[Timer] Pause clicked, elapsed:", elapsed);
    await save({ ...current, pausedElapsed: elapsed, startedAt: 0, isRunning: false });
  }, [save]);

  const reset = useCallback(async () => {
    console.log("[Timer] Reset clicked");
    if (tickRef.current) clearInterval(tickRef.current);
    await save({ matchId, ...DEFAULT });
    setMinute(0);
  }, [matchId, save]);

  return { minute, isRunning: state.isRunning, start, pause, reset };
}
