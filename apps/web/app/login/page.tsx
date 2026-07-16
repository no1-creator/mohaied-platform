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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });
      saveToken(res.accessToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand text-white grid place-items-center text-2xl mx-auto mb-3">
            ◇
          </div>
          <h1 className="text-2xl font-black">تسجيل الدخول</h1>
          <p className="text-muted text-sm mt-1">أهلًا بيك تاني في محايد</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">كلمة المرور</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          لسه معندكش حساب؟{' '}
          <Link href="/register" className="text-brand font-extrabold">
            إنشاء حساب
          </Link>
        </p>
      </div>
    </main>
  );
}
