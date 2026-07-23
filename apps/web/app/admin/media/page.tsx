'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { useI18n } from '@/lib/i18n';

type MediaItem = {
  id: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  url: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

const MD_CSS = `
.md-intro{color:var(--muted);font-size:13.5px;line-height:1.8;margin-bottom:16px;}
.md-bar{margin-bottom:18px;}
.md-upload{display:inline-flex;align-items:center;background:var(--green);color:#fff;padding:10px 20px;border-radius:11px;font-weight:800;font-size:14px;cursor:pointer;}
.md-upload:hover{background:var(--green-dark);}
.md-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;}
.md-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;gap:8px;}
.md-thumb{width:100%;height:130px;border-radius:10px;overflow:hidden;background:var(--mint);display:flex;align-items:center;justify-content:center;}
.md-thumb img{width:100%;height:100%;object-fit:cover;}
.md-name{font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.md-meta{font-size:11.5px;color:var(--muted);}
.md-actions{display:flex;gap:8px;margin-top:2px;}
`;

export default function AdminMediaPage() {
  const { tr } = useI18n();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  function load() {
    api<MediaItem[]>('/files/media/list')
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function onPick(file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error(tr('act.errImage', 'لازم تختار صورة'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tr('act.errSize', 'حجم الصورة أكبر من 5 ميجا'));
      return;
    }
    setUploading(true);
    try {
      const dataUrl: string = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = () => rej(new Error(tr('act.errRead', 'فشل قراءة الصورة')));
        r.readAsDataURL(file);
      });
      await api('/files/media', {
        method: 'POST',
        body: { name: file.name, mimeType: file.type, dataUrl },
      });
      toast.success(tr('amd.uploaded', 'اترفعت الصورة ✅'));
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function copyUrl(it: MediaItem) {
    const abs = `${API_BASE}${it.url}`;
    try {
      await navigator.clipboard.writeText(abs);
      toast.success(tr('amd.copied', 'اتنسخ الرابط ✅'));
    } catch {
      toast.info(abs);
    }
  }

  async function remove(it: MediaItem) {
    if (!confirm(tr('amd.confirmDelete', 'متأكد إنك عايز تمسح الصورة دي؟'))) return;
    try {
      await api(`/files/media/${it.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((x) => x.id !== it.id));
      toast.success(tr('amd.deleted', 'اتمسحت ✅'));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function fmtSize(n?: number | null) {
    if (!n) return '';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <AdminShell active="media" title={tr('ash.nav.media', 'مكتبة الوسائط')}>
      <style>{MD_CSS}</style>
      <p className="md-intro">
        {tr('amd.intro', 'ارفع الصور هنا واستخدمها في أي مكان بالموقع — انسخ رابط الصورة أو اختارها مباشرة من محرر «نصوص الواجهات».')}
      </p>

      <div className="md-bar">
        <label className="md-upload">
          {uploading ? tr('act.uploading', 'جاري الرفع…') : tr('amd.uploadNew', '+ رفع صورة جديدة')}
          <input
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">{tr('amd.empty', 'لسه مفيش صور في المكتبة.')}</div>
      ) : (
        <div className="md-grid">
          {items.map((it) => (
            <div className="md-card" key={it.id}>
              <div className="md-thumb">
                <img src={`${API_BASE}${it.url}`} alt={it.name} />
              </div>
              <div className="md-name" title={it.name}>
                {it.name}
              </div>
              <div className="md-meta">{fmtSize(it.size)}</div>
              <div className="md-actions">
                <button className="ad-btn-mini" onClick={() => copyUrl(it)}>
                  {tr('amd.copyBtn', 'نسخ الرابط')}
                </button>
                <button
                  className="ad-btn-mini danger"
                  onClick={() => remove(it)}
                >
                  {tr('apl.delete', 'حذف')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
