'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type FileItem = {
  id: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
  uploaderId?: string | null;
};

const MAX_MB = 10;

const PF_CSS = `
.pf-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-top:24px;}
.pf-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
.pf-h{font-size:16px;font-weight:800;color:var(--ink);margin:0;}
.pf-upload{padding:9px 16px;border-radius:10px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;font-family:inherit;}
.pf-upload:disabled{opacity:.5;cursor:default;}
.pf-hint{font-size:12px;color:var(--muted);margin:8px 0 0;}
.pf-err{color:#c0392b;font-size:13px;font-weight:700;margin:10px 0 0;}
.pf-empty{color:var(--muted);font-size:13.5px;margin:14px 0 0;}
.pf-list{display:flex;flex-direction:column;gap:10px;margin-top:14px;}
.pf-item{display:flex;align-items:center;gap:12px;background:var(--mint);border-radius:12px;padding:12px 14px;}
.pf-icon{font-size:22px;flex-shrink:0;}
.pf-info{display:flex;flex-direction:column;min-width:0;flex:1;}
.pf-name{font-weight:700;font-size:13.5px;color:var(--ink);word-break:break-word;}
.pf-meta{font-size:11.5px;color:var(--muted);margin-top:2px;}
.pf-actions{display:flex;gap:8px;flex-shrink:0;}
.pf-btn{padding:6px 12px;border-radius:9px;border:1px solid var(--line);background:#fff;color:var(--green-dark);font-weight:700;font-size:12.5px;cursor:pointer;font-family:inherit;}
.pf-btn:disabled{opacity:.5;cursor:default;}
.pf-del{color:#c0392b;}
@media(max-width:520px){.pf-item{flex-wrap:wrap;}.pf-actions{width:100%;}}
`;

function fmtSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mime?: string | null) {
  if (!mime) return '📎';
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('word') || mime.includes('document')) return '📝';
  if (mime.includes('sheet') || mime.includes('excel')) return '📊';
  if (mime.includes('zip') || mime.includes('rar')) return '🗜️';
  return '📎';
}

export default function ProjectFiles({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function load() {
    api<FileItem[]>(`/files/project/${projectId}`)
      .then((d) => setFiles(d))
      .catch(() => setFiles([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!projectId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('فشل قراءة الملف'));
      reader.readAsDataURL(file);
    });
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = '';
    if (!file) return;
    setErr('');
    if (file.size > MAX_MB * 1024 * 1024) {
      setErr(`حجم الملف أكبر من ${MAX_MB} ميجا`);
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      await api('/files', {
        method: 'POST',
        body: {
          name: file.name,
          mimeType: file.type || undefined,
          dataUrl,
          projectId,
        },
      });
      load();
    } catch (e: any) {
      setErr(e?.message || 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  }

  async function download(f: FileItem) {
    setBusyId(f.id);
    setErr('');
    try {
      const res = await api<{ dataUrl: string; name: string }>(`/files/${f.id}`);
      const a = document.createElement('a');
      a.href = res.dataUrl;
      a.download = f.name || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      setErr(e?.message || 'فشل تحميل الملف');
    } finally {
      setBusyId('');
    }
  }

  async function remove(f: FileItem) {
    if (!confirm(`متأكد إنك عايز تمسح «${f.name}»؟`)) return;
    setBusyId(f.id);
    setErr('');
    try {
      await api(`/files/${f.id}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e: any) {
      setErr(e?.message || 'فشل حذف الملف');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="pf-card">
      <style>{PF_CSS}</style>
      <div className="pf-head">
        <h2 className="pf-h">ملفات المشروع</h2>
        <button
          className="pf-upload"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'جاري الرفع…' : '＋ رفع ملف'}
        </button>
        <input
          ref={inputRef}
          type="file"
          onChange={onPick}
          style={{ display: 'none' }}
        />
      </div>
      <p className="pf-hint">
        أقصى حجم للملف {MAX_MB} ميجا. الملفات متاحة لأطراف المشروع بس.
      </p>

      {err && <p className="pf-err">{err}</p>}

      {loading ? (
        <p className="pf-empty">جاري التحميل…</p>
      ) : files.length === 0 ? (
        <p className="pf-empty">لسه مفيش ملفات مرفوعة.</p>
      ) : (
        <div className="pf-list">
          {files.map((f) => (
            <div className="pf-item" key={f.id}>
              <span className="pf-icon">{fileIcon(f.mimeType)}</span>
              <div className="pf-info">
                <span className="pf-name">{f.name}</span>
                <span className="pf-meta">{fmtSize(f.size)}</span>
              </div>
              <div className="pf-actions">
                <button
                  className="pf-btn"
                  onClick={() => download(f)}
                  disabled={busyId === f.id}
                >
                  تحميل
                </button>
                <button
                  className="pf-btn pf-del"
                  onClick={() => remove(f)}
                  disabled={busyId === f.id}
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
