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
