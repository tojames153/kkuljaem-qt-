'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const pageTitles: Record<string, string> = {
  '/': '꿀잼QT',
  '/devotional': '오늘의 묵상',
  '/reflection': '묵상 기록',
  '/prayer': '기도 노트',
  '/memorize': '말씀 암송',
  '/community': '공동체 묵상',
  '/bible-reading': '성경읽기',
  '/profile': '내 프로필',
  '/login': '로그인',
  '/signup': '회원가입',
};

export default function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const title = pageTitles[pathname] || '꿀잼QT';
  const isHome = pathname === '/';

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

        {/* 사용자 아바타 → 프로필 페이지 */}
        {user ? (
          <Link
            href="/profile"
            aria-label="내 프로필"
            className="w-8 h-8 bg-honey/20 rounded-full flex items-center justify-center text-sm font-bold text-amber-700 hover:bg-honey/30 transition-colors"
          >
            {user.name.charAt(0)}
          </Link>
        ) : (
          <Link href="/login" aria-label="로그인" className="text-brown-light hover:text-honey transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
