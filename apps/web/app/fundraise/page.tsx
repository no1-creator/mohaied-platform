'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Opp = {
  id: string; code: string; title: string; sector: string;
  amountSought: string | number; currency?: string | null; status: string;
};
type Interest = {
  id: string; amountOffered?: string | number | null; message?: string | null;
  status: string; investor?: { fullName: string } | null;
};

const STAGES = [
  { value: 'IDEA', label: 'فكرة' },
  { value: 'PROTOTYPE', label: 'نموذج أولي' },
  { value: 'MVP', label: 'منتج أولي' },
  { value: 'REVENUE', label: 'بيحقق إيرادات' },
  { value: 'SCALING', label: 'مرحلة التوسّع' },
];
const OPP_STATUS: Record<string, { label: string; tone: string }> = {
  OPEN: { label: 'مطروح للتمويل', tone: 'ok' },
  IN_TALKS: { label: 'في تفاوض', tone: 'amber' },
  FUNDED: { label: 'تم تمويله', tone: 'blue' },
  CLOSED: { label: 'مغلق', tone: 'muted' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
};
const INT_STATUS: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'قيد المراجعة', tone: 'amber' },
  ACCEPTED: { label: 'مقبول', tone: 'ok' },
  DECLINED: { label: 'مرفوض', tone: 'red' },
  WITHDRAWN: { label: 'مسحوب', tone: 'muted' },
};
const money = (v: any, c?: string | null) =>
  `${Number(v || 0).toLocaleString('en')} ${c || 'ج.م'}`;

const FR_CSS = `
.fr-wrap{max-width:820px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.fr-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px;}
.fr-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.fr-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;max-width:520px;}
.fr-new{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;white-space:nowrap;}
.fr-new:hover{background:var(--green-dark);}
.fr-form{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;margin-bottom:22px;box-shadow:0 12px 30px rgba(24,70,61,.05);}
.fr-field{margin-bottom:16px;}
.fr-field label{display:block;font-size:14px;font-weight:700;color:var(--ink);margin-bottom:7px;}
.fr-input,.fr-select,.fr-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-family:inherit;font-size:14px;color:var(--ink);background:#fff;box-sizing:border-box;}
.fr-area{min-height:120px;resize:vertical;line-height:1.8;}
.fr-row{display:flex;gap:12px;}
.fr-row .fr-field{flex:1;}
.fr-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:10px 14px;border-radius:12px;font-size:13.5px;margin-bottom:16px;}
.fr-btn{width:100%;padding:13px;border-radius:13px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:15px;cursor:pointer;font-family:inherit;margin-top:4px;}
.fr-btn:hover{background:var(--green-dark);}
.fr-btn:disabled{opacity:.6;cursor:default;}
.fr-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.fr-empty.small{padding:16px;border:none;background:transparent;}
.fr-list{display:flex;flex-direction:column;gap:14px;}
.fr-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.fr-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.fr-card-title{font-size:16px;font-weight:800;color:var(--ink);margin:0 0 4px;}
.fr-card-meta{font-size:12.5px;color:var(--muted);}
.fr-mono{direction:ltr;}
.fr-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;}
.fr-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.fr-badge.muted{background:#eef1f0;color:var(--muted);}
.fr-badge.red{background:#fdeceb;color:#b4322b;}
.fr-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.fr-badge.amber{background:#fdf3dd;color:#96690f;}
.fr-card-actions{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.fr-mini{border:1px solid var(--line);background:#fff;color:var(--green-dark);padding:7px 14px;border-radius:9px;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer;}
.fr-mini:hover{background:var(--mint);}
.fr-mini.ok{color:#1c7a4f;border-color:#bfe3cf;}
.fr-mini.danger{color:#b4322b;border-color:#f2cecb;}
.fr-interests{margin-top:14px;border-top:1px dashed var(--line);padding-top:14px;display:flex;flex-direction:column;gap:10px;}
.fr-int{background:var(--background);border:1px solid var(--line);border-radius:12px;padding:12px 14px;}
.fr-int-top{display:flex;align-items:center;justify-content:space-between;}
.fr-int-line{font-size:13px;color:var(--text);margin:6px 0 0;}
.fr-int-actions{display:flex;gap:8px;margin-top:10px;}
@media(max-width:560px){.fr-row{flex-direction:column;gap:0;}.fr-head{flex-direction:column;}}
`;

export default function FundraisePage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [opps, setOpps] = useState<Opp[]>([]);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('IDEA');
  const [amountSought, setAmountSought] = useState('');
  const [equityOffered, setEquityOffered] = useState('');
  const [useOfFunds, setUseOfFunds] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [openId, setOpenId] = useState('');
  const [interests, setInterests] = useState<Record<string, Interest[]>>({});

  async function loadMine() {
    const d = await api<Opp[]>('/invest/opportunities/mine');
    setOpps(Array.isArray(d) ? d : []);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<{ role: string }>('/users/me')
      .then(async (me) => {
        if (me.role !== 'CLIENT' && me.role !== 'PROVIDER') {
          setState('denied');
          return;
        }
        await loadMine();
        setState('ok');
      })
      .catch(() => setState('denied'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function submit() {
    setError('');
    if (title.trim().length < 3) return setError('اكتب عنوان واضح للفرصة.');
    if (summary.trim().length < 5) return setError('اكتب نبذة مختصرة.');
    if (description.trim().length < 20) return setError('اكتب وصف كافٍ (20 حرف على الأقل).');
    if (!sector.trim()) return setError('حدد القطاع أو المجال.');
    if (!amountSought || Number(amountSought) <= 0) return setError('حدد قيمة التمويل المطلوب.');
    setSaving(true);
    try {
      await api('/invest/opportunities', {
        method: 'POST',
        body: {
          title: title.trim(),
          summary: summary.trim(),
          description: description.trim(),
          sector: sector.trim(),
          stage,
          amountSought: Number(amountSought),
          equityOffered: equityOffered ? Number(equityOffered) : undefined,
          useOfFunds: useOfFunds.trim() || undefined,
          location: location.trim() || undefined,
          website: website.trim() || undefined,
        },
      });
      setTitle(''); setSummary(''); setDescription(''); setSector(''); setStage('IDEA');
      setAmountSought(''); setEquityOffered(''); setUseOfFunds(''); setLocation(''); setWebsite('');
      setShowForm(false);
      await loadMine();
    } catch (e: any) {
      setError(e?.message || 'حصل خطأ، حاول تاني');
    }
    setSaving(false);
  }

  async function toggleInterests(id: string) {
    if (openId === id) {
      setOpenId('');
      return;
    }
    setOpenId(id);
    if (!interests[id]) {
      try {
        const d = await api<Interest[]>(`/invest/opportunities/${id}/interests`);
        setInterests((m) => ({ ...m, [id]: Array.isArray(d) ? d : [] }));
      } catch {
        setInterests((m) => ({ ...m, [id]: [] }));
      }
    }
  }

  async function respond(oppId: string, interestId: string, status: string) {
    try {
      await api(`/invest/interests/${interestId}`, { method: 'PATCH', body: { status } });
      const d = await api<Interest[]>(`/invest/opportunities/${oppId}/interests`);
      setInterests((m) => ({ ...m, [oppId]: Array.isArray(d) ? d : [] }));
      await loadMine();
    } catch (e: any) {
      alert(e?.message || 'حصل خطأ');
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/invest/opportunities/${id}`, { method: 'PATCH', body: { status } });
      await loadMine();
    } catch (e: any) {
      alert(e?.message || 'حصل خطأ');
    }
  }

  if (state === 'loading') {
    return (
      <>
        <style>{FR_CSS}</style>
        <TopBar />
        <div className="fr-wrap"><div className="fr-empty">جاري التحميل...</div></div>
      </>
    );
  }
  if (state === 'denied') {
    return (
      <>
        <style>{FR_CSS}</style>
        <TopBar />
        <BackBar />
        <div className="fr-wrap">
          <div className="fr-empty">الصفحة دي متاحة للعملاء ومقدمي الخدمة بس.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{FR_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="fr-wrap">
        <div className="fr-head">
          <div>
            <h1 className="fr-title">تمويل مشروعك</h1>
            <p className="fr-sub">
              اطرح مشروعك أو فكرتك على مستثمري محايد، وتابع اهتماماتهم وردودك عليها.
            </p>
          </div>
          <button className="fr-new" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'إغلاق' : '+ اطرح فرصة جديدة'}
          </button>
        </div>

        {showForm && (
          <div className="fr-form">
            {error && <div className="fr-err">{error}</div>}
            <div className="fr-field">
              <label>عنوان الفرصة</label>
              <input className="fr-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: منصة توصيل ذكية" />
            </div>
            <div className="fr-field">
              <label>نبذة مختصرة</label>
              <input className="fr-input" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="جملة أو اتنين تلخّص الفكرة" />
            </div>
            <div className="fr-row">
              <div className="fr-field">
                <label>القطاع / المجال</label>
                <input className="fr-input" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="مثال: تكنولوجيا، تجارة..." />
              </div>
              <div className="fr-field">
                <label>المرحلة</label>
                <select className="fr-select" value={stage} onChange={(e) => setStage(e.target.value)}>
                  {STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fr-row">
              <div className="fr-field">
                <label>التمويل المطلوب (ج.م)</label>
                <input className="fr-input" type="number" value={amountSought} onChange={(e) => setAmountSought(e.target.value)} placeholder="مثال: 500000" />
              </div>
              <div className="fr-field">
                <label>الحصة المعروضة % (اختياري)</label>
                <input className="fr-input" type="number" value={equityOffered} onChange={(e) => setEquityOffered(e.target.value)} placeholder="مثال: 15" />
              </div>
            </div>
            <div className="fr-field">
              <label>وصف تفصيلي</label>
              <textarea className="fr-area" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="اشرح المشروع، السوق، الفريق، والفرصة." />
            </div>
            <div className="fr-field">
              <label>أوجه استخدام التمويل (اختياري)</label>
              <input className="fr-input" value={useOfFunds} onChange={(e) => setUseOfFunds(e.target.value)} placeholder="مثال: تطوير المنتج والتسويق" />
            </div>
            <div className="fr-row">
              <div className="fr-field">
                <label>الموقع (اختياري)</label>
                <input className="fr-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="مثال: القاهرة" />
              </div>
              <div className="fr-field">
                <label>رابط (اختياري)</label>
                <input className="fr-input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
              </div>
            </div>
            <button className="fr-btn" onClick={submit} disabled={saving}>
              {saving ? 'جاري النشر...' : 'انشر الفرصة'}
            </button>
          </div>
        )}

        {opps.length === 0 ? (
          <div className="fr-empty">لسه ماطرحتش أي فرصة. ابدأ من زرار "اطرح فرصة جديدة".</div>
        ) : (
          <div className="fr-list">
            {opps.map((o) => (
              <div key={o.id} className="fr-card">
                <div className="fr-card-top">
                  <div>
                    <h3 className="fr-card-title">{o.title}</h3>
                    <span className="fr-card-meta">
                      {o.sector} · {money(o.amountSought, o.currency)} · <span className="fr-mono">{o.code}</span>
                    </span>
                  </div>
                  <span className={`fr-badge ${OPP_STATUS[o.status]?.tone || 'muted'}`}>
                    {OPP_STATUS[o.status]?.label || o.status}
                  </span>
                </div>
                <div className="fr-card-actions">
                  <button className="fr-mini" onClick={() => toggleInterests(o.id)}>
                    {openId === o.id ? 'إخفاء الاهتمامات' : 'عرض الاهتمامات'}
                  </button>
                  {o.status !== 'CLOSED' ? (
                    <button className="fr-mini" onClick={() => setStatus(o.id, 'CLOSED')}>إغلاق الفرصة</button>
                  ) : (
                    <button className="fr-mini" onClick={() => setStatus(o.id, 'OPEN')}>إعادة فتح</button>
                  )}
                </div>

                {openId === o.id && (
                  <div className="fr-interests">
                    {!interests[o.id] ? (
                      <div className="fr-empty small">جاري التحميل...</div>
                    ) : interests[o.id].length === 0 ? (
                      <div className="fr-empty small">مفيش اهتمامات لسه على الفرصة دي.</div>
                    ) : (
                      interests[o.id].map((it) => (
                        <div key={it.id} className="fr-int">
                          <div className="fr-int-top">
                            <b>{it.investor?.fullName || 'مستثمر'}</b>
                            <span className={`fr-badge ${INT_STATUS[it.status]?.tone || 'muted'}`}>
                              {INT_STATUS[it.status]?.label || it.status}
                            </span>
                          </div>
                          {it.amountOffered != null && (
                            <p className="fr-int-line">العرض: <b>{money(it.amountOffered, o.currency)}</b></p>
                          )}
                          {it.message && <p className="fr-int-line">{it.message}</p>}
                          {it.status === 'PENDING' && (
                            <div className="fr-int-actions">
                              <button className="fr-mini ok" onClick={() => respond(o.id, it.id, 'ACCEPTED')}>قبول</button>
                              <button className="fr-mini danger" onClick={() => respond(o.id, it.id, 'DECLINED')}>رفض</button>
                            </div>
                          )}
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
