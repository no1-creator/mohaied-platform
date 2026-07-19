'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ClientShell from '@/components/ClientShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

type Me = { fullName: string; isVerified: boolean };
type Project = { id: string; title: string; field: string; status: string; createdAt: string };

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  IN_PROGRESS: 'قيد التنفيذ',
  DISPUTED: 'نزاع',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

const STATUS_TONE: Record<string, string> = {
  OPEN: 'blue',
  IN_PROGRESS: 'amber',
  DISPUTED: 'red',
  COMPLETED: 'ok',
  CANCELLED: 'muted',
};

export default function ClientOverviewPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api<Me>('/users/me'), api<Project[]>('/projects/mine')])
      .then(([m, p]) => {
        setMe(m);
        setProjects(p);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completed = projects.filter((p) => p.status === 'COMPLETED').length;
  const disputed = projects.filter((p) => p.status === 'DISPUTED').length;
  const recent = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    { label: 'إجمالي المشاريع', value: total, icon: 'folder', tone: '' },
    { label: 'قيد التنفيذ', value: inProgress, icon: 'clock', tone: 'amber' },
    { label: 'مكتملة', value: completed, icon: 'badgeCheck', tone: 'ok' },
    { label: 'نزاعات', value: disputed, icon: 'scale', tone: 'red' },
  ];

  const actions = [
    { href: '/projects/start', icon: 'plus', title: 'مشروع جديد', desc: 'انشر مشروعك واستقبل عروض.', accent: true },
    { href: '/projects', icon: 'folder', title: 'مشاريعي', desc: 'تابع كل مشاريعك وحالتها.', accent: false },
    { href: '/complaints/mine', icon: 'scale', title: 'شكاويّ ونزاعاتي', desc: 'تابع الشكاوى وقرارات محايد.', accent: false },
    { href: '/profile', icon: 'user', title: 'ملفي الشخصي', desc: 'بياناتك وتوثيق حسابك.', accent: false },
  ];

  return (
    <ClientShell active="overview" title="نظرة عامة">
      <style>{CO_CSS}</style>

      {loading ? (
        <div className="co-state">جاري التحميل...</div>
      ) : error ? (
        <div className="co-state err">{error}</div>
      ) : (
        <>
          <div className="co-hero">
            <div className="co-hero-orb" />
            <div className="co-hero-in">
              <div className="co-badge">بيئة العميل</div>
              <h2>أهلًا بيك، {me?.fullName} 👋</h2>
              <p>تابع مشاريعك، استقبل العروض، وكل خطوة موثّقة وحقوقك محفوظة داخل محايد.</p>
              {me && !me.isVerified && <div className="co-unverified">⏳ حسابك بانتظار التوثيق</div>}
              <Link href="/projects/start" className="co-cta">
                <Icon name="plus" size={16} /> ابدأ مشروع جديد
              </Link>
            </div>
          </div>

          <div className="co-stats">
            {stats.map((s) => (
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

          <h3 className="co-sec">اختصاراتك</h3>
          <div className="co-actions">
            {actions.map((a) => (
              <Link key={a.href} href={a.href} className={`co-action ${a.accent ? 'accent' : ''}`}>
                <div className="co-action-icon">
                  <Icon name={a.icon} size={22} />
                </div>
                <div className="co-action-title">{a.title}</div>
                <div className="co-action-desc">{a.desc}</div>
              </Link>
            ))}
          </div>

          <h3 className="co-sec">أحدث مشاريعك</h3>
          {recent.length === 0 ? (
            <div className="co-empty">
              لسه مفيش مشاريع. <Link href="/projects/start">ابدأ أول مشروع</Link>
            </div>
          ) : (
            <div className="co-table-wrap">
              <table className="co-table">
                <thead>
                  <tr>
                    <th>المشروع</th>
                    <th>المجال</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`} className="co-link">
                          {p.title}
                        </Link>
                      </td>
                      <td>{p.field}</td>
                      <td>
                        <span className={`co-badge ${STATUS_TONE[p.status] || 'muted'}`}>
                          {STATUS_LABELS[p.status] || p.status}
                        </span>
                      </td>
                      <td className="co-date">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ClientShell>
  );
}

const CO_CSS = `
.co-state{padding:40px;text-align:center;color:var(--muted);background:#fff;border-radius:14px;border:1px solid var(--line);}
.co-state.err{color:#b4322b;background:#fdeceb;border-color:#f5cfcc;}
.co-hero{position:relative;overflow:hidden;border-radius:22px;padding:30px 28px;color:#fff;background:linear-gradient(135deg,#2f8d81,var(--green-dark) 60%,#184f48);box-shadow:0 22px 50px rgba(24,79,72,.24);margin-bottom:22px;}
.co-hero-orb{position:absolute;width:280px;height:280px;border-radius:50%;background:rgba(255,255,255,.08);top:-130px;inset-inline-start:-60px;pointer-events:none;}
.co-hero-in{position:relative;z-index:1;}
.co-badge{display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.24);padding:5px 13px;border-radius:999px;font-size:12px;font-weight:800;margin-bottom:12px;}
.co-hero-in h2{font-size:25px;font-weight:900;margin:0 0 8px;}
.co-hero-in p{font-size:14.5px;opacity:.95;line-height:1.8;margin:0 0 16px;max-width:560px;}
.co-unverified{display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:6px 13px;border-radius:10px;font-size:13px;font-weight:700;margin:0 0 16px;}
.co-cta{display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--green-dark);padding:12px 24px;border-radius:13px;font-weight:900;font-size:14.5px;text-decoration:none;box-shadow:0 12px 26px rgba(0,0,0,.15);transition:transform .16s;}
.co-cta:hover{transform:translateY(-2px);}
.co-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.co-stat{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;align-items:center;gap:14px;box-shadow:0 10px 26px rgba(24,70,61,.06);}
.co-stat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:var(--mint);color:var(--green-dark);flex-shrink:0;}
.co-stat-value{font-size:26px;font-weight:800;color:var(--ink);line-height:1;}
.co-stat-label{font-size:13px;color:var(--muted);margin-top:4px;}
.co-stat.tone-red .co-stat-icon{background:#fdeceb;color:#b4322b;}
.co-stat.tone-amber .co-stat-icon{background:#fdf3dd;color:#96690f;}
.co-stat.tone-ok .co-stat-icon{background:#e3f4ec;color:#1c7a4f;}
.co-sec{font-size:18px;font-weight:900;color:var(--ink);margin:28px 0 14px;}
.co-actions{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;}
.co-action{position:relative;display:flex;flex-direction:column;align-items:flex-start;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;text-decoration:none;transition:all .18s;box-shadow:0 4px 16px rgba(23,33,31,.04);}
.co-action:hover{border-color:var(--green-light);transform:translateY(-4px);box-shadow:0 16px 34px rgba(40,125,115,.14);}
.co-action-icon{width:48px;height:48px;border-radius:13px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;margin-bottom:12px;}
.co-action.accent .co-action-icon{background:linear-gradient(140deg,var(--green-light),var(--green-dark));color:#fff;}
.co-action-title{font-size:16px;font-weight:800;color:var(--ink);margin-bottom:4px;}
.co-action-desc{font-size:13px;color:var(--muted);line-height:1.6;}
.co-empty{padding:30px;text-align:center;color:var(--muted);background:#fff;border-radius:14px;border:1px solid var(--line);}
.co-empty a{color:var(--green-dark);font-weight:800;}
.co-table-wrap{background:#fff;border:1px solid var(--line);border-radius:16px;overflow:hidden;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.co-table{width:100%;border-collapse:collapse;font-size:14px;}
.co-table th{text-align:right;padding:14px 16px;background:var(--mint);color:var(--green-dark);font-weight:700;font-size:13px;}
.co-table td{padding:13px 16px;border-top:1px solid var(--line);color:var(--ink);}
.co-table tr:hover td{background:#fafcfb;}
.co-link{color:var(--green-dark);font-weight:700;text-decoration:none;}
.co-link:hover{text-decoration:underline;}
.co-date{color:var(--muted);font-size:13px;}
.co-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:12px;font-weight:700;}
.co-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.co-badge.muted{background:#eef1f0;color:var(--muted);}
.co-badge.red{background:#fdeceb;color:#b4322b;}
.co-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.co-badge.amber{background:#fdf3dd;color:#96690f;}
@media(max-width:900px){.co-stats{grid-template-columns:repeat(2,1fr);}}
@media(max-width:560px){.co-stats{grid-template-columns:1fr;}.co-hero-in h2{font-size:21px;}}
`;
