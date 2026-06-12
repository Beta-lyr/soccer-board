/**
 * 通用 API 客户端 — 调用 Cloudflare Functions，本地开发回退到 Dexie
 */

import Dexie, { type Table } from "dexie";
import { emitRefresh } from "./refresh-bus";

type TableName = "players" | "tactics" | "lineupTemplates" | "matches" | "competitions" | "teams" | "trainings";

// ── 本地 IndexedDB 兜底（与 D1 schema 对齐） ──

class LocalDB extends Dexie {
  players!: Table;
  tactics!: Table;
  lineupTemplates!: Table;
  matches!: Table;
  competitions!: Table;
  teams!: Table;
  trainings!: Table;

  constructor() {
    super("soccer-board-local");
    this.version(1).stores({
      players: "id, name, number, status, createdAt",
      tactics: "id, name, type, formation, createdAt",
      lineupTemplates: "id, name, formation, createdAt",
      matches: "id, date, opponent, status, type, scope, competitionId, createdAt",
      competitions: "id, name, type, createdAt",
      teams: "id, name, createdAt",
      trainings: "id, date, theme, createdAt",
    });
  }
}

const localDb = new LocalDB();
let useLocal = false; // 运行时检测，API 不可用时切换

// ── 离线状态订阅 ──
type OfflineListener = (offline: boolean) => void;
const offlineListeners = new Set<OfflineListener>();

export function onOfflineChange(listener: OfflineListener): () => void {
  offlineListeners.add(listener);
  listener(useLocal); // 立即同步当前状态
  return () => offlineListeners.delete(listener);
}

function setOffline(value: boolean) {
  if (useLocal !== value) {
    useLocal = value;
    offlineListeners.forEach((fn) => fn(value));
  }
}

export function isOffline(): boolean {
  return useLocal;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

/** 首次请求检测 API 是否可用，不可用则切到本地模式 */
async function ensureMode() {
  if (useLocal) return;
  try {
    await request("/api/players?limit=1");
  } catch {
    console.warn("[soccer-board] API 不可用，回退到本地 IndexedDB");
    setOffline(true);
  }
}

export function createApiClient<T extends { id: string }>(table: TableName) {
  const base = `/api/${table}`;
  const getTable = () => localDb.table(table);

  return {
    async list(params?: Record<string, string>): Promise<T[]> {
      await ensureMode();
      if (useLocal) {
        const col = getTable().toCollection();
        const items = await col.toArray();
        // 简单排序
        const orderBy = params?.orderBy;
        if (orderBy) {
          items.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
            const va = a[orderBy] ?? "", vb = b[orderBy] ?? "";
            return String(vb).localeCompare(String(va));
          });
        }
        const limit = params?.limit ? parseInt(params.limit) : undefined;
        return (limit ? items.slice(0, limit) : items) as T[];
      }
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<T[]>(`${base}${qs}`);
    },

    async get(id: string): Promise<T | undefined> {
      await ensureMode();
      if (useLocal) return getTable().get(id) as Promise<T | undefined>;
      return request<T | undefined>(`${base}/${id}`);
    },

    async add(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<string> {
      await ensureMode();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      if (useLocal) {
        await getTable().add({ ...data, id, createdAt: now, updatedAt: now });
        emitRefresh();
        return id;
      }
      const result = await request<{ id: string }>(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      emitRefresh();
      return result.id;
    },

    async update(id: string, data: Partial<T>): Promise<void> {
      await ensureMode();
      if (useLocal) {
        await getTable().update(id, { ...data, updatedAt: new Date().toISOString() });
        emitRefresh();
        return;
      }
      await request(`${base}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      emitRefresh();
    },

    async remove(id: string): Promise<void> {
      await ensureMode();
      if (useLocal) {
        await getTable().delete(id);
        emitRefresh();
        return;
      }
      await request(`${base}/${id}`, { method: "DELETE" });
      emitRefresh();
    },
  };
}
