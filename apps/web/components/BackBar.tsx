'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

// الصفحات اللي مالهاش لازمة زرار رجوع (رئيسية/دخول)
const TOP_LEVEL = ['/', '/dashboard', '/login', '/register'];

const BB_CSS = `
.bb-bar { max-width:1200px; margin:0 auto; padding:16px 20px 0; }
.bb-btn { display:inline-flex; align-items:center; gap:7px; background:#fff; border:1px solid var(--line); color:var(--muted); font-weight:700; font-size:14px; cursor:pointer; font-family:inherit; padding:8px 14px; border-radius:10px; transition:all .15s; }
.bb-btn:hover { color:var(--green-dark); background:var(--mint); border-color:var(--green-light); }
.bb-arrow { font-size:17px; line-height:1; }
`;

export default function BackBar({ label }: { label?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { tr, lang } = useI18n();
  const text = label ?? tr('common.back', 'رجوع');

  if (!pathname || TOP_LEVEL.includes(pathname)) return null;

  return (
    <div className="bb-bar">
      <style>{BB_CSS}</style>
      <button className="bb-btn" onClick={() => router.back()} aria-label={text}>
        <span className="bb-arrow" aria-hidden="true">{lang === 'en' ? '←' : '→'}</span>
        {text}
      </button>
    </div>
  );
}
