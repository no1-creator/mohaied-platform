'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';
import { useI18n } from '@/lib/i18n';

type LegalRequest = {
  id: string;
  code: string;
  category: string;
  status: string;
  title: string;
  description?: string;
  adminNote?: string | null;
  consultantNote?: string | null;
  createdAt: string;
  assignedConsultant?: { fullName: string } | null;
};

const CATEGORIES = [
  { value: 'IP_PROTECTION', labelKey: 'lsv.cat.IP_PROTECTION', descKey: 'lsv.catDesc.IP_PROTECTION', icon: 'sparkles' },
  { value: 'COMPANY_FORMATION', labelKey: 'lsv.cat.COMPANY_FORMATION', descKey: 'lsv.catDesc.COMPANY_FORMATION', icon: 'building' },
  { value: 'FOREIGNER_CASE', labelKey: 'lsv.cat.FOREIGNER_CASE', descKey: 'lsv.catDesc.FOREIGNER_CASE', icon: 'globe' },
  { value: 'GENERAL_CONSULT', labelKey: 'lsv.cat.GENERAL_CONSULT', descKey: 'lsv.catDesc.GENERAL_CONSULT', icon: 'scale' },
];

const STATUS: Record<string, { labelKey: string; tone: string }> = {
  SUBMITTED: { labelKey: 'lsv.status.SUBMITTED', tone: 'blue' },
  IN_REVIEW: { labelKey: 'lsv.status.IN_REVIEW', tone: 'amber' },
  ASSIGNED: { labelKey: 'lsv.status.ASSIGNED', tone: 'blue' },
  IN_PROGRESS: { labelKey: 'lsv.status.IN_PROGRESS', tone: 'amber' },
  RESOLVED: { labelKey: 'lsv.status.RESOLVED', tone: 'ok' },
  CLOSED: { labelKey: 'lsv.status.CLOSED', tone: 'muted' },
  REJECTED: { labelKey: 'lsv.status.REJECTED', tone: 'red' },
};

const catLabel = (tr: (k: string, f?: string) => string, v: string) => {
  const c = CATEGORIES.find((x) => x.value === v);
  return c ? tr(c.labelKey) : tr('lsv.reqFallback', 'طلب قانوني');
};

const LS_CSS = `
.ls-wrap{max-width:820px;margin:0 auto;width:100%;padding:26px 20px 90px;}
.ls-head{margin-bottom:22px;}
.ls-title{font-size:24px;font-weight:800;color:var(--ink);margin:0 0 8px;}
.ls-sub{color:var(--muted);font-size:14px;line-height:1.8;margin:0;}
.ls-cats{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:30px;}
.ls-cat{display:flex;align-items:center;gap:14px;text-align:right;background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.ls-cat:hover{border-color:var(--green-light);transform:translateY(-2px);}
.ls-cat-icon{width:46px;height:46px;border-radius:12px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.ls-cat-icon svg{width:22px;height:22px;}
.ls-cat-body{display:flex;flex-direction:column;gap:4px;flex:1;}
.ls-cat-title{font-weight:800;color:var(--ink);font-size:15px;}
.ls-cat-desc{font-size:12.5px;color:var(--muted);line-height:1.6;}
.ls-cat-arrow{color:var(--green-dark);font-weight:800;font-size:18px;}
.ls-mine-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.ls-h2{font-size:18px;font-weight:800;color:var(--ink);margin:0;}
.ls-new-btn{border:none;background:var(--green);color:#fff;padding:9px 16px;border-radius:10px;font-weight:700;cursor:pointer;font-family:inherit;font-size:13.5px;}
.ls-new-btn:hover{background:var(--green-dark);}
.ls-empty{padding:34px;text-align:center;color:var(--muted);background:#fff;border:1px solid var(--line);border-radius:14px;}
.ls-list{display:flex;flex-direction:column;gap:12px;}
.ls-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px;box-shadow:0 10px 26px rgba(24,70,61,.04);}
.ls-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.ls-card-title{font-weight:800;color:var(--ink);font-size:15.5px;margin:0 0 4px;}
.ls-card-meta{font-size:12.5px;color:var(--muted);}
.ls-mono{direction:ltr;font-size:12px;color:var(--muted);}
.ls-card-desc{margin:12px 0 0;font-size:13.5px;color:var(--text);line-height:1.8;white-space:pre-wrap;}
.ls-note{margin-top:12px;background:var(--mint);border-radius:12px;padding:12px 14px;font-size:13px;color:var(--ink);line-height:1.7;}
.ls-note b{color:var(--green-dark);}
.ls-badge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;white-space:nowrap;}
.ls-badge.ok{background:#e3f4ec;color:#1c7a4f;}
.ls-badge.muted{background:#eef1f0;color:var(--muted);}
.ls-badge.red{background:#fdeceb;color:#b4322b;}
.ls-badge.blue{background:#e7f0fb;color:#2f5fa6;}
.ls-badge.amber{background:#fdf3dd;color:#96690f;}
@media(max-width:640px){.ls-cats{grid-template-columns:1fr;}.ls-title{font-size:21px;}}
`;

export default function LegalServicesPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const [requests, setRequests] = useState<LegalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    api<LegalRequest[]>('/legal/requests/mine')
      .then((d) => setRequests(Array.isArray(d) ? d : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <style>{LS_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="ls-wrap">
        <div className="ls-head">
          <h1 className="ls-title">{tr('lsv.title', 'الخدمات القانونية من محايد')}</h1>
          <p className="ls-sub">
            {tr('lsv.sub', 'فريقنا القانوني المعتمد جاهز يساعدك — اختار نوع الخدمة وقدّم طلبك، وهنوزّعه على المستشار المناسب ونتابعه معاك خطوة بخطوة.')}
          </p>
        </div>

        <div className="ls-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className="ls-cat"
              onClick={() =>
                router.push(`/legal-services/new?category=${c.value}`)
              }
            >
              <span className="ls-cat-icon">
                <Icon name={c.icon} />
              </span>
              <span className="ls-cat-body">
                <span className="ls-cat-title">{tr(c.labelKey)}</span>
                <span className="ls-cat-desc">{tr(c.descKey)}</span>
              </span>
              <span className="ls-cat-arrow">←</span>
            </button>
          ))}
        </div>

        <div className="ls-mine-head">
          <h2 className="ls-h2">{tr('lsv.myRequests', 'طلباتي')}</h2>
          <button
            className="ls-new-btn"
            onClick={() => router.push('/legal-services/new')}
          >
            {tr('lsv.newReq', '+ طلب جديد')}
          </button>
        </div>

        {loading ? (
          <div className="ls-empty">{tr('cls.loading', 'جاري التحميل...')}</div>
        ) : requests.length === 0 ? (
          <div className="ls-empty">
            {tr('lsv.empty', 'لسه مقدّمتش أي طلب قانوني. اختار خدمة من فوق وابدأ.')}
          </div>
        ) : (
          <div className="ls-list">
            {requests.map((r) => (
              <div key={r.id} className="ls-card">
                <div className="ls-card-top">
                  <div>
                    <p className="ls-card-title">{r.title}</p>
                    <span className="ls-card-meta">
                      {catLabel(tr, r.category)} ·{' '}
                      <span className="ls-mono">{r.code}</span>
                    </span>
                  </div>
                  <span className={`ls-badge ${STATUS[r.status]?.tone || 'muted'}`}>
                    {STATUS[r.status] ? tr(STATUS[r.status].labelKey) : r.status}
                  </span>
                </div>

                {r.description && (
                  <p className="ls-card-desc">{r.description}</p>
                )}

                {r.assignedConsultant && (
                  <div className="ls-note">
                    <b>{tr('lsv.consultant', 'المستشار المسؤول:')}</b> {r.assignedConsultant.fullName}
                  </div>
                )}
                {r.adminNote && (
                  <div className="ls-note">
                    <b>{tr('lsv.teamNote', 'ملاحظة الفريق:')}</b> {r.adminNote}
                  </div>
                )}
                {r.consultantNote && (
                  <div className="ls-note">
                    <b>{tr('lsv.consultantReply', 'رد المستشار:')}</b> {r.consultantNote}
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
