'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Project = {
  id: string;
  title: string;
  field: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  IN_PROGRESS: 'قيد التنفيذ',
  DISPUTED: 'نزاع',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api<Project[]>('/projects/mine')
      .then((data) => setProjects(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black">مشاريعي</h1>
          <Link
            href="/projects/start"
            className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-extrabold"
          >
            + مشروع جديد
          </Link>
        </div>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && projects.length === 0 && (
          <div className="card text-center py-16">
            <p className="text-muted mb-4">لسه مفيش مشاريع.</p>
            <Link
              href="/projects/start"
              className="text-brand font-extrabold"
            >
              ابدأ أول مشروع
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className="card block">
              <div className="flex items-center justify-between mb-2">
                <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
                  {STATUS_LABELS[p.status] || p.status}
                </span>
                <span className="text-xs text-muted">{p.field}</span>
              </div>
              <h3 className="font-black text-lg">{p.title}</h3>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
