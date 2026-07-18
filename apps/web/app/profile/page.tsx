'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getToken } from '@/lib/api';
import TopBar from '@/components/TopBar';
import BackBar from '@/components/BackBar';

type Me = {
  id: string;
  email: string;
  phone?: string | null;
  fullName: string;
  role: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  createdAt: string;
  providerProfile?: Record<string, unknown> | null;
  supervisorProfile?: Record<string, unknown> | null;
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: 'عميل',
  PROVIDER: 'مقدم خدمة',
  SUPERVISOR: 'مشرف',
  ADMIN: 'أدمن',
};

const PR_CSS = `
.pr-wrap { max-width:720px; margin:0 auto; padding:24px 20px 60px; display:flex; flex-direction:column; gap:18px; }
.pr-load { max-width:720px; margin:0 auto; padding:60px 20px; text-align:center; color:var(--muted); }
.pr-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:22px 24px; }
.pr-head { display:flex; align-items:center; gap:16px; }
.pr-avatar { width:72px; height:72px; border-radius:50%; background:linear-gradient(140deg,var(--green-light),var(--green-dark)); color:#fff; font-weight:800; font-size:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.pr-avatar img { width:100%; height:100%; object-fit:cover; }
.pr-id { flex:1; min-width:0; }
.pr-name-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.pr-name { font-size:22px; font-weight:900; color:var(--ink); }
.pr-verified { background:var(--mint); color:var(--green-dark); font-size:12px; font-weight:800; padding:3px 10px; border-radius:20px; }
.pr-role { display:inline-block; margin-top:6px; font-size:13px; color:var(--muted); font-weight:700; }
.pr-edit { border:1px solid var(--line); background:#fff; color:var(--ink); font-weight:700; font-size:13.5px; padding:8px 18px; border-radius:10px; cursor:pointer; font-family:inherit; transition:all .15s; }
.pr-edit:hover { background:var(--mint); border-color:var(--green-light); }
.pr-msg { margin-top:16px; background:var(--mint); color:var(--green-dark); font-weight:700; font-size:13.5px; padding:10px 14px; border-radius:10px; }
.pr-info { margin-top:20px; display:flex; flex-direction:column; gap:2px; }
.pr-row { display:flex; justify-content:space-between; gap:16px; padding:12px 0; border-bottom:1px solid var(--line); }
.pr-row:last-child { border-bottom:none; }
.pr-label { color:var(--muted); font-size:13.5px; font-weight:700; flex-shrink:0; }
.pr-val { color:var(--ink); font-size:13.5px; font-weight:600; text-align:end; word-break:break-word; }
.pr-section { font-size:16px; font-weight:900; color:var(--ink); margin-bottom:4px; }
.pr-form { margin-top:20px; display:flex; flex-direction:column; gap:14px; }
.pr-field { display:flex; flex-direction:column; gap:6px; }
.pr-field > span { font-size:13px; font-weight:700; color:var(--ink); }
.pr-field input { border:1px solid var(--line); border-radius:10px; padding:11px 13px; font-size:14px; font-family:inherit; background:var(--background); color:var(--ink); }
.pr-field input:focus { outline:none; border-color:var(--green-light); background:#fff; }
.pr-actions { display:flex; gap:10px; margin-top:4px; }
.pr-save { background:var(--green); color:#fff; border:none; font-weight:800; font-size:14px; padding:11px 26px; border-radius:10px; cursor:pointer; font-family:inherit; }
.pr-save:disabled { opacity:.6; cursor:default; }
.pr-cancel { background:#fff; color:var(--ink); border:1px solid var(--line); font-weight:700; font-size:14px; padding:11px 22px; border-radius:10px; cursor:pointer; font-family:inherit; }
@media (max-width:600px){
  .pr-wrap { padding:16px 14px 50px; }
  .pr-card { padding:18px 16px; }
  .pr-head { gap:12px; }
  .pr-avatar { width:60px; height:60px; font-size:26px; }
  .pr-name { font-size:19px; }
  .pr-row { flex-direction:column; gap:3px; }
  .pr-val { text-align:start; }
  .pr-field input { font-size:16px; }
  .pr-actions { flex-direction:column; }
  .pr-save, .pr-cancel { width:100%; }
}
`;

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '', avatarUrl: '' });

  function load() {
    api<Me>('/users/me')
      .then((data) => {
        setMe(data);
        setForm({
          fullName: data.fullName || '',
          phone: data.phone || '',
          avatarUrl: data.avatarUrl || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  async function save() {
    setSaving(true);
    setMsg('');
    try {
      const updated = await api<Me>('/users/me', { method: 'PATCH', body: form });
      setMe(updated);
      setEditing(false);
      setMsg('تم حفظ التعديلات ✅');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: any) {
      setMsg(e?.message || 'حصل خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setEditing(false);
    setForm({
      fullName: me?.fullName || '',
      phone: me?.phone || '',
      avatarUrl: me?.avatarUrl || '',
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <TopBar />
        <div className="pr-load">جاري التحميل...</div>
      </main>
    );
  }

  const pp = me?.providerProfile as Record<string, unknown> | null;
  const sp = me?.supervisorProfile as Record<string, unknown> | null;

  const providerRows: [string, unknown][] = pp
    ? [
        ['المجال', pp.field],
        ['اسم الشركة', pp.companyName],
        ['نبذة', pp.bio],
        ['سنوات الخبرة', pp.yearsExp],
        ['حجم الفريق', pp.teamSize],
        ['المدينة', pp.city],
        ['المهارات', pp.skills],
        ['الموقع الإلكتروني', pp.website],
        ['معرض الأعمال', pp.portfolioUrl],
        ['التقييم', pp.rating],
      ]
    : [];

  const supervisorRows: [string, unknown][] = sp
    ? [
        ['المسمى', sp.title],
        ['المجال', sp.field],
        ['سنوات الخبرة', sp.yearsExp],
        ['التخصصات', sp.specialties],
        ['المؤهلات', sp.education],
        ['اللغات', sp.languages],
        ['المدينة', sp.city],
        ['التقييم', sp.rating],
      ]
    : [];

  const clean = (rows: [string, unknown][]) =>
    rows.filter((r) => r[1] !== null && r[1] !== undefined && r[1] !== '');

  return (
    <main className="min-h-screen">
      <style>{PR_CSS}</style>
      <TopBar />
      <BackBar />
      <div className="pr-wrap">
        <div className="pr-card">
          <div className="pr-head">
            <div className="pr-avatar">
              {me?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatarUrl} alt="" />
              ) : (
                (me?.fullName || '؟').charAt(0)
              )}
            </div>
            <div className="pr-id">
              <div className="pr-name-row">
                <h1 className="pr-name">{me?.fullName}</h1>
                {me?.isVerified && <span className="pr-verified">موثّق ✓</span>}
              </div>
              <span className="pr-role">
                {ROLE_LABELS[me?.role || ''] || me?.role}
              </span>
            </div>
            {!editing && (
              <button className="pr-edit" onClick={() => setEditing(true)}>
                تعديل
              </button>
            )}
          </div>

          {msg && <div className="pr-msg">{msg}</div>}

          {!editing ? (
            <div className="pr-info">
              <div className="pr-row">
                <span className="pr-label">البريد الإلكتروني</span>
                <span className="pr-val">{me?.email}</span>
              </div>
              <div className="pr-row">
                <span className="pr-label">رقم الهاتف</span>
                <span className="pr-val">{me?.phone || '—'}</span>
              </div>
              <div className="pr-row">
                <span className="pr-label">تاريخ الانضمام</span>
                <span className="pr-val">
                  {me ? new Date(me.createdAt).toLocaleDateString('ar-EG') : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="pr-form">
              <label className="pr-field">
                <span>الاسم الكامل</span>
                <input
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </label>
              <label className="pr-field">
                <span>رقم الهاتف</span>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="مثال: 01xxxxxxxxx"
                />
              </label>
              <label className="pr-field">
                <span>رابط الصورة الشخصية</span>
                <input
                  value={form.avatarUrl}
                  onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              <div className="pr-actions">
                <button className="pr-save" onClick={save} disabled={saving}>
                  {saving ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button className="pr-cancel" onClick={cancel}>
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {pp && (
          <div className="pr-card">
            <h2 className="pr-section">بيانات مقدم الخدمة</h2>
            <div className="pr-info">
              {clean(providerRows).map((r) => (
                <div className="pr-row" key={r[0]}>
                  <span className="pr-label">{r[0]}</span>
                  <span className="pr-val">{String(r[1])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {sp && (
          <div className="pr-card">
            <h2 className="pr-section">بيانات المشرف</h2>
            <div className="pr-info">
              {clean(supervisorRows).map((r) => (
                <div className="pr-row" key={r[0]}>
                  <span className="pr-label">{r[0]}</span>
                  <span className="pr-val">{String(r[1])}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
