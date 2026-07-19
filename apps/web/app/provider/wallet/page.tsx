'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Summary = {
  currency: string;
  grossEarnings: number;
  invoiceEarnings: number;
  manualEarnings: number;
  withdrawnCompleted: number;
  withdrawnPending: number;
  available: number;
};

type Txn = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description?: string | null;
  method?: string | null;
  refType?: string | null;
  refId?: string | null;
  date: string;
};

const TYPE_LABEL: Record<string, string> = {
  EARNING: 'إيراد',
  WITHDRAWAL: 'سحب',
  ADJUSTMENT: 'تسوية',
};
const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'مكتمل',
  PENDING: 'قيد المراجعة',
  CANCELLED: 'ملغي',
};
const STATUS_CLASS: Record<string, string> = {
  COMPLETED: 'wl-b-green',
  PENDING: 'wl-b-amber',
  CANCELLED: 'wl-b-gray',
};
const METHOD_LABEL: Record<string, string> = {
  instapay: 'إنستا باي',
  bank: 'تحويل بنكي',
  wallet: 'محفظة إلكترونية',
};

export default function ProviderWalletPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('instapay');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = () => {
    Promise.all([
      api<Summary>('/wallet').then((d) => setSummary(d)),
      api<Txn[]>('/wallet/transactions').then((d) => setTxns(Array.isArray(d) ? d : [])),
    ])
      .catch((e: any) => setError(e?.message || 'حصل خطأ'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const money = (v: number, currency?: string) =>
    `${(Number(v) || 0).toLocaleString('en-US')} ${currency || 'EGP'}`;

  const open = () => { setAmount(''); setMethod('instapay'); setNote(''); setFormErr(''); setShowForm(true); };
  const close = () => { if (!saving) setShowForm(false); };

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { setFormErr('اكتب مبلغ صحيح'); return; }
    if (summary && amt > summary.available) { setFormErr('المبلغ أكبر من رصيدك المتاح'); return; }
    setSaving(true);
    setFormErr('');
    try {
      await api('/wallet/withdrawals', { method: 'POST', body: { amount: amt, method, note: note.trim() || undefined } });
      setShowForm(false);
      setLoading(true);
      load();
    } catch (e: any) {
      setFormErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (t: Txn) => {
    if (!confirm('إلغاء طلب السحب؟')) return;
    try {
      await api(`/wallet/withdrawals/${t.id}`, { method: 'DELETE' });
      setLoading(true);
      load();
    } catch (e: any) {
      alert(e?.message || 'تعذّر الإلغاء');
    }
  };

  const sorted = useMemo(() => txns, [txns]);

  return (
    <ProviderShell active="wallet" title="المحفظة">
      <style>{WL_CSS}</style>
      <div className="wl-wrap">
        {loading ? (
          <div className="wl-state">جاري التحميل...</div>
        ) : error ? (
          <div className="wl-state wl-err">{error}</div>
        ) : (
          <>
            <div className="wl-hero">
              <div className="wl-hero-info">
                <div className="wl-hero-label">الرصيد المتاح للسحب</div>
                <div className="wl-hero-value">{money(summary?.available || 0, summary?.currency)}</div>
                <div className="wl-hero-hint">إجمالي أرباحك: {money(summary?.grossEarnings || 0, summary?.currency)}</div>
              </div>
              <button className="wl-hero-btn" onClick={open} disabled={!summary || summary.available <= 0}>
                <Icon name="landmark" size={16} /> اطلب سحب
              </button>
            </div>

            <div className="wl-stats">
              <div className="wl-stat"><div className="wl-stat-n">{money(summary?.invoiceEarnings || 0, summary?.currency)}</div><div className="wl-stat-l">من الفواتير المدفوعة</div></div>
              <div className="wl-stat"><div className="wl-stat-n">{money(summary?.withdrawnCompleted || 0, summary?.currency)}</div><div className="wl-stat-l">مسحوب</div></div>
              <div className="wl-stat warn"><div className="wl-stat-n">{money(summary?.withdrawnPending || 0, summary?.currency)}</div><div className="wl-stat-l">قيد السحب</div></div>
            </div>

            <div className="wl-panel">
              <div className="wl-panel-h">سجل الحركات</div>
              {sorted.length === 0 ? (
                <div className="wl-empty">لسه مفيش حركات. أول ما فاتورة تتدفع أو تعمل تسوية هتظهر هنا.</div>
              ) : (
                <div className="wl-list">
                  {sorted.map((t) => {
                    const isOut = t.type === 'WITHDRAWAL' || (t.type === 'ADJUSTMENT' && t.amount < 0);
                    const canCancel = t.type === 'WITHDRAWAL' && t.status === 'PENDING' && !t.id.startsWith('inv-');
                    return (
                      <div key={t.id} className="wl-item">
                        <div className="wl-item-main">
                          <div className="wl-item-top">
                            <span className={`wl-type ${isOut ? 'wl-type-out' : 'wl-type-in'}`}>{TYPE_LABEL[t.type] || t.type}</span>
                            <span className={`wl-badge ${STATUS_CLASS[t.status] || 'wl-b-gray'}`}>{STATUS_LABEL[t.status] || t.status}</span>
                            {t.method && <span className="wl-method">{METHOD_LABEL[t.method] || t.method}</span>}
                          </div>
                          {t.description && <p className="wl-desc">{t.description}</p>}
                          <span className="wl-date">{new Date(t.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div className="wl-item-side">
                          <span className={`wl-amount ${isOut ? 'wl-amount-out' : 'wl-amount-in'}`}>
                            {isOut ? '−' : '+'} {money(Math.abs(t.amount), t.currency)}
                          </span>
                          {canCancel && <button className="wl-cancel" onClick={() => cancel(t)}>إلغاء الطلب</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="wl-overlay" onClick={close}>
          <div className="wl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wl-modal-head">
              <h2>طلب سحب</h2>
              <button className="wl-x" onClick={close}>✕</button>
            </div>
            <div className="wl-form">
              <div className="wl-avail">الرصيد المتاح: <b>{money(summary?.available || 0, summary?.currency)}</b></div>
              <label className="wl-field">
                <span>المبلغ</span>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" inputMode="numeric" />
              </label>
              <label className="wl-field">
                <span>طريقة الاستلام</span>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="instapay">إنستا باي</option>
                  <option value="bank">تحويل بنكي</option>
                  <option value="wallet">محفظة إلكترونية</option>
                </select>
              </label>
              <label className="wl-field">
                <span>ملاحظات / بيانات الاستلام</span>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="رقم الحساب / المحفظة أو أي تفاصيل..." />
              </label>

              {formErr && <div className="wl-form-err">{formErr}</div>}

              <div className="wl-form-actions">
                <button className="wl-cancel-btn" onClick={close} disabled={saving}>إلغاء</button>
                <button className="wl-save" onClick={submit} disabled={saving}>
                  {saving ? 'جاري الإرسال...' : 'أرسل الطلب'}
                </button>
              </div>
              <div className="wl-note">طلب السحب بيتراجع من الإدارة قبل التنفيذ. تقدر تلغي طلبك طول ما هو قيد المراجعة.</div>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

const WL_CSS = `
.wl-wrap{max-width:820px;margin:0 auto;}
.wl-state{padding:50px;text-align:center;color:var(--muted);}
.wl-err{color:#b42318;}
.wl-hero{display:flex;justify-content:space-between;align-items:center;gap:16px;background:linear-gradient(120deg,var(--green),var(--green-dark));border-radius:18px;padding:24px 26px;margin-bottom:16px;color:#fff;flex-wrap:wrap;}
.wl-hero-label{font-size:13.5px;opacity:.9;margin-bottom:4px;}
.wl-hero-value{font-size:34px;font-weight:900;line-height:1.1;}
.wl-hero-hint{font-size:13px;opacity:.85;margin-top:6px;}
.wl-hero-btn{display:flex;align-items:center;gap:7px;background:#fff;color:var(--green-dark);border:none;font-weight:800;font-size:14.5px;padding:12px 22px;border-radius:12px;cursor:pointer;font-family:inherit;white-space:nowrap;}
.wl-hero-btn:disabled{opacity:.55;cursor:default;}
.wl-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}
.wl-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.wl-stat.warn{border-color:#f0d9a8;}
.wl-stat-n{font-size:18px;font-weight:900;color:var(--green-dark);}
.wl-stat.warn .wl-stat-n{color:#a86a12;}
.wl-stat-l{font-size:12.5px;color:var(--muted);margin-top:3px;}
.wl-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;}
.wl-panel-h{font-weight:900;color:var(--ink);font-size:16px;margin-bottom:14px;}
.wl-empty{color:var(--muted);font-size:14px;padding:14px 0;text-align:center;}
.wl-list{display:flex;flex-direction:column;gap:10px;}
.wl-item{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:14px 16px;border:1px solid var(--line);border-radius:12px;}
.wl-item-main{min-width:0;flex:1;}
.wl-item-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;}
.wl-type{font-size:12.5px;font-weight:800;padding:3px 11px;border-radius:999px;}
.wl-type-in{background:#e3f4ec;color:#1c7a4f;}
.wl-type-out{background:#fdf0d9;color:#a86a12;}
.wl-badge{font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:999px;}
.wl-b-green{background:#e3f4ec;color:#1c7a4f;}
.wl-b-amber{background:#fdf0d9;color:#a86a12;}
.wl-b-gray{background:#eef1f0;color:#67736f;}
.wl-method{font-size:11.5px;color:var(--muted);background:var(--background);padding:3px 10px;border-radius:999px;}
.wl-desc{font-size:13px;color:var(--ink);margin:2px 0 4px;}
.wl-date{font-size:12px;color:var(--muted);}
.wl-item-side{text-align:left;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:6px;}
.wl-amount{font-size:16px;font-weight:900;white-space:nowrap;}
.wl-amount-in{color:#1c7a4f;}
.wl-amount-out{color:#a86a12;}
.wl-cancel{background:none;border:none;color:#b42318;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;}
.wl-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.wl-modal{background:#fff;border-radius:20px;width:100%;max-width:460px;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.wl-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line);}
.wl-modal-head h2{font-size:17px;font-weight:900;color:var(--ink);margin:0;}
.wl-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;line-height:1;}
.wl-form{padding:22px 24px;}
.wl-avail{background:var(--mint);border-radius:10px;padding:10px 12px;font-size:13.5px;color:var(--green-dark);margin-bottom:14px;}
.wl-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.wl-field span{font-size:13px;font-weight:700;color:var(--ink);}
.wl-field input,.wl-field select,.wl-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.wl-field input:focus,.wl-field select:focus,.wl-field textarea:focus{border-color:var(--green-light);}
.wl-field textarea{resize:vertical;}
.wl-form-err{background:#fdf5f4;color:#b42318;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;margin-bottom:14px;}
.wl-form-actions{display:flex;gap:10px;}
.wl-cancel-btn{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;}
.wl-save{flex:2;background:var(--green);color:#fff;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.wl-save:disabled,.wl-cancel-btn:disabled{opacity:.6;cursor:default;}
.wl-note{font-size:12px;color:var(--muted);margin-top:12px;line-height:1.6;}
@media(max-width:640px){.wl-stats{grid-template-columns:1fr;}.wl-hero-value{font-size:28px;}}
`;
