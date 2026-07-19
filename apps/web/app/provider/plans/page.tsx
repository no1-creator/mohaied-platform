'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import Icon from '@/components/Icon';
import ProviderShell from '@/components/ProviderShell';

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  commissionRate: string | number;
  features?: string | null;
  maxOffers?: number | null;
  badgeLabel?: string | null;
  directoryPriority?: number | null;
  monthlyAdCredits?: number | null;
  teamSeats?: number | null;
  analyticsAccess?: boolean;
  prioritySupport?: boolean;
  isFeatured: boolean;
};
type Sub = { id: string; planId?: string; plan?: { id: string; name: string } } | null;

export default function ProviderPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api<Plan[]>('/subscriptions/plans'),
        api<Sub>('/subscriptions/mine'),
      ]);
      setPlans(Array.isArray(p) ? p : []);
      setSub(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function subscribe(planId: string) {
    setBusyId(planId);
    setError('');
    setMsg('');
    try {
      await api('/subscriptions/subscribe', { method: 'POST', body: { planId } });
      setMsg('تم تفعيل اشتراكك بنجاح ✅');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  const currentPlanId = sub?.plan?.id || sub?.planId || '';

  const perkLines = (p: Plan) => {
    const lines: string[] = [];
    lines.push(`عمولة ${Number(p.commissionRate)}%`);
    lines.push(p.maxOffers != null ? `حتى ${p.maxOffers} عرض شهريًا` : 'عروض غير محدودة');
    if (p.badgeLabel) lines.push(`شارة «${p.badgeLabel}» على بروفايلك`);
    if ((p.directoryPriority ?? 0) > 0) lines.push('ظهور بأولوية في الدليل');
    if ((p.monthlyAdCredits ?? 0) > 0) lines.push(`${p.monthlyAdCredits} رصيد إعلانات شهريًا`);
    if ((p.teamSeats ?? 1) > 1) lines.push(`حتى ${p.teamSeats} أعضاء فريق`);
    if (p.analyticsAccess) lines.push('تحليلات أداء مفصّلة');
    if (p.prioritySupport) lines.push('دعم أولوية / مدير حساب');
    return lines;
  };

  return (
    <ProviderShell active="plan" title="الاشتراك والباقة">
      <style>{PP_CSS}</style>
      <div className="pp-wrap">
        <p className="pp-sub">اختار الباقة اللي تناسب شغلك وافتح مميزات تخليك متقدّم على المنصة.</p>

        {msg && <div className="pp-msg">{msg}</div>}
        {error && <div className="pp-err">{error}</div>}

        {loading ? (
          <div className="pp-loading">جاري التحميل...</div>
        ) : plans.length === 0 ? (
          <div className="pp-empty">مفيش باقات متاحة حاليًا.</div>
        ) : (
          <div className="pp-grid">
            {plans.map((p) => {
              const current = p.id === currentPlanId;
              return (
                <div key={p.id} className={`pp-card ${p.isFeatured ? 'pp-feat' : ''} ${current ? 'pp-current' : ''}`}>
                  {p.isFeatured && <div className="pp-ribbon">الأكثر اختيارًا</div>}
                  <div className="pp-name">
                    {p.name}
                    {p.badgeLabel && <span className="pp-badge">{p.badgeLabel}</span>}
                  </div>
                  {p.description && <div className="pp-desc">{p.description}</div>}
                  <div className="pp-price">
                    {Number(p.price) === 0 ? 'مجانًا' : `${Number(p.price).toLocaleString('en-US')} ج.م`}
                    <span className="pp-cycle">/ {p.billingCycle === 'YEARLY' ? 'سنة' : 'شهر'}</span>
                  </div>
                  <ul className="pp-perks">
                    {perkLines(p).map((l, i) => (
                      <li key={i}><Icon name="badgeCheck" size={15} /> {l}</li>
                    ))}
                  </ul>
                  {p.features && (
                    <ul className="pp-extra">
                      {p.features.split('\n').map((f, i) => (f.trim() ? <li key={i}>{f.trim()}</li> : null))}
                    </ul>
                  )}
                  {current ? (
                    <button className="pp-btn pp-btn-cur" disabled>باقتك الحالية</button>
                  ) : (
                    <button className="pp-btn" onClick={() => subscribe(p.id)} disabled={busyId === p.id}>
                      {busyId === p.id ? 'جاري التفعيل...' : Number(p.price) === 0 ? 'اختَر المجاني' : 'اشترك دلوقتي'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="pp-note">الدفع مبدئيًا بيتفعّل مباشرة (بوابة الدفع الفعلية هتتضاف لاحقًا).</p>
      </div>
    </ProviderShell>
  );
}

const PP_CSS = `
.pp-wrap{max-width:1080px;margin:0 auto;}
.pp-title{font-size:26px;font-weight:900;color:var(--ink);margin:0;}
.pp-sub{color:var(--muted);font-size:14px;margin:0 0 20px;}
.pp-msg{background:#e3f4ec;color:#1c7a4f;border:1px solid #bfe6d2;border-radius:10px;padding:10px 14px;font-size:14px;margin-bottom:14px;}
.pp-err{background:#fdecec;color:#b42318;border:1px solid #f5c6c2;border-radius:10px;padding:10px 14px;font-size:14px;margin-bottom:14px;}
.pp-loading,.pp-empty{padding:50px;text-align:center;color:var(--muted);}
.pp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.pp-card{position:relative;background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px 20px;display:flex;flex-direction:column;}
.pp-feat{border-color:var(--green);box-shadow:0 14px 34px rgba(40,125,115,.14);}
.pp-current{outline:2px solid var(--green-light);}
.pp-ribbon{position:absolute;top:14px;inset-inline-end:14px;background:var(--green);color:#fff;font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px;}
.pp-name{font-size:20px;font-weight:900;color:var(--ink);display:flex;align-items:center;gap:8px;}
.pp-badge{background:var(--mint);color:var(--green-dark);border:1px solid var(--green-light);font-size:11.5px;font-weight:800;padding:2px 9px;border-radius:999px;}
.pp-desc{color:var(--muted);font-size:13px;margin-top:6px;}
.pp-price{font-size:28px;font-weight:900;color:var(--green-dark);margin:14px 0 4px;}
.pp-cycle{font-size:14px;font-weight:600;color:var(--muted);margin-inline-start:4px;}
.pp-perks{list-style:none;padding:0;margin:12px 0;display:flex;flex-direction:column;gap:8px;}
.pp-perks li{display:flex;align-items:center;gap:8px;font-size:13.5px;color:var(--ink);}
.pp-perks li svg{color:var(--green);flex-shrink:0;}
.pp-extra{margin:0 0 12px;padding-inline-start:18px;color:var(--muted);font-size:12.5px;display:flex;flex-direction:column;gap:4px;}
.pp-btn{margin-top:auto;background:var(--green);color:#fff;border:none;font-weight:800;font-size:15px;padding:12px;border-radius:12px;cursor:pointer;}
.pp-btn:disabled{opacity:.6;cursor:default;}
.pp-btn-cur{background:var(--mint);color:var(--green-dark);}
.pp-note{text-align:center;color:var(--muted);font-size:12.5px;margin-top:20px;}
@media(max-width:820px){.pp-grid{grid-template-columns:1fr;max-width:440px;margin:0 auto;}}
`;
