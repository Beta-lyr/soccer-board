"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface TimerState {
  startedAt: number;
  pausedElapsed: number;
  isRunning: boolean;
}

const STORAGE_KEY = "match-timer-";
const DEFAULT: TimerState = { startedAt: 0, pausedElapsed: 0, isRunning: false };

function getElapsed(state: TimerState): number {
  const base = state.pausedElapsed;
  if (state.isRunning && state.startedAt > 0) return base + (Date.now() - state.startedAt);
  return base;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function loadState(matchId: string): TimerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY + matchId);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT;
}

function saveState(matchId: string, state: TimerState) {
  localStorage.setItem(STORAGE_KEY + matchId, JSON.stringify(state));
}

export function useMatchTimer(matchId: string) {
  const [state, setState] = useState<TimerState>(() => loadState(matchId));
  const [elapsed, setElapsed] = useState(() => getElapsed(loadState(matchId)));
  const stateRef = useRef(state);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  stateRef.current = state;

  useEffect(() => {
    if (state.isRunning) {
      tickRef.current = setInterval(() => setElapsed(getElapsed(stateRef.current)), 1000);
    }
    return () => { if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; } };
  }, [state.isRunning]);

  const save = useCallback((next: TimerState) => {
    setState(next);
    saveState(matchId, next);
  }, [matchId]);

  const start = useCallback(() => save({ ...stateRef.current, startedAt: Date.now(), isRunning: true }), [save]);
  const pause = useCallback(() => save({ ...stateRef.current, pausedElapsed: getElapsed(stateRef.current), startedAt: 0, isRunning: false }), [save]);
  const reset = useCallback(() => { if (tickRef.current) clearInterval(tickRef.current); save({ ...DEFAULT }); setElapsed(0); }, [save]);

  return { displayTime: formatTime(elapsed), minute: Math.floor(elapsed / 60000), isRunning: state.isRunning, start, pause, reset };
}
