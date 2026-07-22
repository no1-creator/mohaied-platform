'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import AdminShell from '@/components/AdminShell';

type Opp = {
  id: string; code: string; title: string; summary: string; description: string;
  sector: string; stage: string; amountSought: string | number; currency?: string | null;
  equityOffered?: number | null; location?: string | null; website?: string | null;
  status: string; featured: boolean; adminNote?: string | null;
  createdAt: string; founder?: { fullName: string; email: string } | null;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'مطروح للتمويل',
  IN_TALKS: 'في تفاوض',
  FUNDED: 'تم تمويله',
  CLOSED: 'مغلق',
  REJECTED: 'مرفوض',
};
const STATUS_TONE: Record<string, string> = {
  OPEN: 'ok',
  IN_TALKS: 'amber',
  FUNDED: 'blue',
  CLOSED: 'muted',
  REJECTED: 'red',
};
const STATUS_OPTIONS = Object.keys(STATUS_LABEL);
const TABS = [
  { key: 'ALL', label: 'الكل' },
  { key: 'OPEN', label: 'مطروح' },
  { key: 'IN_TALKS', label: 'في تفاوض' },
  { key: 'FUNDED', label: 'تم تمويله' },
  { key: 'CLOSED', label: 'مغلق' },
  { key: 'REJECTED', label: 'مرفوض' },
];
const money = (v: any, c?: string | null) =>
  `${Number(v || 0).toLocaleString('en')} ${c || 'ج.م'}`;

const AI_CSS = `
.ai-editor{background:#fff;border:1px solid var(--green-light);border-radius:16px;padding:20px;margin-bottom:20px;box-shadow:0 10px 26px rgba(24,70,61,.08);}
.ai-editor h3{margin:0 0 4px;font-size:16px;font-weight:800;color:var(--ink);}
.ai-code{font-size:12.5px;color:var(--muted);direction:ltr;text-align:right;margin-bottom:14px;}
.ai-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.ai-fld label{display:block;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.ai-fld select,.ai-fld textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:#fff;box-sizing:border-box;}
.ai-fld.full{grid-column:1 / -1;}
.ai-fld textarea{min-height:70px;resize:vertical;line-height:1.7;}
.ai-check{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--ink);font-weight:700;}
.ai-detail{grid-column:1 / -1;background:var(--mint);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--ink);line-height:1.8;white-space:pre-wrap;}
.ai-actions{display:flex;gap:10px;margin-top:16px;}
.ai-cancel{border:1px solid var(--line);background:#fff;color:var(--muted);padding:10px 18px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
@media(max-width:720px){.ai-grid{grid-template-columns:1fr;}}
`;

export default function AdminInvestPage() {
  const [rows, setRows] = useState<Opp[]>([]);
  const [tab, setTab] = useState('ALL');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Opp | null>(null);
  const [dStatus, setDStatus] = useState('');
  const [dFeatured, setDFeatured] = useState(false);
  const [dNote, setDNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== 'ALL') params.set('status', tab);
    if (q.trim()) params.set('q', q.trim());
    try {
      const d = await api<Opp[]>(`/invest/opportunities/admin?${params.toString()}`);
      setRows(Array.isArray(d) ? d : []);
    } catch {
      setRows([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openEditor(o: Opp) {
    setSel(o);
    setDStatus(o.status);
    setDFeatured(!!o.featured);
    setDNote(o.adminNote || '');
  }

  async function save() {
    if (!sel) return;
    setSaving(true);
    try {
      await api(`/invest/opportunities/${sel.id}/admin`, {
        method: 'PATCH',
        body: { status: dStatus, featured: dFeatured, adminNote: dNote },
      });
      setSel(null);
      await load();
    } catch (e: any) {
      alert(e?.message || 'حصل خطأ أثناء الحفظ');
    }
    setSaving(false);
  }

  return (
    <AdminShell active="invest" title="بوابة الاستثمار">
      <style>{AI_CSS}</style>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {TABS.map((t) => (
            <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="ad-search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="بحث بالعنوان أو الكود..."
          />
          <button onClick={load}>بحث</button>
        </div>
      </div>

      {sel && (
        <div className="ai-editor">
          <h3>{sel.title}</h3>
          <div className="ai-code">{sel.code} · {sel.sector} · {money(sel.amountSought, sel.currency)}</div>
          <div className="ai-grid">
            <div className="ai-detail">
              {sel.summary}
              {'\n\n'}
              {sel.description}
              {sel.founder ? `\n\nصاحب المشروع: ${sel.founder.fullName} (${sel.founder.email})` : ''}
              {sel.website ? `\nرابط: ${sel.website}` : ''}
            </div>
            <div className="ai-fld">
              <label>الحالة</label>
              <select value={dStatus} onChange={(e) => setDStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div className="ai-fld">
              <label>تمييز الفرصة</label>
              <label className="ai-check">
                <input type="checkbox" checked={dFeatured} onChange={(e) => setDFeatured(e.target.checked)} />
                عرضها في المقدّمة
              </label>
            </div>
            <div className="ai-fld full">
              <label>ملاحظة إدارية (اختياري)</label>
              <textarea value={dNote} onChange={(e) => setDNote(e.target.value)} placeholder="ملاحظة داخلية / للمتابعة" />
            </div>
          </div>
          <div className="ai-actions">
            <button className="ad-btn" onClick={save} disabled={saving}>
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button className="ai-cancel" onClick={() => setSel(null)}>إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : rows.length === 0 ? (
        <div className="ad-empty">لا توجد فرص في هذا القسم.</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>العنوان</th>
                <th>القطاع</th>
                <th>التمويل</th>
                <th>صاحبها</th>
                <th>الحالة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="ad-mono">{o.code}</td>
                  <td>{o.featured ? '⭐ ' : ''}{o.title}</td>
                  <td>{o.sector}</td>
                  <td>{money(o.amountSought, o.currency)}</td>
                  <td>{o.founder?.fullName || '—'}</td>
                  <td>
                    <span className={`ad-badge ${STATUS_TONE[o.status] || 'muted'}`}>
                      {STATUS_LABEL[o.status] || o.status}
                    </span>
                  </td>
                  <td>
                    <div className="ad-row-actions">
                      <button className="ad-btn-mini" onClick={() => openEditor(o)}>إدارة</button>
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
