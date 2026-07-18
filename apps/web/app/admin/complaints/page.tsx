'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import AdminShell from '@/components/AdminShell';

type Complaint = {
  id: string;
  code: string;
  type: string;
  customType?: string | null;
  status: string;
  project?: { id: string; title: string };
  decision?: { type: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: 'تأخير في التسليم',
  AGREEMENT_VIOLATION: 'مخالفة للاتفاق',
  PAYMENT_ISSUE: 'مشكلة في الدفع',
  UNPROFESSIONAL: 'سلوك غير مهني',
  OTHER: 'نوع آخر',
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوحة', cls: 'blue' },
  AWAITING_RESPONSE: { label: 'بانتظار الرد', cls: 'amber' },
  UNDER_REVIEW: { label: 'قيد المراجعة', cls: 'amber' },
  IN_ARBITRATION: { label: 'في التحكيم', cls: 'blue' },
  RESOLVED: { label: 'تم الحل', cls: 'ok' },
  REJECTED: { label: 'مرفوضة', cls: 'red' },
  CLOSED: { label: 'مغلقة', cls: 'muted' },
};

export default function AdminComplaintsPage() {
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
    <AdminShell active="complaints" title="الشكاوى والنزاعات">
      {loading && <div className="ad-loading">جاري التحميل…</div>}
      {error && <div className="ad-error">{error}</div>}
      {!loading && !error && complaints.length === 0 && (
        <div className="ad-empty">مفيش شكاوى حاليًا.</div>
      )}
      {!loading && !error && complaints.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>النوع</th>
                <th>المشروع</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => {
                const s = STATUS_BADGE[c.status] || { label: c.status, cls: 'muted' };
                const typeText =
                  c.type === 'OTHER'
                    ? c.customType || 'نوع آخر'
                    : TYPE_LABELS[c.type] || c.type;
                return (
                  <tr key={c.id}>
                    <td className="ad-mono">#{c.code}</td>
                    <td>{typeText}</td>
                    <td>{c.project?.title || '—'}</td>
                    <td>
                      <span className={`ad-badge ${s.cls}`}>{s.label}</span>
                    </td>
                    <td>
                      <Link href={`/admin/complaints/${c.id}`} className="ad-btn-mini">
                        فتح الملف
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
