'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Offer = {
  id: string;
  scope: string;
  totalPrice: number;
  durationDays: number;
  status: string;
  project?: { id: string; title: string; status: string };
  milestones?: { id: string; title: string; price: number }[];
};

const OFFER_STATUS: Record<string, string> = {
  SUBMITTED: 'مقدَّم',
  REVISED: 'مُعدَّل',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
};

export default function MyOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api<Offer[]>('/offers/mine')
      .then((data) => setOffers(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen">
      <TopBar />
      <BackBar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">عروضي</h1>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && offers.length === 0 && (
          <div className="card text-center py-16 text-muted">
            لسه مقدّمتش أي عروض.
          </div>
        )}

        <div className="space-y-4">
          {offers.map((o) => (
            <div key={o.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-black">{o.project?.title}</h3>
                <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                  {OFFER_STATUS[o.status] || o.status}
                </span>
              </div>
              <p className="text-sm text-muted line-clamp-2 mb-3">{o.scope}</p>
              <div className="flex items-center gap-6 text-sm">
                <span className="font-extrabold text-brand">
                  {o.totalPrice} ج.م
                </span>
                <span className="text-muted">{o.durationDays} يوم</span>
                <span className="text-muted">
                  {o.milestones?.length || 0} مرحلة
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
