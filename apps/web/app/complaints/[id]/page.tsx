'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

type Party = { id: string; title: string; clientId?: string; providerId?: string };
type Response = { id: string; message: string; responderId: string; createdAt: string };
type Decision = { id: string; type: string; reason: string; createdAt: string };
type Evidence = { id: string; [key: string]: unknown };
type Complaint = {
  id: string;
  code: string;
  type: string;
  status: string;
  details: string;
  creatorId?: string;
  createdAt?: string;
  project?: Party;
  responses?: Response[];
  evidences?: Evidence[];
  decision?: Decision | null;
};
type Me = { id?: string; role?: string; fullName?: string };

const TYPE_LABELS: Record<string, string> = {
  DELIVERY_DELAY: 'تأخير في التسليم',
  AGREEMENT_VIOLATION: 'مخالفة للاتفاق',
  PAYMENT_ISSUE: 'مشكلة في الدفع',
  UNPROFESSIONAL: 'سلوك غير مهني',
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

const DECISION_TYPES = [
  { value: 'FAVOR_CLIENT', label: 'لصالح العميل' },
  { value: 'FAVOR_PROVIDER', label: 'لصالح مقدم الخدمة' },
  { value: 'EXTEND_DURATION', label: 'تمديد المدة' },
  { value: 'AMICABLE', label: 'تسوية ودّية' },
];

const DECISION_LABELS: Record<string, string> = {
  EXTEND_DURATION: 'تمديد المدة',
  FAVOR_CLIENT: 'لصالح العميل',
  FAVOR_PROVIDER: 'لصالح مقدم الخدمة',
  AMICABLE: 'تسوية ودّية',
};

const CC_CSS = `
.cc-wrap { max-width:820px; margin:0 auto; padding:22px 20px 60px; }
.cc-loading, .cc-empty, .cc-closed { color:var(--muted); font-size:14px; padding:14px 0; }
.cc-error { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; padding:12px 14px; border-radius:12px; font-size:14px; margin-bottom:16px; }
.cc-head { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px 20px; margin-bottom:16px; }
.cc-head-top { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.cc-code { display:inline-flex; align-items:center; gap:8px; font-weight:800; font-size:18px; color:var(--ink); }
.cc-meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-top:10px; color:var(--muted); font-size:13.5px; }
.cc-type { font-weight:700; color:var(--green-dark); }
.cc-dot { color:var(--line); }
.cc-badge { padding:5px 12px; border-radius:999px; font-size:12.5px; font-weight:800; white-space:nowrap; }
.cc-badge.blue { background:#eff6ff; color:#1d4ed8; }
.cc-badge.amber { background:#fffbeb; color:#b45309; }
.cc-badge.green { background:var(--mint); color:var(--green-dark); }
.cc-badge.ok { background:#ecfdf5; color:#047857; }
.cc-badge.red { background:#fef2f2; color:#b91c1c; }
.cc-badge.muted { background:#f3f4f6; color:#6b7280; }
.cc-decision { background:linear-gradient(140deg,#f0fdf9,#ecfdf5); border:1px solid var(--green-light); border-radius:16px; padding:18px 20px; margin-bottom:16px; }
.cc-decision-h { display:inline-flex; align-items:center; gap:8px; font-weight:800; color:var(--green-dark); font-size:15px; }
.cc-decision-type { font-weight:800; font-size:18px; color:var(--ink); margin-top:8px; }
.cc-decision-reason { color:var(--text); font-size:14.5px; line-height:1.9; margin-top:6px; white-space:pre-wrap; }
.cc-decision-date { color:var(--muted); font-size:12.5px; margin-top:10px; }
.cc-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px 20px; margin-bottom:16px; }
.cc-card-h { display:flex; align-items:center; gap:8px; font-weight:800; font-size:15px; color:var(--ink); margin-bottom:14px; }
.cc-thread { display:flex; flex-direction:column; gap:12px; }
.cc-msg { border:1px solid var(--line); border-radius:14px; padding:12px 14px; background:var(--background); }
.cc-msg.admin { background:var(--mint); border-color:var(--green-light); }
.cc-msg-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px; }
.cc-tag { font-size:12px; font-weight:800; padding:3px 10px; border-radius:999px; }
.cc-tag.client { background:#eff6ff; color:#1d4ed8; }
.cc-tag.provider { background:#fffbeb; color:#b45309; }
.cc-tag.admin { background:var(--green); color:#fff; }
.cc-openTag { font-size:11.5px; font-weight:700; color:var(--muted); background:#fff; border:1px solid var(--line); padding:2px 8px; border-radius:999px; }
.cc-msg-date { margin-inline-start:auto; color:var(--muted); font-size:12px; }
.cc-msg-body { color:var(--text); font-size:14.5px; line-height:1.9; white-space:pre-wrap; }
.cc-reply { margin-top:18px; padding-top:18px; border-top:1px solid var(--line); }
.cc-label { display:block; font-weight:700; font-size:13.5px; color:var(--ink); margin-bottom:8px; }
.cc-textarea, .cc-select { width:100%; border:1px solid var(--line); border-radius:12px; padding:11px 13px; font-family:inherit; font-size:14px; color:var(--ink); background:#fff; resize:vertical; box-sizing:border-box; }
.cc-textarea:focus, .cc-select:focus { outline:none; border-color:var(--green-light); box-shadow:0 0 0 3px rgba(79,162,148,.15); }
.cc-select { margin-bottom:14px; }
.cc-btn { margin-top:12px; padding:10px 20px; border-radius:11px; border:none; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:all .15s; }
.cc-btn.primary { background:var(--green); color:#fff; }
.cc-btn.primary:hover { background:var(--green-dark); }
.cc-btn.dark { background:var(--ink); color:#fff; }
.cc-btn.dark:hover { opacity:.9; }
.cc-btn:disabled { opacity:.6; cursor:default; }
.cc-arb { border-color:var(--green-light); }
.cc-ev-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
.cc-ev { border:1px solid var(--line); border-radius:10px; padding:10px 12px; font-size:14px; color:var(--text); }
`;

export default function ComplaintCasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [me, setMe] = useState<Me>({});
  const [message, setMessage] = useState('');
  const [decisionType, setDecisionType] = useState('FAVOR_CLIENT');
  const [decisionReason, setDecisionReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);

  function load() {
    api<Complaint>(`/complaints/${id}`)
      .then((data) => setComplaint(data))
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<Me>('/users/me')
      .then((data) => setMe({ id: data.id, role: data.role, fullName: data.fullName }))
      .catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  const clientId = complaint?.project?.clientId;
  const providerId = complaint?.project?.providerId;
  const isAdmin = me.role === 'ADMIN';
  const isParty = !!me.id && (me.id === clientId || me.id === providerId);
  const isOpen =
    complaint != null &&
    complaint.status !== 'RESOLVED' &&
    complaint.status !== 'CLOSED' &&
    complaint.status !== 'REJECTED';

  function roleOf(userId?: string): { label: string; kind: string } {
    if (userId && userId === clientId) return { label: 'العميل', kind: 'client' };
    if (userId && userId === providerId) return { label: 'مقدم الخدمة', kind: 'provider' };
    return { label: 'إدارة محايد · مُحكّم', kind: 'admin' };
  }

  function fmt(d?: string) {
    if (!d) return '';
    try {
      return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return '';
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    setError('');
    const endpoint = isAdmin ? `/complaints/${id}/arbitrate` : `/complaints/${id}/respond`;
    try {
      await api(endpoint, { method: 'POST', body: { message } });
      setMessage('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function submitDecision(e: React.FormEvent) {
    e.preventDefault();
    setDeciding(true);
    setError('');
    try {
      await api(`/complaints/${id}/decide`, {
        method: 'POST',
        body: { type: decisionType, reason: decisionReason },
      });
      setDecisionReason('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeciding(false);
    }
  }

  const status = complaint ? STATUS_META[complaint.status] : undefined;
  const canReply = isOpen && (isParty || isAdmin);
  const conversation = complaint
    ? [
        {
          id: 'opening',
          message: complaint.details,
          responderId: complaint.creatorId,
          createdAt: complaint.createdAt,
          opening: true,
        },
        ...(complaint.responses || []).map((r) => ({ ...r, opening: false })),
      ]
    : [];

  if (loading) {
    return (
      <>
        <style>{CC_CSS}</style>
        <TopBar />
        <BackBar />
        <div className="cc-wrap">
          <div className="cc-loading">جاري تحميل ملف النزاع…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CC_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="cc-wrap">
        {error && <div className="cc-error">{error}</div>}

        {complaint && (
          <>
            <div className="cc-head">
              <div className="cc-head-top">
                <div className="cc-code">
                  <Icon name="scale" size={18} />
                  ملف نزاع #{complaint.code}
                </div>
                {status && <span className={`cc-badge ${status.cls}`}>{status.label}</span>}
              </div>
              <div className="cc-meta">
                <span className="cc-type">{TYPE_LABELS[complaint.type] || complaint.type}</span>
                {complaint.project && (
                  <>
                    <span className="cc-dot">·</span>
                    <span className="cc-project">{complaint.project.title}</span>
                  </>
                )}
                {complaint.createdAt && (
                  <>
                    <span className="cc-dot">·</span>
                    <span className="cc-date">{fmt(complaint.createdAt)}</span>
                  </>
                )}
              </div>
            </div>

            {complaint.decision && (
              <div className="cc-decision">
                <div className="cc-decision-h">
                  <Icon name="shield" size={18} />
                  قرار إدارة محايد
                </div>
                <div className="cc-decision-type">
                  {DECISION_LABELS[complaint.decision.type] || complaint.decision.type}
                </div>
                <div className="cc-decision-reason">{complaint.decision.reason}</div>
                <div className="cc-decision-date">{fmt(complaint.decision.createdAt)}</div>
              </div>
            )}

            <div className="cc-card">
              <div className="cc-card-h">سجل النزاع والتحكيم</div>
              <div className="cc-thread">
                {conversation.map((m) => {
                  const r = roleOf(m.responderId as string | undefined);
                  return (
                    <div key={m.id} className={`cc-msg ${r.kind}`}>
                      <div className="cc-msg-head">
                        <span className={`cc-tag ${r.kind}`}>{r.label}</span>
                        {m.opening && <span className="cc-openTag">فتح النزاع</span>}
                        <span className="cc-msg-date">{fmt(m.createdAt as string)}</span>
                      </div>
                      <div className="cc-msg-body">{m.message}</div>
                    </div>
                  );
                })}
              </div>

              {canReply && (
                <form className="cc-reply" onSubmit={sendMessage}>
                  <label className="cc-label">
                    {isAdmin ? 'رسالة كمُحكّم (إدارة محايد)' : 'أضف ردّك على النزاع'}
                  </label>
                  <textarea
                    className="cc-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isAdmin ? 'اكتب توجيه أو استيضاح للطرفين…' : 'اكتب ردّك ووضّح موقفك…'}
                    rows={3}
                    required
                  />
                  <button className="cc-btn primary" type="submit" disabled={sending}>
                    {sending ? 'جاري الإرسال…' : isAdmin ? 'إرسال كمُحكّم' : 'إرسال الرد'}
                  </button>
                </form>
              )}
              {!isOpen && !complaint.decision && (
                <div className="cc-closed">تم إغلاق هذا النزاع.</div>
              )}
            </div>

            <div className="cc-card">
              <div className="cc-card-h">
                <Icon name="folder" size={17} /> مركز الأدلة والمرفقات
              </div>
              {complaint.evidences && complaint.evidences.length > 0 ? (
                <ul className="cc-ev-list">
                  {complaint.evidences.map((ev, i) => (
                    <li key={ev.id || i} className="cc-ev">
                      {String(
                        (ev as any).description ||
                          (ev as any).note ||
                          (ev as any).url ||
                          (ev as any).fileName ||
                          'مرفق',
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="cc-empty">
                  لم تُرفع أدلة بعد. نظام رفع الوثائق والصور الاحترافي قيد التجهيز.
                </div>
              )}
            </div>

            {isAdmin && isOpen && !complaint.decision && (
              <div className="cc-card cc-arb">
                <div className="cc-card-h">
                  <Icon name="scale" size={17} /> إصدار قرار التحكيم
                </div>
                <form onSubmit={submitDecision}>
                  <label className="cc-label">نوع القرار</label>
                  <select
                    className="cc-select"
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                  >
                    {DECISION_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <label className="cc-label">حيثيات القرار</label>
                  <textarea
                    className="cc-textarea"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="اكتب أسباب القرار بوضوح للطرفين…"
                    rows={3}
                    minLength={5}
                    required
                  />
                  <button className="cc-btn dark" type="submit" disabled={deciding}>
                    {deciding ? 'جاري الإصدار…' : 'إصدار القرار النهائي'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
