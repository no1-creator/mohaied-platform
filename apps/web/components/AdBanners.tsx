'use client';

import { useEffect, useState } from 'react';
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

const AB_CSS = `
.ab-wrap { max-width:1000px; margin:26px auto 0; padding:0 20px; }
.ab-label { font-size:11px; font-weight:700; color:var(--muted); letter-spacing:.04em; margin-bottom:8px; text-transform:uppercase; }
.ab-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
.ab-card { display:flex; gap:14px; align-items:center; background:#fff; border:1px solid var(--line); border-radius:16px; padding:14px; text-decoration:none; transition:all .16s; box-shadow:0 4px 16px rgba(23,33,31,.04); overflow:hidden; }
.ab-card:hover { border-color:var(--green-light); transform:translateY(-2px); box-shadow:0 10px 26px rgba(40,125,115,.12); }
.ab-card-static { cursor:default; }
.ab-img { width:66px; height:66px; border-radius:12px; background-size:cover; background-position:center; background-color:var(--mint); flex-shrink:0; }
.ab-img-fallback { display:flex; align-items:center; justify-content:center; color:var(--green-dark); font-weight:900; font-size:15px; background:linear-gradient(140deg,var(--mint),#dcefe8); }
.ab-body { min-width:0; }
.ab-title { font-size:15px; font-weight:800; color:var(--ink); margin-bottom:3px; }
.ab-sub { font-size:12.5px; color:var(--muted); line-height:1.55; margin-bottom:6px; }
.ab-cta { display:inline-block; font-size:12.5px; font-weight:800; color:var(--green-dark); background:var(--mint); padding:4px 12px; border-radius:999px; }
`;

export default function AdBanners({ placement }: { placement: string }) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    api<Ad[]>(`/ads/active?placement=${encodeURIComponent(placement)}`, { auth: false })
      .then((data) => setAds(Array.isArray(data) ? data : []))
      .catch(() => setAds([]));
  }, [placement]);

  if (!ads.length) return null;

  const onClick = (ad: Ad) => {
    // تتبّع النقر (ما يعطّلش الانتقال لو فشل)
    api(`/ads/${ad.id}/click`, { method: 'POST', auth: false }).catch(() => {});
  };

  return (
    <>
      <style>{AB_CSS}</style>
      <div className="ab-wrap">
        <div className="ab-label">إعلانات</div>
        <div className="ab-grid">
          {ads.map((ad) => {
            const inner = (
              <>
                {ad.imageUrl ? (
                  <div className="ab-img" style={{ backgroundImage: `url(${ad.imageUrl})` }} />
                ) : (
                  <div className="ab-img ab-img-fallback">محايد</div>
                )}
                <div className="ab-body">
                  <div className="ab-title">{ad.title}</div>
                  {ad.subtitle && <div className="ab-sub">{ad.subtitle}</div>}
                  {ad.linkUrl && <span className="ab-cta">{ad.ctaLabel || 'اعرف أكثر'}</span>}
                </div>
              </>
            );
            return ad.linkUrl ? (
              <a
                key={ad.id}
                className="ab-card"
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onClick(ad)}
              >
                {inner}
              </a>
            ) : (
              <div key={ad.id} className="ab-card ab-card-static">
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
