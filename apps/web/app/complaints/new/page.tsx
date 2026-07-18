'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

const TYPES = [
  {
    value: 'DELIVERY_DELAY',
    label: 'تأخير في التسليم',
    desc: 'المشروع أو المرحلة اتأخّرت عن الموعد المتفق عليه.',
  },
  {
    value: 'AGREEMENT_VIOLATION',
    label: 'مخالفة للاتفاق',
    desc: 'الشغل المسلَّم مخالف لما تم الاتفاق عليه.',
  },
  {
    value: 'PAYMENT_ISSUE',
    label: 'مشكلة في الدفع',
    desc: 'خلاف على الدفع أو تحرير المبلغ من الضمان.',
  },
  {
    value: 'UNPROFESSIONAL',
    label: 'سلوك غير مهني',
    desc: 'تعامل غير لائق أو غير احترافي من الطرف الآخر.',
  },
  {
    value: 'OTHER',
    label: 'نوع آخر',
    desc: 'اكتب نوع النزاع بنفسك لو مش موجود فوق.',
  },
];

type Milestone = { id: string; title: string; status?: string };
type DynOption = { id: string; label: string; value: string };

const NC_CSS = `
.nc-wrap{max-width:720px;margin:0 auto;padding:24px 20px 60px;}
.nc-note{color:var(--muted);font-size:14px;padding:16px 0;}
.nc-head{margin-bottom:18px;}
.nc-title{display:flex;align-items:center;gap:9px;font-size:24px;font-weight:800;color:var(--ink);}
.nc-lead{color:var(--muted);font-size:14.5px;line-height:1.9;margin-top:8px;}
.nc-process{display:flex;gap:10px;align-items:flex-start;background:var(--mint);border:1px solid var(--green-light);border-radius:14px;padding:14px 16px;margin-bottom:22px;color:var(--green-dark);font-size:13.5px;line-height:1.85;}
.nc-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:12px 14px;border-radius:12px;font-size:14px;margin-bottom:16px;}
.nc-form{display:flex;flex-direction:column;gap:24px;}
.nc-field{display:flex;flex-direction:column;}
.nc-label{font-weight:800;font-size:15px;color:var(--ink);margin-bottom:12px;}
.nc-opt{font-weight:600;font-size:13px;color:var(--muted);}
.nc-types{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.nc-type{position:relative;text-align:right;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:15px 16px;cursor:pointer;font-family:inherit;transition:all .15s;display:flex;flex-direction:column;gap:5px;}
.nc-type:hover{border-color:var(--green-light);}
.nc-type.sel{border-color:var(--green);background:var(--mint);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.nc-type-check{position:absolute;top:12px;left:12px;color:var(--green-dark);height:16px;}
.nc-type-label{font-weight:800;font-size:14.5px;color:var(--ink);}
.nc-type-desc{font-size:12.5px;color:var(--muted);line-height:1.7;}
.nc-custom{margin-top:12px;}
.nc-input,.nc-select,.nc-textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14.5px;color:var(--ink);background:#fff;box-sizing:border-box;resize:vertical;}
.nc-input:focus,.nc-select:focus,.nc-textarea:focus{outline:none;border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.nc-hint{font-size:12.5px;color:var(--muted);margin-top:8px;}
.nc-evidence{display:flex;gap:11px;align-items:flex-start;background:var(--background);border:1px dashed var(--line);border-radius:14px;padding:14px 16px;color:var(--muted);}
.nc-ev-title{font-weight:800;font-size:13.5px;color:var(--ink);margin-bottom:3px;}
.nc-ev-desc{font-size:12.5px;line-height:1.8;}
.nc-submit{background:var(--green);color:#fff;border:none;border-radius:13px;padding:14px;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;transition:all .15s;}
.nc-submit:hover{background:var(--green-dark);}
.nc-submit:disabled{opacity:.6;cursor:default;}
@media(max-width:560px){.nc-types{grid-template-columns:1fr;}}
`;

function NewComplaintInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  const [type, setType] = useState('DELIVERY_DELAY');
  const [customType, setCustomType] = useState('');
  const [milestoneId, setMilestoneId] = useState('');
  const [details, setDetails] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [dynTypes, setDynTypes] = useState<DynOption[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    // أنواع النزاع المُضافة من إدارة محايد (ديناميكية)
    api<DynOption[]>('/options/COMPLAINT_TYPE')
      .then((data) => setDynTypes(Array.isArray(data) ? data : []))
      .catch(() => {});
    if (!projectId) return;
    api<Milestone[]>(`/milestones/project/${projectId}`)
      .then((data) => setMilestones(data || []))
      .catch(() => {});
  }, [projectId, router]);

  const builtinNoOther = TYPES.filter((t) => t.value !== 'OTHER');
  const otherType = TYPES.find((t) => t.value === 'OTHER')!;
  const dynAsTypes = dynTypes.map((o) => ({
    value: `DYN::${o.label}`,
    label: o.label,
    desc: 'نوع نزاع مُضاف من إدارة محايد.',
  }));
  const allTypes = [...builtinNoOther, ...dynAsTypes, otherType];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const isDyn = type.startsWith('DYN::');
    if (type === 'OTHER' && !customType.trim()) {
      setError('اكتب نوع النزاع في الخانة المخصصة.');
      return;
    }
    setLoading(true);
    try {
      const body: Record<string, unknown> = { projectId, details };
      if (milestoneId) body.milestoneId = milestoneId;
      if (isDyn) {
        body.type = 'OTHER';
        body.customType = type.slice(5);
      } else if (type === 'OTHER') {
        body.type = 'OTHER';
        if (customType.trim()) body.customType = customType.trim();
      } else {
        body.type = type;
      }
      const complaint = await api<{ id: string }>('/complaints', {
        method: 'POST',
        body,
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
      <div className="nc-wrap">
        <div className="nc-note">لازم تفتح النزاع من صفحة المشروع.</div>
      </div>
    );
  }

  const detailsStep = milestones.length > 0 ? '٣' : '٢';

  return (
    <div className="nc-wrap">
      <div className="nc-head">
        <div className="nc-title">
          <Icon name="scale" size={24} />
          فتح نزاع جديد
        </div>
        <div className="nc-lead">
          النزاع بيتوثّق ويتسجّل رسميًا، الطرف الآخر هيقدر يرد، وإدارة محايد بتتدخّل كمُحكّم محايد وتصدر القرار النهائي المُلزم.
        </div>
      </div>

      <div className="nc-process">
        <Icon name="shield" size={18} />
        <div>
          بعد التقديم: الطرف الآخر بيتبلّغ ويرد، إدارة محايد بتراجع الأدلة وتتدخّل كمُحكّم، وفي الآخر بيصدر قرار موثّق مُلزم للطرفين.
        </div>
      </div>

      {error && <div className="nc-error">{error}</div>}

      <form className="nc-form" onSubmit={handleSubmit}>
        <div className="nc-field">
          <div className="nc-label">١. نوع النزاع</div>
          <div className="nc-types">
            {allTypes.map((t) => (
              <button
                type="button"
                key={t.value}
                className={`nc-type ${type === t.value ? 'sel' : ''}`}
                onClick={() => setType(t.value)}
              >
                {type === t.value && (
                  <Icon name="badgeCheck" size={16} className="nc-type-check" />
                )}
                <span className="nc-type-label">{t.label}</span>
                <span className="nc-type-desc">{t.desc}</span>
              </button>
            ))}
          </div>
          {type === 'OTHER' && (
            <div className="nc-custom">
              <input
                className="nc-input"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                placeholder="اكتب نوع النزاع (مثال: خلاف على حقوق الملكية الفكرية)"
                maxLength={120}
                required
              />
            </div>
          )}
        </div>

        {milestones.length > 0 && (
          <div className="nc-field">
            <div className="nc-label">
              ٢. المرحلة المتعلقة <span className="nc-opt">(اختياري)</span>
            </div>
            <select
              className="nc-select"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
            >
              <option value="">نزاع عام على المشروع</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="nc-field">
          <div className="nc-label">{detailsStep}. تفاصيل النزاع</div>
          <textarea
            className="nc-textarea"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            minLength={10}
            required
            rows={6}
            placeholder="اشرح المشكلة بالتفصيل: إيه اللي حصل، إمتى، وإيه المطلوب. كل ما توضّح أكتر كل ما القرار يكون أدق."
          />
          <div className="nc-hint">
            اكتب ١٠ أحرف على الأقل. اذكر التواريخ والوقائع والاتفاقات بدقة.
          </div>
        </div>

        <div className="nc-evidence">
          <Icon name="folder" size={18} />
          <div>
            <div className="nc-ev-title">الأدلة والمرفقات</div>
            <div className="nc-ev-desc">
              نظام رفع الوثائق والصور قيد التجهيز. مؤقتًا اذكر روابط الأدلة داخل التفاصيل، وهتقدر ترفعها في ملف النزاع قريبًا.
            </div>
          </div>
        </div>

        <button className="nc-submit" type="submit" disabled={loading}>
          {loading ? 'جاري التقديم…' : 'تقديم النزاع رسميًا'}
        </button>
      </form>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <>
      <style>{NC_CSS}</style>
      <TopBar />
      <BackBar />
      <Suspense
        fallback={
          <div className="nc-wrap">
            <div className="nc-note">جاري التحميل…</div>
          </div>
        }
      >
        <NewComplaintInner />
      </Suspense>
    </>
  );
}
