'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AdminShell from '@/components/AdminShell';

type Req = {
  id: string;
  code: string;
  category: string;
  status: string;
  title: string;
  description?: string;
  entityName?: string | null;
  nationality?: string | null;
  budget?: string | number | null;
  preferredContact?: string | null;
  adminNote?: string | null;
  consultantNote?: string | null;
  assignedConsultantId?: string | null;
  createdAt: string;
  client?: { fullName: string; email: string } | null;
  assignedConsultant?: { fullName: string } | null;
};

type Consultant = {
  id: string;
  fullName: string;
  legalConsultantProfile?: { title?: string; field?: string } | null;
};

const CAT_LABEL: Record<string, string> = {
  IP_PROTECTION: 'ملكية فكرية',
  COMPANY_FORMATION: 'تأسيس شركات',
  FOREIGNER_CASE: 'قضايا أجانب',
  GENERAL_CONSULT: 'استشارة عامة',
  OTHER: 'أخرى',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'مُقدَّم',
  IN_REVIEW: 'قيد المراجعة',
  ASSIGNED: 'تم التعيين',
  IN_PROGRESS: 'قيد التنفيذ',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلق',
  REJECTED: 'مرفوض',
};

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: 'blue',
  IN_REVIEW: 'amber',
  ASSIGNED: 'blue',
  IN_PROGRESS: 'amber',
  RESOLVED: 'ok',
  CLOSED: 'muted',
  REJECTED: 'red',
};

const TABS = [
  { key: 'ALL', label: 'الكل' },
  { key: 'SUBMITTED', label: 'مُقدَّم' },
  { key: 'IN_REVIEW', label: 'قيد المراجعة' },
  { key: 'ASSIGNED', label: 'تم التعيين' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
  { key: 'RESOLVED', label: 'تم الحل' },
  { key: 'CLOSED', label: 'مغلق' },
  { key: 'REJECTED', label: 'مرفوض' },
];

const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

const AL_CSS = `
.al-editor{background:#fff;border:1px solid var(--green-light);border-radius:16px;padding:20px;margin-bottom:20px;box-shadow:0 10px 26px rgba(24,70,61,.08);}
.al-editor h3{margin:0 0 4px;font-size:16px;font-weight:800;color:var(--ink);}
.al-editor .al-code{font-size:12.5px;color:var(--muted);direction:ltr;text-align:right;margin-bottom:14px;}
.al-editor-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.al-fld label{display:block;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.al-fld select,.al-fld textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:#fff;box-sizing:border-box;}
.al-fld.full{grid-column:1 / -1;}
.al-fld textarea{min-height:80px;resize:vertical;line-height:1.7;}
.al-detail{grid-column:1 / -1;background:var(--mint);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--ink);line-height:1.8;white-space:pre-wrap;}
.al-editor-actions{display:flex;gap:10px;margin-top:16px;}
.al-cancel{border:1px solid var(--line);background:#fff;color:var(--muted);padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
@media(max-width:720px){.al-editor-grid{grid-template-columns:1fr;}}
`;

export default function AdminLegalPage() {
  const [rows, setRows] = useState<Req[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [tab, setTab] = useState('ALL');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Req | null>(null);
  const [draftStatus, setDraftStatus] = useState('');
  const [draftConsultant, setDraftConsultant] = useState('');
  const [draftNote, setDraftNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== 'ALL') params.set('status', tab);
    if (q.trim()) params.set('q', q.trim());
    try {
      const d = await api<Req[]>(`/legal/requests?${params.toString()}`);
      setRows(Array.isArray(d) ? d : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    api<Consultant[]>('/users/legal-consultants')
      .then((d) => setConsultants(Array.isArray(d) ? d : []))
      .catch(() => setConsultants([]));
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openEditor(r: Req) {
    setSel(r);
    setDraftStatus(r.status);
    setDraftConsultant(r.assignedConsultantId || '');
    setDraftNote(r.adminNote || '');
  }

  async function save() {
    if (!sel) return;
    setSaving(true);
    try {
      await api(`/legal/requests/${sel.id}`, {
        method: 'PATCH',
        body: {
          status: draftStatus,
          assignedConsultantId: draftConsultant || null,
          adminNote: draftNote,
        },
      });
      setSel(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'حصل خطأ أثناء الحفظ');
    }
    setSaving(false);
  }

  return (
    <AdminShell active="legal" title="الطلبات القانونية">
      <style>{AL_CSS}</style>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="ad-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="ابحث بالعنوان أو الكود..."
          />
          <button onClick={load}>بحث</button>
        </div>
      </div>

      {sel && (
        <div className="al-editor">
          <h3>{sel.title}</h3>
          <div className="al-code">{sel.code} · {CAT_LABEL[sel.category] || sel.category}</div>
          <div className="al-editor-grid">
            {sel.description && (
              <div className="al-detail">
                {sel.description}
                {sel.entityName ? `\n\nاسم الكيان: ${sel.entityName}` : ''}
                {sel.nationality ? `\nالجنسية: ${sel.nationality}` : ''}
                {sel.budget ? `\nالميزانية: ${sel.budget} ج.م` : ''}
                {sel.preferredContact ? `\nوسيلة التواصل: ${sel.preferredContact}` : ''}
                {sel.consultantNote ? `\n\nرد المستشار: ${sel.consultantNote}` : ''}
              </div>
            )}
            <div className="al-fld">
              <label>الحالة</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="al-fld">
              <label>المستشار المسؤول</label>
              <select
                value={draftConsultant}
                onChange={(e) => setDraftConsultant(e.target.value)}
              >
                <option value="">— بدون تعيين —</option>
                {consultants.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                    {c.legalConsultantProfile?.title
                      ? ` — ${c.legalConsultantProfile.title}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="al-fld full">
              <label>ملاحظة للعميل (اختياري)</label>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder="ملاحظة تظهر للعميل مع طلبه"
              />
            </div>
          </div>
          <div className="al-editor-actions">
            <button className="ad-btn" onClick={save} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button className="al-cancel" onClick={() => setSel(null)}>
              إلغاء
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">لا توجد طلبات في هذا القسم.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>العنوان</th>
                <th>النوع</th>
                <th>العميل</th>
                <th>المستشار</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ad-mono">{r.code}</td>
                  <td>{r.title}</td>
                  <td>{CAT_LABEL[r.category] || r.category}</td>
                  <td>{r.client?.fullName || '—'}</td>
                  <td>{r.assignedConsultant?.fullName || '—'}</td>
                  <td>
                    <span className={`ad-badge ${STATUS_TONE[r.status] || 'muted'}`}>
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-row-actions">
                      <button className="ad-btn-mini" onClick={() => openEditor(r)}>
                        إدارة
                      </button>
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
