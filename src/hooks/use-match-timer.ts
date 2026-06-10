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

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function useMatchTimer(matchId: string) {
  const [state, setState] = useState<MatchTimerState>({ matchId, ...DEFAULT });
  const [elapsed, setElapsed] = useState(0);
  const stateRef = useRef(state);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  stateRef.current = state;

  // Load from IndexedDB
  useEffect(() => {
    if (!matchId) return;
    let cancelled = false;
    db.matchTimers.get(matchId).then((saved) => {
      if (cancelled || !saved) return;
      setState(saved);
      setElapsed(getElapsed(saved));
    });
    return () => { cancelled = true; };
  }, [matchId]);

  // Tick every second
  useEffect(() => {
    if (state.isRunning) {
      tickRef.current = setInterval(() => {
        setElapsed(getElapsed(stateRef.current));
      }, 1000);
    }
    return () => {
      if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    };
  }, [state.isRunning]);

  const save = useCallback(async (next: MatchTimerState) => {
    setState(next);
    await db.matchTimers.put(next);
  }, []);

  const start = useCallback(async () => {
    const current = stateRef.current;
    await save({ ...current, startedAt: Date.now(), isRunning: true });
  }, [save]);

  const pause = useCallback(async () => {
    const current = stateRef.current;
    const e = getElapsed(current);
    await save({ ...current, pausedElapsed: e, startedAt: 0, isRunning: false });
  }, [save]);

  const reset = useCallback(async () => {
    if (tickRef.current) clearInterval(tickRef.current);
    await save({ matchId, ...DEFAULT });
    setElapsed(0);
  }, [matchId, save]);

  return {
    displayTime: formatTime(elapsed),
    minute: Math.floor(elapsed / 60000),
    isRunning: state.isRunning,
    start, pause, reset,
  };
}
