'use client';

import { useEffect, useState } from 'react';
import { api, getToken } from '@/lib/api';
import Icon from '@/components/Icon';

type Party = { id: string; title: string; clientId?: string; providerId?: string };
type Response = { id: string; message: string; responderId: string; createdAt: string };
type Decision = { id: string; type: string; customType?: string | null; reason: string; createdAt: string };
type Evidence = { id: string; [key: string]: unknown };
type EscrowTx = {
  id: string;
  status: string;
  amount: number | string;
  commissionAmount?: number | string;
  netAmount?: number | string;
  milestone?: { id?: string; title?: string; status?: string } | null;
};
type Complaint = {
  id: string;
  code: string;
  type: string;
  customType?: string | null;
  status: string;
  details: string;
  creatorId?: string;
  createdAt?: string;
  milestoneId?: string | null;
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

const ESCROW_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'بانتظار التمويل', cls: 'muted' },
  FUNDED: { label: 'محجوز في الضمان', cls: 'blue' },
  RELEASED: { label: 'حُرِّر لمقدّم الخدمة', cls: 'ok' },
  REFUNDED: { label: 'استُرجع للعميل', cls: 'amber' },
  DISPUTED: { label: 'متنازَع عليه', cls: 'red' },
};

const DECISION_TYPES = [
  { value: 'FAVOR_CLIENT', label: 'لصالح العميل' },
  { value: 'FAVOR_PROVIDER', label: 'لصالح مقدم الخدمة' },
  { value: 'EXTEND_DURATION', label: 'تمديد المدة' },
  { value: 'AMICABLE', label: 'تسوية ودّية' },
  { value: 'OTHER', label: 'قرار آخر (اكتبه)' },
];

const DECISION_LABELS: Record<string, string> = {
  EXTEND_DURATION: 'تمديد المدة',
  FAVOR_CLIENT: 'لصالح العميل',
  FAVOR_PROVIDER: 'لصالح مقدم الخدمة',
  AMICABLE: 'تسوية ودّية',
  OTHER: 'قرار آخر',
};

const STEPS = [
  { key: 'opened', label: 'فُتح النزاع' },
  { key: 'exchange', label: 'تبادل الردود' },
  { key: 'arbitration', label: 'التحكيم' },
  { key: 'resolved', label: 'صدور القرار' },
];

function stepIndex(status: string): number {
  switch (status) {
    case 'OPEN':
    case 'AWAITING_RESPONSE':
      return 0;
    case 'UNDER_REVIEW':
      return 1;
    case 'IN_ARBITRATION':
      return 2;
    case 'RESOLVED':
    case 'REJECTED':
    case 'CLOSED':
      return 3;
    default:
      return 0;
  }
}

function money(v: number | string | undefined): string {
  const n = Number(v || 0);
  return n.toLocaleString('ar-EG');
}

const DC_CSS = `
.dc-wrap{max-width:980px;margin:0 auto;width:100%;}
.dc-loading,.dc-empty,.dc-closed{color:var(--muted);font-size:14px;padding:16px 0;}
.dc-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:12px 14px;border-radius:12px;font-size:14px;margin-bottom:16px;}
.dc-head{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px;margin-bottom:16px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.dc-head-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.dc-code{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:19px;color:var(--ink);}
.dc-code .dc-num{direction:ltr;color:var(--muted);font-size:15px;font-weight:700;}
.dc-status{padding:6px 14px;border-radius:999px;font-size:13px;font-weight:800;white-space:nowrap;}
.dc-status.blue{background:#eff6ff;color:#1d4ed8;}
.dc-status.amber{background:#fffbeb;color:#b45309;}
.dc-status.green{background:var(--mint);color:var(--green-dark);}
.dc-status.ok{background:#ecfdf5;color:#047857;}
.dc-status.red{background:#fef2f2;color:#b91c1c;}
.dc-status.muted{background:#f3f4f6;color:#6b7280;}
.dc-sub{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:11px;color:var(--muted);font-size:13.5px;}
.dc-sub .dc-type{font-weight:800;color:var(--green-dark);}
.dc-sep{color:var(--line);}
.dc-steps{display:flex;align-items:flex-start;margin-top:22px;}
.dc-step{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;position:relative;text-align:center;}
.dc-step:not(:first-child)::before{content:"";position:absolute;top:13px;right:50%;width:100%;height:2px;background:var(--line);z-index:0;}
.dc-step.done::before,.dc-step.active::before{background:var(--green-light);}
.dc-step-dot{position:relative;z-index:1;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;background:#fff;border:2px solid var(--line);color:var(--muted);}
.dc-step.done .dc-step-dot{background:var(--green);border-color:var(--green);color:#fff;}
.dc-step.active .dc-step-dot{border-color:var(--green);color:var(--green-dark);}
.dc-step-label{font-size:12px;font-weight:700;color:var(--muted);}
.dc-step.done .dc-step-label,.dc-step.active .dc-step-label{color:var(--ink);}
.dc-grid{display:grid;grid-template-columns:1fr 320px;gap:16px;align-items:start;}
.dc-main{display:flex;flex-direction:column;gap:16px;min-width:0;}
.dc-aside{display:flex;flex-direction:column;gap:16px;}
.dc-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px 22px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.dc-card-h{display:flex;align-items:center;gap:8px;font-weight:800;font-size:15.5px;color:var(--ink);margin-bottom:16px;}
.dc-decision{background:linear-gradient(140deg,#f0fdf9,#ecfdf5);border:1px solid var(--green-light);border-radius:18px;padding:20px 22px;}
.dc-decision-h{display:inline-flex;align-items:center;gap:8px;font-weight:800;color:var(--green-dark);font-size:14.5px;}
.dc-decision-type{font-weight:800;font-size:19px;color:var(--ink);margin-top:9px;}
.dc-decision-reason{color:var(--text);font-size:14.5px;line-height:1.95;margin-top:7px;white-space:pre-wrap;}
.dc-decision-date{color:var(--muted);font-size:12.5px;margin-top:11px;}
.dc-thread{display:flex;flex-direction:column;gap:16px;}
.dc-entry{display:flex;gap:11px;}
.dc-av{width:38px;height:38px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#fff;}
.dc-av.client{background:#3b82f6;}
.dc-av.provider{background:#f59e0b;}
.dc-av.admin{background:var(--green);}
.dc-bubble{flex:1;min-width:0;background:var(--background);border:1px solid var(--line);border-radius:14px;padding:12px 14px;}
.dc-entry.admin .dc-bubble{background:var(--mint);border-color:var(--green-light);}
.dc-bubble-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:7px;}
.dc-who{font-weight:800;font-size:13.5px;color:var(--ink);}
.dc-who em{font-style:normal;color:var(--green-dark);font-weight:700;}
.dc-openchip{font-size:11px;font-weight:700;color:var(--muted);background:#fff;border:1px solid var(--line);padding:2px 8px;border-radius:999px;}
.dc-time{margin-inline-start:auto;color:var(--muted);font-size:11.5px;}
.dc-bubble-body{color:var(--text);font-size:14.5px;line-height:1.9;white-space:pre-wrap;word-break:break-word;}
.dc-form{margin-top:18px;padding-top:18px;border-top:1px solid var(--line);}
.dc-label{display:block;font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:8px;}
.dc-textarea,.dc-select,.dc-input{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;resize:vertical;box-sizing:border-box;}
.dc-textarea:focus,.dc-select:focus,.dc-input:focus{outline:none;border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.dc-select,.dc-input{margin-bottom:14px;}
.dc-btn{margin-top:12px;padding:11px 22px;border-radius:12px;border:none;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;transition:all .15s;width:100%;}
.dc-btn.primary{background:var(--green);color:#fff;}
.dc-btn.primary:hover{background:var(--green-dark);}
.dc-btn.dark{background:var(--ink);color:#fff;}
.dc-btn.dark:hover{opacity:.92;}
.dc-btn:disabled{opacity:.6;cursor:default;}
.dc-summary{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px;}
.dc-summary li{display:flex;justify-content:space-between;gap:12px;font-size:13.5px;border-bottom:1px dashed var(--line);padding-bottom:11px;}
.dc-summary li:last-child{border-bottom:none;padding-bottom:0;}
.dc-summary .dc-k{color:var(--muted);}
.dc-summary .dc-v{color:var(--ink);font-weight:700;text-align:left;}
.dc-ev-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:9px;}
.dc-ev{display:flex;align-items:center;gap:9px;border:1px solid var(--line);border-radius:11px;padding:10px 12px;font-size:14px;color:var(--text);}
.dc-ev-ic{color:var(--muted);flex-shrink:0;}
.dc-esc-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:10px;}
.dc-esc{border:1px solid var(--line);border-radius:12px;padding:11px 13px;}
.dc-esc-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.dc-esc-title{font-weight:700;font-size:13.5px;color:var(--ink);}
.dc-esc-badge{padding:4px 10px;border-radius:999px;font-size:11.5px;font-weight:800;white-space:nowrap;}
.dc-esc-badge.blue{background:#eff6ff;color:#1d4ed8;}
.dc-esc-badge.ok{background:#ecfdf5;color:#047857;}
.dc-esc-badge.amber{background:#fffbeb;color:#b45309;}
.dc-esc-badge.red{background:#fef2f2;color:#b91c1c;}
.dc-esc-badge.muted{background:#f3f4f6;color:#6b7280;}
.dc-esc-amt{font-weight:800;font-size:14px;color:var(--green-dark);direction:ltr;}
.dc-esc-note{color:var(--muted);font-size:12.5px;margin-top:6px;}
.dc-hint{background:#fffbeb;border:1px solid #fde68a;color:#92400e;border-radius:11px;padding:10px 12px;font-size:12.5px;line-height:1.7;margin-bottom:14px;}
@media(max-width:820px){
.dc-grid{grid-template-columns:1fr;}
.dc-step-label{font-size:11px;}
}
`;

export default function DisputeCase({ id }: { id: string }) {
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [escrows, setEscrows] = useState<EscrowTx[]>([]);
  const [me, setMe] = useState<Me>({});
  const [message, setMessage] = useState('');
  const [decisionType, setDecisionType] = useState('FAVOR_CLIENT');
  const [decisionCustom, setDecisionCustom] = useState('');
  const [decisionReason, setDecisionReason] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deciding, setDeciding] = useState(false);

  function loadEscrows(projectId: string) {
    api<EscrowTx[]>(`/escrow/project/${projectId}`)
      .then((data) => setEscrows(Array.isArray(data) ? data : []))
      .catch(() => setEscrows([]));
  }

  function load() {
    api<Complaint>(`/complaints/${id}`)
      .then((data) => {
        setComplaint(data);
        if (data?.project?.id) loadEscrows(data.project.id);
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) return;
    api<any>('/users/me')
      .then((data) => setMe({ id: data.id, role: data.role, fullName: data.fullName }))
      .catch(() => {});
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const clientId = complaint?.project?.clientId;
  const providerId = complaint?.project?.providerId;
  const isAdmin = me.role === 'ADMIN';
  const isParty = !!me.id && (me.id === clientId || me.id === providerId);
  const isOpen =
    complaint != null &&
    !['RESOLVED', 'CLOSED', 'REJECTED'].includes(complaint.status);
  const decided = !!complaint?.decision;
  const canReply = isOpen && (isParty || isAdmin);

  function roleOf(userId?: string): { label: string; kind: string } {
    if (userId && userId === clientId) return { label: 'العميل', kind: 'client' };
    if (userId && userId === providerId) return { label: 'مقدم الخدمة', kind: 'provider' };
    return { label: 'إدارة محايد · مُحكّم', kind: 'admin' };
  }

  function decisionLabel(d: Decision): string {
    if (d.type === 'OTHER') return d.customType || 'قرار آخر';
    return DECISION_LABELS[d.type] || d.type;
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
    if (decisionType === 'OTHER' && !decisionCustom.trim()) {
      setError('اكتب نوع القرار في الخانة المخصصة.');
      return;
    }
    setDeciding(true);
    setError('');
    try {
      const body: Record<string, unknown> = { type: decisionType, reason: decisionReason };
      if (decisionType === 'OTHER' && decisionCustom.trim()) {
        body.customType = decisionCustom.trim();
      }
      await api(`/complaints/${id}/decide`, { method: 'POST', body });
      setDecisionReason('');
      setDecisionCustom('');
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeciding(false);
    }
  }

  if (loading) {
    return (
      <>
        <style>{DC_CSS}</style>
        <div className="dc-wrap">
          <div className="dc-loading">جاري تحميل ملف النزاع…</div>
        </div>
      </>
    );
  }

  if (!complaint) {
    return (
      <>
        <style>{DC_CSS}</style>
        <div className="dc-wrap">
          {error && <div className="dc-error">{error}</div>}
          <div className="dc-empty">تعذّر تحميل ملف النزاع.</div>
        </div>
      </>
    );
  }

  const status = STATUS_META[complaint.status] || { label: complaint.status, cls: 'muted' };
  const active = stepIndex(complaint.status);
  const opener = roleOf(complaint.creatorId);
  const typeText =
    complaint.type === 'OTHER'
      ? complaint.customType || 'نوع آخر'
      : TYPE_LABELS[complaint.type] || complaint.type;
  const conversation = [
    {
      id: 'opening',
      message: complaint.details,
      responderId: complaint.creatorId,
      createdAt: complaint.createdAt,
      opening: true,
    },
    ...(complaint.responses || []).map((r) => ({ ...r, opening: false })),
  ];

  return (
    <>
      <style>{DC_CSS}</style>
      <div className="dc-wrap">
        {error && <div className="dc-error">{error}</div>}

        <div className="dc-head">
          <div className="dc-head-top">
            <span className="dc-code">
              <Icon name="scale" size={22} />
              ملف نزاع #<span className="dc-num">{complaint.code}</span>
            </span>
            <span className={`dc-status ${status.cls}`}>{status.label}</span>
          </div>
          <div className="dc-sub">
            <span className="dc-type">{typeText}</span>
            {complaint.project && (
              <>
                <span className="dc-sep">·</span>
                <span>{complaint.project.title}</span>
              </>
            )}
            {complaint.createdAt && (
              <>
                <span className="dc-sep">·</span>
                <span>{fmt(complaint.createdAt)}</span>
              </>
            )}
          </div>
          <div className="dc-steps">
            {STEPS.map((s, i) => {
              const cls = i < active ? 'done' : i === active ? (decided ? 'done' : 'active') : '';
              return (
                <div key={s.key} className={`dc-step ${cls}`}>
                  <div className="dc-step-dot">
                    {i < active || (i === active && decided) ? '✓' : i + 1}
                  </div>
                  <div className="dc-step-label">{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dc-grid">
          <div className="dc-main">
            {complaint.decision && (
              <div className="dc-decision">
                <span className="dc-decision-h">
                  <Icon name="badgeCheck" size={17} />
                  قرار إدارة محايد
                </span>
                <div className="dc-decision-type">{decisionLabel(complaint.decision)}</div>
                <div className="dc-decision-reason">{complaint.decision.reason}</div>
                <div className="dc-decision-date">{fmt(complaint.decision.createdAt)}</div>
              </div>
            )}

            <div className="dc-card">
              <div className="dc-card-h">
                <Icon name="fileText" size={17} />
                سجل النزاع والتحكيم
              </div>
              <div className="dc-thread">
                {conversation.map((m) => {
                  const r = roleOf(m.responderId as string | undefined);
                  const mine = !!me.id && m.responderId === me.id;
                  return (
                    <div key={m.id} className={`dc-entry ${r.kind}`}>
                      <div className={`dc-av ${r.kind}`}>
                        <Icon name={r.kind === 'admin' ? 'shield' : 'users'} size={18} />
                      </div>
                      <div className="dc-bubble">
                        <div className="dc-bubble-head">
                          <span className="dc-who">
                            {r.label} {mine && <em>(أنت)</em>}
                          </span>
                          {m.opening && <span className="dc-openchip">فتح النزاع</span>}
                          <span className="dc-time">{fmt(m.createdAt as string)}</span>
                        </div>
                        <div className="dc-bubble-body">{m.message}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {canReply && (
                <form className="dc-form" onSubmit={sendMessage}>
                  <label className="dc-label">
                    {isAdmin ? 'رسالة كمُحكّم (إدارة محايد)' : 'أضف ردّك على النزاع'}
                  </label>
                  <textarea
                    className="dc-textarea"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isAdmin ? 'اكتب توجيه أو استيضاح للطرفين…' : 'اكتب ردّك ووضّح موقفك…'}
                    rows={3}
                    required
                  />
                  <button className="dc-btn primary" type="submit" disabled={sending}>
                    {sending ? 'جاري الإرسال…' : isAdmin ? 'إرسال كمُحكّم' : 'إرسال الرد'}
                  </button>
                </form>
              )}
              {!isOpen && !complaint.decision && (
                <div className="dc-closed">تم إغلاق هذا النزاع.</div>
              )}
            </div>

            <div className="dc-card">
              <div className="dc-card-h">
                <Icon name="folder" size={17} />
                مركز الأدلة والمرفقات
              </div>
              {complaint.evidences && complaint.evidences.length > 0 ? (
                <ul className="dc-ev-list">
                  {complaint.evidences.map((ev, i) => (
                    <li key={(ev as any).id || i} className="dc-ev">
                      <Icon name="fileText" size={16} className="dc-ev-ic" />
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
                <div className="dc-empty">
                  لم تُرفع أدلة بعد. نظام رفع الوثائق والصور الاحترافي قيد التجهيز.
                </div>
              )}
            </div>
          </div>

          <div className="dc-aside">
            <div className="dc-card">
              <div className="dc-card-h">ملخص القضية</div>
              <ul className="dc-summary">
                <li>
                  <span className="dc-k">الحالة</span>
                  <span className="dc-v">{status.label}</span>
                </li>
                <li>
                  <span className="dc-k">نوع النزاع</span>
                  <span className="dc-v">{typeText}</span>
                </li>
                <li>
                  <span className="dc-k">المشروع</span>
                  <span className="dc-v">{complaint.project?.title || '—'}</span>
                </li>
                <li>
                  <span className="dc-k">فاتح النزاع</span>
                  <span className="dc-v">{opener.label}</span>
                </li>
                <li>
                  <span className="dc-k">تاريخ الفتح</span>
                  <span className="dc-v">{fmt(complaint.createdAt)}</span>
                </li>
              </ul>
            </div>

            {escrows.length > 0 && (
              <div className="dc-card">
                <div className="dc-card-h">
                  <Icon name="lock" size={17} />
                  الضمان المرتبط بالنزاع
                </div>
                <ul className="dc-esc-list">
                  {escrows.map((esc) => {
                    const em = ESCROW_META[esc.status] || { label: esc.status, cls: 'muted' };
                    return (
                      <li key={esc.id} className="dc-esc">
                        <div className="dc-esc-top">
                          <span className="dc-esc-title">{esc.milestone?.title || 'مرحلة'}</span>
                          <span className={`dc-esc-badge ${em.cls}`}>{em.label}</span>
                        </div>
                        <div className="dc-esc-note">
                          المبلغ: <span className="dc-esc-amt">{money(esc.amount)}</span> ج.م
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {isAdmin && isOpen && !complaint.decision && (
              <div className="dc-card">
                <div className="dc-card-h">
                  <Icon name="scale" size={17} />
                  إصدار قرار التحكيم
                </div>
                <form onSubmit={submitDecision}>
                  <label className="dc-label">نوع القرار</label>
                  <select
                    className="dc-select"
                    value={decisionType}
                    onChange={(e) => setDecisionType(e.target.value)}
                  >
                    {DECISION_TYPES.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  {decisionType === 'OTHER' && (
                    <input
                      className="dc-input"
                      value={decisionCustom}
                      onChange={(e) => setDecisionCustom(e.target.value)}
                      placeholder="اكتب نوع القرار…"
                      maxLength={120}
                      required
                    />
                  )}
                  {(decisionType === 'FAVOR_CLIENT' || decisionType === 'FAVOR_PROVIDER') && (
                    <div className="dc-hint">
                      {decisionType === 'FAVOR_CLIENT'
                        ? '⚠ عند إصدار القرار سيتم استرجاع المبالغ المحجوزة في الضمان للعميل تلقائيًا.'
                        : '⚠ عند إصدار القرار سيتم تحرير المبالغ المحجوزة في الضمان لمقدّم الخدمة تلقائيًا (مع احتساب عمولة المنصة).'}
                    </div>
                  )}
                  <label className="dc-label">حيثيات القرار</label>
                  <textarea
                    className="dc-textarea"
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    placeholder="اكتب أسباب القرار بوضوح للطرفين…"
                    rows={4}
                    minLength={5}
                    required
                  />
                  <button className="dc-btn dark" type="submit" disabled={deciding}>
                    {deciding ? 'جاري الإصدار…' : 'إصدار القرار النهائي'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
