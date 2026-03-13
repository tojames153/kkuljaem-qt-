'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [streak, setStreak] = useState(0);
  const [greeting, setGreeting] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    setDevotional(getTodayDevotional());

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('좋은 아침이에요!');
    else if (hour < 18) setGreeting('은혜로운 오후에요!');
    else setGreeting('평안한 저녁이에요!');

    // 연속 묵상 streak 계산
    const streakData = localStorage.getItem('kkuljaem-streak');
    if (streakData) {
      try {
        const { count, lastDate } = JSON.parse(streakData);
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastDate === today) {
          setStreak(count);
        } else if (lastDate === yesterday) {
          setStreak(count); // 오늘 아직 안 했지만 어제까지 연속
        } else {
          setStreak(0);
        }
      } catch {
        setStreak(0);
      }
    }
  }, []);

  const today = new Date();
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayStr = dayNames[today.getDay()];

  return (
    <AppShell>
      <div className="space-y-5 pt-4">
        {/* 인사 & 날짜 */}
        <div className="animate-fade-in">
          <p className="text-stone-400 text-sm">{dateStr} {dayStr}요일</p>
          <h2 className="text-xl font-bold text-brown mt-1">
            {user?.name ? `${user.name}님, ` : ''}{greeting} 🌿
          </h2>
        </div>

        {/* 연속 묵상 streak */}
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-300 rounded-2xl p-5 text-white shadow-md animate-fade-in"
             style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/90 text-sm font-medium">연속 묵상</p>
              <p className="text-3xl font-extrabold mt-1">{streak}일째 🔥</p>
            </div>
            <div className="streak-glow text-5xl">🍯</div>
          </div>
          <div className="flex gap-1 mt-3">
            {['월', '화', '수', '목', '금', '토', '일'].map((d, i) => (
              <div key={d} className="flex-1 text-center">
                <div
                  className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${
                    i < 5 ? 'bg-white text-amber-500' : i === 5 ? 'bg-white/30 text-white' : 'bg-white/10 text-white/50'
                  }`}
                >
                  {i < 5 ? '✓' : d}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 말씀 카드 */}
        {devotional && (
          <Link href="/devotional" className="block animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-honey/15 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {devotional.season || `Day ${devotional.day}`}
                </span>
              </div>
              <h3 className="text-lg font-bold text-brown mb-1">{devotional.theme}</h3>
              <p className="text-amber-600 text-sm font-medium mb-3">{devotional.passage}</p>
              <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed">
                {devotional.meditation}
              </p>
              <div className="mt-4 btn-honey text-center py-3 rounded-xl font-semibold text-sm">
                오늘의 묵상 시작하기
              </div>
            </div>
          </Link>
        )}

        {/* 오늘의 찬양 — YouTube 검색 연결 */}
        {devotional?.ccm && (
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(devotional.ccm + ' 찬양')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 animate-fade-in hover:shadow-md transition-shadow"
            style={{ animationDelay: '0.3s' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-400 font-medium">오늘의 찬양</p>
                <p className="text-brown font-bold">{devotional.ccm}</p>
              </div>
              <div className="text-stone-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </div>
            </div>
          </a>
        )}

        {/* 오늘의 암송 */}
        {devotional?.memory_verse && (
          <Link href="/memorize" className="block animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="bg-cream rounded-2xl p-5 text-center hover:bg-amber-50 transition-colors">
              <span className="text-xs text-amber-600 font-semibold">오늘의 암송 구절</span>
              <p className="text-brown font-bold text-lg mt-2">{devotional.memory_verse}</p>
              <p className="text-stone-500 text-xs mt-2">탭하여 암송하기 →</p>
            </div>
          </Link>
        )}

        {/* 빠른 메뉴 */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <Link href="/reflection" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-50 hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-1">✍️</span>
            <span className="text-xs font-medium text-stone-600">묵상 기록</span>
          </Link>
          <Link href="/ai-coach" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-50 hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-1">🤖</span>
            <span className="text-xs font-medium text-stone-600">AI 코치</span>
          </Link>
          <Link href="/prayer" className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-50 hover:shadow-md transition-shadow">
            <span className="text-2xl block mb-1">🙏</span>
            <span className="text-xs font-medium text-stone-600">기도 노트</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
