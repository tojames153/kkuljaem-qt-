'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { getDevotionalForDate } from '@/data';
import { getDevotionalByDate } from '@/lib/sample-devotional';
import { useAuth } from '@/lib/auth-context';
import { getAgeCcm } from '@/lib/ccm-recommendations';

export default function HistoryPage() {
  const { user } = useAuth();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear] = useState(now.getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // 오늘이 올해의 몇 번째 날인지
  const todayDayOfYear = useMemo(() => {
    const start = new Date(now.getFullYear(), 0, 0);
    return Math.floor((now.getTime() - start.getTime()) / 86400000);
  }, []);

  // 해당 월의 날짜 → day 번호 매핑
  const monthDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();
    const days: { date: number; dayOfYear: number; isPast: boolean }[] = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const start = new Date(selectedYear, 0, 0);
      const dayOfYear = Math.floor((dateObj.getTime() - start.getTime()) / 86400000);
      const isPast = dayOfYear <= todayDayOfYear;
      days.push({ date: d, dayOfYear, isPast });
    }

    return { days, firstDayOfWeek };
  }, [selectedMonth, selectedYear, todayDayOfYear]);

  // 묵상 완료 기록 (localStorage)
  const completedDays = useMemo(() => {
    if (typeof window === 'undefined') return new Set<number>();
    try {
      const raw = localStorage.getItem('kkuljaem-completed-days');
      return raw ? new Set<number>(JSON.parse(raw)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  }, []);

  // 선택된 날짜의 묵상 데이터 (교회력 기반)
  const selectedDevotional = useMemo(() => {
    if (selectedDay === null) return null;
    // dayOfYear → 실제 Date 변환
    const date = new Date(selectedYear, 0, selectedDay);
    return getDevotionalByDate(date);
  }, [selectedDay, selectedYear]);

  // 리스트 뷰: 해당 월의 묵상 목록 (교회력 기반)
  const monthDevotionals = useMemo(() => {
    return monthDays.days
      .filter((d) => d.isPast)
      .map((d) => {
        const date = new Date(selectedYear, selectedMonth, d.date);
        const dev = getDevotionalByDate(date);
        return { ...d, devotional: dev };
      })
      .reverse();
  }, [monthDays, selectedYear, selectedMonth]);

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 제목 */}
        <div className="animate-fade-in">
          <h2 className="text-xl font-bold text-brown">지난 묵상 다시보기</h2>
          <p className="text-sm text-stone-400 mt-1">과거 큐티를 다시 읽고 묵상해보세요</p>
        </div>

        {/* 뷰 모드 전환 */}
        <div className="flex bg-cream rounded-xl p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'calendar' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            달력 보기
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              viewMode === 'list' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            목록 보기
          </button>
        </div>

        {/* 월 선택 */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
          <button
            onClick={() => setSelectedMonth((p) => (p === 0 ? 11 : p - 1))}
            className="w-10 h-10 rounded-full bg-cream flex items-center justify-center hover:bg-amber-100 transition-colors"
          >
            <svg className="w-5 h-5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h3 className="text-lg font-bold text-brown">
            {selectedYear}년 {monthNames[selectedMonth]}
          </h3>
          <button
            onClick={() => setSelectedMonth((p) => (p === 11 ? 0 : p + 1))}
            disabled={selectedMonth >= now.getMonth()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              selectedMonth >= now.getMonth() ? 'bg-stone-50 text-stone-300' : 'bg-cream hover:bg-amber-100 text-brown'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* 달력 그리드 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-stone-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {/* 빈 칸 */}
                {Array.from({ length: monthDays.firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10" />
                ))}
                {/* 날짜들 */}
                {monthDays.days.map((day) => {
                  const isToday = day.dayOfYear === todayDayOfYear;
                  const isSelected = selectedDay === day.dayOfYear;
                  const isCompleted = completedDays.has(day.dayOfYear);
                  return (
                    <button
                      key={day.date}
                      onClick={() => day.isPast ? setSelectedDay(day.dayOfYear) : null}
                      disabled={!day.isPast}
                      className={`h-10 rounded-lg text-sm font-medium transition-all relative ${
                        isSelected
                          ? 'bg-honey text-white shadow-sm'
                          : isToday
                            ? 'bg-amber-100 text-amber-700 font-bold'
                            : day.isPast
                              ? 'hover:bg-cream text-stone-700'
                              : 'text-stone-300'
                      }`}
                    >
                      {day.date}
                      {isCompleted && !isSelected && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-green-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 선택된 날짜의 묵상 미리보기 */}
            {selectedDevotional && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-honey/15 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                    {selectedDevotional.season || `Day ${selectedDevotional.day}`}
                  </span>
                  <span className="text-xs text-stone-400">Day {selectedDevotional.day}</span>
                </div>
                <h3 className="text-lg font-bold text-brown mb-1">{selectedDevotional.theme}</h3>
                <p className="text-amber-600 text-sm font-medium mb-3">{selectedDevotional.passage}</p>
                <p className="text-stone-600 text-sm line-clamp-3 leading-relaxed mb-4">
                  {selectedDevotional.meditation}
                </p>

                {/* 질문 미리보기 */}
                <div className="space-y-2 mb-4">
                  {[selectedDevotional.question1, selectedDevotional.question2, selectedDevotional.question3].map((q, i) => (
                    <div key={i} className="flex gap-2 text-sm text-stone-500">
                      <span className="text-amber-400 font-bold">{i + 1}.</span>
                      <span className="line-clamp-1">{q}</span>
                    </div>
                  ))}
                </div>

                {/* 찬양 */}
                {selectedDevotional.ccm && (() => {
                  const ageCcm = getAgeCcm(selectedDevotional);
                  const ageKey = user?.age_group === 'children' ? 'children' : user?.age_group === 'young_adult' ? 'young_adult' : user?.age_group === 'senior' ? 'senior' : 'youth';
                  const song = ageCcm[ageKey];
                  return (
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song + ' 찬양')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 mb-4"
                    >
                      <span className="text-red-500 text-sm">&#9654;</span>
                      <span className="text-sm text-stone-600 font-medium">{song}</span>
                    </a>
                  );
                })()}

                {/* 암송구절 */}
                {selectedDevotional.memory_verse && (
                  <div className="bg-cream rounded-xl p-3 mb-4">
                    <span className="text-xs text-amber-600 font-semibold">암송 구절</span>
                    <p className="text-brown font-bold text-sm mt-1">{selectedDevotional.memory_verse}</p>
                  </div>
                )}

                <Link
                  href={`/devotional?day=${selectedDevotional.day}`}
                  className="block btn-honey text-center py-3 rounded-xl font-semibold text-sm"
                >
                  이 묵상 자세히 보기
                </Link>
              </div>
            )}
          </>
        ) : (
          /* 목록 보기 */
          <div className="space-y-3">
            {monthDevotionals.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">📅</span>
                <p className="text-stone-400 font-medium">이 달의 묵상이 아직 없어요</p>
              </div>
            ) : (
              monthDevotionals.map((item) => (
                item.devotional && (
                  <button
                    key={item.date}
                    onClick={() => setSelectedDay(item.dayOfYear)}
                    className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-amber-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-stone-400">
                            {selectedMonth + 1}/{item.date}
                          </span>
                          <span className="bg-honey/15 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {item.devotional.season}
                          </span>
                          {completedDays.has(item.dayOfYear) && (
                            <span className="text-green-500 text-xs font-bold">&#10003;</span>
                          )}
                        </div>
                        <p className="font-bold text-brown text-sm">{item.devotional.theme}</p>
                        <p className="text-xs text-amber-600 mt-0.5">{item.devotional.passage}</p>
                      </div>
                      <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </button>
                )
              ))
            )}
          </div>
        )}

        {/* 선택된 묵상 상세 (목록 뷰에서) */}
        {viewMode === 'list' && selectedDay !== null && selectedDevotional && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center" onClick={() => setSelectedDay(null)}>
            <div
              className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-honey/15 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {selectedDevotional.season}
                </span>
                <span className="text-xs text-stone-400">Day {selectedDevotional.day}</span>
              </div>
              <h3 className="text-xl font-bold text-brown mb-1">{selectedDevotional.theme}</h3>
              <p className="text-amber-600 text-sm font-medium mb-4">{selectedDevotional.passage}</p>
              <p className="text-stone-600 text-[15px] leading-relaxed mb-5">{selectedDevotional.meditation}</p>

              <div className="space-y-2 mb-5">
                {[selectedDevotional.question1, selectedDevotional.question2, selectedDevotional.question3].map((q, i) => (
                  <div key={i} className="flex gap-2 text-sm text-stone-600 bg-cream rounded-xl p-3">
                    <span className="text-amber-500 font-bold">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>

              {selectedDevotional.prayer && (
                <div className="bg-amber-50/50 rounded-xl p-4 mb-5">
                  <p className="text-xs font-semibold text-amber-600 mb-1">기도문</p>
                  <p className="text-stone-600 text-sm italic leading-relaxed">{selectedDevotional.prayer}</p>
                </div>
              )}

              {selectedDevotional.memory_verse && (
                <div className="bg-cream rounded-xl p-4 mb-5 text-center">
                  <p className="text-xs text-amber-600 font-semibold mb-1">암송 구절</p>
                  <p className="text-brown font-bold">{selectedDevotional.memory_verse}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedDay(null)}
                className="w-full py-3 rounded-xl bg-stone-100 text-stone-500 font-semibold"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
