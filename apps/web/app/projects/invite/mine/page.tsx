'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Invitation = { id: string; inviteeName: string; projectTitle: string; status: string; createdAt: string };

const STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'قيد المراجعة', cls: 'wait' },
  CONTACTED: { label: 'تم التواصل', cls: 'wait' },
  ACCEPTED: { label: 'قَبِل', cls: 'done' },
  DECLINED: { label: 'اعتذر', cls: 'closed' },
  CLOSED: { label: 'مغلقة', cls: 'closed' },
};

const ML_CSS = `
.ml-wrap{max-width:720px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.ml-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;}
.ml-title{font-size:22px;font-weight:800;color:var(--ink);margin:0;}
.ml-new{background:var(--green);color:#fff;border:none;padding:10px 16px;border-radius:11px;font-weight:800;font-size:13.5px;cursor:pointer;font-family:inherit;}
.ml-new:hover{background:var(--green-dark);}
.ml-list{display:flex;flex-direction:column;gap:12px;}
.ml-card{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 18px;cursor:pointer;transition:border-color .15s,box-shadow .15s;text-align:right;font-family:inherit;width:100%;}
.ml-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(24,70,61,.07);}
.ml-ct{flex:1;min-width:0;}
.ml-cn{font-size:15.5px;font-weight:800;color:var(--ink);margin:0 0 3px;}
.ml-cm{font-size:12.5px;color:var(--muted);margin:0;}
.ml-badge{font-size:12px;font-weight:800;padding:5px 12px;border-radius:999px;white-space:nowrap;flex-shrink:0;}
.ml-badge.wait{background:#fef9c3;color:#a16207;}
.ml-badge.done{background:#e7f6f0;color:var(--green-dark);}
.ml-badge.closed{background:#f3f4f6;color:#6b7280;}
.ml-state{text-align:center;color:var(--muted);padding:50px 20px;font-size:14px;}
.ml-empty{text-align:center;padding:50px 20px;background:#fff;border:1px solid var(--line);border-radius:16px;}
.ml-empty p{color:var(--muted);margin:0 0 16px;font-size:14px;}
`;

export default function MyInvitationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Invitation[]>('/invitations/mine')
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e?.message || 'تعذّر تحميل دعواتك'))
      .finally(() => setLoading(false));
  }, [router]);

  function fmt(d: string) {
    try {
      return new Date(d).toLocaleDateString('ar-EG');
    } catch {
      return '';
    }
  }

  return (
    <>
      <style>{ML_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="ml-wrap">
        <div className="ml-head">
          <h1 className="ml-title">دعواتي الخارجية</h1>
          <button className="ml-new" onClick={() => router.push('/projects/invite')}>
            دعوة جديدة
          </button>
        </div>

        {loading && <div className="ml-state">جاري التحميل...</div>}
        {error && !loading && <div className="ml-state">{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div className="ml-empty">
            <p>لسه مبعتّش أي دعوة لطرف خارجي.</p>
            <button className="ml-new" onClick={() => router.push('/projects/invite')}>
              ابعت أول دعوة
            </button>
          </div>
        )}
        {!loading && !error && items.length > 0 && (
          <div className="ml-list">
            {items.map((inv) => {
              const st = STATUS[inv.status] || { label: inv.status, cls: 'wait' };
              return (
                <button key={inv.id} className="ml-card" onClick={() => router.push(`/projects/invite/${inv.id}`)}>
                  <div className="ml-ct">
                    <p className="ml-cn">{inv.projectTitle}</p>
                    <p className="ml-cm">{[inv.inviteeName, fmt(inv.createdAt)].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`ml-badge ${st.cls}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
