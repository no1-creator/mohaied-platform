'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Item = { desc: string; qty: number; price: number };
type Client = { id: string; name: string; company?: string | null };
type Invoice = {
  id: string;
  number?: string | null;
  title?: string | null;
  status: string;
  currency?: string | null;
  items: Item[];
  subtotal?: number | string | null;
  taxRate?: number | string | null;
  discount?: number | string | null;
  total?: number | string | null;
  notes?: string | null;
  issueDate?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  client?: Client | null;
};
type Me = {
  fullName?: string;
  email?: string;
  providerProfile?: { companyName?: string | null; headline?: string | null } | null;
};
type Biz = {
  businessName?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  invoiceFooter?: string | null;
};

const STATUS_LABEL: Record<string, string> = { DRAFT: 'مسودة', SENT: 'مُرسلة', PAID: 'مدفوعة', CANCELLED: 'ملغية' };
const STATUS_CLASS: Record<string, string> = { DRAFT: 'iv-b-gray', SENT: 'iv-b-amber', PAID: 'iv-b-green', CANCELLED: 'iv-b-red' };

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id || '');
  const [inv, setInv] = useState<Invoice | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [biz, setBiz] = useState<Biz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!getToken()) { router.push('/login'); return; }
    setLoading(true);
    Promise.all([
      api<Invoice>(`/invoices/${id}`).then((d) => setInv(d)),
      api<Me>('/users/me').then((d) => setMe(d)).catch(() => {}),
      api<Biz>('/business-settings').then((d) => setBiz(d)).catch(() => {}),
    ])
      .catch((e: any) => setError(e?.message || 'تعذّر تحميل الفاتورة'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { if (id) load(); }, [id]);

  const num = (v?: number | string | null) => { const n = Number(v); return Number.isNaN(n) ? 0 : n; };
  const cur = inv?.currency || biz?.businessName ? (inv?.currency || 'EGP') : (inv?.currency || 'EGP');
  const money = (v?: number | string | null) => `${num(v).toLocaleString('en-US')} ${inv?.currency || 'EGP'}`;
  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : '—');

  const setStatus = async (status: string) => {
    if (!inv) return;
    setBusy(true);
    try { await api(`/invoices/${inv.id}`, { method: 'PATCH', body: { status } }); load(); }
    catch (e: any) { alert(e?.message || 'تعذّر التحديث'); }
    finally { setBusy(false); }
  };

  const businessName = biz?.businessName || me?.providerProfile?.companyName || me?.fullName || 'مقدّم الخدمة';
  const businessSub = me?.providerProfile?.headline || '';
  const bizEmail = biz?.email || me?.email;

  return (
    <ProviderShell active="invoices" title="الفاتورة">
      <style>{IV_CSS}</style>
      <div className="iv-wrap">
        {loading ? (
          <div className="iv-state">جاري التحميل...</div>
        ) : error ? (
          <div className="iv-state iv-err">{error}</div>
        ) : !inv ? (
          <div className="iv-state">الفاتورة غير موجودة</div>
        ) : (
          <>
            {/* شريط الأدوات (لا يُطبع) */}
            <div className="iv-toolbar iv-noprint">
              <a className="iv-back" href="/provider/invoices"><Icon name="fileText" size={15} /> رجوع للفواتير</a>
              <div className="iv-tools">
                {inv.status !== 'SENT' && inv.status !== 'PAID' && (
                  <button className="iv-tool" disabled={busy} onClick={() => setStatus('SENT')}>علّم كمُرسلة</button>
                )}
                {inv.status !== 'PAID' && (
                  <button className="iv-tool iv-tool-green" disabled={busy} onClick={() => setStatus('PAID')}>علّم كمدفوعة</button>
                )}
                <button className="iv-print-btn" onClick={() => window.print()}><Icon name="fileText" size={15} /> طباعة / PDF</button>
              </div>
            </div>

            {/* مستند الفاتورة */}
            <div className="iv-print">
              <div className="iv-doc">
                <div className="iv-head">
                  <div className="iv-biz">
                    {biz?.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="iv-logo" src={biz.logoUrl} alt="logo" />
                    )}
                    <div>
                      <div className="iv-biz-name">{businessName}</div>
                      {businessSub && <div className="iv-biz-sub">{businessSub}</div>}
                      {biz?.phone && <div className="iv-biz-c">{biz.phone}</div>}
                      {bizEmail && <div className="iv-biz-c">{bizEmail}</div>}
                      {biz?.website && <div className="iv-biz-c">{biz.website}</div>}
                      {biz?.address && <div className="iv-biz-c">{biz.address}</div>}
                      {biz?.taxNumber && <div className="iv-biz-c">رقم ضريبي: {biz.taxNumber}</div>}
                    </div>
                  </div>
                  <div className="iv-head-r">
                    <div className="iv-doc-title">فاتورة</div>
                    <div className="iv-doc-num">{inv.number || '—'}</div>
                    <span className={`iv-badge ${STATUS_CLASS[inv.status] || 'iv-b-gray'}`}>{STATUS_LABEL[inv.status] || inv.status}</span>
                  </div>
                </div>

                <div className="iv-meta">
                  <div className="iv-to">
                    <div className="iv-label">إلى</div>
                    <div className="iv-to-name">{inv.client?.name || 'عميل'}</div>
                    {inv.client?.company && <div className="iv-to-c">{inv.client.company}</div>}
                  </div>
                  <div className="iv-dates">
                    <div><span>تاريخ الإصدار:</span> {fmt(inv.issueDate || inv.createdAt)}</div>
                    <div><span>تاريخ الاستحقاق:</span> {fmt(inv.dueDate)}</div>
                    {inv.paidAt && <div><span>تاريخ الدفع:</span> {fmt(inv.paidAt)}</div>}
                  </div>
                </div>

                {inv.title && <div className="iv-subject">{inv.title}</div>}

                <table className="iv-table">
                  <thead>
                    <tr>
                      <th className="iv-c-idx">#</th>
                      <th>الوصف</th>
                      <th className="iv-c-num">الكمية</th>
                      <th className="iv-c-num">سعر الوحدة</th>
                      <th className="iv-c-num">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inv.items || []).map((it, i) => (
                      <tr key={i}>
                        <td className="iv-c-idx">{i + 1}</td>
                        <td>{it.desc}</td>
                        <td className="iv-c-num">{num(it.qty).toLocaleString('en-US')}</td>
                        <td className="iv-c-num">{money(it.price)}</td>
                        <td className="iv-c-num">{money(num(it.qty) * num(it.price))}</td>
                      </tr>
                    ))}
                    {(!inv.items || inv.items.length === 0) && (
                      <tr><td colSpan={5} className="iv-noitems">لا توجد بنود</td></tr>
                    )}
                  </tbody>
                </table>

                <div className="iv-totals">
                  <div className="iv-t-row"><span>المجموع الفرعي</span><span>{money(inv.subtotal)}</span></div>
                  <div className="iv-t-row"><span>الضريبة ({num(inv.taxRate)}%)</span><span>{money((num(inv.subtotal) * num(inv.taxRate)) / 100)}</span></div>
                  {num(inv.discount) > 0 && <div className="iv-t-row"><span>الخصم</span><span>− {money(inv.discount)}</span></div>}
                  <div className="iv-t-row iv-t-grand"><span>الإجمالي</span><span>{money(inv.total)}</span></div>
                </div>

                {inv.notes && (
                  <div className="iv-notes">
                    <div className="iv-label">ملاحظات</div>
                    <p>{inv.notes}</p>
                  </div>
                )}

                <div className="iv-footer">{biz?.invoiceFooter || `تم إصدار هذه الفاتورة عبر منصة محايد · ${businessName}`}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </ProviderShell>
  );
}

const IV_CSS = `
.iv-wrap{max-width:820px;margin:0 auto;}
.iv-state{padding:50px;text-align:center;color:var(--muted);}
.iv-err{color:#b42318;}
.iv-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.iv-back{display:flex;align-items:center;gap:6px;color:var(--muted);text-decoration:none;font-size:13.5px;font-weight:700;}
.iv-back:hover{color:var(--green-dark);}
.iv-tools{display:flex;gap:8px;flex-wrap:wrap;}
.iv-tool{background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px 14px;font-family:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;}
.iv-tool:hover{border-color:var(--green-light);}
.iv-tool-green{color:var(--green-dark);border-color:var(--green-light);}
.iv-tool:disabled{opacity:.6;cursor:default;}
.iv-print-btn{display:flex;align-items:center;gap:6px;background:var(--green);color:#fff;border:none;border-radius:10px;padding:9px 16px;font-family:inherit;font-size:13px;font-weight:800;cursor:pointer;}
.iv-print-btn:hover{background:var(--green-dark);}
.iv-doc{background:#fff;border:1px solid var(--line);border-radius:16px;padding:36px 40px;}
.iv-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:24px;border-bottom:2px solid var(--green);}
.iv-biz{display:flex;gap:14px;align-items:flex-start;}
.iv-logo{width:64px;height:64px;object-fit:contain;border-radius:10px;border:1px solid var(--line);background:#fff;flex-shrink:0;}
.iv-biz-name{font-size:22px;font-weight:900;color:var(--green-dark);}
.iv-biz-sub{font-size:13.5px;color:var(--muted);margin-top:2px;}
.iv-biz-c{font-size:12.5px;color:var(--muted);margin-top:2px;}
.iv-head-r{text-align:left;flex-shrink:0;}
.iv-doc-title{font-size:26px;font-weight:900;color:var(--ink);letter-spacing:1px;}
.iv-doc-num{font-size:14px;color:var(--muted);font-weight:700;margin:2px 0 8px;}
.iv-badge{font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px;}
.iv-b-green{background:#e3f4ec;color:#1c7a4f;}
.iv-b-amber{background:#fdf0d9;color:#a86a12;}
.iv-b-red{background:#fdecec;color:#b42318;}
.iv-b-gray{background:#eef1f0;color:#67736f;}
.iv-meta{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:24px 0;}
.iv-label{font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px;}
.iv-to-name{font-size:16px;font-weight:800;color:var(--ink);}
.iv-to-c{font-size:13px;color:var(--muted);margin-top:2px;}
.iv-dates{text-align:left;font-size:13px;color:var(--ink);line-height:2;}
.iv-dates span{color:var(--muted);}
.iv-subject{font-size:15px;font-weight:800;color:var(--ink);background:var(--mint);border-radius:10px;padding:10px 14px;margin-bottom:16px;}
.iv-table{width:100%;border-collapse:collapse;margin-bottom:20px;}
.iv-table th{background:var(--background);text-align:right;font-size:12.5px;font-weight:800;color:var(--muted);padding:11px 12px;border-bottom:1px solid var(--line);}
.iv-table td{padding:12px;font-size:13.5px;color:var(--ink);border-bottom:1px solid var(--line);}
.iv-c-idx{width:40px;text-align:center;color:var(--muted);}
.iv-c-num{text-align:left;white-space:nowrap;}
.iv-table th.iv-c-num{text-align:left;}
.iv-noitems{text-align:center;color:var(--muted);padding:20px;}
.iv-totals{max-width:320px;margin-right:auto;margin-left:0;}
.iv-t-row{display:flex;justify-content:space-between;font-size:14px;color:var(--ink);padding:7px 0;}
.iv-t-row span:first-child{color:var(--muted);}
.iv-t-grand{border-top:2px solid var(--green);margin-top:6px;padding-top:12px;font-size:18px;font-weight:900;color:var(--green-dark);}
.iv-t-grand span:first-child{color:var(--ink);}
.iv-notes{margin-top:24px;padding-top:20px;border-top:1px dashed var(--line);}
.iv-notes p{font-size:13.5px;color:var(--ink);line-height:1.8;margin:0;white-space:pre-wrap;}
.iv-footer{margin-top:28px;padding-top:16px;border-top:1px solid var(--line);text-align:center;font-size:12px;color:var(--muted);white-space:pre-wrap;}
@media(max-width:600px){.iv-doc{padding:24px 20px;}.iv-head{flex-direction:column;}.iv-head-r{text-align:right;}.iv-totals{max-width:100%;}}
@media print{
  body * { visibility: hidden !important; }
  .iv-print, .iv-print * { visibility: visible !important; }
  .iv-print { position: absolute; inset: 0; margin: 0; padding: 0; width: 100%; }
  .iv-doc { border: none !important; border-radius: 0 !important; padding: 0 !important; }
  .iv-noprint { display: none !important; }
}
`;
