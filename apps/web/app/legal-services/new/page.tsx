'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import { useI18n } from '@/lib/i18n';

const CATEGORIES = [
  { value: 'IP_PROTECTION', labelKey: 'lsv.cat.IP_PROTECTION' },
  { value: 'COMPANY_FORMATION', labelKey: 'lsv.cat.COMPANY_FORMATION' },
  { value: 'FOREIGNER_CASE', labelKey: 'lsv.cat.FOREIGNER_CASE' },
  { value: 'GENERAL_CONSULT', labelKey: 'lsv.cat.GENERAL_CONSULT' },
  { value: 'OTHER', labelKey: 'lsv.cat.OTHER' },
];

const LF_CSS = `
.lf-wrap{max-width:640px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.lf-head{margin-bottom:22px;}
.lf-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.lf-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.lf-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.lf-field{margin-bottom:18px;}
.lf-label{display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.lf-input,.lf-select,.lf-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;outline:none;box-sizing:border-box;}
.lf-input:focus,.lf-select:focus,.lf-area:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.lf-area{min-height:130px;resize:vertical;line-height:1.8;}
.lf-row{display:flex;gap:12px;}
.lf-row .lf-field{flex:1;}
.lf-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:16px;line-height:1.7;}
.lf-btn{width:100%;padding:13px;border-radius:13px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;transition:background .15s;margin-top:6px;}
.lf-btn:hover{background:var(--green-dark);}
.lf-btn:disabled{opacity:.6;cursor:default;}
@media(max-width:520px){.lf-row{flex-direction:column;gap:0;}.lf-title{font-size:21px;}}
`;

export default function NewLegalRequestPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [category, setCategory] = useState('IP_PROTECTION');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [entityName, setEntityName] = useState('');
  const [nationality, setNationality] = useState('');
  const [budget, setBudget] = useState('');
  const [preferredContact, setPreferredContact] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    // نقرا نوع الخدمة من الرابط بأمان (من غير useSearchParams عشان الـ build)
    const params = new URLSearchParams(window.location.search);
    const c = params.get('category');
    if (c && CATEGORIES.some((x) => x.value === c)) setCategory(c);
  }, [router]);

  async function submit() {
    setError('');
    if (title.trim().length < 3)
      return setError(tr('lfn.errTitle', 'اكتب عنوان واضح للطلب (3 حروف على الأقل).'));
    if (description.trim().length < 10)
      return setError(tr('lfn.errDesc', 'اكتب تفاصيل كافية عن طلبك (10 حروف على الأقل).'));

    const body: Record<string, unknown> = {
      category,
      title: title.trim(),
      description: description.trim(),
    };
    if (entityName.trim()) body.entityName = entityName.trim();
    if (nationality.trim()) body.nationality = nationality.trim();
    if (budget) body.budget = Number(budget);
    if (preferredContact.trim()) body.preferredContact = preferredContact.trim();

    setSubmitting(true);
    try {
      await api('/legal/requests', { method: 'POST', body });
      router.push('/legal-services');
    } catch (err: any) {
      setError(err?.message || tr('lfn.errSubmit', 'حصل خطأ أثناء إرسال الطلب. حاول تاني.'));
      setSubmitting(false);
    }
  }

  return (
    <>
      <style>{LF_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="lf-wrap">
        <div className="lf-head">
          <h1 className="lf-title">{tr('lfn.title', 'تقديم طلب قانوني')}</h1>
          <p className="lf-sub">
            {tr('lfn.sub', 'املأ البيانات، وفريق محايد القانوني هيراجع طلبك ويوزّعه على المستشار المناسب في أسرع وقت.')}
          </p>
        </div>

        <div className="lf-card">
          {error && <div className="lf-err">{error}</div>}

          <div className="lf-field">
            <label className="lf-label">{tr('lfn.serviceType', 'نوع الخدمة')}</label>
            <select
              className="lf-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {tr(c.labelKey)}
                </option>
              ))}
            </select>
          </div>

          <div className="lf-field">
            <label className="lf-label">{tr('lfn.reqTitle', 'عنوان الطلب')}</label>
            <input
              className="lf-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tr('lfn.reqTitlePh', 'مثال: تسجيل علامة تجارية لتطبيق')}
            />
          </div>

          {category === 'COMPANY_FORMATION' && (
            <div className="lf-field">
              <label className="lf-label">{tr('lfn.entityName', 'اسم الشركة / الكيان المقترح')}</label>
              <input
                className="lf-input"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder={tr('lfn.entityNamePh', 'مثال: محايد للتكنولوجيا')}
              />
            </div>
          )}

          {category === 'FOREIGNER_CASE' && (
            <div className="lf-field">
              <label className="lf-label">{tr('lfn.nationality', 'الجنسية')}</label>
              <input
                className="lf-input"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder={tr('lfn.nationalityPh', 'مثال: سعودي')}
              />
            </div>
          )}

          <div className="lf-field">
            <label className="lf-label">{tr('lfn.details', 'تفاصيل الطلب')}</label>
            <textarea
              className="lf-area"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tr('lfn.detailsPh', 'اشرح طلبك بالتفصيل: المطلوب، وأي معلومات تساعد المستشار يفهم حالتك.')}
            />
          </div>

          <div className="lf-row">
            <div className="lf-field">
              <label className="lf-label">{tr('lfn.budget', 'الميزانية التقديرية (اختياري)')}</label>
              <input
                className="lf-input"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={tr('common.currency', 'ج.م')}
              />
            </div>
            <div className="lf-field">
              <label className="lf-label">{tr('lfn.contact', 'وسيلة تواصل مفضّلة (اختياري)')}</label>
              <input
                className="lf-input"
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                placeholder={tr('lfn.contactPh', 'رقم موبايل / واتساب / إيميل')}
              />
            </div>
          </div>

          <button className="lf-btn" onClick={submit} disabled={submitting}>
            {submitting ? tr('ivp.sending', 'جاري الإرسال...') : tr('lfn.submit', 'ابعت الطلب لفريق محايد')}
          </button>
        </div>
      </div>
    </>
  );
}
