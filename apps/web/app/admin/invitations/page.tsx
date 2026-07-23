'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Client = { id?: string; fullName?: string; email?: string } | null;

type Invitation = {
  id: string;
  inviteeName: string;
  inviteeEmail?: string | null;
  inviteePhone?: string | null;
  inviteeType?: string | null;
  projectTitle: string;
  field?: string | null;
  projectDescription: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  message?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  client?: Client;
};

const STATUS: Record<string, { labelKey: string; cls: string }> = {
  PENDING: { labelKey: 'ainv.status.PENDING', cls: 'amber' },
  CONTACTED: { labelKey: 'ainv.status.CONTACTED', cls: 'blue' },
  ACCEPTED: { labelKey: 'ainv.status.ACCEPTED', cls: 'ok' },
  DECLINED: { labelKey: 'ainv.status.DECLINED', cls: 'red' },
  CLOSED: { labelKey: 'ainv.status.CLOSED', cls: 'muted' },
};

const STATUS_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'PENDING', labelKey: 'ainv.opt.PENDING' },
  { value: 'CONTACTED', labelKey: 'ainv.opt.CONTACTED' },
  { value: 'ACCEPTED', labelKey: 'ainv.opt.ACCEPTED' },
  { value: 'DECLINED', labelKey: 'ainv.opt.DECLINED' },
  { value: 'CLOSED', labelKey: 'ainv.opt.CLOSED' },
];

const IX_CSS = `
.rx-overlay{position:fixed;inset:0;background:rgba(15,30,27,.45);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50;}
.rx-modal{background:#fff;border-radius:18px;width:100%;max-width:560px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.3);}
.rx-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line);}
.rx-head h3{font-size:17px;font-weight:800;color:var(--ink);margin:0;}
.rx-x{border:none;background:none;font-size:24px;line-height:1;color:var(--muted);cursor:pointer;padding:0 4px;}
.rx-body{padding:20px;overflow-y:auto;}
.rx-row{display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:13.5px;border-bottom:1px dashed var(--line);}
.rx-k{color:var(--muted);flex-shrink:0;}
.rx-v{color:var(--ink);font-weight:600;text-align:left;word-break:break-word;}
.rx-desc{font-size:13.5px;color:#3a4a46;line-height:1.85;margin:12px 0 4px;background:var(--mint);border-radius:12px;padding:12px 14px;white-space:pre-wrap;}
.rx-label{display:block;font-size:13.5px;font-weight:800;color:var(--ink);margin:16px 0 7px;}
.rx-select,.rx-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;font-family:inherit;font-size:14px;box-sizing:border-box;outline:none;background:#fff;}
.rx-area{min-height:80px;resize:vertical;line-height:1.8;}
.rx-select:focus,.rx-area:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.rx-err{background:#fdeceb;border:1px solid #f5cfcc;color:#b4322b;padding:9px 13px;border-radius:10px;font-size:13px;margin-bottom:12px;}
.rx-foot{display:flex;justify-content:flex-end;gap:10px;padding:16px 20px;border-top:1px solid var(--line);background:#fafcfb;}
`;

export default function AdminInvitationsPage() {
  const { tr } = useI18n();
  const [items, setItems] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState<Invitation | null>(null);
  const [status, setStatus] = useState('PENDING');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  function load() {
    setLoading(true);
    api<Invitation[]>('/invitations/admin')
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e?.message || tr('ainv.errLoad', 'تعذّر تحميل الدعوات')))
      .finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
  }, []);

  function open(inv: Invitation) {
    setActive(inv);
    setStatus(inv.status || 'PENDING');
    setNote(inv.adminNote || '');
    setSaveErr('');
  }
  function close() {
    setActive(null);
    setSaveErr('');
  }

  async function submit() {
    if (!active) return;
    setSaveErr('');
    setSaving(true);
    try {
      const body: Record<string, unknown> = { status };
      if (note.trim()) body.adminNote = note.trim();
      await api(`/invitations/${active.id}/status`, { method: 'PATCH', body });
      close();
      load();
    } catch (e: any) {
      setSaveErr(e?.message || tr('ainv.errSave', 'تعذّر حفظ التحديث.'));
      setSaving(false);
    }
  }

  return (
    <AdminShell active="invitations" title={tr('ainv.title', 'الدعوات الخارجية')}>
      <style>{IX_CSS}</style>
      {loading && <div className="ad-loading">{tr('ainv.loading', 'جاري تحميل الدعوات...')}</div>}
      {error && <div className="ad-error">{error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="ad-empty">{tr('ainv.empty', 'مفيش دعوات خارجية لسه.')}</div>
      )}
      {!loading && !error && items.length > 0 && (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('adp.th.client', 'العميل')}</th>
                <th>{tr('ainv.th.invitee', 'المدعوّ')}</th>
                <th>{tr('ainv.th.contact', 'التواصل')}</th>
                <th>{tr('co.th.project', 'المشروع')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((inv) => {
                const stDef = STATUS[inv.status];
                const stLabel = stDef ? tr(stDef.labelKey) : inv.status;
                const stCls = stDef ? stDef.cls : 'muted';
                const contact = inv.inviteeEmail || inv.inviteePhone || '—';
                return (
                  <tr key={inv.id}>
                    <td>{inv.client?.fullName || '—'}</td>
                    <td>{inv.inviteeName}{inv.inviteeType ? ` (${inv.inviteeType})` : ''}</td>
                    <td className="ad-mono">{contact}</td>
                    <td>{inv.projectTitle}</td>
                    <td>
                      <span className={`ad-badge ${stCls}`}>{stLabel}</span>
                    </td>
                    <td>
                      <div className="ad-row-actions">
                        <button className="ad-btn-mini" onClick={() => open(inv)}>
                          {tr('ainv.manage', 'إدارة')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <div className="rx-overlay" onClick={close}>
          <div className="rx-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rx-head">
              <h3>{active.projectTitle}</h3>
              <button className="rx-x" onClick={close}>×</button>
            </div>
            <div className="rx-body">
              <div className="rx-row"><span className="rx-k">{tr('adp.th.client', 'العميل')}</span><span className="rx-v">{active.client?.fullName || '—'}{active.client?.email ? ` · ${active.client.email}` : ''}</span></div>
              <div className="rx-row"><span className="rx-k">{tr('ainv.th.invitee', 'المدعوّ')}</span><span className="rx-v">{active.inviteeName}{active.inviteeType ? ` (${active.inviteeType})` : ''}</span></div>
              {active.inviteeEmail && <div className="rx-row"><span className="rx-k">{tr('ainv.email', 'الإيميل')}</span><span className="rx-v">{active.inviteeEmail}</span></div>}
              {active.inviteePhone && <div className="rx-row"><span className="rx-k">{tr('ainv.phone', 'التليفون')}</span><span className="rx-v">{active.inviteePhone}</span></div>}
              {active.field && <div className="rx-row"><span className="rx-k">{tr('co.th.field', 'المجال')}</span><span className="rx-v">{active.field}</span></div>}
              <p className="rx-desc">{active.projectDescription}</p>
              {active.message && (
                <>
                  <label className="rx-label">{tr('ainv.clientMsg', 'رسالة العميل لمقدم الخدمة')}</label>
                  <p className="rx-desc" style={{ margin: 0 }}>{active.message}</p>
                </>
              )}

              {saveErr && <div className="rx-err" style={{ marginTop: 14 }}>{saveErr}</div>}

              <label className="rx-label">{tr('ainv.statusLabel', 'حالة الدعوة')}</label>
              <select className="rx-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{tr(o.labelKey)}</option>
                ))}
              </select>

              <label className="rx-label">{tr('arc.noteLabel', 'ملاحظة للعميل (اختياري)')}</label>
              <textarea
                className="rx-area"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={tr('ainv.notePh', 'أي تحديث حابب توصّله للعميل عن حالة الدعوة.')}
              />
            </div>
            <div className="rx-foot">
              <button className="ad-btn-mini" onClick={close}>{tr('common.cancel', 'إلغاء')}</button>
              <button className="ad-btn" onClick={submit} disabled={saving}>
                {saving ? tr('apl.saving', 'جاري الحفظ...') : tr('ainv.saveUpdate', 'حفظ التحديث')}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
