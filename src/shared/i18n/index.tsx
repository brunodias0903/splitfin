"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { en } from "./en";
import { ptBR } from "./pt-BR";

export type Locale = "en" | "pt-BR";

export type Translations = {
  [K in keyof typeof en]: (typeof en)[K] extends Record<string, string>
    ? Record<string, string>
    : string;
};

const translations: Record<Locale, Translations> = { en, "pt-BR": ptBR };

const currencyForLocale: Record<Locale, string> = {
  en: "USD",
  "pt-BR": "BRL",
};

const localeForFormat: Record<Locale, string> = {
  en: "en-US",
  "pt-BR": "pt-BR",
};

interface I18nContextValue {
  locale: Locale;
  t: Translations;
  currency: string;
  formatCurrency: (value: number) => string;
  formatDate: (dateStr: string) => string;
  formatLongDate: (date: Date) => string;
  formatMonth: (yearMonth: string) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("pt-BR");

  const t = translations[locale];
  const currency = currencyForLocale[locale];
  const localeStr = localeForFormat[locale];

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat(localeStr, { style: "currency", currency }).format(value);

  const formatDate = (dateStr: string) =>
    new Intl.DateTimeFormat(localeStr).format(new Date(dateStr + "T00:00:00"));

  const formatLongDate = (date: Date) =>
    new Intl.DateTimeFormat(localeStr, {
      weekday: "long",
      day: "2-digit",
      month: "short",
    }).format(date);

  const formatMonth = (yearMonth: string) =>
    new Intl.DateTimeFormat(localeStr, {
      year: "numeric",
      month: "long",
    }).format(new Date(`${yearMonth}-01T00:00:00`));

  return (
    <I18nContext.Provider
      value={{
        locale,
        t,
        currency,
        formatCurrency,
        formatDate,
        formatLongDate,
        formatMonth,
        setLocale,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useLocale must be used within I18nProvider");
  return ctx;
}
