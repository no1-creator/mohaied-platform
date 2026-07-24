'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import { useI18n } from '@/lib/i18n';
import {
  money, fdate,
  empTypeLabel, workModeLabel,
  appStatusLabel, appStatusTone,
  emplStatusLabel, emplStatusTone,
  logStatusLabel, logStatusTone,
} from '@/lib/employment';

type Job = {
  id: string; code: string; title: string; description: string; skills?: string | null;
  seniority?: string | null; employmentType: string; workMode: string;
  monthlySalary: string | number; currency?: string | null; location?: string | null;
  status: string; employer?: { fullName: string } | null; office?: { name: string; city: string } | null;
};
type App = {
  id: string; jobId: string; coverLetter?: string | null; expectedSalary?: string | number | null;
  status: string; employerNote?: string | null; job?: Job | null;
};
type Contract = {
  id: string; code: string; title: string; monthlySalary: string | number; currency?: string | null;
  workMode: string; status: string; employer?: { fullName: string } | null;
  office?: { name: string; city: string } | null;
};
type Log = {
  id: string; date: string; hours?: number | null; summary: string; status: string; employerNote?: string | null;
};

// ثوابت وخرايط التوظيف موحّدة في: lib/employment.ts

const EM_CSS = `
.em-wrap{max-width:1000px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.em-head{margin-bottom:16px;}
.em-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;}
.em-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.em-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;max-width:560px;}
.em-new{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;white-space:nowrap;}
.em-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);padding:5px;border-radius:12px;width:fit-content;margin-bottom:16px;flex-wrap:wrap;}
.em-tabs button{border:none;background:transparent;padding:9px 18px;border-radius:9px;font-family:inherit;font-weight:700;font-size:14px;color:var(--muted);cursor:pointer;}
.em-tabs button.active{background:var(--green);color:#fff;}
.em-search{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.em-search input,.em-search select{border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-family:inherit;font-size:14px;background:#fff;}
.em-search input{flex:1;min-width:200px;}
.em-search button{border:none;background:var(--green);color:#fff;padding:10px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
.em-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.em-empty.small{padding:16px;border:none;background:transparent;}
.em-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.em-list{display:flex;flex-direction:column;gap:14px;}
.em-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.em-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.em-tag{font-size:12px;font-weight:700;color:var(--green-dark);background:var(--mint);padding:3px 10px;border-radius:99px;}
.em-card-title{font-size:17px;font-weight:800;color:var(--ink);margin:0;}
.em-card-meta{font-size:12.5px;color:var(--muted);margin:0;}
.em-mono{direction:ltr;}
.em-desc{font-size:13.5px;color:var(--text);line-height:1.8;margin:0;}
.em-metaline{display:flex;flex-wrap:wrap;gap:8px 16px;font-size:13px;color:var(--muted);}
.em-metaline b{color:var(--ink);}
.em-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;}
.em-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.em-badge.muted{background:#eef1f0;color:var(--muted);}
.em-badge.red{background:#fdeceb;color:#b4322b;}
.em-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.em-badge.amber{background:#fdf3dd;color:#96690f;}
.em-btn{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;}
.em-btn:hover{background:var(--green-dark);}
.em-btn.full{width:100%;}
.em-btn:disabled{opacity:.6;cursor:default;}
.em-input,.em-area,.em-select{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;box-sizing:border-box;background:#fff;}
.em-area{min-height:80px;resize:vertical;line-height:1.7;}
.em-field{margin-bottom:12px;}
.em-field label{display:block;font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.em-row{display:flex;gap:10px;}
.em-row .em-field{flex:1;}
.em-form{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;margin-bottom:20px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.em-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:14px;}
.em-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;}
.em-cancel{border:1px solid var(--line);background:#fff;color:var(--muted);padding:11px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
.em-mini{border:1px solid var(--line);background:#fff;color:var(--green-dark);padding:7px 14px;border-radius:9px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;}
.em-mini:hover{background:var(--mint);}
.em-mini.ok{color:#1c7a4f;border-color:#bfe3cf;}
.em-mini.danger{color:#b4322b;border-color:#f2cecb;}
.em-sub-panel{margin-top:12px;border-top:1px dashed var(--line);padding-top:12px;display:flex;flex-direction:column;gap:10px;}
.em-inner{background:var(--background);border:1px solid var(--line);border-radius:12px;padding:12px 14px;}
.em-inner-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.em-line{font-size:13px;color:var(--text);margin:6px 0 0;}
.em-note{margin-top:8px;background:var(--mint);border-radius:8px;padding:8px 12px;font-size:12.5px;color:var(--ink);line-height:1.7;}
.em-done{text-align:center;background:#e3f4ec;color:#1c7a4f;padding:11px;border-radius:10px;font-weight:700;}
@media(max-width:560px){.em-grid{grid-template-columns:1fr;}.em-row{flex-direction:column;gap:0;}.em-head-row{flex-direction:column;}}
`;

export default function JobsPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [tab, setTab] = useState<'browse' | 'apps' | 'contracts'>('browse');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<App[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeJob, setActiveJob] = useState('');
  const [cover, setCover] = useState('');
  const [expSalary, setExpSalary] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [sending, setSending] = useState(false);
  const [applied, setApplied] = useState<Record<string, boolean>>({});

  const [openContract, setOpenContract] = useState('');
  const [logs, setLogs] = useState<Record<string, Log[]>>({});
  const [logSummary, setLogSummary] = useState('');
  const [logHours, setLogHours] = useState('');
  const [savingLog, setSavingLog] = useState(false);

  async function loadBrowse() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (mode) params.set('workMode', mode);
    try {
      const d = await api<Job[]>(`/employment/jobs?${params.toString()}`);
      setJobs(Array.isArray(d) ? d : []);
    } catch { setJobs([]); }
    setLoading(false);
  }
  async function loadApps() {
    setLoading(true);
    try {
      const d = await api<App[]>('/employment/applications/mine');
      setApps(Array.isArray(d) ? d : []);
    } catch { setApps([]); }
    setLoading(false);
  }
  async function loadContracts() {
    setLoading(true);
    try {
      const d = await api<Contract[]>('/employment/contracts/mine');
      setContracts(Array.isArray(d) ? d : []);
    } catch { setContracts([]); }
    setLoading(false);
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    loadBrowse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (tab === 'browse') loadBrowse();
    else if (tab === 'apps') loadApps();
    else loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openApply(id: string) { setActiveJob(id); setCover(''); setExpSalary(''); setCvUrl(''); }
  async function apply(id: string) {
    setSending(true);
    try {
      await api(`/employment/jobs/${id}/apply`, {
        method: 'POST',
        body: {
          coverLetter: cover.trim() || undefined,
          expectedSalary: expSalary ? Number(expSalary) : undefined,
          cvUrl: cvUrl.trim() || undefined,
        },
      });
      setApplied((m) => ({ ...m, [id]: true }));
      setActiveJob('');
    } catch (e: any) { alert(e?.message || tr('common.error', 'حصل خطأ')); }
    setSending(false);
  }

  async function withdraw(id: string) {
    try { await api(`/employment/applications/${id}/withdraw`, { method: 'PATCH' }); await loadApps(); }
    catch (e: any) { alert(e?.message || tr('common.error', 'حصل خطأ')); }
  }

  async function toggleLogs(id: string) {
    if (openContract === id) { setOpenContract(''); return; }
    setOpenContract(id); setLogSummary(''); setLogHours('');
    if (!logs[id]) {
      try { const d = await api<Log[]>(`/employment/contracts/${id}/logs`); setLogs((m) => ({ ...m, [id]: Array.isArray(d) ? d : [] })); }
      catch { setLogs((m) => ({ ...m, [id]: [] })); }
    }
  }
  async function addLog(id: string) {
    if (logSummary.trim().length < 3) { alert(tr('job.errLog', 'اكتب ملخص للشغل')); return; }
    setSavingLog(true);
    try {
      await api(`/employment/contracts/${id}/logs`, {
        method: 'POST',
        body: { summary: logSummary.trim(), hours: logHours ? Number(logHours) : undefined },
      });
      const d = await api<Log[]>(`/employment/contracts/${id}/logs`);
      setLogs((m) => ({ ...m, [id]: Array.isArray(d) ? d : [] }));
      setLogSummary(''); setLogHours('');
    } catch (e: any) { alert(e?.message || tr('common.error', 'حصل خطأ')); }
    setSavingLog(false);
  }

  return (
    <>
      <style>{EM_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="em-wrap">
        <div className="em-head">
          <h1 className="em-title">{tr('job.title', 'وظائف عن بُعد مع شركات خليجية')}</h1>
          <p className="em-sub">{tr('job.sub', 'قدّم على وظائف موثّقة، وتابع طلباتك وعقودك، وسجّل شغلك اليومي — كله عبر محايد.')}</p>
        </div>

        <div className="em-tabs">
          <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>{tr('job.tabBrowse', 'تصفّح الوظائف')}</button>
          <button className={tab === 'apps' ? 'active' : ''} onClick={() => setTab('apps')}>{tr('job.tabApps', 'طلباتي')}</button>
          <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>{tr('job.tabContracts', 'عقودي')}</button>
        </div>

        {tab === 'browse' && (
          <div className="em-search">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadBrowse()} placeholder={tr('job.searchPh', 'ابحث بالمسمى أو المهارة...')} />
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">{tr('job.allModes', 'كل الأنماط')}</option>
              <option value="REMOTE">{workModeLabel(tr, 'REMOTE')}</option>
              <option value="ONSITE">{workModeLabel(tr, 'ONSITE')}</option>
              <option value="HYBRID">{workModeLabel(tr, 'HYBRID')}</option>
            </select>
            <button onClick={loadBrowse}>{tr('common.search', 'بحث')}</button>
          </div>
        )}

        {loading ? (
          <div className="em-empty">{tr('cls.loading', 'جاري التحميل...')}</div>
        ) : tab === 'browse' ? (
          jobs.length === 0 ? (
            <div className="em-empty">{tr('job.emptyBrowse', 'مفيش وظائف متاحة حاليًا.')}</div>
          ) : (
            <div className="em-grid">
              {jobs.map((j) => (
                <div key={j.id} className="em-card">
                  <div className="em-card-top">
                    <span className="em-tag">{workModeLabel(tr, j.workMode)}</span>
                    <span className="em-tag">{empTypeLabel(tr, j.employmentType)}</span>
                  </div>
                  <h3 className="em-card-title">{j.title}</h3>
                  <p className="em-card-meta">
                    {j.employer ? `${j.employer.fullName} · ` : ''}
                    {j.office ? `${j.office.name} - ${j.office.city}` : j.location || ''}
                  </p>
                  <p className="em-desc">{j.description.length > 160 ? j.description.slice(0, 160) + '…' : j.description}</p>
                  {j.skills && <p className="em-card-meta">{tr('job.skills', 'المهارات:')} {j.skills}</p>}
                  <div className="em-metaline">
                    <span>{tr('job.monthlySalary', 'الراتب الشهري')} <b>{money(j.monthlySalary, j.currency)}</b></span>
                    {j.seniority && <span>{tr('job.level', 'المستوى')} <b>{j.seniority}</b></span>}
                  </div>

                  {applied[j.id] ? (
                    <div className="em-done">{tr('job.applied', 'تم إرسال طلبك ✓')}</div>
                  ) : activeJob === j.id ? (
                    <div className="em-sub-panel">
                      <textarea className="em-area" value={cover} onChange={(e) => setCover(e.target.value)} placeholder={tr('job.coverPh', 'خطاب تعريفي مختصر (اختياري)')} />
                      <div className="em-row">
                        <input className="em-input" type="number" value={expSalary} onChange={(e) => setExpSalary(e.target.value)} placeholder={tr('job.expSalaryPh', 'الراتب المتوقع (اختياري)')} />
                        <input className="em-input" value={cvUrl} onChange={(e) => setCvUrl(e.target.value)} placeholder={tr('job.cvUrlPh', 'رابط السيرة الذاتية (اختياري)')} />
                      </div>
                      <div className="em-actions">
                        <button className="em-btn" onClick={() => apply(j.id)} disabled={sending}>{sending ? tr('job.sending', 'جاري الإرسال...') : tr('job.sendApp', 'إرسال الطلب')}</button>
                        <button className="em-cancel" onClick={() => setActiveJob('')}>{tr('common.cancel', 'إلغاء')}</button>
                      </div>
                    </div>
                  ) : (
                    <button className="em-btn full" onClick={() => openApply(j.id)}>{tr('job.apply', 'قدّم على الوظيفة')}</button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : tab === 'apps' ? (
          apps.length === 0 ? (
            <div className="em-empty">{tr('job.emptyApps', 'لسه ماقدّمتش على أي وظيفة.')}</div>
          ) : (
            <div className="em-list">
              {apps.map((a) => (
                <div key={a.id} className="em-card">
                  <div className="em-card-top">
                    <h3 className="em-card-title">{a.job?.title || tr('job.jobFallback', 'وظيفة')}</h3>
                    <span className={`em-badge ${appStatusTone(a.status)}`}>{appStatusLabel(tr, a.status)}</span>
                  </div>
                  {a.job && <p className="em-card-meta">{a.job.employer?.fullName || ''} · {money(a.job.monthlySalary, a.job.currency)}</p>}
                  {a.expectedSalary != null && <p className="em-line">{tr('job.yourExpSalary', 'راتبك المتوقع:')} <b>{money(a.expectedSalary, a.job?.currency)}</b></p>}
                  {a.employerNote && <div className="em-note"><b>{tr('job.employerReply', 'رد الشركة:')}</b> {a.employerNote}</div>}
                  {['SUBMITTED', 'SHORTLISTED', 'INTERVIEW', 'OFFERED'].includes(a.status) && (
                    <div className="em-actions"><button className="em-mini danger" onClick={() => withdraw(a.id)}>{tr('job.withdraw', 'سحب الطلب')}</button></div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : contracts.length === 0 ? (
          <div className="em-empty">{tr('job.emptyContracts', 'مفيش عقود توظيف لسه.')}</div>
        ) : (
          <div className="em-list">
            {contracts.map((c) => (
              <div key={c.id} className="em-card">
                <div className="em-card-top">
                  <div>
                    <h3 className="em-card-title">{c.title}</h3>
                    <span className="em-card-meta">{c.employer?.fullName || ''} · {money(c.monthlySalary, c.currency)} · <span className="em-mono">{c.code}</span></span>
                  </div>
                  <span className={`em-badge ${emplStatusTone(c.status)}`}>{emplStatusLabel(tr, c.status)}</span>
                </div>
                <div className="em-actions">
                  <button className="em-mini" onClick={() => toggleLogs(c.id)}>{openContract === c.id ? tr('job.hideLogs', 'إخفاء سجل الشغل') : tr('job.showDailyLog', 'سجل الشغل اليومي')}</button>
                </div>

                {openContract === c.id && (
                  <div className="em-sub-panel">
                    {c.status === 'ACTIVE' && (
                      <div className="em-inner">
                        <div className="em-field"><label>{tr('job.logToday', 'سجّل شغل النهاردة')}</label><textarea className="em-area" value={logSummary} onChange={(e) => setLogSummary(e.target.value)} placeholder={tr('job.logSummaryPh', 'اكتب اللي خلّصته النهاردة...')} /></div>
                        <div className="em-row">
                          <input className="em-input" type="number" value={logHours} onChange={(e) => setLogHours(e.target.value)} placeholder={tr('job.hoursPh', 'عدد الساعات (اختياري)')} />
                          <button className="em-btn" onClick={() => addLog(c.id)} disabled={savingLog}>{savingLog ? tr('apl.saving', 'جاري الحفظ...') : tr('job.addLog', 'إضافة السجل')}</button>
                        </div>
                      </div>
                    )}
                    {!logs[c.id] ? (
                      <div className="em-empty small">{tr('cls.loading', 'جاري التحميل...')}</div>
                    ) : logs[c.id].length === 0 ? (
                      <div className="em-empty small">{tr('job.noLogs', 'مفيش سجلات لسه.')}</div>
                    ) : (
                      logs[c.id].map((l) => (
                        <div key={l.id} className="em-inner">
                          <div className="em-inner-top">
                            <b>{fdate(l.date)}{l.hours != null ? ` · ${l.hours} ${tr('emr.hours', 'ساعة')}` : ''}</b>
                            <span className={`em-badge ${logStatusTone(l.status)}`}>{logStatusLabel(tr, l.status)}</span>
                          </div>
                          <p className="em-line">{l.summary}</p>
                          {l.employerNote && <div className="em-note"><b>{tr('job.employerNote', 'ملاحظة الشركة:')}</b> {l.employerNote}</div>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
