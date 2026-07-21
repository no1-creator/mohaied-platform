'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';
import Icon from '@/components/Icon';

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
  {
    value: 'IP_PROTECTION',
    label: 'تسجيل الأفكار وحماية الملكية الفكرية',
    desc: 'سجّل فكرتك أو برنامجك واحمِ ملكيتك الفكرية بشكل قانوني سليم.',
    icon: 'sparkles',
  },
  {
    value: 'COMPANY_FORMATION',
    label: 'تأسيس الشركات في مصر',
    desc: 'أسّس شركتك في مصر بإجراءات صحيحة ومتابعة قانونية كاملة.',
    icon: 'building',
  },
  {
    value: 'FOREIGNER_CASE',
    label: 'قضايا الأجانب في مصر',
    desc: 'خدمات وتمثيل قانوني للأجانب وإجراءاتهم داخل مصر.',
    icon: 'globe',
  },
  {
    value: 'GENERAL_CONSULT',
    label: 'استشارة قانونية عامة',
    desc: 'اطلب استشارة من مستشار قانوني معتمد في أي موضوع.',
    icon: 'scale',
  },
];

const STATUS: Record<string, { label: string; tone: string }> = {
  SUBMITTED: { label: 'مُقدَّم', tone: 'blue' },
  IN_REVIEW: { label: 'قيد المراجعة', tone: 'amber' },
  ASSIGNED: { label: 'تم التعيين', tone: 'blue' },
  IN_PROGRESS: { label: 'قيد التنفيذ', tone: 'amber' },
  RESOLVED: { label: 'تم الحل', tone: 'ok' },
  CLOSED: { label: 'مغلق', tone: 'muted' },
  REJECTED: { label: 'مرفوض', tone: 'red' },
};

const catLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label || 'طلب قانوني';

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
          <h1 className="ls-title">الخدمات القانونية من محايد</h1>
          <p className="ls-sub">
            فريقنا القانوني المعتمد جاهز يساعدك — اختار نوع الخدمة وقدّم طلبك،
            وهنوزّعه على المستشار المناسب ونتابعه معاك خطوة بخطوة.
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
                <span className="ls-cat-title">{c.label}</span>
                <span className="ls-cat-desc">{c.desc}</span>
              </span>
              <span className="ls-cat-arrow">←</span>
            </button>
          ))}
        </div>

        <div className="ls-mine-head">
          <h2 className="ls-h2">طلباتي</h2>
          <button
            className="ls-new-btn"
            onClick={() => router.push('/legal-services/new')}
          >
            + طلب جديد
          </button>
        </div>

        {loading ? (
          <div className="ls-empty">جاري التحميل...</div>
        ) : requests.length === 0 ? (
          <div className="ls-empty">
            لسه مقدّمتش أي طلب قانوني. اختار خدمة من فوق وابدأ.
          </div>
        ) : (
          <div className="ls-list">
            {requests.map((r) => (
              <div key={r.id} className="ls-card">
                <div className="ls-card-top">
                  <div>
                    <p className="ls-card-title">{r.title}</p>
                    <span className="ls-card-meta">
                      {catLabel(r.category)} ·{' '}
                      <span className="ls-mono">{r.code}</span>
                    </span>
                  </div>
                  <span className={`ls-badge ${STATUS[r.status]?.tone || 'muted'}`}>
                    {STATUS[r.status]?.label || r.status}
                  </span>
                </div>

                {r.description && (
                  <p className="ls-card-desc">{r.description}</p>
                )}

                {r.assignedConsultant && (
                  <div className="ls-note">
                    <b>المستشار المسؤول:</b> {r.assignedConsultant.fullName}
                  </div>
                )}
                {r.adminNote && (
                  <div className="ls-note">
                    <b>ملاحظة الفريق:</b> {r.adminNote}
                  </div>
                )}
                {r.consultantNote && (
                  <div className="ls-note">
                    <b>رد المستشار:</b> {r.consultantNote}
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
