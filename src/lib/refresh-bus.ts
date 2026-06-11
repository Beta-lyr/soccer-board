/**
 * 简单的事件总线 — mutation 后通知所有 useApiQuery refetch
 * 模拟 Dexie useLiveQuery 的响应式行为
 */

type Listener = () => void;

const listeners = new Set<Listener>();

export function onRefresh(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitRefresh() {
  listeners.forEach((fn) => fn());
}
