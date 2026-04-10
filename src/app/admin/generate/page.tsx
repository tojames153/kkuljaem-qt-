'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { CHURCH_CALENDAR } from '@/lib/church-calendar';
import { useAuth } from '@/lib/auth-context';

interface Devotional {
  day: number;
  season: string;
  theme: string;
  passage: string;
  meditation: string;
  question1: string;
  question2: string;
  question3: string;
  prayer: string;
  ccm: string;
  memory_verse: string;
  age_children: string;
  age_youth: string;
  age_young_adult: string;
}

type Status = 'idle' | 'running' | 'paused' | 'done' | 'error';

export default function GeneratePage() {
  const { user } = useAuth();
  const [devotionals, setDevotionals] = useState<Devotional[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [log, setLog] = useState<string[]>([]);
  const [batchSize, setBatchSize] = useState(5);
  const [previewDay, setPreviewDay] = useState<Devotional | null>(null);
  const stopRef = useRef(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  const STORAGE_KEY = 'kkuljaem-generated-devotionals';

  // 로컬스토리지에서 이전 진행 복원
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: Devotional[] = JSON.parse(stored);
      setDevotionals(parsed);
      if (parsed.length > 0 && parsed.length < 365) {
        addLog(`📂 이전 진행 발견: ${parsed.length}/365일 완료. 이어서 생성 가능합니다.`);
      } else if (parsed.length === 365) {
        setStatus('done');
        addLog('🎉 365일 데이터가 이미 생성되어 있습니다. 다운로드하세요.');
      }
    }
  }, []);

  // 자동 스크롤
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  const addLog = useCallback((msg: string) => {
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString('ko-KR')}] ${msg}`]);
  }, []);

  const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // 시즌 정보 계산
  const getSeasonForDay = (day: number) => {
    let acc = 0;
    for (const s of CHURCH_CALENDAR) {
      acc += s.days;
      if (day <= acc) return s.nameKo;
    }
    return '';
  };

  // ─── 생성 시작 ──────────────────────
  const startGeneration = async () => {
    stopRef.current = false;
    setStatus('running');
    setErrorMsg('');

    const startDay = devotionals.length + 1;
    const remaining = 365 - devotionals.length;
    const batches = Math.ceil(remaining / batchSize);
    setTotalBatches(batches);

    addLog(`🍯 생성 시작! Day ${startDay}부터 ${remaining}일, ${batches}배치`);

    let accumulated = [...devotionals];

    for (let i = 0; i < batches; i++) {
      if (stopRef.current) {
        setStatus('paused');
        addLog('⏸️ 일시 정지됨. 이어서 생성 가능합니다.');
        return;
      }

      setCurrentBatch(i + 1);
      const batchStart = accumulated.length + 1;
      const currentSeason = getSeasonForDay(batchStart);

      addLog(`⏳ [${i + 1}/${batches}] Day ${batchStart}~${Math.min(batchStart + batchSize - 1, 365)} (${currentSeason}) 생성 중...`);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startDay: batchStart, batchSize }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        accumulated = [...accumulated, ...data.devotionals];
        setDevotionals(accumulated);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(accumulated));

        addLog(`   ✅ 완료! (${accumulated.length}/365)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setErrorMsg(msg);
        setStatus('error');
        addLog(`   ❌ 오류: ${msg}`);
        addLog(`   💾 ${accumulated.length}일까지 저장됨. 다시 시작하면 이어서 생성합니다.`);
        return;
      }

      // Rate limit 방지
      if (i < batches - 1) {
        await delay(1500);
      }
    }

    setStatus('done');
    addLog('🎉 365일 묵상 데이터 생성 완료!');
  };

  // ─── 일시 정지 ──────────────────────
  const pauseGeneration = () => {
    stopRef.current = true;
    addLog('⏸️ 정지 요청...');
  };

  // ─── 초기화 ─────────────────────────
  const resetAll = () => {
    if (!confirm('모든 생성 데이터를 삭제하시겠습니까?')) return;
    setDevotionals([]);
    setStatus('idle');
    setLog([]);
    setCurrentBatch(0);
    setErrorMsg('');
    localStorage.removeItem(STORAGE_KEY);
  };

  // ─── JSON 다운로드 ──────────────────
  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(devotionals, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devotionals-365.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── SQL 다운로드 ───────────────────
  const downloadSQL = () => {
    const escape = (s: string) => s.replace(/'/g, "''");
    const values = devotionals
      .map(
        (d) =>
          `  (${d.day}, '${escape(d.season)}', '${escape(d.theme)}', '${escape(d.passage)}', '${escape(d.meditation)}', '${escape(d.question1)}', '${escape(d.question2)}', '${escape(d.question3)}', '${escape(d.prayer)}', '${escape(d.ccm)}', '${escape(d.memory_verse)}', '${escape(d.age_children)}', '${escape(d.age_youth)}', '${escape(d.age_young_adult)}')`
      )
      .join(',\n');
    const sql = `INSERT INTO devotionals (day, season, theme, passage, meditation, question1, question2, question3, prayer, ccm, memory_verse, age_children, age_youth, age_young_adult)\nVALUES\n${values};\n`;
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'devotionals-supabase.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─── 진행률 계산 ────────────────────
  const progress = Math.round((devotionals.length / 365) * 100);

  // ─── 시즌별 통계 ────────────────────
  const seasonStats = CHURCH_CALENDAR.map((s) => {
    const count = devotionals.filter((d) => d.season === s.nameKo).length;
    return { name: s.nameKo, total: s.days, done: count };
  });

  // 로그인하지 않은 경우 접근 차단
  if (!user) {
    return (
      <div className="min-h-screen bg-[#FFFDF7] flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-stone-500 font-medium">관리자 전용 페이지입니다</p>
          <p className="text-stone-400 text-sm mt-1">로그인이 필요합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF7]">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-amber-500 to-orange-400 text-white px-6 py-5">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-extrabold">🍯 kkuljaem-qt 묵상 데이터 생성기</h1>
          <p className="text-white/80 text-sm mt-1">AI가 교회력 기반 365일 묵상 콘텐츠를 자동 생성합니다</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 진행률 카드 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[#6B4F1D]">생성 진행률</h2>
            <span className="text-2xl font-extrabold text-amber-600">{devotionals.length}/365</span>
          </div>
          {/* 프로그레스 바 */}
          <div className="w-full h-4 bg-amber-50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-400 mt-2">
            <span>{progress}% 완료</span>
            {status === 'running' && (
              <span>배치 {currentBatch}/{totalBatches}</span>
            )}
          </div>
        </div>

        {/* 설정 & 버튼 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50 space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-semibold text-[#6B4F1D]">배치 크기:</label>
            <select
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              disabled={status === 'running'}
              className="bg-[#FFF8E7] border border-amber-200 rounded-lg px-3 py-2 text-sm text-[#6B4F1D] focus:outline-none focus:border-amber-400"
            >
              <option value={3}>3일씩 (안정적)</option>
              <option value={5}>5일씩 (권장)</option>
              <option value={7}>7일씩 (빠름)</option>
              <option value={10}>10일씩 (최고속)</option>
            </select>
            <span className="text-xs text-stone-400">
              배치가 클수록 빠르지만 오류 확률 증가
            </span>
          </div>

          <div className="flex gap-3">
            {status === 'running' ? (
              <button
                onClick={pauseGeneration}
                className="flex-1 py-3.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm border-2 border-red-200 hover:bg-red-100 transition-colors"
              >
                ⏸️ 일시 정지
              </button>
            ) : (
              <button
                onClick={startGeneration}
                disabled={devotionals.length >= 365}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm transition-all ${
                  devotionals.length >= 365
                    ? 'bg-green-50 text-green-600 border-2 border-green-200'
                    : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {devotionals.length === 0
                  ? '🚀 생성 시작'
                  : devotionals.length >= 365
                  ? '✅ 생성 완료!'
                  : `▶️ Day ${devotionals.length + 1}부터 이어서 생성`}
              </button>
            )}

            <button
              onClick={resetAll}
              disabled={status === 'running'}
              className="px-4 py-3.5 rounded-xl bg-stone-100 text-stone-500 font-semibold text-sm hover:bg-stone-200 transition-colors disabled:opacity-50"
            >
              🗑️ 초기화
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <p className="font-semibold">오류 발생:</p>
              <p className="mt-1">{errorMsg}</p>
              <p className="mt-2 text-xs text-red-500">
                💡 OpenAI 잔액을 확인하세요: platform.openai.com → Billing
              </p>
            </div>
          )}
        </div>

        {/* 다운로드 */}
        {devotionals.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
            <h3 className="font-bold text-[#6B4F1D] mb-3">📥 다운로드</h3>
            <div className="flex gap-3">
              <button
                onClick={downloadJSON}
                className="flex-1 py-3 rounded-xl bg-blue-50 text-blue-700 font-semibold text-sm border border-blue-200 hover:bg-blue-100 transition-colors"
              >
                📄 JSON 다운로드
              </button>
              <button
                onClick={downloadSQL}
                className="flex-1 py-3 rounded-xl bg-purple-50 text-purple-700 font-semibold text-sm border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                🗃️ SQL 다운로드 (Supabase용)
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2">
              현재 {devotionals.length}일분 데이터가 포함됩니다
            </p>
          </div>
        )}

        {/* 시즌별 현황 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
          <h3 className="font-bold text-[#6B4F1D] mb-3">📅 교회력 시즌별 현황</h3>
          <div className="space-y-2">
            {seasonStats.map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-xs font-medium text-stone-500 w-28 truncate">{s.name}</span>
                <div className="flex-1 h-3 bg-amber-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      s.done === s.total ? 'bg-green-400' : s.done > 0 ? 'bg-amber-400' : 'bg-transparent'
                    }`}
                    style={{ width: `${(s.done / s.total) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 w-12 text-right">{s.done}/{s.total}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 실시간 로그 */}
        <div className="bg-[#1e1e1e] rounded-2xl p-5 shadow-sm">
          <h3 className="text-green-400 font-bold text-sm mb-3">📋 실시간 로그</h3>
          <div className="h-48 overflow-y-auto text-xs font-mono space-y-1">
            {log.length === 0 ? (
              <p className="text-stone-500">&gt; 생성을 시작하면 로그가 표시됩니다...</p>
            ) : (
              log.map((l, i) => (
                <p
                  key={i}
                  className={
                    l.includes('✅')
                      ? 'text-green-400'
                      : l.includes('❌')
                      ? 'text-red-400'
                      : l.includes('⏳')
                      ? 'text-yellow-300'
                      : l.includes('🎉')
                      ? 'text-amber-300 font-bold'
                      : 'text-stone-400'
                  }
                >
                  {l}
                </p>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* 미리보기 — 최근 생성 데이터 */}
        {devotionals.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
            <h3 className="font-bold text-[#6B4F1D] mb-3">👀 데이터 미리보기</h3>
            <div className="flex gap-2 flex-wrap mb-4">
              {devotionals.slice(-10).map((d) => (
                <button
                  key={d.day}
                  onClick={() => setPreviewDay(previewDay?.day === d.day ? null : d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    previewDay?.day === d.day
                      ? 'bg-amber-400 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Day {d.day}
                </button>
              ))}
              <span className="text-xs text-stone-400 self-center ml-2">
                (최근 10일 표시)
              </span>
            </div>

            {previewDay && (
              <div className="bg-[#FFF8E7] rounded-xl p-5 space-y-3 text-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Day {previewDay.day}
                  </span>
                  <span className="text-amber-700 font-semibold">{previewDay.season}</span>
                </div>
                <h4 className="text-lg font-bold text-[#6B4F1D]">{previewDay.theme}</h4>
                <p className="text-amber-600 font-medium">{previewDay.passage}</p>
                <p className="text-stone-700 leading-relaxed">{previewDay.meditation}</p>
                <div className="space-y-1 text-stone-600">
                  <p>💭 Q1: {previewDay.question1}</p>
                  <p>💭 Q2: {previewDay.question2}</p>
                  <p>💭 Q3: {previewDay.question3}</p>
                </div>
                <p className="text-stone-600 italic">🙏 {previewDay.prayer}</p>
                <div className="flex gap-4 text-xs text-stone-500">
                  <span>🎵 {previewDay.ccm}</span>
                  <span>📖 암송: {previewDay.memory_verse}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-[10px] text-stone-400">초등학생</p>
                    <p className="text-xs text-stone-700">{previewDay.age_children}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-[10px] text-stone-400">중고등</p>
                    <p className="text-xs text-stone-700">{previewDay.age_youth}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-[10px] text-stone-400">청년</p>
                    <p className="text-xs text-stone-700">{previewDay.age_young_adult}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
