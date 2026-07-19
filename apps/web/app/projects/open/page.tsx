'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Project = {
  id: string;
  title: string;
  field: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredProviderId?: string | null;
  client?: { fullName: string };
};

export default function OpenProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myId, setMyId] = useState('');
  const [q, setQ] = useState('');
  const [field, setField] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ id: string }>('/users/me').then((u) => setMyId(u?.id || '')).catch(() => setMyId(''));
    api<Project[]>('/projects/open')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fields = useMemo(
    () => Array.from(new Set(projects.map((p) => p.field).filter(Boolean))),
    [projects]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects.filter((p) => {
      if (field && p.field !== field) return false;
      if (!term) return true;
      return (
        (p.title || '').toLowerCase().includes(term) ||
        (p.description || '').toLowerCase().includes(term) ||
        (p.field || '').toLowerCase().includes(term)
      );
    });
  }, [projects, q, field]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const am = myId && a.preferredProviderId === myId ? 1 : 0;
      const bm = myId && b.preferredProviderId === myId ? 1 : 0;
      return bm - am;
    });
  }, [filtered, myId]);

  const directCount = projects.filter((p) => myId && p.preferredProviderId === myId).length;

  return (
    <ProviderShell active="projects" title="تصفّح المشاريع">
      <style>{OP_CSS}</style>
      <div className="op-wrap">
        {loading ? (
          <div className="op-state">جاري التحميل...</div>
        ) : error ? (
          <div className="op-state op-err">{error}</div>
        ) : (
          <>
            <div className="op-bar">
              <div className="op-search">
                <Icon name="search" size={17} />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="ابحث بالعنوان أو المجال أو الوصف..."
                />
              </div>
              <select className="op-select" value={field} onChange={(e) => setField(e.target.value)}>
                <option value="">كل المجالات</option>
                {fields.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="op-count">
              {sorted.length} مشروع متاح
              {directCount > 0 && <span className="op-direct-note"> · {directCount} طلب مباشر ليك ★</span>}
            </div>

            {sorted.length === 0 ? (
              <div className="op-empty">
                <div className="op-empty-ic"><Icon name="search" size={30} /></div>
                <h3>مفيش مشاريع مطابقة</h3>
                <p>جرّب تغيّر كلمة البحث أو المجال، أو ارجع بعدين — بننزّل مشاريع جديدة باستمرار.</p>
              </div>
            ) : (
              <div className="op-grid">
                {sorted.map((p) => {
                  const direct = !!myId && p.preferredProviderId === myId;
                  const budget =
                    p.budgetMin || p.budgetMax
                      ? `${p.budgetMin ?? '—'} : ${p.budgetMax ?? '—'} ج.م`
                      : null;
                  return (
                    <div key={p.id} className={`op-card ${direct ? 'op-card-direct' : ''}`}>
                      {direct && <div className="op-direct">★ طلب مباشر ليك</div>}
                      <div className="op-card-top">
                        <span className="op-field"><Icon name="briefcase" size={14} /> {p.field}</span>
                        {budget && <span className="op-budget">{budget}</span>}
                      </div>
                      <h3 className="op-title">{p.title}</h3>
                      <p className="op-desc">{p.description}</p>
                      <div className="op-foot">
                        {p.client?.fullName && (
                          <span className="op-client"><Icon name="user" size={14} /> {p.client.fullName}</span>
                        )}
                        <Link href={`/offers/new?projectId=${p.id}`} className="op-btn">
                          قدّم عرض
                        </Link>
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

const OP_CSS = `
.op-wrap{max-width:1000px;margin:0 auto;}
.op-state{padding:50px;text-align:center;color:var(--muted);}
.op-err{color:#b42318;}
.op-bar{display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap;}
.op-search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 14px;}
.op-search svg{color:var(--muted);flex-shrink:0;}
.op-search input{border:none;outline:none;background:transparent;padding:12px 0;width:100%;font-family:inherit;font-size:14px;color:var(--ink);}
.op-select{background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 14px;font-family:inherit;font-size:14px;color:var(--ink);cursor:pointer;min-width:160px;}
.op-count{font-size:13px;color:var(--muted);margin-bottom:14px;font-weight:700;}
.op-direct-note{color:var(--green-dark);}
.op-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.op-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;flex-direction:column;transition:all .15s;}
.op-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.08);}
.op-card-direct{border-color:var(--green);box-shadow:0 10px 26px rgba(40,125,115,.12);}
.op-direct{display:inline-block;align-self:flex-start;background:var(--green);color:#fff;font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;margin-bottom:10px;}
.op-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.op-field{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--muted);}
.op-field svg{color:var(--green);}
.op-budget{font-size:12.5px;font-weight:800;color:var(--green-dark);white-space:nowrap;}
.op-title{font-size:17px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.op-desc{font-size:13.5px;color:var(--muted);line-height:1.8;margin:0 0 16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;flex:1;}
.op-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto;}
.op-client{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--muted);}
.op-client svg{color:var(--muted);}
.op-btn{background:var(--green);color:#fff;padding:9px 20px;border-radius:11px;font-size:13.5px;font-weight:800;text-decoration:none;transition:background .15s;}
.op-btn:hover{background:var(--green-dark);}
.op-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.op-empty-ic{color:var(--green);margin-bottom:10px;}
.op-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.op-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0;}
@media(max-width:720px){.op-grid{grid-template-columns:1fr;}}
`;
