'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

type Plan = { name?: string; analyticsAccess?: boolean };
type Sub = { plan?: Plan } | null;
type Offer = { id: string; status?: string; totalPrice?: number | string; project?: { title?: string } };
type Ad = { id: string; status?: string; impressions?: number; clicks?: number; title?: string };

export default function ProviderAnalyticsPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Sub>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    (async () => {
      const [subR, offR, adR] = await Promise.allSettled([
        api<Sub>('/subscriptions/mine'),
        api<Offer[]>('/offers/mine'),
        api<Ad[]>('/ads/mine'),
      ]);
      if (subR.status === 'fulfilled') setSub(subR.value);
      if (offR.status === 'fulfilled' && Array.isArray(offR.value)) setOffers(offR.value);
      if (adR.status === 'fulfilled' && Array.isArray(adR.value)) setAds(adR.value);
      setLoading(false);
    })();
  }, [router]);

  const hasAccess = !!sub?.plan?.analyticsAccess;
  const st = (s?: string) => (s || '').toUpperCase();

  const total = offers.length;
  const accepted = offers.filter((o) => st(o.status) === 'ACCEPTED').length;
  const rejected = offers.filter((o) => st(o.status) === 'REJECTED').length;
  const pending = offers.filter((o) => st(o.status) === 'SUBMITTED' || st(o.status) === 'PENDING').length;
  const decided = accepted + rejected;
  const acceptRate = decided > 0 ? Math.round((accepted / decided) * 100) : null;
  const acceptedValue = offers
    .filter((o) => st(o.status) === 'ACCEPTED')
    .reduce((acc, o) => acc + (Number(o.totalPrice) || 0), 0);

  const adsTotal = ads.length;
  const adsActive = ads.filter((a) => st(a.status) === 'ACTIVE').length;
  const impressions = ads.reduce((acc, a) => acc + (Number(a.impressions) || 0), 0);
  const clicks = ads.reduce((acc, a) => acc + (Number(a.clicks) || 0), 0);
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : null;

  return (
    <main className="an-main">
      <TopBar />
      <BackBar />
      <style>{AN_CSS}</style>
      <div className="an-wrap">
        <div className="an-head">
          <h1 className="an-title">تحليلات أدائك 📊</h1>
          <p className="an-sub">نظرة سريعة على عروضك وإعلاناتك على محايد.</p>
        </div>

        {loading ? (
          <div className="an-loading">جاري التحميل...</div>
        ) : !hasAccess ? (
          <div className="an-gate">
            <div className="an-gate-ic"><Icon name="star" size={34} /></div>
            <h2>التحليلات ميزة اشتراك</h2>
            <p>رقّي لباقة فيها التحليلات عشان تتابع أداء عروضك وإعلاناتك بالتفصيل.</p>
            <Link href="/provider/plans" className="an-gate-btn">شوف الباقات وارقّي</Link>
          </div>
        ) : (
          <>
            <div className="an-section-t">العروض</div>
            <div className="an-grid">
              <Kpi label="إجمالي العروض" value={total} icon="briefcase" />
              <Kpi label="مقبولة" value={accepted} icon="badgeCheck" tone="good" />
              <Kpi label="قيد المراجعة" value={pending} icon="clock" />
              <Kpi label="مرفوضة" value={rejected} icon="eye" />
              <Kpi label="نسبة القبول" value={acceptRate != null ? `${acceptRate}%` : '—'} icon="star" tone="good" />
              <Kpi label="قيمة العروض المقبولة" value={`${acceptedValue.toLocaleString('en-US')} ج.م`} icon="creditCard" tone="good" />
            </div>

            <div className="an-section-t">الإعلانات</div>
            <div className="an-grid">
              <Kpi label="إجمالي الإعلانات" value={adsTotal} icon="sparkles" />
              <Kpi label="نشطة الآن" value={adsActive} icon="eye" tone="good" />
              <Kpi label="مرات الظهور" value={impressions.toLocaleString('en-US')} icon="eye" />
              <Kpi label="عدد النقرات" value={clicks.toLocaleString('en-US')} icon="link" />
              <Kpi label="نسبة النقر (CTR)" value={ctr != null ? `${ctr}%` : '—'} icon="star" tone="good" />
            </div>

            {ads.length > 0 && (
              <div className="an-panel">
                <div className="an-panel-t">أداء كل إعلان</div>
                <div className="an-table">
                  <div className="an-tr an-th">
                    <span>الإعلان</span><span>ظهور</span><span>نقرات</span><span>CTR</span>
                  </div>
                  {ads.map((a) => {
                    const imp = Number(a.impressions) || 0;
                    const clk = Number(a.clicks) || 0;
                    const r = imp > 0 ? ((clk / imp) * 100).toFixed(1) + '%' : '—';
                    return (
                      <div className="an-tr" key={a.id}>
                        <span className="an-td-title">{a.title || 'إعلان'}</span>
                        <span>{imp.toLocaleString('en-US')}</span>
                        <span>{clk.toLocaleString('en-US')}</span>
                        <span>{r}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: number | string; icon: string; tone?: 'good' }) {
  return (
    <div className={`an-kpi ${tone === 'good' ? 'an-kpi-good' : ''}`}>
      <span className="an-kpi-ic"><Icon name={icon} size={18} /></span>
      <div className="an-kpi-value">{value}</div>
      <div className="an-kpi-label">{label}</div>
    </div>
  );
}

const AN_CSS = `
.an-main{min-height:100vh;background:var(--background);}
.an-wrap{max-width:1000px;margin:0 auto;padding:24px 20px 60px;}
.an-head{margin-bottom:20px;}
.an-title{font-size:24px;font-weight:900;color:var(--ink);margin:0;}
.an-sub{color:var(--muted);font-size:14px;margin:4px 0 0;}
.an-loading{padding:60px;text-align:center;color:var(--muted);}
.an-gate{background:#fff;border:1px solid var(--line);border-radius:16px;padding:44px 24px;text-align:center;max-width:520px;margin:20px auto;}
.an-gate-ic{color:var(--green);margin-bottom:10px;}
.an-gate h2{font-size:20px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.an-gate p{color:var(--muted);font-size:14px;line-height:1.8;margin:0 0 18px;}
.an-gate-btn{display:inline-block;background:var(--green);color:#fff;font-weight:800;font-size:14px;padding:12px 22px;border-radius:12px;text-decoration:none;}
.an-section-t{font-size:16px;font-weight:900;color:var(--ink);margin:22px 0 12px;}
.an-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
.an-kpi{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;}
.an-kpi-good{border-color:var(--green-light);}
.an-kpi-ic{color:var(--green);}
.an-kpi-value{font-size:24px;font-weight:900;color:var(--green-dark);margin-top:6px;}
.an-kpi-label{font-size:13px;color:var(--muted);margin-top:2px;}
.an-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-top:20px;}
.an-panel-t{font-weight:900;color:var(--ink);font-size:16px;margin-bottom:12px;}
.an-table{display:flex;flex-direction:column;}
.an-tr{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:8px;padding:10px 8px;border-bottom:1px solid var(--line);font-size:13.5px;color:var(--ink);align-items:center;}
.an-th{font-weight:800;color:var(--muted);font-size:12.5px;}
.an-td-title{font-weight:700;}
@media(max-width:820px){.an-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:520px){.an-grid{grid-template-columns:1fr 1fr;}}
`;
