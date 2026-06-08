"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function TrainingPage() {
  const { t } = useI18n();
  return (
    <PageTransition>
      <Header
        title={t("training.title")}
        description={t("training.desc")}
        actions={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t("training.newTraining")}
          </Button>
        }
      />
      <div className="flex-1 p-4 md:p-6 text-center text-muted-foreground">
        <p className="text-lg">{t("training.noTraining")}</p>
      </div>
    </PageTransition>
  );
}
