'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Response = {
  id: string;
  message: string;
  responderId: string;
  createdAt: string;
};

type Decision = {
  id: string;
  type: string;
  reason: string;
  createdAt: string;
};

type Complaint = {
  id: string;
  code: string;
  type: string;
  status: string;
  details: string;
  project?: { id: string; title: string };
  responses?: Response[];
  decision?: Decision | null;
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

const DECISION_LABELS: Record<string, string> = {
  EXTEND_DURATION: 'تمديد المدة',
  FAVOR_CLIENT: 'لصالح العميل',
  FAVOR_PROVIDER: 'لصالح مقدم الخدمة',
  AMICABLE: 'تسوية ودّية',
};

export default function ComplaintDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  function load() {
    api<Complaint>(`/complaints/${id}`)
      .then((data) => setComplaint(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  async function respond(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api(`/complaints/${id}/respond`, {
        method: 'POST',
        body: { message },
      });
      setMessage('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        جاري التحميل...
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {complaint && (
          <>
            <div className="card mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black text-muted">
                  #{complaint.code}
                </span>
                <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                  {STATUS_LABELS[complaint.status] || complaint.status}
                </span>
              </div>
              <h1 className="text-xl font-black mb-1">
                {TYPE_LABELS[complaint.type] || complaint.type}
              </h1>
              <p className="text-xs text-muted mb-3">
                {complaint.project?.title}
              </p>
              <p className="text-muted leading-loose whitespace-pre-line">
                {complaint.details}
              </p>
            </div>

            {/* القرار */}
            {complaint.decision && (
              <div className="card mb-6 border-brand">
                <h2 className="font-black mb-2">قرار إدارة محايد</h2>
                <span className="bg-brand text-white text-xs font-extrabold px-3 py-1 rounded-full inline-block mb-2">
                  {DECISION_LABELS[complaint.decision.type] ||
                    complaint.decision.type}
                </span>
                <p className="text-muted whitespace-pre-line">
                  {complaint.decision.reason}
                </p>
              </div>
            )}

            {/* الردود */}
            <div className="card mb-6">
              <h2 className="font-black mb-4">الردود</h2>
              {(!complaint.responses ||
                complaint.responses.length === 0) && (
                <p className="text-muted text-sm">لسه مفيش ردود.</p>
              )}
              <div className="space-y-3">
                {complaint.responses?.map((r) => (
                  <div
                    key={r.id}
                    className="border border-line rounded-xl px-4 py-3 text-sm"
                  >
                    <p className="text-muted whitespace-pre-line">
                      {r.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* إضافة رد */}
            {complaint.status !== 'RESOLVED' &&
              complaint.status !== 'CLOSED' && (
                <form onSubmit={respond} className="card space-y-3">
                  <label className="label">أضف ردك</label>
                  <textarea
                    className="input-field min-h-[100px]"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={sending}
                  >
                    {sending ? 'جاري الإرسال...' : 'إرسال الرد'}
                  </button>
                </form>
              )}
          </>
        )}
      </div>
    </main>
  );
}
