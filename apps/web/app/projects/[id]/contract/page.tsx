'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Agreement = {
  id: string;
  contractNumber?: string | null;
  contractBody?: string | null;
  totalValue: number;
  durationDays: number;
  status: string;
  clientSignName?: string | null;
  clientSignedAt?: string | null;
  clientSignHash?: string | null;
  providerSignName?: string | null;
  providerSignedAt?: string | null;
  providerSignHash?: string | null;
  fullySignedAt?: string | null;
};

type Me = { id: string; role: string; fullName: string };

export default function ContractPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [signName, setSignName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);

  function fmt(d?: string | null) {
    if (!d) return '';
    return new Date(d).toLocaleString('ar-EG');
  }

  async function load() {
    try {
      const [ag, user] = await Promise.all([
        api<Agreement>(`/agreements/project/${projectId}`),
        api<Me>(`/users/me`),
      ]);
      setAgreement(ag);
      setMe(user);
      if (!signName) setSignName(user.fullName || '');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, router]);

  const isClient = me?.role === 'CLIENT';
  const isProvider = me?.role === 'PROVIDER';
  const mySigned = isClient
    ? !!agreement?.clientSignedAt
    : isProvider
      ? !!agreement?.providerSignedAt
      : true;
  const canSign = (isClient || isProvider) && !mySigned;

  async function sign() {
    if (!agreement) return;
    if (!signName.trim()) {
      setError('اكتب اسمك الكامل للتوقيع.');
      return;
    }
    setSigning(true);
    setError('');
    try {
      await api(`/agreements/${agreement.id}/sign`, {
        method: 'POST',
        body: { signName: signName.trim() },
      });
      await load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigning(false);
    }
  }

  return (
    <main className="min-h-screen">
      <TopBar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">العقد الإلكتروني</h1>
          <button
            onClick={() => window.print()}
            className="text-sm font-extrabold text-brand"
          >
            🖨️ طباعة / تحميل PDF
          </button>
        </div>

        {loading && <p className="text-muted">جاري التحميل...</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {agreement && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="text-sm font-extrabold">
                رقم العقد: {agreement.contractNumber || '—'}
              </span>
              {agreement.fullySignedAt ? (
                <span className="text-xs font-black px-3 py-1 rounded-full bg-brand text-white">
                  ✅ موقّع من الطرفين
                </span>
              ) : (
                <span className="text-xs font-black px-3 py-1 rounded-full border border-line text-muted">
                  ⏳ بانتظار التوقيع
                </span>
              )}
            </div>

            <div
              className="card mb-6 whitespace-pre-line leading-8 text-sm"
              style={{ fontFamily: 'inherit' }}
            >
              {agreement.contractBody || 'لا يوجد نص عقد.'}
            </div>

            <h2 className="text-lg font-black mb-3">التوقيعات</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="card">
                <p className="text-sm font-extrabold mb-1">الطرف الأول (العميل)</p>
                {agreement.clientSignedAt ? (
                  <>
                    <p className="font-black">{agreement.clientSignName}</p>
                    <p className="text-xs text-muted mt-1">
                      {fmt(agreement.clientSignedAt)}
                    </p>
                    <p className="text-[10px] text-muted mt-2 break-all">
                      البصمة: {agreement.clientSignHash}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">لم يوقّع بعد</p>
                )}
              </div>

              <div className="card">
                <p className="text-sm font-extrabold mb-1">الطرف الثاني (المنفّذ)</p>
                {agreement.providerSignedAt ? (
                  <>
                    <p className="font-black">{agreement.providerSignName}</p>
                    <p className="text-xs text-muted mt-1">
                      {fmt(agreement.providerSignedAt)}
                    </p>
                    <p className="text-[10px] text-muted mt-2 break-all">
                      البصمة: {agreement.providerSignHash}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted">لم يوقّع بعد</p>
                )}
              </div>
            </div>

            {canSign && (
              <div className="card">
                <p className="text-sm font-extrabold mb-3">
                  التوقيع الإلكتروني — اكتب اسمك الكامل للإقرار والتوقيع
                </p>
                <input
                  value={signName}
                  onChange={(e) => setSignName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full border border-line rounded-xl px-4 py-2 mb-3 text-sm"
                />
                <button
                  onClick={sign}
                  disabled={signing}
                  className="btn-primary"
                >
                  {signing ? 'جاري التوقيع...' : '✍️ أوقّع إلكترونيًا'}
                </button>
                <p className="text-[11px] text-muted mt-3">
                  بالضغط على «أوقّع» فإنك تقرّ بأن هذا التوقيع الإلكتروني مُلزم
                  ويقوم مقام التوقيع اليدوي.
                </p>
              </div>
            )}

            {mySigned && (isClient || isProvider) && (
              <p className="text-sm font-extrabold text-brand">
                ✅ تم تسجيل توقيعك على هذا العقد.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
