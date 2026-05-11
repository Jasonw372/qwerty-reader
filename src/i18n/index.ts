import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN.ts";
import enUS from "./locales/en-US.ts";
import type { Locale } from "../types/index.ts";

const LOCALE_KEY = "locale";

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (value === "zh-CN" || value === "en-US") return value;
  return null;
}

export function detectLocale(): Locale {
  const stored = normalizeLocale(localStorage.getItem(LOCALE_KEY));
  if (stored) return stored;
  return navigator.language.toLowerCase().startsWith("zh") ? "zh-CN" : "en-US";
}

export function persistLocale(locale: Locale): void {
  localStorage.setItem(LOCALE_KEY, locale);
}

export function applyDocumentLanguage(locale: Locale): void {
  document.documentElement.lang = locale;
}

const initialLocale = detectLocale();

void i18n.use(initReactI18next).init({
  resources: {
    "zh-CN": { translation: zhCN },
    "en-US": { translation: enUS },
  },
  lng: initialLocale,
  fallbackLng: "en-US",
  interpolation: {
    escapeValue: false,
  },
});

applyDocumentLanguage(initialLocale);
persistLocale(initialLocale);

export default i18n;
