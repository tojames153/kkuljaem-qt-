'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DevotionalCard from '@/components/DevotionalCard';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional, AgeGroup } from '@/types';
import { useAuth } from '@/lib/auth-context';

export default function DevotionalPage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('youth');
  const [showAgeContent, setShowAgeContent] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setDevotional(getTodayDevotional());

    // 사용자 연령대 자동 설정
    if (user?.age_group && user.age_group !== 'teacher' && user.age_group !== 'admin') {
      setAgeGroup(user.age_group);
    }

    // 연속 묵상 streak 업데이트
    const today = new Date().toDateString();
    try {
      const raw = localStorage.getItem('kkuljaem-streak');
      if (raw) {
        const { count, lastDate } = JSON.parse(raw);
        if (lastDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString();
          const newCount = lastDate === yesterday ? count + 1 : 1;
          localStorage.setItem('kkuljaem-streak', JSON.stringify({ count: newCount, lastDate: today }));
        }
      } else {
        localStorage.setItem('kkuljaem-streak', JSON.stringify({ count: 1, lastDate: today }));
      }
    } catch {
      localStorage.setItem('kkuljaem-streak', JSON.stringify({ count: 1, lastDate: today }));
    }
  }, [user]);

  if (!devotional) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-amber-400">
            <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      </AppShell>
    );
  }

  const ageContent = {
    children: devotional.age_children,
    youth: devotional.age_youth,
    young_adult: devotional.age_young_adult,
  };

  const ageLabels: Record<string, string> = {
    children: '초등학생',
    youth: '중고등학생',
    young_adult: '청년',
  };

  return (
    <AppShell>
      <DevotionalCard devotional={devotional} />

      {/* 연령별 콘텐츠 */}
      <div className="mt-5">
        <button
          onClick={() => setShowAgeContent(!showAgeContent)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span className="font-semibold text-brown text-sm">연령별 묵상 도움</span>
          </div>
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform ${showAgeContent ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showAgeContent && (
          <div className="mt-3 space-y-3 animate-slide-up">
            {/* 연령 그룹 선택 탭 */}
            <div className="flex gap-2">
              {(['children', 'youth', 'young_adult'] as const).map((group) => (
                <button
                  key={group}
                  onClick={() => setAgeGroup(group)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    ageGroup === group
                      ? 'btn-honey shadow-sm'
                      : 'bg-white text-stone-500 border border-amber-100'
                  }`}
                >
                  {ageLabels[group]}
                </button>
              ))}
            </div>

            {/* 선택된 연령 콘텐츠 */}
            <div className="bg-cream rounded-2xl p-5">
              <p className="text-stone-700 text-[15px] leading-relaxed">
                {ageContent[ageGroup as keyof typeof ageContent] || '콘텐츠가 준비 중이에요.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 오늘의 찬양 — YouTube 연결 */}
      {devotional.ccm && (
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(devotional.ccm + ' 찬양')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-5 hover:shadow-md transition-shadow"
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
              <p className="text-xs text-stone-400 mt-0.5">YouTube에서 듣기 →</p>
            </div>
            <div className="text-stone-300">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </div>
          </div>
        </a>
      )}

      {/* 묵상 기록 버튼 */}
      <div className="mt-6 space-y-3">
        <Link
          href="/reflection"
          className="block btn-honey text-center py-4 rounded-2xl font-bold text-base shadow-md"
        >
          ✍️ 묵상 기록하기
        </Link>
        <Link
          href="/ai-coach"
          className="block bg-white text-center py-4 rounded-2xl font-bold text-sm text-brown border-2 border-amber-200 hover:border-amber-300 transition-colors"
        >
          🤖 AI 코치에게 질문하기
        </Link>
      </div>
    </AppShell>
  );
}
