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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function doLogin(mail: string, pass: string) {
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email: mail, password: pass },
      });
      saveToken(res.accessToken);
try {
  const me = await api<{ role?: string }>('/users/me');
  const role = (me?.role || '').toUpperCase();
  if (role === 'ADMIN') router.push('/admin');
  else if (role === 'PROVIDER') router.push('/provider');
  else if (role === 'SUPERVISOR') router.push('/supervisor');
  else router.push('/dashboard');
} catch {
  router.push('/dashboard');
}
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doLogin(email, password);
  }

  function quick(mail: string) {
    setEmail(mail);
    setPassword('Test@1234');
    doLogin(mail, 'Test@1234');
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand">
        <div className="auth-brand-logo">
          <span className="logo-mark">{LOGO}</span>
          محايد
        </div>
        <h2>نفّذ مشروعك بثقة، وحقوقك محفوظة</h2>
        <p>
          منصة محايدة تربط العميل بالمهندس أو الشركة داخل بيئة موثّقة، مع اتفاق
          واضح ومتابعة للمراحل وحل عادل للنزاعات.
        </p>
        <ul className="auth-points">
          <li>اتفاق موثّق لكل مرحلة</li>
          <li>حماية حقوق كل الأطراف</li>
          <li>تحت إشراف الحكومة المصرية</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box">
          <div className="auth-head">
            <span className="logo-mark">{LOGO}</span>
            <h1 className="auth-title">تسجيل الدخول</h1>
            <p className="auth-sub">أهلًا بيك تاني في محايد</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
                required
              />
            </div>
            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </form>

          <div className="auth-switch">
            لسه معندكش حساب؟ <Link href="/register">إنشاء حساب</Link>
          </div>

          <div className="quick-login">
            <h4>حسابات تجريبية (اضغط للدخول السريع)</h4>
            <div className="quick-grid">
              <button onClick={() => quick('admin@mohaied.test')}>أدمن</button>
              <button onClick={() => quick('client@mohaied.test')}>عميل</button>
              <button onClick={() => quick('provider@mohaied.test')}>مقدم خدمة</button>
              <button onClick={() => quick('supervisor@mohaied.test')}>مشرف</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
