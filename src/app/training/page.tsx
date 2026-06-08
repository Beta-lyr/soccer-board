import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function TrainingPage() {
  return (
    <>
      <Header
        title="训练管理"
        description="训练日程和出勤记录"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            新建训练
          </Button>
        }
      />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无训练安排</p>
          <p className="text-sm mt-1">点击「新建训练」添加日程</p>
        </div>
      </div>
    </>
  );
}
