"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

/**
 * Cloudflare Pages Functions 认证 hook
 *
 * 认证流程：
 *   _middleware.ts → 无 session cookie → 302 重定向到 /login/
 *   POST /api/auth/login → 验证密码 → 签发 HMAC session cookie (7天 HttpOnly)
 *   POST /api/auth/logout → 清除 cookie
 *
 * 注意：session cookie 是 HttpOnly，JS 无法读取。认证由 Cloudflare Edge Middleware 强制。
 * 此 hook 只封装 login/logout API 调用，本地 dev 需配合 wrangler 或保留 middleware fallback。
 */
export function useAuth() {
  const router = useRouter();

  const login = useCallback(
    async (password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          return { success: true };
        }
        const data = await res.json().catch(() => ({}));
        return { success: false, error: (data as Record<string, string>).error || "密码错误" };
      } catch {
        // 本地开发时 API 可能不存在（没有 wrangler），回退到 localStorage 模式
        return { success: false, error: "服务不可用，请确认已部署 Cloudflare Functions" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // 忽略网络错误
    }
    router.push("/login/");
  }, [router]);

  return { login, logout };
}
