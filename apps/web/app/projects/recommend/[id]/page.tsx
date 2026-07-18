'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type RecProvider = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  providerProfile?: {
    companyName?: string | null;
    field?: string | null;
    city?: string | null;
    rating?: number | string | null;
    reviewsCount?: number | null;
  } | null;
};

type RecRequest = {
  id: string;
  title: string;
  field: string;
  description: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  status: string;
  adminNote?: string | null;
  recommendedProviders?: RecProvider[];
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد المراجعة', cls: 'wait' },
  IN_REVIEW: { label: 'جاري الترشيح', cls: 'wait' },
  RESPONDED: { label: 'تم الترشيح', cls: 'done' },
  CLOSED: { label: 'مغلق', cls: 'closed' },
};

function initials(name: string) {
  const parts = (name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] || '').join('') || '؟';
}
function ratingText(r?: number | string | null): string | null {
  if (r === null || r === undefined || r === '') return null;
  const n = Number(r);
  if (Number.isNaN(n) || n <= 0) return null;
  return n.toFixed(1);
}

const RD_CSS = `
.rd-wrap{max-width:720px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.rd-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.rd-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;}
.rd-title{font-size:21px;font-weight:800;color:var(--ink);margin:0;}
.rd-badge{font-size:12.5px;font-weight:800;padding:5px 12px;border-radius:999px;white-space:nowrap;}
.rd-badge.wait{background:#fef9c3;color:#a16207;}
.rd-badge.done{background:#e7f6f0;color:var(--green-dark);}
.rd-badge.closed{background:#f3f4f6;color:#6b7280;}
.rd-meta{color:var(--muted);font-size:13px;margin:8px 0 0;}
.rd-desc{font-size:14px;color:#3a4a46;line-height:1.9;margin:16px 0 0;white-space:pre-wrap;}
.rd-facts{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px;}
.rd-fact{background:var(--mint);color:var(--green-dark);font-size:12.5px;font-weight:700;padding:6px 12px;border-radius:10px;}
.rd-wait{margin-top:22px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:14px;padding:16px 18px;font-size:13.5px;line-height:1.85;text-align:center;}
.rd-sec{margin-top:26px;}
.rd-sec-h{font-size:16px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.rd-note{font-size:14px;color:#3a4a46;line-height:1.9;margin:0 0 16px;white-space:pre-wrap;background:var(--mint);border-radius:12px;padding:14px 16px;}
.rd-provs{display:flex;flex-direction:column;gap:12px;}
.rd-prov{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;transition:border-color .15s,box-shadow .15s;background:#fff;text-align:right;font-family:inherit;width:100%;}
.rd-prov:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(24,70,61,.07);}
.rd-av{width:48px;height:48px;border-radius:12px;object-fit:cover;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:17px;flex-shrink:0;}
.rd-pv-name{font-size:15px;font-weight:800;color:var(--ink);margin:0;}
.rd-pv-meta{font-size:12.5px;color:var(--muted);margin:2px 0 0;}
.rd-pv-go{margin-inline-start:auto;color:var(--green-dark);font-size:13px;font-weight:800;white-space:nowrap;}
.rd-state{text-align:center;color:var(--muted);padding:50px 20px;font-size:14px;}
`;

export default function RecommendDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || '');
  const [req, setReq] = useState<RecRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!id) return;
    api<RecRequest>(`/recommendations/${id}`)
      .then((data) => setReq(data))
      .catch((err) => setError(err?.message || 'الطلب غير موجود'))
      .finally(() => setLoading(false));
  }, [router, id]);

  const st = req ? STATUS_MAP[req.status] || { label: req.status, cls: 'wait' } : null;
  const bmin =
    req?.budgetMin !== null && req?.budgetMin !== undefined && req?.budgetMin !== ''
      ? Number(req.budgetMin)
      : null;
  const bmax =
    req?.budgetMax !== null && req?.budgetMax !== undefined && req?.budgetMax !== ''
      ? Number(req.budgetMax)
      : null;

  return (
    <>
      <style>{RD_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="rd-wrap">
        {loading && <div className="rd-state">جاري التحميل...</div>}
        {error && !loading && <div className="rd-state">{error}</div>}

        {!loading && !error && req && st && (
          <div className="rd-card">
            <div className="rd-top">
              <h1 className="rd-title">{req.title}</h1>
              <span className={`rd-badge ${st.cls}`}>{st.label}</span>
            </div>
            <p className="rd-meta">{req.field}</p>

            <p className="rd-desc">{req.description}</p>

            <div className="rd-facts">
              {bmin != null && <span className="rd-fact">الميزانية من: {bmin.toLocaleString('en')} ج.م</span>}
              {bmax != null && <span className="rd-fact">إلى: {bmax.toLocaleString('en')} ج.م</span>}
              {req.durationDays ? <span className="rd-fact">المدة: {req.durationDays} يوم</span> : null}
            </div>

            {req.status !== 'RESPONDED' && (
              <div className="rd-wait">
                استلمنا طلبك ✅ فريق محايد بيراجعه دلوقتي وهيرشّح لك أنسب مقدم خدمة قريبًا. هيوصلك إشعار أول ما يجهز الترشيح.
              </div>
            )}

            {req.status === 'RESPONDED' && (
              <>
                {req.adminNote && (
                  <div className="rd-sec">
                    <h2 className="rd-sec-h">ترشيح فريق محايد</h2>
                    <p className="rd-note">{req.adminNote}</p>
                  </div>
                )}
                {req.recommendedProviders && req.recommendedProviders.length > 0 && (
                  <div className="rd-sec">
                    <h2 className="rd-sec-h">المقدمون المرشّحون</h2>
                    <div className="rd-provs">
                      {req.recommendedProviders.map((p) => {
                        const pp = p.providerProfile;
                        const name = pp?.companyName || p.fullName;
                        const rate = ratingText(pp?.rating);
                        return (
                          <button
                            key={p.id}
                            className="rd-prov"
                            onClick={() => router.push(`/providers/${p.id}`)}
                          >
                            {p.avatarUrl ? (
                              <img className="rd-av" src={p.avatarUrl} alt={name} />
                            ) : (
                              <span className="rd-av">{initials(name)}</span>
                            )}
                            <div>
                              <p className="rd-pv-name">{name}</p>
                              <p className="rd-pv-meta">
                                {[pp?.field, pp?.city, rate ? `★ ${rate}` : null]
                                  .filter(Boolean)
                                  .join(' · ') || 'مقدم خدمة'}
                              </p>
                            </div>
                            <span className="rd-pv-go">عرض ←</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
