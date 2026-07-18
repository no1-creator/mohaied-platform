'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type ProviderProfile = {
  type?: string | null;
  companyName?: string | null;
  field?: string | null;
  bio?: string | null;
  yearsExp?: number | null;
  teamSize?: number | null;
  city?: string | null;
  website?: string | null;
  portfolioUrl?: string | null;
  skills?: string[] | string | null;
  rating?: number | string | null;
  reviewsCount?: number | null;
};

type Provider = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
  providerProfile: ProviderProfile | null;
};

const ICON_CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </svg>
);

function initials(name: string) {
  const parts = (name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || '').join('') || '؟';
}
function toSkills(skills?: string[] | string | null): string[] {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.filter(Boolean);
  return String(skills).split(',').map((s) => s.trim()).filter(Boolean);
}
function ratingText(r?: number | string | null): string | null {
  if (r === null || r === undefined || r === '') return null;
  const n = Number(r);
  if (Number.isNaN(n) || n <= 0) return null;
  return n.toFixed(1);
}

const PD_CSS = `
.pd-wrap{max-width:1040px;margin:0 auto;width:100%;padding:24px 20px 90px;}
.pd-title{font-size:25px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.pd-sub{color:var(--muted);font-size:14px;line-height:1.7;margin:0;}
.pd-tools{display:flex;gap:12px;flex-wrap:wrap;margin:20px 0 22px;}
.pd-search{flex:1;min-width:220px;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;}
.pd-search:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.pd-select{border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;min-width:160px;}
.pd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.pd-card{text-align:right;background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;cursor:pointer;transition:transform .15s,box-shadow .15s,border-color .15s;font-family:inherit;display:flex;flex-direction:column;gap:12px;}
.pd-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(24,70,61,.08);border-color:var(--green-light);}
.pd-top{display:flex;align-items:center;gap:12px;}
.pd-av{width:52px;height:52px;border-radius:14px;object-fit:cover;flex-shrink:0;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;}
.pd-name{font-size:16px;font-weight:800;color:var(--ink);margin:0;display:flex;align-items:center;gap:6px;}
.pd-verified{display:inline-flex;color:var(--green);}
.pd-meta{font-size:12.5px;color:var(--muted);margin:2px 0 0;}
.pd-bio{font-size:13px;color:var(--muted);line-height:1.7;margin:0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pd-chips{display:flex;flex-wrap:wrap;gap:6px;}
.pd-chip{background:var(--mint);color:var(--green-dark);font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;}
.pd-foot{display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:6px;}
.pd-rate{font-size:12.5px;color:var(--ink);font-weight:700;}
.pd-view{font-size:13px;font-weight:800;color:var(--green-dark);}
.pd-empty{text-align:center;color:var(--muted);padding:50px 20px;font-size:14.5px;grid-column:1/-1;}
.pd-state{text-align:center;color:var(--muted);padding:40px 20px;font-size:14px;}
@media(max-width:560px){.pd-grid{grid-template-columns:1fr;}.pd-title{font-size:21px;}}
`;

export default function ProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [field, setField] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Provider[]>('/users/providers')
      .then((data) => setProviders(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message || 'حصل خطأ أثناء التحميل'))
      .finally(() => setLoading(false));
  }, [router]);

  const fields = useMemo(() => {
    const s = new Set<string>();
    providers.forEach((p) => {
      const f = p.providerProfile?.field;
      if (f) s.add(f);
    });
    return Array.from(s);
  }, [providers]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return providers.filter((p) => {
      const pp = p.providerProfile;
      if (field && pp?.field !== field) return false;
      if (!term) return true;
      const hay = [p.fullName, pp?.companyName, pp?.field, pp?.city, pp?.bio, ...toSkills(pp?.skills)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(term);
    });
  }, [providers, q, field]);

  return (
    <>
      <style>{PD_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="pd-wrap">
        <h1 className="pd-title">دليل مقدمي الخدمة</h1>
        <p className="pd-sub">
          اتصفّح مقدمي الخدمة المعتمدين على محايد، شوف تقييماتهم وأعمالهم، واختار اللي يناسب مشروعك.
        </p>

        <div className="pd-tools">
          <input
            className="pd-search"
            placeholder="ابحث بالاسم، الشركة، المجال، أو المهارة..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="pd-select" value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">كل المجالات</option>
            {fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="pd-state">جاري التحميل...</div>}
        {error && !loading && <div className="pd-state">{error}</div>}

        {!loading && !error && (
          <div className="pd-grid">
            {filtered.length === 0 && (
              <div className="pd-empty">مفيش مقدمي خدمة مطابقين لبحثك دلوقتي.</div>
            )}
            {filtered.map((p) => {
              const pp = p.providerProfile;
              const displayName = pp?.companyName || p.fullName;
              const skills = toSkills(pp?.skills).slice(0, 3);
              const rate = ratingText(pp?.rating);
              return (
                <button key={p.id} className="pd-card" onClick={() => router.push(`/providers/${p.id}`)}>
                  <div className="pd-top">
                    {p.avatarUrl ? (
                      <img className="pd-av" src={p.avatarUrl} alt={displayName} />
                    ) : (
                      <span className="pd-av">{initials(displayName)}</span>
                    )}
                    <div>
                      <h3 className="pd-name">
                        {displayName}
                        {p.isVerified && (
                          <span className="pd-verified" title="موثّق من محايد">
                            {ICON_CHECK}
                          </span>
                        )}
                      </h3>
                      <p className="pd-meta">
                        {[pp?.field, pp?.city].filter(Boolean).join(' · ') || 'مقدم خدمة'}
                      </p>
                    </div>
                  </div>
                  {pp?.bio && <p className="pd-bio">{pp.bio}</p>}
                  {skills.length > 0 && (
                    <div className="pd-chips">
                      {skills.map((s, i) => (
                        <span className="pd-chip" key={i}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pd-foot">
                    <span className="pd-rate">
                      {rate ? `★ ${rate}${pp?.reviewsCount ? ` (${pp.reviewsCount})` : ''}` : 'جديد'}
                    </span>
                    <span className="pd-view">عرض التفاصيل ←</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
