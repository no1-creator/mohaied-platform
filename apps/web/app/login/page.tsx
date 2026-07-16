'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';

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
      router.push('/dashboard');
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
          <div className="logo-mark">◇</div>
          <span>محايد</span>
        </div>
        <h2>نفّذ مشروعك بثقة، وحقوقك محفوظة</h2>
        <p>
          منصة محايدة تربط العميل بمقدم الخدمة داخل بيئة موثقة، مع اتفاق واضح
          ومتابعة للمراحل وحل عادل للنزاعات.
        </p>
        <ul className="auth-points">
          <li>اتفاق موثّق لكل مرحلة</li>
          <li>حماية حقوق الطرفين</li>
          <li>إشراف متخصص اختياري</li>
        </ul>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box">
          <div className="auth-head">
            <Link href="/" className="logo-mark">
              ◇
            </Link>
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

          <p className="auth-switch">
            لسه معندكش حساب؟ <Link href="/register">إنشاء حساب</Link>
          </p>

          <div className="quick-login">
            <h4>حسابات تجريبية (اضغط للدخول السريع)</h4>
            <div className="quick-grid">
              <button type="button" onClick={() => quick('admin@mohaied.test')}>
                أدمن
              </button>
              <button type="button" onClick={() => quick('client@mohaied.test')}>
                عميل
              </button>
              <button
                type="button"
                onClick={() => quick('provider@mohaied.test')}
              >
                مقدم خدمة
              </button>
              <button
                type="button"
                onClick={() => quick('supervisor@mohaied.test')}
              >
                مشرف
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
