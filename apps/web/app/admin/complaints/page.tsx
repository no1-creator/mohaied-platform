'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Complaint = {
  id: string;
  code: string;
  type: string;
  status: string;
  project?: { id: string; title: string };
  decision?: { type: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: 'تأخير في التسليم',
  AGREEMENT_VIOLATION: 'مخالفة للاتفاق',
  PAYMENT_ISSUE: 'مشكلة في الدفع',
  UNPROFESSIONAL: 'سلوك غير مهني',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوحة',
  AWAITING_RESPONSE: 'بانتظار الرد',
  UNDER_REVIEW: 'قيد المراجعة',
  IN_ARBITRATION: 'في التحكيم',
  RESOLVED: 'تم الحل',
  REJECTED: 'مرفوضة',
  CLOSED: 'مغلقة',
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
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">إدارة الشكاوى</h1>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && complaints.length === 0 && (
          <div className="card text-center py-16 text-muted">
            مفيش شكاوى حاليًا.
          </div>
        )}

        <div className="space-y-4">
          {complaints.map((c) => (
            <Link
              key={c.id}
              href={`/admin/complaints/${c.id}`}
              className="card block hover:border-brand"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-muted">
                  #{c.code}
                </span>
                <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                  {STATUS_LABELS[c.status] || c.status}
                </span>
              </div>
              <h3 className="font-black">
                {TYPE_LABELS[c.type] || c.type}
              </h3>
              <p className="text-xs text-muted mt-1">{c.project?.title}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
