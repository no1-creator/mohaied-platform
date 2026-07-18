'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Ad = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  ctaLabel?: string | null;
  placement: string;
};

const VARIANTS: Record<string, string> = {
  HOME_TOP: 'v-top',
  HOME_STRIP: 'v-strip',
  CLIENT_DASHBOARD: 'v-card',
};

const ADB_CSS = `
.adb-wrap { position:relative; width:100%; max-width:1120px; aspect-ratio:16/5; margin:34px auto; border-radius:26px; overflow:hidden; background:linear-gradient(125deg,#216c63,#287d73 45%,#4fa294); opacity:0; transform:translateY(28px); transition:opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease; box-shadow:0 22px 55px rgba(23,33,31,.16); }
.adb-wrap.adb-in { opacity:1; transform:translateY(0); }
.adb-wrap:hover { box-shadow:0 32px 74px rgba(23,33,31,.24); }

.adb-track { position:absolute; inset:0; }
.adb-slide { position:absolute; inset:0; opacity:0; transition:opacity 1s ease; pointer-events:none; text-decoration:none; display:block; }
.adb-slide.active { opacity:1; pointer-events:auto; }

.adb-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
.adb-bg.fallback { background:linear-gradient(125deg,#216c63,#287d73 45%,#4fa294); }
.adb-bg.fallback::after { content:""; position:absolute; inset:0; background:radial-gradient(circle at 20% 22%, rgba(255,255,255,.18), transparent 45%), radial-gradient(circle at 84% 82%, rgba(248,239,210,.24), transparent 46%); animation:adbAurora 9s ease-in-out infinite alternate; }

.adb-shine { position:absolute; top:0; bottom:0; width:45%; z-index:2; pointer-events:none; background:linear-gradient(100deg, transparent, rgba(255,255,255,.22) 50%, transparent); transform:skewX(-18deg); inset-inline-start:-60%; }
.adb-slide.active .adb-shine { animation:adbShine 5.5s ease-in-out .7s infinite; }

.adb-overlay { position:absolute; inset:0; z-index:3; background:linear-gradient(to left, rgba(8,20,18,.72), rgba(8,20,18,.34) 52%, rgba(8,20,18,.04) 80%); }

.adb-content { position:absolute; inset:0; z-index:4; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:14px; padding:0 58px; color:#fff; max-width:680px; }
.adb-slide.active .adb-content > * { animation:adbRise .7s cubic-bezier(.2,.7,.2,1) both; }
.adb-slide.active .adb-content > *:nth-child(2) { animation-delay:.1s; }
.adb-slide.active .adb-content > *:nth-child(3) { animation-delay:.2s; }
.adb-title { font-size:36px; font-weight:900; margin:0; line-height:1.22; letter-spacing:-.3px; text-shadow:0 3px 18px rgba(0,0,0,.4); }
.adb-sub { font-size:18px; margin:0; line-height:1.7; opacity:.97; max-width:560px; text-shadow:0 2px 12px rgba(0,0,0,.4); }
.adb-cta { display:inline-flex; align-items:center; gap:10px; width:fit-content; background:#fff; color:var(--green-dark); padding:13px 30px; border-radius:14px; font-weight:900; font-size:15px; margin-top:4px; box-shadow:0 14px 30px rgba(0,0,0,.28); transition:transform .18s ease, box-shadow .18s ease; }
.adb-cta:hover { transform:translateY(-2px); box-shadow:0 18px 38px rgba(0,0,0,.34); }
.adb-cta-arrow { font-size:18px; animation:adbNudge 1.6s ease-in-out infinite; }

.adb-glow { position:absolute; inset:0; z-index:6; border-radius:inherit; padding:2px; pointer-events:none; background:linear-gradient(120deg, var(--green-light), var(--sand), var(--green-light)); background-size:200% 200%; -webkit-mask:linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite:xor; mask-composite:exclude; opacity:0; }

.adb-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:7; width:46px; height:46px; border-radius:50%; border:none; background:rgba(255,255,255,.92); color:var(--ink); font-size:26px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 20px rgba(0,0,0,.2); opacity:0; transition:opacity .25s, background .16s, transform .16s; }
.adb-wrap:hover .adb-arrow { opacity:1; }
.adb-arrow:hover { background:#fff; transform:translateY(-50%) scale(1.08); }
.adb-prev { inset-inline-start:18px; }
.adb-next { inset-inline-end:18px; }

.adb-dots { position:absolute; bottom:18px; inset-inline-start:0; inset-inline-end:0; display:flex; justify-content:center; gap:9px; z-index:7; }
.adb-dot { position:relative; width:30px; height:6px; border-radius:999px; border:none; background:rgba(255,255,255,.4); cursor:pointer; padding:0; overflow:hidden; transition:background .2s; }
.adb-dot-fill { position:absolute; inset:0; width:0; background:#fff; border-radius:999px; }
.adb-dot.on .adb-dot-fill { animation:adbProgress 5.5s linear forwards; }

/* أعلى الرئيسية — سينمائي بهالة متوهّجة */
.adb-wrap.v-top .adb-glow { opacity:.9; animation:adbBreathe 4s ease-in-out infinite; }

/* شريط وسط — أنحف وأسرع */
.adb-wrap.v-strip { border-radius:20px; }
.adb-wrap.v-strip .adb-title { font-size:28px; }
.adb-wrap.v-strip .adb-sub { font-size:15px; }
.adb-wrap.v-strip .adb-content { padding:0 44px; gap:9px; }
.adb-wrap.v-strip .adb-slide.active .adb-shine { animation-duration:4s; }
.adb-wrap.v-strip::after { content:""; position:absolute; left:0; right:0; bottom:0; height:4px; z-index:5; background:linear-gradient(90deg, var(--green-light), var(--sand), var(--green-light)); background-size:200% 100%; animation:adbSlideBar 3s linear infinite; }

/* لوحة العميل — كارت أنعم */
.adb-wrap.v-card { max-width:100%; border-radius:22px; }
.adb-wrap.v-card .adb-title { font-size:26px; }
.adb-wrap.v-card .adb-sub { font-size:14px; }
.adb-wrap.v-card .adb-content { padding:0 40px; }
.adb-wrap.v-card .adb-overlay { background:linear-gradient(to left, rgba(8,20,18,.66), rgba(8,20,18,.2) 60%, transparent); }

@keyframes adbShine { 0% { inset-inline-start:-60%; } 55%,100% { inset-inline-start:120%; } }
@keyframes adbRise { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
@keyframes adbNudge { 0%,100% { transform:translateX(0); } 50% { transform:translateX(-5px); } }
@keyframes adbProgress { from { width:0; } to { width:100%; } }
@keyframes adbBreathe { 0%,100% { opacity:.45; background-position:0% 50%; } 50% { opacity:.95; background-position:100% 50%; } }
@keyframes adbAurora { from { transform:translate3d(0,0,0); opacity:.7; } to { transform:translate3d(0,-4%,0); opacity:1; } }
@keyframes adbSlideBar { to { background-position:200% 0; } }

@media (max-width:640px) {
  .adb-wrap { border-radius:16px; }
  .adb-content { padding:0 24px !important; }
  .adb-title { font-size:20px !important; }
  .adb-sub { font-size:13px !important; }
  .adb-arrow { width:38px; height:38px; font-size:22px; opacity:1; }
}
`;

export default function AdBanners({ placement, height }: { placement: string; height?: number }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [idx, setIdx] = useState(0);
  const [mounted, setMounted] = useState(false);
  const tracked = useRef<Set<string>>(new Set());

  const variantCls = VARIANTS[placement] || 'v-top';

  useEffect(() => {
    api<Ad[]>(`/ads/active?placement=${encodeURIComponent(placement)}`, { auth: false })
      .then((d) => setAds(Array.isArray(d) ? d : []))
      .catch(() => setAds([]));
  }, [placement]);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 5500);
    return () => clearInterval(t);
  }, [ads.length]);

  useEffect(() => {
    if (idx >= ads.length && ads.length > 0) setIdx(0);
  }, [ads.length, idx]);

  useEffect(() => {
    const ad = ads[idx];
    if (ad && !tracked.current.has(ad.id)) {
      tracked.current.add(ad.id);
      api(`/ads/${ad.id}/impression`, { method: 'POST', auth: false }).catch(() => {});
    }
  }, [ads, idx]);

  if (!ads.length) return null;

  const go = (n: number) => setIdx((n + ads.length) % ads.length);
  const onAdClick = (ad: Ad) => {
    api(`/ads/${ad.id}/click`, { method: 'POST', auth: false }).catch(() => {});
  };
  const hasText = (ad: Ad) => !!(ad.title || ad.subtitle || ad.linkUrl);

  return (
    <div
      className={`adb-wrap ${variantCls} ${mounted ? 'adb-in' : ''}`}
      style={height ? { aspectRatio: 'auto', height } : undefined}
    >
      <style>{ADB_CSS}</style>
      <span className="adb-glow" aria-hidden="true" />

      <div className="adb-track">
        {ads.map((ad, i) => {
          const Wrapper: any = ad.linkUrl ? 'a' : 'div';
          const wrapperProps = ad.linkUrl
            ? { href: ad.linkUrl, target: '_blank', rel: 'noopener noreferrer', onClick: () => onAdClick(ad) }
            : {};
          return (
            <Wrapper key={ad.id} className={`adb-slide ${i === idx ? 'active' : ''}`} {...wrapperProps}>
              <div
                className={`adb-bg ${ad.imageUrl ? '' : 'fallback'}`}
                style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : undefined}
              />
              <span className="adb-shine" aria-hidden="true" />
              {hasText(ad) && (
                <>
                  <span className="adb-overlay" aria-hidden="true" />
                  <div className="adb-content">
                    {ad.title && <h3 className="adb-title">{ad.title}</h3>}
                    {ad.subtitle && <p className="adb-sub">{ad.subtitle}</p>}
                    {ad.linkUrl && (
                      <span className="adb-cta">
                        {ad.ctaLabel || 'اعرف أكثر'}
                        <span className="adb-cta-arrow">←</span>
                      </span>
                    )}
                  </div>
                </>
              )}
            </Wrapper>
          );
        })}
      </div>

      {ads.length > 1 && (
        <>
          <button className="adb-arrow adb-prev" onClick={() => go(idx - 1)} aria-label="السابق">‹</button>
          <button className="adb-arrow adb-next" onClick={() => go(idx + 1)} aria-label="التالي">›</button>
          <div className="adb-dots">
            {ads.map((_, i) => (
              <button
                key={i}
                className={`adb-dot ${i === idx ? 'on' : ''}`}
                onClick={() => setIdx(i)}
                aria-label={`إعلان ${i + 1}`}
              >
                <span className="adb-dot-fill" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
