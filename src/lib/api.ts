/**
 * 通用 API 客户端 — 替代 Dexie，调用 Cloudflare Functions
 */

type TableName = "players" | "tactics" | "lineupTemplates" | "matches" | "competitions" | "teams" | "trainings";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export function createApiClient<T extends { id: string }>(table: TableName) {
  const base = `/api/${table}`;

  return {
    /** 查询所有（支持 ?orderBy=xxx&limit=N） */
    async list(params?: Record<string, string>): Promise<T[]> {
      const qs = params ? "?" + new URLSearchParams(params).toString() : "";
      return request<T[]>(`${base}${qs}`);
    },

    /** 查询单个 */
    async get(id: string): Promise<T | undefined> {
      return request<T | undefined>(`${base}/${id}`);
    },

    /** 创建 */
    async add(data: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<string> {
      const result = await request<{ id: string }>(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return result.id;
    },

    /** 更新 */
    async update(id: string, data: Partial<T>): Promise<void> {
      await request(`${base}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },

    /** 删除 */
    async remove(id: string): Promise<void> {
      await request(`${base}/${id}`, { method: "DELETE" });
    },
  };
}
