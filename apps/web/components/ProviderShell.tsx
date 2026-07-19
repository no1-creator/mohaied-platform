'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, clearToken } from '@/lib/api';
import Icon from '@/components/Icon';
import NotificationBell from '@/components/NotificationBell';

type Me = {
  fullName?: string;
  role?: string;
  isVerified?: boolean;
  avatarUrl?: string | null;
  providerProfile?: unknown | null;
};

const NAV = [
  { key: 'overview', href: '/provider', label: 'نظرة عامة', icon: 'grid' },
  { key: 'projects', href: '/projects/open', label: 'تصفّح المشاريع', icon: 'search' },
  { key: 'offers', href: '/offers/mine', label: 'عروضي', icon: 'fileText' },
  { key: 'plan', href: '/provider/plans', label: 'الاشتراك والباقة', icon: 'creditCard' },
  { key: 'analytics', href: '/provider/analytics', label: 'التحليلات', icon: 'sparkles' },
  { key: 'ads', href: '/advertise', label: 'الإعلانات', icon: 'star' },
  { key: 'kyc', href: '/kyc', label: 'توثيق الهوية', icon: 'badgeCheck' },
{ key: 'profile', href: '/provider/profile', label: 'ملفي الاحترافي', icon: 'user' },
];

export default function ProviderShell({
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
  const [state, setState] = useState<'loading' | 'ok' | 'redirecting'>('loading');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((d) => {
        const role = (d.role || '').toUpperCase();
        if (role !== 'PROVIDER') {
          setState('redirecting');
          if (role === 'ADMIN') router.replace('/admin');
          else if (role === 'SUPERVISOR') router.replace('/supervisor');
          else router.replace('/dashboard');
          return;
        }
        // بوابة إكمال البروفايل: مقدم خدمة لسه ملوش بروفايل → روح للفورم
        if (!d.providerProfile) {
          setState('redirecting');
          router.replace('/profile/setup');
          return;
        }
        setMe(d);
        setState('ok');
      })
      .catch(() => {
        setState('redirecting');
        router.push('/login');
      });
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  if (state !== 'ok') {
    return (
      <div className="pv-boot">
        <style>{PROVIDER_CSS}</style>
        {state === 'loading' ? 'جاري التحميل...' : 'جاري التحويل...'}
      </div>
    );
  }

  return (
    <div className="pv-shell">
      <style>{PROVIDER_CSS}</style>

      <aside className="pv-sidebar">
        <Link href="/provider" className="pv-brand">
          <span className="pv-brand-logo">
            <Icon name="shield" size={22} />
          </span>
          <span className="pv-brand-text">
            <span className="pv-brand-name">محايد</span>
            <span className="pv-brand-sub">بيئة العمل</span>
          </span>
        </Link>

        <nav className="pv-nav">
          {NAV.map((n) => (
            <Link
              key={n.key}
              href={n.href}
              className={n.key === active ? 'active' : ''}
            >
              <span className="pv-nav-icon">
                <Icon name={n.icon} size={18} />
              </span>
              <span className="pv-nav-label">{n.label}</span>
              {n.key === 'kyc' && me?.isVerified && (
                <span className="pv-nav-dot" title="موثّق" />
              )}
            </Link>
          ))}
        </nav>

        <div className="pv-sidebar-foot">تحت إشراف الحكومة المصرية</div>
      </aside>

      <div className="pv-main">
        <header className="pv-topbar">
          <h1>{title}</h1>
          <div className="pv-user">
            {me?.isVerified && (
              <span className="pv-verified">
                <Icon name="badgeCheck" size={15} /> موثّق
              </span>
            )}
            <NotificationBell />
            <Link href="/profile" className="pv-profile">
              <span className="pv-avatar">
                {me?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={me.avatarUrl} alt={me?.fullName || ''} />
                ) : (
                  (me?.fullName || '؟').charAt(0)
                )}
              </span>
              {me?.fullName && <span className="pv-name">{me.fullName}</span>}
            </Link>
            <button className="pv-logout" onClick={logout}>
              خروج
            </button>
          </div>
        </header>
        <div className="pv-content">{children}</div>
      </div>
    </div>
  );
}

const PROVIDER_CSS = `
.pv-shell{display:flex;min-height:100vh;background:var(--background);direction:rtl;font-family:'Noto Sans Arabic',sans-serif;}
.pv-boot{min-height:100vh;display:flex;align-items:center;justify-content:center;color:var(--muted);background:var(--background);font-family:'Noto Sans Arabic',sans-serif;}

.pv-sidebar{width:258px;flex-shrink:0;background:linear-gradient(180deg,var(--green-dark),#184f48);color:#fff;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;}
.pv-brand{display:flex;align-items:center;gap:12px;padding:6px 8px 22px;text-decoration:none;color:#fff;}
.pv-brand-logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(140deg,var(--green-light),var(--green-dark));display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.25);}
.pv-brand-name{font-weight:800;font-size:18px;line-height:1.1;display:block;}
.pv-brand-sub{font-size:12px;opacity:.72;display:block;}
.pv-nav{display:flex;flex-direction:column;gap:4px;margin-top:6px;}
.pv-nav a{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;color:rgba(255,255,255,.82);font-size:14.5px;font-weight:600;text-decoration:none;transition:all .15s;}
.pv-nav a:hover{background:rgba(255,255,255,.1);color:#fff;}
.pv-nav a.active{background:#fff;color:var(--green-dark);box-shadow:0 6px 16px rgba(0,0,0,.15);}
.pv-nav-icon{display:inline-flex;align-items:center;}
.pv-nav-label{flex:1;}
.pv-nav-dot{width:8px;height:8px;border-radius:50%;background:#34d399;box-shadow:0 0 0 2px rgba(255,255,255,.35);}
.pv-sidebar-foot{margin-top:auto;font-size:12px;opacity:.72;padding:14px 10px 4px;border-top:1px solid rgba(255,255,255,.15);}

.pv-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.pv-topbar{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:14px 28px;background:rgba(255,255,255,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20;}
.pv-topbar h1{font-size:20px;font-weight:800;color:var(--ink);}
.pv-user{display:flex;align-items:center;gap:12px;}
.pv-verified{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--green-dark);font-weight:800;font-size:13px;padding:6px 12px;border-radius:999px;white-space:nowrap;}
.pv-profile{display:flex;align-items:center;gap:8px;text-decoration:none;padding:4px 10px 4px 4px;border-radius:22px;border:1px solid var(--line);background:#fff;transition:all .15s;}
.pv-profile:hover{background:var(--mint);border-color:var(--green-light);}
.pv-avatar{width:30px;height:30px;border-radius:50%;background:linear-gradient(140deg,var(--green-light),var(--green-dark));color:#fff;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;}
.pv-avatar img{width:100%;height:100%;object-fit:cover;}
.pv-name{font-size:13.5px;color:var(--ink);font-weight:700;white-space:nowrap;}
.pv-logout{padding:8px 16px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--ink);font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit;transition:all .15s;}
.pv-logout:hover{border-color:#fecaca;background:#fef2f2;color:#b91c1c;}
.pv-content{padding:26px 28px 60px;}

@media(max-width:900px){
.pv-shell{flex-direction:column;}
.pv-sidebar{width:auto;height:auto;position:static;flex-direction:row;align-items:center;overflow-x:auto;padding:12px;gap:10px;}
.pv-brand{padding:0 8px 0 0;}
.pv-brand-sub{display:none;}
.pv-nav{flex-direction:row;margin-top:0;}
.pv-nav a{white-space:nowrap;padding:9px 12px;}
.pv-nav-label{flex:none;}
.pv-sidebar-foot{display:none;}
.pv-topbar{padding:12px 16px;}
.pv-name{display:none;}
.pv-content{padding:18px 16px 50px;}
}
`;
