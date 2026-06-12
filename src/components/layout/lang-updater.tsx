"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n";

export function LangUpdater() {
  const { locale } = useI18n();

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : "zh-CN";
  }, [locale]);

  return null;
}
