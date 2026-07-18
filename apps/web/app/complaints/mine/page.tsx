'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';

type Complaint = {
  id: string;
  code: string;
  type: string;
  status: string;
  project?: { id: string; title: string };
  decision?: { type: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: 'تأخير في التسليم',
  AGREEMENT_VIOLATION: 'مخالفة للاتفاق',
  PAYMENT_ISSUE: 'مشكلة في الدفع',
  UNPROFESSIONAL: 'سلوك غير مهني',
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'مفتوحة', cls: 'blue' },
  AWAITING_RESPONSE: { label: 'بانتظار الرد', cls: 'amber' },
  UNDER_REVIEW: { label: 'قيد المراجعة', cls: 'blue' },
  IN_ARBITRATION: { label: 'في التحكيم', cls: 'amber' },
  RESOLVED: { label: 'تم الحل', cls: 'ok' },
  REJECTED: { label: 'مرفوضة', cls: 'red' },
  CLOSED: { label: 'مغلقة', cls: 'muted' },
};

export default function MyComplaintsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Complaint[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Complaint[]>('/complaints/mine')
      .then((data) => setItems(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <style>{CM_CSS}</style>
      <TopBar />
      <div className="cm-wrap">
        <div className="cm-head">
          <h1 className="cm-title">شكاويّ ونزاعاتي</h1>
          <p className="cm-sub">تابع حالة شكاويك، ردود الطرف التاني، وقرارات إدارة محايد.</p>
        </div>

        {loading && <div className="cm-loading">جاري التحميل...</div>}
        {error && <div className="cm-error">{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div className="cm-empty">
            <Icon name="scale" size={30} />
            <p>لسه مفيش شكاوى. تقدر تفتح شكوى من صفحة أي مشروع.</p>
          </div>
        )}

        <div className="cm-list">
          {items.map((c) => {
            const st = STATUS_META[c.status] || { label: c.status, cls: 'muted' };
            return (
              <Link key={c.id} href={`/complaints/${c.id}`} className="cm-card">
                <div className="cm-card-top">
                  <span className="cm-code">#{c.code}</span>
                  <span className={`cm-badge ${st.cls}`}>{st.label}</span>
                </div>
                <div className="cm-type">{TYPE_LABELS[c.type] || c.type}</div>
                <div className="cm-project">{c.project?.title || '—'}</div>
                {c.decision && (
                  <div className="cm-decided">
                    <Icon name="badgeCheck" size={15} /> صدر قرار من الإدارة — اضغط للتفاصيل
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

const CM_CSS = `
.cm-wrap{max-width:820px;margin:0 auto;padding:30px 20px 80px;}
.cm-head{margin-bottom:22px;}
.cm-title{font-size:26px;font-weight:800;color:var(--ink);margin:0 0 6px;}
.cm-sub{color:var(--muted);font-size:14px;margin:0;line-height:1.7;}
.cm-loading,.cm-error{padding:16px 0;color:var(--muted);font-size:14px;}
.cm-error{color:#b91c1c;}
.cm-empty{text-align:center;color:var(--muted);padding:60px 20px;}
.cm-empty svg{color:var(--green-light);margin-bottom:10px;}
.cm-empty p{font-size:14px;margin:0;}
.cm-list{display:flex;flex-direction:column;gap:12px;}
.cm-card{display:block;background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;text-decoration:none;transition:all .15s;box-shadow:0 4px 14px rgba(23,33,31,.04);}
.cm-card:hover{border-color:var(--green-light);transform:translateY(-2px);box-shadow:0 10px 24px rgba(40,125,115,.1);}
.cm-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.cm-code{font-weight:800;color:var(--ink);font-size:15px;font-family:monospace;}
.cm-badge{padding:4px 11px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;}
.cm-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.cm-badge.amber{background:#fdf3dd;color:#96690f;}
.cm-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.cm-badge.red{background:#fdeceb;color:#b4322b;}
.cm-badge.muted{background:#eef1f0;color:var(--muted);}
.cm-type{font-size:15px;font-weight:700;color:var(--ink);margin-bottom:3px;}
.cm-project{font-size:13px;color:var(--muted);}
.cm-decided{display:flex;align-items:center;gap:6px;margin-top:10px;font-size:13px;font-weight:700;color:var(--green-dark);background:var(--mint);border-radius:9px;padding:8px 11px;}
.cm-decided svg{flex-shrink:0;}
`;
