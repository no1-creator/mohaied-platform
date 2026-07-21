'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';

type Me = {
  role: string;
  legalConsultantProfile?: unknown | null;
};

export default function LegalSetupPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [field, setField] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [consultationRate, setConsultationRate] = useState('');
  const [bio, setBio] = useState('');
  const [education, setEducation] = useState('');
  const [certifications, setCertifications] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [languages, setLanguages] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [barAssociationNo, setBarAssociationNo] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((me) => {
        if (me.role !== 'LEGAL_CONSULTANT') {
          router.push('/dashboard');
          return;
        }
        if (me.legalConsultantProfile) {
          router.push('/dashboard');
          return;
        }
        setReady(true);
      })
      .catch((err) => setError(err.message));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        field: field.trim(),
        yearsExp: parseInt(yearsExp || '0', 10),
        consultationRate: Number(consultationRate) || 0,
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
      addStr('barAssociationNo', barAssociationNo);
      await api('/users/legal-profile', { method: 'POST', body });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (!ready) {
    return (
      <div className="lg-boot">
        <style>{LG_CSS}</style>
        {error ? error : 'جاري التحميل...'}
      </div>
    );
  }

  return (
    <div className="lg-wrap">
      <style>{LG_CSS}</style>
      <div className="lg-head">
        <span className="lg-badge">⚖️ خطوة أخيرة لتفعيل حسابك</span>
        <h1 className="lg-title">ملف المستشار القانوني</h1>
        <p className="lg-sub">
          وضّح خبرتك ومجال تخصصك القانوني بدقة — بياناتك بتظهر في دليل المستشارين
          على محايد وبتزوّد ثقة العملاء فيك.
        </p>
      </div>

      <form className="lg-card" onSubmit={submit}>
        {error && <div className="lg-error">{error}</div>}

        <div className="lg-section-title">المعلومات الأساسية</div>
        <div className="lg-field">
          <label className="lg-label">
            المسمى / الصفة <span className="lg-req">*</span>
          </label>
          <input
            className="lg-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="مثال: محامٍ بالنقض، مستشار ملكية فكرية"
            required
          />
        </div>
        <div className="lg-field">
          <label className="lg-label">
            مجال التخصص <span className="lg-req">*</span>
          </label>
          <input
            className="lg-input"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="مثال: عقود، تأسيس شركات، ملكية فكرية، قضايا الأجانب"
            required
          />
        </div>
        <div className="lg-row">
          <div className="lg-field">
            <label className="lg-label">سنين الخبرة</label>
            <input
              className="lg-input"
              type="number"
              value={yearsExp}
              onChange={(e) => setYearsExp(e.target.value)}
              placeholder="0"
            />
          </div>
          <div className="lg-field">
            <label className="lg-label">أجر الاستشارة (ج.م)</label>
            <input
              className="lg-input"
              type="number"
              value={consultationRate}
              onChange={(e) => setConsultationRate(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="lg-section-title">المؤهلات والخبرات</div>
        <div className="lg-field">
          <label className="lg-label">المؤهل العلمي</label>
          <input
            className="lg-input"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="مثال: ليسانس حقوق - جامعة القاهرة"
          />
        </div>
        <div className="lg-field">
          <label className="lg-label">الشهادات والعضويات المهنية</label>
          <input
            className="lg-input"
            value={certifications}
            onChange={(e) => setCertifications(e.target.value)}
            placeholder="مثال: عضو نقابة المحامين، ماجستير قانون تجاري"
          />
        </div>
        <div className="lg-row">
          <div className="lg-field">
            <label className="lg-label">التخصصات الفرعية</label>
            <input
              className="lg-input"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              placeholder="افصل بينها بفاصلة"
            />
          </div>
          <div className="lg-field">
            <label className="lg-label">اللغات</label>
            <input
              className="lg-input"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              placeholder="مثال: العربية، الإنجليزية"
            />
          </div>
        </div>
        <div className="lg-field">
          <label className="lg-label">نبذة تعريفية</label>
          <textarea
            className="lg-textarea"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="نبذة عن خبرتك القانونية وأهم القضايا اللي اشتغلت عليها"
          />
        </div>

        <div className="lg-section-title">التواصل والتوثيق</div>
        <div className="lg-row">
          <div className="lg-field">
            <label className="lg-label">المحافظة / المدينة</label>
            <input
              className="lg-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="مثال: القاهرة"
            />
          </div>
          <div className="lg-field">
            <label className="lg-label">رقم الموبايل</label>
            <input
              className="lg-input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01xxxxxxxxx"
            />
          </div>
        </div>
        <div className="lg-row">
          <div className="lg-field">
            <label className="lg-label">لينكدإن / الموقع</label>
            <input
              className="lg-input"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="lg-field">
            <label className="lg-label">رقم القيد بالنقابة</label>
            <input
              className="lg-input"
              value={barAssociationNo}
              onChange={(e) => setBarAssociationNo(e.target.value)}
              placeholder="رقم القيد بنقابة المحامين"
            />
          </div>
        </div>

        <button className="lg-submit" type="submit" disabled={saving}>
          {saving ? 'جاري الحفظ...' : 'حفظ وتفعيل الحساب'}
        </button>
      </form>
    </div>
  );
}

const LG_CSS = `
.lg-boot{min-height:100vh;display:flex;align-items:center;justify-content:center;color:#70807b;background:#f7faf8;font-family:'Noto Sans Arabic',sans-serif;}
.lg-wrap{max-width:760px;margin:0 auto;padding:32px 20px 80px;direction:rtl;font-family:'Noto Sans Arabic',sans-serif;}
.lg-head{text-align:center;margin-bottom:28px;}
.lg-badge{display:inline-flex;align-items:center;gap:6px;background:var(--mint);color:var(--green-dark);border:1px solid var(--line);padding:6px 14px;border-radius:999px;font-size:13px;font-weight:700;margin-bottom:14px;}
.lg-title{font-size:27px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.lg-sub{color:var(--muted);font-size:15px;margin:0 auto;max-width:520px;line-height:1.7;}
.lg-card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:30px;box-shadow:0 6px 28px rgba(23,33,31,.05);}
.lg-section-title{font-size:14px;font-weight:800;color:var(--green-dark);margin:24px 0 16px;display:flex;align-items:center;gap:9px;}
.lg-section-title:first-child{margin-top:0;}
.lg-section-title::before{content:'';width:4px;height:17px;background:var(--green);border-radius:2px;display:inline-block;}
.lg-field{margin-bottom:16px;}
.lg-label{display:block;font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.lg-req{color:#dc2626;margin-inline-start:3px;}
.lg-input,.lg-textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:15px;color:var(--ink);background:#fff;box-sizing:border-box;}
.lg-input:focus,.lg-textarea:focus{outline:none;border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.lg-textarea{min-height:100px;resize:vertical;}
.lg-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.lg-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:12px;padding:12px 14px;font-size:14px;margin-bottom:18px;}
.lg-submit{width:100%;background:var(--green);color:#fff;border:none;border-radius:12px;padding:15px;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit;margin-top:10px;}
.lg-submit:hover{background:var(--green-dark);}
.lg-submit:disabled{opacity:.6;cursor:not-allowed;}
@media(max-width:640px){.lg-row{grid-template-columns:1fr;}.lg-card{padding:22px;}}
`;
