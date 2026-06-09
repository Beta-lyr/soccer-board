"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import zh from "@/locales/zh.json";
import en from "@/locales/en.json";

type Locale = "zh" | "en";

const LOCALES: Record<Locale, typeof zh> = { zh, en };

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: unknown = LOCALES[locale];
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  if (typeof value !== "string") return key;
  if (!params) return value;
  return Object.entries(params).reduce(
    (str, [k, v]) => str.replace(`{${k}}`, String(v)),
    value
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale | null;
    if (saved && (saved === "zh" || saved === "en")) {
      setLocaleState(saved);
    }
    setReady(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(locale, key, params);
    },
    [locale]
  );

  // 始终渲染 children，用默认中文翻译，ready 后再用实际 locale
  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // SSR 或 provider 外使用时返回默认翻译
    return {
      locale: "zh" as Locale,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => translate("zh", key, params),
    };
  }
  return ctx;
}
