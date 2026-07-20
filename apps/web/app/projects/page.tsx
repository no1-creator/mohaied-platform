'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ClientShell from '@/components/ClientShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

type Project = {
  id: string;
  title: string;
  field?: string | null;
  status: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
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

const FILTERS = [
  { key: 'ALL', label: 'الكل' },
  { key: 'OPEN', label: 'مفتوح' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { key: 'DISPUTED', label: 'نزاع' },
  { key: 'COMPLETED', label: 'مكتمل' },
  { key: 'CANCELLED', label: 'ملغي' },
];

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return s;
  }
}

export default function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading');
  const [filter, setFilter] = useState('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    api<Project[]>('/projects/mine')
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setState('ok');
      })
      .catch(() => setState('error'));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: projects.length };
    for (const p of projects) c[p.status] = (c[p.status] || 0) + 1;
    return c;
  }, [projects]);

  const filtered = useMemo(() => {
    return projects
      .filter((p) => (filter === 'ALL' ? true : p.status === filter))
      .filter((p) =>
        q.trim() ? p.title.toLowerCase().includes(q.trim().toLowerCase()) : true,
      )
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [projects, filter, q]);

  return (
    <ClientShell active="projects" title="مشاريعي">
      <style>{MP_CSS}</style>

      <div className="mp-toolbar">
        <div className="mp-search">
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم المشروع..."
          />
        </div>
        <Link href="/projects/start" className="mp-new">
          <Icon name="plus" size={18} /> مشروع جديد
        </Link>
      </div>

      <div className="mp-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`mp-tab ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="mp-count">{counts[f.key] || 0}</span>
          </button>
        ))}
      </div>

      {state === 'loading' && <div className="mp-note">جاري تحميل مشاريعك...</div>}
      {state === 'error' && (
        <div className="mp-note error">حصل خطأ في التحميل. حدّث الصفحة وحاول تاني.</div>
      )}

      {state === 'ok' && filtered.length === 0 && (
        <div className="mp-empty">
          <Icon name="folder" size={38} />
          <p>
            {projects.length === 0
              ? 'لسه مبدأتش أي مشروع.'
              : 'مفيش مشاريع في الفلتر ده.'}
          </p>
          {projects.length === 0 && (
            <Link href="/projects/start" className="mp-empty-cta">
              ابدأ أول مشروع
            </Link>
          )}
        </div>
      )}

      {state === 'ok' && filtered.length > 0 && (
        <div className="mp-grid">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="mp-card">
              <div className="mp-card-top">
                <span className={`mp-badge tone-${STATUS_TONE[p.status] || 'muted'}`}>
                  {STATUS_LABEL[p.status] || p.status}
                </span>
                <span className="mp-date">{fmtDate(p.createdAt)}</span>
              </div>
              <div className="mp-card-title">{p.title}</div>
              {p.field && (
                <div className="mp-card-field">
                  <Icon name="briefcase" size={14} /> {p.field}
                </div>
              )}
              <div className="mp-card-foot">
                عرض التفاصيل <Icon name="link" size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </ClientShell>
  );
}

const MP_CSS = `
.mp-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:16px;}
.mp-search{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 14px;flex:1;min-width:220px;color:var(--muted);}
.mp-search input{border:none;outline:none;background:transparent;font-family:inherit;font-size:14px;color:var(--ink);width:100%;}
.mp-new{display:inline-flex;align-items:center;gap:8px;background:var(--green);color:#fff;border-radius:12px;padding:11px 20px;font-weight:800;font-size:14.5px;text-decoration:none;white-space:nowrap;box-shadow:0 8px 20px rgba(40,125,115,.22);}
.mp-new:hover{background:var(--green-dark);}
.mp-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.mp-tab{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 15px;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--muted);cursor:pointer;transition:all .15s;}
.mp-tab:hover{border-color:var(--green-light);color:var(--green-dark);}
.mp-tab.active{background:var(--green);border-color:var(--green);color:#fff;}
.mp-count{background:rgba(0,0,0,.08);border-radius:999px;padding:1px 8px;font-size:12px;font-weight:800;}
.mp-tab.active .mp-count{background:rgba(255,255,255,.28);}
.mp-note{padding:40px 0;text-align:center;color:var(--muted);font-size:14px;}
.mp-note.error{color:#b91c1c;}
.mp-empty{text-align:center;padding:50px 20px;color:var(--muted);}
.mp-empty svg{color:var(--green-light);}
.mp-empty p{margin:12px 0 16px;font-size:14px;}
.mp-empty-cta{background:var(--green);color:#fff;border-radius:10px;padding:10px 20px;font-weight:700;text-decoration:none;font-size:14px;}
.mp-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
.mp-card{display:flex;flex-direction:column;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;text-decoration:none;transition:all .16s;box-shadow:0 4px 14px rgba(23,33,31,.04);}
.mp-card:hover{border-color:var(--green-light);transform:translateY(-3px);box-shadow:0 14px 30px rgba(40,125,115,.12);}
.mp-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;}
.mp-badge{display:inline-block;padding:4px 11px;border-radius:999px;font-size:12px;font-weight:700;}
.mp-badge.tone-blue{background:#e7f0fb;color:#2563a8;}
.mp-badge.tone-amber{background:#fef3e2;color:#b7791f;}
.mp-badge.tone-red{background:#fdeaea;color:#c0392b;}
.mp-badge.tone-ok{background:#e6f6ec;color:#1f8a4c;}
.mp-badge.tone-muted{background:#eef2f0;color:#70807b;}
.mp-date{font-size:12.5px;color:var(--muted);white-space:nowrap;}
.mp-card-title{font-size:16.5px;font-weight:800;color:var(--ink);line-height:1.5;margin-bottom:8px;}
.mp-card-field{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--muted);margin-bottom:14px;}
.mp-card-foot{margin-top:auto;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:var(--green-dark);}
@media(max-width:560px){
.mp-grid{grid-template-columns:1fr;}
.mp-new{width:100%;justify-content:center;}
}
`;
