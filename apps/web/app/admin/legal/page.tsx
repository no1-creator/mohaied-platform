'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AdminShell from '@/components/AdminShell';
import { useI18n } from '@/lib/i18n';

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

const CAT_LABEL_KEYS: Record<string, string> = {
  IP_PROTECTION: 'alg.cat.IP_PROTECTION',
  COMPANY_FORMATION: 'alg.cat.COMPANY_FORMATION',
  FOREIGNER_CASE: 'alg.cat.FOREIGNER_CASE',
  GENERAL_CONSULT: 'alg.cat.GENERAL_CONSULT',
  OTHER: 'alg.cat.OTHER',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  SUBMITTED: 'alg.status.SUBMITTED',
  IN_REVIEW: 'alg.status.IN_REVIEW',
  ASSIGNED: 'alg.status.ASSIGNED',
  IN_PROGRESS: 'alg.status.IN_PROGRESS',
  RESOLVED: 'alg.status.RESOLVED',
  CLOSED: 'alg.status.CLOSED',
  REJECTED: 'alg.status.REJECTED',
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
  { key: 'ALL', labelKey: 'aky.status.ALL' },
  { key: 'SUBMITTED', labelKey: 'alg.status.SUBMITTED' },
  { key: 'IN_REVIEW', labelKey: 'alg.status.IN_REVIEW' },
  { key: 'ASSIGNED', labelKey: 'alg.status.ASSIGNED' },
  { key: 'IN_PROGRESS', labelKey: 'alg.status.IN_PROGRESS' },
  { key: 'RESOLVED', labelKey: 'alg.status.RESOLVED' },
  { key: 'CLOSED', labelKey: 'alg.status.CLOSED' },
  { key: 'REJECTED', labelKey: 'alg.status.REJECTED' },
];

const STATUS_OPTIONS = Object.keys(STATUS_LABEL_KEYS);

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
  const { tr } = useI18n();
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
      alert(e?.message || tr('alg.errSave', 'حصل خطأ أثناء الحفظ'));
    }
    setSaving(false);
  }

  return (
    <AdminShell active="legal" title={tr('alg.title', 'الطلبات القانونية')}>
      <style>{AL_CSS}</style>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'active' : ''}
              onClick={() => setTab(t.key)}
            >
              {tr(t.labelKey)}
            </button>
          ))}
        </div>
        <div className="ad-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder={tr('alg.searchPh', 'ابحث بالعنوان أو الكود...')}
          />
          <button onClick={load}>{tr('common.search', 'بحث')}</button>
        </div>
      </div>

      {sel && (
        <div className="al-editor">
          <h3>{sel.title}</h3>
          <div className="al-code">{sel.code} · {CAT_LABEL_KEYS[sel.category] ? tr(CAT_LABEL_KEYS[sel.category]) : sel.category}</div>
          <div className="al-editor-grid">
            {sel.description && (
              <div className="al-detail">
                {sel.description}
                {sel.entityName ? `\n\n${tr('alg.entityName', 'اسم الكيان:')} ${sel.entityName}` : ''}
                {sel.nationality ? `\n${tr('alg.nationality', 'الجنسية:')} ${sel.nationality}` : ''}
                {sel.budget ? `\n${tr('alg.budget', 'الميزانية:')} ${sel.budget} ${tr('common.currency', 'ج.م')}` : ''}
                {sel.preferredContact ? `\n${tr('alg.contact', 'وسيلة التواصل:')} ${sel.preferredContact}` : ''}
                {sel.consultantNote ? `\n\n${tr('alg.consultantReply', 'رد المستشار:')} ${sel.consultantNote}` : ''}
              </div>
            )}
            <div className="al-fld">
              <label>{tr('co.th.status', 'الحالة')}</label>
              <select
                value={draftStatus}
                onChange={(e) => setDraftStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {tr(STATUS_LABEL_KEYS[s])}
                  </option>
                ))}
              </select>
            </div>
            <div className="al-fld">
              <label>{tr('alg.assignedConsultant', 'المستشار المسؤول')}</label>
              <select
                value={draftConsultant}
                onChange={(e) => setDraftConsultant(e.target.value)}
              >
                <option value="">{tr('alg.unassigned', '— بدون تعيين —')}</option>
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
              <label>{tr('arc.noteLabel', 'ملاحظة للعميل (اختياري)')}</label>
              <textarea
                value={draftNote}
                onChange={(e) => setDraftNote(e.target.value)}
                placeholder={tr('alg.notePh', 'ملاحظة تظهر للعميل مع طلبه')}
              />
            </div>
          </div>
          <div className="al-editor-actions">
            <button className="ad-btn" onClick={save} disabled={saving}>
              {saving ? tr('apl.saving', 'جاري الحفظ...') : tr('alg.saveChanges', 'حفظ التغييرات')}
            </button>
            <button className="al-cancel" onClick={() => setSel(null)}>
              {tr('common.cancel', 'إلغاء')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">{tr('alg.empty', 'لا توجد طلبات في هذا القسم.')}</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('acx.th.code', 'الكود')}</th>
                <th>{tr('aad.fTitle', 'العنوان')}</th>
                <th>{tr('acx.th.type', 'النوع')}</th>
                <th>{tr('adp.th.client', 'العميل')}</th>
                <th>{tr('alg.thConsultant', 'المستشار')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="ad-mono">{r.code}</td>
                  <td>{r.title}</td>
                  <td>{CAT_LABEL_KEYS[r.category] ? tr(CAT_LABEL_KEYS[r.category]) : r.category}</td>
                  <td>{r.client?.fullName || '—'}</td>
                  <td>{r.assignedConsultant?.fullName || '—'}</td>
                  <td>
                    <span className={`ad-badge ${STATUS_TONE[r.status] || 'muted'}`}>
                      {STATUS_LABEL_KEYS[r.status] ? tr(STATUS_LABEL_KEYS[r.status]) : r.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-row-actions">
                      <button className="ad-btn-mini" onClick={() => openEditor(r)}>
                        {tr('ainv.manage', 'إدارة')}
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
