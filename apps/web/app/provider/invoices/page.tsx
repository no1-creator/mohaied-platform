'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
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
  clientId?: string | null;
  createdAt: string;
  client?: Client | null;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة',
  SENT: 'مُرسلة',
  PAID: 'مدفوعة',
  CANCELLED: 'ملغية',
};
const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'in-b-gray',
  SENT: 'in-b-amber',
  PAID: 'in-b-green',
  CANCELLED: 'in-b-red',
};

const EMPTY_ITEM = { desc: '', qty: '1', price: '' };
const EMPTY = {
  clientId: '',
  number: '',
  title: '',
  status: 'DRAFT',
  currency: 'EGP',
  taxRate: '0',
  discount: '0',
  notes: '',
  issueDate: '',
  dueDate: '',
  items: [{ ...EMPTY_ITEM }],
};

export default function ProviderInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY, items: [{ ...EMPTY_ITEM }] });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const loadInvoices = () => {
    api<Invoice[]>('/invoices')
      .then((d) => setInvoices(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e?.message || 'حصل خطأ'));
  };

  useEffect(() => {
    Promise.all([
      api<Invoice[]>('/invoices').then((d) => setInvoices(Array.isArray(d) ? d : [])),
      api<Client[]>('/clients').then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {}),
    ])
      .catch((e: any) => setError(e?.message || 'حصل خطأ'))
      .finally(() => setLoading(false));
  }, []);

  const num = (v?: number | string | null) => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };
  const money = (v?: number | string | null, currency?: string | null) =>
    `${num(v).toLocaleString('en-US')} ${currency || 'EGP'}`;

  const stats = useMemo(() => {
    const paid = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + num(i.total), 0);
    const outstanding = invoices
      .filter((i) => i.status === 'SENT')
      .reduce((s, i) => s + num(i.total), 0);
    return { count: invoices.length, paid, outstanding };
  }, [invoices]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return invoices;
    return invoices.filter((i) =>
      [i.number, i.title, i.client?.name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [invoices, q]);

  const set = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));
  const setItem = (idx: number, k: string, v: string) =>
    setForm((f: any) => ({
      ...f,
      items: f.items.map((it: any, i: number) => (i === idx ? { ...it, [k]: v } : it)),
    }));
  const addItem = () => setForm((f: any) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  const delItem = (idx: number) =>
    setForm((f: any) => ({
      ...f,
      items: f.items.length > 1 ? f.items.filter((_: any, i: number) => i !== idx) : f.items,
    }));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY, items: [{ ...EMPTY_ITEM }] });
    setFormErr('');
    setShowForm(true);
  };
  const openEdit = (inv: Invoice) => {
    setEditId(inv.id);
    setForm({
      clientId: inv.clientId || '',
      number: inv.number || '',
      title: inv.title || '',
      status: (inv.status || 'DRAFT').toUpperCase(),
      currency: inv.currency || 'EGP',
      taxRate: inv.taxRate != null ? String(inv.taxRate) : '0',
      discount: inv.discount != null ? String(inv.discount) : '0',
      notes: inv.notes || '',
      issueDate: inv.issueDate ? String(inv.issueDate).slice(0, 10) : '',
      dueDate: inv.dueDate ? String(inv.dueDate).slice(0, 10) : '',
      items:
        inv.items && inv.items.length
          ? inv.items.map((it) => ({ desc: it.desc || '', qty: String(it.qty ?? 1), price: String(it.price ?? '') }))
          : [{ ...EMPTY_ITEM }],
    });
    setFormErr('');
    setShowForm(true);
  };
  const close = () => { if (!saving) setShowForm(false); };

  const liveSubtotal = form.items.reduce(
    (s: number, it: any) => s + (Number(it.qty) || 0) * (Number(it.price) || 0),
    0,
  );
  const liveTax = (liveSubtotal * (Number(form.taxRate) || 0)) / 100;
  const liveTotal = liveSubtotal + liveTax - (Number(form.discount) || 0);

  const save = async () => {
    const items = form.items
      .filter((it: any) => String(it.desc).trim() !== '')
      .map((it: any) => ({
        desc: String(it.desc).trim(),
        qty: Number(it.qty) || 0,
        price: Number(it.price) || 0,
      }));
    if (items.length === 0) { setFormErr('أضف بند واحد على الأقل بوصف'); return; }
    setSaving(true);
    setFormErr('');
    const body = {
      clientId: form.clientId || undefined,
      number: form.number.trim() || undefined,
      title: form.title.trim() || undefined,
      status: form.status,
      currency: form.currency || 'EGP',
      items,
      taxRate: Number(form.taxRate) || 0,
      discount: Number(form.discount) || 0,
      notes: form.notes.trim() || undefined,
      issueDate: form.issueDate || undefined,
      dueDate: form.dueDate || undefined,
    };
    try {
      if (editId) {
        await api(`/invoices/${editId}`, { method: 'PATCH', body });
      } else {
        await api('/invoices', { method: 'POST', body });
      }
      setShowForm(false);
      loadInvoices();
    } catch (e: any) {
      setFormErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (inv: Invoice) => {
    if (!confirm(`متأكد إنك عايز تمسح الفاتورة «${inv.number || inv.title || ''}»؟`)) return;
    try {
      await api(`/invoices/${inv.id}`, { method: 'DELETE' });
      setInvoices((list) => list.filter((i) => i.id !== inv.id));
    } catch (e: any) {
      alert(e?.message || 'تعذّر الحذف');
    }
  };

  return (
    <ProviderShell active="invoices" title="الفواتير">
      <style>{IN_CSS}</style>
      <div className="in-wrap">
        {loading ? (
          <div className="in-state">جاري التحميل...</div>
        ) : error ? (
          <div className="in-state in-err">{error}</div>
        ) : (
          <>
            <div className="in-stats">
              <div className="in-stat"><div className="in-stat-n">{stats.count}</div><div className="in-stat-l">إجمالي الفواتير</div></div>
              <div className="in-stat good"><div className="in-stat-n">{money(stats.paid)}</div><div className="in-stat-l">مدفوع</div></div>
              <div className="in-stat warn"><div className="in-stat-n">{money(stats.outstanding)}</div><div className="in-stat-l">مستحق (مُرسل)</div></div>
            </div>

            <div className="in-bar">
              <div className="in-search">
                <Icon name="search" size={17} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث برقم الفاتورة أو العميل..." />
              </div>
              <button className="in-add" onClick={openAdd}>
                <Icon name="plus" size={16} /> فاتورة جديدة
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="in-empty">
                <div className="in-empty-ic"><Icon name="fileText" size={30} /></div>
                <h3>{invoices.length === 0 ? 'لسه معملتش فواتير' : 'مفيش نتايج'}</h3>
                <p>اعمل فواتير احترافية لعملائك وتابع المدفوع والمستحق في مكان واحد.</p>
                {invoices.length === 0 && <button className="in-empty-btn" onClick={openAdd}>أنشئ أول فاتورة</button>}
              </div>
            ) : (
              <div className="in-list">
                {filtered.map((inv) => (
                  <div key={inv.id} className="in-card" onClick={() => openEdit(inv)}>
                    <div className="in-card-main">
                      <div className="in-card-head">
                        <span className="in-num">{inv.number || '—'}</span>
                        <span className={`in-badge ${STATUS_CLASS[inv.status] || 'in-b-gray'}`}>
                          {STATUS_LABEL[inv.status] || inv.status}
                        </span>
                      </div>
                      {inv.title && <p className="in-title">{inv.title}</p>}
                      <div className="in-meta">
                        {inv.client?.name && <span className="in-m"><Icon name="user" size={13} /> {inv.client.name}</span>}
                        {inv.dueDate && <span className="in-m"><Icon name="clock" size={13} /> استحقاق: {new Date(inv.dueDate).toLocaleDateString('ar-EG')}</span>}
                      </div>
                    </div>
                   <div className="in-card-side">
  <div className="in-total">{money(inv.total, inv.currency)}</div>
  <div className="in-card-btns">
    <a className="in-view" href={`/provider/invoices/${inv.id}`} onClick={(e) => e.stopPropagation()}>عرض / طباعة</a>
    <button className="in-del" onClick={(e) => { e.stopPropagation(); remove(inv); }}>حذف</button>
  </div>
</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="in-overlay" onClick={close}>
          <div className="in-modal" onClick={(e) => e.stopPropagation()}>
            <div className="in-modal-head">
              <h2>{editId ? 'تعديل فاتورة' : 'فاتورة جديدة'}</h2>
              <button className="in-x" onClick={close}>✕</button>
            </div>
            <div className="in-form">
              <div className="in-row">
                <label className="in-field">
                  <span>العميل</span>
                  <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
                    <option value="">— بدون —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="in-field">
                  <span>الحالة</span>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="DRAFT">مسودة</option>
                    <option value="SENT">مُرسلة</option>
                    <option value="PAID">مدفوعة</option>
                    <option value="CANCELLED">ملغية</option>
                  </select>
                </label>
              </div>
              <div className="in-row">
                <label className="in-field">
                  <span>رقم الفاتورة</span>
                  <input value={form.number} onChange={(e) => set('number', e.target.value)} placeholder="تلقائي لو فاضي" />
                </label>
                <label className="in-field">
                  <span>عنوان الفاتورة</span>
                  <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: خدمات تصميم" />
                </label>
              </div>

              <div className="in-items">
                <div className="in-items-head">
                  <span>البنود</span>
                  <button type="button" className="in-additem" onClick={addItem}><Icon name="plus" size={13} /> بند</button>
                </div>
                {form.items.map((it: any, idx: number) => (
                  <div key={idx} className="in-item-row">
                    <input className="in-i-desc" value={it.desc} onChange={(e) => setItem(idx, 'desc', e.target.value)} placeholder="الوصف" />
                    <input className="in-i-qty" value={it.qty} onChange={(e) => setItem(idx, 'qty', e.target.value)} placeholder="عدد" inputMode="numeric" />
                    <input className="in-i-price" value={it.price} onChange={(e) => setItem(idx, 'price', e.target.value)} placeholder="سعر" inputMode="numeric" />
                    <button type="button" className="in-i-del" onClick={() => delItem(idx)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="in-row">
                <label className="in-field">
                  <span>ضريبة (%)</span>
                  <input value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} inputMode="numeric" />
                </label>
                <label className="in-field">
                  <span>خصم (قيمة)</span>
                  <input value={form.discount} onChange={(e) => set('discount', e.target.value)} inputMode="numeric" />
                </label>
                <label className="in-field">
                  <span>العملة</span>
                  <input value={form.currency} onChange={(e) => set('currency', e.target.value)} />
                </label>
              </div>
              <div className="in-row">
                <label className="in-field">
                  <span>تاريخ الإصدار</span>
                  <input type="date" value={form.issueDate} onChange={(e) => set('issueDate', e.target.value)} />
                </label>
                <label className="in-field">
                  <span>تاريخ الاستحقاق</span>
                  <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
                </label>
              </div>
              <label className="in-field">
                <span>ملاحظات</span>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="شروط الدفع أو أي ملاحظات..." />
              </label>

              <div className="in-totals">
                <div className="in-t-row"><span>المجموع الفرعي</span><span>{money(liveSubtotal, form.currency)}</span></div>
                <div className="in-t-row"><span>الضريبة</span><span>{money(liveTax, form.currency)}</span></div>
                <div className="in-t-row"><span>الخصم</span><span>− {money(Number(form.discount) || 0, form.currency)}</span></div>
                <div className="in-t-row in-t-total"><span>الإجمالي</span><span>{money(liveTotal, form.currency)}</span></div>
              </div>

              {formErr && <div className="in-form-err">{formErr}</div>}

              <div className="in-form-actions">
                <button className="in-cancel" onClick={close} disabled={saving}>إلغاء</button>
                <button className="in-save" onClick={save} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

const IN_CSS = `
.in-wrap{max-width:900px;margin:0 auto;}
.in-state{padding:50px;text-align:center;color:var(--muted);}
.in-err{color:#b42318;}
.in-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}
.in-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.in-stat.good{border-color:var(--green-light);}
.in-stat.warn{border-color:#f0d9a8;}
.in-stat-n{font-size:19px;font-weight:900;color:var(--green-dark);}
.in-stat.warn .in-stat-n{color:#a86a12;}
.in-stat-l{font-size:12.5px;color:var(--muted);margin-top:3px;}
.in-bar{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.in-search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 14px;}
.in-search svg{color:var(--muted);flex-shrink:0;}
.in-search input{border:none;outline:none;background:transparent;padding:12px 0;width:100%;font-family:inherit;font-size:14px;color:var(--ink);}
.in-add{display:flex;align-items:center;gap:6px;background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:0 20px;border-radius:12px;cursor:pointer;font-family:inherit;}
.in-add:hover{background:var(--green-dark);}
.in-list{display:flex;flex-direction:column;gap:12px;}
.in-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px 20px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:space-between;gap:14px;}
.in-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.08);}
.in-card-main{min-width:0;flex:1;}
.in-card-head{display:flex;align-items:center;gap:10px;margin-bottom:4px;}
.in-num{font-size:15px;font-weight:900;color:var(--ink);}
.in-badge{font-size:11.5px;font-weight:800;padding:3px 11px;border-radius:999px;white-space:nowrap;}
.in-b-green{background:#e3f4ec;color:#1c7a4f;}
.in-b-amber{background:#fdf0d9;color:#a86a12;}
.in-b-red{background:#fdecec;color:#b42318;}
.in-b-gray{background:#eef1f0;color:#67736f;}
.in-title{font-size:13.5px;color:var(--muted);margin:0 0 6px;}
.in-meta{display:flex;flex-wrap:wrap;gap:14px;}
.in-m{display:flex;align-items:center;gap:5px;color:var(--muted);font-size:12.5px;}
.in-m svg{color:var(--green);}
.in-card-side{text-align:left;flex-shrink:0;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
.in-total{font-size:17px;font-weight:900;color:var(--green-dark);white-space:nowrap;}
.in-del{background:none;border:none;color:#b42318;font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;}
.in-card-btns{display:flex;align-items:center;gap:10px;}
.in-view{color:var(--green-dark);font-weight:800;font-size:12.5px;text-decoration:none;cursor:pointer;}
.in-view:hover{text-decoration:underline;}
.in-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.in-empty-ic{color:var(--green);margin-bottom:10px;}
.in-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.in-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.in-empty-btn{background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;font-family:inherit;}
.in-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.in-modal{background:#fff;border-radius:20px;width:100%;max-width:600px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.in-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;z-index:1;}
.in-modal-head h2{font-size:17px;font-weight:900;color:var(--ink);margin:0;}
.in-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;line-height:1;}
.in-form{padding:22px 24px;}
.in-row{display:flex;gap:12px;}
.in-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;flex:1;}
.in-field span{font-size:13px;font-weight:700;color:var(--ink);}
.in-field input,.in-field select,.in-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.in-field input:focus,.in-field select:focus,.in-field textarea:focus{border-color:var(--green-light);}
.in-field textarea{resize:vertical;}
.in-items{background:var(--background);border:1px solid var(--line);border-radius:12px;padding:14px;margin-bottom:14px;}
.in-items-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.in-items-head span{font-size:13px;font-weight:800;color:var(--ink);}
.in-additem{display:flex;align-items:center;gap:4px;background:#fff;border:1px solid var(--line);border-radius:9px;padding:6px 12px;font-family:inherit;font-size:12.5px;font-weight:700;color:var(--green-dark);cursor:pointer;}
.in-item-row{display:flex;gap:8px;margin-bottom:8px;}
.in-item-row input{border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;color:var(--ink);outline:none;background:#fff;}
.in-i-desc{flex:1;}
.in-i-qty{width:64px;text-align:center;}
.in-i-price{width:90px;text-align:center;}
.in-i-del{background:none;border:none;color:#b42318;font-size:15px;cursor:pointer;padding:0 4px;flex-shrink:0;}
.in-totals{background:var(--mint);border-radius:12px;padding:14px 16px;margin-bottom:14px;}
.in-t-row{display:flex;justify-content:space-between;font-size:13.5px;color:var(--ink);padding:4px 0;}
.in-t-total{border-top:1px dashed var(--green-light);margin-top:6px;padding-top:10px;font-size:16px;font-weight:900;color:var(--green-dark);}
.in-form-err{background:#fdf5f4;color:#b42318;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;margin-bottom:14px;}
.in-form-actions{display:flex;gap:10px;}
.in-cancel{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;}
.in-save{flex:2;background:var(--green);color:#fff;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.in-save:disabled,.in-cancel:disabled{opacity:.6;cursor:default;}
@media(max-width:640px){.in-stats{grid-template-columns:1fr;}.in-row{flex-direction:column;gap:0;}.in-stat-n{font-size:17px;}}
`;
