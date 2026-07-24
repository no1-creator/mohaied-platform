'use client';

import { useI18n } from '@/lib/i18n';

const CF_CSS = `
.cf-overlay{position:fixed;inset:0;background:rgba(15,30,26,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:200;animation:cfFade .15s ease;}
@keyframes cfFade{from{opacity:0;}to{opacity:1;}}
.cf-card{background:#fff;border-radius:18px;max-width:400px;width:100%;padding:26px 24px;box-shadow:0 20px 60px rgba(0,0,0,.25);animation:cfUp .2s ease;text-align:center;}
@keyframes cfUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.cf-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 12px;background:var(--mint);}
.cf-icon.danger{background:#fdeceb;}
.cf-title{font-weight:800;font-size:17px;color:var(--ink);margin:0 0 8px;}
.cf-msg{color:var(--muted);font-size:14px;line-height:1.7;margin:0 0 20px;}
.cf-actions{display:flex;gap:10px;}
.cf-btn{flex:1;padding:11px 16px;border-radius:11px;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;border:none;transition:all .15s;}
.cf-btn:disabled{opacity:.6;cursor:default;}
.cf-cancel{background:#fff;border:1px solid var(--line);color:var(--ink);}
.cf-cancel:hover{background:#f5f7f6;}
.cf-ok{background:var(--green);color:#fff;}
.cf-ok:hover{background:var(--green-dark);}
.cf-ok.danger{background:#b4322b;}
.cf-ok.danger:hover{background:#992a24;}
`;

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { tr } = useI18n();
  if (!open) return null;

  return (
    <div className="cf-overlay" onClick={loading ? undefined : onCancel}>
      <style>{CF_CSS}</style>
      <div className="cf-card" onClick={(e) => e.stopPropagation()}>
        <div className={`cf-icon ${danger ? 'danger' : ''}`}>{danger ? '⚠️' : '❓'}</div>
        <h3 className="cf-title">{title ?? tr('cf.title', 'تأكيد')}</h3>
        {message && <p className="cf-msg">{message}</p>}
        <div className="cf-actions">
          <button className="cf-btn cf-cancel" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? tr('common.cancel', 'إلغاء')}
          </button>
          <button
            className={`cf-btn cf-ok ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading
              ? tr('cf.processing', 'جاري التنفيذ...')
              : (confirmLabel ?? tr('cf.confirm', 'تأكيد'))}
          </button>
        </div>
      </div>
    </div>
  );
}
