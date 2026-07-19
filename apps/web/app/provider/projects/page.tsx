'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type PlatformProject = {
  id: string;
  title: string;
  field: string;
  status: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  createdAt: string;
  client?: { id: string; fullName: string } | null;
};

type ExternalProject = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  value?: number | string | null;
  currency?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
  clientId?: string | null;
  createdAt: string;
  client?: { id: string; name: string; company?: string | null } | null;
};

type Client = { id: string; name: string; company?: string | null };

type Item = {
  kind: 'platform' | 'external';
  id: string;
  title: string;
  status: string;
  sub?: string;
  clientName?: string;
  money?: string | null;
  dueDate?: string | null;
  createdAt: string;
  raw: PlatformProject | ExternalProject;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'مسودة',
  OPEN: 'مفتوح',
  IN_AGREEMENT: 'جاري الاتفاق',
  IN_PROGRESS: 'قيد التنفيذ',
  COMPLETED: 'مكتمل',
  DISPUTED: 'متنازع عليه',
  CANCELLED: 'ملغي',
  NEW: 'جديد',
  DONE: 'مكتمل',
};
const STATUS_CLASS: Record<string, string> = {
  DRAFT: 'pj-b-gray',
  OPEN: 'pj-b-blue',
  IN_AGREEMENT: 'pj-b-amber',
  IN_PROGRESS: 'pj-b-blue',
  COMPLETED: 'pj-b-green',
  DISPUTED: 'pj-b-red',
  CANCELLED: 'pj-b-gray',
  NEW: 'pj-b-amber',
  DONE: 'pj-b-green',
};
const ACTIVE = ['IN_AGREEMENT', 'IN_PROGRESS', 'NEW'];
const DONE = ['COMPLETED', 'DONE'];

const EMPTY_EXT = {
  title: '',
  clientId: '',
  status: 'IN_PROGRESS',
  value: '',
  currency: 'EGP',
  startDate: '',
  dueDate: '',
  description: '',
  notes: '',
};

type SrcTab = 'all' | 'platform' | 'external';

export default function ProviderProjectsPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState<PlatformProject[]>([]);
  const [external, setExternal] = useState<ExternalProject[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [tab, setTab] = useState<SrcTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_EXT });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const loadExternal = () => {
    api<ExternalProject[]>('/external-projects')
      .then((d) => setExternal(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => {
    Promise.all([
      api<PlatformProject[]>('/projects/mine').then((d) => setPlatform(Array.isArray(d) ? d : [])),
      api<ExternalProject[]>('/external-projects').then((d) => setExternal(Array.isArray(d) ? d : [])),
      api<Client[]>('/clients').then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => {}),
    ])
      .catch((e: any) => setError(e?.message || 'حصل خطأ'))
      .finally(() => setLoading(false));
  }, []);

  const money = (v?: number | string | null, currency?: string | null) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    if (Number.isNaN(n)) return null;
    return `${n.toLocaleString('en-US')} ${currency || 'EGP'}`;
  };

  const items: Item[] = useMemo(() => {
    const p: Item[] = platform.map((x) => {
      const bMin = x.budgetMin != null && x.budgetMin !== '' ? Number(x.budgetMin).toLocaleString('en-US') : null;
      const bMax = x.budgetMax != null && x.budgetMax !== '' ? Number(x.budgetMax).toLocaleString('en-US') : null;
      return {
        kind: 'platform' as const,
        id: x.id,
        title: x.title,
        status: (x.status || '').toUpperCase(),
        sub: x.field,
        clientName: x.client?.fullName,
        money: bMin || bMax ? `${bMin ?? '—'} : ${bMax ?? '—'} ج.م` : null,
        dueDate: null,
        createdAt: x.createdAt,
        raw: x,
      };
    });
    const e: Item[] = external.map((x) => ({
      kind: 'external' as const,
      id: x.id,
      title: x.title,
      status: (x.status || '').toUpperCase(),
      sub: x.description || undefined,
      clientName: x.client?.name,
      money: money(x.value, x.currency),
      dueDate: x.dueDate || null,
      createdAt: x.createdAt,
      raw: x,
    }));
    return [...p, ...e].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [platform, external]);

  const activeCount = items.filter((i) => ACTIVE.includes(i.status)).length;
  const doneCount = items.filter((i) => DONE.includes(i.status)).length;

  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    return items.filter((i) => i.kind === tab);
  }, [items, tab]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditId(null);
    setForm({ ...EMPTY_EXT });
    setFormErr('');
    setShowForm(true);
  };
  const openEdit = (x: ExternalProject) => {
    setEditId(x.id);
    setForm({
      title: x.title || '',
      clientId: x.clientId || '',
      status: (x.status || 'IN_PROGRESS').toUpperCase(),
      value: x.value != null ? String(x.value) : '',
      currency: x.currency || 'EGP',
      startDate: x.startDate ? String(x.startDate).slice(0, 10) : '',
      dueDate: x.dueDate ? String(x.dueDate).slice(0, 10) : '',
      description: x.description || '',
      notes: x.notes || '',
    });
    setFormErr('');
    setShowForm(true);
  };
  const close = () => { if (!saving) setShowForm(false); };

  const save = async () => {
    if (!form.title.trim()) { setFormErr('اكتب عنوان المشروع على الأقل'); return; }
    const num = form.value.trim() === '' ? undefined : Number(form.value);
    if (num !== undefined && Number.isNaN(num)) { setFormErr('قيمة المشروع لازم تكون رقم'); return; }
    setSaving(true);
    setFormErr('');
    const body = {
      title: form.title.trim(),
      clientId: form.clientId || undefined,
      status: form.status || 'IN_PROGRESS',
      value: num,
      currency: form.currency || 'EGP',
      startDate: form.startDate || undefined,
      dueDate: form.dueDate || undefined,
      description: form.description.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editId) {
        await api(`/external-projects/${editId}`, { method: 'PATCH', body });
      } else {
        await api('/external-projects', { method: 'POST', body });
      }
      setShowForm(false);
      loadExternal();
    } catch (e: any) {
      setFormErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (x: ExternalProject) => {
    if (!confirm(`متأكد إنك عايز تمسح «${x.title}»؟`)) return;
    try {
      await api(`/external-projects/${x.id}`, { method: 'DELETE' });
      setExternal((list) => list.filter((i) => i.id !== x.id));
    } catch (e: any) {
      alert(e?.message || 'تعذّر الحذف');
    }
  };

  const TABS: { k: SrcTab; l: string }[] = [
    { k: 'all', l: 'الكل' },
    { k: 'platform', l: 'من المنصة' },
    { k: 'external', l: 'خارجية' },
  ];

  return (
    <ProviderShell active="myprojects" title="مشاريعي">
      <style>{PJ_CSS}</style>
      <div className="pj-wrap">
        {loading ? (
          <div className="pj-state">جاري التحميل...</div>
        ) : error ? (
          <div className="pj-state pj-err">{error}</div>
        ) : (
          <>
            <div className="pj-stats">
              <div className="pj-stat"><div className="pj-stat-n">{items.length}</div><div className="pj-stat-l">إجمالي المشاريع</div></div>
              <div className="pj-stat good"><div className="pj-stat-n">{activeCount}</div><div className="pj-stat-l">جارية الآن</div></div>
              <div className="pj-stat good"><div className="pj-stat-n">{doneCount}</div><div className="pj-stat-l">مكتملة</div></div>
            </div>

            <div className="pj-bar">
              <div className="pj-tabs">
                {TABS.map((t) => (
                  <button key={t.k} className={`pj-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k)}>
                    {t.l}
                  </button>
                ))}
              </div>
              <button className="pj-add" onClick={openAdd}>
                <Icon name="plus" size={16} /> مشروع خارجي
              </button>
            </div>

            {filtered.length === 0 ? (
              <div className="pj-empty">
                <div className="pj-empty-ic"><Icon name="folder" size={30} /></div>
                <h3>مفيش مشاريع هنا</h3>
                <p>المشاريع اللي بتتقبل من المنصة بتظهر هنا تلقائيًا، وتقدر كمان تضيف مشاريعك الخارجية بنفسك.</p>
                <button className="pj-empty-btn" onClick={openAdd}>أضف مشروع خارجي</button>
              </div>
            ) : (
              <div className="pj-list">
                {filtered.map((it) => (
                  <div
                    key={`${it.kind}-${it.id}`}
                    className="pj-card"
                    onClick={() =>
                      it.kind === 'platform'
                        ? router.push(`/projects/${it.id}`)
                        : openEdit(it.raw as ExternalProject)
                    }
                  >
                    <div className="pj-card-top">
                      <h3 className="pj-title">{it.title}</h3>
                      <div className="pj-badges">
                        <span className={`pj-src ${it.kind === 'external' ? 'pj-src-ext' : ''}`}>
                          {it.kind === 'external' ? 'خارجي' : 'منصة'}
                        </span>
                        <span className={`pj-badge ${STATUS_CLASS[it.status] || 'pj-b-gray'}`}>
                          {STATUS_LABEL[it.status] || it.status}
                        </span>
                      </div>
                    </div>
                    {it.sub && <p className="pj-sub">{it.sub}</p>}
                    <div className="pj-meta">
                      {it.clientName && <span className="pj-m"><Icon name="user" size={14} /> {it.clientName}</span>}
                      {it.money && <span className="pj-m"><Icon name="creditCard" size={14} /> {it.money}</span>}
                      {it.dueDate && (
                        <span className="pj-m"><Icon name="clock" size={14} /> تسليم: {new Date(it.dueDate).toLocaleDateString('ar-EG')}</span>
                      )}
                    </div>
                    <div className="pj-foot">
                      <span className="pj-date">{new Date(it.createdAt).toLocaleDateString('ar-EG')}</span>
                      {it.kind === 'platform' ? (
                        <span className="pj-open">إدارة المشروع ↗</span>
                      ) : (
                        <span className="pj-open" onClick={(e) => { e.stopPropagation(); remove(it.raw as ExternalProject); }}>
                          حذف
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <div className="pj-overlay" onClick={close}>
          <div className="pj-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pj-modal-head">
              <h2>{editId ? 'تعديل مشروع خارجي' : 'إضافة مشروع خارجي'}</h2>
              <button className="pj-x" onClick={close}>✕</button>
            </div>
            <div className="pj-form">
              <label className="pj-field">
                <span>عنوان المشروع *</span>
                <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلاً: تصميم هوية بصرية" />
              </label>
              <div className="pj-row">
                <label className="pj-field">
                  <span>العميل</span>
                  <select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>
                    <option value="">— بدون —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                    ))}
                  </select>
                </label>
                <label className="pj-field">
                  <span>الحالة</span>
                  <select value={form.status} onChange={(e) => set('status', e.target.value)}>
                    <option value="NEW">جديد</option>
                    <option value="IN_PROGRESS">قيد التنفيذ</option>
                    <option value="DONE">مكتمل</option>
                    <option value="CANCELLED">ملغي</option>
                  </select>
                </label>
              </div>
              <div className="pj-row">
                <label className="pj-field">
                  <span>القيمة</span>
                  <input value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="مثلاً: 5000" inputMode="numeric" />
                </label>
                <label className="pj-field">
                  <span>العملة</span>
                  <input value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="EGP" />
                </label>
              </div>
              <div className="pj-row">
                <label className="pj-field">
                  <span>تاريخ البداية</span>
                  <input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
                </label>
                <label className="pj-field">
                  <span>تاريخ التسليم</span>
                  <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
                </label>
              </div>
              <label className="pj-field">
                <span>وصف المشروع</span>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="تفاصيل مختصرة عن الشغل..." />
              </label>
              <label className="pj-field">
                <span>ملاحظات</span>
                <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="أي ملاحظات داخلية..." />
              </label>

              {formErr && <div className="pj-form-err">{formErr}</div>}

              <div className="pj-form-actions">
                <button className="pj-cancel" onClick={close} disabled={saving}>إلغاء</button>
                <button className="pj-save" onClick={save} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة المشروع'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

const PJ_CSS = `
.pj-wrap{max-width:900px;margin:0 auto;}
.pj-state{padding:50px;text-align:center;color:var(--muted);}
.pj-err{color:#b42318;}
.pj-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px;}
.pj-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.pj-stat.good{border-color:var(--green-light);}
.pj-stat-n{font-size:22px;font-weight:900;color:var(--green-dark);}
.pj-stat-l{font-size:12.5px;color:var(--muted);margin-top:3px;}
.pj-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap;}
.pj-tabs{display:flex;gap:8px;flex-wrap:wrap;}
.pj-tab{background:#fff;border:1px solid var(--line);border-radius:999px;padding:8px 18px;font-family:inherit;font-size:13.5px;font-weight:700;color:var(--muted);cursor:pointer;transition:all .15s;}
.pj-tab:hover{border-color:var(--green-light);}
.pj-tab.active{background:var(--green);border-color:var(--green);color:#fff;}
.pj-add{display:flex;align-items:center;gap:6px;background:var(--green);color:#fff;border:none;font-weight:800;font-size:13.5px;padding:9px 18px;border-radius:12px;cursor:pointer;font-family:inherit;}
.pj-add:hover{background:var(--green-dark);}
.pj-list{display:flex;flex-direction:column;gap:12px;}
.pj-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;cursor:pointer;transition:all .15s;}
.pj-card:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.1);}
.pj-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:8px;}
.pj-title{font-size:16.5px;font-weight:800;color:var(--ink);margin:0;}
.pj-badges{display:flex;gap:6px;flex-shrink:0;}
.pj-src{font-size:11.5px;font-weight:800;padding:4px 10px;border-radius:999px;background:#e6f0fb;color:#1e5fae;white-space:nowrap;}
.pj-src-ext{background:#f3edfb;color:#6b3fae;}
.pj-badge{font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px;white-space:nowrap;}
.pj-b-green{background:#e3f4ec;color:#1c7a4f;}
.pj-b-blue{background:#e6f0fb;color:#1e5fae;}
.pj-b-amber{background:#fdf0d9;color:#a86a12;}
.pj-b-red{background:#fdecec;color:#b42318;}
.pj-b-gray{background:#eef1f0;color:#67736f;}
.pj-sub{font-size:13.5px;color:var(--muted);line-height:1.7;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pj-meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;margin-bottom:12px;}
.pj-m{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px;}
.pj-m svg{color:var(--green);}
.pj-foot{display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:12px;}
.pj-date{font-size:12.5px;color:var(--muted);}
.pj-open{color:var(--green-dark);font-weight:800;font-size:13px;}
.pj-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.pj-empty-ic{color:var(--green);margin-bottom:10px;}
.pj-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.pj-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.pj-empty-btn{background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;font-family:inherit;}
.pj-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.pj-modal{background:#fff;border-radius:20px;width:100%;max-width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.pj-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line);}
.pj-modal-head h2{font-size:17px;font-weight:900;color:var(--ink);margin:0;}
.pj-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;line-height:1;}
.pj-form{padding:22px 24px;}
.pj-row{display:flex;gap:12px;}
.pj-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;flex:1;}
.pj-field span{font-size:13px;font-weight:700;color:var(--ink);}
.pj-field input,.pj-field select,.pj-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.pj-field input:focus,.pj-field select:focus,.pj-field textarea:focus{border-color:var(--green-light);}
.pj-field textarea{resize:vertical;}
.pj-form-err{background:#fdf5f4;color:#b42318;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;margin-bottom:14px;}
.pj-form-actions{display:flex;gap:10px;margin-top:6px;}
.pj-cancel{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;}
.pj-save{flex:2;background:var(--green);color:#fff;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.pj-save:disabled,.pj-cancel:disabled{opacity:.6;cursor:default;}
@media(max-width:640px){.pj-stats{grid-template-columns:1fr 1fr;}.pj-meta{gap:12px;}.pj-row{flex-direction:column;gap:0;}}
`;
