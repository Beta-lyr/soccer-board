"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { useI18n } from "@/lib/i18n";

export default function CalendarPage() {
  const { t } = useI18n();
  return (
    <PageTransition>
      <Header title={t("calendar.title")} description={t("calendar.desc")} />
      <div className="flex-1 p-4 md:p-6 text-center text-muted-foreground">
        <p className="text-lg">{t("calendar.developing")}</p>
      </div>
    </PageTransition>
  );
}
