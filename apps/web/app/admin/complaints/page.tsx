'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import AdminShell from '@/components/AdminShell';
import { useI18n } from '@/lib/i18n';

type Complaint = {
  id: string;
  code: string;
  type: string;
  customType?: string | null;
  status: string;
  project?: { id: string; title: string };
  decision?: { type: string } | null;
};

const TYPE_LABEL_KEYS: Record<string, string> = {
  DELIVERY_DELAY: 'acx.type.DELIVERY_DELAY',
  AGREEMENT_VIOLATION: 'acx.type.AGREEMENT_VIOLATION',
  PAYMENT_ISSUE: 'acx.type.PAYMENT_ISSUE',
  UNPROFESSIONAL: 'acx.type.UNPROFESSIONAL',
  OTHER: 'acx.type.OTHER',
};

const STATUS_BADGE: Record<string, { labelKey: string; cls: string }> = {
  OPEN: { labelKey: 'acx.status.OPEN', cls: 'blue' },
  AWAITING_RESPONSE: { labelKey: 'acx.status.AWAITING_RESPONSE', cls: 'amber' },
  UNDER_REVIEW: { labelKey: 'acx.status.UNDER_REVIEW', cls: 'amber' },
  IN_ARBITRATION: { labelKey: 'acx.status.IN_ARBITRATION', cls: 'blue' },
  RESOLVED: { labelKey: 'acx.status.RESOLVED', cls: 'ok' },
  REJECTED: { labelKey: 'acx.status.REJECTED', cls: 'red' },
  CLOSED: { labelKey: 'acx.status.CLOSED', cls: 'muted' },
};

export default function AdminComplaintsPage() {
  const { tr } = useI18n();
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Complaint[]>('/complaints/admin/all')
      .then((data) => setComplaints(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <AdminShell active="complaints" title={tr('acx.title', 'الشكاوى والنزاعات')}>
      {loading && <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>}
      {error && <div className="ad-error">{error}</div>}
      {!loading && !error && complaints.length === 0 && (
        <div className="ad-empty">{tr('acx.empty', 'مفيش شكاوى حاليًا.')}</div>
      )}
      {!loading && !error && complaints.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('acx.th.code', 'الكود')}</th>
                <th>{tr('acx.th.type', 'النوع')}</th>
                <th>{tr('co.th.project', 'المشروع')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const s = STATUS_BADGE[c.status];
                const statusText = s ? tr(s.labelKey) : c.status;
                const statusCls = s ? s.cls : 'muted';
                const typeText =
                  c.type === 'OTHER'
                    ? c.customType || tr('acx.type.OTHER', 'نوع آخر')
                    : TYPE_LABEL_KEYS[c.type]
                      ? tr(TYPE_LABEL_KEYS[c.type])
                      : c.type;
                return (
                  <tr key={c.id}>
                    <td className="ad-mono">#{c.code}</td>
                    <td>{typeText}</td>
                    <td>{c.project?.title || '—'}</td>
                    <td>
                      <span className={`ad-badge ${statusCls}`}>{statusText}</span>
                    </td>
                    <td>
                      <Link href={`/admin/complaints/${c.id}`} className="ad-btn-mini">
                        {tr('acx.open', 'فتح الملف')}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
