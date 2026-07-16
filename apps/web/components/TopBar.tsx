'use client';

import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/api';

export default function TopBar({ name }: { name?: string }) {
  const router = useRouter();

  function logout() {
    clearToken();
    router.push('/login');
  }

  return (
    <header className="flex items-center justify-between px-8 py-4 border-b border-line bg-white sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center text-lg">
          ◇
        </div>
        <span className="text-lg font-black">محايد</span>
      </div>

      <div className="flex items-center gap-4">
        {name && <span className="text-sm font-bold">أهلًا، {name}</span>}
        <button
          onClick={logout}
          className="text-sm font-extrabold text-brand hover:text-brand-dark"
        >
          خروج
        </button>
      </div>
    </header>
  );
}
