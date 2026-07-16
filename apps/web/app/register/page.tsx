'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';

const ROLES = [
  { value: 'CLIENT', label: 'عميل' },
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 py-10">
      <div className="card w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand text-white grid place-items-center text-2xl mx-auto mb-3">
            ◇
          </div>
          <h1 className="text-2xl font-black">إنشاء حساب</h1>
          <p className="text-muted text-sm mt-1">ابدأ رحلتك على محايد</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">الاسم بالكامل</label>
            <input
              type="text"
              className="input-field"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
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
              minLength={6}
              required
            />
          </div>
          <div>
            <label className="label">نوع الحساب</label>
            <select
              className="input-field"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          عندك حساب بالفعل؟{' '}
          <Link href="/login" className="text-brand font-extrabold">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </main>
  );
}
