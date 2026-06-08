"use client";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLocale(locale === "zh" ? "en" : "zh")}
      className="text-sidebar-foreground/40 hover:text-sidebar-foreground/80 h-7 px-2 gap-1"
      title={locale === "zh" ? "Switch to English" : "切换到中文"}
    >
      <Languages className="h-3.5 w-3.5" />
      <span className="text-[10px] font-medium uppercase">{locale === "zh" ? "EN" : "中"}</span>
    </Button>
  );
}
