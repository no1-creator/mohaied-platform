'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Icon from '@/components/Icon';

type Milestone = {
  id: string;
  title: string;
  value: number | string;
  status: string;
  orderIndex: number;
};

type Escrow = {
  id: string;
  milestoneId: string;
  amount: string | number;
  commissionRate: string | number;
  commissionAmount: string | number;
  netAmount: string | number;
  status: 'PENDING' | 'FUNDED' | 'RELEASED' | 'REFUNDED' | 'DISPUTED';
};

const ES_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'بانتظار التمويل', cls: 'muted' },
  FUNDED: { label: 'مموّلة — محجوزة في الضمان', cls: 'blue' },
  RELEASED: { label: 'محرّرة لمقدّم الخدمة', cls: 'ok' },
  REFUNDED: { label: 'مُستردّة للعميل', cls: 'amber' },
  DISPUTED: { label: 'في نزاع', cls: 'red' },
};

export default function EscrowPanel({ projectId }: { projectId: string }) {
  const [role, setRole] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [me, ms] = await Promise.all([
          api<{ role: string }>('/users/me'),
          api<Milestone[]>(`/milestones/project/${projectId}`),
        ]);
        setRole(me.role);
        setMilestones(ms);
        await loadEscrows();
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function loadEscrows() {
    try {
      const list = await api<Escrow[]>(`/escrow/project/${projectId}`);
      setEscrows(list);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function act(fn: () => Promise<any>, key: string) {
    setBusy(key);
    setError('');
    try {
      await fn();
      await loadEscrows();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  const fund = (mId: string) =>
    act(() => api(`/escrow/milestones/${mId}/fund`, { method: 'POST' }), 'm' + mId);
  const release = (eId: string) =>
    act(() => api(`/escrow/${eId}/release`, { method: 'PATCH' }), 'e' + eId);
  const dispute = (eId: string) =>
    act(() => api(`/escrow/${eId}/dispute`, { method: 'PATCH' }), 'e' + eId);
  const refund = (eId: string) =>
    act(() => api(`/escrow/${eId}/refund`, { method: 'PATCH' }), 'e' + eId);

  const escrowFor = (mId: string) => escrows.find((e) => e.milestoneId === mId);
  const money = (v: string | number) => Number(v).toLocaleString('en-US');

  return (
    <div className="es-wrap">
      <style>{ES_CSS}</style>
      <div className="es-title">
        <Icon name="lock" size={18} /> الضمان المالي للمشروع
      </div>
      <p className="es-hint">
        فلوس كل مرحلة بتتحجز عندنا لحد ما المرحلة تتوافق عليها، وبعدها بتتحرّر لمقدّم الخدمة بعد
        خصم عمولة المنصة. في حالة الخلاف، إدارة محايد بتتدخّل للفصل.
      </p>

      {error && <div className="es-error">{error}</div>}

      {loading ? (
        <div className="es-loading">جاري تحميل حالة الضمان...</div>
      ) : milestones.length === 0 ? (
        <div className="es-empty">مفيش مراحل للمشروع لسه.</div>
      ) : (
        <div className="es-list">
          {milestones.map((m, i) => {
            const esc = escrowFor(m.id);
            const st = esc ? ES_STATUS[esc.status] : null;
            const bk = esc ? 'e' + esc.id : 'm' + m.id;
            return (
              <div key={m.id} className="es-item">
                <div className="es-item-head">
                  <span className="es-item-name">
                    {i + 1}. {m.title}
                  </span>
                  {st ? (
                    <span className={`es-badge ${st.cls}`}>{st.label}</span>
                  ) : (
                    <span className="es-badge muted">لم تُموّل بعد</span>
                  )}
                </div>

                <div className="es-amounts">
                  <div className="es-amt">
                    <span>قيمة المرحلة</span>
                    <b>{money(esc ? esc.amount : m.value)} ج.م</b>
                  </div>
                  {esc && (
                    <>
                      <div className="es-amt">
                        <span>عمولة المنصة ({Number(esc.commissionRate)}%)</span>
                        <b>{money(esc.commissionAmount)} ج.م</b>
                      </div>
                      <div className="es-amt">
                        <span>صافي لمقدّم الخدمة</span>
                        <b className="es-net">{money(esc.netAmount)} ج.م</b>
                      </div>
                    </>
                  )}
                </div>

                <div className="es-actions">
                  {!esc && role === 'CLIENT' && (
                    <button className="es-btn" onClick={() => fund(m.id)} disabled={busy === bk}>
                      {busy === bk ? 'جاري التمويل...' : 'تمويل المرحلة'}
                    </button>
                  )}
                  {!esc && role !== 'CLIENT' && (
                    <span className="es-note">بانتظار تمويل العميل للمرحلة.</span>
                  )}

                  {esc && esc.status === 'FUNDED' && (
                    <>
                      {(role === 'CLIENT' || role === 'ADMIN') && (
                        <button className="es-btn" onClick={() => release(esc.id)} disabled={busy === bk}>
                          {busy === bk ? '...' : 'تحرير الفلوس لمقدّم الخدمة'}
                        </button>
                      )}
                      {role === 'ADMIN' && (
                        <button className="es-btn ghost" onClick={() => refund(esc.id)} disabled={busy === bk}>
                          استرداد للعميل
                        </button>
                      )}
                      {(role === 'CLIENT' || role === 'PROVIDER') && (
                        <button className="es-btn danger" onClick={() => dispute(esc.id)} disabled={busy === bk}>
                          فتح نزاع
                        </button>
                      )}
                    </>
                  )}

                  {esc && esc.status === 'DISPUTED' && (
                    <>
                      {role === 'ADMIN' ? (
                        <>
                          <button className="es-btn" onClick={() => release(esc.id)} disabled={busy === bk}>
                            تحرير لمقدّم الخدمة
                          </button>
                          <button className="es-btn ghost" onClick={() => refund(esc.id)} disabled={busy === bk}>
                            استرداد للعميل
                          </button>
                        </>
                      ) : (
                        <span className="es-note">في نزاع — بانتظار قرار إدارة محايد.</span>
                      )}
                    </>
                  )}

                  {esc && esc.status === 'RELEASED' && (
                    <span className="es-note ok">
                      اتحرّر {money(esc.netAmount)} ج.م لمقدّم الخدمة ✅
                    </span>
                  )}
                  {esc && esc.status === 'REFUNDED' && (
                    <span className="es-note">اترجّع المبلغ للعميل.</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ES_CSS = `
.es-wrap{background:#fff;border:1px solid var(--line);border-radius:16px;padding:22px;margin:22px 0;box-shadow:0 6px 20px rgba(23,33,31,.05);}
.es-title{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:800;color:var(--ink);margin-bottom:6px;}
.es-title svg{color:var(--green);}
.es-hint{font-size:13px;color:var(--muted);line-height:1.7;margin:0 0 16px;}
.es-error{background:#fef2f2;color:#b91c1c;border:1px solid #fecaca;border-radius:10px;padding:10px 14px;font-size:13.5px;margin-bottom:14px;}
.es-empty,.es-loading{color:var(--muted);font-size:14px;padding:10px 0;}
.es-list{display:flex;flex-direction:column;gap:14px;}
.es-item{border:1px solid var(--line);border-radius:13px;padding:16px;background:var(--background);}
.es-item-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px;flex-wrap:wrap;}
.es-item-name{font-weight:800;color:var(--ink);font-size:15px;}
.es-badge{padding:4px 11px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap;}
.es-badge.muted{background:#eef1f0;color:var(--muted);}
.es-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.es-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.es-badge.amber{background:#fdf3dd;color:#96690f;}
.es-badge.red{background:#fdeceb;color:#b4322b;}
.es-amounts{display:flex;flex-wrap:wrap;gap:22px;margin-bottom:14px;}
.es-amt{display:flex;flex-direction:column;gap:3px;}
.es-amt span{font-size:12px;color:var(--muted);}
.es-amt b{font-size:15px;color:var(--ink);font-weight:800;}
.es-amt .es-net{color:var(--green-dark);}
.es-actions{display:flex;flex-wrap:wrap;gap:9px;align-items:center;}
.es-btn{border:none;background:var(--green);color:#fff;padding:9px 16px;border-radius:10px;font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit;}
.es-btn:hover{background:var(--green-dark);}
.es-btn:disabled{opacity:.55;cursor:default;}
.es-btn.ghost{background:var(--mint);color:var(--green-dark);}
.es-btn.danger{background:#fff;color:#b4322b;border:1px solid #f2cecb;}
.es-btn.danger:hover{background:#fdeceb;}
.es-note{font-size:13px;color:var(--muted);}
.es-note.ok{color:#1c7a4f;font-weight:700;}
`;
