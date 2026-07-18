'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Project = {
  id: string;
  title: string;
  field: string;
  description: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredProviderId?: string | null;
  client?: { fullName: string };
};

export default function OpenProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [myId, setMyId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api<{ id: string }>('/users/me')
      .then((u) => setMyId(u?.id || ''))
      .catch(() => setMyId(''));

    api<Project[]>('/projects/open')
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  // المشاريع اللي العميل اختار المقدم الحالي فيها مباشرة تظهر الأول
  const sorted = [...projects].sort((a, b) => {
    const am = myId && a.preferredProviderId === myId ? 1 : 0;
    const bm = myId && b.preferredProviderId === myId ? 1 : 0;
    return bm - am;
  });

  return (
    <main className="min-h-screen">
      <TopBar />
      <BackBar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-8">مشاريع مفتوحة</h1>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <div className="card text-center py-16 text-muted">
            مفيش مشاريع مفتوحة حاليًا.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sorted.map((p) => {
            const direct = !!myId && p.preferredProviderId === myId;
            return (
              <div
                key={p.id}
                className="card"
                style={
                  direct
                    ? { borderColor: 'var(--green)', boxShadow: '0 10px 26px rgba(40,125,115,.12)' }
                    : undefined
                }
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted">{p.field}</span>
                  {(p.budgetMin || p.budgetMax) && (
                    <span className="text-xs font-extrabold text-brand">
                      {p.budgetMin ?? '—'} : {p.budgetMax ?? '—'} ج.م
                    </span>
                  )}
                </div>

                {direct && (
                  <div
                    style={{
                      display: 'inline-block',
                      background: 'var(--green)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: 999,
                      marginBottom: 8,
                    }}
                  >
                    ★ طلب مباشر ليك
                  </div>
                )}

                <h3 className="font-black text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-muted line-clamp-3 mb-4">{p.description}</p>
                <Link
                  href={`/offers/new?projectId=${p.id}`}
                  className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-extrabold inline-block"
                >
                  قدّم عرض
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
