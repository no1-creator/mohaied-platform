'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';

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
  { value: 'CLIENT', label: 'عميل — عايز أنفّذ مشروع' },
  { value: 'PROVIDER', label: 'مقدم خدمة / فريلانسر' },
  { value: 'SUPERVISOR', label: 'مشرف متخصص' },
  { value: 'LEGAL_CONSULTANT', label: 'مستشار قانوني' },
  { value: 'INVESTOR', label: 'مستثمر — أبحث عن فرص للتمويل' },
];

export default function RegisterPage() {
  const router = useRouter();
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
        <h2>ابدأ أول مشروع موثّق على محايد</h2>
        <p>
          سجّل مجانًا وابدأ رحلتك سواء كنت عميل أو مقدم خدمة — كل خطوة موثّقة
          وحقوقك محفوظة.
        </p>
        <ul className="auth-points">
          <li>تسجيل مجاني بالكامل</li>
          <li>بيئة عمل موثّقة وآمنة</li>
          <li>تحت إشراف الحكومة المصرية</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box">
          <div className="auth-head">
            <span className="logo-mark">{LOGO}</span>
            <h1 className="auth-title">إنشاء حساب</h1>
            <p className="auth-sub">ابدأ رحلتك على محايد</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>الاسم بالكامل</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="اكتب اسمك"
                required
              />
            </div>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div className="field">
              <label>كلمة المرور</label>
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
              <label>نوع الحساب</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="auth-switch">
            عندك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
