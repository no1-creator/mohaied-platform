'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';

const ROLES = [
  { value: 'CLIENT', label: 'عميل — عايز أنفّذ مشروع' },
  { value: 'PROVIDER', label: 'مقدم خدمة / فريلانسر' },
  { value: 'SUPERVISOR', label: 'مشرف متخصص' },
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
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <div className="logo-mark">◇</div>
          <span>محايد</span>
        </div>
        <h2>ابدأ أول مشروع موثق على محايد</h2>
        <p>
          سجّل مجانًا وابدأ رحلتك سواء كنت عميل أو مقدم خدمة — كل خطوة موثقة
          وحقوقك محفوظة.
        </p>
        <ul className="auth-points">
          <li>تسجيل مجاني بالكامل</li>
          <li>بيئة عمل موثقة وآمنة</li>
          <li>دعم ومتابعة مستمرة</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box">
          <div className="auth-head">
            <Link href="/" className="logo-mark">
              ◇
            </Link>
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
                required
              />
            </div>
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <p className="auth-switch">
            عندك حساب بالفعل؟ <Link href="/login">تسجيل الدخول</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
