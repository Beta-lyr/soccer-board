"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onRefresh } from "@/lib/refresh-bus";

/**
 * 通用 API 查询 hook — 替代 dexie-react-hooks 的 useLiveQuery
 * - 30s 轮询兜底
 * - mutation 后通过 refresh bus 立即 refetch
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
    // 轮询兜底
    const timer = setInterval(fetchData, pollInterval);
    // mutation 后立即刷新
    const unsub = onRefresh(fetchData);
    return () => { clearInterval(timer); unsub(); };
  }, [...deps, fetchData, pollInterval]);

  return data;
}
