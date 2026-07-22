'use client';

import { useCallback, useEffect, useState } from 'react';
import { ar } from './locales/ar';
import { en } from './locales/en';

export type LangCode = string;
export type LangDef = { code: LangCode; label: string; dir: 'rtl' | 'ltr' };

// ✦ سجل اللغات — إضافة لغة جديدة = سطر هنا + ملف قاموس، وخلاص (صفر تعديل تاني)
export const LANGUAGES: LangDef[] = [
  { code: 'ar', label: 'العربية', dir: 'rtl' },
  { code: 'en', label: 'English', dir: 'ltr' },
];

const DICTS: Record<string, Record<string, string>> = { ar, en };

const DEFAULT_LANG = 'ar';
const STORAGE_KEY = 'mohaied_lang';
const EVENT = 'mohaied:langchange';

export function getLang(): LangCode {
  if (typeof window === 'undefined') return DEFAULT_LANG;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved && DICTS[saved] ? saved : DEFAULT_LANG;
}

export function langDir(code: LangCode): 'rtl' | 'ltr' {
  return LANGUAGES.find((l) => l.code === code)?.dir || 'rtl';
}

export function applyLang(code: LangCode) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code;
  document.documentElement.dir = langDir(code);
}

export function setLang(code: LangCode) {
  if (typeof window === 'undefined' || !DICTS[code]) return;
  localStorage.setItem(STORAGE_KEY, code);
  applyLang(code);
  window.dispatchEvent(new CustomEvent(EVENT, { detail: code }));
}

export function translate(lang: LangCode, key: string, fallback?: string): string {
  return DICTS[lang]?.[key] ?? DICTS[DEFAULT_LANG]?.[key] ?? fallback ?? key;
}

// الهوك الرئيسي: بيرجّع اللغة الحالية + دالة التبديل + دالة الترجمة tr
export function useI18n() {
  const [lang, setLangState] = useState<LangCode>(DEFAULT_LANG);

  useEffect(() => {
    const current = getLang();
    setLangState(current);
    applyLang(current);
    const handler = () => setLangState(getLang());
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const tr = useCallback(
    (key: string, fallback?: string) => translate(lang, key, fallback),
    [lang],
  );

  const change = useCallback((code: LangCode) => setLang(code), []);

  return { lang, setLang: change, tr, languages: LANGUAGES };
}
