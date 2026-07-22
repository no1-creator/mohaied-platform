'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { toast } from '@/components/Toast';
import { CONTENT_REGISTRY, contentGroups, ContentEntry } from '@/lib/content';
import { useI18n } from '@/lib/i18n';

type DbItem = { id: string; key: string; value: string; groupKey?: string; label?: string; type?: string };

const CT_CSS = `
.ct-intro{color:var(--muted);font-size:13.5px;line-height:1.8;margin-bottom:18px;}
.ct-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap;}
.ct-group{margin-bottom:26px;}
.ct-group-h{font-weight:800;font-size:15px;color:var(--ink);margin:0 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line);}
.ct-item{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 16px;margin-bottom:12px;}
.ct-label{display:block;font-weight:700;font-size:13.5px;color:var(--ink);margin-bottom:4px;}
.ct-key{font-size:11px;color:var(--muted);direction:ltr;text-align:right;margin-bottom:8px;font-family:monospace;}
.ct-input,.ct-textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;box-sizing:border-box;outline:none;}
.ct-textarea{resize:vertical;min-height:80px;line-height:1.8;}
.ct-input:focus,.ct-textarea:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.ct-row-actions{display:flex;align-items:center;gap:10px;margin-top:9px;flex-wrap:wrap;}
.ct-btn{padding:8px 16px;border-radius:10px;border:none;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit;background:var(--green);color:#fff;transition:background .15s,opacity .15s;}
.ct-btn:hover{background:var(--green-dark);}
.ct-btn:disabled{opacity:.5;cursor:default;}
.ct-reset{background:#fff;color:var(--muted);border:1px solid var(--line);}
.ct-reset:hover{background:var(--mint);color:var(--green-dark);}
.ct-saved{color:var(--green-dark);font-size:12.5px;font-weight:700;}
.ct-dirty{color:#b45309;font-size:12.5px;font-weight:700;}
.ct-save-all{padding:10px 20px;border-radius:11px;border:none;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;background:var(--ink);color:#fff;}
.ct-save-all:disabled{opacity:.5;cursor:default;}
.ct-img-field{display:flex;flex-direction:column;gap:10px;}
.ct-img-preview{max-width:220px;max-height:130px;border-radius:12px;border:1px solid var(--line);object-fit:cover;}
.ct-img-empty{width:220px;height:110px;border:1px dashed var(--line);border-radius:12px;display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:13px;}
.ct-img-actions{display:flex;gap:10px;align-items:center;}
.ct-upload{display:inline-flex;align-items:center;cursor:pointer;}
`;

export default function AdminContentPage() {
  const { tr } = useI18n();
  const [values, setValues] = useState<Record<string, string>>({});
  const [initial, setInitial] = useState<Record<string, string>>({});
  const [dbByKey, setDbByKey] = useState<Record<string, DbItem>>({});
  const [savingKey, setSavingKey] = useState('');
  const [savingAll, setSavingAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function hydrate() {
    api<DbItem[]>('/content/admin/list')
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const byKey: Record<string, DbItem> = {};
        for (const it of list) byKey[it.key] = it;
        const vals: Record<string, string> = {};
        for (const e of CONTENT_REGISTRY) {
          vals[e.key] = byKey[e.key]?.value ?? e.def;
        }
        setDbByKey(byKey);
        setValues(vals);
        setInitial({ ...vals });
      })
      .catch((err: any) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    hydrate();
  }, []);

  function setVal(key: string, v: string) {
    setValues((prev) => ({ ...prev, [key]: v }));
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

  async function uploadImage(key: string, file: File) {
    if (!file.type.startsWith('image/')) {
      toast.error(tr('act.errImage', 'لازم تختار صورة'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tr('act.errSize', 'حجم الصورة أكبر من 5 ميجا'));
      return;
    }
    setSavingKey(key);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(tr('act.errRead', 'فشل قراءة الصورة')));
        reader.readAsDataURL(file);
      });
      const media = await api<{ url: string }>('/files/media', {
        method: 'POST',
        body: { name: file.name, mimeType: file.type, dataUrl },
      });
      setVal(key, `${API_BASE}${media.url}`);
      toast.success(tr('act.uploaded', 'اترفعت الصورة ✅ — اضغط «حفظ» لتثبيتها'));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingKey('');
    }
  }

  async function saveOne(entry: ContentEntry) {
    setSavingKey(entry.key);
    setError('');
    try {
      await api('/content', {
        method: 'POST',
        body: {
          key: entry.key,
          value: values[entry.key] ?? entry.def,
          groupKey: entry.group,
          label: entry.label,
          type: entry.type || 'text',
        },
      });
      setInitial((prev) => ({ ...prev, [entry.key]: values[entry.key] }));
      toast.success(tr('act.saved', 'اتحفظ ✅'));
      hydrate();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingKey('');
    }
  }

  async function resetOne(entry: ContentEntry) {
    const db = dbByKey[entry.key];
    setSavingKey(entry.key);
    setError('');
    try {
      if (db) await api(`/content/${db.id}`, { method: 'DELETE' });
      setVal(entry.key, entry.def);
      setInitial((prev) => ({ ...prev, [entry.key]: entry.def }));
      setDbByKey((prev) => {
        const next = { ...prev };
        delete next[entry.key];
        return next;
      });
      toast.info(tr('act.resetDone', 'رجع للنص الافتراضي'));
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingKey('');
    }
  }

  async function saveAll() {
    setSavingAll(true);
    setError('');
    try {
      const dirty = CONTENT_REGISTRY.filter((e) => values[e.key] !== initial[e.key]);
      for (const e of dirty) {
        await api('/content', {
          method: 'POST',
          body: {
            key: e.key,
            value: values[e.key] ?? e.def,
            groupKey: e.group,
            label: e.label,
            type: e.type || 'text',
          },
        });
      }
      setInitial({ ...values });
      toast.success(`${tr('act.savedAll.pre', 'اتحفظت التعديلات (')}${dirty.length}${tr('act.savedAll.post', ') ✅')}`);
      hydrate();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSavingAll(false);
    }
  }

  const groups = contentGroups();
  const dirtyCount = CONTENT_REGISTRY.filter((e) => values[e.key] !== initial[e.key]).length;

  return (
    <AdminShell active="content" title={tr('act.title', 'نصوص الواجهات')}>
      <style>{CT_CSS}</style>
      <p className="ct-intro">
        {tr('act.intro', 'عدّل نصوص وعناوين وأوصاف الواجهات مباشرة من غير برمجة. أي نص متغيّرش بيفضل بقيمته الافتراضية.')}
      </p>

      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل...')}</div>
      ) : error ? (
        <div className="ad-error">{error}</div>
      ) : (
        <>
          <div className="ct-bar">
            <span className={dirtyCount ? 'ct-dirty' : 'ct-saved'}>
              {dirtyCount ? `${dirtyCount} ${tr('act.unsavedCount', 'تعديل غير محفوظ')}` : tr('act.allSaved', 'كل التعديلات محفوظة')}
            </span>
            <button className="ct-save-all" onClick={saveAll} disabled={savingAll || dirtyCount === 0}>
              {savingAll ? tr('act.saving', 'جاري الحفظ…') : tr('act.saveAll', 'حفظ كل التعديلات')}
            </button>
          </div>

          {groups.map((g) => (
            <div className="ct-group" key={g}>
              <h3 className="ct-group-h">{g}</h3>
              {CONTENT_REGISTRY.filter((e) => e.group === g).map((e) => {
                const dirty = values[e.key] !== initial[e.key];
                const overridden = !!dbByKey[e.key];
                return (
                  <div className="ct-item" key={e.key}>
                    <label className="ct-label">{e.label}</label>
                    <div className="ct-key">{e.key}</div>
                    {e.type === 'image' ? (
                      <div className="ct-img-field">
                        {values[e.key] ? (
                          <img
                            className="ct-img-preview"
                            src={values[e.key]}
                            alt=""
                          />
                        ) : (
                          <div className="ct-img-empty">{tr('act.noImage', 'لا توجد صورة بعد')}</div>
                        )}
                        <div className="ct-img-actions">
                          <label className="ct-btn ct-upload">
                            {savingKey === e.key ? tr('act.uploading', 'جاري الرفع…') : tr('act.uploadBtn', 'رفع صورة')}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(ev) => {
                                const f = ev.target.files?.[0];
                                if (f) uploadImage(e.key, f);
                                ev.target.value = '';
                              }}
                            />
                          </label>
                          {values[e.key] && (
                            <button
                              className="ct-btn ct-reset"
                              onClick={() => setVal(e.key, '')}
                            >
                              {tr('act.removeBtn', 'إزالة')}
                            </button>
                          )}
                        </div>
                      </div>
                    ) : e.type === 'textarea' ? (
                      <textarea
                        className="ct-textarea"
                        value={values[e.key] ?? ''}
                        onChange={(ev) => setVal(e.key, ev.target.value)}
                      />
                    ) : (
                      <input
                        className="ct-input"
                        value={values[e.key] ?? ''}
                        onChange={(ev) => setVal(e.key, ev.target.value)}
                      />
                    )}
                    <div className="ct-row-actions">
                      <button
                        className="ct-btn"
                        onClick={() => saveOne(e)}
                        disabled={savingKey === e.key || !dirty}
                      >
                        {savingKey === e.key ? tr('act.saving', 'جاري الحفظ…') : tr('common.save', 'حفظ')}
                      </button>
                      <button
                        className="ct-btn ct-reset"
                        onClick={() => resetOne(e)}
                        disabled={savingKey === e.key || !overridden}
                      >
                        {tr('act.resetBtn', 'رجوع للافتراضي')}
                      </button>
                      {dirty && <span className="ct-dirty">{tr('act.dirty', 'غير محفوظ')}</span>}
                      {!dirty && overridden && <span className="ct-saved">{tr('act.overridden', 'معدّل')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </>
      )}
    </AdminShell>
  );
}
