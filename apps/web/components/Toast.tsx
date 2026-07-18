'use client';

import { useEffect, useState } from 'react';

export type ToastKind = 'success' | 'error' | 'info';
export type ToastItem = { id: number; kind: ToastKind; message: string };

type Listener = (items: ToastItem[]) => void;

let items: ToastItem[] = [];
let listeners: Listener[] = [];
let counter = 0;

function emit() {
  for (const l of listeners) l(items);
}

function dismiss(id: number) {
  items = items.filter((t) => t.id !== id);
  emit();
}

function push(kind: ToastKind, message: string, duration: number) {
  const id = ++counter;
  items = [...items, { id, kind, message }];
  emit();
  if (typeof window !== 'undefined') {
    window.setTimeout(() => dismiss(id), duration);
  }
}

// واجهة عامة يستخدمها أي مكوّن: toast.success('...') / toast.error('...')
export const toast = {
  success: (m: string) => push('success', m, 3500),
  error: (m: string) => push('error', m, 5000),
  info: (m: string) => push('info', m, 3500),
};

const TOAST_CSS = `
.tst-wrap{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:9999;display:flex;flex-direction:column;gap:10px;width:min(92vw,420px);pointer-events:none;}
.tst{display:flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:12px 14px;box-shadow:0 10px 30px rgba(24,70,61,.14);font-size:14px;font-weight:600;color:var(--ink);pointer-events:auto;animation:tstIn .22s ease;}
.tst-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex-shrink:0;line-height:1;}
.tst-success .tst-icon{background:var(--green);}
.tst-error .tst-icon{background:#dc2626;}
.tst-info .tst-icon{background:#2563eb;}
.tst-msg{flex:1;line-height:1.6;}
.tst-x{background:none;border:none;cursor:pointer;color:var(--muted);font-size:19px;line-height:1;padding:2px 4px;flex-shrink:0;}
.tst-x:hover{color:var(--ink);}
@keyframes tstIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
`;

const SYMBOL: Record<ToastKind, string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = (next) => setList([...next]);
    listeners.push(l);
    l(items);
    return () => {
      listeners = listeners.filter((x) => x !== l);
    };
  }, []);

  if (list.length === 0) return null;

  return (
    <div className="tst-wrap">
      <style>{TOAST_CSS}</style>
      {list.map((t) => (
        <div className={`tst tst-${t.kind}`} key={t.id}>
          <span className="tst-icon">{SYMBOL[t.kind]}</span>
          <span className="tst-msg">{t.message}</span>
          <button className="tst-x" onClick={() => dismiss(t.id)} aria-label="إغلاق">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
