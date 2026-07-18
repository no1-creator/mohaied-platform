'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';
import BackBar from '@/components/BackBar';

type Me = { id: string; fullName: string; role: string };

type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  commissionRate: string | number;
  features?: string | null;
  isFeatured: boolean;
};

type Sub = {
  id: string;
  status: string;
  expiresAt?: string | null;
  plan: Plan;
};

export default function SubscribePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadAll();
  }, [router]);

  async function loadAll() {
    setLoading(true);
    try {
      const [meRes, plansRes] = await Promise.all([
        api<Me>('/users/me'),
        api<Plan[]>('/subscriptions/plans'),
      ]);
      setMe(meRes);
      setPlans(plansRes);
      await loadMine();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMine() {
    try {
      const s = await api<Sub | null>('/subscriptions/mine');
      setSub(s && (s as any).plan ? s : null);
    } catch {
      setSub(null);
    }
  }

  async function subscribe(planId: string) {
    setBusy(planId);
    setError('');
    try {
      await api('/subscriptions/subscribe', { method: 'POST', body: { planId } });
      await loadMine();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const isProvider = me?.role === 'PROVIDER';

  function featureList(features?: string | null): string[] {
    if (!features) return [];
    return features
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);
  }

  return (
    <>
      <style>{SUB_CSS}</style>
      <TopBar />
      <BackBar />

      <div className="sb-wrap">
        <div className="sb-head">
          <h1 className="sb-title">الاشتراك والباقات</h1>
          <p className="sb-sub">
            اشترك في باقة عشان تظهر للعملاء، تقدّم عروض، وتاخد عمولة أقل على كل مرحلة.
          </p>
        </div>

        {loading ? (
          <div className="sb-loading">جاري التحميل...</div>
        ) : (
          <>
            {error && <div className="sb-error">{error}</div>}

            {!isProvider && (
              <div className="sb-note">
                صفحة الاشتراك دي مخصّصة لمقدّمي الخدمة. الاشتراك متاح لحساب مقدّم الخدمة بس.
              </div>
            )}

            {sub && sub.plan && (
              <div className="sb-current">
                <div className="sb-current-icon">
                  <Icon name="badgeCheck" size={24} />
                </div>
                <div>
                  <div>
                    باقتك الحالية: <b>{sub.plan.name}</b> — عمولة{' '}
                    <b>{Number(sub.plan.commissionRate)}%</b>
                  </div>
                  {sub.expiresAt && (
                    <div className="sb-c-sub">
                      متجدّدة حتى {new Date(sub.expiresAt).toLocaleDateString('ar-EG')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {plans.length === 0 ? (
              <div className="sb-note">مفيش باقات متاحة حاليًا. جرّب تاني قريب.</div>
            ) : (
              <div className="sb-grid">
                {plans.map((p) => {
                  const feats = featureList(p.features);
                  const isCurrent = sub?.plan?.id === p.id;
                  return (
                    <div key={p.id} className={`sb-card${p.isFeatured ? ' featured' : ''}`}>
                      {p.isFeatured && <span className="sb-flag">الأكثر طلبًا</span>}
                      <div className="sb-name">{p.name}</div>
                      <div className="sb-desc">{p.description || ''}</div>
                      <div className="sb-price">
                        <b>{Number(p.price).toLocaleString('en-US')}</b>
                        <span>ج.م / {p.billingCycle === 'YEARLY' ? 'سنة' : 'شهر'}</span>
                      </div>
                      <span className="sb-comm">عمولة {Number(p.commissionRate)}% على كل مرحلة</span>

                      {feats.length > 0 && (
                        <ul className="sb-feats">
                          {feats.map((f, i) => (
                            <li key={i}>
                              <Icon name="badgeCheck" size={16} />
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {isCurrent ? (
                        <button className="sb-btn current" disabled>
                          باقتك الحالية
                        </button>
                      ) : (
                        <button
                          className="sb-btn"
                          onClick={() => subscribe(p.id)}
                          disabled={!isProvider || busy === p.id}
                        >
                          {busy === p.id ? 'جاري الاشتراك...' : 'اشترك الآن'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const SUB_CSS = `
.sb-wrap{max-width:1000px;margin:0 auto;padding:30px 20px 80px;}
.sb-head{margin-bottom:24px;}
.sb-title{font-size:26px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.sb-sub{color:var(--muted);font-size:14px;margin:0;line-height:1.7;}
.sb-current{display:flex;align-items:center;gap:14px;background:linear-gradient(135deg,#e9f6f1,#f7faf8);border:1px solid var(--green-light);border-radius:16px;padding:18px 20px;margin-bottom:26px;}
.sb-current-icon{width:46px;height:46px;border-radius:12px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.sb-current b{color:var(--ink);}
.sb-c-sub{font-size:13px;color:var(--muted);margin-top:3px;}
.sb-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;}
.sb-card{position:relative;display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 6px 20px rgba(23,33,31,.05);}
.sb-card.featured{border-color:var(--green);box-shadow:0 12px 30px rgba(40,125,115,.16);}
.sb-flag{position:absolute;top:-11px;inset-inline-start:24px;background:var(--green);color:#fff;font-size:11.5px;font-weight:800;padding:4px 12px;border-radius:999px;}
.sb-name{font-size:18px;font-weight:800;color:var(--ink);margin-bottom:4px;}
.sb-desc{font-size:13px;color:var(--muted);min-height:36px;margin-bottom:14px;line-height:1.6;}
.sb-price{display:flex;align-items:baseline;gap:6px;margin-bottom:8px;}
.sb-price b{font-size:30px;font-weight:800;color:var(--ink);}
.sb-price span{font-size:13px;color:var(--muted);}
.sb-comm{display:inline-block;background:var(--sand);color:#7a5a12;font-size:12.5px;font-weight:700;padding:5px 12px;border-radius:999px;margin-bottom:16px;align-self:flex-start;}
.sb-feats{list-style:none;margin:0 0 20px;padding:0;display:flex;flex-direction:column;gap:10px;}
.sb-feats li{display:flex;align-items:flex-start;gap:8px;font-size:13.5px;color:var(--text);line-height:1.5;}
.sb-feats li svg{color:var(--green);flex-shrink:0;margin-top:2px;}
.sb-btn{margin-top:auto;border:none;background:var(--green);color:#fff;padding:12px;border-radius:11px;font-weight:800;font-size:14.5px;cursor:pointer;font-family:inherit;transition:background .15s;}
.sb-btn:hover{background:var(--green-dark);}
.sb-btn:disabled{opacity:.55;cursor:default;}
.sb-btn.current{background:var(--mint);color:var(--green-dark);cursor:default;opacity:1;}
.sb-loading{text-align:center;color:var(--muted);padding:70px 20px;}
.sb-error{max-width:460px;margin:0 auto 20px;background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:12px;padding:14px;text-align:center;font-size:14px;}
.sb-note{background:#fdf3dd;color:#7a5a12;border:1px solid #f0dfb0;border-radius:12px;padding:14px;font-size:14px;margin-bottom:20px;line-height:1.7;}
`;
