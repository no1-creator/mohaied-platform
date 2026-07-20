'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';
import { toast } from '@/components/Toast';

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

const MAX_IMAGES = 5;
const MAX_LINKS = 6;

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
.nc-up{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.nc-up-btn{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--green-dark);border:1px solid var(--green-light);font-weight:700;font-size:13.5px;padding:9px 16px;border-radius:10px;cursor:pointer;font-family:inherit;}
.nc-up-hint{font-size:12.5px;color:var(--muted);}
.nc-thumbs{display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;}
.nc-thumb{position:relative;width:86px;height:86px;border-radius:12px;overflow:hidden;border:1px solid var(--line);}
.nc-thumb img{width:100%;height:100%;object-fit:cover;}
.nc-thumb-x{position:absolute;top:4px;left:4px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(17,33,31,.72);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.nc-linkrow{display:flex;gap:8px;margin-top:12px;}
.nc-linkrow .nc-input{margin:0;}
.nc-links{list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:8px;}
.nc-links li{display:flex;align-items:center;gap:9px;background:var(--background);border:1px solid var(--line);border-radius:10px;padding:9px 12px;font-size:13px;color:var(--ink);}
.nc-link-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;direction:ltr;text-align:left;}
.nc-link-x{width:22px;height:22px;flex-shrink:0;border:none;background:#f4dcda;color:#b42318;border-radius:6px;font-size:15px;line-height:1;cursor:pointer;}
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
  const [images, setImages] = useState<string[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
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

  function pickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (e.target) e.target.value = '';
    if (!files.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
      return;
    }
    files.slice(0, room).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('لازم يكون ملف صورة');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`«${file.name}» أكبر من ٢ ميجا`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () =>
        setImages((prev) =>
          prev.length >= MAX_IMAGES ? prev : [...prev, String(reader.result)],
        );
      reader.readAsDataURL(file);
    });
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addLink() {
    const v = linkInput.trim();
    if (!v) return;
    if (links.length >= MAX_LINKS) {
      toast.error(`الحد الأقصى ${MAX_LINKS} روابط`);
      return;
    }
    setLinks((prev) => [...prev, v]);
    setLinkInput('');
  }

  function removeLink(i: number) {
    setLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const isDyn = type.startsWith('DYN::');
    if (type === 'OTHER' && !customType.trim()) {
      const msg = 'اكتب نوع النزاع في الخانة المخصصة.';
      setError(msg);
      toast.error(msg);
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
      if (images.length) body.evidenceImages = images;
      if (links.length) body.evidenceLinks = links;

      const complaint = await api<{ id: string }>('/complaints', {
        method: 'POST',
        body,
      });
      toast.success('تم تقديم النزاع رسميًا ✅');
      router.push(`/complaints/${complaint.id}`);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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
      <BackBar />

      <div className="nc-head">
        <h1 className="nc-title">
          <Icon name="scale" size={22} /> فتح نزاع جديد
        </h1>
        <p className="nc-lead">
          النزاع بيتوثّق ويتسجّل رسميًا، الطرف الآخر هيقدر يرد، وإدارة محايد
          بتتدخّل كمُحكّم محايد وتصدر القرار النهائي المُلزم.
        </p>
      </div>

      <div className="nc-process">
        <Icon name="shield" size={18} />
        <div>
          بعد التقديم: الطرف الآخر بيتبلّغ ويرد، إدارة محايد بتراجع الأدلة وتتدخّل
          كمُحكّم، وفي الآخر بيصدر قرار موثّق مُلزم للطرفين.
        </div>
      </div>

      {error && <div className="nc-error">{error}</div>}

      <form className="nc-form" onSubmit={handleSubmit}>
        <div className="nc-field">
          <label className="nc-label">١. نوع النزاع</label>
          <div className="nc-types">
            {allTypes.map((t) => (
              <button
                type="button"
                key={t.value}
                className={`nc-type ${type === t.value ? 'sel' : ''}`}
                onClick={() => setType(t.value)}
              >
                {type === t.value && (
                  <span className="nc-type-check">
                    <Icon name="badgeCheck" size={16} />
                  </span>
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
            <label className="nc-label">٢. المرحلة المتعلقة (اختياري)</label>
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
          <label className="nc-label">{detailsStep}. تفاصيل النزاع</label>
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

        <div className="nc-field">
          <label className="nc-label">
            الأدلة والمرفقات <span className="nc-opt">(اختياري)</span>
          </label>

          <div className="nc-up">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={pickImages}
            />
            <button
              type="button"
              className="nc-up-btn"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="plus" size={16} /> إضافة صور
            </button>
            <span className="nc-up-hint">
              حتى {MAX_IMAGES} صور، كل صورة أقل من ٢ ميجا (JPG / PNG).
            </span>
          </div>

          {images.length > 0 && (
            <div className="nc-thumbs">
              {images.map((src, i) => (
                <div className="nc-thumb" key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`دليل ${i + 1}`} />
                  <button
                    type="button"
                    className="nc-thumb-x"
                    onClick={() => removeImage(i)}
                    aria-label="إزالة"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="nc-linkrow">
            <input
              className="nc-input"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addLink();
                }
              }}
              placeholder="رابط دليل (Drive / صورة / ملف) — اختياري"
            />
            <button type="button" className="nc-up-btn" onClick={addLink}>
              إضافة
            </button>
          </div>

          {links.length > 0 && (
            <ul className="nc-links">
              {links.map((l, i) => (
                <li key={i}>
                  <Icon name="link" size={14} />
                  <span className="nc-link-txt">{l}</span>
                  <button
                    type="button"
                    className="nc-link-x"
                    onClick={() => removeLink(i)}
                    aria-label="إزالة"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" className="nc-submit" disabled={loading}>
          {loading ? 'جاري التقديم…' : 'تقديم النزاع رسميًا'}
        </button>
      </form>
    </div>
  );
}

export default function NewComplaintPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: NC_CSS }} />
      <TopBar />
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
