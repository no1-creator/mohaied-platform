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
    return <div className="app-state">جاري التحميل...</div>;
  }

  if (error) {
    return (
      <div className="app-state">
        <div>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button
            className="auth-submit"
            style={{ maxWidth: 260 }}
            onClick={() => router.push('/login')}
          >
            الرجوع لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  const role = me?.role;

  return (
    <>
      <TopBar name={me?.fullName} />
      <div className="app-page">
        <div className="welcome-card">
          <span className="role-badge">{me ? ROLE_LABELS[me.role] : ''}</span>
          <h2>أهلًا بيك، {me?.fullName}</h2>
          <p>
            {me?.email}
            {me && !me.isVerified && ' — حسابك بانتظار التوثيق'}
          </p>
        </div>

        <div className="tiles-grid">
          <Link href="/projects" className="tile">
            <div className="tile-icon">📁</div>
            <h3>مشاريعي</h3>
            <p>تابع مشاريعك الحالية.</p>
          </Link>

          {role === 'CLIENT' && (
            <Link href="/projects/new" className="tile">
              <div className="tile-icon">➕</div>
              <h3>مشروع جديد</h3>
              <p>انشر مشروعك واستقبل العروض.</p>
            </Link>
          )}

          {role === 'PROVIDER' && (
            <Link href="/projects/open" className="tile">
              <div className="tile-icon">🔍</div>
              <h3>مشاريع مفتوحة</h3>
              <p>تصفّح المشاريع وقدّم عروضك.</p>
            </Link>
          )}

          {role === 'PROVIDER' && (
            <Link href="/offers/mine" className="tile">
              <div className="tile-icon">📨</div>
              <h3>عروضي</h3>
              <p>تابع حالة العروض اللي قدّمتها.</p>
            </Link>
          )}

          {role === 'SUPERVISOR' && (
            <Link href="/supervisor/assignments" className="tile">
              <div className="tile-icon">🛡️</div>
              <h3>تكليفاتي</h3>
              <p>المشاريع اللي بتشرف عليها.</p>
            </Link>
          )}

          {role === 'ADMIN' && (
            <Link href="/admin/complaints" className="tile">
              <div className="tile-icon">⚖️</div>
              <h3>الشكاوى</h3>
              <p>راجع الشكاوى وأصدر القرارات.</p>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
