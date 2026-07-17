'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';

type Me = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'عميل',
  PROVIDER: 'مقدم خدمة',
  SUPERVISOR: 'مشرف متخصص',
  ADMIN: 'إدارة محايد',
};

type Tile = {
  href: string;
  icon: string;
  title: string;
  desc: string;
  roles: string[]; // فاضية = تظهر للكل
  accent?: boolean;
};

const TILES: Tile[] = [
  { href: '/projects', icon: 'folder', title: 'مشاريعي', desc: 'تابع مشاريعك الحالية وحالتها.', roles: [] },
  { href: '/projects/new', icon: 'plus', title: 'مشروع جديد', desc: 'انشر مشروعك واستقبل العروض.', roles: ['CLIENT'], accent: true },
  { href: '/projects/open', icon: 'search', title: 'مشاريع مفتوحة', desc: 'تصفّح المشاريع وقدّم عروضك.', roles: ['PROVIDER'] },
  { href: '/offers/mine', icon: 'fileText', title: 'عروضي', desc: 'تابع حالة العروض اللي قدّمتها.', roles: ['PROVIDER'] },
  { href: '/supervisor/assignments', icon: 'shield', title: 'تكليفاتي', desc: 'المشاريع اللي بتشرف عليها.', roles: ['SUPERVISOR'] },
  { href: '/admin', icon: 'shield', title: 'لوحة التحكم', desc: 'تحكم كامل في المنصة والمستخدمين.', roles: ['ADMIN'], accent: true },
];

const DB_CSS = `
.db-wrap { max-width:1000px; margin:0 auto; padding:30px 20px 80px; }
.db-hero { margin-bottom:8px; }
.db-badge { display:inline-flex; align-items:center; gap:6px; background:var(--mint); color:var(--green-dark); border:1px solid var(--line); padding:5px 13px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:12px; }
.db-greet { font-size:26px; font-weight:800; color:var(--ink); margin:0 0 6px; }
.db-email { color:var(--muted); font-size:14px; margin:0; }
.db-unverified { color:#92640a; font-weight:700; }
.db-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; margin-top:26px; }
.db-tile { display:flex; flex-direction:column; align-items:flex-start; background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; text-decoration:none; transition:all .16s; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.db-tile:hover { border-color:var(--green-light); transform:translateY(-3px); box-shadow:0 10px 26px rgba(40,125,115,.12); }
.db-tile-icon { width:48px; height:48px; border-radius:13px; background:var(--mint); color:var(--green-dark); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.db-tile.accent .db-tile-icon { background:linear-gradient(140deg,var(--green-light),var(--green-dark)); color:#fff; }
.db-tile-title { font-size:16.5px; font-weight:800; color:var(--ink); margin-bottom:5px; }
.db-tile-desc { font-size:13px; color:var(--muted); line-height:1.6; }
.db-loading { text-align:center; color:var(--muted); padding:70px 20px; }
.db-error { max-width:420px; margin:60px auto; background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; border-radius:14px; padding:20px; text-align:center; }
.db-error-btn { margin-top:14px; background:var(--green); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-weight:700; cursor:pointer; font-family:inherit; }
`;

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((data) => setMe(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <>
        <style>{DB_CSS}</style>
        <TopBar />
        <div className="db-loading">جاري التحميل...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{DB_CSS}</style>
        <TopBar />
        <div className="db-error">
          <div>{error}</div>
          <button className="db-error-btn" onClick={() => router.push('/login')}>
            الرجوع لتسجيل الدخول
          </button>
        </div>
      </>
    );
  }

  const role = me?.role || '';
  const tiles = TILES.filter((t) => t.roles.length === 0 || t.roles.includes(role));

  return (
    <>
      <style>{DB_CSS}</style>
      <TopBar />
      <div className="db-wrap">
        <div className="db-hero">
          <span className="db-badge">
            <Icon name="shield" size={14} /> {me ? ROLE_LABELS[me.role] : ''}
          </span>
          <h1 className="db-greet">أهلًا بيك، {me?.fullName}</h1>
          <p className="db-email">
            {me?.email}
            {me && !me.isVerified && (
              <span className="db-unverified"> — حسابك بانتظار التوثيق</span>
            )}
          </p>
        </div>

        <div className="db-grid">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className={`db-tile ${t.accent ? 'accent' : ''}`}>
              <div className="db-tile-icon">
                <Icon name={t.icon} size={24} />
              </div>
              <div className="db-tile-title">{t.title}</div>
              <div className="db-tile-desc">{t.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
