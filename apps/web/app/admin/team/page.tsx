'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/AdminShell';
import { api } from '@/lib/api';

type Admin = {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  adminScopes: string | null;
  createdAt: string;
};
type Section = { key: string; label: string };
type Me = { id: string; isSuperAdmin?: boolean; adminScopes?: string | null };
type Draft = { full: boolean; scopes: string[]; isSuperAdmin: boolean };

function parseScopes(s: string | null): string[] | null {
  if (s == null) return null;
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [savingId, setSavingId] = useState('');
  const [msg, setMsg] = useState('');

  function hydrate(list: Admin[]) {
    const d: Record<string, Draft> = {};
    for (const a of list) {
      const sc = parseScopes(a.adminScopes);
      d[a.id] = {
        full: a.isSuperAdmin || sc == null,
        scopes: sc == null ? [] : sc,
        isSuperAdmin: a.isSuperAdmin,
      };
    }
    setDrafts(d);
  }

  function load() {
    setLoading(true);
    setErr('');
    Promise.all([
      api<Admin[]>('/admin-team'),
      api<Section[]>('/admin-team/sections'),
      api<Me>('/users/me'),
    ])
      .then(([a, s, m]) => {
        setAdmins(a || []);
        setSections(s || []);
        setMe(m || null);
        hydrate(a || []);
      })
      .catch((e) => setErr(e?.message || 'تعذّر التحميل'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  const canManage = !!me && (me.isSuperAdmin || me.adminScopes == null);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function toggleScope(id: string, key: string) {
    const cur = drafts[id];
    if (!cur) return;
    const has = cur.scopes.includes(key);
    setDraft(id, {
      scopes: has ? cur.scopes.filter((k) => k !== key) : [...cur.scopes, key],
    });
  }

  async function save(a: Admin) {
    const d = drafts[a.id];
    if (!d) return;
    setSavingId(a.id);
    setMsg('');
    try {
      const body = {
        isSuperAdmin: d.isSuperAdmin,
        scopes: d.isSuperAdmin || d.full ? null : d.scopes,
      };
      const updated = await api<Admin[]>(`/admin-team/${a.id}`, {
        method: 'PATCH',
        body,
      });
      setAdmins(updated || []);
      hydrate(updated || []);
      setMsg('اتحفظت التغييرات ✅');
    } catch (e: any) {
      setMsg(e?.message || 'حصل خطأ أثناء الحفظ');
    } finally {
      setSavingId('');
    }
  }

  return (
    <AdminShell active="team" title="صلاحيات الفريق">
      <style>{TEAM_CSS}</style>

      {loading ? (
        <div className="ad-loading">جاري التحميل...</div>
      ) : err ? (
        <div className="ad-error">{err}</div>
      ) : (
        <>
          {!canManage && (
            <div className="tm-note">
              انت أدمن محدود الصلاحية — تقدر تشوف الفريق بس، والتعديل متاح للسوبر أدمن.
            </div>
          )}
          {msg && <div className="tm-msg">{msg}</div>}

          <div className="tm-grid">
            {admins.map((a) => {
              const d = drafts[a.id];
              if (!d) return null;
              const locked = !canManage;
              return (
                <div key={a.id} className="tm-card">
                  <div className="tm-head">
                    <div>
                      <div className="tm-name">{a.fullName}</div>
                      <div className="tm-email">{a.email}</div>
                    </div>
                    {d.isSuperAdmin ? (
                      <span className="ad-badge ok">سوبر أدمن</span>
                    ) : d.full ? (
                      <span className="ad-badge blue">وصول كامل</span>
                    ) : (
                      <span className="ad-badge amber">محدود</span>
                    )}
                  </div>

                  <label className="tm-switch">
                    <input
                      type="checkbox"
                      checked={d.isSuperAdmin}
                      disabled={locked}
                      onChange={(e) => setDraft(a.id, { isSuperAdmin: e.target.checked })}
                    />
                    <span>سوبر أدمن (وصول كامل + إدارة الفريق)</span>
                  </label>

                  {!d.isSuperAdmin && (
                    <label className="tm-switch">
                      <input
                        type="checkbox"
                        checked={d.full}
                        disabled={locked}
                        onChange={(e) => setDraft(a.id, { full: e.target.checked })}
                      />
                      <span>وصول كامل لكل الأقسام</span>
                    </label>
                  )}

                  {!d.isSuperAdmin && !d.full && (
                    <div className="tm-sections">
                      {sections.map((s) => (
                        <label key={s.key} className="tm-sec">
                          <input
                            type="checkbox"
                            checked={d.scopes.includes(s.key)}
                            disabled={locked}
                            onChange={() => toggleScope(a.id, s.key)}
                          />
                          <span>{s.label}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {canManage && (
                    <button
                      className="ad-btn tm-save"
                      onClick={() => save(a)}
                      disabled={savingId === a.id}
                    >
                      {savingId === a.id ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </AdminShell>
  );
}

const TEAM_CSS = `
.tm-note{background:#fdf3dd;border:1px solid #f0e0b8;color:#96690f;padding:12px 16px;border-radius:12px;font-size:13.5px;margin-bottom:16px;line-height:1.7;}
.tm-msg{background:#e3f4ec;border:1px solid #b6e0c9;color:#1c7a4f;padding:11px 16px;border-radius:12px;font-size:13.5px;font-weight:700;margin-bottom:16px;}
.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px;}
.tm-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px;box-shadow:0 10px 26px rgba(24,70,61,.05);display:flex;flex-direction:column;gap:14px;}
.tm-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;}
.tm-name{font-weight:800;color:var(--ink);font-size:15px;}
.tm-email{color:var(--muted);font-size:12.5px;direction:ltr;text-align:right;margin-top:2px;}
.tm-switch{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--ink);font-weight:600;cursor:pointer;}
.tm-switch input{width:17px;height:17px;accent-color:var(--green);}
.tm-sections{display:grid;grid-template-columns:1fr 1fr;gap:9px 12px;border-top:1px dashed var(--line);padding-top:13px;}
.tm-sec{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text);cursor:pointer;}
.tm-sec input{width:16px;height:16px;accent-color:var(--green);}
.tm-save{width:100%;margin-top:4px;}
@media(max-width:520px){.tm-sections{grid-template-columns:1fr;}}
`;
