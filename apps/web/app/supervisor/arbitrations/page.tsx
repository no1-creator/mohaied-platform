'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

type Arb = {
  id: string;
  code: string;
  type: string;
  customType?: string | null;
  status: string;
  createdAt?: string;
  project?: { id: string; title: string };
  decision?: { id: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: 'تأخير في التسليم',
  AGREEMENT_VIOLATION: 'مخالفة للاتفاق',
  PAYMENT_ISSUE: 'مشكلة في الدفع',
  UNPROFESSIONAL: 'سلوك غير مهني',
  OTHER: 'نوع آخر',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوحة', cls: 'blue' },
  AWAITING_RESPONSE: { label: 'بانتظار الرد', cls: 'amber' },
  UNDER_REVIEW: { label: 'قيد المراجعة', cls: 'amber' },
  IN_ARBITRATION: { label: 'في التحكيم', cls: 'green' },
  RESOLVED: { label: 'تم الحل', cls: 'ok' },
  REJECTED: { label: 'مرفوضة', cls: 'red' },
  CLOSED: { label: 'مغلقة', cls: 'muted' },
};

const SA_CSS = `
.sa-wrap{max-width:900px;margin:0 auto;width:100%;padding:8px 0 40px;}
.sa-title{display:flex;align-items:center;gap:9px;font-weight:800;font-size:22px;color:var(--ink);margin:6px 0 6px;}
.sa-desc{color:var(--muted);font-size:14px;margin-bottom:20px;line-height:1.8;}
.sa-msg{color:var(--muted);font-size:14px;padding:16px 0;}
.sa-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:12px 14px;border-radius:12px;font-size:14px;margin-bottom:16px;}
.sa-list{display:flex;flex-direction:column;gap:12px;}
.sa-card{display:block;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;text-decoration:none;box-shadow:0 8px 22px rgba(24,70,61,.04);transition:all .15s;}
.sa-card:hover{border-color:var(--green-light);transform:translateY(-1px);}
.sa-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.sa-code{display:inline-flex;align-items:center;gap:8px;font-weight:800;font-size:16px;color:var(--ink);}
.sa-code .sa-num{direction:ltr;color:var(--muted);font-size:13.5px;font-weight:700;}
.sa-status{padding:5px 12px;border-radius:999px;font-size:12.5px;font-weight:800;white-space:nowrap;}
.sa-status.blue{background:#eff6ff;color:#1d4ed8;}
.sa-status.amber{background:#fffbeb;color:#b45309;}
.sa-status.green{background:var(--mint);color:var(--green-dark);}
.sa-status.ok{background:#ecfdf5;color:#047857;}
.sa-status.red{background:#fef2f2;color:#b91c1c;}
.sa-status.muted{background:#f3f4f6;color:#6b7280;}
.sa-meta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:11px;color:var(--muted);font-size:13.5px;}
.sa-meta .sa-type{font-weight:700;color:var(--green-dark);}
.sa-sep{color:var(--line);}
`;

export default function SupervisorArbitrationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Arb[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Arb[]>('/complaints/arbitrations/mine')
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  function typeText(c: Arb) {
    return c.type === 'OTHER' ? c.customType || 'نوع آخر' : TYPE_LABELS[c.type] || c.type;
  }

  function fmt(d?: string) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('ar-EG', { dateStyle: 'medium' });
    } catch {
      return '';
    }
  }

  return (
    <>
      <style>{SA_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="sa-wrap">
        <div className="sa-title">
          <Icon name="scale" size={24} />
          النزاعات المُسندة لي كمُحكّم
        </div>
        <div className="sa-desc">
          دي النزاعات اللي عيّنتك إدارة محايد فيها مُحكّمًا تقنيًا. افتح أي نزاع لمراجعة الأدلة، مراسلة الطرفين، وإصدار القرار.
        </div>

        {loading && <div className="sa-msg">جاري التحميل…</div>}
        {error && <div className="sa-error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="sa-msg">مفيش نزاعات مُسندة لك حاليًا.</div>
        )}

        <div className="sa-list">
          {items.map((c) => {
            const st = STATUS_META[c.status] || { label: c.status, cls: 'muted' };
            return (
              <Link key={c.id} href={`/complaints/${c.id}`} className="sa-card">
                <div className="sa-top">
                  <span className="sa-code">
                    <Icon name="scale" size={18} />
                    نزاع #<span className="sa-num">{c.code}</span>
                  </span>
                  <span className={`sa-status ${st.cls}`}>{st.label}</span>
                </div>
                <div className="sa-meta">
                  <span className="sa-type">{typeText(c)}</span>
                  {c.project && (
                    <>
                      <span className="sa-sep">·</span>
                      <span>{c.project.title}</span>
                    </>
                  )}
                  {c.createdAt && (
                    <>
                      <span className="sa-sep">·</span>
                      <span>{fmt(c.createdAt)}</span>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
