import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { I18nProvider } from "@/lib/i18n";
import { LangUpdater } from "@/components/layout/lang-updater";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Soccer Board — 足球队管理系统",
  description: "大学足球队战术画板、球员管理、比赛记录",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        <I18nProvider>
          <LangUpdater />
          <AppShell>{children}</AppShell>
          <Toaster richColors position="top-center" />
        </I18nProvider>
      </body>
    </html>
  );
}
