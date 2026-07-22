'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Project = {
  id: string;
  title: string;
  field: string;
  status: string;
  createdAt: string;
  client?: { fullName: string } | null;
  provider?: { fullName: string } | null;
  _count: { offers: number; complaints: number; milestones: number };
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  DRAFT: 'adp.status.DRAFT',
  OPEN: 'adp.status.OPEN',
  IN_AGREEMENT: 'adp.status.IN_AGREEMENT',
  IN_PROGRESS: 'adp.status.IN_PROGRESS',
  COMPLETED: 'adp.status.COMPLETED',
  DISPUTED: 'adp.status.DISPUTED',
  CANCELLED: 'adp.status.CANCELLED',
};

const STATUS_TONE: Record<string, string> = {
  DRAFT: 'muted',
  OPEN: 'blue',
  IN_AGREEMENT: 'blue',
  IN_PROGRESS: 'amber',
  COMPLETED: 'ok',
  DISPUTED: 'red',
  CANCELLED: 'muted',
};

export default function AdminProjectsPage() {
  const { tr } = useI18n();
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Project[]>('/admin/projects')
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const statusLabel = (s: string) => (STATUS_LABEL_KEYS[s] ? tr(STATUS_LABEL_KEYS[s]) : s);

  return (
    <AdminShell active="projects" title={tr('ash.nav.projects', 'المشاريع')}>
      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">{tr('adp.empty', 'مفيش مشاريع لسه.')}</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('co.th.project', 'المشروع')}</th>
                <th>{tr('co.th.field', 'المجال')}</th>
                <th>{tr('adp.th.client', 'العميل')}</th>
                <th>{tr('adp.th.provider', 'مقدم الخدمة')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th>{tr('adp.th.offers', 'عروض')}</th>
                <th>{tr('adp.th.complaints', 'شكاوى')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.field}</td>
                  <td>{p.client?.fullName || '—'}</td>
                  <td>{p.provider?.fullName || '—'}</td>
                  <td>
                    <span className={`ad-badge ${STATUS_TONE[p.status] || 'muted'}`}>
                      {statusLabel(p.status)}
                    </span>
                  </td>
                  <td>{p._count.offers}</td>
                  <td>
                    {p._count.complaints > 0 ? (
                      <span className="ad-badge red">{p._count.complaints}</span>
                    ) : (
                      0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
