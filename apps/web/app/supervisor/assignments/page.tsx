'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Assignment = {
  id: string;
  status: string;
  ratePerReview: number;
  project?: { id: string; title: string; status: string };
  reports?: { id: string }[];
};

const STATUS_LABELS: Record<string, string> = {
  INVITED: 'دعوة جديدة',
  ACCEPTED: 'مقبولة',
  ACTIVE: 'نشطة',
  DECLINED: 'مرفوضة',
  COMPLETED: 'منتهية',
};

export default function SupervisorAssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  function load() {
    api<Assignment[]>('/supervisors/mine')
      .then((data) => setAssignments(data))
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
  }, [router]);

  async function respond(assignmentId: string, accept: boolean) {
    setBusy(assignmentId);
    setError('');
    try {
      await api(`/supervisors/assignments/${assignmentId}/respond`, {
        method: 'PATCH',
        body: { accept },
      });
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">تكليفاتي</h1>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {!loading && !error && assignments.length === 0 && (
          <div className="card text-center py-16 text-muted">
            مفيش تكليفات حاليًا.
          </div>
        )}

        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black">{a.project?.title}</h3>
                <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                  {STATUS_LABELS[a.status] || a.status}
                </span>
              </div>
              <p className="text-sm text-muted mb-4">
                أجر المراجعة: {a.ratePerReview} ج.م ·{' '}
                {a.reports?.length || 0} تقرير
              </p>

              {a.status === 'INVITED' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => respond(a.id, true)}
                    className="btn-primary"
                    disabled={busy === a.id}
                  >
                    قبول التكليف
                  </button>
                  <button
                    onClick={() => respond(a.id, false)}
                    className="btn-ghost"
                    disabled={busy === a.id}
                  >
                    رفض
                  </button>
                </div>
              )}

              {a.status === 'ACTIVE' && (
                <Link
                  href={`/supervisor/assignments/${a.id}`}
                  className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-extrabold inline-block"
                >
                  التقارير وكتابة تقرير
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
