"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <>
      {!isLanding && <Sidebar />}
      <main className={!isLanding ? "md:ml-56 pt-12 md:pt-0 flex-1 flex flex-col min-h-screen" : "flex-1 flex flex-col min-h-screen"}>
        {children}
      </main>
    </>
  );
}
