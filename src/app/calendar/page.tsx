import { Header } from "@/components/layout/header";

export default function CalendarPage() {
  return (
    <>
      <Header title="日程日历" description="月视图查看所有安排" />
      <div className="flex-1 p-6">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">日历开发中</p>
          <p className="text-sm mt-1">月视图展示比赛、训练和其他事件</p>
        </div>
      </div>
    </>
  );
}
