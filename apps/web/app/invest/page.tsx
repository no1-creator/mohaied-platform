'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import { useI18n } from '@/lib/i18n';

type Opp = {
  id: string; code: string; title: string; summary: string; description: string;
  sector: string; stage: string; amountSought: string | number; currency?: string | null;
  equityOffered?: number | null; location?: string | null; status: string;
  founder?: { fullName: string } | null;
};
type Interest = {
  id: string; opportunityId: string; amountOffered?: string | number | null;
  message?: string | null; status: string; founderNote?: string | null;
  createdAt: string; opportunity?: Opp | null;
};

const STAGE_KEY: Record<string, string> = {
  IDEA: 'ivp.stage.IDEA', PROTOTYPE: 'ivp.stage.PROTOTYPE', MVP: 'ivp.stage.MVP', REVENUE: 'ivp.stage.REVENUE', SCALING: 'ivp.stage.SCALING',
};
const OPP_STATUS: Record<string, { labelKey: string; tone: string }> = {
  OPEN: { labelKey: 'ivp.oppStatus.OPEN', tone: 'ok' },
  IN_TALKS: { labelKey: 'ivp.oppStatus.IN_TALKS', tone: 'amber' },
  FUNDED: { labelKey: 'ivp.oppStatus.FUNDED', tone: 'blue' },
  CLOSED: { labelKey: 'ivp.oppStatus.CLOSED', tone: 'muted' },
  REJECTED: { labelKey: 'ivp.oppStatus.REJECTED', tone: 'red' },
};
const INT_STATUS: Record<string, { labelKey: string; tone: string }> = {
  PENDING: { labelKey: 'ivp.intStatus.PENDING', tone: 'amber' },
  ACCEPTED: { labelKey: 'ivp.intStatus.ACCEPTED', tone: 'ok' },
  DECLINED: { labelKey: 'ivp.intStatus.DECLINED', tone: 'red' },
  WITHDRAWN: { labelKey: 'ivp.intStatus.WITHDRAWN', tone: 'muted' },
};
const money = (v: any, c?: string | null, cur?: string) =>
  `${Number(v || 0).toLocaleString('en')} ${c || cur || 'ج.م'}`;

const IV_CSS = `
.iv-wrap{max-width:1000px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.iv-head{margin-bottom:18px;}
.iv-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.iv-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.iv-tabs{display:flex;gap:6px;background:#fff;border:1px solid var(--line);padding:5px;border-radius:12px;width:fit-content;margin-bottom:16px;}
.iv-tabs button{border:none;background:transparent;padding:9px 18px;border-radius:9px;font-family:inherit;font-weight:700;font-size:14px;color:var(--muted);cursor:pointer;}
.iv-tabs button.active{background:var(--green);color:#fff;}
.iv-search{display:flex;gap:8px;margin-bottom:18px;}
.iv-search input{flex:1;max-width:360px;border:1px solid var(--line);border-radius:10px;padding:10px 14px;font-family:inherit;font-size:14px;background:#fff;}
.iv-search button{border:none;background:var(--green);color:#fff;padding:10px 20px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
.iv-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.iv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;}
.iv-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.iv-card-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.iv-stage{font-size:12px;font-weight:700;color:var(--green-dark);background:var(--mint);padding:3px 10px;border-radius:99px;}
.iv-card-title{font-size:17px;font-weight:800;color:var(--ink);margin:0;}
.iv-card-sector{font-size:12.5px;color:var(--muted);margin:0;}
.iv-card-summary{font-size:13.5px;color:var(--text);line-height:1.8;margin:0;}
.iv-meta{list-style:none;margin:4px 0 0;padding:0;display:flex;flex-direction:column;gap:7px;}
.iv-meta li{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);border-bottom:1px dashed var(--line);padding-bottom:6px;}
.iv-meta li b{color:var(--ink);}
.iv-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;}
.iv-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.iv-badge.muted{background:#eef1f0;color:var(--muted);}
.iv-badge.red{background:#fdeceb;color:#b4322b;}
.iv-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.iv-badge.amber{background:#fdf3dd;color:#96690f;}
.iv-btn{border:none;background:var(--green);color:#fff;padding:11px 18px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;font-size:14px;}
.iv-btn:hover{background:var(--green-dark);}
.iv-btn.full{width:100%;margin-top:4px;}
.iv-btn:disabled{opacity:.6;cursor:default;}
.iv-apply{display:flex;flex-direction:column;gap:8px;margin-top:4px;}
.iv-input,.iv-area{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;box-sizing:border-box;}
.iv-area{min-height:70px;resize:vertical;line-height:1.7;}
.iv-apply-actions{display:flex;gap:8px;}
.iv-cancel{border:1px solid var(--line);background:#fff;color:var(--muted);padding:11px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;}
.iv-done{text-align:center;background:#e3f4ec;color:#1c7a4f;padding:11px;border-radius:10px;font-weight:700;}
.iv-list{display:flex;flex-direction:column;gap:12px;}
.iv-int{background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.iv-int-line{font-size:13.5px;color:var(--text);margin:6px 0 0;}
.iv-note{margin-top:10px;background:var(--mint);border-radius:10px;padding:10px 14px;font-size:13px;color:var(--ink);line-height:1.7;}
.iv-note b{color:var(--green-dark);}
@media(max-width:520px){.iv-grid{grid-template-columns:1fr;}.iv-title{font-size:21px;}}
`;

export default function InvestPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [tab, setTab] = useState<'browse' | 'mine'>('browse');
  const [opps, setOpps] = useState<Opp[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const cur = tr('common.currency', 'ج.م');

  async function loadBrowse() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    try {
      const d = await api<Opp[]>(`/invest/opportunities?${params.toString()}`);
      setOpps(Array.isArray(d) ? d : []);
    } catch {
      setOpps([]);
    }
    setLoading(false);
  }

  async function loadMine() {
    setLoading(true);
    try {
      const d = await api<Interest[]>('/invest/interests/mine');
      setInterests(Array.isArray(d) ? d : []);
    } catch {
      setInterests([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadBrowse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    if (tab === 'browse') loadBrowse();
    else loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  function openApply(id: string) {
    setActiveId(id);
    setAmount('');
    setMsg('');
  }

  async function apply(id: string) {
    setSending(true);
    try {
      await api(`/invest/opportunities/${id}/interest`, {
        method: 'POST',
        body: {
          amountOffered: amount ? Number(amount) : undefined,
          message: msg.trim() || undefined,
        },
      });
      setDone((d) => ({ ...d, [id]: true }));
      setActiveId('');
    } catch (e: any) {
      alert(e?.message || tr('ivp.errRetry', 'حصل خطأ، حاول تاني'));
    }
    setSending(false);
  }

  return (
    <>
      <style>{IV_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="iv-wrap">
        <div className="iv-head">
          <h1 className="iv-title">{tr('ivp.title', 'فرص الاستثمار على محايد')}</h1>
          <p className="iv-sub">
            {tr('ivp.sub', 'اكتشف مشاريع وأفكار مطروحة للتمويل، وابدأ تواصلك مع أصحابها مباشرة عبر المنصة.')}
          </p>
        </div>

        <div className="iv-tabs">
          <button className={tab === 'browse' ? 'active' : ''} onClick={() => setTab('browse')}>
            {tr('ivp.tabBrowse', 'تصفّح الفرص')}
          </button>
          <button className={tab === 'mine' ? 'active' : ''} onClick={() => setTab('mine')}>
            {tr('ivp.tabMine', 'اهتماماتي')}
          </button>
        </div>

        {tab === 'browse' && (
          <div className="iv-search">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadBrowse()}
              placeholder={tr('ivp.searchPh', 'ابحث بالعنوان أو القطاع...')}
            />
            <button onClick={loadBrowse}>{tr('common.search', 'بحث')}</button>
          </div>
        )}

        {loading ? (
          <div className="iv-empty">{tr('cls.loading', 'جاري التحميل...')}</div>
        ) : tab === 'browse' ? (
          opps.length === 0 ? (
            <div className="iv-empty">{tr('ivp.emptyBrowse', 'مفيش فرص متاحة حاليًا.')}</div>
          ) : (
            <div className="iv-grid">
              {opps.map((o) => (
                <div key={o.id} className="iv-card">
                  <div className="iv-card-top">
                    <span className="iv-stage">{STAGE_KEY[o.stage] ? tr(STAGE_KEY[o.stage]) : o.stage}</span>
                    <span className={`iv-badge ${OPP_STATUS[o.status]?.tone || 'muted'}`}>
                      {OPP_STATUS[o.status] ? tr(OPP_STATUS[o.status].labelKey) : o.status}
                    </span>
                  </div>
                  <h3 className="iv-card-title">{o.title}</h3>
                  <p className="iv-card-sector">
                    {o.sector}
                    {o.location ? ` · ${o.location}` : ''}
                  </p>
                  <p className="iv-card-summary">{o.summary}</p>
                  <ul className="iv-meta">
                    <li>
                      <span>{tr('ivp.amountSought', 'التمويل المطلوب')}</span>
                      <b>{money(o.amountSought, o.currency, cur)}</b>
                    </li>
                    {o.equityOffered != null && (
                      <li>
                        <span>{tr('ivp.equity', 'الحصة المعروضة')}</span>
                        <b>{o.equityOffered}%</b>
                      </li>
                    )}
                    {o.founder && (
                      <li>
                        <span>{tr('ivp.founder', 'صاحب المشروع')}</span>
                        <b>{o.founder.fullName}</b>
                      </li>
                    )}
                  </ul>

                  {done[o.id] ? (
                    <div className="iv-done">{tr('ivp.doneInterest', 'تم إرسال اهتمامك ✓')}</div>
                  ) : activeId === o.id ? (
                    <div className="iv-apply">
                      <input
                        className="iv-input"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={tr('ivp.amountPh', 'المبلغ اللي تنوي تستثمره (اختياري)')}
                      />
                      <textarea
                        className="iv-area"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        placeholder={tr('ivp.msgPh', 'رسالة لصاحب المشروع (اختياري)')}
                      />
                      <div className="iv-apply-actions">
                        <button className="iv-btn" onClick={() => apply(o.id)} disabled={sending}>
                          {sending ? tr('ivp.sending', 'جاري الإرسال...') : tr('ivp.sendInterest', 'إرسال الاهتمام')}
                        </button>
                        <button className="iv-cancel" onClick={() => setActiveId('')}>
                          {tr('common.cancel', 'إلغاء')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className="iv-btn full" onClick={() => openApply(o.id)}>
                      {tr('ivp.showInterest', 'أبدي اهتمامي بالاستثمار')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : interests.length === 0 ? (
          <div className="iv-empty">{tr('ivp.emptyMine', 'لسه ماأبديتش اهتمام بأي فرصة.')}</div>
        ) : (
          <div className="iv-list">
            {interests.map((it) => (
              <div key={it.id} className="iv-int">
                <div className="iv-card-top">
                  <h3 className="iv-card-title">{it.opportunity?.title || tr('ivp.oppFallback', 'فرصة')}</h3>
                  <span className={`iv-badge ${INT_STATUS[it.status]?.tone || 'muted'}`}>
                    {INT_STATUS[it.status] ? tr(INT_STATUS[it.status].labelKey) : it.status}
                  </span>
                </div>
                {it.opportunity && (
                  <p className="iv-card-sector">
                    {it.opportunity.sector} · {money(it.opportunity.amountSought, it.opportunity.currency, cur)}
                  </p>
                )}
                {it.amountOffered != null && (
                  <p className="iv-int-line">
                    {tr('ivp.yourOffer', 'عرضك:')} <b>{money(it.amountOffered, it.opportunity?.currency, cur)}</b>
                  </p>
                )}
                {it.message && <p className="iv-int-line">{tr('ivp.yourMsg', 'رسالتك:')} {it.message}</p>}
                {it.founderNote && (
                  <div className="iv-note">
                    <b>{tr('ivp.founderReply', 'رد صاحب المشروع:')}</b> {it.founderNote}
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
