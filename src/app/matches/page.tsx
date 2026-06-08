import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function MatchesPage() {
  return (
    <>
      <Header
        title="比赛管理"
        description="赛程记录和比赛事件"
        actions={
          <Link href="/matches/new/">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新建比赛
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无比赛记录</p>
          <p className="text-sm mt-1">点击「新建比赛」开始记录</p>
        </div>
      </div>
    </>
  );
}
