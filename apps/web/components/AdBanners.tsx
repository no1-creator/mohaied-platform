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

const ADB_CSS = `
.adb-wrap { position:relative; width:100%; max-width:1100px; height:340px; margin:30px auto; border-radius:22px; overflow:hidden; box-shadow:0 18px 44px rgba(23,33,31,.15); background:var(--mint); }
.adb-track { position:absolute; inset:0; }
.adb-slide { position:absolute; inset:0; opacity:0; transition:opacity .8s ease; pointer-events:none; text-decoration:none; display:block; }
.adb-slide.active { opacity:1; pointer-events:auto; }
.adb-bg { position:absolute; inset:0; background-size:cover; background-position:center; }
.adb-bg.fallback { background:linear-gradient(135deg,var(--green),var(--green-dark)); }
.adb-overlay { position:absolute; inset:0; background:linear-gradient(to left, rgba(0,0,0,.62), rgba(0,0,0,.28) 55%, rgba(0,0,0,.08)); }
.adb-content { position:absolute; inset:0; z-index:2; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:12px; padding:0 52px; color:#fff; max-width:660px; }
.adb-title { font-size:34px; font-weight:900; margin:0; line-height:1.25; text-shadow:0 2px 14px rgba(0,0,0,.35); }
.adb-sub { font-size:17px; margin:0; line-height:1.7; opacity:.96; text-shadow:0 2px 10px rgba(0,0,0,.35); }
.adb-cta { display:inline-flex; align-items:center; width:fit-content; background:#fff; color:var(--green-dark); padding:12px 28px; border-radius:12px; font-weight:900; font-size:15px; margin-top:6px; box-shadow:0 12px 26px rgba(0,0,0,.22); }
.adb-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:3; width:44px; height:44px; border-radius:50%; border:none; background:rgba(255,255,255,.9); color:var(--ink); font-size:26px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 16px rgba(0,0,0,.18); transition:background .16s; }
.adb-arrow:hover { background:#fff; }
.adb-prev { inset-inline-start:16px; }
.adb-next { inset-inline-end:16px; }
.adb-dots { position:absolute; bottom:16px; inset-inline-start:0; inset-inline-end:0; display:flex; justify-content:center; gap:8px; z-index:3; }
.adb-dot { width:9px; height:9px; border-radius:999px; border:none; background:rgba(255,255,255,.5); cursor:pointer; padding:0; transition:all .18s; }
.adb-dot.on { background:#fff; width:26px; }
@media (max-width:640px) {
  .adb-wrap { height:230px !important; border-radius:16px; }
  .adb-content { padding:0 24px; }
  .adb-title { font-size:22px; }
  .adb-sub { font-size:14px; }
  .adb-arrow { width:38px; height:38px; font-size:22px; }
}
`;

export default function AdBanners({ placement, height }: { placement: string; height?: number }) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [idx, setIdx] = useState(0);
  const tracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    api<Ad[]>(`/ads/active?placement=${encodeURIComponent(placement)}`, { auth: false })
      .then((d) => setAds(Array.isArray(d) ? d : []))
      .catch(() => setAds([]));
  }, [placement]);

  // تقليب أوتوماتيك
  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  // ضبط المؤشر لو قلّ عدد الإعلانات
  useEffect(() => {
    if (idx >= ads.length && ads.length > 0) setIdx(0);
  }, [ads.length, idx]);

  // تسجيل المشاهدة للإعلان الظاهر
  useEffect(() => {
    const ad = ads[idx];
    if (ad && !tracked.current.has(ad.id)) {
      tracked.current.add(ad.id);
      api(`/ads/${ad.id}/impression`, { method: 'POST', auth: false }).catch(() => {});
    }
  }, [ads, idx]);

  if (!ads.length) return null;

  const h = height || 360;
  const go = (n: number) => setIdx((n + ads.length) % ads.length);
  const onAdClick = (ad: Ad) => {
    api(`/ads/${ad.id}/click`, { method: 'POST', auth: false }).catch(() => {});
  };

  return (
    <div className="adb-wrap" style={{ height: h }}>
      <style>{ADB_CSS}</style>
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
                style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : {}}
              />
              <div className="adb-overlay" />
              <div className="adb-content">
                <h3 className="adb-title">{ad.title}</h3>
                {ad.subtitle && <p className="adb-sub">{ad.subtitle}</p>}
                {ad.linkUrl && <span className="adb-cta">{ad.ctaLabel || 'اعرف أكثر'}</span>}
              </div>
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
