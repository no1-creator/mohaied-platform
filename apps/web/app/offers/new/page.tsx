'use client';

import { useRef, useState, Suspense } from 'react';
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

const MAX_IMAGES = 5;
const MAX_LINKS = 6;
const MAX_IMAGE_MB = 2;

function NewOfferInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [scope, setScope] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { ...emptyMilestone },
  ]);
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  function pickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = '';
    if (!files.length) return;
    setError('');
    for (const file of files) {
      if (images.length >= MAX_IMAGES) {
        setError(`أقصى عدد صور هو ${MAX_IMAGES}.`);
        break;
      }
      if (!file.type.startsWith('image/')) {
        setError('اختَر صور فقط.');
        continue;
      }
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
        setError(`كل صورة لازم تكون أقل من ${MAX_IMAGE_MB} ميجا.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImages((prev) =>
          prev.length >= MAX_IMAGES ? prev : [...prev, String(reader.result)],
        );
      };
      reader.readAsDataURL(file);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function addLink() {
    const v = linkInput.trim();
    if (!v) return;
    if (links.length >= MAX_LINKS) {
      setError(`أقصى عدد روابط هو ${MAX_LINKS}.`);
      return;
    }
    setLinks((prev) => [...prev, v]);
    setLinkInput('');
  }

  function removeLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api<{ id: string }>('/offers', {
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
          attachmentImages: images,
          attachmentLinks: links,
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

          <div className="card space-y-4">
            <div>
              <h2 className="font-black mb-1">مرفقات العرض (اختياري)</h2>
              <p className="text-sm text-muted">
                ارفع صور من أعمالك السابقة أو نماذج توضّح خبرتك، وتقدر كمان تضيف
                روابط (بورتفوليو، Drive، Behance...).
              </p>
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={pickImages}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="border border-line rounded-xl px-4 py-2 text-sm font-bold text-brand"
                disabled={images.length >= MAX_IMAGES}
              >
                + رفع صور ({images.length}/{MAX_IMAGES})
              </button>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {images.map((src, i) => (
                    <div
                      key={i}
                      style={{ position: 'relative', width: 84, height: 84 }}
                    >
                      <img
                        src={src}
                        alt=""
                        style={{
                          width: 84,
                          height: 84,
                          objectFit: 'cover',
                          borderRadius: 12,
                          border: '1px solid var(--line)',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          insetInlineEnd: -8,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: 'none',
                          background: '#b42318',
                          color: '#fff',
                          cursor: 'pointer',
                          fontWeight: 800,
                          lineHeight: '24px',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">إضافة رابط</label>
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="https://..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addLink();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addLink}
                  className="border border-line rounded-xl px-4 font-bold text-brand"
                  disabled={links.length >= MAX_LINKS}
                >
                  إضافة
                </button>
              </div>

              {links.length > 0 && (
                <div className="space-y-2 mt-3">
                  {links.map((l, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between border border-line rounded-xl px-4 py-2 text-sm"
                    >
                      <span className="truncate text-brand">{l}</span>
                      <button
                        type="button"
                        onClick={() => removeLink(i)}
                        className="text-red-600 font-bold shrink-0 mr-2"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

export default function NewOfferPage() {
  return (
    <Suspense fallback={null}>
      <NewOfferInner />
    </Suspense>
  );
}
