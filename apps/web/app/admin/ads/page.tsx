'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

type Ad = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  placement: string;
  status: string;
  amount: number;
  paid: boolean;
  priority: number;
  dailyImpressionCap: number;
  impressionsToday: number;
  impressionDay?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  clicks: number;
  impressions: number;
};

const PLACEMENTS = [
  { value: 'HOME_TOP', label: 'أعلى الرئيسية' },
  { value: 'HOME_STRIP', label: 'شريط وسط الرئيسية' },
  { value: 'CLIENT_DASHBOARD', label: 'صفحة العميل' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'بانتظار المراجعة',
  ACTIVE: 'مفعّل',
  PAUSED: 'موقوف',
  REJECTED: 'مرفوض',
  EXPIRED: 'منتهي',
};

const EMPTY = {
  title: '',
  subtitle: '',
  imageUrl: '',
  linkUrl: '',
  ctaLabel: '',
  placement: 'HOME_TOP',
  startDate: '',
  endDate: '',
  priority: '0',
  dailyImpressionCap: '0',
  amount: '0',
  paid: false,
};

// أيقونات الأزرار (SVG صغيرة احترافية)
const IC = {
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  ),
  play: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5.5v13a1 1 0 0 0 1.5.87l11-6.5a1 1 0 0 0 0-1.74l-11-6.5A1 1 0 0 0 7 5.5z" />
    </svg>
  ),
  pause: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  ),
  reject: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  ),
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

async function compressImage(file: File): Promise<string> {
  const readerUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = await loadImage(readerUrl);
  const render = (maxDim: number, quality: number): string => {
    let w = img.width;
    let h = img.height;
    if (w > h && w > maxDim) {
      h = Math.round((h * maxDim) / w);
      w = maxDim;
    } else if (h >= w && h > maxDim) {
      w = Math.round((w * maxDim) / h);
      h = maxDim;
    }
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return readerUrl;
    ctx.drawImage(img, 0, 0, w, h);
    return c.toDataURL('image/jpeg', quality);
  };
  const LIMIT = 3500000;
  let out = render(1920, 0.85);
  let q = 0.85;
  while (out.length > LIMIT && q > 0.5) {
    q -= 0.07;
    out = render(1920, q);
  }
  if (out.length > LIMIT) {
    q = 0.72;
    out = render(1500, q);
    while (out.length > LIMIT && q > 0.45) {
      q -= 0.07;
      out = render(1500, q);
    }
  }
  return out;
}

function toDateInput(iso?: string | null) {
  return iso ? iso.slice(0, 10) : '';
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function addDaysStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso?: string | null) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('ar-EG');
  } catch {
    return '—';
  }
}

const AAD_CSS = `
.aad-form { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px; margin-bottom:24px; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.aad-form.aad-editing { border-color:var(--green-light); box-shadow:0 0 0 3px rgba(79,162,148,.15); }
.aad-form-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
.aad-form-title { font-size:17px; font-weight:800; color:var(--ink); }
.aad-cancel { background:none; border:1px solid var(--line); border-radius:9px; padding:7px 14px; font-size:13px; font-weight:700; color:var(--muted); cursor:pointer; font-family:inherit; }
.aad-cancel:hover { border-color:#d33; color:#d33; }
.aad-sec { font-size:12.5px; font-weight:800; color:var(--green-dark); margin:18px 0 10px; padding-top:4px; border-top:1px dashed var(--line); }
.aad-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.aad-f { display:flex; flex-direction:column; gap:6px; }
.aad-f.aad-wide { grid-column:1 / -1; }
.aad-f span { font-size:12.5px; font-weight:700; color:var(--muted); }
.aad-f input, .aad-f select { height:42px; border:1px solid var(--line); border-radius:10px; padding:0 12px; font-family:inherit; font-size:14px; background:#fff; color:var(--ink); }
.aad-f input:focus, .aad-f select:focus { outline:none; border-color:var(--green-light); }
.aad-hint { font-size:11px; color:var(--muted); font-weight:600; }
.aad-quick { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px; }
.aad-chip { background:var(--mint); border:1px solid #d4e8e1; color:var(--green-dark); border-radius:999px; padding:6px 14px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; }
.aad-chip:hover { background:#dcefe8; }
.aad-check { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:var(--ink); cursor:pointer; height:42px; }
.aad-check input { width:18px; height:18px; accent-color:var(--green); }
.aad-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border:2px dashed var(--line); border-radius:12px; padding:26px; cursor:pointer; color:var(--muted); font-size:13.5px; font-weight:700; background:#fafcfb; transition:all .16s; text-align:center; }
.aad-drop:hover { border-color:var(--green-light); color:var(--green-dark); background:var(--mint); }
.aad-drop-hint { font-size:11.5px; font-weight:600; opacity:.8; }
.aad-preview { position:relative; width:100%; height:180px; border-radius:12px; background-size:cover; background-position:center; background-color:var(--mint); border:1px solid var(--line); }
.aad-preview-x { position:absolute; top:8px; inset-inline-start:8px; width:30px; height:30px; border-radius:50%; border:none; background:rgba(0,0,0,.55); color:#fff; font-size:14px; cursor:pointer; }
.aad-submit { margin-top:18px; width:100%; background:var(--green); color:#fff; border:none; border-radius:11px; padding:14px; font-weight:800; font-size:15px; cursor:pointer; font-family:inherit; transition:background .2s; }
.aad-submit:hover:not(:disabled) { background:var(--green-dark); }
.aad-submit:disabled { opacity:.55; cursor:not-allowed; }
.aad-list { display:flex; flex-direction:column; gap:12px; }
.aad-row { display:flex; gap:14px; align-items:flex-start; background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px; }
.aad-row.aad-active-edit { border-color:var(--green-light); box-shadow:0 0 0 3px rgba(79,162,148,.15); }
.aad-thumb { width:96px; height:64px; border-radius:10px; background:var(--mint); background-size:cover; background-position:center; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:10.5px; color:var(--muted); text-align:center; }
.aad-row-main { flex:1; min-width:0; }
.aad-row-top { display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap; }
.aad-row-title { font-size:15px; font-weight:800; color:var(--ink); }
.aad-meta { display:flex; flex-wrap:wrap; gap:12px; font-size:12.5px; color:var(--muted); margin-bottom:4px; }
.aad-badge { font-size:11px; font-weight:800; padding:2px 10px; border-radius:999px; }
.aad-s-ACTIVE { background:#e7f6ef; color:#1f8f5f; }
.aad-s-PENDING { background:#fef6e0; color:#92640a; }
.aad-s-PAUSED { background:#eef1f0; color:#70807b; }
.aad-s-REJECTED { background:#fef2f2; color:#b91c1c; }
.aad-s-EXPIRED { background:#eef1f0; color:#70807b; }
.aad-actions { display:flex; gap:6px; flex-shrink:0; align-items:center; }
.aad-ico { width:34px; height:34px; display:inline-flex; align-items:center; justify-content:center; border:1px solid var(--line); border-radius:9px; background:#fff; color:var(--muted); cursor:pointer; transition:all .14s; padding:0; }
.aad-ico svg { width:16px; height:16px; display:block; }
.aad-ico:hover { border-color:var(--green-light); color:var(--green-dark); background:var(--mint); }
.aad-ico.aad-ico-ok { color:#1f8f5f; }
.aad-ico.aad-ico-ok:hover { border-color:#1f8f5f; color:#1f8f5f; background:#e7f6ef; }
.aad-ico.aad-ico-warn { color:#a86a08; }
.aad-ico.aad-ico-warn:hover { border-color:#d9820a; color:#b8770a; background:#fef6e0; }
.aad-ico.aad-ico-danger { color:#b91c1c; }
.aad-ico.aad-ico-danger:hover { border-color:#b91c1c; color:#b91c1c; background:#fef2f2; }
.aad-empty { text-align:center; color:var(--muted); padding:40px; font-size:14px; }
@media (max-width:640px) {
  .aad-form { padding:16px; border-radius:14px; }
  .aad-grid { grid-template-columns:1fr; gap:12px; }
  .aad-check { height:auto; padding:6px 0; }
  .aad-row { flex-direction:column; align-items:stretch; }
  .aad-thumb { width:100%; height:150px; }
  .aad-row-top { gap:8px; }
  .aad-meta { gap:8px 14px; }
  .aad-actions { flex-wrap:wrap; }
  .aad-ico { width:40px; height:40px; }
  .aad-ico svg { width:18px; height:18px; }
}
`;

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = () => {
    setLoading(true);
    api<Ad[]>('/ads/admin/list')
      .then((d) => {
        setAds(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ ...EMPTY });
    setEditingId(null);
  };

  const startEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      imageUrl: ad.imageUrl || '',
      linkUrl: ad.linkUrl || '',
      ctaLabel: ad.ctaLabel || '',
      placement: ad.placement || 'HOME_TOP',
      startDate: toDateInput(ad.startDate),
      endDate: toDateInput(ad.endDate),
      priority: String(ad.priority ?? 0),
      dailyImpressionCap: String(ad.dailyImpressionCap ?? 0),
      amount: String(ad.amount ?? 0),
      paid: !!ad.paid,
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setDuration = (n: number) =>
    setForm((f) => ({ ...f, startDate: todayStr(), endDate: addDaysStr(n) }));

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('من فضلك اختر ملف صورة');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      setForm((f) => ({ ...f, imageUrl: dataUrl }));
    } catch {
      alert('تعذّرت معالجة الصورة، جرّب صورة تانية');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async () => {
if (!form.imageUrl && !form.title.trim()) { alert('ضيف صورة أو عنوان على الأقل'); return; }
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      linkUrl: form.linkUrl,
      ctaLabel: form.ctaLabel,
      imageUrl: form.imageUrl,
      placement: form.placement,
      startDate: form.startDate ? `${form.startDate}T00:00:00` : '',
      endDate: form.endDate ? `${form.endDate}T23:59:59` : '',
      priority: Number(form.priority) || 0,
      dailyImpressionCap: Number(form.dailyImpressionCap) || 0,
      amount: Number(form.amount) || 0,
      paid: form.paid,
    };
    try {
      if (editingId) await api(`/ads/${editingId}`, { method: 'PATCH', body: payload });
      else await api('/ads', { method: 'POST', body: payload });
      resetForm();
      load();
    } catch (err: any) {
      alert('فشل الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await api(`/ads/${id}/status`, { method: 'PATCH', body: { status } });
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('متأكد من حذف الإعلان؟')) return;
    try {
      await api(`/ads/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AdminShell active="ads" title="الإعلانات">
      <style>{AAD_CSS}</style>

      <div className={`aad-form ${editingId ? 'aad-editing' : ''}`}>
        <div className="aad-form-head">
          <div className="aad-form-title">{editingId ? '✏️ تعديل الإعلان' : 'إضافة إعلان جديد'}</div>
          {editingId && (
            <button className="aad-cancel" onClick={resetForm}>إلغاء التعديل</button>
          )}
        </div>

        <div className="aad-grid">
          <div className="aad-f aad-wide">
            <span>العنوان </span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: خصم 20% على تصميم المواقع" />
          </div>
          <div className="aad-f">
            <span>الوصف</span>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="سطر وصف قصير" />
          </div>
          <div className="aad-f">
            <span>نص الزر</span>
            <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="اعرف أكثر" />
          </div>
          <div className="aad-f">
            <span>الرابط عند الضغط (اختياري)</span>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
          </div>
          <div className="aad-f">
            <span>مكان العرض</span>
            <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="aad-f aad-wide" style={{ marginTop: 14 }}>
          <span>صورة الإعلان</span>
          {form.imageUrl ? (
            <div className="aad-preview" style={{ backgroundImage: `url(${form.imageUrl})` }}>
              <button className="aad-preview-x" onClick={() => setForm({ ...form, imageUrl: '' })}>✕</button>
            </div>
          ) : (
            <label className="aad-drop">
              <span>🖼️ {uploading ? 'جاري المعالجة...' : 'ارفع صورة من جهازك'}</span>
              <span className="aad-drop-hint">يفضّل صورة عريضة (مثال 1600×600) — بتتصغّر تلقائيًا</span>
              <input type="file" accept="image/*" hidden onChange={onFile} />
            </label>
          )}
        </div>

        <div className="aad-sec">⏱️ مدة العرض</div>
        <div className="aad-quick">
          <button className="aad-chip" onClick={() => setDuration(7)}>7 أيام</button>
          <button className="aad-chip" onClick={() => setDuration(30)}>30 يوم</button>
          <button className="aad-chip" onClick={() => setDuration(90)}>90 يوم</button>
          <button className="aad-chip" onClick={() => setForm({ ...form, startDate: '', endDate: '' })}>بدون مدة (دائم)</button>
        </div>
        <div className="aad-grid">
          <div className="aad-f">
            <span>من تاريخ</span>
            <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div className="aad-f">
            <span>إلى تاريخ</span>
            <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>

        <div className="aad-sec">🎯 التحكم في الظهور</div>
        <div className="aad-grid">
          <div className="aad-f">
            <span>الأولوية (أعلى = يظهر أول وأكتر)</span>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
          <div className="aad-f">
            <span>حد الظهور في اليوم (0 = مفتوح)</span>
            <input type="number" value={form.dailyImpressionCap} onChange={(e) => setForm({ ...form, dailyImpressionCap: e.target.value })} />
            <span className="aad-hint">لما يوصل العدد ده في اليوم، الإعلان يوقف لبكرة تلقائيًا.</span>
          </div>
        </div>

        <div className="aad-sec">💰 التسعير</div>
        <div className="aad-grid">
          <div className="aad-f">
            <span>السعر (جنيه)</span>
            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <label className="aad-check">
            <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} />
            تم دفع قيمة الإعلان
          </label>
        </div>

        <button className="aad-submit" onClick={submit} disabled={saving}
          {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الإعلان (مفعّل مباشرة)'}
        </button>
      </div>

      {loading ? (
        <div className="aad-empty">جاري التحميل...</div>
      ) : error ? (
        <div className="aad-empty">{error}</div>
      ) : ads.length === 0 ? (
        <div className="aad-empty">لا توجد إعلانات بعد. أضف أول إعلان من الأعلى.</div>
      ) : (
        <div className="aad-list">
          {ads.map((ad) => (
            <div key={ad.id} className={`aad-row ${editingId === ad.id ? 'aad-active-edit' : ''}`}>
              <div className="aad-thumb" style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : {}}>
                {!ad.imageUrl && 'بدون صورة'}
              </div>
              <div className="aad-row-main">
                <div className="aad-row-top">
                  <span className="aad-row-title">{ad.title}</span>
                  <span className={`aad-badge aad-s-${ad.status}`}>{STATUS_LABELS[ad.status] || ad.status}</span>
                </div>
                <div className="aad-meta">
                  <span>{PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}</span>
                  <span>الأولوية: {ad.priority}</span>
                  <span>السعر: {ad.amount > 0 ? `${ad.amount} ج` : '—'}{ad.paid ? ' ✓ مدفوع' : ''}</span>
                </div>
                <div className="aad-meta">
                  <span>👁 {ad.impressions}</span>
                  <span>👆 {ad.clicks}</span>
                  <span>اليوم: {ad.impressionsToday}/{ad.dailyImpressionCap > 0 ? ad.dailyImpressionCap : '∞'}</span>
                  <span>المدة: {fmtDate(ad.startDate)} ← {fmtDate(ad.endDate)}</span>
                </div>
              </div>
              <div className="aad-actions">
                <button className="aad-ico" title="تعديل" onClick={() => startEdit(ad)}>{IC.edit}</button>
                {ad.status !== 'ACTIVE' && (
                  <button className="aad-ico aad-ico-ok" title="تفعيل" onClick={() => setStatus(ad.id, 'ACTIVE')}>{IC.play}</button>
                )}
                {ad.status === 'ACTIVE' && (
                  <button className="aad-ico aad-ico-warn" title="إيقاف" onClick={() => setStatus(ad.id, 'PAUSED')}>{IC.pause}</button>
                )}
                {ad.status !== 'REJECTED' && (
                  <button className="aad-ico" title="رفض" onClick={() => setStatus(ad.id, 'REJECTED')}>{IC.reject}</button>
                )}
                <button className="aad-ico aad-ico-danger" title="حذف" onClick={() => remove(ad.id)}>{IC.trash}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
