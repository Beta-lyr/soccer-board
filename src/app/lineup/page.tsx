import { Header } from "@/components/layout/header";

export default function LineupPage() {
  return (
    <>
      <Header title="阵容管理" description="设置首发阵容和替补" />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">阵容管理开发中</p>
          <p className="text-sm mt-1">支持拖拽设置首发 11 人和替补排序</p>
        </div>
      </div>
    </>
  );
}
