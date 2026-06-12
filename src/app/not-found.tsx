"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <div className="text-8xl font-black text-muted-foreground/20">404</div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">页面不存在</h1>
          <p className="text-muted-foreground">你访问的页面不存在或已被移除</p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-1" />
              返回首页
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回上页
          </Button>
        </div>
      </div>
    </div>
  );
}
