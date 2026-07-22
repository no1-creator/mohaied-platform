'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import Icon from '@/components/Icon';
import ProviderShell from '@/components/ProviderShell';
import { useI18n } from '@/lib/i18n';

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
type MineProject = { id: string; status?: string };
type ExtProject = { id: string; status?: string };
type Invoice = { id: string; status?: string; total?: number | string | null };
type Wallet = { available?: number; currency?: string };
type Task = { status?: string; dueDate?: string | null };

export default function ProviderWorkspacePage() {
  const router = useRouter();
  const { tr, lang } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [open, setOpen] = useState<OpenProject[]>([]);
  const [unread, setUnread] = useState(0);
  const [adCredits, setAdCredits] = useState<{ total: number; used: number; remaining: number } | null>(null);
  const [clients, setClients] = useState<{ id: string }[]>([]);
  const [mineProjects, setMineProjects] = useState<MineProject[]>([]);
  const [extProjects, setExtProjects] = useState<ExtProject[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    (async () => {
      const [meR, subR, offR, opR, unR, acR, clR, mpR, epR, invR, wR, tR] = await Promise.allSettled([
        api<Me>('/users/me'),
        api<Sub>('/subscriptions/mine'),
        api<Offer[]>('/offers/mine'),
        api<OpenProject[]>('/projects/open'),
        api<{ count: number }>('/notifications/unread-count'),
        api<{ total: number; used: number; remaining: number }>('/ads/mine/credits'),
        api<{ id: string }[]>('/clients'),
        api<MineProject[]>('/projects/mine'),
        api<ExtProject[]>('/external-projects'),
        api<Invoice[]>('/invoices'),
        api<Wallet>('/wallet'),
        api<Task[]>('/tasks'),
      ]);
      if (meR.status === 'fulfilled') setMe(meR.value);
      if (subR.status === 'fulfilled') setSub(subR.value);
      if (offR.status === 'fulfilled' && Array.isArray(offR.value)) setOffers(offR.value);
      if (opR.status === 'fulfilled' && Array.isArray(opR.value)) setOpen(opR.value);
      if (unR.status === 'fulfilled') setUnread(Number(unR.value?.count) || 0);
      if (acR.status === 'fulfilled') setAdCredits(acR.value);
      if (clR.status === 'fulfilled' && Array.isArray(clR.value)) setClients(clR.value);
      if (mpR.status === 'fulfilled' && Array.isArray(mpR.value)) setMineProjects(mpR.value);
      if (epR.status === 'fulfilled' && Array.isArray(epR.value)) setExtProjects(epR.value);
      if (invR.status === 'fulfilled' && Array.isArray(invR.value)) setInvoices(invR.value);
      if (wR.status === 'fulfilled') setWallet(wR.value);
      if (tR.status === 'fulfilled' && Array.isArray(tR.value)) setTasks(tR.value);
      setLoading(false);
    })();
  }, [router]);

  const plan = sub?.plan || null;
  const directCount = me ? open.filter((p) => p.preferredProviderId === me.id).length : 0;
  const pendingOffers = offers.filter((o) => (o.status || '').toUpperCase() === 'PENDING').length;
  const dateLocale = lang === 'en' ? 'en-US' : 'ar-EG';

  const num = (v?: number | string | null) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const egp = (v: number, c?: string) => `${v.toLocaleString('en-US')} ${c || tr('common.currency', 'ج.م')}`;

  const activeProjects =
    mineProjects.filter((p) => ['IN_AGREEMENT', 'IN_PROGRESS'].includes((p.status || '').toUpperCase())).length +
    extProjects.filter((p) => ['NEW', 'IN_PROGRESS'].includes((p.status || '').toUpperCase())).length;
  const outstanding = invoices
    .filter((i) => (i.status || '').toUpperCase() === 'SENT')
    .reduce((s, i) => s + num(i.total), 0);
  const paidTotal = invoices
    .filter((i) => (i.status || '').toUpperCase() === 'PAID')
    .reduce((s, i) => s + num(i.total), 0);

  const tasksAttention = (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return tasks.filter((t) => {
      if ((t.status || '').toUpperCase() === 'DONE' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d.getTime() <= today.getTime();
    }).length;
  })();

  const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString(dateLocale, { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

  return (
    <ProviderShell active="overview" title={tr('co.title', 'نظرة عامة')}>
      <style>{PW_CSS}</style>
      <div className="pw-wrap">
        {loading ? (
          <div className="pw-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
        ) : (
          <>
            {/* الاشتراك */}
            <div className={`pw-plan ${plan ? 'pw-plan-on' : ''}`}>
              <div className="pw-plan-info">
                <div className="pw-plan-label">{plan ? tr('pw.plan.current', 'باقتك الحالية') : tr('pw.plan.free', 'أنت على الباقة المجانية')}</div>
                <div className="pw-plan-name">
                  {plan?.name || tr('pw.plan.freeName', 'مجاني')}
                  {plan?.badgeLabel && <span className="pw-badge">{plan.badgeLabel}</span>}
                </div>
                {plan ? (
                  <div className="pw-plan-meta">
                    {tr('pw.plan.commission', 'العمولة')} {Number(plan.commissionRate ?? 0)}% · {tr('pw.plan.expires', 'تنتهي')} {fmtDate(sub?.expiresAt)}
                  </div>
                ) : (
                  <div className="pw-plan-meta">{tr('pw.plan.freeMeta', 'اشترك عشان تقلّل العمولة وتفتح مميزات أكتر.')}</div>
                )}
              </div>
              <Link href="/provider/plans" className="pw-plan-btn">
                {plan ? tr('pw.plan.change', 'غيّر باقتك') : tr('pw.plan.see', 'شوف الباقات وارقّي')}
              </Link>
            </div>

            {/* بيئة عملك */}
            <div className="pw-section-h">{tr('pw.sec.workspace', 'بيئة عملك')}</div>
            <div className="pw-stats">
              <Stat label={tr('pw.stat.clients', 'عملاؤك')} value={clients.length} />
              <Stat label={tr('pw.stat.activeProjects', 'مشاريع جارية')} value={activeProjects} highlight={activeProjects > 0} />
              <Stat label={tr('pw.stat.available', 'الرصيد المتاح')} value={egp(num(wallet?.available), wallet?.currency)} money highlight={num(wallet?.available) > 0} />
              <Stat label={tr('pw.stat.outstanding', 'مستحق (فواتير مُرسلة)')} value={egp(outstanding)} money warn={outstanding > 0} />
              <Stat label={tr('pw.stat.tasksAttention', 'مهام تحتاج انتباه')} value={tasksAttention} warn={tasksAttention > 0} />
              <Stat label={tr('pw.stat.collected', 'محصّل (مدفوع)')} value={egp(paidTotal)} money />
            </div>
            <div className="pw-actions">
              <ActionCard href="/provider/clients" icon="users" title={tr('pw.act.clients.t', 'عملائي')} desc={tr('pw.act.clients.d', 'أدر عملاءك وبياناتهم')} />
              <ActionCard href="/provider/projects" icon="folder" title={tr('pw.act.projects.t', 'مشاريعي')} desc={tr('pw.act.projects.d', 'متابعة كل مشاريعك')} />
              <ActionCard href="/provider/invoices" icon="fileText" title={tr('pw.act.invoices.t', 'الفواتير')} desc={tr('pw.act.invoices.d', 'افوتر وتابع المستحقات')} />
              <ActionCard href="/provider/wallet" icon="landmark" title={tr('pw.act.wallet.t', 'المحفظة')} desc={tr('pw.act.wallet.d', 'أرباحك وطلبات السحب')} />
              <ActionCard href="/provider/tasks" icon="fileCheck" title={tr('pw.act.tasks.t', 'المهام')} desc={tr('pw.act.tasks.d', 'نظّم شغلك ومواعيدك')} />
              <ActionCard href="/provider/profile" icon="user" title={tr('pw.act.profile.t', 'ملفي الاحترافي')} desc={tr('pw.act.profile.d', 'عدّل بياناتك ومعرض أعمالك')} />
            </div>

            {/* مميزات الباقة */}
            {plan && (
              <div className="pw-perks">
                <Perk icon="creditCard" label={tr('pw.perk.commission', 'العمولة')} value={`${Number(plan.commissionRate ?? 0)}%`} />
                <Perk icon="briefcase" label={tr('pw.perk.maxOffers', 'حد العروض')} value={plan.maxOffers != null ? String(plan.maxOffers) : tr('pw.unlimited', 'غير محدود')} />
                <Perk icon="eye" label={tr('pw.perk.priority', 'أولوية الدليل')} value={String(plan.directoryPriority ?? 0)} />
                <Perk icon="sparkles" label={tr('pw.perk.adCredits', 'رصيد إعلانات')} value={String(plan.monthlyAdCredits ?? 0)} />
                <Perk icon="users" label={tr('pw.perk.seats', 'أعضاء الفريق')} value={String(plan.teamSeats ?? 1)} />
                <Perk icon="star" label={tr('pw.perk.analytics', 'تحليلات')} value={plan.analyticsAccess ? tr('pw.enabled', 'مُفعّلة') : '—'} />
                <Perk icon="shield" label={tr('pw.perk.support', 'دعم أولوية')} value={plan.prioritySupport ? tr('pw.yes', 'نعم') : '—'} />
              </div>
            )}

            {/* رصيد الإعلانات */}
            {adCredits && adCredits.total > 0 && (
              <div className="pw-adcredit">
                <div className="pw-adcredit-info">
                  <div className="pw-adcredit-label">{tr('pw.ad.label', 'رصيد إعلاناتك هذا الشهر')}</div>
                  <div className="pw-adcredit-nums">
                    <span className="pw-adcredit-remain">{adCredits.remaining}</span>
                    <span className="pw-adcredit-of"> {tr('pw.ad.remainOf', 'متبقّي من')} {adCredits.total}</span>
                  </div>
                  <div className="pw-adcredit-hint">
                    {tr('pw.ad.hint', 'أي إعلان تعمله من رصيدك بيتفعّل فورًا من غير مراجعة. الرصيد بيتجدّد أول كل شهر.')}
                  </div>
                </div>
                <Link href="/advertise" className="pw-adcredit-btn">{tr('pw.ad.btn', 'اعمل إعلان')}</Link>
              </div>
            )}

            {/* إحصائيات المنصة */}
            <div className="pw-section-h">{tr('pw.sec.activity', 'نشاطك على المنصة')}</div>
            <div className="pw-stats">
              <Stat label={tr('pw.stat.offers', 'عروضك')} value={offers.length} hint={pendingOffers ? `${pendingOffers} ${tr('pw.stat.pendingReview', 'قيد المراجعة')}` : undefined} />
              <Stat label={tr('pw.stat.openProjects', 'مشاريع متاحة')} value={open.length} />
              <Stat label={tr('pw.stat.directRequests', 'طلبات مباشرة ليك')} value={directCount} highlight={directCount > 0} />
              <Stat label={tr('pw.stat.unread', 'إشعارات غير مقروءة')} value={unread} />
            </div>

            {/* روابط سريعة */}
            <div className="pw-actions">
              <ActionCard href="/projects/open" icon="folder" title={tr('pw.act.openProjects.t', 'المشاريع المتاحة')} desc={tr('pw.act.openProjects.d', 'اتصفّح وقدّم عروضك')} />
              <ActionCard href="/providers" icon="grid" title={tr('pw.act.directory.t', 'دليل مقدمي الخدمة')} desc={tr('pw.act.directory.d', 'شوف ظهورك في الدليل')} />
              <ActionCard href="/offers/mine" icon="fileText" title={tr('pw.act.offers.t', 'عروضي')} desc={tr('pw.act.offers.d', 'تابع كل عروضك')} />
              <ActionCard href="/provider/plans" icon="creditCard" title={tr('pw.act.plans.t', 'الباقات والاشتراك')} desc={tr('pw.act.plans.d', 'رقّي واحصل على مميزات')} />
              {plan?.analyticsAccess && (
                <ActionCard href="/provider/analytics" icon="star" title={tr('pw.act.analytics.t', 'تحليلات أدائك')} desc={tr('pw.act.analytics.d', 'عروضك وإعلاناتك بالأرقام')} />
              )}
            </div>

            {/* أحدث عروضك */}
            <div className="pw-panel">
              <div className="pw-panel-title">{tr('pw.recentOffers', 'أحدث عروضك')}</div>
              {offers.length === 0 ? (
                <div className="pw-empty">
                  {tr('pw.noOffers', 'لسه مقدّمتش أي عرض.')}{' '}
                  <Link href="/projects/open" className="pw-link">{tr('pw.browseOpen', 'اتصفّح المشاريع المتاحة ←')}</Link>
                </div>
              ) : (
                <div className="pw-list">
                  {offers.slice(0, 6).map((o) => (
                    <div key={o.id} className="pw-item">
                      <span className="pw-item-title">{o.project?.title || tr('pw.projectFallback', 'مشروع')}</span>
                      <span className="pw-item-side">
                        {(o.amount ?? o.price) != null && (
                          <span className="pw-item-amount">
                            {Number(o.amount ?? o.price).toLocaleString('en-US')} {tr('common.currency', 'ج.م')}
                          </span>
                        )}
                        {o.status && <span className="pw-item-status">{tr(statusAr(o.status))}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </ProviderShell>
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

function Stat({
  label,
  value,
  hint,
  highlight,
  money,
  warn,
}: {
  label: string;
  value: number | string;
  hint?: string;
  highlight?: boolean;
  money?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={`pw-stat ${highlight ? 'pw-stat-hot' : ''} ${warn ? 'pw-stat-warn' : ''}`}>
      <div className={`pw-stat-value ${money ? 'pw-stat-money' : ''}`}>{value}</div>
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
    PENDING: 'pw.stat.pendingReview',
    ACCEPTED: 'pw.status.accepted',
    REJECTED: 'pw.status.rejected',
    WITHDRAWN: 'pw.status.withdrawn',
  };
  return map[(s || '').toUpperCase()] || s;
}

const PW_CSS = `
.pw-wrap{max-width:1040px;margin:0 auto;}
.pw-loading{padding:60px;text-align:center;color:var(--muted);}
.pw-section-h{font-size:15px;font-weight:900;color:var(--ink);margin:6px 2px 12px;}
.pw-plan{display:flex;justify-content:space-between;align-items:center;gap:16px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;margin-bottom:18px;}
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
.pw-adcredit{display:flex;justify-content:space-between;align-items:center;gap:16px;background:var(--sand);border:1px solid var(--green-light);border-radius:14px;padding:16px 18px;margin-bottom:18px;}
.pw-adcredit-label{font-size:13px;color:var(--muted);margin-bottom:2px;}
.pw-adcredit-nums{font-size:20px;font-weight:900;color:var(--ink);}
.pw-adcredit-remain{color:var(--green-dark);font-size:26px;}
.pw-adcredit-of{font-size:14px;color:var(--muted);font-weight:700;}
.pw-adcredit-hint{font-size:12px;color:var(--muted);margin-top:4px;max-width:520px;}
.pw-adcredit-btn{background:var(--green);color:#fff;font-weight:800;font-size:14px;padding:10px 18px;border-radius:12px;white-space:nowrap;text-decoration:none;}
.pw-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:14px;}
.pw-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.pw-stat-hot{border-color:var(--green);box-shadow:0 8px 20px rgba(40,125,115,.12);}
.pw-stat-warn{border-color:#f0d9a8;}
.pw-stat-value{font-size:26px;font-weight:900;color:var(--green-dark);}
.pw-stat-money{font-size:19px;}
.pw-stat-warn .pw-stat-value{color:#a86a12;}
.pw-stat-label{font-size:13px;color:var(--muted);margin-top:2px;}
.pw-stat-hint{font-size:11.5px;color:var(--green);font-weight:700;margin-top:2px;}
.pw-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px;}
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
