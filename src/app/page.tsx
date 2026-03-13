'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional } from '@/types';

export default function HomePage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [streak, setStreak] = useState(7);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setDevotional(getTodayDevotional());

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('좋은 아침이에요!');
    else if (hour < 18) setGreeting('은혜로운 오후에요!');
    else setGreeting('평안한 저녁이에요!');
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
          <h2 className="text-xl font-bold text-brown mt-1">{greeting} 🌿</h2>
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

        {/* 오늘의 찬양 */}
        {devotional?.ccm && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 animate-fade-in"
               style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-honey/20 rounded-xl flex items-center justify-center text-2xl">
                🎵
              </div>
              <div>
                <p className="text-xs text-stone-400 font-medium">오늘의 찬양</p>
                <p className="text-brown font-bold">{devotional.ccm}</p>
              </div>
            </div>
          </div>
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
