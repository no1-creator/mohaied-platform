'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Milestone = {
  id: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
};

type Attachment = {
  id: string;
  fileUrl?: string | null;
  link?: string | null;
};

type Offer = {
  id: string;
  scope: string;
  totalPrice: number;
  durationDays: number;
  status: string;
  provider?: { fullName: string };
  milestones?: Milestone[];
  attachments?: Attachment[];
};

export default function ProjectOffersPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState('');

  function load() {
    api<Offer[]>(`/offers/project/${projectId}`)
      .then((data) => setOffers(data))
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
  }, [projectId, router]);

  async function acceptOffer(offerId: string) {
    if (!confirm('متأكد إنك عايز تقبل العرض ده؟ هيتحوّل لاتفاق موثق.')) return;
    setAccepting(offerId);
    setError('');
    try {
      await api(`/agreements/accept/${offerId}`, { method: 'POST' });
router.push(`/projects/${projectId}/contract`);
    } catch (err: any) {
      setError(err.message);
      setAccepting('');
    }
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">العروض المقدّمة</h1>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {!loading && offers.length === 0 && (
          <div className="card text-center py-16 text-muted">
            لسه مفيش عروض على المشروع ده.
          </div>
        )}

        <div className="space-y-5">
          {offers.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-black">{o.provider?.fullName}</h3>
                <span className="text-lg font-black text-brand">
                  {o.totalPrice} ج.م
                </span>
              </div>
              <p className="text-sm text-muted mb-4 whitespace-pre-line">
                {o.scope}
              </p>

              <div className="space-y-2 mb-4">
                {o.milestones?.map((m, i) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between border border-line rounded-xl px-4 py-2 text-sm"
                  >
                    <span className="font-bold">
                      {i + 1}. {m.title}
                    </span>
                    <span className="text-muted">
                      {m.price} ج.م · {m.durationDays} يوم
                    </span>
                  </div>
                ))}
             </div>

{o.attachments && o.attachments.length > 0 && (
  <div className="mb-4">
    <p className="text-sm font-extrabold mb-2">مرفقات العرض</p>
    <div className="flex flex-wrap gap-3">
      {o.attachments
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
                width: 72,
                height: 72,
                objectFit: 'cover',
                borderRadius: 10,
                border: '1px solid var(--line)',
              }}
            />
          </a>
        ))}
    </div>
    {o.attachments.some((a) => a.link) && (
      <div className="space-y-2 mt-3">
        {o.attachments
          .filter((a) => a.link)
          .map((a) => (
            <a
              key={a.id}
              href={a.link as string}
              target="_blank"
              rel="noreferrer"
              className="block text-sm text-brand truncate"
            >
              🔗 {a.link}
            </a>
          ))}
      </div>
    )}
  </div>
)}

{o.status === 'SUBMITTED' || o.status === 'REVISED' ? (
                <button
                  onClick={() => acceptOffer(o.id)}
                  className="btn-primary"
                  disabled={accepting === o.id}
                >
                  {accepting === o.id ? 'جاري القبول...' : 'قبول العرض'}
                </button>
              ) : (
                <span className="text-sm font-extrabold text-muted">
                  الحالة: {o.status}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
