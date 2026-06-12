"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="text-center space-y-6">
          <AlertTriangle className="h-16 w-16 mx-auto text-destructive/60" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">应用出错了</h1>
            <p className="text-muted-foreground max-w-md">
              应用发生了严重错误，请尝试刷新页面
            </p>
          </div>
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
        </div>
      </body>
    </html>
  );
}
