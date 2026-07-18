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
  roles: string[];
  accent?: boolean;
};

const TILES: Tile[] = [
  { href: '/projects', icon: 'folder', title: 'مشاريعي', desc: 'تابع مشاريعك الحالية وحالتها.', roles: [] },
{ href: '/projects/start', icon: 'plus', title: 'مشروع جديد', desc: 'اختار طريقتك في إيجاد مقدم الخدمة.', roles: ['CLIENT'], accent: true },
  { href: '/projects/open', icon: 'search', title: 'مشاريع مفتوحة', desc: 'تصفّح المشاريع وقدّم عروضك.', roles: ['PROVIDER'] },
  { href: '/offers/mine', icon: 'fileText', title: 'عروضي', desc: 'تابع حالة العروض اللي قدّمتها.', roles: ['PROVIDER'] },
  { href: '/complaints/mine', icon: 'scale', title: 'شكاويّ ونزاعاتي', desc: 'تابع شكاويك وردود وقرارات إدارة محايد.', roles: ['CLIENT', 'PROVIDER'] },
  { href: '/subscribe', icon: 'creditCard', title: 'الاشتراك والباقات', desc: 'اشترك لتظهر للعملاء وتقلّل العمولة.', roles: ['PROVIDER'], accent: true },
  { href: '/advertise', icon: 'star', title: 'أعلن معنا', desc: 'اعرض إعلانك على المنصة ووصّل لعملاء أكتر.', roles: ['PROVIDER'] },
  { href: '/supervisor/assignments', icon: 'shield', title: 'تكليفاتي', desc: 'المشاريع اللي بتشرف عليها.', roles: ['SUPERVISOR'] },
  { href: '/supervisor/arbitrations', icon: 'scale', title: 'النزاعات المُسندة لي', desc: 'النزاعات اللي عُيّنت فيها مُحكّمًا تقنيًا.', roles: ['SUPERVISOR'] },
  { href: '/admin', icon: 'shield', title: 'لوحة التحكم', desc: 'تحكم كامل في المنصة والمستخدمين.', roles: ['ADMIN'], accent: true },
];

// شارات الثقة في الهيرو
const TRUST = ['توثيق رسمي لكل خطوة', 'ضمان مالي كامل', 'حل عادل للنزاعات'];

// خدمات محايد للعميل (cross-sell)
const CLIENT_SERVICES = [
  { icon: 'badgeCheck', title: 'توثيق رسمي لكل خطوة', desc: 'كل اتفاق ومرحلة بيتوثّق رسميًا على المنصة، فحقّك مسجّل ومحفوظ.' },
  { icon: 'lock', title: 'ضمان مالي (Escrow)', desc: 'فلوسك بتتحجز بأمان وما تتحرّرش لمقدم الخدمة إلا بعد ما تستلم شغلك.' },
  { icon: 'scale', title: 'حل عادل للنزاعات', desc: 'لو حصل خلاف، إدارة محايد بتتدخّل كمُحكّم محايد وقرارها مُلزم للطرفين.' },
  { icon: 'shield', title: 'إشراف تقني اختياري', desc: 'تقدر تطلب مشرف متخصص يتابع جودة الشغل خطوة بخطوة.' },
];

// مزايا مقدم الخدمة
const PROVIDER_PERKS = [
  { icon: 'search', title: 'مشاريع جادّة', desc: 'تصفّح مشاريع حقيقية وقدّم عروضك بثقة.' },
  { icon: 'creditCard', title: 'عمولة أقل', desc: 'اشترك في باقة وقلّل نسبة العمولة على أرباحك.' },
  { icon: 'star', title: 'ظهور أوسع', desc: 'حسابك المميّز بيظهر للعملاء بشكل أكبر.' },
  { icon: 'lock', title: 'حقوقك موثّقة', desc: 'كل اتفاق وحق مالي مسجّل ومحمي رسميًا.' },
];

const HERO_BY_ROLE: Record<string, { tag: string; cta?: { label: string; href: string } }> = {
  CLIENT: {
    tag: 'نفّذ مشاريعك بثقة — كل خطوة موثّقة وحقوقك محفوظة داخل بيئة محايدة.',
cta: { label: 'ابدأ مشروع جديد', href: '/projects/start' },
  },
  PROVIDER: {
    tag: 'استقبل المشاريع، قدّم عروضك، واشتغل في بيئة موثّقة تحفظ حقوقك المالية والمهنية.',
    cta: { label: 'تصفّح المشاريع المفتوحة', href: '/projects/open' },
  },
  SUPERVISOR: {
    tag: 'تابع تكليفاتك والنزاعات المُسندة لك كمُحكّم تقني بحياد كامل.',
    cta: { label: 'تكليفاتي', href: '/supervisor/assignments' },
  },
};

const DB_CSS = `
.db-wrap { max-width:1040px; margin:0 auto; padding:26px 20px 90px; }

/* الهيرو الفخم */
.db-hero { position:relative; overflow:hidden; border-radius:26px; padding:38px 34px; color:#fff; background:linear-gradient(135deg,#2f8d81,var(--green-dark) 58%,#184f48); box-shadow:0 26px 60px rgba(24,79,72,.28); }
.db-hero-orb { position:absolute; border-radius:50%; pointer-events:none; }
.db-orb-1 { width:300px; height:300px; background:rgba(255,255,255,.10); top:-140px; inset-inline-start:-70px; }
.db-orb-2 { width:200px; height:200px; background:rgba(255,255,255,.07); bottom:-120px; inset-inline-end:8%; }
.db-hero-content { position:relative; z-index:1; }
.db-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.24); padding:6px 14px; border-radius:999px; font-size:12.5px; font-weight:800; margin-bottom:16px; }
.db-greet { font-size:29px; font-weight:900; margin:0 0 10px; line-height:1.3; }
.db-tag { font-size:15.5px; opacity:.95; line-height:1.9; margin:0 0 20px; max-width:600px; }
.db-unverified { display:inline-block; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.28); padding:7px 14px; border-radius:11px; font-size:13px; font-weight:700; margin:0 0 18px; }
.db-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:22px; }
.db-cta { display:inline-flex; align-items:center; gap:8px; background:#fff; color:var(--green-dark); padding:13px 26px; border-radius:14px; font-weight:900; font-size:15px; text-decoration:none; box-shadow:0 14px 30px rgba(0,0,0,.16); transition:transform .16s,box-shadow .16s; }
.db-cta:hover { transform:translateY(-2px); box-shadow:0 18px 36px rgba(0,0,0,.22); }
.db-trust { display:flex; flex-wrap:wrap; gap:10px; }
.db-trust-item { display:inline-flex; align-items:center; gap:7px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.2); padding:8px 14px; border-radius:12px; font-size:13px; font-weight:700; }

/* عناوين الأقسام */
.db-section-title { font-size:20px; font-weight:900; color:var(--ink); margin:34px 0 16px; }
.db-section-sub { font-size:14px; color:var(--muted); margin:-8px 0 16px; line-height:1.7; }

/* الاختصارات */
.db-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:16px; }
.db-tile { position:relative; display:flex; flex-direction:column; align-items:flex-start; background:#fff; border:1px solid var(--line); border-radius:18px; padding:22px; text-decoration:none; transition:all .18s; box-shadow:0 4px 16px rgba(23,33,31,.04); overflow:hidden; }
.db-tile::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,transparent 58%,rgba(40,125,115,.06)); opacity:0; transition:opacity .18s; }
.db-tile:hover { border-color:var(--green-light); transform:translateY(-4px); box-shadow:0 16px 34px rgba(40,125,115,.14); }
.db-tile:hover::after { opacity:1; }
.db-tile-icon { position:relative; z-index:1; width:50px; height:50px; border-radius:14px; background:var(--mint); color:var(--green-dark); display:flex; align-items:center; justify-content:center; margin-bottom:14px; }
.db-tile.accent .db-tile-icon { background:linear-gradient(140deg,var(--green-light),var(--green-dark)); color:#fff; }
.db-tile-title { position:relative; z-index:1; font-size:16.5px; font-weight:800; color:var(--ink); margin-bottom:5px; }
.db-tile-desc { position:relative; z-index:1; font-size:13px; color:var(--muted); line-height:1.6; }

/* بطاقات الخدمات / المزايا */
.db-svc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:16px; }
.db-svc-card { background:#fff; border:1px solid var(--line); border-radius:18px; padding:24px; transition:all .18s; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.db-svc-card:hover { border-color:#cfe4dd; transform:translateY(-4px); box-shadow:0 14px 30px rgba(40,125,115,.10); }
.db-svc-icon { width:54px; height:54px; border-radius:15px; background:linear-gradient(140deg,var(--mint),#dcefe8); color:var(--green-dark); display:flex; align-items:center; justify-content:center; margin-bottom:15px; }
.db-svc-h { font-size:16px; font-weight:800; color:var(--ink); margin-bottom:6px; }
.db-svc-p { font-size:13px; color:var(--muted); line-height:1.7; }

/* بانر تحفيزي */
.db-band { position:relative; overflow:hidden; margin-top:26px; background:linear-gradient(135deg,var(--sand),#fbf5e0); border:1px solid #efe3bd; border-radius:22px; padding:34px; }
.db-band-orb { position:absolute; width:240px; height:240px; border-radius:50%; background:rgba(40,125,115,.08); bottom:-120px; inset-inline-end:-50px; pointer-events:none; }
.db-band-content { position:relative; z-index:1; }
.db-band h3 { font-size:22px; font-weight:900; color:var(--ink); margin:0 0 8px; }
.db-band p { font-size:14.5px; color:#6b6a52; line-height:1.8; margin:0 0 18px; max-width:600px; }
.db-band-btn { display:inline-flex; align-items:center; gap:8px; background:var(--green); color:#fff; padding:13px 28px; border-radius:13px; font-weight:900; font-size:15px; text-decoration:none; box-shadow:0 14px 30px rgba(40,125,115,.26); transition:transform .16s,background .2s; }
.db-band-btn:hover { background:var(--green-dark); transform:translateY(-2px); }
.db-band.green { background:linear-gradient(135deg,#2f8d81,var(--green-dark)); border-color:transparent; }
.db-band.green h3 { color:#fff; }
.db-band.green p { color:rgba(255,255,255,.9); }
.db-band.green .db-band-btn { background:#fff; color:var(--green-dark); }
.db-band.green .db-band-btn:hover { background:#eef7f3; }
.db-band.green .db-band-orb { background:rgba(255,255,255,.1); }

/* أنيميشن */
@keyframes dbUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:none; } }
.fade-up { animation: dbUp .5s ease both; }
.fade-up.d1 { animation-delay:.06s; }
.fade-up.d2 { animation-delay:.12s; }
.fade-up.d3 { animation-delay:.18s; }

@media (max-width:560px) {
  .db-wrap { padding:18px 14px 70px; }
  .db-hero { padding:26px 18px; border-radius:20px; }
  .db-greet { font-size:22px; }
  .db-tag { font-size:14px; line-height:1.8; }
  .db-hero-actions { flex-direction:column; align-items:stretch; }
  .db-cta { width:100%; justify-content:center; }
  .db-grid { grid-template-columns:1fr; gap:12px; }
  .db-svc-grid { grid-template-columns:1fr; gap:12px; }
  .db-tile { padding:18px; }
  .db-svc-card { padding:20px; }
  .db-section-title { font-size:18px; margin:26px 0 12px; }
  .db-band { padding:24px 18px; border-radius:18px; }
  .db-band h3 { font-size:19px; }
  .db-band p { font-size:13.5px; }
  .db-band-btn { width:100%; justify-content:center; }
}
}
@media (prefers-reduced-motion: reduce) { .fade-up { animation:none; } }
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
        <LoadingState label="جاري تحميل لوحتك..." />
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
  const roleLabel = me ? ROLE_LABELS[me.role] || '' : '';
  const tiles = TILES.filter((t) => t.roles.length === 0 || t.roles.includes(role));
  const hero = HERO_BY_ROLE[role] || HERO_BY_ROLE.CLIENT;

  return (
    <>
      <style>{DB_CSS}</style>
      <TopBar />
      <main className="db-wrap">
        {/* الهيرو */}
        <section className="db-hero fade-up">
          <span className="db-hero-orb db-orb-1" />
          <span className="db-hero-orb db-orb-2" />
          <div className="db-hero-content">
            <span className="db-badge">
              <Icon name="shield" size={14} /> {roleLabel}
            </span>
            <h1 className="db-greet">أهلًا بيك، {me?.fullName} 👋</h1>
            <p className="db-tag">{hero.tag}</p>
            {me && !me.isVerified && (
              <div>
                <span className="db-unverified">⏳ حسابك بانتظار التوثيق</span>
              </div>
            )}
            {hero.cta && (
              <div className="db-hero-actions">
                <Link href={hero.cta.href} className="db-cta">
                  {hero.cta.label}
                  <Icon name="plus" size={16} />
                </Link>
              </div>
            )}
            <div className="db-trust">
              {TRUST.map((t) => (
                <div className="db-trust-item" key={t}>
                  <Icon name="badgeCheck" size={15} /> {t}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* إعلانات صفحة العميل */}
        {role === 'CLIENT' && <AdBanners placement="CLIENT_DASHBOARD" />}

        {/* الاختصارات */}
        <h2 className="db-section-title fade-up d1">اختصاراتك</h2>
        <div className="db-grid fade-up d1">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className={`db-tile${t.accent ? ' accent' : ''}`}>
              <span className="db-tile-icon">
                <Icon name={t.icon} size={22} />
              </span>
              <span className="db-tile-title">{t.title}</span>
              <span className="db-tile-desc">{t.desc}</span>
            </Link>
          ))}
        </div>

        {/* قسم العميل */}
        {role === 'CLIENT' && (
          <>
            <h2 className="db-section-title fade-up d2">خدمات محايد اللي بتحميك</h2>
            <div className="db-svc-grid fade-up d2">
              {CLIENT_SERVICES.map((s) => (
                <div className="db-svc-card" key={s.title}>
                  <div className="db-svc-icon">
                    <Icon name={s.icon} size={24} />
                  </div>
                  <div className="db-svc-h">{s.title}</div>
                  <div className="db-svc-p">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="db-band fade-up d3">
              <span className="db-band-orb" />
              <div className="db-band-content">
                <h3>عندك مشروع في بالك؟</h3>
                <p>انشره دلوقتي واستقبل عروض من أفضل مقدمي الخدمات — كله موثّق ومضمون من محايد.</p>
<Link href="/projects/start" className="db-band-btn">
                ابدأ مشروعك الآن
                  <Icon name="plus" size={16} />
                </Link>
              </div>
            </div>
          </>
        )}

        {/* قسم مقدم الخدمة */}
        {role === 'PROVIDER' && (
          <>
            <h2 className="db-section-title fade-up d2">نمّي شغلك مع محايد</h2>
            <div className="db-svc-grid fade-up d2">
              {PROVIDER_PERKS.map((s) => (
                <div className="db-svc-card" key={s.title}>
                  <div className="db-svc-icon">
                    <Icon name={s.icon} size={24} />
                  </div>
                  <div className="db-svc-h">{s.title}</div>
                  <div className="db-svc-p">{s.desc}</div>
                </div>
              ))}
            </div>

            <div className="db-band green fade-up d3">
              <span className="db-band-orb" />
              <div className="db-band-content">
                <h3>اشترك وكبّر شغلك</h3>
                <p>باقة الاشتراك بتخلّيك تظهر للعملاء أكتر، وتقلّل العمولة على أرباحك، وتديك أولوية في المشاريع.</p>
                <Link href="/subscribe" className="db-band-btn">
                  شوف الباقات
                  <Icon name="creditCard" size={16} />
                </Link>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
