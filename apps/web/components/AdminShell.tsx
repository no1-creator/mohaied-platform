'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken, clearToken } from '@/lib/api';
import Icon from '@/components/Icon';

type Me = {
  fullName: string;
  role: string;
  isSuperAdmin?: boolean;
  adminScopes?: string | null;
};

const LOGO = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z" fill="rgba(255,255,255,.16)" stroke="#fff" strokeWidth="1.7" />
    <path d="M11.5 16l3 3 6-6.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const NAV = [
  { key: 'overview', href: '/admin', label: 'نظرة عامة', icon: 'grid' },
  { key: 'users', href: '/admin/users', label: 'المستخدمون', icon: 'users' },
  { key: 'notifications', href: '/admin/notifications', label: 'سجل الإشعارات', icon: 'clock' },
  { key: 'projects', href: '/admin/projects', label: 'المشاريع', icon: 'folder' },
  { key: 'supervisors', href: '/admin/supervisors', label: 'المشرفون', icon: 'shield' },
  { key: 'complaints', href: '/admin/complaints', label: 'الشكاوى', icon: 'scale' },
  { key: 'plans', href: '/admin/plans', label: 'الباقات والعمولة', icon: 'creditCard' },
  { key: 'options', href: '/admin/options', label: 'قوائم الخيارات', icon: 'grid' },
  { key: 'content', href: '/admin/content', label: 'نصوص الواجهات', icon: 'fileText' },
  { key: 'media', href: '/admin/media', label: 'مكتبة الوسائط', icon: 'palette' },
  { key: 'ads', href: '/admin/ads', label: 'الإعلانات', icon: 'star' },
  { key: 'recommendations', href: '/admin/recommendations', label: 'طلبات الترشيح', icon: 'sparkles' },
  { key: 'invitations', href: '/admin/invitations', label: 'دعوات خارجية', icon: 'users' },
{ key: 'kyc', href: '/admin/kyc', label: 'توثيق الهوية', icon: 'badgeCheck' },
{ key: 'legal', href: '/admin/legal', label: 'الطلبات القانونية', icon: 'landmark' },
{ key: 'invest', href: '/admin/invest', label: 'بوابة الاستثمار', icon: 'rocket' },
  { key: 'audit', href: '/admin/audit', label: 'سجل التدقيق', icon: 'eye' },
  { key: 'team', href: '/admin/team', label: 'صلاحيات الفريق', icon: 'lock' },
];

function parseScopes(s?: string | null): string[] | null {
  if (s == null) return null;
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

function allowedNav(me: Me | null) {
  const full = !me || me.isSuperAdmin || me.adminScopes == null;
  const scopes = full ? null : parseScopes(me?.adminScopes) || [];
  return NAV.filter((n) => {
    if (n.key === 'overview') return true;
    // صفحة الفريق: للسوبر أدمن أو الأدمن كامل الصلاحية (عشان الـ bootstrap)
    if (n.key === 'team') return !!me && (me.isSuperAdmin || me.adminScopes == null);
    if (full) return true;
    return scopes!.includes(n.key);
  });
}

export default function AdminShell({
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
        if (d.role !== 'ADMIN') {
          setState('denied');
        } else {
          setMe(d);
          setState('ok');
        }
      })
      .catch(() => setState('denied'));
  }, [router]);

  function logout() {
    clearToken();
    router.push('/login');
  }

  if (state === 'loading') {
    return (
      <div className="ad-boot">
        <style>{ADMIN_CSS}</style>
        جاري التحميل...
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="ad-boot">
        <style>{ADMIN_CSS}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--green-dark)', marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <Icon name="lock" size={40} />
          </div>
          <p>الصفحة دي متاحة للأدمن بس.</p>
          <button className="ad-btn" onClick={() => router.push('/dashboard')}>
            رجوع للوحة
          </button>
        </div>
      </div>
    );
  }

  const nav = allowedNav(me);

  return (
    <div className="ad-shell">
      <style>{ADMIN_CSS}</style>

      <aside className="ad-sidebar">
        <div className="ad-brand">
          <div className="ad-brand-logo">{LOGO}</div>
          <div>
            <div className="ad-brand-name">محايد</div>
            <div className="ad-brand-sub">لوحة التحكم</div>
          </div>
        </div>

        <nav className="ad-nav">
          {nav.map((n) => (
            <Link key={n.key} href={n.href} className={active === n.key ? 'active' : ''}>
              <span className="ad-nav-icon">
                <Icon name={n.icon} size={18} />
              </span>
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="ad-sidebar-foot">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name="landmark" size={14} /> تحت إشراف الحكومة المصرية
          </span>
        </div>
      </aside>

      <div className="ad-main">
        <div className="ad-topbar">
          <h1>{title}</h1>
          <div className="ad-user">
            <span>{me?.fullName}</span>
            <button className="ad-logout" onClick={logout}>
              خروج
            </button>
          </div>
        </div>
        <div className="ad-content">{children}</div>
      </div>
    </div>
  );
}

const ADMIN_CSS = `
.ad-shell{display:flex;min-height:100vh;background:#f2f6f4;direction:rtl;font-family:'Noto Sans Arabic',sans-serif;}
.ad-boot{min-height:100vh;display:flex;align-items:center;justify-content:center;color:#70807b;background:#f2f6f4;font-family:'Noto Sans Arabic',sans-serif;}

.ad-sidebar{width:260px;flex-shrink:0;background:linear-gradient(180deg,#216c63,#184f48);color:#fff;display:flex;flex-direction:column;padding:22px 16px;position:sticky;top:0;height:100vh;}
.ad-brand{display:flex;align-items:center;gap:12px;padding:6px 8px 22px;}
.ad-brand-logo{width:42px;height:42px;border-radius:12px;background:linear-gradient(140deg,var(--green-light),var(--green-dark));display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,.25);}
.ad-brand-logo svg{width:24px;height:24px;}
.ad-brand-name{font-weight:800;font-size:18px;line-height:1.1;}
.ad-brand-sub{font-size:12px;opacity:.72;}
.ad-nav{display:flex;flex-direction:column;gap:4px;margin-top:6px;}
.ad-nav a{display:flex;align-items:center;gap:10px;padding:11px 13px;border-radius:11px;color:rgba(255,255,255,.82);font-size:14.5px;font-weight:600;text-decoration:none;transition:all .15s;}
.ad-nav a:hover{background:rgba(255,255,255,.1);color:#fff;}
.ad-nav a.active{background:#fff;color:var(--green-dark);box-shadow:0 6px 16px rgba(0,0,0,.15);}
.ad-nav-icon{display:inline-flex;align-items:center;}
.ad-sidebar-foot{margin-top:auto;font-size:12px;opacity:.72;padding:14px 10px 4px;border-top:1px solid rgba(255,255,255,.15);}

.ad-main{flex:1;min-width:0;display:flex;flex-direction:column;}
.ad-topbar{display:flex;align-items:center;justify-content:space-between;padding:18px 28px;background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:5;}
.ad-topbar h1{font-size:20px;font-weight:800;color:var(--ink);}
.ad-user{display:flex;align-items:center;gap:14px;font-size:14px;color:var(--text);}
.ad-logout{background:var(--mint);color:var(--green-dark);border:none;padding:8px 16px;border-radius:9px;font-weight:700;cursor:pointer;font-family:inherit;}
.ad-logout:hover{background:#dfeee8;}
.ad-content{padding:26px 28px;}

.ad-loading,.ad-empty,.ad-error{padding:40px;text-align:center;color:var(--muted);background:#fff;border-radius:14px;border:1px solid var(--line);}
.ad-error{color:#b4322b;background:#fdeceb;border-color:#f5cfcc;}

.ad-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:22px;}
.ad-stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 10px 26px rgba(24,70,61,.06);}
.ad-stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--mint);color:var(--green-dark);flex-shrink:0;}
.ad-stat-value{font-size:26px;font-weight:800;color:var(--ink);line-height:1;}
.ad-stat-label{font-size:13px;color:var(--muted);margin-top:4px;}
.ad-stat.tone-red .ad-stat-icon{background:#fdeceb;color:#b4322b;}
.ad-stat.tone-amber .ad-stat-icon{background:#fdf3dd;color:#96690f;}
.ad-stat.tone-blue .ad-stat-icon{background:#e7f0fb;color:#2f5fa6;}

.ad-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.ad-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;}
.ad-panel-title{font-size:15px;font-weight:800;color:var(--ink);margin-bottom:16px;}
.ad-bars{list-style:none;display:flex;flex-direction:column;gap:14px;margin:0;padding:0;}
.ad-bar-head{display:flex;justify-content:space-between;font-size:13.5px;color:var(--text);margin-bottom:6px;}
.ad-bar-track{height:8px;border-radius:99px;background:var(--mint);overflow:hidden;}
.ad-bar-fill{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--green-light),var(--green-dark));}

.ad-toolbar{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap;}
.ad-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);padding:5px;border-radius:12px;}
.ad-tabs button{border:none;background:transparent;padding:8px 15px;border-radius:8px;font-family:inherit;font-weight:600;font-size:13.5px;color:var(--muted);cursor:pointer;}
.ad-tabs button.active{background:var(--green);color:#fff;}
.ad-search{display:flex;gap:8px;}
.ad-search input{border:1px solid var(--line);border-radius:10px;padding:9px 13px;font-family:inherit;font-size:14px;min-width:220px;background:#fff;}
.ad-search button{border:none;background:var(--green);color:#fff;padding:9px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}

.ad-table-wrap{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.ad-table{width:100%;border-collapse:collapse;font-size:14px;}
.ad-table th{text-align:right;padding:14px 16px;background:var(--mint);color:var(--green-dark);font-weight:700;font-size:13px;}
.ad-table td{padding:13px 16px;border-top:1px solid var(--line);color:var(--text);}
.ad-table tr:hover td{background:#fafcfb;}
.ad-mono{font-size:12.5px;color:var(--muted);direction:ltr;text-align:right;}

.ad-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;}
.ad-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.ad-badge.muted{background:#eef1f0;color:var(--muted);}
.ad-badge.red{background:#fdeceb;color:#b4322b;}
.ad-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.ad-badge.amber{background:#fdf3dd;color:#96690f;}

.ad-row-actions{display:flex;gap:6px;}
.ad-btn-mini{border:1px solid var(--line);background:#fff;color:var(--green-dark);padding:6px 12px;border-radius:8px;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer;}
.ad-btn-mini:hover{background:var(--mint);}
.ad-btn-mini.danger{color:#b4322b;border-color:#f2cecb;}
.ad-btn-mini.danger:hover{background:#fdeceb;}
.ad-btn-mini:disabled{opacity:.5;cursor:default;}
.ad-btn{border:none;background:var(--green);color:#fff;padding:10px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}

.ad-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.ad-sup-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:14px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.ad-sup-head{display:flex;align-items:center;gap:12px;}
.ad-sup-avatar{width:44px;height:44px;border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;}
.ad-sup-name{font-weight:800;color:var(--ink);}
.ad-sup-title{font-size:12.5px;color:var(--muted);}
.ad-sup-head .ad-badge{margin-inline-start:auto;}
.ad-sup-meta{list-style:none;display:flex;flex-direction:column;gap:8px;margin:0;padding:0;}
.ad-sup-meta li{display:flex;justify-content:space-between;font-size:13.5px;color:var(--text);border-bottom:1px dashed var(--line);padding-bottom:7px;}
.ad-sup-meta li b{color:var(--ink);}

@media(max-width:900px){
.ad-shell{flex-direction:column;}
.ad-sidebar{width:auto;height:auto;position:static;flex-direction:row;align-items:center;overflow-x:auto;padding:12px;gap:10px;}
.ad-brand{padding:0 8px 0 0;}
.ad-brand-sub{display:none;}
.ad-nav{flex-direction:row;margin-top:0;}
.ad-nav a{white-space:nowrap;padding:9px 12px;}
.ad-sidebar-foot{display:none;}
.ad-stats{grid-template-columns:repeat(2,1fr);}
.ad-grid2{grid-template-columns:1fr;}
.ad-content{padding:18px;}
}
`;
