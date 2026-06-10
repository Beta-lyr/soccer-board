"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 通用 API 查询 hook — 替代 dexie-react-hooks 的 useLiveQuery
 * 轮询间隔 30s，支持手动 refetch
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = [], pollInterval = 30000): T {
  const [data, setData] = useState<T>(undefined as unknown as T);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      console.error("API query error:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, pollInterval);
    return () => clearInterval(timer);
  }, [...deps, fetchData, pollInterval]);

  return data;
}

/**
 * 手动 refetch 版本 — 返回 [data, refetch]
 */
export function useApiQueryWithRefetch<T>(fetcher: () => Promise<T>, deps: unknown[] = []): [T, () => Promise<void>] {
  const [data, setData] = useState<T>(undefined as unknown as T);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      console.error("API query error:", e);
    }
  }, []);

  useEffect(() => { refetch(); }, [...deps, refetch]);

  return [data, refetch];
}
