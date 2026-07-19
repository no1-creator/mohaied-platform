'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  projectRef?: string | null;
  completedAt?: string | null;
  createdAt: string;
};
type Client = { id: string; name: string };

const COLUMNS = [
  { key: 'TODO', label: 'لسه' },
  { key: 'DOING', label: 'بشتغل عليها' },
  { key: 'DONE', label: 'خلصت' },
];
const PRIORITY_LABEL: Record<string, string> = { HIGH: 'عالية', MEDIUM: 'متوسطة', LOW: 'منخفضة' };
const PRIORITY_CLASS: Record<string, string> = { HIGH: 'ts-p-high', MEDIUM: 'ts-p-med', LOW: 'ts-p-low' };

const emptyForm = { title: '', description: '', status: 'TODO', priority: 'MEDIUM', dueDate: '', clientId: '', projectRef: '' };

export default function ProviderTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');

  const load = () => {
    Promise.all([
      api<Task[]>('/tasks').then((d) => setTasks(Array.isArray(d) ? d : [])),
      api<Client[]>('/clients').then((d) => setClients(Array.isArray(d) ? d : [])).catch(() => setClients([])),
    ])
      .catch((e: any) => setError(e?.message || 'حصل خطأ'))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const dueInfo = (t: Task) => {
    if (!t.dueDate || t.status === 'DONE') return null;
    const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
    const today = startOfToday();
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
    if (diff < 0) return { cls: 'ts-due-over', txt: `متأخرة ${Math.abs(diff)} يوم` };
    if (diff === 0) return { cls: 'ts-due-soon', txt: 'النهارده' };
    if (diff <= 3) return { cls: 'ts-due-soon', txt: `باقي ${diff} يوم` };
    return { cls: 'ts-due-ok', txt: due.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) };
  };

  const stats = useMemo(() => {
    const today = startOfToday();
    let overdue = 0, upcoming = 0, active = 0, done = 0;
    tasks.forEach((t) => {
      if (t.status === 'DONE') { done++; return; }
      if (t.status === 'DOING') active++;
      if (t.dueDate) {
        const due = new Date(t.dueDate); due.setHours(0, 0, 0, 0);
        const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
        if (diff < 0) overdue++;
        else if (diff <= 7) upcoming++;
      }
    });
    return { overdue, upcoming, active, done };
  }, [tasks]);

  const openAdd = () => { setEditId(null); setForm({ ...emptyForm }); setFormErr(''); setShowForm(true); };
  const openEdit = (t: Task) => {
    setEditId(t.id);
    setForm({
      title: t.title || '',
      description: t.description || '',
      status: t.status || 'TODO',
      priority: t.priority || 'MEDIUM',
      dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '',
      clientId: t.clientId || '',
      projectRef: t.projectRef || '',
    });
    setFormErr('');
    setShowForm(true);
  };
  const close = () => { if (!saving) setShowForm(false); };

  const submit = async () => {
    if (!form.title.trim()) { setFormErr('اكتب عنوان المهمة'); return; }
    setSaving(true); setFormErr('');
    const body: any = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      clientId: form.clientId || undefined,
      projectRef: form.projectRef.trim() || undefined,
    };
    try {
      if (editId) await api(`/tasks/${editId}`, { method: 'PATCH', body });
      else await api('/tasks', { method: 'POST', body });
      setShowForm(false);
      setLoading(true);
      load();
    } catch (e: any) {
      setFormErr(e?.message || 'حصل خطأ، حاول تاني');
    } finally {
      setSaving(false);
    }
  };

  const move = async (t: Task, status: string) => {
    setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, status } : x)));
    try { await api(`/tasks/${t.id}`, { method: 'PATCH', body: { status } }); load(); }
    catch { load(); }
  };

  const remove = async (t: Task) => {
    if (!confirm('حذف المهمة؟')) return;
    try { await api(`/tasks/${t.id}`, { method: 'DELETE' }); setTasks((p) => p.filter((x) => x.id !== t.id)); }
    catch (e: any) { alert(e?.message || 'تعذّر الحذف'); }
  };

  return (
    <ProviderShell active="tasks" title="المهام والمواعيد">
      <style>{TS_CSS}</style>
      <div className="ts-wrap">
        <div className="ts-head">
          <div className="ts-stats">
            <div className="ts-stat over"><b>{stats.overdue}</b><span>متأخرة</span></div>
            <div className="ts-stat soon"><b>{stats.upcoming}</b><span>قادمة</span></div>
            <div className="ts-stat"><b>{stats.active}</b><span>جارية</span></div>
            <div className="ts-stat done"><b>{stats.done}</b><span>مكتملة</span></div>
          </div>
          <button className="ts-add" onClick={openAdd}><Icon name="plus" size={16} /> مهمة جديدة</button>
        </div>

        {loading ? (
          <div className="ts-state">جاري التحميل...</div>
        ) : error ? (
          <div className="ts-state ts-err">{error}</div>
        ) : (
          <div className="ts-board">
            {COLUMNS.map((col) => {
              const items = tasks.filter((t) => t.status === col.key);
              return (
                <div key={col.key} className="ts-col">
                  <div className="ts-col-h">
                    <span>{col.label}</span>
                    <span className="ts-col-count">{items.length}</span>
                  </div>
                  <div className="ts-col-body">
                    {items.length === 0 ? (
                      <div className="ts-col-empty">مفيش مهام</div>
                    ) : (
                      items.map((t) => {
                        const due = dueInfo(t);
                        return (
                          <div key={t.id} className="ts-card">
                            <div className="ts-card-top">
                              <span className={`ts-prio ${PRIORITY_CLASS[t.priority] || 'ts-p-med'}`}>{PRIORITY_LABEL[t.priority] || t.priority}</span>
                              <div className="ts-card-actions">
                                <button onClick={() => openEdit(t)} title="تعديل">✎</button>
                                <button onClick={() => remove(t)} title="حذف">🗑</button>
                              </div>
                            </div>
                            <div className="ts-card-title">{t.title}</div>
                            {t.description && <p className="ts-card-desc">{t.description}</p>}
                            <div className="ts-card-meta">
                              {t.clientName && <span className="ts-tag"><Icon name="users" size={12} /> {t.clientName}</span>}
                              {t.projectRef && <span className="ts-tag"><Icon name="folder" size={12} /> {t.projectRef}</span>}
                              {due && <span className={`ts-due ${due.cls}`}>{due.txt}</span>}
                            </div>
                            <div className="ts-move">
                              {COLUMNS.filter((c) => c.key !== t.status).map((c) => (
                                <button key={c.key} onClick={() => move(t, c.key)}>
                                  {c.key === 'DONE' ? '✓ خلصت' : c.key === 'DOING' ? '▶ ابدأ' : '↩ رجّع'}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <div className="ts-overlay" onClick={close}>
          <div className="ts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ts-modal-head">
              <h2>{editId ? 'تعديل المهمة' : 'مهمة جديدة'}</h2>
              <button className="ts-x" onClick={close}>✕</button>
            </div>
            <div className="ts-form">
              <label className="ts-field">
                <span>عنوان المهمة *</span>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثلاً: تسليم التصميم المبدئي" />
              </label>
              <label className="ts-field">
                <span>تفاصيل</span>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </label>
              <div className="ts-row">
                <label className="ts-field">
                  <span>الحالة</span>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </label>
                <label className="ts-field">
                  <span>الأولوية</span>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="HIGH">عالية</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="LOW">منخفضة</option>
                  </select>
                </label>
              </div>
              <div className="ts-row">
                <label className="ts-field">
                  <span>ميعاد التسليم</span>
                  <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                </label>
                <label className="ts-field">
                  <span>العميل</span>
                  <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
                    <option value="">— بدون —</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
              </div>
              <label className="ts-field">
                <span>مرتبطة بمشروع (اختياري)</span>
                <input value={form.projectRef} onChange={(e) => setForm({ ...form, projectRef: e.target.value })} placeholder="اسم المشروع أو مرجعه" />
              </label>

              {formErr && <div className="ts-form-err">{formErr}</div>}

              <div className="ts-form-actions">
                <button className="ts-cancel" onClick={close} disabled={saving}>إلغاء</button>
                <button className="ts-save" onClick={submit} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : editId ? 'حفظ التعديلات' : 'إضافة المهمة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProviderShell>
  );
}

const TS_CSS = `
.ts-wrap{max-width:1040px;margin:0 auto;}
.ts-head{display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:18px;flex-wrap:wrap;}
.ts-stats{display:flex;gap:10px;flex-wrap:wrap;}
.ts-stat{background:#fff;border:1px solid var(--line);border-radius:12px;padding:10px 16px;text-align:center;min-width:74px;}
.ts-stat b{display:block;font-size:20px;font-weight:900;color:var(--green-dark);}
.ts-stat span{font-size:12px;color:var(--muted);}
.ts-stat.over{border-color:#f3c9c4;}.ts-stat.over b{color:#b42318;}
.ts-stat.soon{border-color:#f0d9a8;}.ts-stat.soon b{color:#a86a12;}
.ts-stat.done b{color:#1c7a4f;}
.ts-add{display:flex;align-items:center;gap:7px;background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:11px 20px;border-radius:12px;cursor:pointer;font-family:inherit;}
.ts-state{padding:50px;text-align:center;color:var(--muted);}
.ts-err{color:#b42318;}
.ts-board{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;align-items:start;}
.ts-col{background:var(--background);border:1px solid var(--line);border-radius:16px;padding:12px;}
.ts-col-h{display:flex;justify-content:space-between;align-items:center;font-weight:900;color:var(--ink);font-size:14.5px;padding:4px 6px 10px;}
.ts-col-count{background:#fff;border:1px solid var(--line);border-radius:999px;font-size:12px;padding:1px 9px;color:var(--muted);}
.ts-col-body{display:flex;flex-direction:column;gap:10px;min-height:40px;}
.ts-col-empty{color:var(--muted);font-size:12.5px;text-align:center;padding:16px 0;}
.ts-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;}
.ts-card-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.ts-prio{font-size:11px;font-weight:800;padding:2px 9px;border-radius:999px;}
.ts-p-high{background:#fdecec;color:#b42318;}
.ts-p-med{background:#fdf0d9;color:#a86a12;}
.ts-p-low{background:#eef1f0;color:#67736f;}
.ts-card-actions{display:flex;gap:4px;}
.ts-card-actions button{background:none;border:none;cursor:pointer;font-size:13px;opacity:.6;padding:2px;}
.ts-card-actions button:hover{opacity:1;}
.ts-card-title{font-weight:800;color:var(--ink);font-size:14px;line-height:1.4;}
.ts-card-desc{font-size:12.5px;color:var(--muted);margin:4px 0 0;line-height:1.5;}
.ts-card-meta{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;}
.ts-tag{display:inline-flex;align-items:center;gap:4px;font-size:11.5px;color:var(--muted);background:var(--background);padding:3px 9px;border-radius:999px;}
.ts-due{font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:999px;}
.ts-due-over{background:#fdecec;color:#b42318;}
.ts-due-soon{background:#fdf0d9;color:#a86a12;}
.ts-due-ok{background:#e3f4ec;color:#1c7a4f;}
.ts-move{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.ts-move button{flex:1;background:var(--mint);border:none;border-radius:8px;padding:6px;font-size:11.5px;font-weight:700;color:var(--green-dark);cursor:pointer;font-family:inherit;white-space:nowrap;}
.ts-move button:hover{background:var(--green-light);color:#fff;}
.ts-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.ts-modal{background:#fff;border-radius:20px;width:100%;max-width:520px;max-height:90vh;overflow:auto;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.ts-modal-head{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;}
.ts-modal-head h2{font-size:17px;font-weight:900;color:var(--ink);margin:0;}
.ts-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;}
.ts-form{padding:22px 24px;}
.ts-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.ts-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
.ts-field span{font-size:13px;font-weight:700;color:var(--ink);}
.ts-field input,.ts-field select,.ts-field textarea{border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.ts-field input:focus,.ts-field select:focus,.ts-field textarea:focus{border-color:var(--green-light);}
.ts-field textarea{resize:vertical;}
.ts-form-err{background:#fdf5f4;color:#b42318;font-size:13px;font-weight:700;padding:10px 12px;border-radius:10px;margin-bottom:14px;}
.ts-form-actions{display:flex;gap:10px;}
.ts-cancel{flex:1;background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:700;color:var(--ink);cursor:pointer;}
.ts-save{flex:2;background:var(--green);color:#fff;border:none;border-radius:12px;padding:12px;font-family:inherit;font-size:14px;font-weight:800;cursor:pointer;}
.ts-save:disabled,.ts-cancel:disabled{opacity:.6;cursor:default;}
@media(max-width:820px){.ts-board{grid-template-columns:1fr;}}
@media(max-width:520px){.ts-row{grid-template-columns:1fr;}}
`;
