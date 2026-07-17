'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import Icon from '@/components/Icon';

type SupProfile = {
  title?: string;
  field?: string;
  yearsExp?: number;
  ratePerReview?: number;
  rating?: number;
  reviewsCount?: number;
  bio?: string;
  education?: string;
  certifications?: string;
  specialties?: string;
  languages?: string;
  city?: string;
};

type AvailableSupervisor = {
  id: string;
  fullName: string;
  isVerified?: boolean;
  supervisorProfile?: SupProfile | null;
};

type Assignment = {
  id: string;
  status: string;
  ratePerReview: number;
  supervisor?: { id: string; fullName: string };
  reports?: { id: string }[];
  createdAt?: string;
};

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  INVITED: { label: 'دعوة مُرسلة', color: '#92640a', bg: '#fef6e0' },
  ACCEPTED: { label: 'مقبول', color: '#216c63', bg: '#edf7f3' },
  ACTIVE: { label: 'نشط', color: '#216c63', bg: '#edf7f3' },
  DECLINED: { label: 'مرفوض', color: '#b91c1c', bg: '#fef2f2' },
  COMPLETED: { label: 'منتهي', color: '#3730a3', bg: '#eef2ff' },
  REMOVED: { label: 'مُزال', color: '#70807b', bg: '#f1f5f4' },
};

const SV_CSS = `
.sv-wrap { max-width:920px; margin:0 auto; padding:28px 20px 80px; }
.sv-head { margin-bottom:20px; }
.sv-title { font-size:24px; font-weight:800; color:var(--ink); margin:0 0 6px; }
.sv-sub { color:var(--muted); font-size:14px; margin:0; line-height:1.7; }
.sv-banner { border-radius:12px; padding:12px 14px; font-size:14px; margin-bottom:16px; }
.sv-error { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
.sv-notice { background:#edf7f3; color:#216c63; border:1px solid #cfe6df; }
.sv-section { margin-top:26px; }
.sv-section-title { font-size:15px; font-weight:800; color:var(--ink); margin:0 0 14px; display:flex; align-items:center; gap:9px; }
.sv-section-title::before { content:''; width:4px; height:18px; background:var(--green); border-radius:2px; display:inline-block; }
.sv-empty { background:#fff; border:1px dashed var(--line); border-radius:14px; padding:26px; text-align:center; color:var(--muted); font-size:14px; }
.sv-asg { display:flex; align-items:center; justify-content:space-between; gap:12px; background:#fff; border:1px solid var(--line); border-radius:12px; padding:14px 16px; margin-bottom:10px; flex-wrap:wrap; }
.sv-asg-name { font-weight:700; color:var(--ink); font-size:15px; }
.sv-asg-meta { font-size:12.5px; color:var(--muted); margin-top:3px; }
.sv-badge { padding:5px 12px; border-radius:999px; font-size:12px; font-weight:700; white-space:nowrap; }
.sv-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.sv-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px; display:flex; flex-direction:column; box-shadow:0 4px 18px rgba(23,33,31,.04); }
.sv-card-top { display:flex; align-items:center; gap:11px; margin-bottom:10px; }
.sv-avatar { width:46px; height:46px; border-radius:12px; background:linear-gradient(140deg,var(--green-light),var(--green-dark)); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:19px; flex-shrink:0; }
.sv-name { font-weight:800; color:var(--ink); font-size:15.5px; display:flex; align-items:center; gap:6px; }
.sv-verified { display:inline-flex; align-items:center; gap:3px; color:var(--green); font-size:12px; background:var(--mint); border-radius:6px; padding:2px 7px; }
.sv-role { font-size:12.5px; color:var(--muted); margin-top:2px; }
.sv-tags { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
.sv-tag { background:var(--mint); color:var(--green-dark); border-radius:8px; padding:4px 9px; font-size:11.5px; font-weight:700; }
.sv-bio { font-size:13px; color:var(--muted); line-height:1.7; margin:6px 0 12px; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; }
.sv-stats { display:flex; gap:16px; font-size:12.5px; color:var(--muted); margin-bottom:14px; flex-wrap:wrap; }
.sv-stats span { display:inline-flex; align-items:center; gap:4px; }
.sv-stats b { color:var(--ink); }
.sv-invite { margin-top:auto; border-top:1px solid var(--line); padding-top:12px; }
.sv-rate-label { font-size:12px; font-weight:700; color:var(--ink); margin-bottom:6px; display:block; }
.sv-invite-row { display:flex; gap:8px; align-items:center; }
.sv-rate { flex:1; border:1px solid var(--line); border-radius:10px; padding:9px 12px; font-family:inherit; font-size:14px; box-sizing:border-box; }
.sv-btn { background:var(--green); color:#fff; border:none; border-radius:10px; padding:10px 20px; font-weight:800; font-size:14px; cursor:pointer; font-family:inherit; white-space:nowrap; }
.sv-btn:hover { background:var(--green-dark); }
.sv-btn:disabled { opacity:.6; cursor:not-allowed; }
.sv-loading { text-align:center; color:var(--muted); padding:60px 20px; }
@media(max-width:640px){ .sv-grid { grid-template-columns:1fr; } }
`;

export default function ProjectSupervisorsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [role, setRole] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [available, setAvailable] = useState<AvailableSupervisor[]>([]);
  const [rates, setRates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');

  async function loadAll() {
    setError('');
    try {
      const me = await api<{ role: string }>('/users/me');
      setRole(me.role);
      const asg = await api<Assignment[]>(`/supervisors/project/${id}`);
      setAssignments(asg);
      if (me.role === 'CLIENT') {
        const av = await api<AvailableSupervisor[]>('/supervisors/available');
        setAvailable(av);
        setRates((prev) => {
          const next = { ...prev };
          av.forEach((s) => {
            if (next[s.id] === undefined) {
              next[s.id] = String(s.supervisorProfile?.ratePerReview ?? '');
            }
          });
          return next;
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, router]);

  async function invite(supervisorId: string) {
    const rate = Number(rates[supervisorId]);
    if (!rate || rate < 0) {
      setError('من فضلك اكتب أجر مراجعة صحيح');
      return;
    }
    setBusy(supervisorId);
    setError('');
    setNotice('');
    try {
      await api('/supervisors/invite', {
        method: 'POST',
        body: { projectId: id, supervisorId, ratePerReview: rate },
      });
      setNotice('تم إرسال الدعوة للمشرف بنجاح');
      await loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  }

  const activeIds = new Set(
    assignments
      .filter((a) => ['INVITED', 'ACCEPTED', 'ACTIVE'].includes(a.status))
      .map((a) => a.supervisor?.id),
  );
  const selectable = available.filter((s) => !activeIds.has(s.id));

  return (
    <>
      <style>{SV_CSS}</style>
      <TopBar />
      <div className="sv-wrap">
        <div className="sv-head">
          <h1 className="sv-title">المشرفون المحايدون</h1>
          <p className="sv-sub">
            المشرف المحايد بيراجع جودة التسليمات ويكتب تقارير موثّقة — طبقة حماية إضافية لمشروعك.
          </p>
        </div>

        {error && <div className="sv-banner sv-error">{error}</div>}
        {notice && <div className="sv-banner sv-notice">{notice}</div>}

        {loading ? (
          <div className="sv-loading">جاري التحميل...</div>
        ) : (
          <>
            {/* المكلّفون */}
            <div className="sv-section">
              <h2 className="sv-section-title">المشرفون على هذا المشروع</h2>
              {assignments.length === 0 ? (
                <div className="sv-empty">لسه مفيش مشرفين على المشروع.</div>
              ) : (
                assignments.map((a) => {
                  const st = STATUS[a.status] || {
                    label: a.status,
                    color: '#70807b',
                    bg: '#f1f5f4',
                  };
                  return (
                    <div key={a.id} className="sv-asg">
                      <div>
                        <div className="sv-asg-name">
                          {a.supervisor?.fullName || 'مشرف'}
                        </div>
                        <div className="sv-asg-meta">
                          أجر المراجعة: {a.ratePerReview} ج.م · {a.reports?.length || 0} تقرير
                        </div>
                      </div>
                      <span
                        className="sv-badge"
                        style={{ color: st.color, background: st.bg }}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* الدعوة (للعميل فقط) */}
            {role === 'CLIENT' && (
              <div className="sv-section">
                <h2 className="sv-section-title">اختر مشرفًا لدعوته</h2>
                {selectable.length === 0 ? (
                  <div className="sv-empty">
                    مفيش مشرفين متاحين حاليًا للدعوة.
                  </div>
                ) : (
                  <div className="sv-grid">
                    {selectable.map((s) => {
                      const p = s.supervisorProfile || {};
                      const specialties = (p.specialties || '')
                        .split(',')
                        .map((x) => x.trim())
                        .filter(Boolean)
                        .slice(0, 3);
                      return (
                        <div key={s.id} className="sv-card">
                          <div className="sv-card-top">
                            <div className="sv-avatar">
                              {s.fullName?.charAt(0) || 'م'}
                            </div>
                            <div>
                              <div className="sv-name">
                                {s.fullName}
                                {s.isVerified && (
                                  <span className="sv-verified">
                                    <Icon name="badgeCheck" size={12} /> موثّق
                                  </span>
                                )}
                              </div>
                              <div className="sv-role">
                                {p.title || 'مشرف متخصص'}
                                {p.field ? ` · ${p.field}` : ''}
                              </div>
                            </div>
                          </div>

                          {specialties.length > 0 && (
                            <div className="sv-tags">
                              {specialties.map((t, i) => (
                                <span key={i} className="sv-tag">
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {p.bio && <p className="sv-bio">{p.bio}</p>}

                          <div className="sv-stats">
                            {p.yearsExp != null && (
                              <span>
                                <Icon name="briefcase" size={13} /> خبرة <b>{p.yearsExp}</b> سنة
                              </span>
                            )}
                            {p.rating != null && p.rating > 0 && (
                              <span>
                                <Icon name="star" size={13} /> <b>{p.rating}</b> ({p.reviewsCount || 0})
                              </span>
                            )}
                            {p.city && (
                              <span>
                                <Icon name="mapPin" size={13} /> {p.city}
                              </span>
                            )}
                          </div>

                          <div className="sv-invite">
                            <label className="sv-rate-label">
                              أجر المراجعة المقترح (ج.م)
                            </label>
                            <div className="sv-invite-row">
                              <input
                                className="sv-rate"
                                type="number"
                                min={0}
                                value={rates[s.id] ?? ''}
                                onChange={(e) =>
                                  setRates((prev) => ({
                                    ...prev,
                                    [s.id]: e.target.value,
                                  }))
                                }
                                placeholder="0"
                              />
                              <button
                                className="sv-btn"
                                onClick={() => invite(s.id)}
                                disabled={busy === s.id}
                              >
                                {busy === s.id ? '...' : 'دعوة'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
