'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Sender = {
  id: string;
  fullName: string;
  avatarUrl?: string | null;
  role?: string;
};

type Message = {
  id: string;
  content: string;
  senderId?: string | null;
  isSystem: boolean;
  createdAt: string;
  sender?: Sender | null;
};

const PC_CSS = `
.pc-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px;margin-top:24px;}
.pc-h{font-size:16px;font-weight:800;color:var(--ink);margin:0;}
.pc-hint{font-size:12px;color:var(--muted);margin:6px 0 12px;}
.pc-list{display:flex;flex-direction:column;gap:10px;max-height:420px;overflow-y:auto;padding:6px 2px;}
.pc-empty{color:var(--muted);font-size:13.5px;text-align:center;margin:24px 0;}
.pc-sys{align-self:center;background:var(--mint);color:var(--muted);font-size:12px;padding:5px 12px;border-radius:20px;}
.pc-row{display:flex;}
.pc-mine{justify-content:flex-start;}
.pc-other{justify-content:flex-end;}
.pc-bubble{display:flex;flex-direction:column;max-width:78%;padding:9px 13px;border-radius:14px;}
.pc-mine .pc-bubble{background:var(--green);color:#fff;border-bottom-right-radius:4px;}
.pc-other .pc-bubble{background:var(--mint);color:var(--ink);border-bottom-left-radius:4px;}
.pc-name{font-size:11px;font-weight:800;margin-bottom:3px;opacity:.85;}
.pc-text{font-size:13.5px;line-height:1.6;white-space:pre-wrap;word-break:break-word;}
.pc-time{font-size:10px;opacity:.65;margin-top:4px;align-self:flex-start;}
.pc-err{color:#c0392b;font-size:13px;font-weight:700;margin:10px 0 0;}
.pc-form{display:flex;gap:8px;margin-top:14px;}
.pc-input{flex:1;border:1px solid var(--line);border-radius:12px;padding:10px 14px;font-size:13.5px;font-family:inherit;outline:none;}
.pc-input:focus{border-color:var(--green);}
.pc-send{padding:10px 18px;border:none;border-radius:12px;background:var(--green);color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;font-family:inherit;}
.pc-send:disabled{opacity:.5;cursor:default;}
`;

export default function ProjectChat({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [myId, setMyId] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  function scrollToBottom() {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  function load(scroll = false) {
    api<Message[]>(`/messages/project/${projectId}`)
      .then((d) => {
        setMessages(d);
        if (scroll) setTimeout(scrollToBottom, 50);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!projectId) return;
    api<{ id: string }>('/users/me')
      .then((u) => setMyId(u.id))
      .catch(() => {});
    load(true);
    const t = setInterval(() => load(false), 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSending(true);
    setErr('');
    try {
      const msg = await api<Message>('/messages', {
        method: 'POST',
        body: { projectId, content },
      });
      setMessages((prev) => [...prev, msg]);
      setText('');
      setTimeout(scrollToBottom, 50);
    } catch (e: any) {
      setErr(e?.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  }

  function fmtTime(iso: string) {
    try {
      return new Date(iso).toLocaleString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
      });
    } catch {
      return '';
    }
  }

  return (
    <div className="pc-card">
      <style>{PC_CSS}</style>
      <h2 className="pc-h">محادثة المشروع</h2>
      <p className="pc-hint">المحادثة بين أطراف المشروع بس (العميل ومقدّم الخدمة).</p>

      <div className="pc-list" ref={listRef}>
        {loading ? (
          <p className="pc-empty">جاري التحميل…</p>
        ) : messages.length === 0 ? (
          <p className="pc-empty">لسه مفيش رسائل — ابدأ المحادثة.</p>
        ) : (
          messages.map((m) => {
            if (m.isSystem) {
              return (
                <div className="pc-sys" key={m.id}>
                  {m.content}
                </div>
              );
            }
            const mine = m.senderId === myId;
            return (
              <div
                className={`pc-row ${mine ? 'pc-mine' : 'pc-other'}`}
                key={m.id}
              >
                <div className="pc-bubble">
                  {!mine && (
                    <span className="pc-name">
                      {m.sender?.fullName || 'مستخدم'}
                    </span>
                  )}
                  <span className="pc-text">{m.content}</span>
                  <span className="pc-time">{fmtTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {err && <p className="pc-err">{err}</p>}

      <form className="pc-form" onSubmit={send}>
        <input
          className="pc-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="اكتب رسالتك…"
          maxLength={4000}
        />
        <button
          className="pc-send"
          type="submit"
          disabled={sending || !text.trim()}
        >
          {sending ? '…' : 'إرسال'}
        </button>
      </form>
    </div>
  );
}
