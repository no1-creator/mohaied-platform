'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Invitation = {
  id: string;
  inviteeName: string;
  inviteeEmail?: string | null;
  inviteePhone?: string | null;
  inviteeType?: string | null;
  projectTitle: string;
  field?: string | null;
  projectDescription: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  message?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; cls: string; note: string }> = {
  PENDING: { label: 'قيد المراجعة', cls: 'wait', note: 'استلمنا دعوتك ✅ فريق محايد بيراجعها وهيتواصل مع مقدم الخدمة قريبًا.' },
  CONTACTED: { label: 'تم التواصل', cls: 'wait', note: 'فريق محايد تواصل مع مقدم الخدمة، وهنبلّغك بالخطوة الجاية.' },
  ACCEPTED: { label: 'قَبِل الدعوة', cls: 'done', note: 'مقدم الخدمة قَبِل الدعوة! هنبدأ في تجهيز التعاقد الموثّق.' },
  DECLINED: { label: 'اعتذر', cls: 'closed', note: 'مقدم الخدمة اعتذر عن الدعوة. تقدر تجرّب طريقة تانية لاختيار مقدم خدمة.' },
  CLOSED: { label: 'مغلقة', cls: 'closed', note: 'الدعوة دي اتقفلت.' },
};

const IVD_CSS = `
.ivd-wrap{max-width:720px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.ivd-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:24px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.ivd-top{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;}
.ivd-title{font-size:21px;font-weight:800;color:var(--ink);margin:0;}
.ivd-badge{font-size:12.5px;font-weight:800;padding:5px 12px;border-radius:999px;white-space:nowrap;}
.ivd-badge.wait{background:#fef9c3;color:#a16207;}
.ivd-badge.done{background:#e7f6f0;color:var(--green-dark);}
.ivd-badge.closed{background:#f3f4f6;color:#6b7280;}
.ivd-note{margin-top:18px;background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8;border-radius:14px;padding:14px 16px;font-size:13.5px;line-height:1.85;text-align:center;}
.ivd-sec{margin-top:24px;}
.ivd-sec-h{font-size:14px;font-weight:800;color:var(--green-dark);margin:0 0 10px;padding-bottom:7px;border-bottom:1px solid var(--line);}
.ivd-rowline{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:14px;}
.ivd-k{color:var(--muted);flex-shrink:0;}
.ivd-v{color:var(--ink);font-weight:600;text-align:left;word-break:break-word;}
.ivd-desc{font-size:14px;color:#3a4a46;line-height:1.9;margin:0;white-space:pre-wrap;}
.ivd-admin{margin-top:4px;background:var(--mint);border-radius:12px;padding:14px 16px;font-size:14px;color:#3a4a46;line-height:1.9;white-space:pre-wrap;}
.ivd-state{text-align:center;color:var(--muted);padding:50px 20px;font-size:14px;}
`;

export default function InviteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || '');
  const [inv, setInv] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!id) return;
    api<Invitation>(`/invitations/${id}`)
      .then((data) => setInv(data))
      .catch((err) => setError(err?.message || 'الدعوة غير موجودة'))
      .finally(() => setLoading(false));
  }, [router, id]);

  const st = inv ? STATUS_MAP[inv.status] || { label: inv.status, cls: 'wait', note: '' } : null;
  const bmin =
    inv?.budgetMin !== null && inv?.budgetMin !== undefined && inv?.budgetMin !== ''
      ? Number(inv.budgetMin)
      : null;
  const bmax =
    inv?.budgetMax !== null && inv?.budgetMax !== undefined && inv?.budgetMax !== ''
      ? Number(inv.budgetMax)
      : null;

  return (
    <>
      <style>{IVD_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="ivd-wrap">
        {loading && <div className="ivd-state">جاري التحميل...</div>}
        {error && !loading && <div className="ivd-state">{error}</div>}

        {!loading && !error && inv && st && (
          <div className="ivd-card">
            <div className="ivd-top">
              <h1 className="ivd-title">{inv.projectTitle}</h1>
              <span className={`ivd-badge ${st.cls}`}>{st.label}</span>
            </div>

            {st.note && <div className="ivd-note">{st.note}</div>}

            <div className="ivd-sec">
              <h2 className="ivd-sec-h">مقدم الخدمة المدعوّ</h2>
              <div className="ivd-rowline"><span className="ivd-k">الاسم</span><span className="ivd-v">{inv.inviteeName}</span></div>
              {inv.inviteeType && <div className="ivd-rowline"><span className="ivd-k">النوع</span><span className="ivd-v">{inv.inviteeType}</span></div>}
              {inv.inviteeEmail && <div className="ivd-rowline"><span className="ivd-k">الإيميل</span><span className="ivd-v">{inv.inviteeEmail}</span></div>}
              {inv.inviteePhone && <div className="ivd-rowline"><span className="ivd-k">التليفون</span><span className="ivd-v">{inv.inviteePhone}</span></div>}
            </div>

            <div className="ivd-sec">
              <h2 className="ivd-sec-h">تفاصيل المشروع</h2>
              {inv.field && <div className="ivd-rowline"><span className="ivd-k">المجال</span><span className="ivd-v">{inv.field}</span></div>}
              {bmin != null && <div className="ivd-rowline"><span className="ivd-k">الميزانية من</span><span className="ivd-v">{bmin.toLocaleString('en')} ج.م</span></div>}
              {bmax != null && <div className="ivd-rowline"><span className="ivd-k">الميزانية إلى</span><span className="ivd-v">{bmax.toLocaleString('en')} ج.م</span></div>}
              {inv.durationDays ? <div className="ivd-rowline"><span className="ivd-k">المدة</span><span className="ivd-v">{inv.durationDays} يوم</span></div> : null}
              <p className="ivd-desc" style={{ marginTop: 10 }}>{inv.projectDescription}</p>
            </div>

            {inv.message && (
              <div className="ivd-sec">
                <h2 className="ivd-sec-h">رسالتك لمقدم الخدمة</h2>
                <p className="ivd-desc">{inv.message}</p>
              </div>
            )}

            {inv.adminNote && (
              <div className="ivd-sec">
                <h2 className="ivd-sec-h">ملاحظة فريق محايد</h2>
                <div className="ivd-admin">{inv.adminNote}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
