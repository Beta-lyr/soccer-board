"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <AlertTriangle className="h-16 w-16 mx-auto text-destructive/60" />
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">出错了</h1>
          <p className="text-muted-foreground max-w-md">
            页面加载时发生了错误，请尝试刷新页面或返回首页
          </p>
          {error.message && (
            <p className="text-xs text-muted-foreground/60 font-mono mt-2">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCw className="h-4 w-4 mr-1" />
            重试
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-1" />
              返回首页
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
