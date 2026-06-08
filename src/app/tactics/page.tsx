import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export default function TacticsPage() {
  return (
    <>
      <Header
        title="战术板"
        description="管理和创建战术方案"
        actions={
          <Link href="/tactics/new/">
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              新建战术
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无战术方案</p>
          <p className="text-sm mt-1">点击「新建战术」开始创建</p>
        </div>
      </div>
    </>
  );
}
