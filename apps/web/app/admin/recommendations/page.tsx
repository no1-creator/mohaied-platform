'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import Icon from '@/components/Icon';
import { api } from '@/lib/api';

type Req = {
  id: string;
  title: string;
  field: string;
  description: string;
  budgetMin?: number | string | null;
  budgetMax?: number | string | null;
  durationDays?: number | null;
  status: string;
  adminNote?: string | null;
  recommendedProviderIds: string[];
  createdAt: string;
  client?: { id: string; fullName: string; email: string };
};

type Match = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  companyName: string | null;
  field: string | null;
  city: string | null;
  rating: number;
  reviewsCount: number;
  yearsExp: number | null;
  type: string | null;
  score: number;
  reasons: string[];
};

function statusBadge(s: string) {
  if (s === 'RESPONDED') return { cls: 'ok', label: 'تم الترشيح' };
  if (s === 'CLOSED') return { cls: 'muted', label: 'مغلق' };
  return { cls: 'amber', label: 'بانتظار الرد' };
}

function scoreTone(score: number) {
  if (score >= 70) return '#1c7a4f';
  if (score >= 40) return '#96690f';
  return '#70807b';
}

export default function AdminRecommendationsPage() {
  const [reqs, setReqs] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  const [selected, setSelected] = useState<Req | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null,
  );

  function loadList() {
    setLoading(true);
    setLoadErr('');
    api<Req[]>('/recommendations/admin')
      .then((d) => setReqs(Array.isArray(d) ? d : []))
      .catch((e) => setLoadErr(e?.message || 'تعذّر تحميل الطلبات'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadList();
  }, []);

  function openReq(r: Req) {
    setSelected(r);
    setNote(r.adminNote || '');
    setChosen(Array.isArray(r.recommendedProviderIds) ? [...r.recommendedProviderIds] : []);
    setMatches([]);
    setMsg(null);
    fetchMatches(r.id);
  }

  function fetchMatches(id: string) {
    setLoadingMatches(true);
    api<Match[]>(`/matching/recommendation/${id}`)
      .then((d) => setMatches(Array.isArray(d) ? d : []))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false));
  }

  function toggle(id: string) {
    setChosen((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function respond() {
    if (!selected) return;
    setSaving(true);
    setMsg(null);
    try {
      await api(`/recommendations/${selected.id}/respond`, {
        method: 'PATCH',
        body: { adminNote: note.trim(), recommendedProviderIds: chosen },
      });
      setMsg({ type: 'ok', text: 'تم إرسال الترشيح للعميل بنجاح ✅' });
      setReqs((prev) =>
        prev.map((r) =>
          r.id === selected.id
            ? { ...r, status: 'RESPONDED', adminNote: note.trim(), recommendedProviderIds: chosen }
            : r,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, status: 'RESPONDED', adminNote: note.trim(), recommendedProviderIds: chosen } : prev,
      );
    } catch (e: any) {
      setMsg({ type: 'err', text: e?.message || 'حصل خطأ أثناء الإرسال' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell active="recommendations" title="طلبات الترشيح الذكية">
      <style>{RECO_CSS}</style>

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : loadErr ? (
        <div className="ad-error">{loadErr}</div>
      ) : (
        <div className="rq-layout">
          {/* قائمة الطلبات */}
          <div className="rq-list">
            <div className="rq-list-head">
              <span>الطلبات ({reqs.length})</span>
              <button className="ad-btn-mini" onClick={loadList}>تحديث</button>
            </div>
            {reqs.length === 0 ? (
              <div className="ad-empty">مفيش طلبات ترشيح لسه.</div>
            ) : (
              reqs.map((r) => {
                const b = statusBadge(r.status);
                const active = selected?.id === r.id;
                return (
                  <button
                    key={r.id}
                    className={`rq-item${active ? ' active' : ''}`}
                    onClick={() => openReq(r)}
                  >
                    <div className="rq-item-top">
                      <span className="rq-item-title">{r.title}</span>
                      <span className={`ad-badge ${b.cls}`}>{b.label}</span>
                    </div>
                    <div className="rq-item-meta">
                      <span><Icon name="briefcase" size={13} /> {r.field}</span>
                      {r.client && <span><Icon name="user" size={13} /> {r.client.fullName}</span>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* تفاصيل الطلب + المطابقة الذكية */}
          <div className="rq-detail">
            {!selected ? (
              <div className="ad-empty">اختار طلب من الشمال عشان تشوف تفاصيله والترشيحات الذكية.</div>
            ) : (
              <>
                <div className="rq-card">
                  <div className="rq-detail-head">
                    <h2>{selected.title}</h2>
                    <span className={`ad-badge ${statusBadge(selected.status).cls}`}>
                      {statusBadge(selected.status).label}
                    </span>
                  </div>
                  <p className="rq-desc">{selected.description}</p>
                  <ul className="rq-facts">
                    <li><span>المجال</span><b>{selected.field}</b></li>
                    {selected.client && <li><span>العميل</span><b>{selected.client.fullName}</b></li>}
                    {(selected.budgetMin || selected.budgetMax) && (
                      <li><span>الميزانية</span><b>{selected.budgetMin || '—'} — {selected.budgetMax || '—'} ج.م</b></li>
                    )}
                    {selected.durationDays ? <li><span>المدة</span><b>{selected.durationDays} يوم</b></li> : null}
                  </ul>
                </div>

                <div className="rq-card">
                  <div className="rq-match-head">
                    <div className="rq-match-title">
                      <Icon name="sparkles" size={17} />
                      <span>ترشيحات محايد الذكية</span>
                    </div>
                    <button
                      className="ad-btn-mini"
                      onClick={() => fetchMatches(selected.id)}
                      disabled={loadingMatches}
                    >
                      {loadingMatches ? 'جاري الحساب...' : 'إعادة الحساب'}
                    </button>
                  </div>

                  {loadingMatches ? (
                    <div className="ad-loading">المحرّك بيرتّب أنسب مقدمي الخدمة...</div>
                  ) : matches.length === 0 ? (
                    <div className="ad-empty">مفيش مقدمي خدمة مطابقين للمجال ده حاليًا.</div>
                  ) : (
                    <div className="rq-matches">
                      {matches.map((m, i) => {
                        const picked = chosen.includes(m.id);
                        return (
                          <div key={m.id} className={`rq-m${picked ? ' picked' : ''}`}>
                            <div className="rq-m-rank">#{i + 1}</div>
                            <div className="rq-m-body">
                              <div className="rq-m-top">
                                <span className="rq-m-name">
                                  {m.companyName || m.fullName}
                                  {m.isVerified && (
                                    <span className="rq-m-verified"><Icon name="badgeCheck" size={14} /></span>
                                  )}
                                </span>
                                <span className="rq-m-score" style={{ color: scoreTone(m.score) }}>
                                  {m.score}%
                                </span>
                              </div>
                              <div className="rq-m-sub">
                                {m.field}
                                {m.city ? ` • ${m.city}` : ''}
                                {m.rating > 0 ? ` • ${m.rating.toFixed(1)}★ (${m.reviewsCount})` : ''}
                              </div>
                              {m.reasons.length > 0 && (
                                <div className="rq-m-reasons">
                                  {m.reasons.map((rs, k) => (
                                    <span key={k} className="rq-chip">{rs}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              className={`rq-m-pick${picked ? ' on' : ''}`}
                              onClick={() => toggle(m.id)}
                            >
                              {picked ? 'مرشّح ✓' : 'رشّح'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="rq-card">
                  <label className="rq-label">ملاحظة للعميل (اختياري)</label>
                  <textarea
                    className="rq-area"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="اكتب سبب الترشيح أو أي توضيح للعميل..."
                  />
                  {msg && (
                    <div className={msg.type === 'ok' ? 'rq-ok' : 'ad-error'} style={{ marginTop: 12 }}>
                      {msg.text}
                    </div>
                  )}
                  <button className="ad-btn rq-send" onClick={respond} disabled={saving}>
                    {saving ? 'جاري الإرسال...' : `إرسال الترشيح (${chosen.length})`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const RECO_CSS = `
.rq-layout{display:grid;grid-template-columns:340px 1fr;gap:18px;align-items:start;}
.rq-list{display:flex;flex-direction:column;gap:10px;}
.rq-list-head{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:var(--ink);font-size:14px;padding:2px 2px 4px;}
.rq-item{text-align:right;background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 6px 16px rgba(24,70,61,.04);}
.rq-item:hover{border-color:var(--green-light);}
.rq-item.active{border-color:var(--green);box-shadow:0 8px 20px rgba(40,125,115,.14);}
.rq-item-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px;}
.rq-item-title{font-weight:800;color:var(--ink);font-size:14.5px;line-height:1.4;}
.rq-item-meta{display:flex;flex-wrap:wrap;gap:12px;color:var(--muted);font-size:12.5px;}
.rq-item-meta span{display:inline-flex;align-items:center;gap:5px;}
.rq-detail{display:flex;flex-direction:column;gap:16px;}
.rq-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 10px 26px rgba(24,70,61,.05);}
.rq-detail-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px;}
.rq-detail-head h2{font-size:19px;font-weight:800;color:var(--ink);margin:0;}
.rq-desc{color:var(--text);font-size:14px;line-height:1.9;margin:0 0 14px;white-space:pre-wrap;}
.rq-facts{list-style:none;display:flex;flex-wrap:wrap;gap:10px 24px;margin:0;padding:0;}
.rq-facts li{display:flex;flex-direction:column;gap:2px;font-size:13.5px;}
.rq-facts li span{color:var(--muted);font-size:12px;}
.rq-facts li b{color:var(--ink);}
.rq-match-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.rq-match-title{display:flex;align-items:center;gap:8px;font-weight:800;color:var(--green-dark);font-size:15px;}
.rq-matches{display:flex;flex-direction:column;gap:10px;}
.rq-m{display:flex;align-items:center;gap:12px;border:1px solid var(--line);border-radius:14px;padding:13px 14px;transition:all .15s;}
.rq-m.picked{border-color:var(--green);background:var(--mint);}
.rq-m-rank{font-weight:800;color:var(--muted);font-size:13px;width:28px;flex-shrink:0;}
.rq-m-body{flex:1;min-width:0;}
.rq-m-top{display:flex;justify-content:space-between;align-items:center;gap:8px;}
.rq-m-name{font-weight:800;color:var(--ink);font-size:14.5px;display:inline-flex;align-items:center;gap:6px;}
.rq-m-verified{color:var(--green);display:inline-flex;}
.rq-m-score{font-weight:800;font-size:15px;flex-shrink:0;}
.rq-m-sub{color:var(--muted);font-size:12.5px;margin-top:3px;}
.rq-m-reasons{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px;}
.rq-chip{background:var(--mint);color:var(--green-dark);border-radius:99px;padding:3px 10px;font-size:11.5px;font-weight:700;}
.rq-m-pick{flex-shrink:0;border:1px solid var(--green);background:#fff;color:var(--green-dark);border-radius:10px;padding:8px 14px;font-family:inherit;font-weight:800;font-size:12.5px;cursor:pointer;}
.rq-m-pick.on{background:var(--green);color:#fff;}
.rq-label{display:block;font-weight:800;color:var(--ink);font-size:14px;margin-bottom:8px;}
.rq-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;font-family:inherit;font-size:14px;color:var(--ink);min-height:90px;resize:vertical;line-height:1.8;box-sizing:border-box;outline:none;}
.rq-area:focus{border-color:var(--green-light);box-shadow:0 0 0 3px rgba(79,162,148,.15);}
.rq-ok{background:#e3f4ec;border:1px solid #b6e0c9;color:#1c7a4f;padding:10px 14px;border-radius:12px;font-size:13.5px;font-weight:700;}
.rq-send{width:100%;margin-top:14px;}
@media(max-width:900px){.rq-layout{grid-template-columns:1fr;}}
`;
