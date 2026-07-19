'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author?: { id: string; fullName: string; avatarUrl?: string | null } | null;
  project?: { id: string; title: string; field?: string | null } | null;
};

type ReviewsData = {
  count: number;
  average: number;
  reviews: ReviewItem[];
};

const PVR_CSS = `
.pvr{margin-top:24px;border-top:1px solid var(--line);padding-top:22px;}
.pvr-h{font-size:15px;font-weight:800;color:var(--ink);margin:0 0 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.pvr-avg{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--green-dark);font-weight:800;font-size:13px;padding:4px 12px;border-radius:999px;}
.pvr-empty{color:var(--muted);font-size:13.5px;}
.pvr-list{display:flex;flex-direction:column;gap:14px;}
.pvr-item{background:var(--mint);border-radius:14px;padding:14px 16px;}
.pvr-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;flex-wrap:wrap;}
.pvr-name{font-weight:700;font-size:13.5px;color:var(--ink);}
.pvr-date{font-size:11.5px;color:var(--muted);}
.pvr-stars{letter-spacing:2px;font-size:14px;color:#e0a500;}
.pvr-comment{font-size:13.5px;color:#3a4a46;line-height:1.8;margin:6px 0 0;white-space:pre-wrap;}
.pvr-proj{font-size:11.5px;color:var(--muted);margin-top:6px;}
`;

function stars(n: number) {
  const full = Math.round(n);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}
function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ProviderReviews({ providerId }: { providerId: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!providerId) return;
    api<ReviewsData>(`/reviews/provider/${providerId}`, { auth: false })
      .then((d) => setData(d))
      .catch(() => setData({ count: 0, average: 0, reviews: [] }))
      .finally(() => setLoading(false));
  }, [providerId]);

  if (loading) return null;
  const count = data?.count || 0;

  return (
    <div className="pvr">
      <style>{PVR_CSS}</style>
      <h3 className="pvr-h">
        التقييمات والمراجعات
        {count > 0 && (
          <span className="pvr-avg">
            ★ {data?.average?.toFixed(1)} · {count} تقييم
          </span>
        )}
      </h3>
      {count === 0 ? (
        <p className="pvr-empty">لسه مفيش تقييمات لمقدم الخدمة ده.</p>
      ) : (
        <div className="pvr-list">
          {data?.reviews.map((r) => (
            <div className="pvr-item" key={r.id}>
              <div className="pvr-top">
                <span className="pvr-name">{r.author?.fullName || 'عميل'}</span>
                <span className="pvr-date">{fmtDate(r.createdAt)}</span>
              </div>
              <div className="pvr-stars">{stars(r.rating)}</div>
              {r.comment && <p className="pvr-comment">{r.comment}</p>}
              {r.project?.title && (
                <div className="pvr-proj">مشروع: {r.project.title}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
