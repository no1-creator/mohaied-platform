'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Client = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  source?: string | null;
  notes?: string | null;
  createdAt: string;
};

const EMPTY = { name: '', company: '', email: '', phone: '', whatsapp: '', source: 'EXTERNAL', notes: '' };

export default function ProviderClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = () => {
    setLoading(true);
    api<Client[]>('/clients')
      .then((d) => setClients(Array.isArray(d) ? d : []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return clients;
    return clients.filter((c) =>
      [c.name, c.company, c.email, c.phone, c.whatsapp, c.notes]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t))
    );
  }, [clients, q]);

  const openAdd = () => { setEditId(null); setForm({ ...EMPTY }); setFormErr(''); setShowForm(true); };
  const openEdit = (c: Client) => {
    setEditId(c.id);
    setForm({
      name: c.name || '',
      company: c.company || '',
      email: c.email || '',
      phone: c.phone || '',
      whatsapp: c.whatsapp || '',
      source: c.source || 'EXTERNAL',
      notes: c.notes || '',
    });
    setFormErr('');
    setShowForm(true);
  };
  const close = () => { if (!saving) setShowForm(false); };
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setFormErr('اكتب اسم العميل على الأقل'); return; }
    setSaving(true);
    setFormErr('');
    const body = {
      name: form.name.trim(),
      company: form.company.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      whatsapp: form.whatsapp.trim() || undefined,
      source: form.source || 'EXTERNAL',
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editId) {
        await api(`/clients/${editId}`, { method: 'PATCH', body });
      } else {
        await api('/clients', { method: 'POST', body });
      }
      setShowForm(false);
      load();
    } catch (e: any) {
      setFormErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Client) => {
    if (!confirm(`متأكد إنك عايز تمسح «${c.name}»؟`)) return;
    try {
      await api(`/clients/${c.id}`, { method: 'DELETE' });
      setClients((list) => list.filter((x) => x.id !== c.id));
    } catch (e: any) {
      alert(e?.message || 'تعذّر الحذف');
    }
  };

  const waDigits = (v?: string | null) => (v || '').replace(/\D/g, '');

  return (
    <ProviderShell active="clients" title="عملائي">
      <style>{CL_CSS}</style>
      <div className="cl-wrap">
        <div className="cl-bar">
          <div className="cl-search">
            <Icon name="search" size={17} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم العميل أو الشركة أو رقم..." />
          </div>
          <button className="cl-add" onClick={openAdd}>
            <Icon name="plus" size={16} /> أضف عميل
          </button>
        </div>

        {loading ? (
          <div className="cl-state">جاري التحميل...</div>
        ) : error ? (
          <div className="cl-state cl-err">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="cl-empty">
            <div className="cl-empty-ic"><Icon name="users" size={30} /></div>
            <h3>{clients.length === 0 ? 'لسه مضفتش عملاء' : 'مفيش نتايج للبحث'}</h3>
            <p>
              {clients.length === 0
                ? 'ضيف عملاءك — سواء من المنصة أو من برّه — وابدأ تدير تعاملاتك من مكان واحد.'
                : 'جرّب كلمة بحث تانية.'}
            </p>
            {clients.length === 0 && <button className="cl-empty-btn" onClick={openAdd}>أضف أول عميل</button>}
          </div>
        ) : (
          <div className="cl-grid">
            {filtered.map((c) => {
              const wa = waDigits(c.whatsapp);
              return (
                <div key={c.id} className="cl-card">
                  <div className="cl-card-head">
                    <span className="cl-avatar">{(c.name || '؟').charAt(0)}</span>
                    <div className="cl-id">
                      <h3 className="cl-name">{c.name}</h3>
                      {c.company && <p className="cl-company">{c.company}</p>}
                    </div>
                    <span className={`cl-src ${c.source === 'PLATFORM' ? 'cl-src-p' : ''}`}>
                      {c.source === 'PLATFORM' ? 'من المنصة' : 'عميل خارجي'}
                    </span>
                  </div>

                  <div className="cl-contacts">
                    {c.phone && (
                      <a className="cl-contact" href={`tel:${c.phone}`}>
                        <Icon name="phone" size={14} /> {c.phone}
                      </a>
                    )}
                    {wa && (
<a className="cl-contact" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                  <Icon name="phone" size={14} /> واتساب
                      </a>
                    )}
                    {c.email && (
                      <a className="cl-contact" href={`mailto:${c.email}`}>
                        <Icon name="link" size={14} /> {c.email}
                      </a>
                    )}
                  </div>

                  {c.notes && <p className="cl-notes">{c.notes}</p>}

                  <div className="cl-actions">
                    <button className="cl-btn" onClick={() => openEdit(c)}>تعديل</button>
                    <button className="cl-btn cl-btn-danger" onClick={() => remove(c)}>حذف</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="cl-overlay" onClick={close}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cl-modal-head">
              <h2>{editId ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
              <button className="cl-x" onClick={close}>✕</button>
            </div>

            <div className="cl-form">
              <label className="cl-field">
                <span>اسم العميل *</span>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="مثلاً: أحمد محمد" />
              </label>
              <div className="cl-row">
                <label className="cl-field">
                  <span>الشركة</span>
                  <input value={form.company} onChange={(e) => set('company', e.target.value)} placeholder="اسم الشركة (اختياري)" />
                </label>
                <label className="cl-field">
                  <span>المصدر</span>
                  <select value={form.source} onChange={(e) => set('source', e.target.value)}>
                    <option value="EXTERNAL">عميل خارجي</option>
                    <option value="PLATFORM">من المنصة</option>
                  </select>
                </label>
              </div>
              <div className="cl-row">
                <label className="cl-field">
                  <span>التليفون</span>
                  <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="01xxxxxxxxx" />
                </label>
                <label className="cl-field">
                  <span>واتساب</span>
                  <input value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="201xxxxxxxxx" />
                </label>
              </div>
              <label className="cl-field">
                <span>الإيميل</span>
                <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
              </label>
              <label className="cl-field">
                <span>ملاحظات</span>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="أي تفاصيل مهمة عن العميل..." />
              </label>

              {formErr && <div className="cl-form-err">{formErr}</div>}

              <div className="cl-form-actions">
                <button className="cl-cancel" onClick={close} disabled={saving}>إلغاء</button>
                <button className="cl-save" onClick={save} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

const CL_CSS = `
.cl-wrap{max-width:960px;margin:0 auto;}
.cl-state{padding:50px;text-align:center;color:var(--muted);}
.cl-err{color:#b42318;}
.cl-bar{display:flex;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
.cl-search{flex:1;min-width:220px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:12px;padding:0 14px;}
.cl-search svg{color:var(--muted);flex-shrink:0;}
.cl-search input{border:none;outline:none;background:transparent;padding:12px 0;width:100%;font-family:inherit;font-size:14px;color:var(--ink);}
.cl-add{display:flex;align-items:center;gap:6px;background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:0 22px;border-radius:12px;cursor:pointer;font-family:inherit;}
.cl-add:hover{background:var(--green-dark);}
.cl-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
.cl-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;display:flex;flex-direction:column;transition:all .15s;}
.cl-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.08);}
.cl-card-head{display:flex;align-items:center;gap:12px;margin-bottom:14px;}
.cl-avatar{width:44px;height:44px;border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:18px;flex-shrink:0;}
.cl-id{flex:1;min-width:0;}
.cl-name{font-size:16px;font-weight:800;color:var(--ink);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.cl-company{font-size:12.5px;color:var(--muted);margin:2px 0 0;}
.cl-src{font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px;white-space:nowrap;background:#eef1f0;color:#67736f;}
.cl-src-p{background:#e3f4ec;color:#1c7a4f;}
.cl-contacts{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.cl-contact{display:flex;align-items:center;gap:5px;font-size:12.5px;color:var(--green-dark);text-decoration:none;background:var(--mint);padding:5px 10px;border-radius:999px;font-weight:700;}
.cl-contact:hover{background:#dcefe7;}
.cl-contact svg{color:var(--green);}
.cl-notes{font-size:13px;color:var(--muted);line-height:1.7;margin:0 0 14px;background:var(--background);border-radius:10px;padding:10px 12px;}
.cl-actions{display:flex;gap:8px;margin-top:auto;}
.cl-btn{flex:1;background:#fff;border:1px solid var(--line);border-radius:10px;padding:9px;font-family:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer;transition:all .15s;}
.cl-btn:hover{border-color:var(--green-light);}
.cl-btn-danger{color:#b42318;}
.cl-btn-danger:hover{border-color:#f0c4c0;background:#fdf5f4;}
.cl-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.cl-empty-ic{color:var(--green);margin-bottom:10px;}
.cl-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.cl-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.cl-empty-btn{background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;font-family:inherit;}
.cl-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.cl-modal{background:#fff;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.cl-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line);}
.cl-modal-head h2{font-size:17px;font-weight:900;color:var(--ink);margin:0;}
.cl-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;line-height:1;}
.cl-form{padding:22px 24px;}
.cl-row{display:flex;gap:12px;}
.cl-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;flex:1;}
.cl-field span{font-size:13px;font-weight:700;color:var(--ink);}
.cl-field input,.cl-field select,.cl-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.cl-field input:focus,.cl-field select:focus,.cl-field textarea:focus{border-color:var(--green-light);}
.cl-field textarea{resize:vertical;}
.cl-form-err{background:#fdf5f4;color:#b42318;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;margin-bottom:14px;}
.cl-form-actions{display:flex;gap:10px;margin-top:6px;}
.cl-cancel{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;}
.cl-save{flex:2;background:var(--green);color:#fff;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.cl-save:disabled,.cl-cancel:disabled{opacity:.6;cursor:default;}
@media(max-width:720px){.cl-grid{grid-template-columns:1fr;}.cl-row{flex-direction:column;gap:0;}}
`;
