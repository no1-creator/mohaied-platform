'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        gap: '14px',
      }}
    >
      <div style={{ fontSize: '52px' }}>⚠️</div>
      <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
        حصل خطأ غير متوقع
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '360px', margin: 0 }}>
        اطمن، مفيش بيانات ضاعت. جرّب تحمّل الصفحة تاني.
      </p>
      <button
        onClick={reset}
        style={{
          marginTop: '6px',
          padding: '11px 24px',
          borderRadius: '12px',
          border: 'none',
          background: 'var(--green)',
          color: '#fff',
          fontWeight: 800,
          fontSize: '14px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
