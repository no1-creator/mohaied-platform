'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Report = {
  id: string;
  summary: string;
  notes?: string;
  status: string;
  createdAt: string;
};

type Assignment = {
  id: string;
  status: string;
  ratePerReview: number;
  project?: { id: string; title: string; status: string };
  reports?: Report[];
};

export default function AssignmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [summary, setSummary] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function load() {
    api<Assignment[]>('/supervisors/mine')
      .then((data) => {
        const found = data.find((a) => a.id === id) || null;
        setAssignment(found);
      })
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

  async function createReport(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api(`/supervisors/assignments/${id}/reports`, {
        method: 'POST',
        body: { summary, notes: notes || undefined, status: 'SUBMITTED' },
      });
      setSummary('');
      setNotes('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
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

        {assignment && (
          <>
            <div className="card mb-6">
              <h1 className="text-2xl font-black mb-2">
                {assignment.project?.title}
              </h1>
              <p className="text-sm text-muted">
                أجر المراجعة: {assignment.ratePerReview} ج.م
              </p>
            </div>

            <form onSubmit={createReport} className="card space-y-4 mb-6">
              <h2 className="font-black">كتابة تقرير جديد</h2>
              <div>
                <label className="label">ملخص التقرير</label>
                <textarea
                  className="input-field min-h-[100px]"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  minLength={5}
                  required
                />
              </div>
              <div>
                <label className="label">ملاحظات إضافية (اختياري)</label>
                <textarea
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التقرير'}
              </button>
            </form>

            <div className="card">
              <h2 className="font-black mb-4">التقارير السابقة</h2>
              {(!assignment.reports ||
                assignment.reports.length === 0) && (
                <p className="text-muted text-sm">لسه مفيش تقارير.</p>
              )}
              <div className="space-y-3">
                {assignment.reports?.map((r) => (
                  <div
                    key={r.id}
                    className="border border-line rounded-xl px-4 py-3 text-sm"
                  >
                    <p className="font-bold whitespace-pre-line">
                      {r.summary}
                    </p>
                    {r.notes && (
                      <p className="text-muted mt-1 whitespace-pre-line">
                        {r.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
