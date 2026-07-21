'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

type LegalProfile = {
  title: string;
  field: string;
  yearsExp: number;
  consultationRate: number | string;
  bio?: string | null;
  specialties?: string | null;
  languages?: string | null;
  city?: string | null;
  rating: number;
  reviewsCount: number;
};
type Consultant = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  legalConsultantProfile: LegalProfile | null;
};

export default function LegalConsultantsPage() {
  const [list, setList] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    api<Consultant[]>('/users/legal-consultants')
      .then((d) => setList(d || []))
      .catch((e) => setError(e?.message || 'تعذّر التحميل'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = list.filter((c) => {
    if (!q.trim()) return true;
    const p = c.legalConsultantProfile;
    const hay = `${c.fullName} ${p?.title || ''} ${p?.field || ''} ${p?.specialties || ''} ${p?.city || ''}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  return (
    <div className="lc-page">
      <style>{LC_CSS}</style>
      <div className="lc-hero">
        <Link href="/" className="lc-back">→ الرئيسية</Link>
        <h1>دليل المستشارين القانونيين</h1>
        <p>
          مستشارون ومحامون متخصصون موثّقون على محايد — لعقودك وتأسيس شركتك وحماية
          ملكيتك الفكرية.
        </p>
        <input
          className="lc-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالاسم أو التخصص أو المدينة..."
        />
      </div>

      {loading ? (
        <div className="lc-state">جاري التحميل...</div>
      ) : error ? (
        <div className="lc-state err">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="lc-state">مفيش مستشارين مطابقين حاليًا.</div>
      ) : (
        <div className="lc-grid">
          {filtered.map((c) => {
            const p = c.legalConsultantProfile;
            if (!p) return null;
            return (
              <div key={c.id} className="lc-card">
                <div className="lc-card-head">
                  <div className="lc-avatar">{c.fullName.charAt(0)}</div>
                  <div>
                    <div className="lc-name">
                      {c.fullName}
                      {c.isVerified && <span className="lc-verified">موثّق ✓</span>}
                    </div>
                    <div className="lc-title">{p.title}</div>
                  </div>
                </div>
                <span className="lc-field">{p.field}</span>
                {p.bio && <p className="lc-bio">{p.bio}</p>}
                <ul className="lc-meta">
                  {p.yearsExp > 0 && (
                    <li><span>الخبرة</span><b>{p.yearsExp} سنة</b></li>
                  )}
                  {p.city && (
                    <li><span>المدينة</span><b>{p.city}</b></li>
                  )}
                  {p.languages && (
                    <li><span>اللغات</span><b>{p.languages}</b></li>
                  )}
                  {Number(p.consultationRate) > 0 && (
                    <li><span>أجر الاستشارة</span><b>{p.consultationRate} ج.م</b></li>
                  )}
                  {p.reviewsCount > 0 && (
                    <li><span>التقييم</span><b>{p.rating.toFixed(1)} ⭐ ({p.reviewsCount})</b></li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const LC_CSS = `
.lc-page{min-height:100vh;background:#f7faf8;direction:rtl;font-family:'Noto Sans Arabic',sans-serif;padding-bottom:60px;}
.lc-hero{background:linear-gradient(140deg,#216c63,#184f48);color:#fff;padding:40px 24px 34px;text-align:center;}
.lc-back{color:rgba(255,255,255,.85);text-decoration:none;font-size:13.5px;font-weight:600;}
.lc-hero h1{font-size:28px;font-weight:800;margin:14px 0 8px;}
.lc-hero p{opacity:.85;font-size:15px;max-width:560px;margin:0 auto 18px;line-height:1.7;}
.lc-search{width:100%;max-width:420px;border:none;border-radius:12px;padding:13px 16px;font-family:inherit;font-size:15px;box-sizing:border-box;}
.lc-state{text-align:center;color:var(--muted);padding:60px 20px;}
.lc-state.err{color:#b4322b;}
.lc-grid{max-width:1080px;margin:26px auto 0;padding:0 24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px;}
.lc-card{background:#fff;border:1px solid var(--line);border-radius:18px;padding:22px;box-shadow:0 10px 26px rgba(24,70,61,.05);display:flex;flex-direction:column;gap:12px;}
.lc-card-head{display:flex;align-items:center;gap:13px;}
.lc-avatar{width:50px;height:50px;border-radius:14px;background:var(--mint);color:var(--green-dark);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;flex-shrink:0;}
.lc-name{font-weight:800;color:var(--ink);font-size:15.5px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
.lc-verified{background:#e3f4ec;color:#1c7a4f;font-size:11px;font-weight:700;padding:2px 8px;border-radius:99px;}
.lc-title{color:var(--muted);font-size:13px;margin-top:2px;}
.lc-field{display:inline-block;align-self:flex-start;background:var(--sand);color:#8a6d1a;font-size:12.5px;font-weight:700;padding:4px 12px;border-radius:99px;}
.lc-bio{color:var(--ink);font-size:13.5px;line-height:1.7;margin:0;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
.lc-meta{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;}
.lc-meta li{display:flex;justify-content:space-between;font-size:13px;color:var(--ink);border-top:1px dashed var(--line);padding-top:7px;}
.lc-meta li span{color:var(--muted);}
.lc-meta li b{color:var(--ink);}
@media(max-width:520px){.lc-grid{grid-template-columns:1fr;}}
`;
