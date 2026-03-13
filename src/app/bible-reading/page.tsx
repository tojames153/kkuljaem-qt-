'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getTodayReading, getReadingForDay, DailyReading } from '@/lib/bible-reading-plan';
import { useAuth } from '@/lib/auth-context';

interface ReadingRecord {
  day: number;
  date: string;
  ot: boolean;
  nt: boolean;
}

const STORAGE_KEY = 'kkuljaem-bible-reading';

function getStoredRecords(): ReadingRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: ReadingRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function BibleReadingPage() {
  const [todayReading, setTodayReading] = useState<DailyReading | null>(null);
  const [records, setRecords] = useState<ReadingRecord[]>([]);
  const [otChecked, setOtChecked] = useState(false);
  const [ntChecked, setNtChecked] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const { user } = useAuth();

  useEffect(() => {
    const reading = getTodayReading();
    setTodayReading(reading);

    const stored = getStoredRecords();
    setRecords(stored);

    // 오늘 완료 여부
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = stored.find((r) => r.date === today);
    if (todayRecord) {
      setOtChecked(todayRecord.ot);
      setNtChecked(todayRecord.nt);
    }

    // streak 계산
    let count = 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      const rec = stored.find((r) => r.date === dateStr);
      if (rec && rec.ot && rec.nt) {
        count++;
        d.setDate(d.getDate() - 1);
      } else if (dateStr === new Date().toISOString().split('T')[0]) {
        // 오늘은 아직 안 했어도 OK
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    setStreak(count);
  }, []);

  const handleCheck = (type: 'ot' | 'nt') => {
    if (!todayReading) return;
    const today = new Date().toISOString().split('T')[0];
    const newOt = type === 'ot' ? !otChecked : otChecked;
    const newNt = type === 'nt' ? !ntChecked : ntChecked;

    if (type === 'ot') setOtChecked(newOt);
    if (type === 'nt') setNtChecked(newNt);

    const updated = records.filter((r) => r.date !== today);
    updated.push({ day: todayReading.day, date: today, ot: newOt, nt: newNt });
    setRecords(updated);
    saveRecords(updated);

    // streak 재계산
    if (newOt && newNt) {
      setStreak((prev) => prev + 1);
    }
  };

  // 이번 달 완료율
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), selectedMonth + 1, 0).getDate();
  const monthRecords = records.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === now.getFullYear();
  });
  const completedDays = monthRecords.filter((r) => r.ot && r.nt).length;
  const progressPercent = Math.round((completedDays / daysInMonth) * 100);

  // 연간 진행률
  const totalCompleted = records.filter((r) => r.ot && r.nt).length;
  const yearProgress = Math.round((totalCompleted / 365) * 100);

  // 달력 생성
  const getCalendarDays = () => {
    const year = now.getFullYear();
    const firstDay = new Date(year, selectedMonth, 1).getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  };

  const isDayCompleted = (dayNum: number) => {
    const dateStr = `${now.getFullYear()}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const rec = records.find((r) => r.date === dateStr);
    return rec ? { ot: rec.ot, nt: rec.nt, both: rec.ot && rec.nt } : { ot: false, nt: false, both: false };
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  // 동기부여 메시지
  const getMotivation = () => {
    if (streak >= 30) return '놀라운 헌신이에요! 한 달 넘게 매일 읽고 있어요!';
    if (streak >= 14) return '대단해요! 2주 연속 성경읽기 달성!';
    if (streak >= 7) return '일주일 연속! 습관이 되어가고 있어요!';
    if (streak >= 3) return '좋은 출발이에요! 꾸준히 이어가요!';
    if (streak >= 1) return '오늘도 말씀과 함께 시작해요!';
    return '오늘부터 매일 성경읽기를 시작해보세요!';
  };

  const getBadge = () => {
    if (totalCompleted >= 300) return { emoji: '👑', label: '통독 마스터' };
    if (totalCompleted >= 200) return { emoji: '🏆', label: '성경 전사' };
    if (totalCompleted >= 100) return { emoji: '🌟', label: '말씀의 별' };
    if (totalCompleted >= 50) return { emoji: '📖', label: '꾸준한 독자' };
    if (totalCompleted >= 7) return { emoji: '🌱', label: '새싹 독자' };
    return { emoji: '🍯', label: '시작이 반!' };
  };

  const badge = getBadge();

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 인사 & 동기부여 */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-5 text-white shadow-md animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white/80 text-sm font-medium">공동체 성경읽기</p>
              <p className="text-2xl font-extrabold mt-1">
                {streak > 0 ? `${streak}일 연속!` : '오늘 시작해요!'}
              </p>
            </div>
            <div className="text-center">
              <span className="text-4xl">{badge.emoji}</span>
              <p className="text-[10px] text-white/70 mt-0.5">{badge.label}</p>
            </div>
          </div>
          <p className="text-white/80 text-xs mt-1">{getMotivation()}</p>

          {/* 연간 진행바 */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>연간 진행률</span>
              <span>{yearProgress}% ({totalCompleted}/365일)</span>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/80 rounded-full transition-all duration-500"
                style={{ width: `${yearProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 오늘의 읽기 */}
        {todayReading && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                Day {todayReading.day}
              </span>
              <span className="text-xs text-stone-400">
                {now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일
              </span>
            </div>

            {/* 구약 */}
            <button
              onClick={() => handleCheck('ot')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl mb-3 transition-all text-left ${
                otChecked
                  ? 'bg-emerald-50 border-2 border-emerald-200'
                  : 'bg-stone-50 border-2 border-transparent hover:border-stone-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                otChecked ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-stone-200'
              }`}>
                {otChecked ? '✓' : ''}
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-400 font-medium">구약</p>
                <p className={`font-bold ${otChecked ? 'text-emerald-700' : 'text-brown'}`}>
                  {todayReading.ot}
                </p>
              </div>
            </button>

            {/* 신약 */}
            <button
              onClick={() => handleCheck('nt')}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left ${
                ntChecked
                  ? 'bg-emerald-50 border-2 border-emerald-200'
                  : 'bg-stone-50 border-2 border-transparent hover:border-stone-200'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                ntChecked ? 'bg-emerald-500 text-white' : 'bg-white border-2 border-stone-200'
              }`}>
                {ntChecked ? '✓' : ''}
              </div>
              <div className="flex-1">
                <p className="text-xs text-stone-400 font-medium">신약</p>
                <p className={`font-bold ${ntChecked ? 'text-emerald-700' : 'text-brown'}`}>
                  {todayReading.nt}
                </p>
              </div>
            </button>

            {otChecked && ntChecked && (
              <div className="mt-4 text-center py-3 bg-emerald-50 rounded-xl animate-fade-in">
                <p className="text-emerald-600 font-bold">오늘의 성경읽기 완료!</p>
                <p className="text-emerald-500 text-xs mt-0.5">
                  {user?.name || ''}님, 잘 하고 있어요!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 이번 달 현황 */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-brown">이번 달 읽기 현황</p>
                <p className="text-xs text-stone-400">{completedDays}/{daysInMonth}일 완료 ({progressPercent}%)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <svg
                className={`w-5 h-5 text-stone-400 transition-transform ${showCalendar ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </button>

          {showCalendar && (
            <div className="mt-3 bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-slide-up">
              {/* 월 선택 */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setSelectedMonth((prev) => Math.max(0, prev - 1))}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
                >
                  &lt;
                </button>
                <span className="font-bold text-brown">{monthNames[selectedMonth]}</span>
                <button
                  onClick={() => setSelectedMonth((prev) => Math.min(11, prev + 1))}
                  className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-500"
                >
                  &gt;
                </button>
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['주', '월', '화', '수', '목', '금', '토'].map((d) => (
                  <div key={d} className="text-center text-[10px] text-stone-400 font-medium">{d}</div>
                ))}
              </div>

              {/* 달력 */}
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((dayNum, i) => {
                  if (!dayNum) return <div key={`empty-${i}`} />;
                  const status = isDayCompleted(dayNum);
                  const isToday = dayNum === now.getDate() && selectedMonth === now.getMonth();
                  return (
                    <div
                      key={dayNum}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                        status.both
                          ? 'bg-emerald-500 text-white'
                          : status.ot || status.nt
                            ? 'bg-emerald-100 text-emerald-700'
                            : isToday
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'text-stone-400'
                      }`}
                    >
                      {status.both ? '✓' : dayNum}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 mt-3 justify-center text-[10px] text-stone-400">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-500 rounded-sm inline-block" /> 완료
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-100 rounded-sm inline-block" /> 부분
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-amber-100 border border-amber-300 rounded-sm inline-block" /> 오늘
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 마일스톤 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-bold text-brown text-sm mb-3">마일스톤</h3>
          <div className="space-y-2.5">
            {[
              { days: 7, emoji: '🌱', label: '1주일 연속', desc: '좋은 습관의 시작' },
              { days: 30, emoji: '🌿', label: '1개월 연속', desc: '말씀이 뿌리내려요' },
              { days: 100, emoji: '🌟', label: '100일 달성', desc: '성경읽기의 별' },
              { days: 200, emoji: '🏆', label: '200일 달성', desc: '성경 전사' },
              { days: 365, emoji: '👑', label: '1년 통독 완료!', desc: '놀라운 축복!' },
            ].map(({ days, emoji, label, desc }) => (
              <div key={days} className="flex items-center gap-3">
                <span className={`text-xl ${totalCompleted >= days ? '' : 'grayscale opacity-30'}`}>
                  {emoji}
                </span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${totalCompleted >= days ? 'text-brown' : 'text-stone-300'}`}>
                    {label}
                  </p>
                  <p className="text-[10px] text-stone-400">{desc}</p>
                </div>
                {totalCompleted >= days ? (
                  <span className="text-emerald-500 text-xs font-bold">달성!</span>
                ) : (
                  <span className="text-[10px] text-stone-300">{days - totalCompleted}일 남음</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
