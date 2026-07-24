'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { api, getToken } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Notif = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  linkUrl?: string | null;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  OFFER: '📄',
  PROJECT: '📁',
  COMPLAINT: '⚠️',
  MILESTONE: '🎯',
  SUPERVISOR: '🛡️',
  SUBSCRIPTION: '💳',
  AD: '📢',
  SYSTEM: '🔔',
  GENERAL: '🔔',
};

const NB_CSS = `
.nb { position:relative; display:flex; align-items:center; }
.nb-btn { position:relative; width:40px; height:40px; border-radius:10px; border:1px solid var(--line); background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--ink); transition:all .15s; }
.nb-btn:hover { background:var(--mint); border-color:var(--green-light); }
.nb-badge { position:absolute; top:-6px; inset-inline-end:-6px; min-width:18px; height:18px; padding:0 5px; border-radius:9px; background:#e11d48; color:#fff; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 2px #fff; }
.nb-panel { position:absolute; top:52px; inset-inline-end:0; width:340px; max-width:calc(100vw - 32px); background:#fff; border:1px solid var(--line); border-radius:14px; box-shadow:0 12px 40px rgba(0,0,0,.14); overflow:hidden; z-index:60; animation:nbFade .15s ease; }
@keyframes nbFade { from{opacity:0; transform:translateY(-6px);} to{opacity:1; transform:translateY(0);} }
.nb-head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; border-bottom:1px solid var(--line); }
.nb-title { font-weight:800; font-size:14px; color:var(--ink); }
.nb-readall { border:none; background:none; color:var(--green-dark); font-weight:700; font-size:12.5px; cursor:pointer; font-family:inherit; }
.nb-readall:hover { text-decoration:underline; }
.nb-list { max-height:380px; overflow-y:auto; }
.nb-item { display:flex; gap:10px; padding:12px 14px; border-bottom:1px solid var(--line); text-decoration:none; color:inherit; cursor:pointer; transition:background .12s; }
.nb-item:last-child { border-bottom:none; }
.nb-item:hover { background:var(--mint); }
.nb-item.unread { background:#f2fbf8; }
.nb-ico { font-size:18px; flex-shrink:0; line-height:1.4; }
.nb-body { flex:1; min-width:0; }
.nb-h { font-weight:700; font-size:13.5px; color:var(--ink); margin-bottom:2px; }
.nb-t { font-size:12.5px; color:var(--muted); line-height:1.5; }
.nb-time { font-size:11px; color:var(--muted); margin-top:3px; }
.nb-dot { width:8px; height:8px; border-radius:50%; background:var(--green); flex-shrink:0; margin-top:6px; }
.nb-empty { padding:36px 16px; text-align:center; color:var(--muted); font-size:13px; }
`;

function timeAgo(iso: string, tr: (k: string, f?: string) => string, lang: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const fmt = (n: number, unitKey: string) => {
    const unit = tr(unitKey);
    return lang === 'en' ? `${n}${unit} ago` : `منذ ${n} ${unit}`;
  };
  if (s < 60) return tr('nb.now', 'الآن');
  const m = Math.floor(s / 60);
  if (m < 60) return fmt(m, 'nb.unitMin');
  const h = Math.floor(m / 60);
  if (h < 24) return fmt(h, 'nb.unitHour');
  const d = Math.floor(h / 24);
  if (d < 30) return fmt(d, 'nb.unitDay');
  return fmt(Math.floor(d / 30), 'nb.unitMonth');
}

export default function NotificationBell() {
  const { tr, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function loadCount() {
    try {
      const res = await api<{ count: number }>('/notifications/unread-count');
      setCount(res.count || 0);
    } catch {
      /* تجاهل */
    }
  }

  async function loadList() {
    setLoading(true);
    try {
      const res = await api<Notif[]>('/notifications');
      setItems(res || []);
    } catch {
      /* تجاهل */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getToken()) return;
    loadCount();
    const t = setInterval(loadCount, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  }

  async function markAll() {
    try {
      await api('/notifications/read-all', { method: 'PATCH' });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    } catch {
      /* تجاهل */
    }
  }

  async function openItem(n: Notif) {
    if (!n.isRead) {
      try {
        await api(`/notifications/${n.id}/read`, { method: 'PATCH' });
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
        );
        setCount((c) => Math.max(0, c - 1));
      } catch {
        /* تجاهل */
      }
    }
    setOpen(false);
  }

  const hasUnread = items.some((n) => !n.isRead);

  return (
    <div className="nb" ref={ref}>
      <style>{NB_CSS}</style>
      <button className="nb-btn" onClick={toggle} aria-label={tr('nb.title', 'الإشعارات')}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && (
          <span className="nb-badge">{count > 99 ? '99+' : count}</span>
        )}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-head">
            <span className="nb-title">{tr('nb.title', 'الإشعارات')}</span>
            {hasUnread && (
              <button className="nb-readall" onClick={markAll}>
                {tr('nb.readAll', 'تحديد الكل كمقروء')}
              </button>
            )}
          </div>
          <div className="nb-list">
            {loading && <div className="nb-empty">{tr('cls.loading', 'جاري التحميل...')}</div>}
            {!loading && items.length === 0 && (
              <div className="nb-empty">{tr('nb.empty', 'مفيش إشعارات لسه 🔔')}</div>
            )}
            {!loading &&
              items.map((n) =>
                n.linkUrl ? (
                  <Link
                    key={n.id}
                    href={n.linkUrl}
                    className={`nb-item ${n.isRead ? '' : 'unread'}`}
                    onClick={() => openItem(n)}
                  >
                    <span className="nb-ico">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="nb-body">
                      <div className="nb-h">{n.title}</div>
                      {n.body && <div className="nb-t">{n.body}</div>}
                      <div className="nb-time">{timeAgo(n.createdAt, tr, lang)}</div>
                    </div>
                    {!n.isRead && <span className="nb-dot" />}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    className={`nb-item ${n.isRead ? '' : 'unread'}`}
                    onClick={() => openItem(n)}
                  >
                    <span className="nb-ico">{TYPE_ICON[n.type] || '🔔'}</span>
                    <div className="nb-body">
                      <div className="nb-h">{n.title}</div>
                      {n.body && <div className="nb-t">{n.body}</div>}
                      <div className="nb-time">{timeAgo(n.createdAt, tr, lang)}</div>
                    </div>
                    {!n.isRead && <span className="nb-dot" />}
                  </div>
                ),
              )}
          </div>
        </div>
      )}
    </div>
  );
}
