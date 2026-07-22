'use client';

import { useI18n } from '@/lib/i18n';

const CSS = `
.lang-switch{display:inline-flex;gap:2px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:3px;}
.lang-switch button{border:none;background:transparent;padding:5px 12px;border-radius:8px;font-family:inherit;font-weight:800;font-size:12.5px;color:var(--muted);cursor:pointer;}
.lang-switch button.active{background:var(--green);color:#fff;}
`;

export default function LangSwitch() {
  const { lang, setLang, languages } = useI18n();
  return (
    <>
      <style>{CSS}</style>
      <div className="lang-switch">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            className={l.code === lang ? 'active' : ''}
            onClick={() => setLang(l.code)}
          >
            {l.label}
          </button>
        ))}
      </div>
    </>
  );
}
