'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

type Ad = {
  id: string;
  advertiserId?: string | null;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  placement: string;
  status: string;
  amount: number;
  paid: boolean;
  orderIndex: number;
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
};

// ===== ضغط الصورة وتحويلها لصيغة تتخزّن جوه المنصة =====
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

  const LIMIT = 85000;
  let out = render(1000, 0.72);
  let q = 0.72;
  while (out.length > LIMIT && q > 0.35) {
    q -= 0.1;
    out = render(1000, q);
  }
  if (out.length > LIMIT) {
    q = 0.6;
    out = render(680, q);
    while (out.length > LIMIT && q > 0.3) {
      q -= 0.1;
      out = render(680, q);
    }
  }
  return out;
}

const AAD_CSS = `
.aad-form { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px; margin-bottom:22px; box-shadow:0 4px 16px rgba(23,33,31,.04); transition:box-shadow .2s,border-color .2s; }
.aad-form.aad-editing { border-color:var(--green-light); box-shadow:0 6px 22px rgba(40,125,115,.14); }
.aad-form-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
.aad-form-title { font-size:16px; font-weight:800; color:var(--ink); }
.aad-cancel { background:#fff; border:1px solid var(--line); border-radius:9px; padding:7px 14px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; color:var(--muted); }
.aad-cancel:hover { border-color:var(--green-light); color:var(--ink); }
.aad-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-bottom:14px; }
.aad-f { display:flex; flex-direction:column; gap:5px; }
.aad-f-wide { grid-column:1 / -1; }
.aad-f span { font-size:12.5px; font-weight:700; color:var(--muted); }
.aad-f input, .aad-f select { height:42px; border:1px solid var(--line); border-radius:10px; padding:0 12px; font-family:inherit; font-size:14px; background:#fff; color:var(--ink); }
.aad-f input:focus, .aad-f select:focus { outline:none; border-color:var(--green-light); }
.aad-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border:2px dashed var(--line); border-radius:12px; padding:24px; cursor:pointer; color:var(--muted); font-size:13.5px; font-weight:700; background:#fafcfb; transition:all .16s; text-align:center; }
.aad-drop:hover { border-color:var(--green-light); color:var(--green-dark); background:var(--mint); }
.aad-drop-hint { font-size:11.5px; font-weight:600; opacity:.8; }
.aad-preview { position:relative; width:100%; height:160px; border-radius:12px; background-size:cover; background-position:center; background-color:var(--mint); border:1px solid var(--line); }
.aad-preview-x { position:absolute; top:8px; inset-inline-start:8px; width:30px; height:30px; border-radius:50%; border:none; background:rgba(0,0,0,.55); color:#fff; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.aad-preview-x:hover { background:rgba(0,0,0,.78); }
.aad-create { background:var(--green); color:#fff; border:none; border-radius:10px; padding:12px 22px; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:background .2s; }
.aad-create:hover:not(:disabled) { background:var(--green-dark); }
.aad-create:disabled { opacity:.55; cursor:not-allowed; }
.aad-state { text-align:center; color:var(--muted); padding:40px 20px; background:#fff; border:1px solid var(--line); border-radius:14px; }
.aad-err { color:#b91c1c; background:#fef2f2; border-color:#fecaca; }
.aad-list { display:flex; flex-direction:column; gap:12px; }
.aad-item { display:flex; gap:14px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px; }
.aad-item.aad-active-edit { border-color:var(--green-light); background:#f6fbf9; }
.aad-thumb { width:70px; height:70px; border-radius:11px; background:var(--mint); background-size:cover; background-position:center; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:11px; color:var(--muted); text-align:center; }
.aad-info { flex:1; min-width:0; }
.aad-item-title { font-size:15px; font-weight:800; color:var(--ink); margin-bottom:3px; }
.aad-item-sub { font-size:12.5px; color:var(--muted); margin-bottom:8px; }
.aad-meta { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.aad-badge { font-size:11.5px; font-weight:800; padding:3px 10px; border-radius:999px; }
.aad-s-ACTIVE { background:#e7f6ef; color:#1f8f5f; }
.aad-s-PENDING { background:#fef6e0; color:#92640a; }
.aad-s-PAUSED { background:#eef1f0; color:#70807b; }
.aad-s-REJECTED { background:#fef2f2; color:#b91c1c; }
.aad-s-EXPIRED { background:#eef1f0; color:#70807b; }
.aad-chip { font-size:11.5px; color:var(--muted); background:#f4f7f5; border:1px solid var(--line); padding:3px 9px; border-radius:999px; }
.aad-actions { display:flex; flex-wrap:wrap; gap:6px; }
.aad-actions button { background:#fff; border:1px solid var(--line); border-radius:9px; padding:7px 13px; font-size:12.5px; font-weight:700; cursor:pointer; font-family:inherit; color:var(--ink); transition:all .16s; }
.aad-actions button:hover { border-color:var(--green-light); }
.aad-actions .aad-edit { color:var(--green-dark); border-color:#cfe4dd; }
.aad-actions .aad-edit:hover { background:var(--mint); }
.aad-actions .aad-del { color:#b91c1c; border-color:#fecaca; }
.aad-actions .aad-del:hover { background:#fef2f2; }
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
      .then((data) => {
        setAds(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
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
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title,
      subtitle: form.subtitle,
      linkUrl: form.linkUrl,
      ctaLabel: form.ctaLabel,
      imageUrl: form.imageUrl,
      placement: form.placement,
    };
    try {
      if (editingId) {
        await api(`/ads/${editingId}`, { method: 'PATCH', body: payload });
      } else {
        await api('/ads', { method: 'POST', body: payload });
      }
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
    } catch (err: any) {
      alert('فشل التحديث: ' + err.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف هذا الإعلان نهائيًا؟')) return;
    try {
      await api(`/ads/${id}`, { method: 'DELETE' });
      if (editingId === id) resetForm();
      load();
    } catch (err: any) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  return (
    <AdminShell active="ads" title="الإعلانات">
      <style>{AAD_CSS}</style>

      <div className={`aad-form${editingId ? ' aad-editing' : ''}`}>
        <div className="aad-form-head">
          <div className="aad-form-title">{editingId ? '✏️ تعديل الإعلان' : 'إضافة إعلان جديد'}</div>
          {editingId && (
            <button type="button" className="aad-cancel" onClick={resetForm}>إلغاء التعديل</button>
          )}
        </div>
        <div className="aad-grid">
          <label className="aad-f">
            <span>العنوان *</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: خصم 20% على تصميم المواقع" />
          </label>
          <label className="aad-f">
            <span>الوصف</span>
            <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="سطر وصف قصير" />
          </label>
          <label className="aad-f">
            <span>نص الزر</span>
            <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="اعرف أكثر" />
          </label>
          <label className="aad-f">
            <span>الرابط عند الضغط (اختياري)</span>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label className="aad-f">
            <span>مكان العرض</span>
            <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <label className="aad-f aad-f-wide">
            <span>صورة الإعلان</span>
            {form.imageUrl ? (
              <div className="aad-preview" style={{ backgroundImage: `url(${form.imageUrl})` }}>
                <button type="button" className="aad-preview-x" onClick={() => setForm({ ...form, imageUrl: '' })}>✕</button>
              </div>
            ) : (
              <label className="aad-drop">
                <span>🖼️ {uploading ? 'جاري المعالجة...' : 'ارفع صورة من جهازك'}</span>
                <span className="aad-drop-hint">هتتضغط وتتصغّر تلقائيًا قبل الحفظ</span>
                <input type="file" accept="image/*" onChange={onFile} hidden />
              </label>
            )}
          </label>
        </div>
        <button className="aad-create" onClick={submit} disabled={saving || uploading || !form.title.trim()}>
          {saving ? 'جاري الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة الإعلان (مفعّل مباشرة)'}
        </button>
      </div>

      {loading ? (
        <div className="aad-state">جاري التحميل...</div>
      ) : error ? (
        <div className="aad-state aad-err">{error}</div>
      ) : ads.length === 0 ? (
        <div className="aad-state">لا توجد إعلانات بعد. أضف أول إعلان من الفورم فوق.</div>
      ) : (
        <div className="aad-list">
          {ads.map((ad) => (
            <div className={`aad-item${editingId === ad.id ? ' aad-active-edit' : ''}`} key={ad.id}>
              <div className="aad-thumb" style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : undefined}>
                {!ad.imageUrl && 'بدون صورة'}
              </div>
              <div className="aad-info">
                <div className="aad-item-title">{ad.title}</div>
                {ad.subtitle && <div className="aad-item-sub">{ad.subtitle}</div>}
                <div className="aad-meta">
                  <span className={`aad-badge aad-s-${ad.status}`}>{STATUS_LABELS[ad.status] || ad.status}</span>
                  <span className="aad-chip">{PLACEMENTS.find((p) => p.value === ad.placement)?.label || ad.placement}</span>
                  <span className="aad-chip">👁 {ad.impressions} · 🖱 {ad.clicks}</span>
                </div>
              </div>
              <div className="aad-actions">
                <button className="aad-edit" onClick={() => startEdit(ad)}>تعديل</button>
                {ad.status !== 'ACTIVE' && <button onClick={() => setStatus(ad.id, 'ACTIVE')}>تفعيل</button>}
                {ad.status === 'ACTIVE' && <button onClick={() => setStatus(ad.id, 'PAUSED')}>إيقاف</button>}
                {ad.status !== 'REJECTED' && <button onClick={() => setStatus(ad.id, 'REJECTED')}>رفض</button>}
                <button className="aad-del" onClick={() => remove(ad.id)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
