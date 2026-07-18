'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type OptionItem = { value: string; label: string };

const RC_CSS = `
.rc-wrap{max-width:640px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.rc-head{margin-bottom:22px;}
.rc-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.rc-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.rc-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.rc-field{margin-bottom:18px;}
.rc-label{display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.rc-input,.rc-select,.rc-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;box-sizing:border-box;}
.rc-input:focus,.rc-select:focus,.rc-area:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.rc-area{min-height:120px;resize:vertical;line-height:1.8;}
.rc-row{display:flex;gap:12px;}
.rc-row .rc-field{flex:1;}
.rc-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:16px;line-height:1.7;}
.rc-btn{width:100%;padding:13px;border-radius:13px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;transition:background .15s;margin-top:6px;}
.rc-btn:hover{background:var(--green-dark);}
.rc-btn:disabled{opacity:.6;cursor:default;}
@media(max-width:520px){.rc-row{flex-direction:column;gap:0;}.rc-title{font-size:21px;}}
`;

export default function RecommendPage() {
  const router = useRouter();
  const [fields, setFields] = useState<OptionItem[]>([]);
  const [title, setTitle] = useState('');
  const [selectedField, setSelectedField] = useState('');
  const [customField, setCustomField] = useState('');
  const [description, setDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<any[]>('/options/PROJECT_FIELD')
      .then((data) =>
        setFields(
          (Array.isArray(data) ? data : []).map((o) => ({
            value: String(o.value ?? o.label ?? ''),
            label: String(o.label ?? o.value ?? ''),
          })),
        ),
      )
      .catch(() => setFields([]));
  }, [router]);

  async function submit() {
    setError('');
    const field =
      selectedField === '__OTHER__' ? customField.trim() : selectedField.trim();
    if (title.trim().length < 3) return setError('اكتب عنوان واضح للمشروع (3 حروف على الأقل).');
    if (!field) return setError('اختار أو اكتب مجال المشروع.');
    if (description.trim().length < 10) return setError('اكتب وصف كافي للمشروع (10 حروف على الأقل).');

    const body: Record<string, unknown> = {
      title: title.trim(),
      field,
      description: description.trim(),
    };
    if (budgetMin) body.budgetMin = Number(budgetMin);
    if (budgetMax) body.budgetMax = Number(budgetMax);
    if (durationDays) body.durationDays = Number(durationDays);

    setSubmitting(true);
    try {
      const res = await api<{ id: string }>('/recommendations', {
        method: 'POST',
        body,
      });
      router.push(`/projects/recommend/${res.id}`);
    } catch (err: any) {
      setError(err?.message || 'حصل خطأ أثناء إرسال الطلب. حاول تاني.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{RC_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="rc-wrap">
        <div className="rc-head">
  <h1 className="rc-title">محايد ترشّح لك الأفضل</h1>
  <p className="rc-sub">
    قوللنا تفاصيل مشروعك، وخبراؤنا التقنيون وفريقنا القانوني هيرشّحولك أنسب مقدم خدمة لطبيعة مشروعك وميزانيتك.
  </p>
  <button
    type="button"
    onClick={() => router.push('/projects/recommend/mine')}
    style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, color: 'var(--green-dark)', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
  >
    متابعة طلباتك السابقة ←
  </button>
</div>

        <div className="rc-card">
          {error && <div className="rc-err">{error}</div>}

          <div className="rc-field">
            <label className="rc-label">عنوان المشروع</label>
            <input
              className="rc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تصميم وتطوير متجر إلكتروني"
            />
          </div>

          <div className="rc-field">
            <label className="rc-label">مجال المشروع</label>
            {fields.length > 0 ? (
              <select
                className="rc-select"
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
              >
                <option value="">اختار المجال...</option>
                {fields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
                <option value="__OTHER__">أخرى (اكتبها)</option>
              </select>
            ) : (
              <input
                className="rc-input"
                value={customField}
                onChange={(e) => setCustomField(e.target.value)}
                placeholder="مثال: برمجة، تصميم، تسويق..."
              />
            )}
            {fields.length > 0 && selectedField === '__OTHER__' && (
              <input
                className="rc-input"
                style={{ marginTop: 10 }}
                value={customField}
                onChange={(e) => setCustomField(e.target.value)}
                placeholder="اكتب المجال"
              />
            )}
          </div>

          <div className="rc-field">
            <label className="rc-label">وصف المشروع واحتياجك</label>
            <textarea
              className="rc-area"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح فكرة المشروع، المطلوب تنفيذه، وأي تفاصيل تساعد فريقنا يرشّح لك الأنسب."
            />
          </div>

          <div className="rc-row">
            <div className="rc-field">
              <label className="rc-label">الميزانية من (اختياري)</label>
              <input
                className="rc-input"
                type="number"
                inputMode="numeric"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="ج.م"
              />
            </div>
            <div className="rc-field">
              <label className="rc-label">الميزانية إلى (اختياري)</label>
              <input
                className="rc-input"
                type="number"
                inputMode="numeric"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="ج.م"
              />
            </div>
          </div>

          <div className="rc-field">
            <label className="rc-label">المدة المتوقعة بالأيام (اختياري)</label>
            <input
              className="rc-input"
              type="number"
              inputMode="numeric"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              placeholder="مثال: 30"
            />
          </div>

          <button className="rc-btn" onClick={submit} disabled={submitting}>
            {submitting ? 'جاري الإرسال...' : 'ابعت الطلب لفريق محايد'}
          </button>
        </div>
      </div>
    </>
  );
}
