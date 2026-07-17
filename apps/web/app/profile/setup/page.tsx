'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';

type Me = {
  role: string;
  fullName: string;
  providerProfile?: unknown | null;
  supervisorProfile?: unknown | null;
};

const PS_CSS = `
.ps-wrap { max-width: 760px; margin: 0 auto; padding: 32px 20px 80px; }
.ps-head { text-align: center; margin-bottom: 28px; }
.ps-badge { display:inline-flex; align-items:center; gap:6px; background:var(--mint); color:var(--green-dark); border:1px solid var(--line); padding:6px 14px; border-radius:999px; font-size:13px; font-weight:700; margin-bottom:14px; }
.ps-title { font-size:27px; font-weight:800; color:var(--ink); margin:0 0 8px; }
.ps-sub { color:var(--muted); font-size:15px; margin:0 auto; max-width:520px; line-height:1.7; }
.ps-card { background:#fff; border:1px solid var(--line); border-radius:20px; padding:30px; box-shadow:0 6px 28px rgba(23,33,31,.05); }
.ps-section { margin-bottom:26px; }
.ps-section + .ps-section { border-top:1px solid var(--line); padding-top:24px; }
.ps-section-title { font-size:14px; font-weight:800; color:var(--green-dark); margin:0 0 18px; display:flex; align-items:center; gap:9px; }
.ps-section-title::before { content:''; width:4px; height:17px; background:var(--green); border-radius:2px; display:inline-block; }
.ps-field { margin-bottom:16px; }
.ps-label { display:block; font-size:13.5px; font-weight:700; color:var(--ink); margin-bottom:7px; }
.ps-req { color:#dc2626; margin-inline-start:3px; }
.ps-hint { font-size:12px; color:var(--muted); margin-top:6px; line-height:1.6; }
.ps-input, .ps-textarea, .ps-select { width:100%; border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-family:inherit; font-size:15px; color:var(--ink); background:#fff; box-sizing:border-box; transition:border-color .15s, box-shadow .15s; }
.ps-input:focus, .ps-textarea:focus, .ps-select:focus { outline:none; border-color:var(--green-light); box-shadow:0 0 0 3px rgba(79,162,148,.15); }
.ps-textarea { min-height:100px; resize:vertical; }
.ps-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.ps-types { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.ps-type { border:1.5px solid var(--line); border-radius:14px; padding:18px; cursor:pointer; text-align:center; background:#fff; transition:all .15s; }
.ps-type:hover { border-color:var(--green-light); }
.ps-type.active { border-color:var(--green); background:var(--mint); }
.ps-type-icon { color:var(--green); margin-bottom:9px; display:flex; justify-content:center; }
.ps-type-name { font-weight:800; color:var(--ink); font-size:15px; }
.ps-type-desc { font-size:12px; color:var(--muted); margin-top:3px; }
.ps-note { background:var(--mint); border:1px solid var(--line); border-radius:12px; padding:12px 14px; font-size:12.5px; color:var(--green-dark); line-height:1.7; margin-bottom:22px; display:flex; align-items:flex-start; gap:9px; }
.ps-note-ic { flex-shrink:0; margin-top:1px; }
.ps-submit { width:100%; background:var(--green); color:#fff; border:none; border-radius:12px; padding:15px; font-size:16px; font-weight:800; cursor:pointer; font-family:inherit; margin-top:6px; transition:background .15s; }
.ps-submit:hover { background:var(--green-dark); }
.ps-submit:disabled { opacity:.6; cursor:not-allowed; }
.ps-error { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; border-radius:12px; padding:12px 14px; font-size:14px; margin-bottom:18px; }
.ps-loading { text-align:center; color:var(--muted); padding:64px 20px; }
@media (max-width:640px){ .ps-row, .ps-types { grid-template-columns:1fr; } .ps-card { padding:22px; } }
`;

export default function ProfileSetupPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'provider' | 'supervisor'>('loading');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // مشترك
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  // مقدم الخدمة
  const [ptype, setPtype] = useState<'FREELANCER' | 'COMPANY'>('FREELANCER');
  const [companyName, setCompanyName] = useState('');
  const [pfield, setPfield] = useState('');
  const [pYears, setPYears] = useState('');
  const [skills, setSkills] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [commercialRegNo, setCommercialRegNo] = useState('');
  const [taxId, setTaxId] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // المشرف
  const [title, setTitle] = useState('');
  const [sfield, setSfield] = useState('');
  const [sYears, setSYears] = useState('');
  const [ratePerReview, setRatePerReview] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [languages, setLanguages] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [membershipNo, setMembershipNo] = useState('');

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
      const body: Record<string, unknown> = { type: ptype, field: pfield.trim() };
      const addStr = (k: string, v: string) => {
        if (v && v.trim()) body[k] = v.trim();
      };
      const addNum = (k: string, v: string) => {
        if (v && v.trim()) body[k] = parseInt(v, 10);
      };
      addStr('bio', bio);
      addStr('skills', skills);
      addStr('city', city);
      addStr('phone', phone);
      addStr('website', website);
      addStr('portfolioUrl', portfolioUrl);
      addNum('yearsExp', pYears);
      if (ptype === 'COMPANY') {
        addStr('companyName', companyName);
        addNum('teamSize', teamSize);
        addStr('commercialRegNo', commercialRegNo);
        addStr('taxId', taxId);
      } else {
        addStr('nationalId', nationalId);
      }
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
      const body: Record<string, unknown> = {
        title: title.trim(),
        field: sfield.trim(),
        yearsExp: parseInt(sYears || '0', 10),
        ratePerReview: Number(ratePerReview) || 0,
      };
      const addStr = (k: string, v: string) => {
        if (v && v.trim()) body[k] = v.trim();
      };
      addStr('bio', bio);
      addStr('education', education);
      addStr('certifications', certifications);
      addStr('specialties', specialties);
      addStr('languages', languages);
      addStr('city', city);
      addStr('phone', phone);
      addStr('linkedinUrl', linkedinUrl);
      addStr('membershipNo', membershipNo);
      await api('/users/supervisor-profile', { method: 'POST', body });
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
          <span className="ps-badge">
            <Icon name="shield" size={14} /> خطوة أخيرة لتفعيل حسابك
          </span>
          <h1 className="ps-title">
            {state === 'provider' ? 'ملف مقدم الخدمة' : 'ملف المشرف المتخصص'}
          </h1>
          <p className="ps-sub">
            {state === 'provider'
              ? 'كل ما ملفك كان أوضح، ثقة العملاء فيك بتزيد وفرص شغلك بتكبر. البيانات دي بتظهر في ملفك العام على محايد.'
              : 'وضّح خبرتك ومؤهلاتك بدقة — المشرف المحايد هو ضمانة جودة المشروع، والعملاء بيختاروا الأكفأ.'}
          </p>
        </div>

        <div className="ps-card">
          {error && <div className="ps-error">{error}</div>}

          {/* ============ مقدم الخدمة ============ */}
          {state === 'provider' && (
            <form onSubmit={submitProvider}>
              <div className="ps-note">
                <Icon name="shield" size={16} className="ps-note-ic" />
                <span>
                  محايد منصة موثّقة تحت إشراف حكومي — بيانات التوثيق بتزوّد ثقة العملاء وبتفعّل شارة «موثّق» على ملفك.
                </span>
              </div>

              {/* نوع الحساب */}
              <div className="ps-section">
                <h3 className="ps-section-title">نوع الحساب</h3>
                <div className="ps-types">
                  <div
                    className={`ps-type ${ptype === 'FREELANCER' ? 'active' : ''}`}
                    onClick={() => setPtype('FREELANCER')}
                  >
                    <div className="ps-type-icon">
                      <Icon name="user" size={26} />
                    </div>
                    <div className="ps-type-name">فريلانسر</div>
                    <div className="ps-type-desc">بشتغل كفرد مستقل</div>
                  </div>
                  <div
                    className={`ps-type ${ptype === 'COMPANY' ? 'active' : ''}`}
                    onClick={() => setPtype('COMPANY')}
                  >
                    <div className="ps-type-icon">
                      <Icon name="building" size={26} />
                    </div>
                    <div className="ps-type-name">شركة</div>
                    <div className="ps-type-desc">كيان أو فريق عمل</div>
                  </div>
                </div>
              </div>

              {/* المعلومات المهنية */}
              <div className="ps-section">
                <h3 className="ps-section-title">المعلومات المهنية</h3>

                {ptype === 'COMPANY' && (
                  <div className="ps-row">
                    <div className="ps-field">
                      <label className="ps-label">اسم الشركة<span className="ps-req">*</span></label>
                      <input className="ps-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="اسم الشركة أو الكيان" required />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">حجم الفريق</label>
                      <input className="ps-input" type="number" min={1} value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="عدد أعضاء الفريق" />
                    </div>
                  </div>
                )}

                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">المجال / التخصص<span className="ps-req">*</span></label>
                    <input className="ps-input" value={pfield} onChange={(e) => setPfield(e.target.value)} placeholder="مثال: تطوير الويب، تصميم UI/UX..." required />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">سنين الخبرة</label>
                    <input className="ps-input" type="number" min={0} value={pYears} onChange={(e) => setPYears(e.target.value)} placeholder="0" />
                  </div>
                </div>

                <div className="ps-field">
                  <label className="ps-label">المهارات والخدمات</label>
                  <input className="ps-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="مثال: React, Node.js, تطبيقات موبايل" />
                  <div className="ps-hint">افصل بين المهارات بفاصلة.</div>
                </div>

                <div className="ps-field">
                  <label className="ps-label">نبذة تعريفية</label>
                  <textarea className="ps-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="اكتب نبذة احترافية عن خبرتك وأسلوب شغلك وأهم مشاريعك" />
                </div>
              </div>

              {/* التواصل والروابط */}
              <div className="ps-section">
                <h3 className="ps-section-title">التواصل والروابط</h3>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">المحافظة / المدينة</label>
                    <input className="ps-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: القاهرة" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">رقم الموبايل</label>
                    <input className="ps-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                  </div>
                </div>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">الموقع الإلكتروني</label>
                    <input className="ps-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">رابط أعمال سابقة (Portfolio)</label>
                    <input className="ps-input" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>

              {/* التوثيق */}
              <div className="ps-section">
                <h3 className="ps-section-title">بيانات التوثيق</h3>
                {ptype === 'COMPANY' ? (
                  <div className="ps-row">
                    <div className="ps-field">
                      <label className="ps-label">رقم السجل التجاري</label>
                      <input className="ps-input" value={commercialRegNo} onChange={(e) => setCommercialRegNo(e.target.value)} placeholder="رقم السجل التجاري" />
                    </div>
                    <div className="ps-field">
                      <label className="ps-label">البطاقة الضريبية</label>
                      <input className="ps-input" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="رقم التسجيل الضريبي" />
                    </div>
                  </div>
                ) : (
                  <div className="ps-field">
                    <label className="ps-label">الرقم القومي</label>
                    <input className="ps-input" value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="الرقم القومي (14 رقم)" />
                    <div className="ps-hint">بياناتك سرّية وبتُستخدم للتوثيق فقط.</div>
                  </div>
                )}
              </div>

              <button type="submit" className="ps-submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل الحساب'}
              </button>
            </form>
          )}

          {/* ============ المشرف ============ */}
          {state === 'supervisor' && (
            <form onSubmit={submitSupervisor}>
              <div className="ps-note">
                <Icon name="scale" size={16} className="ps-note-ic" />
                <span>
                  المشرف المحايد هو ضمانة الجودة والحياد في محايد — كل ما بياناتك كانت أدق، فرص تكليفك بتزيد.
                </span>
              </div>

              {/* المعلومات الأساسية */}
              <div className="ps-section">
                <h3 className="ps-section-title">المعلومات الأساسية</h3>
                <div className="ps-field">
                  <label className="ps-label">المسمى / الصفة<span className="ps-req">*</span></label>
                  <input className="ps-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مهندس برمجيات أول، مراجع جودة معتمد" required />
                </div>
                <div className="ps-field">
                  <label className="ps-label">مجال الإشراف<span className="ps-req">*</span></label>
                  <input className="ps-input" value={sfield} onChange={(e) => setSfield(e.target.value)} placeholder="مثال: مراجعة جودة البرمجيات، عقود المقاولات" required />
                </div>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">سنين الخبرة<span className="ps-req">*</span></label>
                    <input className="ps-input" type="number" min={0} value={sYears} onChange={(e) => setSYears(e.target.value)} placeholder="0" required />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">أجر المراجعة (ج.م)<span className="ps-req">*</span></label>
                    <input className="ps-input" type="number" min={0} value={ratePerReview} onChange={(e) => setRatePerReview(e.target.value)} placeholder="0" required />
                  </div>
                </div>
              </div>

              {/* المؤهلات */}
              <div className="ps-section">
                <h3 className="ps-section-title">المؤهلات والخبرات</h3>
                <div className="ps-field">
                  <label className="ps-label">المؤهل العلمي</label>
                  <input className="ps-input" value={education} onChange={(e) => setEducation(e.target.value)} placeholder="مثال: بكالوريوس هندسة حاسبات - جامعة القاهرة" />
                </div>
                <div className="ps-field">
                  <label className="ps-label">الشهادات والمؤهلات المهنية</label>
                  <textarea className="ps-textarea" value={certifications} onChange={(e) => setCertifications(e.target.value)} placeholder="مثال: PMP، AWS Certified، عضوية نقابة المهندسين" />
                </div>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">التخصصات الفرعية</label>
                    <input className="ps-input" value={specialties} onChange={(e) => setSpecialties(e.target.value)} placeholder="افصل بينها بفاصلة" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">اللغات</label>
                    <input className="ps-input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="مثال: العربية، الإنجليزية" />
                  </div>
                </div>
                <div className="ps-field">
                  <label className="ps-label">نبذة تعريفية</label>
                  <textarea className="ps-textarea" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="نبذة عن خبرتك في الإشراف والمراجعة" />
                </div>
              </div>

              {/* التواصل والتوثيق */}
              <div className="ps-section">
                <h3 className="ps-section-title">التواصل والتوثيق</h3>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">المحافظة / المدينة</label>
                    <input className="ps-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="مثال: الجيزة" />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">رقم الموبايل</label>
                    <input className="ps-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
                  </div>
                </div>
                <div className="ps-row">
                  <div className="ps-field">
                    <label className="ps-label">لينكدإن / الموقع</label>
                    <input className="ps-input" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                  </div>
                  <div className="ps-field">
                    <label className="ps-label">رقم العضوية / القيد بالنقابة</label>
                    <input className="ps-input" value={membershipNo} onChange={(e) => setMembershipNo(e.target.value)} placeholder="رقم العضوية المهنية" />
                  </div>
                </div>
              </div>

              <button type="submit" className="ps-submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل الحساب'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
