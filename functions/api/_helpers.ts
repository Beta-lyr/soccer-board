/**
 * Cloudflare Pages Functions 通用 CRUD helper
 * 用法: const handler = createCrudHandler("players", ["name", "number", "status", "createdAt"]);
 */

export interface Env {
  DB: D1Database;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

/** 创建通用 CRUD handler */
export function createCrudHandler(
  table: string,
  indexedColumns: string[] = []
) {
  // JSON 字段列表（读取时需要 parse，写入时需要 stringify）
  const jsonFields: Record<string, string[]> = {
    players: ["positions", "abilities"],
    tactics: ["players", "drawings"],
    lineup_templates: ["starters", "substitutes"],
    matches: ["homeLineup", "awayLineup", "lineup", "score", "events", "ratings"],
    competitions: ["teams", "matchIds", "standings", "groups"],
    teams: ["playerIds"],
    trainings: ["attendance"],
  };
  const jsonCols = jsonFields[table] ?? [];

  function parseRow(row: Record<string, unknown>) {
    if (!row) return row;
    for (const col of jsonCols) {
      if (typeof row[col] === "string") {
        try { row[col] = JSON.parse(row[col] as string); } catch { /* keep as string */ }
      }
    }
    return row;
  }

  function stringifyRow(data: Record<string, unknown>) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && typeof value === "object" && !(value instanceof Date)) {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return {
    /** GET /api/{table} — 列表查询 */
    async onRequestGet(context: { request: Request; env: Env }) {
      const { env, request } = context;
      const url = new URL(request.url);
      const orderBy = url.searchParams.get("orderBy") || "createdAt";
      const limit = url.searchParams.get("limit");
      const competitionId = url.searchParams.get("competitionId");

      let query = `SELECT * FROM ${table}`;
      const params: unknown[] = [];

      // 简单过滤
      if (competitionId && indexedColumns.includes("competitionId")) {
        query += ` WHERE competitionId = ?`;
        params.push(competitionId);
      }

      if (indexedColumns.includes(orderBy)) {
        query += ` ORDER BY ${orderBy} DESC`;
      }

      if (limit) {
        query += ` LIMIT ?`;
        params.push(parseInt(limit));
      }

      try {
        const { results } = await env.DB.prepare(query).bind(...params).all();
        return json((results ?? []).map(parseRow));
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    },

    /** POST /api/{table} — 创建 */
    async onRequestPost(context: { request: Request; env: Env }) {
      const { env, request } = context;
      try {
        const body = await request.json() as Record<string, unknown>;
        const id = (body.id as string) || crypto.randomUUID();
        const now = new Date().toISOString();
        const data = stringifyRow({ ...body, id, createdAt: now, updatedAt: now });

        const columns = Object.keys(data);
        const placeholders = columns.map(() => "?").join(", ");
        const values = Object.values(data);

        await env.DB.prepare(
          `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`
        ).bind(...values).run();

        return json({ id });
      } catch (e) {
        return json({ error: String(e) }, 500);
      }
    },

    /** GET /api/{table}/[id] — 单条查询 */
    async getOne(env: Env, id: string) {
      const row = await env.DB.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
      if (!row) return json({ error: "Not found" }, 404);
      return json(parseRow(row as Record<string, unknown>));
    },

    /** PUT /api/{table}/[id] — 更新 */
    async updateOne(env: Env, id: string, body: Record<string, unknown>) {
      const data = stringifyRow(body);
      delete data.id;
      delete data.createdAt;
      data.updatedAt = new Date().toISOString();

      const sets = Object.keys(data).map((k) => `${k} = ?`).join(", ");
      const values = [...Object.values(data), id];

      await env.DB.prepare(`UPDATE ${table} SET ${sets} WHERE id = ?`).bind(...values).run();
      return json({ ok: true });
    },

    /** DELETE /api/{table}/[id] — 删除 */
    async deleteOne(env: Env, id: string) {
      await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    },
  };
}
