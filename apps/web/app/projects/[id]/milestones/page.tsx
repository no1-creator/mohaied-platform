'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import EscrowPanel from '@/components/EscrowPanel';
import BackBar from '@/components/BackBar';

type Attachment = {
  id: string;
  fileUrl?: string | null;
  link?: string | null;
};

type Submission = {
  id: string;
  notes: string;
  externalLink?: string;
  approved?: boolean | null;
  reviewNotes?: string;
  attachments?: Attachment[];
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

const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 2;

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
  const [imgs, setImgs] = useState<Record<string, string[]>>({});
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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

  function pickImages(
    milestoneId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(e.target.files || []);
    const input = e.target;
    if (!files.length) return;
    setError('');
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('اختَر صور فقط.');
        return;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`كل صورة لازم تكون أقل من ${MAX_IMAGE_MB} ميجا.`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImgs((p) => {
          const arr = p[milestoneId] || [];
          if (arr.length >= MAX_IMAGES) {
            setError(`أقصى عدد صور هو ${MAX_IMAGES}.`);
            return p;
          }
          return { ...p, [milestoneId]: [...arr, String(reader.result)] };
        });
      };
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  function removeImg(milestoneId: string, index: number) {
    setImgs((p) => ({
      ...p,
      [milestoneId]: (p[milestoneId] || []).filter((_, i) => i !== index),
    }));
  }

  async function submit(milestoneId: string) {
    setBusy(milestoneId);
    setError('');
    try {
      await api(`/milestones/${milestoneId}/submit`, {
        method: 'POST',
        body: {
          notes: notes[milestoneId] || '',
          externalLink: links[milestoneId] || undefined,
          attachmentImages: imgs[milestoneId] || [],
        },
      });
      setImgs((p) => ({ ...p, [milestoneId]: [] }));
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
            const mImgs = imgs[m.id] || [];
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
                        rel="noreferrer"
                        className="text-brand font-extrabold block mt-1"
                      >
                        الرابط المرفق
                      </a>
                    )}
                    {lastSub.attachments && lastSub.attachments.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-2">
                          {lastSub.attachments
                            .filter((a) => a.fileUrl)
                            .map((a) => (
                              <a
                                key={a.id}
                                href={a.fileUrl as string}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={a.fileUrl as string}
                                  alt="مرفق"
                                  style={{
                                    width: 64,
                                    height: 64,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid var(--line)',
                                  }}
                                />
                              </a>
                            ))}
                        </div>
                        {lastSub.attachments
                          .filter((a) => a.link)
                          .map((a) => (
                            <a
                              key={a.id}
                              href={a.link as string}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand font-extrabold block mt-1"
                            >
                              {a.link}
                            </a>
                          ))}
                      </div>
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

                      <div>
                        <input
                          ref={(el) => {
                            fileRefs.current[m.id] = el;
                          }}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => pickImages(m.id, e)}
                        />
                        <button
                          type="button"
                          onClick={() => fileRefs.current[m.id]?.click()}
                          className="border border-line rounded-xl px-4 py-2 text-sm font-bold text-brand"
                          disabled={mImgs.length >= MAX_IMAGES}
                        >
                          + رفع صور ({mImgs.length}/{MAX_IMAGES})
                        </button>

                        {mImgs.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-3">
                            {mImgs.map((src, idx) => (
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  width: 80,
                                  height: 80,
                                }}
                              >
                                <img
                                  src={src}
                                  alt=""
                                  style={{
                                    width: 80,
                                    height: 80,
                                    objectFit: 'cover',
                                    borderRadius: 10,
                                    border: '1px solid var(--line)',
                                  }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImg(m.id, idx)}
                                  style={{
                                    position: 'absolute',
                                    top: -8,
                                    insetInlineEnd: -8,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#b42318',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontWeight: 800,
                                    lineHeight: '22px',
                                  }}
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

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
