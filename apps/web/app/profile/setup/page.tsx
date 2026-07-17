'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Me = {
  role: string;
  fullName: string;
  providerProfile?: unknown | null;
  supervisorProfile?: unknown | null;
};

const PS_CSS = `
.ps-wrap { max-width: 680px; margin: 0 auto; padding: 32px 20px 72px; }
.ps-head { text-align: center; margin-bottom: 28px; }
.ps-badge { display:inline-flex; align-items:center; gap:6px; background:var(--mint); color:var(--green-dark); border:1px solid var(--line); padding:6px 14px; border-radius:999px; font-size:13px; font-weight:700; margin-bottom:14px; }
.ps-title { font-size:26px; font-weight:800; color:var(--ink); margin:0 0 8px; }
.ps-sub { color:var(--muted); font-size:15px; margin:0; line-height:1.7; }
.ps-card { background:#fff; border:1px solid var(--line); border-radius:18px; padding:28px; box-shadow:0 6px 24px rgba(23,33,31,.05); }
.ps-field { margin-bottom:18px; }
.ps-label { display:block; font-size:14px; font-weight:700; color:var(--ink); margin-bottom:8px; }
.ps-hint { font-size:12.5px; color:var(--muted); margin-top:6px; }
.ps-input, .ps-textarea, .ps-select { width:100%; border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-family:inherit; font-size:15px; color:var(--ink); background:#fff; box-sizing:border-box; transition:border-color .15s, box-shadow .15s; }
.ps-input:focus, .ps-textarea:focus, .ps-select:focus { outline:none; border-color:var(--green-light); box-shadow:0 0 0 3px rgba(79,162,148,.15); }
.ps-textarea { min-height:110px; resize:vertical; }
.ps-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.ps-types { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:4px; }
.ps-type { border:1.5px solid var(--line); border-radius:14px; padding:16px; cursor:pointer; text-align:center; background:#fff; transition:all .15s; }
.ps-type:hover { border-color:var(--green-light); }
.ps-type.active { border-color:var(--green); background:var(--mint); }
.ps-type-icon { font-size:26px; margin-bottom:6px; }
.ps-type-name { font-weight:700; color:var(--ink); font-size:15px; }
.ps-type-desc { font-size:12.5px; color:var(--muted); margin-top:3px; }
.ps-submit { width:100%; background:var(--green); color:#fff; border:none; border-radius:12px; padding:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:inherit; margin-top:8px; transition:background .15s; }
.ps-submit:hover { background:var(--green-dark); }
.ps-submit:disabled { opacity:.6; cursor:not-allowed; }
.ps-error { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; border-radius:12px; padding:12px 14px; font-size:14px; margin-bottom:18px; }
.ps-loading { text-align:center; color:var(--muted); padding:64px 20px; }
@media (max-width:640px){ .ps-row, .ps-types { grid-template-columns:1fr; } }
`;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'provider' | 'supervisor'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // مقدم الخدمة
  const [ptype, setPtype] = useState<'FREELANCER' | 'COMPANY'>('FREELANCER');
  const [companyName, setCompanyName] = useState('');
  const [pfield, setPfield] = useState('');
  const [bio, setBio] = useState('');

  // المشرف
  const [title, setTitle] = useState('');
  const [sfield, setSfield] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [ratePerReview, setRatePerReview] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((me) => {
        if (me.role === 'PROVIDER') {
          if (me.providerProfile) {
            router.push('/dashboard');
            return;
          }
          setState('provider');
        } else if (me.role === 'SUPERVISOR') {
          if (me.supervisorProfile) {
            router.push('/dashboard');
            return;
          }
          setState('supervisor');
        } else {
          // العميل والأدمن مش محتاجين بروفايل إضافي
          router.push('/dashboard');
        }
      })
      .catch((err) => setError(err.message));
  }, [router]);

  async function submitProvider(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = { type: ptype, field: pfield };
      if (ptype === 'COMPANY' && companyName.trim()) body.companyName = companyName.trim();
      if (bio.trim()) body.bio = bio.trim();
      await api('/users/provider-profile', { method: 'POST', body });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  async function submitSupervisor(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api('/users/supervisor-profile', {
        method: 'POST',
        body: {
          title,
          field: sfield,
          yearsExp: parseInt(yearsExp || '0', 10),
          ratePerReview: Number(ratePerReview) || 0,
        },
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (state === 'loading') {
    return (
      <>
        <style>{PS_CSS}</style>
        <TopBar />
        <div className="ps-loading">جاري التحميل...</div>
      </>
    );
  }

  return (
    <>
      <style>{PS_CSS}</style>
      <TopBar />
      <div className="ps-wrap">
        <div className="ps-head">
          <span className="ps-badge">🛡️ خطوة أخيرة</span>
          <h1 className="ps-title">
            {state === 'provider' ? 'اكمل بيانات مقدم الخدمة' : 'اكمل بيانات المشرف'}
          </h1>
          <p className="ps-sub">
            {state === 'provider'
              ? 'البيانات دي بتظهر للعملاء وبتوثّق حسابك على محايد.'
              : 'وضّح تخصصك وخبرتك عشان العملاء يقدروا يكلّفوك بالإشراف.'}
          </p>
        </div>

        <div className="ps-card">
          {error && <div className="ps-error">{error}</div>}

          {state === 'provider' && (
            <form onSubmit={submitProvider}>
              <div className="ps-field">
                <label className="ps-label">نوع الحساب</label>
                <div className="ps-types">
                  <div
                    className={`ps-type ${ptype === 'FREELANCER' ? 'active' : ''}`}
                    onClick={() => setPtype('FREELANCER')}
                  >
                    <div className="ps-type-icon">👤</div>
                    <div className="ps-type-name">فريلانسر</div>
                    <div className="ps-type-desc">بشتغل كفرد مستقل</div>
                  </div>
                  <div
                    className={`ps-type ${ptype === 'COMPANY' ? 'active' : ''}`}
                    onClick={() => setPtype('COMPANY')}
                  >
                    <div className="ps-type-icon">🏢</div>
                    <div className="ps-type-name">شركة</div>
                    <div className="ps-type-desc">كيان أو فريق عمل</div>
                  </div>
                </div>
              </div>

              {ptype === 'COMPANY' && (
                <div className="ps-field">
                  <label className="ps-label">اسم الشركة</label>
                  <input
                    className="ps-input"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="اسم الشركة أو الكيان"
                    required
                  />
                </div>
              )}

              <div className="ps-field">
                <label className="ps-label">المجال / التخصص</label>
                <input
                  className="ps-input"
                  value={pfield}
                  onChange={(e) => setPfield(e.target.value)}
                  placeholder="مثال: تطوير مواقع، تصميم جرافيك، مقاولات..."
                  required
                />
              </div>

              <div className="ps-field">
                <label className="ps-label">نبذة مختصرة (اختياري)</label>
                <textarea
                  className="ps-textarea"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="اكتب نبذة عن خبرتك وخدماتك"
                />
                <div className="ps-hint">النبذة بتساعد العملاء يثقوا فيك أكتر.</div>
              </div>

              <button type="submit" className="ps-submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
              </button>
            </form>
          )}

          {state === 'supervisor' && (
            <form onSubmit={submitSupervisor}>
              <div className="ps-field">
                <label className="ps-label">المسمى / الصفة</label>
                <input
                  className="ps-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مهندس استشاري، مراجع قانوني..."
                  required
                />
              </div>

              <div className="ps-field">
                <label className="ps-label">مجال الإشراف</label>
                <input
                  className="ps-input"
                  value={sfield}
                  onChange={(e) => setSfield(e.target.value)}
                  placeholder="مثال: مشاريع إنشائية، عقود برمجيات..."
                  required
                />
              </div>

              <div className="ps-row">
                <div className="ps-field">
                  <label className="ps-label">سنين الخبرة</label>
                  <input
                    className="ps-input"
                    type="number"
                    min={0}
                    value={yearsExp}
                    onChange={(e) => setYearsExp(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="ps-field">
                  <label className="ps-label">أجر المراجعة (ج.م)</label>
                  <input
                    className="ps-input"
                    type="number"
                    min={0}
                    value={ratePerReview}
                    onChange={(e) => setRatePerReview(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="ps-submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
