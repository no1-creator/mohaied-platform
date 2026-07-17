'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
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

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

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
      await api(`/admin/users/${u.id}/verify`, {
        method: 'PATCH',
        body: { isVerified: !u.isVerified },
      });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isVerified: !u.isVerified } : x)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  async function toggleActive(u: User) {
    setBusy(u.id);
    try {
      await api(`/admin/users/${u.id}/active`, {
        method: 'PATCH',
        body: { isActive: !u.isActive },
      });
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x)),
      );
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminShell active="users" title="المستخدمون">
      <div className="ad-toolbar">
        <div className="ad-tabs">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.value}
              className={role === r.value ? 'active' : ''}
              onClick={() => setRole(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <form
          className="ad-search"
          onSubmit={(e) => {
            e.preventDefault();
            setReloadKey((k) => k + 1);
          }}
        >
          <input
            placeholder="بحث بالاسم أو الإيميل..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit">بحث</button>
        </form>
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
                      <button
                        className="ad-btn-mini"
                        disabled={busy === u.id}
                        onClick={() => toggleVerify(u)}
                      >
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
