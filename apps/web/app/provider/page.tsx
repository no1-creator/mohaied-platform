'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

type Me = { id: string; fullName?: string; role?: string; isVerified?: boolean };
type Plan = {
  name: string;
  badgeLabel?: string | null;
  commissionRate?: string | number;
  maxOffers?: number | null;
  directoryPriority?: number | null;
  monthlyAdCredits?: number | null;
  teamSeats?: number | null;
  analyticsAccess?: boolean;
  prioritySupport?: boolean;
};
type Sub = { id: string; expiresAt?: string; plan?: Plan } | null;
type Offer = {
  id: string;
  status?: string;
  amount?: string | number;
  price?: string | number;
  project?: { id?: string; title?: string };
};
type OpenProject = { id: string; title: string; preferredProviderId?: string | null };

export default function ProviderWorkspacePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState<OpenProject[]>([]);
const [unread, setUnread] = useState(0);
const [adCredits, setAdCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);
const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    (async () => {
 const [meR, subR, offR, opR, unR, acR] = await Promise.allSettled([
  api<Me>('/users/me'),
  api<Sub>('/subscriptions/mine'),
  api<Offer[]>('/offers/mine'),
  api<OpenProject[]>('/projects/open'),
  api<{ count: number }>('/notifications/unread-count'),
  api<{ total: number; used: number; remaining: number }>('/ads/mine/credits'),
]);
if (meR.status === 'fulfilled') setMe(meR.value);
if (subR.status === 'fulfilled') setSub(subR.value);
if (offR.status === 'fulfilled' && Array.isArray(offR.value)) setOffers(offR.value);
if (opR.status === 'fulfilled' && Array.isArray(opR.value)) setOpen(opR.value);
if (unR.status === 'fulfilled') setUnread(Number(unR.value?.count) || 0);
if (acR.status === 'fulfilled') setAdCredits(acR.value);
setLoading(false);
    })();
  }, [router]);

  const plan = sub?.plan || null;
  const directCount = me ? open.filter((p) => p.preferredProviderId === me.id).length : 0;
  const pendingOffers = offers.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <main className="pw-main">
      <TopBar />
      <BackBar />
      <style>{PW_CSS}</style>
      <div className="pw-wrap">
        <div className="pw-head">
          <div>
            <h1 className="pw-title">بيئة عملك{me?.fullName ? `، ${me.fullName}` : ''} 👋</h1>
            <p className="pw-sub">مكانك اللي بتدير منه شغلك على محايد.</p>
          </div>
          {me?.isVerified && (
            <span className="pw-verified">
              <Icon name="badgeCheck" size={16} /> موثّق
            </span>
          )}
        </div>

        {loading ? (
          <div className="pw-loading">جاري التحميل...</div>
        ) : (
          <>
            {/* الاشتراك */}
            <div className={`pw-plan ${plan ? 'pw-plan-on' : ''}`}>
              <div className="pw-plan-info">
                <div className="pw-plan-label">{plan ? 'باقتك الحالية' : 'أنت على الباقة المجانية'}</div>
                <div className="pw-plan-name">
                  {plan?.name || 'مجاني'}
                  {plan?.badgeLabel && <span className="pw-badge">{plan.badgeLabel}</span>}
                </div>
                {plan ? (
                  <div className="pw-plan-meta">
                    العمولة {Number(plan.commissionRate ?? 0)}% · تنتهي {fmtDate(sub?.expiresAt)}
                  </div>
                ) : (
                  <div className="pw-plan-meta">اشترك عشان تقلّل العمولة وتفتح مميزات أكتر.</div>
                )}
              </div>
              <Link href="/provider/plans" className="pw-plan-btn">
                {plan ? 'غيّر باقتك' : 'شوف الباقات وارقّي'}
              </Link>
            </div>

            {/* مميزات الباقة */}
            {plan && (
              <div className="pw-perks">
                <Perk icon="creditCard" label="العمولة" value={`${Number(plan.commissionRate ?? 0)}%`} />
                <Perk icon="briefcase" label="حد العروض" value={plan.maxOffers != null ? String(plan.maxOffers) : 'غير محدود'} />
                <Perk icon="eye" label="أولوية الدليل" value={String(plan.directoryPriority ?? 0)} />
                <Perk icon="sparkles" label="رصيد إعلانات" value={String(plan.monthlyAdCredits ?? 0)} />
                <Perk icon="users" label="أعضاء الفريق" value={String(plan.teamSeats ?? 1)} />
                <Perk icon="star" label="تحليلات" value={plan.analyticsAccess ? 'مُفعّلة' : '—'} />
                <Perk icon="shield" label="دعم أولوية" value={plan.prioritySupport ? 'نعم' : '—'} />
              </div>
            )}

            {/* رصيد الإعلانات */}
{adCredits && adCredits.total > 0 && (
  <div className="pw-adcredit">
    <div className="pw-adcredit-info">
      <div className="pw-adcredit-label">رصيد إعلاناتك هذا الشهر</div>
      <div className="pw-adcredit-nums">
        <span className="pw-adcredit-remain">{adCredits.remaining}</span>
        <span className="pw-adcredit-of"> متبقّي من {adCredits.total}</span>
      </div>
      <div className="pw-adcredit-hint">
        أي إعلان تعمله من رصيدك بيتفعّل فورًا من غير مراجعة. الرصيد بيتجدّد أول كل شهر.
      </div>
    </div>
    <Link href="/advertise" className="pw-adcredit-btn">اعمل إعلان</Link>
  </div>
)}

{/* إحصائيات سريعة */}
            {/* إحصائيات سريعة */}
            <div className="pw-stats">
              <Stat label="عروضك" value={offers.length} hint={pendingOffers ? `${pendingOffers} قيد المراجعة` : undefined} />
              <Stat label="مشاريع متاحة" value={open.length} />
              <Stat label="طلبات مباشرة ليك" value={directCount} highlight={directCount > 0} />
              <Stat label="إشعارات غير مقروءة" value={unread} />
            </div>

            {/* روابط سريعة */}
            <div className="pw-actions">
              <ActionCard href="/projects/open" icon="folder" title="المشاريع المتاحة" desc="اتصفّح وقدّم عروضك" />
              <ActionCard href="/providers" icon="grid" title="دليل مقدمي الخدمة" desc="شوف ظهورك في الدليل" />
              <ActionCard href="/profile" icon="user" title="بروفايلي" desc="عدّل بياناتك ومعرض أعمالك" />
          <ActionCard href="/provider/plans" icon="creditCard" title="الباقات والاشتراك" desc="رقّي واحصل على مميزات" />
  {plan?.analyticsAccess && (
    <ActionCard href="/provider/analytics" icon="star" title="تحليلات أدائك" desc="عروضك وإعلاناتك بالأرقام" />
  )}
</div>

            {/* أحدث عروضك */}
            <div className="pw-panel">
              <div className="pw-panel-title">أحدث عروضك</div>
              {offers.length === 0 ? (
                <div className="pw-empty">
                  لسه مقدّمتش أي عرض.{' '}
                  <Link href="/projects/open" className="pw-link">اتصفّح المشاريع المتاحة ←</Link>
                </div>
              ) : (
                <div className="pw-list">
                  {offers.slice(0, 6).map((o) => (
                    <div key={o.id} className="pw-item">
                      <span className="pw-item-title">{o.project?.title || 'مشروع'}</span>
                      <span className="pw-item-side">
                        {(o.amount ?? o.price) != null && (
                          <span className="pw-item-amount">
                            {Number(o.amount ?? o.price).toLocaleString('en-US')} ج.م
                          </span>
                        )}
                        {o.status && <span className="pw-item-status">{statusAr(o.status)}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Perk({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="pw-perk">
      <Icon name={icon} size={18} />
      <div>
        <div className="pw-perk-label">{label}</div>
        <div className="pw-perk-value">{value}</div>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: number; hint?: string; highlight?: boolean }) {
  return (
    <div className={`pw-stat ${highlight ? 'pw-stat-hot' : ''}`}>
      <div className="pw-stat-value">{value}</div>
      <div className="pw-stat-label">{label}</div>
      {hint && <div className="pw-stat-hint">{hint}</div>}
    </div>
  );
}

function ActionCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link href={href} className="pw-action">
      <span className="pw-action-ic"><Icon name={icon} size={20} /></span>
      <span className="pw-action-t">{title}</span>
      <span className="pw-action-d">{desc}</span>
    </Link>
  );
}

function statusAr(s: string) {
  const map: Record<string, string> = {
    PENDING: 'قيد المراجعة',
    ACCEPTED: 'مقبول',
    REJECTED: 'مرفوض',
    WITHDRAWN: 'مسحوب',
  };
  return map[(s || '').toUpperCase()] || s;
}

const PW_CSS = `
.pw-main{min-height:100vh;background:var(--background);}
.pw-wrap{max-width:1000px;margin:0 auto;padding:24px 20px 60px;}
.pw-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:20px;}
.pw-title{font-size:24px;font-weight:900;color:var(--ink);margin:0;}
.pw-sub{color:var(--muted);font-size:14px;margin:4px 0 0;}
.pw-verified{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--green-dark);font-weight:800;font-size:13px;padding:6px 12px;border-radius:999px;white-space:nowrap;}
.pw-loading{padding:60px;text-align:center;color:var(--muted);}
.pw-plan{display:flex;justify-content:space-between;align-items:center;gap:16px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-bottom:14px;}
.pw-plan-on{background:linear-gradient(120deg,var(--green),var(--green-dark));border-color:transparent;color:#fff;}
.pw-plan-label{font-size:13px;opacity:.85;margin-bottom:2px;}
.pw-plan-name{font-size:20px;font-weight:900;display:flex;align-items:center;gap:8px;}
.pw-badge{background:rgba(255,255,255,.25);border:1px solid rgba(255,255,255,.5);font-size:12px;font-weight:800;padding:2px 10px;border-radius:999px;}
.pw-plan:not(.pw-plan-on) .pw-badge{background:var(--mint);border-color:var(--green-light);color:var(--green-dark);}
.pw-plan-meta{font-size:13px;opacity:.9;margin-top:4px;}
.pw-plan-btn{background:#fff;color:var(--green-dark);font-weight:800;font-size:14px;padding:10px 18px;border-radius:12px;white-space:nowrap;text-decoration:none;}
.pw-plan:not(.pw-plan-on) .pw-plan-btn{background:var(--green);color:#fff;}
.pw-perks{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;}
.pw-perk{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;color:var(--green-dark);}
.pw-perk-label{font-size:12px;color:var(--muted);}
.pw-perk-value{font-size:15px;font-weight:800;color:var(--ink);}
.pw-adcredit{display:flex;justify-content:space-between;align-items:center;gap:16px;background:var(--sand);border:1px solid var(--green-light);border-radius:14px;padding:16px 18px;margin-bottom:16px;}
.pw-adcredit-label{font-size:13px;color:var(--muted);margin-bottom:2px;}
.pw-adcredit-nums{font-size:20px;font-weight:900;color:var(--ink);}
.pw-adcredit-remain{color:var(--green-dark);font-size:26px;}
.pw-adcredit-of{font-size:14px;color:var(--muted);font-weight:700;}
.pw-adcredit-hint{font-size:12px;color:var(--muted);margin-top:4px;max-width:520px;}
.pw-adcredit-btn{background:var(--green);color:#fff;font-weight:800;font-size:14px;padding:10px 18px;border-radius:12px;white-space:nowrap;text-decoration:none;}
.pw-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
.pw-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.pw-stat-hot{border-color:var(--green);box-shadow:0 8px 20px rgba(40,125,115,.12);}
.pw-stat-value{font-size:26px;font-weight:900;color:var(--green-dark);}
.pw-stat-label{font-size:13px;color:var(--muted);margin-top:2px;}
.pw-stat-hint{font-size:11.5px;color:var(--green);font-weight:700;margin-top:2px;}
.pw-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:18px;}
.pw-action{display:flex;flex-direction:column;gap:4px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-decoration:none;transition:.15s;}
.pw-action:hover{border-color:var(--green);transform:translateY(-2px);}
.pw-action-ic{color:var(--green);}
.pw-action-t{font-weight:800;color:var(--ink);font-size:15px;}
.pw-action-d{font-size:12.5px;color:var(--muted);}
.pw-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;}
.pw-panel-title{font-weight:900;color:var(--ink);font-size:16px;margin-bottom:12px;}
.pw-empty{color:var(--muted);font-size:14px;padding:10px 0;}
.pw-link{color:var(--green-dark);font-weight:800;text-decoration:none;}
.pw-list{display:flex;flex-direction:column;gap:8px;}
.pw-item{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--line);border-radius:12px;}
.pw-item-title{font-weight:700;color:var(--ink);font-size:14px;}
.pw-item-side{display:flex;align-items:center;gap:10px;}
.pw-item-amount{font-weight:800;color:var(--green-dark);font-size:13px;}
.pw-item-status{font-size:12px;color:var(--muted);background:var(--mint);padding:3px 10px;border-radius:999px;}
@media(max-width:820px){.pw-perks,.pw-stats,.pw-actions{grid-template-columns:repeat(2,1fr);}}
@media(max-width:520px){.pw-plan,.pw-adcredit{flex-direction:column;align-items:flex-start;}.pw-perks,.pw-stats,.pw-actions{grid-template-columns:1fr 1fr;}}
`;
