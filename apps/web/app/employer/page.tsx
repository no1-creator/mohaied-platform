'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Office = { id: string; name: string; city: string };
type Job = {
  id: string; code: string; title: string; description: string; skills?: string | null;
  seniority?: string | null; employmentType: string; workMode: string;
  monthlySalary: string | number; currency?: string | null; headcount: number;
  location?: string | null; status: string; office?: { name: string; city: string } | null;
};
type Applicant = {
  id: string; employeeId: string; coverLetter?: string | null;
  expectedSalary?: string | number | null; cvUrl?: string | null; status: string;
  employerNote?: string | null; employee?: { fullName: string; email: string } | null;
};
type Contract = {
  id: string; code: string; title: string; monthlySalary: string | number; currency?: string | null;
  workMode: string; status: string; employee?: { fullName: string; email: string } | null;
  office?: { name: string; city: string } | null;
};
type Log = {
  id: string; date: string; hours?: number | null; summary: string; status: string;
  employerNote?: string | null; employee?: { fullName: string } | null;
};

const WORK_MODE: Record<string, string> = { ONSITE: 'من مكتب محايد', REMOTE: 'عن بُعد', HYBRID: 'مختلط' };
const JOB_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'مفتوحة', tone: 'ok' },
  PAUSED: { label: 'موقوفة', tone: 'amber' },
  CLOSED: { label: 'مغلقة', tone: 'muted' },
  FILLED: { label: 'مكتملة', tone: 'blue' },
};
const APP_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'تم التقديم', tone: 'amber' },
  SHORTLISTED: { label: 'قائمة مختصرة', tone: 'blue' },
  INTERVIEW: { label: 'مقابلة', tone: 'blue' },
  OFFERED: { label: 'عرض عمل', tone: 'ok' },
  HIRED: { label: 'تم التعيين', tone: 'ok' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
  WITHDRAWN: { label: 'مسحوب', tone: 'muted' },
};
const EMPLOYMENT_STATUS: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: 'نشط', tone: 'ok' },
  PAUSED: { label: 'موقوف', tone: 'amber' },
  ENDED: { label: 'منتهي', tone: 'muted' },
};
const LOG_STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'بانتظار المراجعة', tone: 'amber' },
  APPROVED: { label: 'معتمد', tone: 'ok' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
};
const TYPES = [
  { value: 'FULL_TIME', label: 'دوام كامل' },
  { value: 'PART_TIME', label: 'دوام جزئي' },
  { value: 'CONTRACT', label: 'عقد مؤقت' },
];
const MODES = [
  { value: 'REMOTE', label: 'عن بُعد' },
  { value: 'ONSITE', label: 'من مكتب محايد' },
  { value: 'HYBRID', label: 'مختلط' },
];
const money = (v: any, c?: string | null) => `${Number(v || 0).toLocaleString('en')} ${c || 'USD'}`;
const fdate = (s: string) => { try { return new Date(s).toLocaleDateString('en-GB'); } catch { return ''; } };

const EM_CSS = `
.em-wrap{max-width:1000px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.em-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:16px;}
.em-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.em-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;max-width:560px;}
.em-new{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;white-space:nowrap;}
.em-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);padding:5px;border-radius:12px;width:fit-content;margin-bottom:16px;flex-wrap:wrap;}
.em-tabs button{border:none;background:transparent;padding:9px 18px;border-radius:9px;font-family:inherit;font-weight:700;font-size:14px;color:var(--muted);cursor:pointer;}
.em-tabs button.active{background:var(--green);color:#fff;}
.em-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.em-empty.small{padding:16px;border:none;background:transparent;}
.em-list{display:flex;flex-direction:column;gap:14px;}
.em-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.em-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;}
.em-card-title{font-size:16px;font-weight:800;color:var(--ink);margin:0 0 4px;}
.em-card-meta{font-size:12.5px;color:var(--muted);margin:0;}
.em-mono{direction:ltr;}
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
.em-area{min-height:90px;resize:vertical;line-height:1.7;}
.em-field{margin-bottom:12px;}
.em-field label{display:block;font-size:13.5px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.em-row{display:flex;gap:10px;}
.em-row .em-field{flex:1;}
.em-form{background:#fff;border:1px solid var(--line);border-radius:18px;padding:20px;margin-bottom:20px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.em-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:14px;}
.em-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;}
.em-mini{border:1px solid var(--line);background:#fff;color:var(--green-dark);padding:7px 14px;border-radius:9px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;}
.em-mini:hover{background:var(--mint);}
.em-mini.ok{color:#1c7a4f;border-color:#bfe3cf;}
.em-mini.danger{color:#b4322b;border-color:#f2cecb;}
.em-sub-panel{margin-top:12px;border-top:1px dashed var(--line);padding-top:12px;display:flex;flex-direction:column;gap:10px;}
.em-inner{background:var(--background);border:1px solid var(--line);border-radius:12px;padding:12px 14px;}
.em-inner-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.em-line{font-size:13px;color:var(--text);margin:6px 0 0;}
.em-note{margin-top:8px;background:var(--mint);border-radius:8px;padding:8px 12px;font-size:12.5px;color:var(--ink);line-height:1.7;}
@media(max-width:560px){.em-row{flex-direction:column;gap:0;}.em-head-row{flex-direction:column;}}
`;

export default function EmployerPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [tab, setTab] = useState<'jobs' | 'contracts'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [seniority, setSeniority] = useState('');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [workMode, setWorkMode] = useState('REMOTE');
  const [monthlySalary, setMonthlySalary] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [headcount, setHeadcount] = useState('1');
  const [location, setLocation] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [openJob, setOpenJob] = useState('');
  const [applicants, setApplicants] = useState<Record<string, Applicant[]>>({});
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  const [openContract, setOpenContract] = useState('');
  const [logs, setLogs] = useState<Record<string, Log[]>>({});

  async function loadJobs() {
    const d = await api<Job[]>('/employment/jobs/mine');
    setJobs(Array.isArray(d) ? d : []);
  }
  async function loadOffices() {
    try { const d = await api<Office[]>('/employment/offices'); setOffices(Array.isArray(d) ? d : []); }
    catch { setOffices([]); }
  }
  async function loadContracts() {
    const d = await api<Contract[]>('/employment/contracts/mine');
    setContracts(Array.isArray(d) ? d : []);
  }

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    api<{ role: string }>('/users/me')
      .then(async (me) => {
        if (me.role !== 'EMPLOYER') { setState('denied'); return; }
        await Promise.all([loadJobs(), loadOffices()]);
        setState('ok');
      })
      .catch(() => setState('denied'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (state !== 'ok') return;
    if (tab === 'jobs') loadJobs();
    else loadContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, state]);

  async function submit() {
    setError('');
    if (title.trim().length < 3) return setError('اكتب عنوان وظيفة واضح.');
    if (description.trim().length < 20) return setError('اكتب وصف كافٍ (20 حرف على الأقل).');
    if (!monthlySalary || Number(monthlySalary) <= 0) return setError('حدد الراتب الشهري.');
    setSaving(true);
    try {
      await api('/employment/jobs', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim(),
          skills: skills.trim() || undefined,
          seniority: seniority.trim() || undefined,
          employmentType,
          workMode,
          monthlySalary: Number(monthlySalary),
          currency: currency.trim() || 'USD',
          headcount: headcount ? Number(headcount) : 1,
          location: location.trim() || undefined,
          officeId: officeId || undefined,
        },
      });
      setTitle(''); setDescription(''); setSkills(''); setSeniority(''); setEmploymentType('FULL_TIME');
      setWorkMode('REMOTE'); setMonthlySalary(''); setCurrency('USD'); setHeadcount('1'); setLocation(''); setOfficeId('');
      setShowForm(false); await loadJobs();
    } catch (e: any) { setError(e?.message || 'حصل خطأ'); }
    setSaving(false);
  }

  async function setJobStatus(id: string, status: string) {
    try { await api(`/employment/jobs/${id}`, { method: 'PATCH', body: { status } }); await loadJobs(); }
    catch (e: any) { alert(e?.message || 'حصل خطأ'); }
  }

  async function toggleApplicants(id: string) {
    if (openJob === id) { setOpenJob(''); return; }
    setOpenJob(id);
    if (!applicants[id]) {
      try { const d = await api<Applicant[]>(`/employment/jobs/${id}/applications`); setApplicants((m) => ({ ...m, [id]: Array.isArray(d) ? d : [] })); }
      catch { setApplicants((m) => ({ ...m, [id]: [] })); }
    }
  }
  async function respond(jobId: string, appId: string, status: string) {
    try {
      await api(`/employment/applications/${appId}`, { method: 'PATCH', body: { status, employerNote: noteDraft[appId]?.trim() || undefined } });
      const d = await api<Applicant[]>(`/employment/jobs/${jobId}/applications`);
      setApplicants((m) => ({ ...m, [jobId]: Array.isArray(d) ? d : [] }));
      if (status === 'HIRED') await loadJobs();
    } catch (e: any) { alert(e?.message || 'حصل خطأ'); }
  }

  async function toggleLogs(id: string) {
    if (openContract === id) { setOpenContract(''); return; }
    setOpenContract(id);
    if (!logs[id]) {
      try { const d = await api<Log[]>(`/employment/contracts/${id}/logs`); setLogs((m) => ({ ...m, [id]: Array.isArray(d) ? d : [] })); }
      catch { setLogs((m) => ({ ...m, [id]: [] })); }
    }
  }
  async function reviewLog(contractId: string, logId: string, status: string) {
    try {
      await api(`/employment/logs/${logId}`, { method: 'PATCH', body: { status } });
      const d = await api<Log[]>(`/employment/contracts/${contractId}/logs`);
      setLogs((m) => ({ ...m, [contractId]: Array.isArray(d) ? d : [] }));
    } catch (e: any) { alert(e?.message || 'حصل خطأ'); }
  }
  async function setContractStatus(id: string, status: string) {
    try { await api(`/employment/contracts/${id}`, { method: 'PATCH', body: { status } }); await loadContracts(); }
    catch (e: any) { alert(e?.message || 'حصل خطأ'); }
  }

  if (state === 'loading')
    return (<><style>{EM_CSS}</style><TopBar /><div className="em-wrap"><div className="em-empty">جاري التحميل...</div></div></>);
  if (state === 'denied')
    return (<><style>{EM_CSS}</style><TopBar /><BackBar /><div className="em-wrap"><div className="em-empty">الصفحة دي متاحة لحسابات الشركات (Employer) بس.</div></div></>);

  return (
    <>
      <style>{EM_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="em-wrap">
        <div className="em-head-row">
          <div>
            <h1 className="em-title">وظائفي وفريقي</h1>
            <p className="em-sub">اطرح وظائفك، فلتر المتقدمين ووظّف، وتابع شغل فريقك المصري لايف عبر محايد.</p>
          </div>
          {tab === 'jobs' && <button className="em-new" onClick={() => setShowForm((s) => !s)}>{showForm ? 'إغلاق' : '+ وظيفة جديدة'}</button>}
        </div>

        <div className="em-tabs">
          <button className={tab === 'jobs' ? 'active' : ''} onClick={() => setTab('jobs')}>الوظائف والمتقدمين</button>
          <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>فريقي وسجل الشغل</button>
        </div>

        {tab === 'jobs' && showForm && (
          <div className="em-form">
            {error && <div className="em-err">{error}</div>}
            <div className="em-field"><label>المسمى الوظيفي</label><input className="em-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: مطوّر واجهات أمامية" /></div>
            <div className="em-row">
              <div className="em-field"><label>نوع التعاقد</label><select className="em-select" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>{TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div className="em-field"><label>نمط العمل</label><select className="em-select" value={workMode} onChange={(e) => setWorkMode(e.target.value)}>{MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
            </div>
            <div className="em-row">
              <div className="em-field"><label>الراتب الشهري</label><input className="em-input" type="number" value={monthlySalary} onChange={(e) => setMonthlySalary(e.target.value)} placeholder="مثال: 1200" /></div>
              <div className="em-field"><label>العملة</label><input className="em-input" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" /></div>
              <div className="em-field"><label>عدد الشواغر</label><input className="em-input" type="number" value={headcount} onChange={(e) => setHeadcount(e.target.value)} placeholder="1" /></div>
            </div>
            <div className="em-field"><label>الوصف الوظيفي</label><textarea className="em-area" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="المهام، المتطلبات، وتفاصيل الدور." /></div>
            <div className="em-field"><label>المهارات المطلوبة (اختياري)</label><input className="em-input" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="مثال: React, Node.js" /></div>
            <div className="em-row">
              <div className="em-field"><label>المستوى (اختياري)</label><input className="em-input" value={seniority} onChange={(e) => setSeniority(e.target.value)} placeholder="مثال: Senior" /></div>
              <div className="em-field"><label>مكتب محايد (اختياري)</label><select className="em-select" value={officeId} onChange={(e) => setOfficeId(e.target.value)}><option value="">— بدون مكتب —</option>{offices.map((o) => <option key={o.id} value={o.id}>{o.name} - {o.city}</option>)}</select></div>
            </div>
            <div className="em-field"><label>الموقع (اختياري)</label><input className="em-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: يفضّل داخل مصر" /></div>
            <button className="em-btn full" onClick={submit} disabled={saving}>{saving ? 'جاري النشر...' : 'انشر الوظيفة'}</button>
          </div>
        )}

        {tab === 'jobs' ? (
          jobs.length === 0 ? (
            <div className="em-empty">لسه ماطرحتش أي وظيفة.</div>
          ) : (
            <div className="em-list">
              {jobs.map((j) => (
                <div key={j.id} className="em-card">
                  <div className="em-card-top">
                    <div>
                      <h3 className="em-card-title">{j.title}</h3>
                      <span className="em-card-meta">{WORK_MODE[j.workMode] || j.workMode} · {money(j.monthlySalary, j.currency)} · <span className="em-mono">{j.code}</span></span>
                    </div>
                    <span className={`em-badge ${JOB_STATUS[j.status]?.tone || 'muted'}`}>{JOB_STATUS[j.status]?.label || j.status}</span>
                  </div>
                  <div className="em-actions">
                    <button className="em-mini" onClick={() => toggleApplicants(j.id)}>{openJob === j.id ? 'إخفاء المتقدمين' : 'عرض المتقدمين'}</button>
                    {j.status === 'OPEN' ? (
                      <button className="em-mini" onClick={() => setJobStatus(j.id, 'PAUSED')}>إيقاف مؤقت</button>
                    ) : j.status === 'PAUSED' ? (
                      <button className="em-mini" onClick={() => setJobStatus(j.id, 'OPEN')}>إعادة فتح</button>
                    ) : null}
                    {j.status !== 'CLOSED' && <button className="em-mini danger" onClick={() => setJobStatus(j.id, 'CLOSED')}>إغلاق</button>}
                  </div>

                  {openJob === j.id && (
                    <div className="em-sub-panel">
                      {!applicants[j.id] ? (
                        <div className="em-empty small">جاري التحميل...</div>
                      ) : applicants[j.id].length === 0 ? (
                        <div className="em-empty small">مفيش متقدمين لسه.</div>
                      ) : (
                        applicants[j.id].map((a) => (
                          <div key={a.id} className="em-inner">
                            <div className="em-inner-top">
                              <b>{a.employee?.fullName || 'متقدم'}</b>
                              <span className={`em-badge ${APP_STATUS[a.status]?.tone || 'muted'}`}>{APP_STATUS[a.status]?.label || a.status}</span>
                            </div>
                            {a.employee?.email && <p className="em-line em-mono">{a.employee.email}</p>}
                            {a.expectedSalary != null && <p className="em-line">الراتب المتوقع: <b>{money(a.expectedSalary, j.currency)}</b></p>}
                            {a.coverLetter && <p className="em-line">{a.coverLetter}</p>}
                            {a.cvUrl && <p className="em-line em-mono"><a href={a.cvUrl} target="_blank" rel="noreferrer">السيرة الذاتية</a></p>}
                            {!['HIRED', 'REJECTED', 'WITHDRAWN'].includes(a.status) && (
                              <>
                                <input className="em-input" style={{ marginTop: 8 }} value={noteDraft[a.id] || ''} onChange={(e) => setNoteDraft((m) => ({ ...m, [a.id]: e.target.value }))} placeholder="ملاحظة للمتقدم (اختياري)" />
                                <div className="em-actions">
                                  <button className="em-mini" onClick={() => respond(j.id, a.id, 'SHORTLISTED')}>قائمة مختصرة</button>
                                  <button className="em-mini" onClick={() => respond(j.id, a.id, 'INTERVIEW')}>مقابلة</button>
                                  <button className="em-mini ok" onClick={() => respond(j.id, a.id, 'HIRED')}>تعيين</button>
                                  <button className="em-mini danger" onClick={() => respond(j.id, a.id, 'REJECTED')}>رفض</button>
                                </div>
                              </>
                            )}
                            {a.employerNote && <div className="em-note"><b>ملاحظتك:</b> {a.employerNote}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : contracts.length === 0 ? (
          <div className="em-empty">مفيش عقود فريق لسه. وظّف متقدّم عشان يتفتح عقد.</div>
        ) : (
          <div className="em-list">
            {contracts.map((c) => (
              <div key={c.id} className="em-card">
                <div className="em-card-top">
                  <div>
                    <h3 className="em-card-title">{c.employee?.fullName || 'موظف'} — {c.title}</h3>
                    <span className="em-card-meta">{money(c.monthlySalary, c.currency)} · {WORK_MODE[c.workMode] || c.workMode} · <span className="em-mono">{c.code}</span></span>
                  </div>
                  <span className={`em-badge ${EMPLOYMENT_STATUS[c.status]?.tone || 'muted'}`}>{EMPLOYMENT_STATUS[c.status]?.label || c.status}</span>
                </div>
                <div className="em-actions">
                  <button className="em-mini" onClick={() => toggleLogs(c.id)}>{openContract === c.id ? 'إخفاء سجل الشغل' : 'متابعة سجل الشغل'}</button>
                  {c.status === 'ACTIVE' ? (
                    <button className="em-mini" onClick={() => setContractStatus(c.id, 'PAUSED')}>إيقاف مؤقت</button>
                  ) : c.status === 'PAUSED' ? (
                    <button className="em-mini" onClick={() => setContractStatus(c.id, 'ACTIVE')}>تنشيط</button>
                  ) : null}
                  {c.status !== 'ENDED' && <button className="em-mini danger" onClick={() => setContractStatus(c.id, 'ENDED')}>إنهاء العقد</button>}
                </div>

                {openContract === c.id && (
                  <div className="em-sub-panel">
                    {!logs[c.id] ? (
                      <div className="em-empty small">جاري التحميل...</div>
                    ) : logs[c.id].length === 0 ? (
                      <div className="em-empty small">الموظف لسه ماسجّلش شغل.</div>
                    ) : (
                      logs[c.id].map((l) => (
                        <div key={l.id} className="em-inner">
                          <div className="em-inner-top">
                            <b>{fdate(l.date)}{l.hours != null ? ` · ${l.hours} ساعة` : ''}</b>
                            <span className={`em-badge ${LOG_STATUS[l.status]?.tone || 'muted'}`}>{LOG_STATUS[l.status]?.label || l.status}</span>
                          </div>
                          <p className="em-line">{l.summary}</p>
                          {l.status === 'SUBMITTED' && (
                            <div className="em-actions">
                              <button className="em-mini ok" onClick={() => reviewLog(c.id, l.id, 'APPROVED')}>اعتماد</button>
                              <button className="em-mini danger" onClick={() => reviewLog(c.id, l.id, 'REJECTED')}>رفض</button>
                            </div>
                          )}
                          {l.employer
