'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const pageTitles: Record<string, string> = {
  '/': '꿀잼QT',
  '/devotional': '오늘의 묵상',
  '/reflection': '묵상 기록',
  '/ai-coach': 'AI 묵상 코치',
  '/prayer': '기도 노트',
  '/memorize': '말씀 암송',
  '/community': '공동체 묵상',
  '/login': '로그인',
  '/signup': '회원가입',
};

const ageLabels: Record<string, string> = {
  children: '초등학생',
  youth: '중고등학생',
  young_adult: '청년',
  teacher: '교사/교역자',
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const title = pageTitles[pathname] || '꿀잼QT';
  const isHome = pathname === '/';

  const handleLogout = () => {
    logout();
    setShowMenu(false);
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-50">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        {!isHome ? (
          <Link href="/" className="text-brown hover:text-honey transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Link>
        ) : (
          <div className="w-6" />
        )}
        <h1 className="text-lg font-bold text-brown">
          {isHome && <span className="text-honey mr-1">🍯</span>}
          {title}
        </h1>

        {/* 사용자 아이콘 / 메뉴 */}
        <div className="relative">
          {user ? (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 bg-honey/20 rounded-full flex items-center justify-center text-sm font-bold text-amber-700 hover:bg-honey/30 transition-colors"
            >
              {user.name.charAt(0)}
            </button>
          ) : (
            <Link href="/login" className="text-brown-light hover:text-honey transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </Link>
          )}

          {/* 드롭다운 메뉴 */}
          {showMenu && user && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-10 z-50 bg-white rounded-2xl shadow-lg border border-amber-100 w-56 py-3 animate-fade-in">
                <div className="px-4 pb-3 border-b border-amber-50">
                  <p className="font-bold text-brown text-sm">{user.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{user.email}</p>
                  <span className="inline-block mt-1.5 text-xs bg-honey/15 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                    {ageLabels[user.age_group] || user.age_group}
                  </span>
                  {user.church_name && (
                    <p className="text-xs text-stone-500 mt-1">⛪ {user.church_name}</p>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors mt-1"
                >
                  로그아웃
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
