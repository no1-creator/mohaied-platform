'use client';

import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

const LOGO = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M16 3.2l9.5 3.6v6.8c0 6.2-4.2 10.7-9.5 12.4C10.7 24.3 6.5 19.8 6.5 13.6V6.8L16 3.2z"
      fill="white"
      fillOpacity="0.2"
      stroke="white"
      strokeWidth="1.4"
    />
    <path
      d="M11.5 16l3 3 6-6.5"
      stroke="white"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function TopBar({ name }: { name?: string }) {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <header className="app-header">
      <div className="brand">
        <span className="logo-mark small">{LOGO}</span>
        <div>
          <p className="app-brand-name">محايد</p>
          <p className="app-brand-sub">منصة حماية الحقوق</p>
        </div>
      </div>
      <div className="app-user">
        {name && <span className="app-user-name">أهلًا، {name}</span>}
        <button className="app-logout" onClick={logout}>
          خروج
        </button>
      </div>
    </header>
  );
}
