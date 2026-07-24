'use client';

import { useI18n } from '@/lib/i18n';

const PS_CSS = `
.ps-box{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:48px 20px;gap:12px;}
.ps-spinner{width:38px;height:38px;border-radius:50%;border:3px solid var(--line);border-top-color:var(--green);animation:psSpin .8s linear infinite;}
@keyframes psSpin{to{transform:rotate(360deg);}}
.ps-emoji{width:56px;height:56px;border-radius:16px;background:var(--mint);display:flex;align-items:center;justify-content:center;font-size:26px;}
.ps-title{font-weight:800;font-size:16px;color:var(--ink);margin:0;}
.ps-hint{color:var(--muted);font-size:13.5px;line-height:1.7;margin:0;max-width:360px;}
.ps-retry{margin-top:6px;padding:9px 20px;border-radius:11px;border:none;background:var(--green);color:#fff;font-weight:800;font-size:13.5px;cursor:pointer;font-family:inherit;}
.ps-retry:hover{background:var(--green-dark);}
.ps-err{color:#b91c1c;}
.sk-line{height:14px;border-radius:8px;background:linear-gradient(90deg,#eef3f1 25%,#f7faf8 37%,#eef3f1 63%);background-size:400% 100%;animation:skGlow 1.3s ease infinite;margin-bottom:10px;}
@keyframes skGlow{0%{background-position:100% 50%;}100%{background-position:0 50%;}}
`;

export function LoadingState({ label }: { label?: string }) {
  const { tr } = useI18n();
  return (
    <div className="ps-box">
      <style>{PS_CSS}</style>
      <div className="ps-spinner" />
      <p className="ps-hint">{label ?? tr('cls.loading', 'جاري التحميل…')}</p>
    </div>
  );
}

export function EmptyState({
  emoji = '📭',
  title,
  hint,
}: {
  emoji?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="ps-box">
      <style>{PS_CSS}</style>
      <div className="ps-emoji">{emoji}</div>
      <p className="ps-title">{title}</p>
      {hint && <p className="ps-hint">{hint}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const { tr } = useI18n();
  return (
    <div className="ps-box">
      <style>{PS_CSS}</style>
      <div className="ps-emoji">⚠️</div>
      <p className="ps-title ps-err">{tr('common.error', 'حصل خطأ')}</p>
      <p className="ps-hint">{message ?? tr('ps.errMsg', 'حصل خطأ، حاول تاني.')}</p>
      {onRetry && (
        <button className="ps-retry" onClick={onRetry}>
          {tr('ps.retry', 'إعادة المحاولة')}
        </button>
      )}
    </div>
  );
}

export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div style={{ padding: '8px 0' }}>
      <style>{PS_CSS}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          className="sk-line"
          key={i}
          style={{ width: `${100 - (i % 3) * 15}%` }}
        />
      ))}
    </div>
  );
}
