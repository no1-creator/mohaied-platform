'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// عنصر في سجل المحتوى: مفتاح + قيمة افتراضية + وصف للموظف + المجموعة + النوع
export type ContentEntry = {
  key: string;
  def: string;
  label: string;
  group: string;
type?: 'text' | 'textarea' | 'image';
};

// السجل المركزي لكل النصوص القابلة للتحكم من لوحة التحكم.
// هيكبر تدريجيًا كل ما نوصّل شاشة جديدة بالنظام.
export const CONTENT_REGISTRY: ContentEntry[] = [
  {
    key: 'site.logo.url',
    def: '',
    label: 'شعار المنصة (صورة) — يظهر في الهيدر والفوتر. سيبه فاضي لاستخدام الشعار الافتراضي.',
    group: 'الهوية والشعار',
    type: 'image',
  },
  {
    key: 'projects.new.title',
    def: 'مشروع جديد',
    label: 'عنوان صفحة «مشروع جديد»',
    group: 'صفحة إنشاء مشروع',
    type: 'text',
  },
  {
    key: 'projects.new.subtitle',
    def: 'انشر تفاصيل مشروعك عشان تستقبل عروض من مقدّمي الخدمات المناسبين.',
    label: 'الوصف تحت العنوان',
    group: 'صفحة إنشاء مشروع',
    type: 'textarea',
  },
  {
    key: 'projects.new.submit',
    def: 'إنشاء المشروع',
    label: 'زر الإنشاء',
    group: 'صفحة إنشاء مشروع',
    type: 'text',
  },
];

// قائمة المجموعات مرتبة حسب ظهورها في السجل
export function contentGroups(): string[] {
  const seen: string[] = [];
  for (const e of CONTENT_REGISTRY) if (!seen.includes(e.group)) seen.push(e.group);
  return seen;
}

// خطّاف لجلب خريطة المحتوى مرة واحدة واستخدامها في الواجهات
export function useSiteContent() {
  const [map, setMap] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api<Record<string, string>>('/content', { auth: false })
      .then((data) => setMap(data && typeof data === 'object' ? data : {}))
      .catch(() => setMap({}))
      .finally(() => setLoaded(true));
  }, []);

  // ترجع قيمة قاعدة البيانات، وإلا الافتراضية من السجل، وإلا النص الممرّر
  function t(key: string, fallback?: string): string {
    if (map[key] !== undefined && map[key] !== null) return map[key];
    const reg = CONTENT_REGISTRY.find((e) => e.key === key);
    if (reg) return reg.def;
    return fallback ?? '';
  }

  return { t, map, loaded };
}
