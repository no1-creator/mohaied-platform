'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

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

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'مسودة',
  OPEN: 'مفتوح',
  IN_AGREEMENT: 'في الاتفاق',
  IN_PROGRESS: 'جاري',
  COMPLETED: 'مكتمل',
  DISPUTED: 'متنازع',
  CANCELLED: 'ملغي',
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
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Project[]>('/admin/projects')
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell active="projects" title="المشاريع">
      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">مفيش مشاريع لسه.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>المشروع</th>
                <th>المجال</th>
                <th>العميل</th>
                <th>مقدم الخدمة</th>
                <th>الحالة</th>
                <th>عروض</th>
                <th>شكاوى</th>
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
                      {STATUS_LABELS[p.status] || p.status}
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
