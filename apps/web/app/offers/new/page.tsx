'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import TopBar from '@/components/TopBar';

type MilestoneInput = {
  title: string;
  description: string;
  price: string;
  durationDays: string;
};

const emptyMilestone: MilestoneInput = {
  title: '',
  description: '',
  price: '',
  durationDays: '',
};

export default function NewOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [scope, setScope] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { ...emptyMilestone },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalPrice = milestones.reduce(
    (sum, m) => sum + (Number(m.price) || 0),
    0,
  );

  function updateMilestone(
    index: number,
    key: keyof MilestoneInput,
    value: string,
  ) {
    setMilestones((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)),
    );
  }

  function addMilestone() {
    setMilestones((prev) => [...prev, { ...emptyMilestone }]);
  }

  function removeMilestone(index: number) {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const offer = await api<{ id: string }>('/offers', {
        method: 'POST',
        body: {
          projectId,
          scope,
          totalPrice,
          durationDays: Number(durationDays),
          milestones: milestones.map((m) => ({
            title: m.title,
            description: m.description,
            price: Number(m.price),
            durationDays: Number(m.durationDays),
          })),
        },
      });
      router.push('/offers/mine');
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
          لازم تختار مشروع الأول من صفحة المشاريع المفتوحة.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black mb-6">تقديم عرض</h1>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card space-y-4">
            <div>
              <label className="label">نطاق العمل</label>
              <textarea
                className="input-field min-h-[100px]"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">مدة التنفيذ الكلية (أيام)</label>
              <input
                type="number"
                className="input-field"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-black">المراحل</h2>
              <button
                type="button"
                onClick={addMilestone}
                className="text-brand font-extrabold text-sm"
              >
                + إضافة مرحلة
              </button>
            </div>

            {milestones.map((m, index) => (
              <div key={index} className="card space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">مرحلة {index + 1}</span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-red-600 text-sm font-bold"
                    >
                      حذف
                    </button>
                  )}
                </div>
                <input
                  className="input-field"
                  placeholder="عنوان المرحلة"
                  value={m.title}
                  onChange={(e) =>
                    updateMilestone(index, 'title', e.target.value)
                  }
                  required
                />
                <textarea
                  className="input-field"
                  placeholder="وصف المرحلة"
                  value={m.description}
                  onChange={(e) =>
                    updateMilestone(index, 'description', e.target.value)
                  }
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    className="input-field"
                    placeholder="السعر (ج.م)"
                    value={m.price}
                    onChange={(e) =>
                      updateMilestone(index, 'price', e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    className="input-field"
                    placeholder="المدة (أيام)"
                    value={m.durationDays}
                    onChange={(e) =>
                      updateMilestone(index, 'durationDays', e.target.value)
                    }
                    required
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="card flex items-center justify-between">
            <span className="font-black">إجمالي العرض</span>
            <span className="text-lg font-black text-brand">
              {totalPrice} ج.م
            </span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'جاري الإرسال...' : 'إرسال العرض'}
          </button>
        </form>
      </div>
    </main>
  );
}
