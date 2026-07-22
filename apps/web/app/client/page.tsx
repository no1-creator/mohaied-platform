'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClientShell from '@/components/ClientShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Me = { fullName: string; role: string; isVerified?: boolean };
type Project = {
  id: string;
  title: string;
  field?: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'co.status.OPEN',
  IN_PROGRESS: 'co.status.IN_PROGRESS',
  DISPUTED: 'co.status.DISPUTED',
  COMPLETED: 'co.status.COMPLETED',
  CANCELLED: 'co.status.CANCELLED',
};

const STATUS_TONE: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'amber',
  DISPUTED: 'red',
  COMPLETED: 'ok',
  CANCELLED: 'muted',
};

const ACTIONS = [
  { href: '/projects/start', icon: 'plus', title: 'co.action.new.t', desc: 'co.action.new.d' },
  { href: '/projects', icon: 'folder', title: 'co.action.projects.t', desc: 'co.action.projects.d' },
  { href: '/complaints/mine', icon: 'scale', title: 'co.action.complaints.t', desc: 'co.action.complaints.d' },
  { href: '/profile', icon: 'user', title: 'co.action.profile.t', desc: 'co.action.profile.d' },
];

function fmtDate(s: string, locale: string) {
  try {
    return new Date(s).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return s;
  }
}

export default function ClientOverviewPage() {
  const { tr, lang } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    Promise.all([api<Me>('/users/me'), api<Project[]>('/projects/mine')])
      .then(([m, p]) => {
        setMe(m);
        setProjects(Array.isArray(p) ? p : []);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, []);

  const dateLocale = lang === 'en' ? 'en-US' : 'ar-EG';

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const disputed = projects.filter((p) => p.status === 'DISPUTED').length;

  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const STATS = [
    { label: tr('co.stat.total', 'إجمالي المشاريع'), value: total, icon: 'folder', tone: '' },
    { label: tr('co.stat.inProgress', 'قيد التنفيذ'), value: inProgress, icon: 'clock', tone: 'amber' },
    { label: tr('co.stat.completed', 'مكتملة'), value: completed, icon: 'badgeCheck', tone: 'ok' },
    { label: tr('co.stat.disputed', 'نزاعات'), value: disputed, icon: 'scale', tone: 'red' },
  ];

  return (
    <ClientShell active="overview" title={tr('co.title', 'نظرة عامة')}>
      <style>{CO_CSS}</style>

      {state === 'loading' && <div className="co-boot">{tr('co.loading', 'جاري تحميل لوحتك...')}</div>}
      {state === 'error' && (
        <div className="co-boot">{tr('co.error', 'حصل خطأ في تحميل البيانات. حدّث الصفحة وحاول تاني.')}</div>
      )}

      {state === 'ok' && (
        <>
          {/* هيرو ترحيبي */}
          <div className="co-hero">
            <div>
              <div className="co-hello">{tr('co.hello', 'أهلاً،')} {me?.fullName || tr('co.dearClient', 'عميلنا العزيز')} 👋</div>
              <p className="co-hero-sub">
                {tr('co.heroSub', 'من هنا تقدر تبدأ مشروع جديد، تتابع مشاريعك، وتدير نزاعاتك — كل ده تحت إشراف محايد.')}
              </p>
              {me && !me.isVerified && (
                <div className="co-verify">
                  <Icon name="badgeCheck" size={16} /> {tr('co.verify', 'حسابك لسه غير موثّق — وثّقه عشان تزيد ثقة مقدمي الخدمة فيك.')}
                </div>
              )}
            </div>
            <Link href="/projects/start" className="co-hero-cta">
              <Icon name="plus" size={18} /> {tr('co.action.new.t', 'مشروع جديد')}
            </Link>
          </div>

          {/* كروت الإحصائيات */}
          <div className="co-stats">
            {STATS.map((s) => (
              <div key={s.label} className={`co-stat ${s.tone ? 'tone-' + s.tone : ''}`}>
                <div className="co-stat-icon">
                  <Icon name={s.icon} size={22} />
                </div>
                <div>
                  <div className="co-stat-value">{s.value}</div>
                  <div className="co-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* اختصارات سريعة */}
          <div className="co-actions">
            {ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} className="co-action">
                <div className="co-action-icon">
                  <Icon name={a.icon} size={22} />
                </div>
                <div className="co-action-title">{tr(a.title)}</div>
                <div className="co-action-desc">{tr(a.desc)}</div>
              </Link>
            ))}
          </div>

          {/* آخر المشاريع */}
          <div className="co-panel">
            <div className="co-panel-head">
              <h2>{tr('co.recentTitle', 'آخر مشاريعك')}</h2>
              <Link href="/projects" className="co-link">
                {tr('co.viewAll', 'عرض الكل')}
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="co-empty">
                <Icon name="folder" size={34} />
                <p>{tr('co.emptyText', 'لسه مبدأتش أي مشروع.')}</p>
                <Link href="/projects/start" className="co-empty-cta">
                  {tr('co.emptyCta', 'ابدأ أول مشروع')}
                </Link>
              </div>
            ) : (
              <div className="co-table-wrap">
                <table className="co-table">
                  <thead>
                    <tr>
                      <th>{tr('co.th.project', 'المشروع')}</th>
                      <th>{tr('co.th.field', 'المجال')}</th>
                      <th>{tr('co.th.status', 'الحالة')}</th>
                      <th>{tr('co.th.date', 'التاريخ')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((p) => (
                      <tr key={p.id}>
                        <td className="co-td-title">{p.title}</td>
                        <td>{p.field || '—'}</td>
                        <td>
                          <span className={`co-badge tone-${STATUS_TONE[p.status] || 'muted'}`}>
                            {STATUS_LABEL[p.status] ? tr(STATUS_LABEL[p.status]) : p.status}
                          </span>
                        </td>
                        <td className="co-td-date">{fmtDate(p.createdAt, dateLocale)}</td>
                        <td>
                          <Link href={`/projects/${p.id}`} className="co-row-link">
                            {tr('co.details', 'تفاصيل')}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </ClientShell>
  );
}

const CO_CSS = `
.co-boot{padding:60px 0;text-align:center;color:var(--muted);font-size:15px;}
.co-hero{background:linear-gradient(135deg,var(--green),var(--green-dark));color:#fff;border-radius:18px;padding:26px 28px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;box-shadow:0 12px 30px rgba(33,108,99,.25);}
.co-hello{font-size:22px;font-weight:800;margin-bottom:6px;}
.co-hero-sub{font-size:14px;opacity:.92;line-height:1.9;max-width:560px;margin:0;}
.co-verify{margin-top:14px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:10px;padding:9px 13px;font-size:13px;display:inline-flex;align-items:center;gap:8px;}
.co-hero-cta{background:#fff;color:var(--green-dark);border-radius:12px;padding:12px 20px;font-weight:800;font-size:15px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;white-space:nowrap;box-shadow:0 6px 16px rgba(0,0,0,.15);}
.co-hero-cta:hover{background:var(--mint);}
.co-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:22px;}
.co-stat{background:#fff;border:1px solid var(--line);border-radius:15px;padding:18px;display:flex;align-items:center;gap:14px;}
.co-stat-icon{width:46px;height:46px;border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.co-stat.tone-amber .co-stat-icon{background:#fef3e2;color:#b7791f;}
.co-stat.tone-ok .co-stat-icon{background:#e6f6ec;color:#1f8a4c;}
.co-stat.tone-red .co-stat-icon{background:#fdeaea;color:#c0392b;}
.co-stat-value{font-size:26px;font-weight:800;color:var(--ink);line-height:1;}
.co-stat-label{font-size:13px;color:var(--muted);margin-top:5px;}
.co-actions{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:20px;}
.co-action{background:#fff;border:1px solid var(--line);border-radius:15px;padding:20px;text-decoration:none;transition:all .15s;display:block;}
.co-action:hover{border-color:var(--green-light);box-shadow:0 8px 20px rgba(33,108,99,.1);transform:translateY(-2px);}
.co-action-icon{width:44px;height:44px;border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
.co-action-title{font-size:15.5px;font-weight:800;color:var(--ink);margin-bottom:5px;}
.co-action-desc{font-size:13px;color:var(--muted);line-height:1.7;}
.co-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;margin-top:24px;}
.co-panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.co-panel-head h2{font-size:17px;font-weight:800;color:var(--ink);margin:0;}
.co-link{color:var(--green-dark);font-weight:700;font-size:13.5px;text-decoration:none;}
.co-link:hover{text-decoration:underline;}
.co-table-wrap{overflow-x:auto;}
.co-table{width:100%;border-collapse:collapse;font-size:14px;}
.co-table th{text-align:right;font-size:12.5px;color:var(--muted);font-weight:700;padding:10px 12px;border-bottom:1px solid var(--line);white-space:nowrap;}
.co-table td{padding:13px 12px;border-bottom:1px solid var(--line);color:var(--ink);}
.co-table tr:last-child td{border-bottom:none;}
.co-td-title{font-weight:700;}
.co-td-date{color:var(--muted);font-size:13px;white-space:nowrap;}
.co-badge{display:inline-block;padding:4px 11px;border-radius:20px;font-size:12.5px;font-weight:700;}
.co-badge.tone-blue{background:#e7f0fb;color:#2563a8;}
.co-badge.tone-amber{background:#fef3e2;color:#b7791f;}
.co-badge.tone-red{background:#fdeaea;color:#c0392b;}
.co-badge.tone-ok{background:#e6f6ec;color:#1f8a4c;}
.co-badge.tone-muted{background:#eef2f0;color:#70807b;}
.co-row-link{color:var(--green-dark);font-weight:700;font-size:13px;text-decoration:none;}
.co-row-link:hover{text-decoration:underline;}
.co-empty{text-align:center;padding:36px 0;color:var(--muted);}
.co-empty p{margin:12px 0 16px;font-size:14px;}
.co-empty-cta{background:var(--green);color:#fff;border-radius:10px;padding:10px 20px;font-weight:700;text-decoration:none;font-size:14px;}
@media(max-width:900px){
.co-stats{grid-template-columns:repeat(2,1fr);}
.co-actions{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:560px){
.co-stats{grid-template-columns:1fr;}
.co-actions{grid-template-columns:1fr;}
.co-hero{flex-direction:column;align-items:flex-start;}
}
`;
