'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function SupervisorHome() {
  const router = useRouter();
  const { tr } = useI18n();

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    router.replace('/supervisor/assignments');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--muted)',
        fontFamily: "'Noto Sans Arabic', sans-serif",
      }}
    >
      {tr('common.redirecting', 'جاري التحويل...')}
    </div>
  );
}
