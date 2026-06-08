import { Header } from "@/components/layout/header";

export default function StatsPage() {
  return (
    <>
      <Header title="数据统计" description="球员和球队数据分析" />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">暂无统计数据</p>
          <p className="text-sm mt-1">添加球员和比赛记录后自动生成</p>
        </div>
      </div>
    </>
  );
}
