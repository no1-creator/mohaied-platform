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

const AAD_CSS = `
.aad-form { background:#fff; border:1px solid var(--line); border-radius:16px; padding:20px; margin-bottom:22px; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.aad-form-title { font-size:16px; font-weight:800; color:var(--ink); margin-bottom:14px; }
.aad-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; margin-bottom:14px; }
.aad-f { display:flex; flex-direction:column; gap:5px; }
.aad-f span { font-size:12.5px; font-weight:700; color:var(--muted); }
.aad-f input, .aad-f select { height:42px; border:1px solid var(--line); border-radius:10px; padding:0 12px; font-family:inherit; font-size:14px; background:#fff; color:var(--ink); }
.aad-f input:focus, .aad-f select:focus { outline:none; border-color:var(--green-light); }
.aad-create { background:var(--green); color:#fff; border:none; border-radius:10px; padding:12px 22px; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; transition:background .2s; }
.aad-create:hover:not(:disabled) { background:var(--green-dark); }
.aad-create:disabled { opacity:.55; cursor:not-allowed; }
.aad-state { text-align:center; color:var(--muted); padding:40px 20px; background:#fff; border:1px solid var(--line); border-radius:14px; }
.aad-err { color:#b91c1c; background:#fef2f2; border-color:#fecaca; }
.aad-list { display:flex; flex-direction:column; gap:12px; }
.aad-item { display:flex; gap:14px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px; }
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
.aad-actions .aad-del { color:#b91c1c; border-color:#fecaca; }
.aad-actions .aad-del:hover { background:#fef2f2; }
`;

export default function AdminAdsPage() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

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

  const create = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await api('/ads', {
        method: 'POST',
        body: {
          title: form.title,
          subtitle: form.subtitle || undefined,
          imageUrl: form.imageUrl || undefined,
          linkUrl: form.linkUrl || undefined,
          ctaLabel: form.ctaLabel || undefined,
          placement: form.placement,
        },
      });
      setForm({ ...EMPTY });
      load();
    } catch (err: any) {
      alert('فشل إنشاء الإعلان: ' + err.message);
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
      load();
    } catch (err: any) {
      alert('فشل الحذف: ' + err.message);
    }
  };

  return (
    <AdminShell active="ads" title="الإعلانات">
      <style>{AAD_CSS}</style>

      <div className="aad-form">
        <div className="aad-form-title">إضافة إعلان جديد</div>
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
            <span>رابط الصورة</span>
            <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label className="aad-f">
            <span>رابط الإعلان</span>
            <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
          </label>
          <label className="aad-f">
            <span>نص الزر</span>
            <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="اعرف أكثر" />
          </label>
          <label className="aad-f">
            <span>مكان العرض</span>
            <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
              {PLACEMENTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>
        </div>
        <button className="aad-create" onClick={create} disabled={saving || !form.title.trim()}>
          {saving ? 'جاري الحفظ...' : 'إضافة الإعلان (مفعّل مباشرة)'}
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
            <div className="aad-item" key={ad.id}>
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
