'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ReviewItem = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  authorRole: 'CLIENT' | 'PROVIDER';
  author?: { id: string; fullName: string; avatarUrl?: string | null } | null;
};

type ProjectReviewsData = {
  reviews: ReviewItem[];
  mine: ReviewItem | null;
  canReview: boolean;
};

const PR_CSS = `
.pr-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-top:24px;}
.pr-h{font-size:16px;font-weight:800;color:var(--ink);margin:0 0 14px;}
.pr-empty{color:var(--muted);font-size:13.5px;}
.pr-form{background:var(--mint);border-radius:14px;padding:16px;margin-bottom:16px;}
.pr-form-h{font-weight:800;font-size:14px;color:var(--ink);margin:0 0 10px;}
.pr-stars{display:flex;gap:6px;margin-bottom:12px;direction:ltr;justify-content:flex-end;}
.pr-star{font-size:30px;line-height:1;cursor:pointer;color:#d4dcd8;background:none;border:none;padding:0;transition:color .1s;}
.pr-star.on{color:#e0a500;}
.pr-ta{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;box-sizing:border-box;outline:none;resize:vertical;min-height:70px;line-height:1.8;}
.pr-ta:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.pr-btn{margin-top:12px;padding:11px 22px;border-radius:11px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;}
.pr-btn:disabled{opacity:.5;cursor:default;}
.pr-msg{font-size:13px;font-weight:700;margin-top:10px;}
.pr-ok{color:var(--green-dark);}
.pr-err{color:#c0392b;}
.pr-list{display:flex;flex-direction:column;gap:14px;}
.pr-item{background:var(--mint);border-radius:14px;padding:14px 16px;}
.pr-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:6px;flex-wrap:wrap;}
.pr-name{font-weight:700;font-size:13.5px;color:var(--ink);}
.pr-role{font-size:11px;color:var(--muted);}
.pr-rstars{letter-spacing:2px;font-size:14px;color:#e0a500;}
.pr-comment{font-size:13.5px;color:#3a4a46;line-height:1.8;margin:6px 0 0;white-space:pre-wrap;}
`;

function stars(n: number) {
  const full = Math.round(n);
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

export default function ProjectReview({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function load() {
    api<ProjectReviewsData>(`/reviews/project/${projectId}`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!projectId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function submit() {
    if (rating < 1) {
      setErr('اختار تقييم من 1 لـ 5 نجوم');
      return;
    }
    setSaving(true);
    setErr('');
    setMsg('');
    try {
      await api('/reviews', {
        method: 'POST',
        body: { projectId, rating, comment: comment.trim() || undefined },
      });
      setMsg('تم إرسال تقييمك ✅ شكرًا ليك');
      setRating(0);
      setComment('');
      load();
    } catch (e: any) {
      setErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !data) return null;

  const roleLabel = (r: string) => (r === 'CLIENT' ? 'العميل' : 'مقدّم الخدمة');

  return (
    <div className="pr-card">
      <style>{PR_CSS}</style>
      <h2 className="pr-h">التقييمات</h2>

      {data.canReview && (
        <div className="pr-form">
          <p className="pr-form-h">قيّم الطرف التاني بعد اكتمال المشروع</p>
          <div className="pr-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                className={`pr-star ${n <= rating ? 'on' : ''}`}
                onClick={() => setRating(n)}
                aria-label={`${n} نجوم`}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="pr-ta"
            placeholder="اكتب رأيك (اختياري)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
          />
          <div>
            <button className="pr-btn" onClick={submit} disabled={saving}>
              {saving ? 'جاري الإرسال…' : 'إرسال التقييم'}
            </button>
          </div>
          {msg && <p className="pr-msg pr-ok">{msg}</p>}
          {err && <p className="pr-msg pr-err">{err}</p>}
        </div>
      )}

      {!data.canReview && data.mine && (
        <p className="pr-msg pr-ok" style={{ marginBottom: 14 }}>
          قيّمت المشروع ده بالفعل ✅
        </p>
      )}

      {data.reviews.length === 0 ? (
        <p className="pr-empty">لسه مفيش تقييمات على المشروع ده.</p>
      ) : (
        <div className="pr-list">
          {data.reviews.map((r) => (
            <div className="pr-item" key={r.id}>
              <div className="pr-top">
                <span className="pr-name">{r.author?.fullName || 'مستخدم'}</span>
                <span className="pr-role">{roleLabel(r.authorRole)}</span>
              </div>
              <div className="pr-rstars">{stars(r.rating)}</div>
              {r.comment && <p className="pr-comment">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
