'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Project = {
  id: string;
  title: string;
  field: string;
  description: string;
  status: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  createdAt: string;
  client?: { id: string; fullName: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة',
  OPEN: 'مفتوح',
  IN_AGREEMENT: 'جاري الاتفاق',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  DISPUTED: 'متنازع عليه',
  CANCELLED: 'ملغي',
};
const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'pj-b-gray',
  OPEN: 'pj-b-blue',
  IN_AGREEMENT: 'pj-b-amber',
  IN_PROGRESS: 'pj-b-blue',
  COMPLETED: 'pj-b-green',
  DISPUTED: 'pj-b-red',
  CANCELLED: 'pj-b-gray',
};

const ACTIVE = ['IN_AGREEMENT', 'IN_PROGRESS'];
const OTHER = ['DRAFT', 'OPEN', 'DISPUTED', 'CANCELLED'];

type Tab = 'all' | 'active' | 'completed' | 'other';

export default function ProviderProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<Tab>('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Project[]>('/projects/mine')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const up = (s?: string) => (s || '').toUpperCase();
  const activeCount = projects.filter((p) => ACTIVE.includes(up(p.status))).length;
  const doneCount = projects.filter((p) => up(p.status) === 'COMPLETED').length;

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const s = up(p.status);
      if (tab === 'all') return true;
      if (tab === 'active') return ACTIVE.includes(s);
      if (tab === 'completed') return s === 'COMPLETED';
      return OTHER.includes(s);
    });
  }, [projects, tab]);

  const money = (v?: number | string | null) =>
    v === null || v === undefined || v === '' ? null : Number(v).toLocaleString('en-US');

  const TABS: { k: Tab; l: string }[] = [
    { k: 'all', l: 'الكل' },
    { k: 'active', l: 'جارية' },
    { k: 'completed', l: 'مكتملة' },
    { k: 'other', l: 'أخرى' },
  ];

  return (
    <ProviderShell active="myprojects" title="مشاريعي">
      <style>{PJ_CSS}</style>
      <div className="pj-wrap">
        {loading ? (
          <div className="pj-state">جاري التحميل...</div>
        ) : error ? (
          <div className="pj-state pj-err">{error}</div>
        ) : (
          <>
            <div className="pj-stats">
              <div className="pj-stat">
                <div className="pj-stat-n">{projects.length}</div>
                <div className="pj-stat-l">إجمالي المشاريع</div>
              </div>
              <div className="pj-stat good">
                <div className="pj-stat-n">{activeCount}</div>
                <div className="pj-stat-l">جارية الآن</div>
              </div>
              <div className="pj-stat good">
                <div className="pj-stat-n">{doneCount}</div>
                <div className="pj-stat-l">مكتملة</div>
              </div>
            </div>

            <div className="pj-tabs">
              {TABS.map((t) => (
                <button
                  key={t.k}
                  className={`pj-tab ${tab === t.k ? 'active' : ''}`}
                  onClick={() => setTab(t.k)}
                >
                  {t.l}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="pj-empty">
                <div className="pj-empty-ic"><Icon name="folder" size={30} /></div>
                <h3>مفيش مشاريع هنا</h3>
                <p>لما عرض من عروضك يتقبل، المشروع هيظهر هنا وتقدر تديره خطوة بخطوة.</p>
                <button className="pj-empty-btn" onClick={() => router.push('/projects/open')}>
                  تصفّح المشاريع المتاحة
                </button>
              </div>
            ) : (
              <div className="pj-list">
                {filtered.map((p) => {
                  const bMin = money(p.budgetMin);
                  const bMax = money(p.budgetMax);
                  const budget = bMin || bMax ? `${bMin ?? '—'} : ${bMax ?? '—'} ج.م` : null;
                  return (
                    <div key={p.id} className="pj-card" onClick={() => router.push(`/projects/${p.id}`)}>
                      <div className="pj-card-top">
                        <h3 className="pj-title">{p.title}</h3>
                        <span className={`pj-badge ${STATUS_CLASS[up(p.status)] || 'pj-b-gray'}`}>
                          {STATUS_LABEL[up(p.status)] || p.status}
                        </span>
                      </div>
                      <div className="pj-meta">
                        <span className="pj-m"><Icon name="briefcase" size={14} /> {p.field}</span>
                        {p.client?.fullName && (
                          <span className="pj-m"><Icon name="user" size={14} /> {p.client.fullName}</span>
                        )}
                        {budget && <span className="pj-m"><Icon name="creditCard" size={14} /> {budget}</span>}
                        {p.durationDays ? (
                          <span className="pj-m"><Icon name="clock" size={14} /> {p.durationDays} يوم</span>
                        ) : null}
                      </div>
                      <div className="pj-foot">
                        <span className="pj-date">{new Date(p.createdAt).toLocaleDateString('ar-EG')}</span>
                        <span className="pj-open">إدارة المشروع ↗</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ProviderShell>
  );
}

const PJ_CSS = `
.pj-wrap{max-width:900px;margin:0 auto;}
.pj-state{padding:50px;text-align:center;color:var(--muted);}
.pj-err{color:#b42318;}
.pj-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}
.pj-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.pj-stat.good{border-color:var(--green-light);}
.pj-stat-n{font-size:22px;font-weight:900;color:var(--green-dark);}
.pj-stat-l{font-size:12.5px;color:var(--muted);margin-top:3px;}
.pj-tabs{display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;}
.pj-tab{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 18px;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--muted);cursor:pointer;transition:all .15s;}
.pj-tab:hover{border-color:var(--green-light);}
.pj-tab.active{background:var(--green);border-color:var(--green);color:#fff;}
.pj-list{display:flex;flex-direction:column;gap:12px;}
.pj-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;cursor:pointer;transition:all .15s;}
.pj-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.1);}
.pj-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;}
.pj-title{font-size:16.5px;font-weight:800;color:var(--ink);margin:0;}
.pj-badge{font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px;white-space:nowrap;}
.pj-b-green{background:#e3f4ec;color:#1c7a4f;}
.pj-b-blue{background:#e6f0fb;color:#1e5fae;}
.pj-b-amber{background:#fdf0d9;color:#a86a12;}
.pj-b-red{background:#fdecec;color:#b42318;}
.pj-b-gray{background:#eef1f0;color:#67736f;}
.pj-meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-bottom:12px;}
.pj-m{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px;}
.pj-m svg{color:var(--green);}
.pj-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:12px;}
.pj-date{font-size:12.5px;color:var(--muted);}
.pj-open{color:var(--green-dark);font-weight:800;font-size:13px;}
.pj-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.pj-empty-ic{color:var(--green);margin-bottom:10px;}
.pj-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.pj-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.pj-empty-btn{background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;font-family:inherit;}
@media(max-width:640px){.pj-stats{grid-template-columns:1fr 1fr;}.pj-meta{gap:12px;}}
`;
