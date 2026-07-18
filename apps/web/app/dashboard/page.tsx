'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import { LoadingState, ErrorState } from '@/components/PageState';
import AdBanners from '@/components/AdBanners';

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
  { href: '/complaints/mine', icon: 'scale', title: 'شكاويّ ونزاعاتي', desc: 'تابع شكاويك وردود وقرارات إدارة محايد.', roles: ['CLIENT', 'PROVIDER'] },
  { href: '/subscribe', icon: 'creditCard', title: 'الاشتراك والباقات', desc: 'اشترك لتظهر للعملاء وتقلّل العمولة.', roles: ['PROVIDER'], accent: true },
  { href: '/supervisor/assignments', icon: 'shield', title: 'تكليفاتي', desc: 'المشاريع اللي بتشرف عليها.', roles: ['SUPERVISOR'] },
  { href: '/supervisor/arbitrations', icon: 'scale', title: 'النزاعات المُسندة لي', desc: 'النزاعات اللي عُيّنت فيها مُحكّمًا تقنيًا.', roles: ['SUPERVISOR'] },
  { href: '/admin', icon: 'shield', title: 'لوحة التحكم', desc: 'تحكم كامل في المنصة والمستخدمين.', roles: ['ADMIN'], accent: true },
];

// خدمات محايد اللي بنعرضها على العميل (cross-sell)
const CLIENT_SERVICES = [
  { icon: 'badgeCheck', title: 'توثيق رسمي لكل خطوة', desc: 'كل اتفاق ومرحلة بيتوثّق رسميًا على المنصة، فحقّك مسجّل ومحفوظ.' },
  { icon: 'lock', title: 'ضمان مالي (Escrow)', desc: 'فلوسك بتتحجز بأمان وما تتحرّرش لمقدم الخدمة إلا بعد ما تستلم شغلك.' },
  { icon: 'scale', title: 'حل عادل للنزاعات', desc: 'لو حصل خلاف، إدارة محايد بتتدخّل كمُحكّم محايد وقرارها مُلزم للطرفين.' },
  { icon: 'shield', title: 'إشراف تقني اختياري', desc: 'تقدر تطلب مشرف متخصص يتابع جودة الشغل خطوة بخطوة.' },
];

const HERO_BY_ROLE: Record<string, { tag: string; cta?: { label: string; href: string } }> = {
  CLIENT: {
    tag: 'نفّذ مشاريعك بثقة — كل خطوة موثّقة وحقوقك محفوظة داخل بيئة محايدة.',
    cta: { label: 'انشر مشروع جديد', href: '/projects/new' },
  },
  PROVIDER: {
    tag: 'استقبل المشاريع، قدّم عروضك، واشتغل في بيئة موثّقة تحفظ حقوقك.',
    cta: { label: 'تصفّح المشاريع المفتوحة', href: '/projects/open' },
  },
  SUPERVISOR: {
    tag: 'تابع تكليفاتك والنزاعات المُسندة لك كمُحكّم تقني.',
    cta: { label: 'تكليفاتي', href: '/supervisor/assignments' },
  },
};

const DB_CSS = `
.db-wrap { max-width:1000px; margin:0 auto; padding:26px 20px 80px; }

/* الهيدر الفخم */
.db-hero-card { position:relative; overflow:hidden; background:linear-gradient(135deg,var(--green),var(--green-dark)); color:#fff; border-radius:24px; padding:34px 32px; box-shadow:0 22px 50px rgba(40,125,115,.22); }
.db-hero-glow { position:absolute; width:280px; height:280px; border-radius:50%; background:rgba(255,255,255,.10); top:-120px; left:-60px; pointer-events:none; }
.db-hero-content { position:relative; z-index:1; }
.db-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.16); color:#fff; border:1px solid rgba(255,255,255,.22); padding:5px 13px; border-radius:999px; font-size:12.5px; font-weight:700; margin-bottom:14px; }
.db-greet { font-size:27px; font-weight:900; margin:0 0 8px; line-height:1.3; }
.db-tag { font-size:15px; opacity:.94; line-height:1.85; margin:0 0 20px; max-width:560px; }
.db-unverified { display:inline-block; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.25); padding:6px 13px; border-radius:10px; font-size:13px; font-weight:700; margin:0 0 18px; }
.db-cta { display:inline-flex; align-items:center; gap:8px; background:#fff; color:var(--green-dark); padding:13px 24px; border-radius:13px; font-weight:900; font-size:15px; text-decoration:none; box-shadow:0 12px 26px rgba(0,0,0,.14); transition:transform .16s; }
.db-cta:hover { transform:translateY(-2px); }

/* عناوين الأقسام */
.db-section-title { font-size:19px; font-weight:900; color:var(--ink); margin:32px 0 16px; }

/* الاختصارات */
.db-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
.db-tile { display:flex; flex-direction:column; align-items:flex-start; background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; text-decoration:none; transition:all .16s; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.db-tile:hover { border-color:var(--green-light); transform:translateY(-3px); box-shadow:0 10px 26px rgba(40,125,115,.12); }
.db-tile-icon { width:48px; height:48px; border-radius:13px; background:var(--mint); color:var(--green-dark); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.db-tile.accent .db-tile-icon { background:linear-gradient(140deg,var(--green-light),var(--green-dark)); color:#fff; }
.db-tile-title { font-size:16.5px; font-weight:800; color:var(--ink); margin-bottom:5px; }
.db-tile-desc { font-size:13px; color:var(--muted); line-height:1.6; }

/* قسم عرض الخدمات */
.db-svc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:16px; }
.db-svc-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; transition:all .16s; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.db-svc-card:hover { border-color:#cfe4dd; transform:translateY(-3px); box-shadow:0 10px 26px rgba(40,125,115,.10); }
.db-svc-icon { width:50px; height:50px; border-radius:14px; background:var(--mint); color:var(--green-dark); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.db-svc-h { font-size:16px; font-weight:800; color:var(--ink); margin-bottom:6px; }
.db-svc-p { font-size:13px; color:var(--muted); line-height:1.7; }

/* بانر تحفيزي */
.db-band { position:relative; overflow:hidden; margin-top:26px; background:linear-gradient(135deg,var(--sand),#fbf5e0); border:1px solid #efe3bd; border-radius:20px; padding:30px 32px; }
.db-band-glow { position:absolute; width:220px; height:220px; border-radius:50%; background:rgba(40,125,115,.08); bottom:-110px; right:-50px; pointer-events:none; }
.db-band-content { position:relative; z-index:1; }
.db-band h3 { font-size:21px; font-weight:900; color:var(--ink); margin:0 0 8px; }
.db-band p { font-size:14.5px; color:#6b6a52; line-height:1.8; margin:0 0 18px; max-width:560px; }
.db-band-btn { display:inline-block; background:var(--green); color:#fff; padding:13px 26px; border-radius:12px; font-weight:900; font-size:15px; text-decoration:none; box-shadow:0 12px 26px rgba(40,125,115,.25); transition:transform .16s,background .2s; }
.db-band-btn:hover { background:var(--green-dark); transform:translateY(-2px); }

@media (max-width:560px) {
  .db-hero-card { padding:26px 20px; }
  .db-greet { font-size:22px; }
  .db-band { padding:24px 20px; }
}
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
      .then((data) => {
        // الأدمن يدخل على لوحة التحكم مباشرة بدون صفحة الترحيب
        if (data.role === 'ADMIN') {
          router.replace('/admin');
          return;
        }
        setMe(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <>
        <TopBar />
        <LoadingState label="جاري تحميل صفحتك…" />
      </>
    );
  }

  if (error) {
    return (
      <>
        <TopBar />
        <ErrorState message={error} onRetry={() => router.push('/login')} />
      </>
    );
  }

  const role = me?.role || '';
  const tiles = TILES.filter((t) => t.roles.length === 0 || t.roles.includes(role));
  const hero = HERO_BY_ROLE[role] || HERO_BY_ROLE.CLIENT;

  return (
    <>
      <style>{DB_CSS}</style>
      <TopBar />
      <div className="db-wrap">
        <div className="db-hero-card">
          <div className="db-hero-glow" />
          <div className="db-hero-content">
            <span className="db-badge">
              <Icon name="badgeCheck" size={14} />
              {me ? ROLE_LABELS[me.role] : ''}
            </span>
            <h1 className="db-greet">أهلًا بيك، {me?.fullName} 👋</h1>
            <p className="db-tag">{hero.tag}</p>
            {me && !me.isVerified && (
              <p className="db-unverified">⏳ حسابك بانتظار التوثيق</p>
            )}
            {hero.cta && (
              <Link href={hero.cta.href} className="db-cta">
                <Icon name="plus" size={17} />
                {hero.cta.label}
              </Link>
            )}
          </div>
        </div>

        <AdBanners placement="CLIENT_DASHBOARD" />
        <h2 className="db-section-title">اختصاراتك</h2>
        <div className="db-grid">
          {tiles.map((t) => (
            <Link href={t.href} key={t.href} className={`db-tile${t.accent ? ' accent' : ''}`}>
              <span className="db-tile-icon">
                <Icon name={t.icon} size={22} />
              </span>
              <span className="db-tile-title">{t.title}</span>
              <span className="db-tile-desc">{t.desc}</span>
            </Link>
          ))}
        </div>

        {role === 'CLIENT' && (
          <>
            <h2 className="db-section-title">خدمات محايد اللي بتحميك</h2>
            <div className="db-svc-grid">
              {CLIENT_SERVICES.map((s) => (
                <div className="db-svc-card" key={s.title}>
                  <span className="db-svc-icon">
                    <Icon name={s.icon} size={24} />
                  </span>
                  <div className="db-svc-h">{s.title}</div>
                  <div className="db-svc-p">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="db-band">
              <div className="db-band-glow" />
              <div className="db-band-content">
                <h3>عندك مشروع في بالك؟</h3>
                <p>انشره دلوقتي واستقبل عروض من أفضل مقدمي الخدمات — كله موثّق ومضمون من محايد.</p>
                <Link href="/projects/new" className="db-band-btn">
                  ابدأ مشروعك الآن
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
