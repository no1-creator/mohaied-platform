'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import LangSwitch from '@/components/LangSwitch';

const LOGO = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z"
      fill="white"
      fillOpacity="0.2"
      stroke="white"
      strokeWidth="1.4"
    />
    <path
      d="M11.5 16l3 3 6-6.5"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ROLES = [
  { value: 'CLIENT', label: 'auth.role.CLIENT' },
  { value: 'PROVIDER', label: 'auth.role.PROVIDER' },
  { value: 'SUPERVISOR', label: 'auth.role.SUPERVISOR' },
  { value: 'LEGAL_CONSULTANT', label: 'auth.role.LEGAL_CONSULTANT' },
  { value: 'INVESTOR', label: 'auth.role.INVESTOR' },
  { value: 'EMPLOYER', label: 'auth.role.EMPLOYER' },
  { value: 'EMPLOYEE', label: 'auth.role.EMPLOYEE' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        auth: false,
        body: { fullName, email, password, role },
      });
      saveToken(res.accessToken);
      if (role === 'ADMIN') router.push('/admin');
      else if (role === 'PROVIDER') router.push('/provider');
      else if (role === 'SUPERVISOR') router.push('/supervisor');
      else if (role === 'LEGAL_CONSULTANT') router.push('/legal/setup');
      else if (role === 'INVESTOR') router.push('/invest');
      else if (role === 'EMPLOYER') router.push('/employer');
      else if (role === 'EMPLOYEE') router.push('/jobs');
      else if (role === 'CLIENT') router.push('/client');
      else router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <span className="logo-mark">{LOGO}</span>
          محايد
        </div>
        <h2>{tr('auth.register.brand.h', 'ابدأ أول مشروع موثّق على محايد')}</h2>
        <p>
          {tr('auth.register.brand.p', 'سجّل مجانًا وابدأ رحلتك سواء كنت عميل أو مقدم خدمة — كل خطوة موثّقة وحقوقك محفوظة.')}
        </p>
        <ul className="auth-points">
          <li>{tr('auth.register.point1', 'تسجيل مجاني بالكامل')}</li>
          <li>{tr('auth.register.point2', 'بيئة عمل موثّقة وآمنة')}</li>
          <li>{tr('auth.point.gov', 'تحت إشراف الحكومة المصرية')}</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <LangSwitch />
          </div>
          <div className="auth-head">
            <span className="logo-mark">{LOGO}</span>
            <h1 className="auth-title">{tr('common.register', 'إنشاء حساب')}</h1>
            <p className="auth-sub">{tr('auth.register.sub', 'ابدأ رحلتك على محايد')}</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>{tr('auth.field.fullName', 'الاسم بالكامل')}</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={tr('auth.field.fullName.ph', 'اكتب اسمك')}
                required
              />
            </div>
            <div className="field">
              <label>{tr('auth.field.email', 'البريد الإلكتروني')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label>{tr('auth.field.password', 'كلمة المرور')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
            <div className="field">
              <label>{tr('auth.field.accountType', 'نوع الحساب')}</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {tr(r.label)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? tr('auth.register.loading', 'جاري الإنشاء...') : tr('auth.register.submit', 'إنشاء الحساب')}
            </button>
          </form>

          <div className="auth-switch">
            {tr('auth.register.switch', 'عندك حساب بالفعل؟')} <Link href="/login">{tr('common.login', 'تسجيل الدخول')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
