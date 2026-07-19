'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Settings = {
  businessName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  defaultCurrency?: string | null;
  defaultTaxRate?: number | string | null;
  defaultPaymentTerms?: string | null;
  invoiceFooter?: string | null;
};

const EMPTY = {
  businessName: '',
  logoUrl: '',
  address: '',
  taxNumber: '',
  phone: '',
  email: '',
  website: '',
  defaultCurrency: 'EGP',
  defaultTaxRate: '0',
  defaultPaymentTerms: '',
  invoiceFooter: '',
};

export default function ProviderSettingsPage() {
  const [form, setForm] = useState({ ...EMPTY });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [logoErr, setLogoErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api<Settings>('/business-settings')
      .then((d) => {
        setForm({
          businessName: d.businessName || '',
          logoUrl: d.logoUrl || '',
          address: d.address || '',
          taxNumber: d.taxNumber || '',
          phone: d.phone || '',
          email: d.email || '',
          website: d.website || '',
          defaultCurrency: d.defaultCurrency || 'EGP',
          defaultTaxRate: d.defaultTaxRate != null ? String(d.defaultTaxRate) : '0',
          defaultPaymentTerms: d.defaultPaymentTerms || '',
          invoiceFooter: d.invoiceFooter || '',
        });
      })
      .catch((e: any) => setError(e?.message || 'تعذّر تحميل الإعدادات'))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: string) => {
    setForm((f: any) => ({ ...f, [k]: v }));
    setOk(false);
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoErr('');
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setLogoErr('لازم الملف يكون صورة');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoErr('حجم الصورة أكبر من ٢ ميجا، اختار صورة أصغر');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('logoUrl', String(reader.result || ''));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    set('logoUrl', '');
    if (fileRef.current) fileRef.current.value = '';
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setOk(false);
    const body = {
      businessName: form.businessName.trim() || undefined,
      logoUrl: form.logoUrl || undefined,
      address: form.address.trim() || undefined,
      taxNumber: form.taxNumber.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      website: form.website.trim() || undefined,
      defaultCurrency: form.defaultCurrency.trim() || 'EGP',
      defaultTaxRate: Number(form.defaultTaxRate) || 0,
      defaultPaymentTerms: form.defaultPaymentTerms.trim() || undefined,
      invoiceFooter: form.invoiceFooter.trim() || undefined,
    };
    try {
await api('/business-settings', { method: 'PATCH', body });
      setOk(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProviderShell active="settings" title="إعدادات النشاط">
      <style>{BS_CSS}</style>
      <div className="bs-wrap">
        {loading ? (
          <div className="bs-state">جاري التحميل...</div>
        ) : (
          <>
            <p className="bs-intro">
              البيانات دي بتظهر على فواتيرك وبتتحط كقيم افتراضية أول ما تعمل فاتورة جديدة (العملة، الضريبة، شروط الدفع).
            </p>

            {ok && <div className="bs-ok"><Icon name="badgeCheck" size={16} /> تم حفظ الإعدادات بنجاح</div>}
            {error && <div className="bs-err">{error}</div>}

            {/* اللوجو */}
            <div className="bs-card">
              <h3 className="bs-h">شعار النشاط (اللوجو)</h3>
              <div className="bs-logo-row">
                <div className="bs-logo-box">
                  {form.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.logoUrl} alt="logo" />
                  ) : (
                    <div className="bs-logo-ph"><Icon name="building" size={26} /></div>
                  )}
                </div>
                <div className="bs-logo-actions">
                  <input ref={fileRef} type="file" accept="image/*" onChange={onLogo} hidden />
                  <button type="button" className="bs-upload" onClick={() => fileRef.current?.click()}>
                    <Icon name="link" size={15} /> {form.logoUrl ? 'تغيير الشعار' : 'رفع شعار'}
                  </button>
                  {form.logoUrl && (
                    <button type="button" className="bs-remove" onClick={removeLogo}>حذف</button>
                  )}
                  <span className="bs-hint">PNG أو JPG، أقل من ٢ ميجا</span>
                  {logoErr && <span className="bs-logo-err">{logoErr}</span>}
                </div>
              </div>
            </div>

            {/* بيانات النشاط */}
            <div className="bs-card">
              <h3 className="bs-h">بيانات النشاط</h3>
              <div className="bs-row">
                <label className="bs-field">
                  <span>اسم النشاط / الشركة</span>
                  <input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="مثلاً: استوديو محايد للتصميم" />
                </label>
                <label className="bs-field">
                  <span>الرقم الضريبي</span>
                  <input value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} placeholder="اختياري" />
                </label>
              </div>
              <div className="bs-row">
                <label className="bs-field">
                  <span>رقم الهاتف</span>
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="اختياري" inputMode="tel" />
                </label>
                <label className="bs-field">
                  <span>البريد الإلكتروني</span>
                  <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="اختياري" inputMode="email" />
                </label>
              </div>
              <label className="bs-field">
                <span>الموقع الإلكتروني</span>
                <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="اختياري" />
              </label>
              <label className="bs-field">
                <span>العنوان</span>
                <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} placeholder="عنوان النشاط (يظهر على الفاتورة)" />
              </label>
            </div>

            {/* افتراضيات الفوترة */}
            <div className="bs-card">
              <h3 className="bs-h">افتراضيات الفوترة</h3>
              <div className="bs-row">
                <label className="bs-field">
                  <span>العملة الافتراضية</span>
                  <input value={form.defaultCurrency} onChange={(e) => set('defaultCurrency', e.target.value)} placeholder="EGP" />
                </label>
                <label className="bs-field">
                  <span>نسبة الضريبة الافتراضية (%)</span>
                  <input value={form.defaultTaxRate} onChange={(e) => set('defaultTaxRate', e.target.value)} inputMode="numeric" placeholder="0" />
                </label>
              </div>
              <label className="bs-field">
                <span>شروط الدفع الافتراضية</span>
                <textarea value={form.defaultPaymentTerms} onChange={(e) => set('defaultPaymentTerms', e.target.value)} rows={2} placeholder="مثلاً: الدفع خلال ١٤ يوم من تاريخ الفاتورة" />
              </label>
              <label className="bs-field">
                <span>فوتر الفاتورة</span>
                <textarea value={form.invoiceFooter} onChange={(e) => set('invoiceFooter', e.target.value)} rows={2} placeholder="نص يظهر أسفل كل فاتورة (شكر، بيانات تحويل... إلخ)" />
              </label>
            </div>

            <div className="bs-actions">
              <button className="bs-save" onClick={save} disabled={saving}>
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </>
        )}
      </div>
    </ProviderShell>
  );
}

const BS_CSS = `
.bs-wrap{max-width:760px;margin:0 auto;}
.bs-state{padding:50px;text-align:center;color:var(--muted);}
.bs-intro{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.bs-ok{display:flex;align-items:center;gap:8px;background:#e3f4ec;color:#1c7a4f;font-weight:800;font-size:13.5px;padding:12px 16px;border-radius:12px;margin-bottom:16px;}
.bs-err{background:#fdf5f4;color:#b42318;font-weight:700;font-size:13.5px;padding:12px 16px;border-radius:12px;margin-bottom:16px;}
.bs-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px 24px;margin-bottom:18px;}
.bs-h{font-size:15.5px;font-weight:900;color:var(--ink);margin:0 0 16px;}
.bs-logo-row{display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
.bs-logo-box{width:96px;height:96px;border-radius:16px;border:1px solid var(--line);background:var(--background);overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.bs-logo-box img{width:100%;height:100%;object-fit:contain;}
.bs-logo-ph{color:var(--muted);}
.bs-logo-actions{display:flex;flex-direction:column;align-items:flex-start;gap:8px;}
.bs-upload{display:inline-flex;align-items:center;gap:6px;background:var(--green);color:#fff;border:none;border-radius:10px;padding:10px 16px;font-family:inherit;font-size:13.5px;font-weight:800;cursor:pointer;}
.bs-upload:hover{background:var(--green-dark);}
.bs-remove{background:none;border:none;color:#b42318;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;padding:0;}
.bs-hint{font-size:12px;color:var(--muted);}
.bs-logo-err{font-size:12.5px;color:#b42318;font-weight:700;}
.bs-row{display:flex;gap:14px;}
.bs-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;flex:1;}
.bs-field span{font-size:13px;font-weight:700;color:var(--ink);}
.bs-field input,.bs-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.bs-field input:focus,.bs-field textarea:focus{border-color:var(--green-light);}
.bs-field textarea{resize:vertical;}
.bs-actions{display:flex;justify-content:flex-start;position:sticky;bottom:0;padding:8px 0;}
.bs-save{background:var(--green);color:#fff;border:none;border-radius:12px;padding:13px 40px;font-family:inherit;font-size:15px;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(40,125,115,.25);}
.bs-save:hover{background:var(--green-dark);}
.bs-save:disabled{opacity:.6;cursor:default;}
@media(max-width:600px){.bs-row{flex-direction:column;gap:0;}.bs-save{width:100%;}}
`;
