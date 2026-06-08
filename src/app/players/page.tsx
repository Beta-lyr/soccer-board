import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";

export default function PlayersPage() {
  return (
    <>
      <Header
        title="球员管理"
        description="管理球队球员档案"
        actions={
          <div className="flex gap-2">
            <Link href="/players/import/">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                批量导入
              </Button>
            </Link>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              添加球员
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无球员数据</p>
          <p className="text-sm mt-1">点击「添加球员」或「批量导入」开始</p>
        </div>
      </div>
    </>
  );
}
