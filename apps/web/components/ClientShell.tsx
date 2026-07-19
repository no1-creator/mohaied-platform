'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, clearToken } from '@/lib/api';
import Icon from '@/components/Icon';
import NotificationBell from '@/components/NotificationBell';

type Me = { fullName: string; role: string; avatarUrl?: string | null };

const LOGO = (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 6v6c0 5 3.5 8 9 10 5.5-2 9-5 9-10V6l-9-4z" fill="#fff" opacity="0.95" />
  </svg>
);

const NAV = [
  { key: 'overview', href: '/client', label: 'نظرة عامة', icon: 'grid' },
  { key: 'projects', href: '/projects', label: 'مشاريعي', icon: 'folder' },
  { key: 'new', href: '/projects/start', label: 'مشروع جديد', icon: 'plus' },
  { key: 'complaints', href: '/complaints/mine', label: 'شكاويّ ونزاعاتي', icon: 'scale' },
  { key: 'profile', href: '/profile', label: 'ملفي الشخصي', icon: 'user' },
];

export default function ClientShell({
  active,
  title,
  children,
}: {
  active: string;
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((d) => {
        if (d.role === 'ADMIN') {
          router.replace('/admin');
          return;
        }
        if (d.role === 'PROVIDER') {
          router.replace('/provider');
          return;
        }
        if (d.role !== 'CLIENT') {
          router.replace('/dashboard');
          return;
        }
        setMe(d);
        setState('ok');
      })
      .catch(() => setState('denied'));
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  if (state === 'loading') {
    return (
      <div className="cl-boot">
        <style>{CLIENT_CSS}</style>
        جاري التحميل...
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="cl-boot">
        <style>{CLIENT_CSS}</style>
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 14 }}>حصل خطأ في تحميل حسابك.</p>
          <button className="cl-logout" onClick={() => router.push('/login')}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cl-shell">
      <style>{CLIENT_CSS}</style>

      <aside className="cl-sidebar">
        <div className="cl-brand">
          <div className="cl-brand-logo">{LOGO}</div>
          <div>
            <div className="cl-brand-name">محايد</div>
            <div className="cl-brand-sub">بيئة العميل</div>
          </div>
        </div>

        <nav className="cl-nav">
          {NAV.map((n) => (
            <Link key={n.key} href={n.href} className={active === n.key ? 'active' : ''}>
              <span className="cl-nav-icon">
                <Icon name={n.icon} size={18} />
              </span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="cl-sidebar-foot">تحت إشراف الحكومة المصرية</div>
      </aside>

      <div className="cl-main">
        <header className="cl-topbar">
          <h1>{title}</h1>
          <div className="cl-user">
            <NotificationBell />
            <span className="cl-uname">{me?.fullName}</span>
            <button className="cl-logout" onClick={logout}>
              خروج
            </button>
          </div>
        </header>
        <main className="cl-content">{children}</main>
      </div>
    </div>
  );
}

const CLIENT_CSS = `
.cl-shell{display:flex;min-height:100vh;background:#f2f6f4;direction:rtl;font-family:'Noto Sans Arabic',sans-serif;}
.cl-boot{min-height:100vh;display:flex;align-items:center;justify-content:center;color:#70807b;background:#f2f6f4;font-family:'Noto Sans Arabic',sans-serif;}
.cl-sidebar{width:250px;flex-shrink:0;background:linear-gradient(180deg,#216c63,#184f48);color:#fff;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;}
.cl-brand{display:flex;align-items:center;gap:12px;padding:6px 8px 22px;}
.cl-brand-logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(140deg,var(--green-light),var(--green-dark));display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.25);}
.cl-brand-logo svg{width:24px;height:24px;}
.cl-brand-name{font-weight:800;font-size:18px;line-height:1.1;}
.cl-brand-sub{font-size:12px;opacity:.72;}
.cl-nav{display:flex;flex-direction:column;gap:4px;margin-top:6px;}
.cl-nav a{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;color:rgba(255,255,255,.82);font-size:14.5px;font-weight:600;text-decoration:none;transition:all .15s;}
.cl-nav a:hover{background:rgba(255,255,255,.1);color:#fff;}
.cl-nav a.active{background:#fff;color:var(--green-dark);box-shadow:0 6px 16px rgba(0,0,0,.15);}
.cl-nav-icon{display:inline-flex;align-items:center;}
.cl-sidebar-foot{margin-top:auto;font-size:12px;opacity:.72;padding:14px 10px 4px;border-top:1px solid rgba(255,255,255,.15);}
.cl-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.cl-topbar{display:flex;align-items:center;justify-content:space-between;padding:14px 28px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;}
.cl-topbar h1{font-size:20px;font-weight:800;color:var(--ink);}
.cl-user{display:flex;align-items:center;gap:14px;font-size:14px;color:var(--ink);}
.cl-uname{font-weight:700;}
.cl-logout{background:var(--mint);color:var(--green-dark);border:none;padding:8px 16px;border-radius:9px;font-weight:700;cursor:pointer;font-family:inherit;}
.cl-logout:hover{background:#dfeee8;}
.cl-content{padding:26px 28px;}
@media(max-width:900px){
.cl-shell{flex-direction:column;}
.cl-sidebar{width:auto;height:auto;position:static;flex-direction:row;align-items:center;overflow-x:auto;padding:12px;gap:10px;}
.cl-brand{padding:0 8px 0 0;}
.cl-brand-sub{display:none;}
.cl-nav{flex-direction:row;margin-top:0;}
.cl-nav a{white-space:nowrap;padding:9px 12px;}
.cl-sidebar-foot{display:none;}
.cl-uname{display:none;}
.cl-content{padding:18px;}
}
`;
