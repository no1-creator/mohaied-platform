'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSiteContent } from '@/lib/content';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type OptionItem = { id: string; value: string; label: string };

const NP_CSS = `
.np-wrap{max-width:640px;margin:0 auto;width:100%;padding:26px 20px 80px;}
.np-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:26px 26px 28px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.np-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.np-sub{color:var(--muted);font-size:14px;margin:0 0 22px;line-height:1.7;}
.np-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:11px 14px;border-radius:12px;font-size:14px;margin-bottom:18px;}
.np-field{margin-bottom:16px;}
.np-label{display:block;font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px;}
.np-input,.np-select,.np-textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;box-sizing:border-box;outline:none;transition:border-color .15s,box-shadow .15s;}
.np-textarea{resize:vertical;min-height:110px;line-height:1.8;}
.np-input:focus,.np-select:focus,.np-textarea:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.np-row{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.np-btn{margin-top:8px;width:100%;padding:12px 22px;border-radius:12px;border:none;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;background:var(--green);color:#fff;transition:background .15s,opacity .15s;}
.np-btn:hover{background:var(--green-dark);}
.np-btn:disabled{opacity:.6;cursor:default;}
@media(max-width:520px){.np-row{grid-template-columns:1fr;}}
`;

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useSiteContent();
  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [customField, setCustomField] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [dynFields, setDynFields] = useState<OptionItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // تصنيفات المشاريع المُدارة من لوحة التحكم
  useEffect(() => {
    api<OptionItem[]>('/options/PROJECT_FIELD')
      .then((data) => setDynFields(Array.isArray(data) ? data : []))
      .catch(() => setDynFields([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const finalField = field === '__OTHER__' ? customField.trim() : field.trim();
    if (!finalField) {
      setError('اختر مجال المشروع أو اكتبه في خانة «أخرى».');
      return;
    }
    setLoading(true);
    try {
      const project = await api<{ id: string }>('/projects', {
        method: 'POST',
        body: {
          title,
          field: finalField,
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
    <>
      <style>{NP_CSS}</style>
      <TopBar />
      <BackBar label="رجوع" />
      <div className="np-wrap">
        <div className="np-card">
          <h1 className="np-title">{t('projects.new.title')}</h1>
          <p className="np-sub">{t('projects.new.subtitle')}</p>

          {error && <div className="np-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="np-field">
              <label className="np-label">عنوان المشروع</label>
              <input
                className="np-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: تصميم هوية بصرية لمتجر إلكتروني"
                required
              />
            </div>

            <div className="np-field">
              <label className="np-label">المجال / التخصص</label>
              <select
                className="np-select"
                value={field}
                onChange={(e) => setField(e.target.value)}
                required
              >
                <option value="">— اختر المجال —</option>
                {dynFields.map((o) => (
                  <option value={o.label} key={o.id}>
                    {o.label}
                  </option>
                ))}
                <option value="__OTHER__">أخرى (اكتبه)</option>
              </select>
            </div>

            {field === '__OTHER__' && (
              <div className="np-field">
                <label className="np-label">اكتب المجال</label>
                <input
                  className="np-input"
                  value={customField}
                  onChange={(e) => setCustomField(e.target.value)}
                  placeholder="اكتب مجال المشروع…"
                  maxLength={80}
                  required
                />
              </div>
            )}

            <div className="np-field">
              <label className="np-label">وصف المشروع</label>
              <textarea
                className="np-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اشرح تفاصيل المشروع والمطلوب بوضوح…"
                required
              />
            </div>

            <div className="np-row">
              <div className="np-field">
                <label className="np-label">أقل ميزانية (ج.م)</label>
                <input
                  className="np-input"
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="np-field">
                <label className="np-label">أعلى ميزانية (ج.م)</label>
                <input
                  className="np-input"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="np-field">
              <label className="np-label">المدة (أيام)</label>
              <input
                className="np-input"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="مثال: 14"
              />
            </div>

            <button className="np-btn" type="submit" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : t('projects.new.submit')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
