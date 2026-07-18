'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import EscrowPanel from '@/components/EscrowPanel';
import BackBar from '@/components/BackBar';

type Submission = {
  id: string;
  notes: string;
  externalLink?: string;
  approved?: boolean | null;
  reviewNotes?: string;
  createdAt: string;
};

type Milestone = {
  id: string;
  title: string;
  description: string;
  status: string;
  value: number;
  orderIndex: number;
  submissions?: Submission[];
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'بانتظار البدء',
  IN_PROGRESS: 'قيد التنفيذ',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REVISION_REQUESTED: 'مطلوب تعديل',
};

export default function MilestonesPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [role, setRole] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  // حقول التسليم لكل مرحلة
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});

  function loadMilestones() {
    api<Milestone[]>(`/milestones/project/${projectId}`)
      .then((data) => setMilestones(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<{ role: string }>('/users/me')
      .then((me) => setRole(me.role))
      .catch(() => {});
    loadMilestones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  async function submit(milestoneId: string) {
    setBusy(milestoneId);
    setError('');
    try {
      await api(`/milestones/${milestoneId}/submit`, {
        method: 'POST',
        body: {
          notes: notes[milestoneId] || '',
          externalLink: links[milestoneId] || undefined,
        },
      });
      loadMilestones();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  async function review(milestoneId: string, approved: boolean) {
    const reviewNotes = approved
      ? undefined
      : prompt('اكتب ملاحظات التعديل المطلوبة:') || '';
    setBusy(milestoneId);
    setError('');
    try {
      await api(`/milestones/${milestoneId}/review`, {
        method: 'PATCH',
        body: { approved, reviewNotes },
      });
      loadMilestones();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <BackBar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">إدارة المراحل</h1>
<EscrowPanel projectId={projectId} />
        
        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="space-y-5">
          {milestones.map((m, i) => {
            const lastSub = m.submissions?.[0];
            return (
              <div key={m.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black">
                    {i + 1}. {m.title}
                  </h3>
                  <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                    {STATUS_LABELS[m.status] || m.status}
                  </span>
                </div>
                <p className="text-sm text-muted mb-3 whitespace-pre-line">
                  {m.description}
                </p>
                <div className="text-sm font-extrabold text-brand mb-4">
                  {m.value} ج.م
                </div>

                {/* آخر تسليم */}
                {lastSub && (
                  <div className="border border-line rounded-xl px-4 py-3 mb-4 text-sm">
                    <p className="font-bold mb-1">آخر تسليم:</p>
                    <p className="text-muted whitespace-pre-line">
                      {lastSub.notes}
                    </p>
                    {lastSub.externalLink && (
                      <a
                        href={lastSub.externalLink}
                        target="_blank"
                        className="text-brand font-extrabold block mt-1"
                      >
                        الرابط المرفق
                      </a>
                    )}
                    {lastSub.reviewNotes && (
                      <p className="text-red-600 mt-2">
                        ملاحظات العميل: {lastSub.reviewNotes}
                      </p>
                    )}
                  </div>
                )}

                {/* مقدم الخدمة: تسليم */}
                {role === 'PROVIDER' &&
                  (m.status === 'IN_PROGRESS' ||
                    m.status === 'REVISION_REQUESTED') && (
                    <div className="space-y-3">
                      <textarea
                        className="input-field"
                        placeholder="ملاحظات التسليم"
                        value={notes[m.id] || ''}
                        onChange={(e) =>
                          setNotes((p) => ({ ...p, [m.id]: e.target.value }))
                        }
                      />
                      <input
                        className="input-field"
                        placeholder="رابط التسليم (اختياري)"
                        value={links[m.id] || ''}
                        onChange={(e) =>
                          setLinks((p) => ({ ...p, [m.id]: e.target.value }))
                        }
                      />
                      <button
                        onClick={() => submit(m.id)}
                        className="btn-primary"
                        disabled={busy === m.id}
                      >
                        {busy === m.id ? 'جاري التسليم...' : 'تسليم المرحلة'}
                      </button>
                    </div>
                  )}

                {/* العميل: مراجعة */}
                {role === 'CLIENT' && m.status === 'UNDER_REVIEW' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => review(m.id, true)}
                      className="btn-primary"
                      disabled={busy === m.id}
                    >
                      اعتماد
                    </button>
                    <button
                      onClick={() => review(m.id, false)}
                      className="btn-ghost"
                      disabled={busy === m.id}
                    >
                      طلب تعديل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
