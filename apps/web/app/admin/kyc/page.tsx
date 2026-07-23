'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type KycUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isVerified: boolean;
};

type KycItem = {
  id: string;
  userId: string;
  idType: string;
  idNumber: string;
  fullNameOnId: string;
  status: string;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: KycUser | null;
};

type KycDetail = KycItem & {
  frontImage?: string | null;
  backImage?: string | null;
  selfie?: string | null;
};

const STATUS = [
  { key: 'PENDING', labelKey: 'aky.status.PENDING' },
  { key: 'APPROVED', labelKey: 'aky.status.APPROVED' },
  { key: 'REJECTED', labelKey: 'aky.status.REJECTED' },
  { key: '', labelKey: 'aky.status.ALL' },
];

const ID_TYPE_LABEL_KEYS: Record<string, string> = {
  NATIONAL_ID: 'aky.idType.NATIONAL_ID',
  PASSPORT: 'aky.idType.PASSPORT',
  COMMERCIAL_REGISTER: 'aky.idType.COMMERCIAL_REGISTER',
};

const BADGE: Record<string, string> = {
  PENDING: 'amber',
  APPROVED: 'ok',
  REJECTED: 'red',
};

const KA_CSS = `
.ka-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;z-index:50;padding:20px;}
.ka-modal{background:#fff;border-radius:18px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:22px;}
.ka-modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.ka-modal-head h3{font-size:17px;font-weight:800;color:var(--ink);}
.ka-x{border:none;background:var(--mint);width:32px;height:32px;border-radius:9px;cursor:pointer;font-size:14px;color:var(--green-dark);}
.ka-info{display:grid;grid-template-columns:1fr 1fr;gap:10px 16px;margin-bottom:16px;}
.ka-info div{display:flex;flex-direction:column;gap:3px;border-bottom:1px dashed var(--line);padding-bottom:8px;}
.ka-info span{font-size:12px;color:var(--muted);}
.ka-info b{font-size:14px;color:var(--ink);}
.ka-images{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;}
.ka-images a{display:flex;flex-direction:column;gap:5px;text-decoration:none;color:var(--muted);font-size:12px;text-align:center;}
.ka-images img{width:100%;height:120px;object-fit:cover;border-radius:10px;border:1px solid var(--line);}
.ka-prevnote{font-size:13px;color:#b4322b;background:#fdeceb;padding:9px 12px;border-radius:10px;margin-bottom:14px;}
.ka-note{width:100%;border:1px solid var(--line);border-radius:11px;padding:11px 13px;font-family:inherit;font-size:14px;min-height:80px;outline:none;margin-bottom:12px;resize:vertical;}
.ka-note:focus{border-color:var(--green);}
.ka-actions{display:flex;gap:10px;align-items:center;}
.ka-done{color:var(--muted);font-size:13.5px;}
.ka-err{color:#c0392b;font-size:13.5px;font-weight:700;margin-bottom:10px;}
@media(max-width:560px){.ka-info,.ka-images{grid-template-columns:1fr 1fr;}}
`;

export default function AdminKycPage() {
  const { tr, lang } = useI18n();
  const dateLocale = lang === 'en' ? 'en-US' : 'ar-EG';
  const [tab, setTab] = useState('PENDING');
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<KycDetail | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  function load() {
    setLoading(true);
    const q = tab ? `?status=${tab}` : '';
    api<KycItem[]>(`/kyc/admin/list${q}`)
      .then((d) => setItems(d))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function openDetail(id: string) {
    setErr('');
    setNote('');
    try {
      const d = await api<KycDetail>(`/kyc/admin/${id}`);
      setDetail(d);
    } catch (e: any) {
      setErr(e?.message || tr('aky.errDetail', 'فشل تحميل التفاصيل'));
    }
  }

  async function review(status: 'APPROVED' | 'REJECTED') {
    if (!detail) return;
    setBusy(true);
    setErr('');
    try {
      await api(`/kyc/admin/${detail.id}`, {
        method: 'PATCH',
        body: { status, reviewNote: note || undefined },
      });
      setDetail(null);
      load();
    } catch (e: any) {
      setErr(e?.message || tr('aky.errSave', 'فشل حفظ المراجعة'));
    } finally {
      setBusy(false);
    }
  }

  function fmt(iso?: string | null) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString(dateLocale);
    } catch {
      return '—';
    }
  }

  return (
    <AdminShell active="kyc" title={tr('aky.title', 'توثيق الهوية')}>
      <style>{KA_CSS}</style>

      <div className="ad-toolbar">
        <div className="ad-tabs">
          {STATUS.map((s) => (
            <button
              key={s.key || 'all'}
              className={tab === s.key ? 'active' : ''}
              onClick={() => setTab(s.key)}
            >
              {tr(s.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ad-loading">{tr('cls.loading', 'جاري التحميل…')}</div>
      ) : items.length === 0 ? (
        <div className="ad-empty">{tr('aky.empty', 'مفيش طلبات في القسم ده.')}</div>
      ) : (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th>{tr('aky.th.user', 'المستخدم')}</th>
                <th>{tr('aky.th.idType', 'نوع الهوية')}</th>
                <th>{tr('aky.th.nameOnId', 'الاسم في المستند')}</th>
                <th>{tr('co.th.status', 'الحالة')}</th>
                <th>{tr('aky.th.date', 'التاريخ')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <b>{it.user?.fullName || '—'}</b>
                    <span className="ad-mono" style={{ display: 'block' }}>
                      {it.user?.email || it.userId}
                    </span>
                  </td>
                  <td>{ID_TYPE_LABEL_KEYS[it.idType] ? tr(ID_TYPE_LABEL_KEYS[it.idType]) : it.idType}</td>
                  <td>{it.fullNameOnId}</td>
                  <td>
                    <span className={`ad-badge ${BADGE[it.status] || 'muted'}`}>
                      {STATUS.find((s) => s.key === it.status)?.labelKey
                        ? tr(STATUS.find((s) => s.key === it.status)!.labelKey)
                        : it.status}
                    </span>
                  </td>
                  <td className="ad-mono">{fmt(it.createdAt)}</td>
                  <td>
                    <button
                      className="ad-btn-mini"
                      onClick={() => openDetail(it.id)}
                    >
                      {tr('aky.review', 'مراجعة')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="ka-overlay" onClick={() => setDetail(null)}>
          <div className="ka-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ka-modal-head">
              <h3>{tr('aky.modalHead', 'طلب توثيق')} — {detail.user?.fullName || detail.userId}</h3>
              <button className="ka-x" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>

            <div className="ka-info">
              <div>
                <span>{tr('aky.th.user', 'المستخدم')}</span>
                <b>{detail.user?.fullName || '—'}</b>
              </div>
              <div>
                <span>{tr('aky.email', 'البريد')}</span>
                <b className="ad-mono">{detail.user?.email || '—'}</b>
              </div>
              <div>
                <span>{tr('aky.th.idType', 'نوع الهوية')}</span>
                <b>{ID_TYPE_LABEL_KEYS[detail.idType] ? tr(ID_TYPE_LABEL_KEYS[detail.idType]) : detail.idType}</b>
              </div>
              <div>
                <span>{tr('aky.idNumber', 'رقم الهوية')}</span>
                <b>{detail.idNumber}</b>
              </div>
              <div>
                <span>{tr('aky.th.nameOnId', 'الاسم في المستند')}</span>
                <b>{detail.fullNameOnId}</b>
              </div>
              <div>
                <span>{tr('co.th.status', 'الحالة')}</span>
                <b>
                  <span
                    className={`ad-badge ${BADGE[detail.status] || 'muted'}`}
                  >
                    {STATUS.find((s) => s.key === detail.status)?.labelKey
                      ? tr(STATUS.find((s) => s.key === detail.status)!.labelKey)
                      : detail.status}
                  </span>
                </b>
              </div>
            </div>

            <div className="ka-images">
              {detail.frontImage && (
                <a href={detail.frontImage} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.frontImage} alt={tr('aky.front', 'وجه المستند')} />
                  <span>{tr('aky.front', 'وجه المستند')}</span>
                </a>
              )}
              {detail.backImage && (
                <a href={detail.backImage} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.backImage} alt={tr('aky.back', 'ظهر المستند')} />
                  <span>{tr('aky.back', 'ظهر المستند')}</span>
                </a>
              )}
              {detail.selfie && (
                <a href={detail.selfie} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={detail.selfie} alt={tr('aky.selfie', 'صورة شخصية')} />
                  <span>{tr('aky.selfie', 'صورة شخصية')}</span>
                </a>
              )}
            </div>

            {detail.reviewNote && (
              <p className="ka-prevnote">{tr('aky.prevNote', 'ملاحظة سابقة:')} {detail.reviewNote}</p>
            )}

            {detail.status === 'PENDING' ? (
              <>
                <textarea
                  className="ka-note"
                  placeholder={tr('aky.notePh', 'ملاحظة (اختياري) — تظهر للمستخدم لو رفضت')}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                {err && <p className="ka-err">{err}</p>}
                <div className="ka-actions">
                  <button
                    className="ad-btn"
                    disabled={busy}
                    onClick={() => review('APPROVED')}
                  >
                    {tr('aky.approve', 'قبول وتوثيق')}
                  </button>
                  <button
                    className="ad-btn-mini danger"
                    disabled={busy}
                    onClick={() => review('REJECTED')}
                  >
                    {tr('aad.reject', 'رفض')}
                  </button>
                </div>
              </>
            ) : (
              <p className="ka-done">{tr('aky.alreadyReviewed', 'تمت مراجعة الطلب بالفعل.')}</p>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
