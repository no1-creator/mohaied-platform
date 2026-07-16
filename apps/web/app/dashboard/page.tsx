'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Me = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'عميل',
  PROVIDER: 'مقدم خدمة',
  SUPERVISOR: 'مشرف متخصص',
  ADMIN: 'إدارة محايد',
};

export default function DashboardPage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }

    api<Me>('/users/me')
      .then((data) => setMe(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen grid place-items-center text-muted">
        جاري التحميل...
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <TopBar />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="btn-primary max-w-xs mx-auto"
          >
            الرجوع لتسجيل الدخول
          </button>
        </div>
      </main>
    );
  }

  const role = me?.role;

  return (
    <main className="min-h-screen">
      <TopBar name={me?.fullName} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="card mb-8">
          <span className="inline-block bg-brand-mint text-brand text-xs font-extrabold px-3 py-1 rounded-full mb-3">
            {me ? ROLE_LABELS[me.role] : ''}
          </span>
          <h1 className="text-2xl font-black mb-2">
            أهلًا بيك، {me?.fullName}
          </h1>
          <p className="text-muted text-sm">
            {me?.email}
            {me && !me.isVerified && ' — حسابك بانتظار التوثيق'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/projects" className="card block hover:border-brand">
            <h3 className="font-black mb-1">مشاريعي</h3>
            <p className="text-sm text-muted">تابع مشاريعك الحالية.</p>
          </Link>

          {role === 'CLIENT' && (
            <Link
              href="/projects/new"
              className="card block hover:border-brand"
            >
              <h3 className="font-black mb-1">مشروع جديد</h3>
              <p className="text-sm text-muted">انشر مشروعك واستقبل العروض.</p>
            </Link>
          )}

          {role === 'PROVIDER' && (
            <Link
              href="/projects/open"
              className="card block hover:border-brand"
            >
              <h3 className="font-black mb-1">مشاريع مفتوحة</h3>
              <p className="text-sm text-muted">تصفّح المشاريع وقدّم عروضك.</p>
            </Link>
          )}

          {role === 'PROVIDER' && (
            <Link href="/offers/mine" className="card block hover:border-brand">
              <h3 className="font-black mb-1">عروضي</h3>
              <p className="text-sm text-muted">تابع حالة العروض اللي قدّمتها.</p>
            </Link>
          )}

          {role === 'SUPERVISOR' && (
            <Link
              href="/supervisor/assignments"
              className="card block hover:border-brand"
            >
              <h3 className="font-black mb-1">تكليفاتي</h3>
              <p className="text-sm text-muted">المشاريع اللي بتشرف عليها.</p>
            </Link>
          )}

          {role === 'ADMIN' && (
            <Link
              href="/admin/complaints"
              className="card block hover:border-brand"
            >
              <h3 className="font-black mb-1">الشكاوى</h3>
              <p className="text-sm text-muted">راجع الشكاوى وأصدر القرارات.</p>
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
