'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import AdminShell from '@/components/AdminShell';
import { money, workModeLabel, jobStatusLabel, jobStatusTone } from '@/lib/employment';
import { useI18n } from '@/lib/i18n';

type Office = {
  id: string; code: string; name: string; city: string; address?: string | null;
  capacity?: number | null; description?: string | null; active: boolean;
};
type Job = {
  id: string; code: string; title: string; employmentType: string; workMode: string;
  monthlySalary: string | number; currency?: string | null; status: string; featured: boolean;
  adminNote?: string | null; employer?: { fullName: string; email: string } | null;
  office?: { name: string; city: string } | null;
};

// خرايط الحالات و money موحّدة في: lib/employment.ts
const JOB_STATUSES = ['OPEN', 'PAUSED', 'CLOSED', 'FILLED'];

const AEM_CSS = `
.aem-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);padding:5px;border-radius:12px;width:fit-content;margin-bottom:16px;flex-wrap:wrap;}
.aem-tabs button{border:none;background:transparent;padding:9px 18px;border-radius:9px;font-family:inherit;font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;}
.aem-tabs button.active{background:var(--green);color:#fff;}
.aem-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;margin-bottom:18px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.aem-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;}
.aem-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.aem-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
.aem-title{font-size:15px;font-weight:800;color:var(--ink);margin:0;}
.aem-meta{font-size:12.5px;color:var(--muted);margin:0;}
.aem-field{margin-bottom:10px;}
.aem-field label{display:block;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:5px;}
.aem-input,.aem-area,.aem-select{width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 11px;font-family:inherit;font-size:13.5px;box-sizing:border-box;background:#fff;}
.aem-area{min-height:70px;resize:vertical;line-height:1.6;}
.aem-row{display:flex;gap:10px;flex-wrap:wrap;}
.aem-row .aem-field{flex:1;min-width:120px;}
.aem-btn{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:13.5px;}
.aem-btn:disabled{opacity:.6;cursor:default;}
.aem-mini{border:1px solid var(--line);background:#fff;color:var(--green-dark);padding:6px 12px;border-radius:8px;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer;}
.aem-mini:hover{background:var(--mint);}
.aem-mini.danger{color:#b4322b;border-color:#f2cecb;}
.aem-badge{display:inline-block;padding:3px 10px;border-radius:99px;font-size:11.5px;font-weight:700;white-space:nowrap;}
.aem-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.aem-badge.muted{background:#eef1f0;color:var(--muted);}
.aem-badge.amber{background:#fdf3dd;color:#96690f;}
.aem-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.aem-mono{direction:ltr;font-size:12px;color:var(--muted);}
.aem-search{display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;}
.aem-search input,.aem-search select{border:1px solid var(--line);border-radius:9px;padding:9px 12px;font-family:inherit;font-size:13.5px;background:#fff;}
.aem-search input{flex:1;min-width:180px;}
.aem-empty{padding:28px;text-align:center;color:var(--muted);}
.aem-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
.aem-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:9px 12px;border-radius:10px;font-size:13px;margin-bottom:12px;}
.aem-check{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:10px;cursor:pointer;}
.aem-sub{border-top:1px dashed var(--line);margin-top:8px;padding-top:10px;}
`;

export default function AdminEmploymentPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [tab, setTab] = useState<'offices' | 'jobs'>('offices');

  const [offices, setOffices] = useState<Office[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [busy, setBusy] = useState(false);

  // office form
  const [oName, setOName] = useState('');
  const [oCity, setOCity] = useState('');
  const [oAddress, setOAddress] = useState('');
  const [oCapacity, setOCapacity] = useState('');
  const [oDesc, setODesc] = useState('');
  const [oErr, setOErr] = useState('');
  const [oSaving, setOSaving] = useState(false);

  // office edit
  const [editOffice, setEditOffice] = useState('');
  const [oDraft, setODraft] = useState<Partial<Office>>({});

  // jobs
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editJob, setEditJob] = useState('');
  const [jDraft, setJDraft] = useState<{ status: string; featured: boolean; adminNote: string }>({ status: 'OPEN', featured: false, adminNote: '' });

  async function loadOffices() {
    try { const d = await api<Office[]>('/employment/offices/admin'); setOffices(Array.isArray(d) ? d : []); }
    catch { setOffices([]); }
  }
  async function loadJobs() {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (q.trim()) params.set('q', q.trim());
    try { const d = await api<Job[]>(`/employment/jobs/admin?${params.toString()}`); setJobs(Array.isArray(d) ? d : []); }
    catch { setJobs([]); }
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    api<{ role: string }>('/users/me')
      .then(async (me) => {
        if (me.role !== 'ADMIN') { setState('denied'); return; }
        await loadOffices();
        setState('ok');
      })
      .catch(() => setState('denied'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (state !== 'ok') return;
    if (tab === 'offices') loadOffices();
    else loadJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state]);

  async function createOffice() {
    setOErr('');
    if (oName.trim().length < 2) return setOErr(tr('aem.errName', 'اكتب اسم المكتب.'));
    if (oCity.trim().length < 2) return setOErr(tr('aem.errCity', 'اكتب المدينة.'));
    setOSaving(true);
    try {
      await api('/employment/offices', {
        method: 'POST',
        body: {
          name: oName.trim(),
          city: oCity.trim(),
          address: oAddress.trim() || undefined,
          capacity: oCapacity ? Number(oCapacity) : undefined,
          description: oDesc.trim() || undefined,
        },
      });
      setOName(''); setOCity(''); setOAddress(''); setOCapacity(''); setODesc('');
      await loadOffices();
    } catch (e: any) { setOErr(e?.message || tr('aem.err', 'حصل خطأ')); }
    setOSaving(false);
  }

  function startEditOffice(o: Office) {
    setEditOffice(o.id);
    setODraft({ name: o.name, city: o.city, address: o.address || '', capacity: o.capacity ?? undefined, description: o.description || '', active: o.active });
  }
  async function saveOffice(id: string) {
    setBusy(true);
    try {
      await api(`/employment/offices/${id}`, {
        method: 'PATCH',
        body: {
          name: (oDraft.name || '').trim() || undefined,
          city: (oDraft.city || '').trim() || undefined,
          address: (oDraft.address || '').trim() || null,
          capacity: oDraft.capacity != null && String(oDraft.capacity) !== '' ? Number(oDraft.capacity) : null,
          description: (oDraft.description || '').trim() || null,
          active: !!oDraft.active,
        },
      });
      setEditOffice('');
      await loadOffices();
    } catch (e: any) { alert(e?.message || tr('aem.err', 'حصل خطأ')); }
    setBusy(false);
  }
  async function toggleOffice(o: Office) {
    setBusy(true);
    try { await api(`/employment/offices/${o.id}`, { method: 'PATCH', body: { active: !o.active } }); await loadOffices(); }
    catch (e: any) { alert(e?.message || tr('aem.err', 'حصل خطأ')); }
    setBusy(false);
  }

  function startEditJob(j: Job) {
    setEditJob(editJob === j.id ? '' : j.id);
    setJDraft({ status: j.status, featured: j.featured, adminNote: j.adminNote || '' });
  }
  async function saveJob(id: string) {
    setBusy(true);
    try {
      await api(`/employment/jobs/${id}/admin`, {
        method: 'PATCH',
        body: { status: jDraft.status, featured: jDraft.featured, adminNote: jDraft.adminNote.trim() || null },
      });
      setEditJob('');
      await loadJobs();
    } catch (e: any) { alert(e?.message || tr('aem.err', 'حصل خطأ')); }
    setBusy(false);
  }

  if (state === 'loading')
    return (<AdminShell active="employment" title={tr('aem.title', 'التوظيف الخليجي')}><div className="aem-empty">{tr('cls.loading', 'جاري التحميل...')}</div></AdminShell>);
  if (state === 'denied')
    return (<AdminShell active="employment" title={tr('aem.title', 'التوظيف الخليجي')}><div className="aem-empty">{tr('aem.denied', 'الصفحة دي للأدمن بس.')}</div></AdminShell>);

  return (
    <AdminShell active="employment" title={tr('aem.title', 'التوظيف الخليجي')}>
      <style>{AEM_CSS}</style>

      <div className="aem-tabs">
        <button className={tab === 'offices' ? 'active' : ''} onClick={() => setTab('offices')}>{tr('aem.tabOffices', 'مكاتب محايد')}</button>
        <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>{tr('aem.tabJobs', 'مراقبة الوظائف')}</button>
      </div>

      {tab === 'offices' ? (
        <>
          <div className="aem-panel">
            <h3 className="aem-title" style={{ marginBottom: 12 }}>{tr('aem.addOffice', 'إضافة مكتب جديد')}</h3>
            {oErr && <div className="aem-err">{oErr}</div>}
            <div className="aem-row">
              <div className="aem-field"><label>{tr('aem.oName', 'اسم المكتب')}</label><input className="aem-input" value={oName} onChange={(e) => setOName(e.target.value)} placeholder={tr('aem.oNamePh', 'مثال: مكتب القاهرة')} /></div>
              <div className="aem-field"><label>{tr('aem.oCity', 'المدينة')}</label><input className="aem-input" value={oCity} onChange={(e) => setOCity(e.target.value)} placeholder={tr('aem.oCityPh', 'مثال: القاهرة')} /></div>
              <div className="aem-field"><label>{tr('aem.oCapacity', 'السعة (اختياري)')}</label><input className="aem-input" type="number" value={oCapacity} onChange={(e) => setOCapacity(e.target.value)} placeholder={tr('aem.oCapacityPh', 'عدد المقاعد')} /></div>
            </div>
            <div className="aem-field"><label>{tr('aem.oAddress', 'العنوان (اختياري)')}</label><input className="aem-input" value={oAddress} onChange={(e) => setOAddress(e.target.value)} placeholder={tr('aem.oAddressPh', 'العنوان التفصيلي')} /></div>
            <div className="aem-field"><label>{tr('aem.oDesc', 'وصف (اختياري)')}</label><textarea className="aem-area" value={oDesc} onChange={(e) => setODesc(e.target.value)} placeholder={tr('aem.oDescPh', 'تفاصيل المكتب والتجهيزات.')} /></div>
            <button className="aem-btn" onClick={createOffice} disabled={oSaving}>{oSaving ? tr('apl.saving', 'جاري الحفظ...') : tr('aem.addOfficeBtn', 'إضافة المكتب')}</button>
          </div>

          {offices.length === 0 ? (
            <div className="aem-empty">{tr('aem.emptyOffices', 'مفيش مكاتب مضافة لسه.')}</div>
          ) : (
            <div className="aem-grid">
              {offices.map((o) => (
                <div key={o.id} className="aem-card">
                  <div className="aem-card-top">
                    <div>
                      <h3 className="aem-title">{o.name}</h3>
                      <p className="aem-meta">{o.city}{o.capacity != null ? ` · ${o.capacity} ${tr('aem.seatsUnit', 'مقعد')}` : ''} · <span className="aem-mono">{o.code}</span></p>
                    </div>
                    <span className={`aem-badge ${o.active ? 'ok' : 'muted'}`}>{o.active ? tr('aem.active', 'مفعّل') : tr('aem.inactive', 'موقوف')}</span>
                  </div>
                  {o.address && <p className="aem-meta">{o.address}</p>}
                  {o.description && <p className="aem-meta">{o.description}</p>}

                  {editOffice === o.id ? (
                    <div className="aem-sub">
                      <div className="aem-row">
                        <div className="aem-field"><label>{tr('adu.th.name', 'الاسم')}</label><input className="aem-input" value={oDraft.name || ''} onChange={(e) => setODraft((d) => ({ ...d, name: e.target.value }))} /></div>
                        <div className="aem-field"><label>{tr('aem.oCity', 'المدينة')}</label><input className="aem-input" value={oDraft.city || ''} onChange={(e) => setODraft((d) => ({ ...d, city: e.target.value }))} /></div>
                      </div>
                      <div className="aem-field"><label>{tr('aem.fAddress', 'العنوان')}</label><input className="aem-input" value={oDraft.address || ''} onChange={(e) => setODraft((d) => ({ ...d, address: e.target.value }))} /></div>
                      <div className="aem-field"><label>{tr('aem.fCapacity', 'السعة')}</label><input className="aem-input" type="number" value={oDraft.capacity ?? ''} onChange={(e) => setODraft((d) => ({ ...d, capacity: e.target.value === '' ? undefined : Number(e.target.value) }))} /></div>
                      <div className="aem-field"><label>{tr('apl.fDesc', 'الوصف')}</label><textarea className="aem-area" value={oDraft.description || ''} onChange={(e) => setODraft((d) => ({ ...d, description: e.target.value }))} /></div>
                      <label className="aem-check"><input type="checkbox" checked={!!oDraft.active} onChange={(e) => setODraft((d) => ({ ...d, active: e.target.checked }))} /> {tr('aem.officeActive', 'مكتب مفعّل')}</label>
                      <div className="aem-actions">
                        <button className="aem-btn" onClick={() => saveOffice(o.id)} disabled={busy}>{tr('common.save', 'حفظ')}</button>
                        <button className="aem-mini" onClick={() => setEditOffice('')}>{tr('common.cancel', 'إلغاء')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="aem-actions">
                      <button className="aem-mini" onClick={() => startEditOffice(o)}>{tr('apl.edit', 'تعديل')}</button>
                      <button className={`aem-mini ${o.active ? 'danger' : ''}`} onClick={() => toggleOffice(o)} disabled={busy}>{o.active ? tr('aem.stop', 'إيقاف') : tr('aem.activate', 'تفعيل')}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="aem-search">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadJobs()} placeholder={tr('aem.jobSearchPh', 'ابحث بالمسمى أو الكود...')} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">{tr('aem.allStatuses', 'كل الحالات')}</option>
              {JOB_STATUSES.map((s) => <option key={s} value={s}>{jobStatusLabel(tr, s)}</option>)}
            </select>
            <button className="aem-btn" onClick={loadJobs}>{tr('common.search', 'بحث')}</button>
          </div>

          {jobs.length === 0 ? (
            <div className="aem-empty">{tr('aem.emptyJobs', 'مفيش وظائف مطابقة.')}</div>
          ) : (
            <div className="aem-grid">
              {jobs.map((j) => (
                <div key={j.id} className="aem-card">
                  <div className="aem-card-top">
                    <div>
                      <h3 className="aem-title">{j.title}{j.featured ? ' ⭐' : ''}</h3>
                      <p className="aem-meta">{j.employer?.fullName || ''} · {workModeLabel(tr, j.workMode)} · {money(j.monthlySalary, j.currency)}</p>
                      <p className="aem-meta"><span className="aem-mono">{j.code}</span></p>
                    </div>
                    <span className={`aem-badge ${jobStatusTone(j.status)}`}>{jobStatusLabel(tr, j.status)}</span>
                  </div>
                  {j.adminNote && <p className="aem-meta">📝 {j.adminNote}</p>}

                  {editJob === j.id ? (
                    <div className="aem-sub">
                      <div className="aem-field"><label>{tr('co.th.status', 'الحالة')}</label><select className="aem-select" value={jDraft.status} onChange={(e) => setJDraft((d) => ({ ...d, status: e.target.value }))}>{JOB_STATUSES.map((s) => <option key={s} value={s}>{jobStatusLabel(tr, s)}</option>)}</select></div>
                      <label className="aem-check"><input type="checkbox" checked={jDraft.featured} onChange={(e) => setJDraft((d) => ({ ...d, featured: e.target.checked }))} /> {tr('aem.jobFeatured', 'وظيفة مميّزة (Featured)')}</label>
                      <div className="aem-field"><label>{tr('aem.jobAdminNote', 'ملاحظة إدارية')}</label><textarea className="aem-area" value={jDraft.adminNote} onChange={(e) => setJDraft((d) => ({ ...d, adminNote: e.target.value }))} placeholder={tr('aem.jobNotePh', 'ملاحظة داخلية (اختياري)')} /></div>
                      <div className="aem-actions">
                        <button className="aem-btn" onClick={() => saveJob(j.id)} disabled={busy}>{tr('common.save', 'حفظ')}</button>
                        <button className="aem-mini" onClick={() => setEditJob('')}>{tr('common.cancel', 'إلغاء')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="aem-actions">
                      <button className="aem-mini" onClick={() => startEditJob(j)}>{tr('ainv.manage', 'إدارة')}</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </AdminShell>
  );
}
