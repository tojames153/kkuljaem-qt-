'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional } from '@/types';

interface MemorizeRecord {
  verse: string;
  date: string;
  completed: boolean;
}

// "본문 텍스트 (구절주소)" → { text, ref }
function parseMemoryVerse(mv: string): { text: string; ref: string } {
  const match = mv.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return { text: match[1].trim(), ref: match[2].trim() };
  }
  return { text: mv, ref: '' };
}

export default function MemorizePage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [records, setRecords] = useState<MemorizeRecord[]>([]);
  const [todayCompleted, setTodayCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(1); // 1=쉬움, 2=보통, 3=어려움

  useEffect(() => {
    const dev = getTodayDevotional();
    setDevotional(dev);

    const stored = localStorage.getItem('kkuljaem-memorize');
    if (stored) {
      try {
        const parsed: MemorizeRecord[] = JSON.parse(stored);
        setRecords(parsed);
        const today = new Date().toISOString().split('T')[0];
        setTodayCompleted(parsed.some((r) => r.date === today && r.completed));
      } catch {
        setRecords([]);
      }
    }
  }, []);

  const handleComplete = () => {
    if (!devotional?.memory_verse) return;
    const today = new Date().toISOString().split('T')[0];
    const newRecord: MemorizeRecord = {
      verse: devotional.memory_verse,
      date: today,
      completed: true,
    };
    const updated = [newRecord, ...records.filter((r) => r.date !== today)];
    setRecords(updated);
    localStorage.setItem('kkuljaem-memorize', JSON.stringify(updated));
    setTodayCompleted(true);
  };

  const weekDays = ['주일', '월', '화', '수', '목', '금', '토'];

  // 이번 주(주일~토) 완료된 요일 Set 계산
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  };
  const weekStart = getWeekStart(new Date());
  const completedDays = new Set<number>();
  records.forEach((r) => {
    if (!r.completed) return;
    const d = new Date(r.date + 'T00:00:00');
    if (d >= weekStart && d < new Date(weekStart.getTime() + 7 * 86400000)) {
      completedDays.add(d.getDay());
    }
  });
  const thisWeekCompleted = completedDays.size;

  // 암송 구절에서 빈칸 힌트 생성 (난이도별)
  const getHintText = (text: string) => {
    const words = text.split(' ');
    if (hintLevel === 1) {
      // 쉬움: 3단어마다 1개 빈칸
      return words.map((w, i) => (i % 4 === 2 ? '____' : w)).join(' ');
    } else if (hintLevel === 2) {
      // 보통: 2단어마다 1개 빈칸
      return words.map((w, i) => (i % 2 === 1 ? '____' : w)).join(' ');
    } else {
      // 어려움: 첫 글자만 보여주기
      return words.map((w) => w.charAt(0) + '____').join(' ');
    }
  };

  const parsed = devotional?.memory_verse ? parseMemoryVerse(devotional.memory_verse) : null;

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 주간 암송 현황 */}
        <div className="bg-gradient-to-r from-amber-50 to-cream rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-brown text-sm">이번 주 암송 현황</h3>
            <span className="text-amber-600 font-bold">{thisWeekCompleted}/7</span>
          </div>
          <div className="flex gap-2">
            {weekDays.map((d, i) => {
              const isDone = completedDays.has(i);
              return (
                <div key={d} className="flex-1 text-center">
                  <div
                    className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                      isDone
                        ? 'bg-honey text-white'
                        : 'bg-white text-stone-300 border border-stone-100'
                    }`}
                  >
                    {isDone ? '✓' : ''}
                  </div>
                  <span className="text-[10px] text-stone-400">{d}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 암송 카드 */}
        {parsed && (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div
              className="flip-card cursor-pointer"
              onClick={() => setFlipped(!flipped)}
              style={{ minHeight: '240px' }}
            >
              <div className={`flip-card-inner relative w-full ${flipped ? 'flipped' : ''}`} style={{ minHeight: '240px' }}>
                {/* 앞면 — 구절 주소 (맞춰보기) */}
                <div className="flip-card-front absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 rounded-3xl p-8 flex flex-col items-center justify-center text-white shadow-lg">
                  <span className="text-sm font-medium opacity-80 mb-3">오늘의 암송 구절</span>
                  <p className="text-xl font-extrabold text-center mb-2">{parsed.ref}</p>
                  <p className="text-white/70 text-sm text-center mt-2">이 구절을 기억하시나요?</p>
                  <span className="text-xs opacity-60 mt-4">탭하여 본문 확인</span>
                </div>
                {/* 뒷면 — 암송 본문 */}
                <div className="flip-card-back absolute inset-0 bg-white rounded-3xl p-8 flex flex-col items-center justify-center shadow-lg border-2 border-amber-200">
                  <span className="text-xs text-amber-600 font-semibold mb-3">{parsed.ref}</span>
                  <p className="text-lg font-bold text-brown text-center leading-relaxed">
                    {parsed.text}
                  </p>
                  <span className="text-xs text-stone-400 mt-4">탭하여 다시 도전</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 힌트 모드 */}
        {parsed && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <button
              onClick={() => setShowHint(!showHint)}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 text-sm font-semibold text-brown flex items-center justify-center gap-2"
            >
              <span>💡</span>
              {showHint ? '힌트 숨기기' : '빈칸 힌트로 연습하기'}
            </button>

            {showHint && (
              <div className="bg-cream rounded-2xl p-6 animate-slide-up">
                {/* 난이도 선택 */}
                <div className="flex gap-2 mb-4 justify-center">
                  {[
                    { level: 1, label: '쉬움' },
                    { level: 2, label: '보통' },
                    { level: 3, label: '어려움' },
                  ].map(({ level, label }) => (
                    <button
                      key={level}
                      onClick={() => setHintLevel(level)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        hintLevel === level
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-white text-stone-500 border border-amber-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-stone-500 text-xs mb-3 text-center">빈칸을 채워보세요</p>
                <p className="text-brown font-semibold text-base leading-relaxed text-center">
                  {getHintText(parsed.text)}
                </p>
                <p className="text-xs text-amber-600 text-center mt-3">— {parsed.ref}</p>
              </div>
            )}
          </div>
        )}

        {/* 다시 보기 & 완료 버튼 */}
        {parsed && (
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => setFlipped(false)}
              className="w-full bg-white py-3.5 rounded-2xl font-semibold text-sm text-brown border-2 border-amber-200 hover:border-amber-300 transition-colors"
            >
              다시 보기
            </button>

            {todayCompleted ? (
              <div className="w-full bg-green-50 py-4 rounded-2xl text-center">
                <span className="text-green-600 font-bold text-base">오늘 암송 완료!</span>
                <p className="text-green-500 text-xs mt-1">잘 하고 있어요! 내일도 함께해요</p>
              </div>
            ) : (
              <button
                onClick={handleComplete}
                className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md"
              >
                암송 완료 체크
              </button>
            )}
          </div>
        )}

        {/* 최근 암송 기록 */}
        {records.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <h3 className="font-semibold text-brown text-sm mb-3">최근 암송 기록</h3>
            <div className="space-y-2">
              {records.slice(0, 7).map((r, i) => {
                const p = parseMemoryVerse(r.verse);
                return (
                  <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-amber-50">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                      r.completed ? 'bg-green-100 text-green-600' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {r.completed ? '✓' : ''}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">{p.ref || r.verse}</p>
                      <p className="text-xs text-stone-400">{r.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
