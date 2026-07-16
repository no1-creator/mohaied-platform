'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Milestone = {
  id: string;
  title: string;
  status: string;
  value: number;
  orderIndex: number;
};

type Project = {
  id: string;
  title: string;
  field: string;
  description: string;
  status: string;
  budgetMin?: number;
  budgetMax?: number;
  durationDays?: number;
  milestones?: Milestone[];
  client?: { fullName: string };
  provider?: { fullName: string };
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'مفتوح',
  IN_PROGRESS: 'قيد التنفيذ',
  DISPUTED: 'نزاع',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
  PENDING: 'بانتظار البدء',
  UNDER_REVIEW: 'قيد المراجعة',
  APPROVED: 'معتمد',
  REVISION_REQUESTED: 'مطلوب تعديل',
};

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api<Project>(`/projects/${id}`)
      .then((data) => setProject(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        جاري التحميل...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <TopBar />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center text-red-600">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full">
              {project ? STATUS_LABELS[project.status] || project.status : ''}
            </span>
            <span className="text-xs text-muted">{project?.field}</span>
          </div>
          <h1 className="text-2xl font-black mb-3">{project?.title}</h1>
          <p className="text-muted leading-loose whitespace-pre-line">
            {project?.description}
          </p>
        </div>

        <div className="card">
          <h2 className="font-black mb-4">مراحل المشروع</h2>
          {(!project?.milestones || project.milestones.length === 0) && (
            <p className="text-muted text-sm">
              لسه مفيش مراحل — بتتولّد بعد قبول العرض.
            </p>
          )}
          <div className="space-y-3">
            {project?.milestones?.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border border-line rounded-xl px-4 py-3"
              >
                <div>
                  <span className="font-bold">{m.title}</span>
                  <span className="block text-xs text-muted mt-1">
                    {STATUS_LABELS[m.status] || m.status}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-brand">
                  {m.value} ج.م
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
