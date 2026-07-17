'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getToken } from '@/lib/api';

const LOGO = (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z"
      stroke="#fff"
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M11.5 16l3 3 6-6.5"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
);

type Me = { fullName?: string; role?: string };

const NAV: Record<string, { href: string; label: string }[]> = {
  CLIENT: [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/projects', label: 'مشاريعي' },
    { href: '/projects/new', label: '+ مشروع جديد' },
  ],
  PROVIDER: [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/projects/open', label: 'مشاريع مفتوحة' },
    { href: '/offers/mine', label: 'عروضي' },
  ],
  SUPERVISOR: [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/supervisor/assignments', label: 'تكليفاتي' },
  ],
  ADMIN: [
    { href: '/dashboard', label: 'الرئيسية' },
    { href: '/admin', label: 'لوحة التحكم' },
  ],
};

const TB_CSS = `
.tb { position:sticky; top:0; z-index:50; background:rgba(255,255,255,.92); backdrop-filter:blur(10px); border-bottom:1px solid var(--line); }
.tb-inner { max-width:1200px; margin:0 auto; padding:0 20px; height:64px; display:flex; align-items:center; gap:14px; }
.tb-start { display:flex; align-items:center; gap:10px; flex-shrink:0; }
.tb-back { width:38px; height:38px; border-radius:10px; border:1px solid var(--line); background:#fff; color:var(--ink); font-size:17px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .15s; }
.tb-back:hover { background:var(--mint); border-color:var(--green-light); color:var(--green-dark); }
.tb-brand { display:flex; align-items:center; gap:10px; text-decoration:none; }
.tb-logo { width:34px; height:34px; border-radius:10px; background:linear-gradient(140deg,var(--green-light),var(--green-dark)); display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(40,125,115,.25); flex-shrink:0; }
.tb-brand-text { display:flex; flex-direction:column; line-height:1.15; }
.tb-brand-name { font-weight:800; color:var(--ink); font-size:17px; }
.tb-brand-sub { font-size:11px; color:var(--muted); }
.tb-nav { display:flex; align-items:center; gap:4px; margin-inline-start:8px; flex:1; overflow-x:auto; }
.tb-link { padding:8px 14px; border-radius:9px; text-decoration:none; color:var(--muted); font-weight:700; font-size:14px; white-space:nowrap; transition:all .15s; }
.tb-link:hover { color:var(--green-dark); background:var(--mint); }
.tb-link.active { color:var(--green-dark); background:var(--mint); }
.tb-end { display:flex; align-items:center; gap:12px; margin-inline-start:auto; flex-shrink:0; }
.tb-user { font-size:13.5px; color:var(--muted); white-space:nowrap; }
.tb-logout { padding:8px 16px; border-radius:9px; border:1px solid var(--line); background:#fff; color:var(--ink); font-weight:700; font-size:13.5px; cursor:pointer; font-family:inherit; transition:all .15s; }
.tb-logout:hover { border-color:#fecaca; background:#fef2f2; color:#b91c1c; }
@media (max-width:760px){
  .tb-brand-sub { display:none; }
  .tb-user { display:none; }
  .tb-link { padding:7px 10px; font-size:13px; }
}
`;

export default function TopBar({ name }: { name?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<Me>({ fullName: name });

  useEffect(() => {
    if (!getToken()) return;
    api<Me>('/users/me')
      .then((data) => setMe({ fullName: data.fullName, role: data.role }))
      .catch(() => {});
  }, []);

  const displayName = name || me.fullName;
  const links = (me.role && NAV[me.role]) || [];

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <header className="tb">
      <style>{TB_CSS}</style>
      <div className="tb-inner">
        <div className="tb-start">
          <button className="tb-back" onClick={() => router.back()} aria-label="رجوع" title="رجوع">
            ↩
          </button>
          <Link href="/dashboard" className="tb-brand">
            <span className="tb-logo">{LOGO}</span>
            <span className="tb-brand-text">
              <span className="tb-brand-name">محايد</span>
              <span className="tb-brand-sub">منصة حماية الحقوق</span>
            </span>
          </Link>
        </div>

        <nav className="tb-nav">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`tb-link ${pathname === l.href ? 'active' : ''}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="tb-end">
          {displayName && <span className="tb-user">أهلًا، {displayName}</span>}
          <button className="tb-logout" onClick={logout}>
            خروج
          </button>
        </div>
      </div>
    </header>
  );
}
