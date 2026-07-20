'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

type SentNotification = {
  id: string;
  adminName: string;
  target: string;
  role?: string | null;
  recipientName?: string | null;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  recipientCount: number;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'العملاء',
  PROVIDER: 'مقدمو الخدمة',
  SUPERVISOR: 'المشرفون',
  ADMIN: 'الأدمن',
};

function targetLabel(n: SentNotification) {
  if (n.target === 'user') return n.recipientName || 'مستخدم محدد';
  if (n.target === 'role')
    return `فئة: ${ROLE_LABELS[n.role || ''] || n.role || ''}`;
  return 'كل المستخدمين';
}

function fmtDate(s: string) {
  try {
    return new Date(s).toLocaleString('ar-EG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return s;
  }
}

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<SentNotification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<SentNotification[]>('/admin/notifications')
      .then(setItems)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminShell active="notifications" title="سجل الإشعارات">
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>
        كل الرسائل والتنبيهات اللي الإدارة بعتتها للمستخدمين. للإرسال، روح لصفحة
        «المستخدمون».
      </p>

      {error && <div className="ad-error">{error}</div>}

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">لسه مفيش إشعارات مبعوتة.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>المُرسِل</th>
                <th>المستهدفون</th>
                <th>العدد</th>
                <th>العنوان</th>
                <th>الرابط</th>
              </tr>
            </thead>
            <tbody>
              {items.map((n) => (
                <tr key={n.id}>
                  <td className="ad-mono">{fmtDate(n.createdAt)}</td>
                  <td>{n.adminName}</td>
                  <td>{targetLabel(n)}</td>
                  <td>
                    <span className="ad-badge blue">{n.recipientCount}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {n.title}
                    </div>
                    {n.body && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: 'var(--muted)',
                          marginTop: 3,
                        }}
                      >
                        {n.body}
                      </div>
                    )}
                  </td>
                  <td className="ad-mono">
                    {n.linkUrl ? (
                      <a href={n.linkUrl} style={{ color: 'var(--green-dark)' }}>
                        {n.linkUrl}
                      </a>
                    ) : (
                      '—'
                    )}
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
