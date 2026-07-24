'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';

const SS_CSS = `
.ss-box{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:56px 24px;gap:14px;max-width:520px;margin:0 auto;}
.ss-ring{width:84px;height:84px;border-radius:50%;background:var(--mint);display:flex;align-items:center;justify-content:center;animation:ssPop .4s cubic-bezier(.2,.9,.3,1.4);}
.ss-check{width:46px;height:46px;}
.ss-check circle{stroke:var(--green);stroke-width:3;fill:none;stroke-dasharray:170;stroke-dashoffset:170;animation:ssCircle .5s ease forwards;}
.ss-check path{stroke:var(--green);stroke-width:4;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:60;stroke-dashoffset:60;animation:ssTick .35s .35s ease forwards;}
@keyframes ssPop{0%{transform:scale(0);opacity:0;}100%{transform:scale(1);opacity:1;}}
@keyframes ssCircle{to{stroke-dashoffset:0;}}
@keyframes ssTick{to{stroke-dashoffset:0;}}
.ss-title{font-weight:800;font-size:20px;color:var(--ink);margin:0;}
.ss-msg{color:var(--muted);font-size:14.5px;line-height:1.8;margin:0;}
.ss-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px;}
.ss-btn{padding:11px 22px;border-radius:12px;border:none;font-weight:800;font-size:14px;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center;transition:all .15s;}
.ss-btn-primary{background:var(--green);color:#fff;}
.ss-btn-primary:hover{background:var(--green-dark);}
.ss-btn-ghost{background:#fff;border:1px solid var(--line);color:var(--ink);}
.ss-btn-ghost:hover{background:var(--mint);border-color:var(--green-light);}
.ss-count{color:var(--muted);font-size:12.5px;margin-top:4px;}
@media(max-width:560px){.ss-actions{width:100%;flex-direction:column;}.ss-btn{width:100%;justify-content:center;}}
`;

type ActionBtn = { label: string; href?: string; onClick?: () => void };

export default function SuccessState({
  title,
  message,
  primary,
  secondary,
  redirectTo,
  redirectSeconds = 3,
}: {
  title?: string;
  message?: string;
  primary?: ActionBtn;
  secondary?: ActionBtn;
  redirectTo?: string;
  redirectSeconds?: number;
}) {
  const { tr } = useI18n();
  const router = useRouter();
  const [left, setLeft] = useState(redirectSeconds);

  useEffect(() => {
    if (!redirectTo) return;
    if (left <= 0) {
      router.push(redirectTo);
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [left, redirectTo, router]);

  const effPrimary: ActionBtn | undefined =
    primary ??
    (redirectTo ? { label: tr('ss.goNow', 'اذهب الآن'), href: redirectTo } : undefined);

  return (
    <div className="ss-box">
      <style>{SS_CSS}</style>
      <div className="ss-ring">
        <svg className="ss-check" viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="30" r="27" />
          <path d="M18 31 l8 8 l16 -18" />
        </svg>
      </div>
      <h2 className="ss-title">{title ?? tr('ss.defaultTitle', 'تمّت العملية بنجاح')}</h2>
      {message && <p className="ss-msg">{message}</p>}
      <div className="ss-actions">
        {effPrimary &&
          (effPrimary.href ? (
            <Link className="ss-btn ss-btn-primary" href={effPrimary.href}>
              {effPrimary.label}
            </Link>
          ) : (
            <button className="ss-btn ss-btn-primary" onClick={effPrimary.onClick}>
              {effPrimary.label}
            </button>
          ))}
        {secondary &&
          (secondary.href ? (
            <Link className="ss-btn ss-btn-ghost" href={secondary.href}>
              {secondary.label}
            </Link>
          ) : (
            <button className="ss-btn ss-btn-ghost" onClick={secondary.onClick}>
              {secondary.label}
            </button>
          ))}
      </div>
      {redirectTo && (
        <p className="ss-count">
          {tr('ss.redirect', 'سيتم تحويلك خلال')} {left} {tr('ss.seconds', 'ثانية')}
        </p>
      )}
    </div>
  );
}
