"use client";

import { Header } from "@/components/layout/header";
import { PageTransition } from "@/components/layout/page-transition";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";

export default function MatchesPage() {
  const { t } = useI18n();
  return (
    <PageTransition>
      <Header
        title={t("matches.title")}
        description={t("matches.desc")}
        actions={
          <Link href="/matches/new/">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t("matches.newMatch")}
            </Button>
          </Link>
        }
      />
      <div className="flex-1 p-4 md:p-6 text-center text-muted-foreground">
        <p className="text-lg">{t("matches.noMatches")}</p>
      </div>
    </PageTransition>
  );
}
