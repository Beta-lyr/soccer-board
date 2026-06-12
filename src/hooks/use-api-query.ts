"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { onRefresh } from "@/lib/refresh-bus";
import { toast } from "sonner";

interface UseApiQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 通用 API 查询 hook — 替代 dexie-react-hooks 的 useLiveQuery
 * - 30s 轮询兜底
 * - mutation 后通过 refresh bus 立即 refetch
 * - 暴露 loading/error 状态
 */
export function useApiQuery<T>(fetcher: () => Promise<T>, deps: unknown[] = [], pollInterval = 30000): UseApiQueryResult<T> {
  const [data, setData] = useState<T>(undefined as unknown as T);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const isFirstFetch = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      if (isFirstFetch.current) {
        setIsLoading(true);
      }
      const result = await fetcherRef.current();
      setData(result);
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      console.error("API query error:", e);
      // 首次加载失败时显示 toast
      if (isFirstFetch.current) {
        toast.error("数据加载失败", {
          description: err.message || "请检查网络连接后重试",
          duration: 5000,
        });
      }
    } finally {
      isFirstFetch.current = false;
      setIsLoading(false);
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

  return { data, isLoading, error, refetch: fetchData };
}

/**
 * 兼容旧用法的简单版本，只返回数据
 */
export function useApiQuerySimple<T>(fetcher: () => Promise<T>, deps: unknown[] = [], pollInterval = 30000): T {
  const { data } = useApiQuery(fetcher, deps, pollInterval);
  return data;
}
