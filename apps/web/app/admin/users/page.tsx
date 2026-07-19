'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'عميل',
  PROVIDER: 'مقدم خدمة',
  SUPERVISOR: 'مشرف',
  ADMIN: 'أدمن',
};

const ROLE_FILTERS = [
  { value: '', label: 'الكل' },
  { value: 'CLIENT', label: 'عملاء' },
  { value: 'PROVIDER', label: 'مقدمو خدمة' },
  { value: 'SUPERVISOR', label: 'مشرفون' },
  { value: 'ADMIN', label: 'أدمن' },
];

const ROLE_OPTIONS = [
  { value: 'CLIENT', label: 'عميل' },
  { value: 'PROVIDER', label: 'مقدم خدمة' },
  { value: 'SUPERVISOR', label: 'مشرف' },
  { value: 'ADMIN', label: 'أدمن' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  // لوحة الرسائل / التنبيهات
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyUser, setNotifyUser] = useState<User | null>(null);
  const [nForm, setNForm] = useState({ target: 'all', role: 'PROVIDER', title: '', body: '', linkUrl: '' });
  const [sending, setSending] = useState(false);
  const [nErr, setNErr] = useState('');
  const [nOk, setNOk] = useState('');
  const setN = (k: string, v: string) => setNForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (role) params.set('role', role);
    if (q.trim()) params.set('q', q.trim());
    const qs = params.toString();
    api<User[]>(`/admin/users${qs ? `?${qs}` : ''}`)
      .then(setUsers)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, reloadKey]);

  async function toggleVerify(u: User) {
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}/verify`, { method: 'PATCH', body: { isVerified: !u.isVerified } });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isVerified: !u.isVerified } : x)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function toggleActive(u: User) {
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}/active`, { method: 'PATCH', body: { isActive: !u.isActive } });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function changeRole(u: User, newRole: string) {
    if (newRole === u.role) return;
    if (!confirm(`تغيير دور «${u.fullName}» إلى ${ROLE_LABELS[newRole] || newRole}؟`)) return;
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: newRole } });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  function openUserNotify(u: User) {
    setNotifyUser(u);
    setNForm({ target: 'user', role: 'PROVIDER', title: '', body: '', linkUrl: '' });
    setNErr('');
    setNOk('');
    setNotifyOpen(true);
  }

  function openBroadcast() {
    setNotifyUser(null);
    setNForm({ target: 'all', role: 'PROVIDER', title: '', body: '', linkUrl: '' });
    setNErr('');
    setNOk('');
    setNotifyOpen(true);
  }

  async function sendNotify() {
    if (!nForm.title.trim()) {
      setNErr('اكتب عنوان الرسالة');
      return;
    }
    setSending(true);
    setNErr('');
    setNOk('');
    const body: any = {
      target: notifyUser ? 'user' : nForm.target,
      title: nForm.title.trim(),
      body: nForm.body.trim() || undefined,
      linkUrl: nForm.linkUrl.trim() || undefined,
    };
    if (notifyUser) body.userId = notifyUser.id;
    else if (nForm.target === 'role') body.role = nForm.role;
    try {
      const res = await api<{ count: number }>('/admin/notify', { method: 'POST', body });
      setNOk(`تم الإرسال بنجاح إلى ${res.count} مستخدم`);
      setNForm((f) => ({ ...f, title: '', body: '', linkUrl: '' }));
    } catch (e: any) {
      setNErr(e.message || 'تعذّر الإرسال');
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell active="users" title="المستخدمون">
      <style>{AU_CSS}</style>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {ROLE_FILTERS.map((r) => (
            <button key={r.value} className={role === r.value ? 'active' : ''} onClick={() => setRole(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
        <div className="au-tools">
          <form
            className="ad-search"
            onSubmit={(e) => {
              e.preventDefault();
              setReloadKey((k) => k + 1);
            }}
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الإيميل..." />
            <button type="submit">بحث</button>
          </form>
          <button className="ad-btn" onClick={openBroadcast}>
            <Icon name="fileText" size={15} /> رسالة جماعية
          </button>
        </div>
      </div>

      {error && <div className="ad-error">{error}</div>}

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : users.length === 0 ? (
        <div className="ad-empty">مفيش مستخدمين مطابقين.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الإيميل</th>
                <th>الدور</th>
                <th>التوثيق</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td className="ad-mono">{u.email}</td>
                  <td>{ROLE_LABELS[u.role] || u.role}</td>
                  <td>
                    {u.isVerified ? (
                      <span className="ad-badge ok">موثّق</span>
                    ) : (
                      <span className="ad-badge muted">غير موثّق</span>
                    )}
                  </td>
                  <td>
                    {u.isActive ? (
                      <span className="ad-badge ok">نشط</span>
                    ) : (
                      <span className="ad-badge red">موقوف</span>
                    )}
                  </td>
                  <td>
                    <div className="ad-row-actions">
                      <button className="ad-btn-mini" disabled={busy === u.id} onClick={() => toggleVerify(u)}>
                        {u.isVerified ? 'إلغاء التوثيق' : 'توثيق'}
                      </button>
                      {u.role !== 'ADMIN' && (
                        <button
                          className={`ad-btn-mini ${u.isActive ? 'danger' : ''}`}
                          disabled={busy === u.id}
                          onClick={() => toggleActive(u)}
                        >
                          {u.isActive ? 'إيقاف' : 'تفعيل'}
                        </button>
                      )}
                      <select
                        className="au-role"
                        value={u.role}
                        disabled={busy === u.id}
                        onChange={(e) => changeRole(u, e.target.value)}
                      >
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                      <button className="ad-btn-mini" onClick={() => openUserNotify(u)}>
                        تنبيه
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {notifyOpen && (
        <div className="au-overlay" onClick={() => !sending && setNotifyOpen(false)}>
          <div className="au-modal" onClick={(e) => e.stopPropagation()}>
            <div className="au-modal-head">
              <h2>{notifyUser ? `رسالة إلى ${notifyUser.fullName}` : 'رسالة / تنبيه جماعي'}</h2>
              <button className="au-x" onClick={() => !sending && setNotifyOpen(false)}>✕</button>
            </div>
            <div className="au-body">
              {nOk && <div className="au-ok">{nOk}</div>}
              {nErr && <div className="au-err">{nErr}</div>}

              {!notifyUser && (
                <div className="au-row">
                  <label className="au-field">
                    <span>المستهدفون</span>
                    <select value={nForm.target} onChange={(e) => setN('target', e.target.value)}>
                      <option value="all">كل المستخدمين</option>
                      <option value="role">فئة محددة</option>
                    </select>
                  </label>
                  {nForm.target === 'role' && (
                    <label className="au-field">
                      <span>الفئة</span>
                      <select value={nForm.role} onChange={(e) => setN('role', e.target.value)}>
                        {ROLE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}

              <label className="au-field">
                <span>عنوان الرسالة</span>
                <input value={nForm.title} onChange={(e) => setN('title', e.target.value)} maxLength={140} placeholder="مثلاً: تحديث مهم من إدارة محايد" />
              </label>
              <label className="au-field">
                <span>النص (اختياري)</span>
                <textarea value={nForm.body} onChange={(e) => setN('body', e.target.value)} rows={4} maxLength={2000} placeholder="اكتب نص الرسالة اللي هيوصل للمستخدم..." />
              </label>
              <label className="au-field">
                <span>رابط (اختياري)</span>
                <input value={nForm.linkUrl} onChange={(e) => setN('linkUrl', e.target.value)} placeholder="مثلاً: /provider/plans" />
              </label>

              <div className="au-actions">
                <button className="au-cancel" disabled={sending} onClick={() => setNotifyOpen(false)}>
                  إغلاق
                </button>
                <button className="au-send" disabled={sending} onClick={sendNotify}>
                  {sending ? 'جاري الإرسال...' : 'إرسال'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const AU_CSS = `
.au-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.au-role{border:1px solid var(--line);border-radius:8px;padding:6px 8px;font-family:inherit;font-size:12.5px;color:var(--green-dark);background:#fff;cursor:pointer;font-weight:700;}
.au-role:disabled{opacity:.5;cursor:default;}
.au-overlay{position:fixed;inset:0;background:rgba(23,33,31,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:60;}
.au-modal{background:#fff;border-radius:18px;width:100%;max-width:520px;max-height:92vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,.2);}
.au-modal-head{display:flex;align-items:center;justify-content:space-between;padding:18px 22px;border-bottom:1px solid var(--line);position:sticky;top:0;background:#fff;}
.au-modal-head h2{font-size:16px;font-weight:900;color:var(--ink);margin:0;}
.au-x{background:none;border:none;font-size:18px;color:var(--muted);cursor:pointer;line-height:1;}
.au-body{padding:20px 22px;}
.au-ok{background:#e3f4ec;color:#1c7a4f;font-weight:800;font-size:13.5px;padding:11px 14px;border-radius:10px;margin-bottom:14px;}
.au-err{background:#fdeceb;color:#b4322b;font-weight:700;font-size:13.5px;padding:11px 14px;border-radius:10px;margin-bottom:14px;}
.au-row{display:flex;gap:12px;}
.au-field{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;flex:1;}
.au-field span{font-size:13px;font-weight:700;color:var(--ink);}
.au-field input,.au-field select,.au-field textarea{border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;color:var(--ink);outline:none;background:#fff;}
.au-field input:focus,.au-field select:focus,.au-field textarea:focus{border-color:var(--green-light);}
.au-field textarea{resize:vertical;}
.au-actions{display:flex;gap:10px;margin-top:6px;}
.au-cancel{flex:1;background:#fff;border:1px solid var(--line);border-radius:11px;padding:11px;font-family:inherit;font-weight:700;color:var(--ink);cursor:pointer;}
.au-send{flex:2;background:var(--green);color:#fff;border:none;border-radius:11px;padding:11px;font-family:inherit;font-weight:800;cursor:pointer;}
.au-send:disabled,.au-cancel:disabled{opacity:.6;cursor:default;}
@media(max-width:600px){.au-row{flex-direction:column;gap:0;}}
`;
