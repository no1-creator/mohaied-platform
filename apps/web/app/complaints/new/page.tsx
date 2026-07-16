'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import TopBar from '@/components/TopBar';

const TYPES = [
  { value: 'DELIVERY_DELAY', label: 'تأخير في التسليم' },
  { value: 'AGREEMENT_VIOLATION', label: 'مخالفة للاتفاق' },
  { value: 'PAYMENT_ISSUE', label: 'مشكلة في الدفع' },
  { value: 'UNPROFESSIONAL', label: 'سلوك غير مهني' },
];

export default function NewComplaintPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [type, setType] = useState('DELIVERY_DELAY');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const complaint = await api<{ id: string }>('/complaints', {
        method: 'POST',
        body: { projectId, type, details },
      });
      router.push(`/complaints/${complaint.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!projectId) {
    return (
      <main className="min-h-screen">
        <TopBar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center text-muted">
          لازم تفتح الشكوى من صفحة المشروع.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-2">فتح شكوى</h1>
        <p className="text-muted text-sm mb-6">
          الشكوى بتتوثّق وبتتسجّل، والطرف التاني هيقدر يرد، وإدارة محايد هي اللي
          بتصدر القرار.
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">نوع الشكوى</label>
            <select
              className="input-field"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">تفاصيل الشكوى</label>
            <textarea
              className="input-field min-h-[140px]"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              minLength={10}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'تقديم الشكوى'}
          </button>
        </form>
      </div>
    </main>
  );
}
