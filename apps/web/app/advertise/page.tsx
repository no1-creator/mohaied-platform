'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';

type Ad = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  placement: string;
  status: string;
  clicks: number;
  impressions: number;
};

const PLACEMENTS = [
  { value: 'HOME_STRIP', label: 'شريط وسط الرئيسية' },
  { value: 'HOME_TOP', label: 'أعلى الرئيسية' },
  { value: 'CLIENT_DASHBOARD', label: 'صفحة العملاء' },
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
  placement: 'HOME_STRIP',
};

// ===== ضغط الصورة قبل الرفع =====
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

const ADV_CSS = `
.adv-wrap { max-width:1040px; margin:0 auto; padding:26px 20px 90px; }
.adv-hero { position:relative; overflow:hidden; border-radius:24px; padding:34px; color:#fff; background:linear-gradient(135deg,#2f8d81,var(--green-dark) 60%,#184f48); box-shadow:0 22px 50px rgba(24,79,72,.26); margin-bottom:22px; }
.adv-hero h1 { font-size:26px; font-weight:900; margin:0 0 10px; }
.adv-hero p { font-size:15px; opacity:.95; line-height:1.9; margin:0; max-width:620px; }
.adv-success { background:#e7f6ef; color:#1f8f5f; border:1px solid #bfe6d3; border-radius:12px; padding:14px 18px; font-weight:800; font-size:14px; margin-bottom:18px; }
.adv-cols { display:grid; grid-template-columns:1.4fr 1fr; gap:20px; align-items:start; }
.adv-form, .adv-side { background:#fff; border:1px solid var(--line); border-radius:18px; padding:22px; box-shadow:0 4px 16px rgba(23,33,31,.04); }
.adv-form-title { font-size:17px; font-weight:800; color:var(--ink); margin-bottom:16px; }
.adv-note { font-size:12.5px; color:#4a5a55; line-height:1.7; background:var(--mint); border-radius:10px; padding:12px 14px; margin-bottom:16px; }
.adv-f { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.adv-f span { font-size:12.5px; font-weight:700; color:var(--muted); }
.adv-f input, .adv-f select { height:44px; border:1px solid var(--line); border-radius:11px; padding:0 13px; font-family:inherit; font-size:14px; background:#fff; color:var(--ink); }
.adv-f input:focus, .adv-f select:focus { outline:none; border-color:var(--green-light); }
.adv-drop { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; border:2px dashed var(--line); border-radius:12px; padding:26px; cursor:pointer; color:var(--muted); font-size:13.5px; font-weight:700; background:#fafcfb; transition:all .16s; text-align:center; }
.adv-drop:hover { border-color:var(--green-light); color:var(--green-dark); background:var(--mint); }
.adv-drop-hint { font-size:11.5px; font-weight:600; opacity:.8; }
.adv-preview { position:relative; width:100%; height:170px; border-radius:12px; background-size:cover; background-position:center; background-color:var(--mint); border:1px solid var(--line); }
.adv-preview-x { position:absolute; top:8px; inset-inline-start:8px; width:30px; height:30px; border-radius:50%; border:none; background:rgba(0,0,0,.55); color:#fff; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; }
.adv-preview-x:hover { background:rgba(0,0,0,.78); }
.adv-submit { width:100%; background:var(--green); color:#fff; border:none; border-radius:11px; padding:14px; font-weight:800; font-size:15px; cursor:pointer; font-family:inherit; transition:background .2s; }
.adv-submit:hover:not(:disabled) { background:var(--green-dark); }
.adv-submit:disabled { opacity:.55; cursor:not-allowed; }
.adv-side h3 { font-size:16px; font-weight:800; color:var(--ink); margin:0 0 14px; }
.adv-mine { display:flex; flex-direction:column; gap:10px; }
.adv-mine-item { display:flex; gap:12px; align-items:center; border:1px solid var(--line); border-radius:12px; padding:11px; }
.adv-mine-thumb { width:52px; height:52px; border-radius:10px; background:var(--mint); background-size:cover; background-position:center; flex-shrink:0; }
.adv-mine-info { min-width:0; flex:1; }
.adv-mine-title { font-size:13.5px; font-weight:800; color:var(--ink); margin-bottom:4px; }
.adv-badge { font-size:11px; font-weight:800; padding:2px 9px; border-radius:999px; }
.adv-s-ACTIVE { background:#e7f6ef; color:#1f8f5f; }
.adv-s-PENDING { background:#fef6e0; color:#92640a; }
.adv-s-PAUSED { background:#eef1f0; color:#70807b; }
.adv-s-REJECTED { background:#fef2f2; color:#b91c1c; }
.adv-s-EXPIRED { background:#eef1f0; color:#70807b; }
.adv-empty { color:var(--muted); font-size:13px; text-align:center; padding:24px 10px; line-height:1.7; }
@media (max-width:760px) { .adv-cols { grid-template-columns:1fr; } }
`;

export default function AdvertisePage() {
  const router = useRouter();
  const [mine, setMine] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const load = () => {
    api<Ad[]>('/ads/mine')
      .then((d) => {
        setMine(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
  }, [router]);

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
    try {
      await api('/ads', {
        method: 'POST',
        body: {
          title: form.title,
          subtitle: form.subtitle,
          linkUrl: form.linkUrl,
          ctaLabel: form.ctaLabel,
          imageUrl: form.imageUrl,
          placement: form.placement,
        },
      });
      setForm({ ...EMPTY });
      setDone(true);
      load();
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setDone(false), 7000);
    } catch (err: any) {
      alert('فشل إرسال الإعلان: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{ADV_CSS}</style>
      <TopBar />
      <main className="adv-wrap">
        <section className="adv-hero">
          <h1>أعلن معنا على محايد 📣</h1>
          <p>وصّل خدماتك لعملاء وزوار المنصة — اعرض إعلانك في الصفحة الرئيسية أو صفحة العملاء، وزوّد فرص شغلك.</p>
        </section>

        {done && (
          <div className="adv-success">✅ تم إرسال إعلانك بنجاح! هيظهر بعد مراجعة الإدارة والموافقة عليه.</div>
        )}

        <div className="adv-cols">
          <div className="adv-form">
            <div className="adv-form-title">اعمل إعلانك</div>
            <div className="adv-note">
              إعلانك بيتراجع من الإدارة قبل النشر. التكلفة بتكون ضمن باقة اشتراكك أو باتفاق منفصل مع الإدارة.
            </div>

            <label className="adv-f">
              <span>عنوان الإعلان *</span>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="مثال: خدمات تصميم مواقع احترافية" />
            </label>
            <label className="adv-f">
              <span>وصف قصير</span>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="سطر يشرح عرضك باختصار" />
            </label>
            <label className="adv-f">
              <span>نص الزر</span>
              <input value={form.ctaLabel} onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })} placeholder="اعرف أكثر" />
            </label>
            <label className="adv-f">
              <span>الرابط عند الضغط (اختياري)</span>
              <input value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://..." />
            </label>
            <label className="adv-f">
              <span>مكان العرض</span>
              <select value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>
                {PLACEMENTS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>

            <label className="adv-f">
              <span>صورة الإعلان</span>
              {form.imageUrl ? (
                <div className="adv-preview" style={{ backgroundImage: `url(${form.imageUrl})` }}>
                  <button type="button" className="adv-preview-x" onClick={() => setForm({ ...form, imageUrl: '' })}>✕</button>
                </div>
              ) : (
                <label className="adv-drop">
                  <span>🖼️ {uploading ? 'جاري المعالجة...' : 'ارفع صورة من جهازك'}</span>
                  <span className="adv-drop-hint">هتتضغط وتتصغّر تلقائيًا قبل الرفع</span>
                  <input type="file" accept="image/*" onChange={onFile} hidden />
                </label>
              )}
            </label>

            <button className="adv-submit" onClick={submit} disabled={saving || uploading || !form.title.trim()}>
              {saving ? 'جاري الإرسال...' : 'إرسال الإعلان للمراجعة'}
            </button>
          </div>

          <aside className="adv-side">
            <h3>إعلاناتي</h3>
            {loading ? (
              <div className="adv-empty">جاري التحميل...</div>
            ) : mine.length === 0 ? (
              <div className="adv-empty">لسه ماعملتش أي إعلان. ابدأ من الفورم على الشمال.</div>
            ) : (
              <div className="adv-mine">
                {mine.map((ad) => (
                  <div className="adv-mine-item" key={ad.id}>
                    <div className="adv-mine-thumb" style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : undefined} />
                    <div className="adv-mine-info">
                      <div className="adv-mine-title">{ad.title}</div>
                      <span className={`adv-badge adv-s-${ad.status}`}>{STATUS_LABELS[ad.status] || ad.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
