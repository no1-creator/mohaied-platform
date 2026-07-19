'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ProviderShell from '@/components/ProviderShell';
import Icon from '@/components/Icon';

type Offer = {
  id: string;
  scope: string;
  totalPrice: number;
  durationDays: number;
  status: string;
  project?: { id: string; title: string; status: string };
  milestones?: { id: string; title: string; price: number }[];
};

const OFFER_STATUS: Record<string, string> = {
  SUBMITTED: 'مقدَّم',
  REVISED: 'مُعدَّل',
  ACCEPTED: 'مقبول',
  REJECTED: 'مرفوض',
  WITHDRAWN: 'مسحوب',
};

const STATUS_CLASS: Record<string, string> = {
  SUBMITTED: 'om-b-blue',
  REVISED: 'om-b-amber',
  ACCEPTED: 'om-b-green',
  REJECTED: 'om-b-red',
  WITHDRAWN: 'om-b-gray',
};

export default function MyOffersPage() {
  const router = useRouter();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Offer[]>('/offers/mine')
      .then((data) => setOffers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const up = (s?: string) => (s || '').toUpperCase();
  const total = offers.length;
  const accepted = offers.filter((o) => up(o.status) === 'ACCEPTED').length;
  const pending = offers.filter((o) => ['SUBMITTED', 'REVISED'].includes(up(o.status))).length;
  const acceptedValue = offers
    .filter((o) => up(o.status) === 'ACCEPTED')
    .reduce((a, o) => a + (Number(o.totalPrice) || 0), 0);

  return (
    <ProviderShell active="offers" title="عروضي">
      <style>{OM_CSS}</style>
      <div className="om-wrap">
        {loading ? (
          <div className="om-state">جاري التحميل...</div>
        ) : error ? (
          <div className="om-state om-err">{error}</div>
        ) : (
          <>
            <div className="om-stats">
              <Stat n={total} l="إجمالي العروض" />
              <Stat n={accepted} l="مقبولة" tone="good" />
              <Stat n={pending} l="قيد المراجعة" />
              <Stat n={`${acceptedValue.toLocaleString('en-US')} ج.م`} l="قيمة المقبول" tone="good" />
            </div>

            {offers.length === 0 ? (
              <div className="om-empty">
                <div className="om-empty-ic"><Icon name="fileText" size={30} /></div>
                <h3>لسه مقدّمتش أي عروض</h3>
                <p>تصفّح المشاريع المتاحة وابدأ قدّم عروضك عشان تكسب شغل جديد.</p>
                <button className="om-empty-btn" onClick={() => router.push('/projects/open')}>
                  تصفّح المشاريع
                </button>
              </div>
            ) : (
              <div className="om-list">
                {offers.map((o) => {
                  const canOpen = up(o.status) === 'ACCEPTED' && !!o.project?.id;
                  return (
                    <div
                      key={o.id}
                      className={`om-card ${canOpen ? 'om-click' : ''}`}
                      onClick={() => canOpen && router.push(`/projects/${o.project!.id}`)}
                    >
                      <div className="om-card-top">
                        <h3 className="om-title">{o.project?.title || 'مشروع'}</h3>
                        <span className={`om-badge ${STATUS_CLASS[up(o.status)] || 'om-b-gray'}`}>
                          {OFFER_STATUS[up(o.status)] || o.status}
                        </span>
                      </div>
                      {o.scope && <p className="om-scope">{o.scope}</p>}
                      <div className="om-meta">
                        <span className="om-price">
                          <Icon name="creditCard" size={15} /> {Number(o.totalPrice).toLocaleString('en-US')} ج.م
                        </span>
                        <span className="om-m">
                          <Icon name="clock" size={15} /> {o.durationDays} يوم
                        </span>
                        <span className="om-m">
                          <Icon name="fileCheck" size={15} /> {o.milestones?.length || 0} مرحلة
                        </span>
                        {canOpen && <span className="om-open">افتح المشروع ↗</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </ProviderShell>
  );
}

function Stat({ n, l, tone }: { n: number | string; l: string; tone?: 'good' }) {
  return (
    <div className={`om-stat ${tone === 'good' ? 'good' : ''}`}>
      <div className="om-stat-n">{n}</div>
      <div className="om-stat-l">{l}</div>
    </div>
  );
}

const OM_CSS = `
.om-wrap{max-width:900px;margin:0 auto;}
.om-state{padding:50px;text-align:center;color:var(--muted);}
.om-err{color:#b42318;}
.om-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
.om-stat{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;text-align:center;}
.om-stat.good{border-color:var(--green-light);}
.om-stat-n{font-size:22px;font-weight:900;color:var(--green-dark);}
.om-stat-l{font-size:12.5px;color:var(--muted);margin-top:3px;}
.om-list{display:flex;flex-direction:column;gap:12px;}
.om-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;transition:all .15s;}
.om-click{cursor:pointer;}
.om-click:hover{border-color:var(--green-light);box-shadow:0 10px 24px rgba(40,125,115,.1);}
.om-card-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;}
.om-title{font-size:16.5px;font-weight:800;color:var(--ink);margin:0;}
.om-badge{font-size:12px;font-weight:800;padding:4px 12px;border-radius:999px;white-space:nowrap;}
.om-b-green{background:#e3f4ec;color:#1c7a4f;}
.om-b-blue{background:#e6f0fb;color:#1e5fae;}
.om-b-amber{background:#fdf0d9;color:#a86a12;}
.om-b-red{background:#fdecec;color:#b42318;}
.om-b-gray{background:#eef1f0;color:#67736f;}
.om-scope{font-size:13.5px;color:var(--muted);line-height:1.7;margin:0 0 12px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.om-meta{display:flex;flex-wrap:wrap;gap:16px;align-items:center;}
.om-price{display:flex;align-items:center;gap:6px;font-weight:800;color:var(--green-dark);font-size:14px;}
.om-price svg{color:var(--green);}
.om-m{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px;}
.om-m svg{color:var(--muted);}
.om-open{margin-inline-start:auto;color:var(--green-dark);font-weight:800;font-size:13px;}
.om-empty{background:#fff;border:1px solid var(--line);border-radius:16px;padding:50px 24px;text-align:center;}
.om-empty-ic{color:var(--green);margin-bottom:10px;}
.om-empty h3{font-size:18px;font-weight:900;color:var(--ink);margin:0 0 8px;}
.om-empty p{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 18px;}
.om-empty-btn{background:var(--green);color:#fff;border:none;font-weight:800;font-size:14px;padding:12px 26px;border-radius:12px;cursor:pointer;font-family:inherit;}
@media(max-width:640px){.om-stats{grid-template-columns:1fr 1fr;}.om-meta{gap:12px;}}
`;
