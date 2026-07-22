'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';
import { useI18n } from '@/lib/i18n';

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
  const { tr } = useI18n();
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
    <AdminShell active="supervisors" title={tr('ash.nav.supervisors', 'المشرفون')}>
      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">{tr('asp.empty', 'مفيش مشرفين مسجّلين لسه.')}</div>
      ) : (
        <div className="ad-cards">
          {items.map((s) => (
            <div key={s.id} className="ad-sup-card">
              <div className="ad-sup-head">
                <div className="ad-sup-avatar">
                  <Icon name="shield" size={22} />
                </div>
                <div>
                  <div className="ad-sup-name">{s.fullName}</div>
                  <div className="ad-sup-title">
                    {s.supervisorProfile?.title || tr('auth.role.SUPERVISOR', 'مشرف متخصص')}
                  </div>
                </div>
                <span className={`ad-badge ${s.isVerified ? 'ok' : 'muted'}`}>
                  {s.isVerified ? tr('adu.verified', 'موثّق') : tr('adu.unverified', 'غير موثّق')}
                </span>
              </div>

              <ul className="ad-sup-meta">
                <li>
                  <span>{tr('co.th.field', 'المجال')}</span>
                  <b>{s.supervisorProfile?.field || '—'}</b>
                </li>
                <li>
                  <span>{tr('asp.years', 'سنوات الخبرة')}</span>
                  <b>{s.supervisorProfile?.yearsExp ?? 0}</b>
                </li>
                <li>
                  <span>{tr('asp.rating', 'التقييم')}</span>
                  <b style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="star" size={14} /> {s.supervisorProfile?.rating ?? 0}
                  </b>
                </li>
                <li>
                  <span>{tr('asp.assignments', 'مهام الإشراف')}</span>
                  <b>{s._count.supervisorAssignments}</b>
                </li>
              </ul>

              <button
                className="ad-btn-mini"
                onClick={() => toggleVerify(s)}
                disabled={busy === s.id}
              >
                {s.isVerified ? tr('asp.revoke', 'إلغاء الاعتماد') : tr('asp.approve', 'اعتماد المشرف')}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
