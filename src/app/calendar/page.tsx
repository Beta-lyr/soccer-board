"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { useMatches } from "@/hooks/use-matches";
import { useTrainings } from "@/hooks/use-trainings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

export default function CalendarPage() {
  const { t } = useI18n();
  const [currentDate, setCurrentDate] = useState(new Date());
  const { matches } = useMatches();
  const { trainings } = useTrainings();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7; // 周一为起始
    const totalDays = lastDay.getDate();

    const result: { day: number; events: { type: string; label: string; href: string }[] }[] = [];

    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const dayMatches = matches.filter((m) => m.date.startsWith(dateStr));
      const dayTrainings = trainings.filter((tr) => tr.date === dateStr);
      const events = [
        ...dayMatches.map((m) => ({ type: "match", label: `vs ${m.opponent}`, href: `/matches/detail/?id=${m.id}` })),
        ...dayTrainings.map((tr) => ({ type: "training", label: tr.location, href: `/training/` })),
      ];
      result.push({ day: i, events });
    }

    return { startOffset, days: result };
  }, [year, month, matches, trainings]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <PageTransition>
      <Header title={t("calendar.title")} description={t("calendar.desc")} />
      <div className="flex-1 p-4 md:p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base">{year} 年 {month + 1} 月</CardTitle>
              <Button variant="ghost" size="sm" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>

            {/* 日期格子 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 空白占位 */}
              {Array.from({ length: days.startOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px]" />
              ))}

              {days.days.map((d) => {
                const isToday =
                  d.day === new Date().getDate() &&
                  month === new Date().getMonth() &&
                  year === new Date().getFullYear();

                return (
                  <motion.div
                    key={d.day}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: d.day * 0.01 }}
                    className={`min-h-[80px] md:min-h-[100px] p-1.5 rounded-lg border text-sm ${
                      isToday ? "bg-primary/5 border-primary/30" : "bg-card"
                    }`}
                  >
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {d.day}
                    </div>
                    <div className="space-y-0.5">
                      {d.events.slice(0, 3).map((evt, i) => (
                        <Link key={i} href={evt.href}>
                          <div className={`text-[10px] px-1 py-0.5 rounded truncate ${
                            evt.type === "match" ? "bg-red-500/15 text-red-600" : "bg-blue-500/15 text-blue-600"
                          }`}>
                            {evt.type === "match" ? "⚽" : "🏃"} {evt.label}
                          </div>
                        </Link>
                      ))}
                      {d.events.length > 3 && (
                        <div className="text-[10px] text-muted-foreground px-1">+{d.events.length - 3} 更多</div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 图例 */}
            <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/15" />比赛</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-500/15" />训练</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
