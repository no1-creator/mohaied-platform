'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

type Supervisor = {
  id: string;
  fullName: string;
  email: string;
  isVerified: boolean;
  isActive: boolean;
  supervisorProfile?: {
    title: string;
    field: string;
    yearsExp: number;
    rating: number;
    reviewsCount: number;
  } | null;
  _count: { supervisorAssignments: number };
};

export default function AdminSupervisorsPage() {
  const [items, setItems] = useState<Supervisor[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    api<Supervisor[]>('/admin/supervisors')
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleVerify(s: Supervisor) {
    setBusy(s.id);
    try {
      await api(`/admin/users/${s.id}/verify`, {
        method: 'PATCH',
        body: { isVerified: !s.isVerified },
      });
      setItems((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, isVerified: !s.isVerified } : x)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminShell active="supervisors" title="المشرفون">
      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">مفيش مشرفين مسجّلين لسه.</div>
      ) : (
        <div className="ad-cards">
          {items.map((s) => (
            <div key={s.id} className="ad-sup-card">
              <div className="ad-sup-head">
                <div className="ad-sup-avatar">🧑‍⚖️</div>
                <div>
                  <p className="ad-sup-name">{s.fullName}</p>
                  <p className="ad-sup-title">
                    {s.supervisorProfile?.title || 'مشرف متخصص'}
                  </p>
                </div>
                {s.isVerified ? (
                  <span className="ad-badge ok">موثّق</span>
                ) : (
                  <span className="ad-badge muted">غير موثّق</span>
                )}
              </div>
              <ul className="ad-sup-meta">
                <li>
                  <span>المجال</span>
                  <b>{s.supervisorProfile?.field || '—'}</b>
                </li>
                <li>
                  <span>سنوات الخبرة</span>
                  <b>{s.supervisorProfile?.yearsExp ?? 0}</b>
                </li>
                <li>
                  <span>التقييم</span>
                  <b>⭐ {s.supervisorProfile?.rating ?? 0}</b>
                </li>
                <li>
                  <span>مهام الإشراف</span>
                  <b>{s._count.supervisorAssignments}</b>
                </li>
              </ul>
              <button
                className="ad-btn-mini"
                disabled={busy === s.id}
                onClick={() => toggleVerify(s)}
              >
                {s.isVerified ? 'إلغاء الاعتماد' : 'اعتماد المشرف'}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
