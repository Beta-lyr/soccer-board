"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { OfflineBanner } from "./offline-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const isLogin = pathname === "/login/";

  // 首页和登录页不需要侧边栏（auth 由 Cloudflare _middleware.ts 强制）
  const showSidebar = !isLanding && !isLogin;

  return (
    <>
      {showSidebar && <Sidebar />}
      <main className={showSidebar ? "md:ml-56 pt-12 md:pt-0 flex-1 flex flex-col min-h-screen" : "flex-1 flex flex-col min-h-screen"}>
        <OfflineBanner />
        {children}
      </main>
    </>
  );
}
