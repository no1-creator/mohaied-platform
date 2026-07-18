'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

const IV_CSS = `
.iv-wrap{max-width:640px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.iv-head{margin-bottom:22px;}
.iv-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.iv-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.iv-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.iv-sec-t{font-size:13px;font-weight:800;color:var(--green-dark);margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid var(--line);}
.iv-sec-t.mt{margin-top:26px;}
.iv-field{margin-bottom:18px;}
.iv-label{display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.iv-input,.iv-select,.iv-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;box-sizing:border-box;}
.iv-input:focus,.iv-select:focus,.iv-area:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.iv-area{min-height:110px;resize:vertical;line-height:1.8;}
.iv-row{display:flex;gap:12px;}
.iv-row .iv-field{flex:1;}
.iv-hint{font-size:12px;color:var(--muted);margin:-8px 0 18px;line-height:1.6;}
.iv-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:16px;line-height:1.7;}
.iv-btn{width:100%;padding:13px;border-radius:13px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;transition:background .15s;margin-top:6px;}
.iv-btn:hover{background:var(--green-dark);}
.iv-btn:disabled{opacity:.6;cursor:default;}
@media(max-width:520px){.iv-row{flex-direction:column;gap:0;}.iv-title{font-size:21px;}}
`;

export default function InvitePage() {
  const router = useRouter();
  const [inviteeName, setInviteeName] = useState('');
  const [inviteeType, setInviteeType] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [inviteePhone, setInviteePhone] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [field, setField] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push('/login');
  }, [router]);

  async function submit() {
    setError('');
    if (inviteeName.trim().length < 2) return setError('اكتب اسم مقدم الخدمة اللي عايز تدعوه.');
    if (!inviteeEmail.trim() && !inviteePhone.trim())
      return setError('ضيف إيميل أو رقم تليفون لمقدم الخدمة عشان نتواصل معاه.');
    if (projectTitle.trim().length < 3) return setError('اكتب عنوان واضح للمشروع (3 حروف على الأقل).');
    if (projectDescription.trim().length < 10) return setError('اكتب وصف كافي للمشروع (10 حروف على الأقل).');

    const body: Record<string, unknown> = {
      inviteeName: inviteeName.trim(),
      projectTitle: projectTitle.trim(),
      projectDescription: projectDescription.trim(),
    };
    if (inviteeType) body.inviteeType = inviteeType;
    if (inviteeEmail.trim()) body.inviteeEmail = inviteeEmail.trim();
    if (inviteePhone.trim()) body.inviteePhone = inviteePhone.trim();
    if (field.trim()) body.field = field.trim();
    if (budgetMin) body.budgetMin = Number(budgetMin);
    if (budgetMax) body.budgetMax = Number(budgetMax);
    if (durationDays) body.durationDays = Number(durationDays);
    if (message.trim()) body.message = message.trim();

    setSubmitting(true);
    try {
      const res = await api<{ id: string }>('/invitations', { method: 'POST', body });
      router.push(`/projects/invite/${res.id}`);
    } catch (err: any) {
      setError(err?.message || 'حصل خطأ أثناء إرسال الدعوة. حاول تاني.');
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{IV_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="iv-wrap">
       <div className="iv-head">
  <h1 className="iv-title">ادعُ مقدم خدمة من خارج المنصة</h1>
  <p className="iv-sub">
    معاك مهندس أو شركة بتتعامل معاهم؟ ادعوهم يشتغلوا معاك جوه محايد بعقد موثّق وحماية كاملة للحقوق — وفريقنا هيتواصل معاهم ويجهّز التعاقد.
  </p>
  <button
    type="button"
    onClick={() => router.push('/projects/invite/mine')}
    style={{ background: 'none', border: 'none', padding: 0, marginTop: 10, color: 'var(--green-dark)', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
  >
    متابعة دعواتك السابقة ←
  </button>
</div>

        <div className="iv-card">
          {error && <div className="iv-err">{error}</div>}

          <p className="iv-sec-t">بيانات مقدم الخدمة</p>

          <div className="iv-field">
            <label className="iv-label">الاسم</label>
            <input className="iv-input" value={inviteeName} onChange={(e) => setInviteeName(e.target.value)} placeholder="اسم المهندس أو الشركة" />
          </div>

          <div className="iv-field">
            <label className="iv-label">النوع (اختياري)</label>
            <select className="iv-select" value={inviteeType} onChange={(e) => setInviteeType(e.target.value)}>
              <option value="">اختار...</option>
              <option value="فرد">فرد / مهندس</option>
              <option value="شركة">شركة</option>
            </select>
          </div>

          <div className="iv-row">
            <div className="iv-field">
              <label className="iv-label">الإيميل</label>
              <input className="iv-input" type="email" value={inviteeEmail} onChange={(e) => setInviteeEmail(e.target.value)} placeholder="example@mail.com" />
            </div>
            <div className="iv-field">
              <label className="iv-label">التليفون</label>
              <input className="iv-input" value={inviteePhone} onChange={(e) => setInviteePhone(e.target.value)} placeholder="01xxxxxxxxx" />
            </div>
          </div>
          <p className="iv-hint">لازم تدخل إيميل أو رقم تليفون على الأقل.</p>

          <p className="iv-sec-t mt">تفاصيل المشروع</p>

          <div className="iv-field">
            <label className="iv-label">عنوان المشروع</label>
            <input className="iv-input" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="مثال: تنفيذ تشطيب شقة" />
          </div>

          <div className="iv-field">
            <label className="iv-label">المجال (اختياري)</label>
            <input className="iv-input" value={field} onChange={(e) => setField(e.target.value)} placeholder="مثال: مقاولات، برمجة، تصميم..." />
          </div>

          <div className="iv-field">
            <label className="iv-label">وصف المشروع</label>
            <textarea className="iv-area" value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="اشرح المطلوب من مقدم الخدمة والتفاصيل المهمة." />
          </div>

          <div className="iv-row">
            <div className="iv-field">
              <label className="iv-label">الميزانية من (اختياري)</label>
              <input className="iv-input" type="number" inputMode="numeric" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="ج.م" />
            </div>
            <div className="iv-field">
              <label className="iv-label">الميزانية إلى (اختياري)</label>
              <input className="iv-input" type="number" inputMode="numeric" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="ج.م" />
            </div>
          </div>

          <div className="iv-field">
            <label className="iv-label">المدة المتوقعة بالأيام (اختياري)</label>
            <input className="iv-input" type="number" inputMode="numeric" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder="مثال: 45" />
          </div>

          <div className="iv-field">
            <label className="iv-label">رسالة لمقدم الخدمة (اختياري)</label>
            <textarea className="iv-area" style={{ minHeight: 80 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="أي كلام حابب يوصل معاه الدعوة." />
          </div>

          <button className="iv-btn" onClick={submit} disabled={submitting}>
            {submitting ? 'جاري الإرسال...' : 'ابعت الدعوة'}
          </button>
        </div>
      </div>
    </>
  );
}
