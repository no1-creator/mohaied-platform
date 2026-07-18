'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

const PV_CSS = `
.pv-wrap{max-width:760px;margin:0 auto;width:100%;padding:24px 20px 90px;}
.pv-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.pv-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap;}
.pv-av{width:74px;height:74px;border-radius:18px;object-fit:cover;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:26px;flex-shrink:0;}
.pv-name{font-size:22px;font-weight:800;color:var(--ink);margin:0;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.pv-verified{display:inline-flex;align-items:center;gap:4px;background:#e7f6f0;color:var(--green-dark);font-size:12px;font-weight:800;padding:3px 10px;border-radius:999px;}
.pv-meta{color:var(--muted);font-size:14px;margin:6px 0 0;}
.pv-stats{display:flex;flex-wrap:wrap;gap:12px;margin:20px 0;}
.pv-stat{flex:1;min-width:110px;background:var(--mint);border-radius:14px;padding:14px;text-align:center;}
.pv-stat-n{font-size:19px;font-weight:800;color:var(--green-dark);}
.pv-stat-l{font-size:12px;color:var(--muted);margin-top:3px;}
.pv-sec{margin-top:22px;}
.pv-sec-h{font-size:15px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.pv-bio{font-size:14px;color:#3a4a46;line-height:1.9;margin:0;white-space:pre-wrap;}
.pv-chips{display:flex;flex-wrap:wrap;gap:8px;}
.pv-chip{background:var(--mint);color:var(--green-dark);font-size:12.5px;font-weight:700;padding:5px 12px;border-radius:999px;}
.pv-links{display:flex;flex-wrap:wrap;gap:16px;}
.pv-link{color:var(--green-dark);font-size:13.5px;font-weight:700;text-decoration:none;}
.pv-link:hover{text-decoration:underline;}
.pv-cta{margin-top:26px;width:100%;padding:13px;border-radius:13px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;transition:background .15s;}
.pv-cta:hover{background:var(--green-dark);}
.pv-note{text-align:center;color:var(--muted);font-size:12.5px;margin-top:10px;line-height:1.7;}
.pv-state{text-align:center;color:var(--muted);padding:50px 20px;font-size:14px;}
@media(max-width:560px){.pv-name{font-size:19px;}}
`;

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || '');
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!id) return;
    api<Provider>(`/users/providers/${id}`)
      .then((data) => setProvider(data))
      .catch((err) => setError(err?.message || 'مقدم الخدمة غير موجود'))
      .finally(() => setLoading(false));
  }, [router, id]);

  const pp = provider?.providerProfile;
  const displayName = pp?.companyName || provider?.fullName || '';
  const skills = toSkills(pp?.skills);
  const rate = ratingText(pp?.rating);

  return (
    <>
      <style>{PV_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="pv-wrap">
        {loading && <div className="pv-state">جاري التحميل...</div>}
        {error && !loading && <div className="pv-state">{error}</div>}

        {!loading && !error && provider && (
          <div className="pv-card">
            <div className="pv-head">
              {provider.avatarUrl ? (
                <img className="pv-av" src={provider.avatarUrl} alt={displayName} />
              ) : (
                <span className="pv-av">{initials(displayName)}</span>
              )}
              <div>
                <h1 className="pv-name">
                  {displayName}
                  {provider.isVerified && (
                    <span className="pv-verified">
                      {ICON_CHECK} موثّق
                    </span>
                  )}
                </h1>
                <p className="pv-meta">
                  {[pp?.field, pp?.city].filter(Boolean).join(' · ') || 'مقدم خدمة'}
                </p>
              </div>
            </div>

            <div className="pv-stats">
              <div className="pv-stat">
                <div className="pv-stat-n">{pp?.yearsExp ?? '—'}</div>
                <div className="pv-stat-l">سنوات خبرة</div>
              </div>
              <div className="pv-stat">
                <div className="pv-stat-n">{pp?.teamSize ?? '—'}</div>
                <div className="pv-stat-l">حجم الفريق</div>
              </div>
              <div className="pv-stat">
                <div className="pv-stat-n">{rate || '—'}</div>
                <div className="pv-stat-l">
                  التقييم{pp?.reviewsCount ? ` (${pp.reviewsCount})` : ''}
                </div>
              </div>
            </div>

            {pp?.bio && (
              <div className="pv-sec">
                <h2 className="pv-sec-h">نبذة</h2>
                <p className="pv-bio">{pp.bio}</p>
              </div>
            )}

            {skills.length > 0 && (
              <div className="pv-sec">
                <h2 className="pv-sec-h">المهارات</h2>
                <div className="pv-chips">
                  {skills.map((s, i) => (
                    <span className="pv-chip" key={i}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(pp?.website || pp?.portfolioUrl) && (
              <div className="pv-sec">
                <h2 className="pv-sec-h">روابط</h2>
                <div className="pv-links">
                  {pp?.website && (
                    <a className="pv-link" href={pp.website} target="_blank" rel="noopener noreferrer">
                      الموقع الإلكتروني ↗
                    </a>
                  )}
                  {pp?.portfolioUrl && (
                    <a className="pv-link" href={pp.portfolioUrl} target="_blank" rel="noopener noreferrer">
                      معرض الأعمال ↗
                    </a>
                  )}
                </div>
              </div>
            )}

            <button
              className="pv-cta"
              onClick={() => router.push(`/projects/new?provider=${provider.id}`)}
            >
              اطلب عرض من مقدم الخدمة ده
            </button>
            <p className="pv-note">
              هتنشر تفاصيل مشروعك، ومقدم الخدمة ده هيقدر يقدّم لك عرضه — كله موثّق ومضمون من محايد.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
