'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

export default function NewProjectPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const project = await api<{ id: string }>('/projects', {
        method: 'POST',
        body: {
          title,
          field,
          description,
          budgetMin: budgetMin ? Number(budgetMin) : undefined,
          budgetMax: budgetMax ? Number(budgetMax) : undefined,
          durationDays: durationDays ? Number(durationDays) : undefined,
        },
      });
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <BackBar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-6">مشروع جديد</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="label">عنوان المشروع</label>
            <input
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">المجال</label>
            <input
              className="input-field"
              value={field}
              onChange={(e) => setField(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">وصف المشروع</label>
            <textarea
              className="input-field min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">أقل ميزانية</label>
              <input
                type="number"
                className="input-field"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
              />
            </div>
            <div>
              <label className="label">أعلى ميزانية</label>
              <input
                type="number"
                className="input-field"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">المدة (أيام)</label>
            <input
              type="number"
              className="input-field"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء المشروع'}
          </button>
        </form>
      </div>
    </main>
  );
}
