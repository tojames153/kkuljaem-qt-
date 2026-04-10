'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import DevotionalCard from '@/components/DevotionalCard';
import { getTodayDevotional, getDevotionalForDay } from '@/lib/sample-devotional';
import { Devotional, AgeGroup } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { getExtendedAgeContent } from '@/lib/age-devotion-helper';
import BgMusicPlayer from '@/components/BgMusicPlayer';

function DevotionalContent() {
  const searchParams = useSearchParams();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const { user } = useAuth();
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('youth');
  const [ageInitialized, setAgeInitialized] = useState(false);
  const [showAgeContent, setShowAgeContent] = useState(true);

  // user가 로드되면 연령대 설정 (최초 1회)
  useEffect(() => {
    if (user?.age_group && !ageInitialized) {
      // teacher/admin은 young_adult로 매핑, 나머지는 그대로
      const mappedAge = ['teacher', 'admin'].includes(user.age_group)
        ? 'young_adult' as AgeGroup
        : user.age_group;
      setAgeGroup(mappedAge);
      setAgeInitialized(true);
    }
  }, [user, ageInitialized]);

  useEffect(() => {
    const dayParam = searchParams.get('day');
    if (dayParam) {
      const dayNum = parseInt(dayParam, 10);
      const dev = getDevotionalForDay(dayNum);
      setDevotional(dev || getTodayDevotional());
    } else {
      setDevotional(getTodayDevotional());
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
  }, [user, searchParams]);

  if (!devotional) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-amber-400">
          <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </div>
    );
  }

  const ageLabels: Record<string, string> = {
    children: '어린이',
    youth: '청소년',
    young_adult: '청년',
    senior: '장년',
  };

  const validAgeGroup = ageGroup as 'children' | 'youth' | 'young_adult' | 'senior';
  const extendedContent = getExtendedAgeContent(devotional, validAgeGroup);

  return (
    <>
      {/* 묵상 배경음악 */}
      <div className="mb-5">
        <BgMusicPlayer />
      </div>

      <DevotionalCard devotional={devotional} />

      {/* 연령별 묵상 도움 - 사용자 연령에 맞게 자동 표시 */}
      <div className="mt-5">
        <button
          onClick={() => setShowAgeContent(!showAgeContent)}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{ageLabels[ageGroup] === '어린이' ? '🌱' : ageLabels[ageGroup] === '청소년' ? '🌿' : ageLabels[ageGroup] === '청년' ? '🌳' : '🌾'}</span>
            <span className="font-semibold text-brown text-sm">{ageLabels[ageGroup]} 묵상 도움</span>
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
            {/* 다른 연령 보기 (접힌 상태) */}
            <details className="group">
              <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 mb-2 list-none flex items-center gap-1">
                <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                다른 연령대 보기
              </summary>
              <div className="flex gap-2 mb-3">
                {(['children', 'youth', 'young_adult', 'senior'] as const).map((group) => (
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
            </details>

            {/* 묵상 가이드 */}
            <div className="bg-cream rounded-2xl p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-amber-600 mb-1.5">오늘의 묵상 안내</p>
                <p className="text-stone-700 text-[15px] leading-relaxed">
                  {extendedContent.mainGuide || '콘텐츠가 준비 중이에요.'}
                </p>
              </div>

              <div className="border-t border-amber-100 pt-3">
                <p className="text-xs font-semibold text-amber-600 mb-1.5">적용 도움</p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  {extendedContent.applicationTip}
                </p>
              </div>
            </div>

            {/* 기도 안내 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
              <p className="text-xs font-semibold text-amber-600 mb-2">함께 기도해요</p>
              <p className="text-stone-600 text-sm leading-relaxed italic">
                {extendedContent.prayerGuide}
              </p>
            </div>

            {/* 실천 과제 */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">✅</span>
                <p className="text-xs font-semibold text-amber-700">오늘의 실천</p>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed font-medium">
                {extendedContent.actionStep}
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
      </div>
    </>
  );
}

export default function DevotionalPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-amber-400">
            <svg className="w-12 h-12 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        </div>
      }>
        <DevotionalContent />
      </Suspense>
    </AppShell>
  );
}
