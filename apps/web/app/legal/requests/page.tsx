'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Req = {
  id: string;
  code: string;
  category: string;
  status: string;
  title: string;
  description?: string;
  entityName?: string | null;
  nationality?: string | null;
  budget?: string | number | null;
  preferredContact?: string | null;
  adminNote?: string | null;
  consultantNote?: string | null;
  createdAt: string;
  client?: { fullName: string; email: string } | null;
};

const CAT_LABEL: Record<string, string> = {
  IP_PROTECTION: 'ملكية فكرية',
  COMPANY_FORMATION: 'تأسيس شركات',
  FOREIGNER_CASE: 'قضايا أجانب',
  GENERAL_CONSULT: 'استشارة عامة',
  OTHER: 'أخرى',
};

const STATUS_LABEL: Record<string, string> = {
  SUBMITTED: 'مُقدَّم',
  IN_REVIEW: 'قيد المراجعة',
  ASSIGNED: 'تم التعيين',
  IN_PROGRESS: 'قيد التنفيذ',
  RESOLVED: 'تم الحل',
  CLOSED: 'مغلق',
  REJECTED: 'مرفوض',
};

const STATUS_TONE: Record<string, string> = {
  SUBMITTED: 'blue',
  IN_REVIEW: 'amber',
  ASSIGNED: 'blue',
  IN_PROGRESS: 'amber',
  RESOLVED: 'ok',
  CLOSED: 'muted',
  REJECTED: 'red',
};

// الحالات اللي المستشار يقدر يغيّرها
const CONSULTANT_STATUSES = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const LQ_CSS = `
.lq-wrap{max-width:820px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.lq-head{margin-bottom:22px;}
.lq-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.lq-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.lq-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.lq-list{display:flex;flex-direction:column;gap:14px;}
.lq-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.lq-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.lq-card-title{font-weight:800;color:var(--ink);font-size:16px;margin:0 0 4px;}
.lq-meta{font-size:12.5px;color:var(--muted);}
.lq-mono{direction:ltr;}
.lq-desc{margin:12px 0 0;font-size:13.5px;color:var(--text);line-height:1.8;white-space:pre-wrap;}
.lq-info{margin-top:10px;font-size:13px;color:var(--muted);line-height:1.8;}
.lq-info b{color:var(--ink);}
.lq-note{margin-top:10px;background:var(--mint);border-radius:12px;padding:10px 14px;font-size:13px;color:var(--ink);line-height:1.7;}
.lq-note b{color:var(--green-dark);}
.lq-edit{margin-top:14px;border-top:1px dashed var(--line);padding-top:14px;display:grid;grid-template-columns:200px 1fr;gap:12px;align-items:end;}
.lq-fld label{display:block;font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;}
.lq-fld select,.lq-fld textarea{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font-family:inherit;font-size:14px;background:#fff;box-sizing:border-box;}
.lq-fld textarea{min-height:70px;resize:vertical;line-height:1.7;}
.lq-fld.full{grid-column:1 / -1;}
.lq-save{border:none;background:var(--green);color:#fff;padding:11px 22px;border-radius:10px;font-weight:800;cursor:pointer;font-family:inherit;justify-self:start;}
.lq-save:hover{background:var(--green-dark);}
.lq-save:disabled{opacity:.6;cursor:default;}
.lq-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;}
.lq-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.lq-badge.muted{background:#eef1f0;color:var(--muted);}
.lq-badge.red{background:#fdeceb;color:#b4322b;}
.lq-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.lq-badge.amber{background:#fdf3dd;color:#96690f;}
@media(max-width:600px){.lq-edit{grid-template-columns:1fr;}}
`;

export default function ConsultantRequestsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Req[]>([]);
  const [state, setState] = useState<'loading' | 'ok' | 'denied'>('loading');
  const [drafts, setDrafts] = useState<Record<string, { status: string; note: string }>>({});
  const [savingId, setSavingId] = useState('');

  async function load() {
    const d = await api<Req[]>('/legal/requests/assigned');
    const list = Array.isArray(d) ? d : [];
    setRows(list);
    const init: Record<string, { status: string; note: string }> = {};
    for (const r of list) {
      init[r.id] = { status: r.status, note: r.consultantNote || '' };
    }
    setDrafts(init);
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<{ role: string }>('/users/me')
      .then(async (me) => {
        if (me.role !== 'LEGAL_CONSULTANT') {
          setState('denied');
          return;
        }
        await load();
        setState('ok');
      })
      .catch(() => setState('denied'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  function setDraft(id: string, patch: Partial<{ status: string; note: string }>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  }

  async function save(id: string) {
    setSavingId(id);
    try {
      await api(`/legal/requests/${id}/consultant`, {
        method: 'PATCH',
        body: {
          status: drafts[id]?.status,
          consultantNote: drafts[id]?.note,
        },
      });
      await load();
    } catch (e: any) {
      alert(e?.message || 'حصل خطأ أثناء الحفظ');
    }
    setSavingId('');
  }

  if (state === 'loading') {
    return (
      <>
        <style>{LQ_CSS}</style>
        <TopBar />
        <div className="lq-wrap">
          <div className="lq-empty">جاري التحميل...</div>
        </div>
      </>
    );
  }

  if (state === 'denied') {
    return (
      <>
        <style>{LQ_CSS}</style>
        <TopBar />
        <BackBar />
        <div className="lq-wrap">
          <div className="lq-empty">
            الصفحة دي متاحة للمستشارين القانونيين بس.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{LQ_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="lq-wrap">
        <div className="lq-head">
          <h1 className="lq-title">طلباتي القانونية</h1>
          <p className="lq-sub">
            الطلبات المعيّنة لك من فريق محايد — تابع حالتها وضيف ردودك للعميل.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="lq-empty">مفيش طلبات معيّنة لك حاليًا.</div>
        ) : (
          <div className="lq-list">
            {rows.map((r) => (
              <div key={r.id} className="lq-card">
                <div className="lq-top">
                  <div>
                    <p className="lq-card-title">{r.title}</p>
                    <span className="lq-meta">
                      {CAT_LABEL[r.category] || r.category} ·{' '}
                      <span className="lq-mono">{r.code}</span>
                    </span>
                  </div>
                  <span className={`lq-badge ${STATUS_TONE[r.status] || 'muted'}`}>
                    {STATUS_LABEL[r.status] || r.status}
                  </span>
                </div>

                {r.description && <p className="lq-desc">{r.description}</p>}

                <div className="lq-info">
                  {r.client && (
                    <div>
                      <b>العميل:</b> {r.client.fullName}
                    </div>
                  )}
                  {r.entityName && (
                    <div>
                      <b>اسم الكيان:</b> {r.entityName}
                    </div>
                  )}
                  {r.nationality && (
                    <div>
                      <b>الجنسية:</b> {r.nationality}
                    </div>
                  )}
                  {r.budget ? (
                    <div>
                      <b>الميزانية:</b> {r.budget} ج.م
                    </div>
                  ) : null}
                  {r.preferredContact && (
                    <div>
                      <b>وسيلة التواصل:</b> {r.preferredContact}
                    </div>
                  )}
                </div>

                {r.adminNote && (
                  <div className="lq-note">
                    <b>ملاحظة الإدارة:</b> {r.adminNote}
                  </div>
                )}

                <div className="lq-edit">
                  <div className="lq-fld">
                    <label>الحالة</label>
                    <select
                      value={drafts[r.id]?.status || r.status}
                      onChange={(e) => setDraft(r.id, { status: e.target.value })}
                    >
                      {CONSULTANT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="lq-fld full">
                    <label>ردك / ملاحظتك للعميل</label>
                    <textarea
                      value={drafts[r.id]?.note || ''}
                      onChange={(e) => setDraft(r.id, { note: e.target.value })}
                      placeholder="اكتب ردك أو تحديثك على الطلب"
                    />
                  </div>
                  <button
                    className="lq-save"
                    onClick={() => save(r.id)}
                    disabled={savingId === r.id}
                  >
                    {savingId === r.id ? 'جاري الحفظ...' : 'حفظ'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
