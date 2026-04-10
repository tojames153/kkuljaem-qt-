'use client';

import { useState, useRef, useEffect } from 'react';

type InstrumentType = 'piano' | 'cello' | 'guitar';

interface InstrumentOption {
  type: InstrumentType;
  label: string;
  emoji: string;
  baseQueries: string[];
}

// 날짜 기반 시드로 매일 다른 검색어 조합 생성
function getDailyIndex(extra: number = 0): number {
  const now = new Date();
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate() + extra;
  return seed;
}

// 매일 다른 검색 키워드 조합을 생성
const DAILY_KEYWORDS = [
  '묵상', '예배', '기도', '찬양', '은혜', '평안', '새벽', '저녁',
  '잔잔한', '감동', '힐링', '감사', '사랑', '소망', '위로', '축복',
  '고요한', '아름다운', '따뜻한', '하나님', '성령', '십자가', '부활',
  '영광', '찬미', '경배', '간구', '순종', '믿음', '은총',
];

const DAILY_STYLES = [
  '경음악', '연주', '반주', 'BGM', '명상', '인스트루멘탈', '편곡',
  '메들리', '모음', '연속재생', '1시간', '클래식', '어쿠스틱',
];

function getDailySearchQuery(type: InstrumentType): string {
  const idx = getDailyIndex();
  const typeOffset = type === 'piano' ? 0 : type === 'cello' ? 7 : 13;
  const keyword = DAILY_KEYWORDS[(idx + typeOffset) % DAILY_KEYWORDS.length];
  const style = DAILY_STYLES[(idx + typeOffset + 3) % DAILY_STYLES.length];

  const baseMap: Record<InstrumentType, string> = {
    piano: '찬송가 피아노',
    cello: '찬송가 첼로',
    guitar: '찬송가 통기타',
  };

  return `${baseMap[type]} ${keyword} ${style}`;
}

const INSTRUMENTS: InstrumentOption[] = [
  { type: 'piano', label: '피아노', emoji: '🎹', baseQueries: ['찬송가 피아노'] },
  { type: 'cello', label: '첼로', emoji: '🎻', baseQueries: ['찬송가 첼로'] },
  { type: 'guitar', label: '통기타', emoji: '🎸', baseQueries: ['찬송가 통기타'] },
];

export default function BgMusicPlayer() {
  const [active, setActive] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const fetchVideoId = async (type: InstrumentType) => {
    setLoading(true);
    setVideoId(null);
    try {
      // 매일 다른 검색어를 생성하여 새로운 음악을 가져옴
      const query = getDailySearchQuery(type);
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.videoId) {
        setVideoId(data.videoId);
      } else {
        // 첫 시도 실패 시 기본 검색어로 재시도
        const fallbackQuery = `찬송가 ${type === 'piano' ? '피아노' : type === 'cello' ? '첼로' : '통기타'} 묵상 경음악`;
        const res2 = await fetch(`/api/youtube-search?q=${encodeURIComponent(fallbackQuery)}`);
        const data2 = await res2.json();
        if (data2.videoId) setVideoId(data2.videoId);
      }
    } catch {
      // 완전 실패 시 폴백
      const fallbacks: Record<InstrumentType, string> = {
        piano: 'dQw4w9WgXcQ',
        cello: 'dQw4w9WgXcQ',
        guitar: 'dQw4w9WgXcQ',
      };
      setVideoId(fallbacks[type]);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (type: InstrumentType) => {
    setInstrument(type);
    setActive(true);
    setMinimized(false);
    fetchVideoId(type);
  };

  const handleChangeInstrument = (type: InstrumentType) => {
    setInstrument(type);
    fetchVideoId(type);
  };

  const handleStop = () => {
    setActive(false);
    setVideoId(null);
    setMinimized(false);
  };

  const currentInstrument = INSTRUMENTS.find(i => i.type === instrument)!;

  // 비활성 상태: 시작 버튼
  if (!active) {
    return (
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-4 border border-violet-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🎶</span>
          <span className="text-xs font-semibold text-violet-700">묵상하기 좋은 찬양</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {INSTRUMENTS.map((inst) => (
            <button
              key={inst.type}
              onClick={() => handleStart(inst.type)}
              className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 border border-violet-100 hover:border-violet-300 hover:shadow-sm transition-all"
            >
              <span className="text-2xl">{inst.emoji}</span>
              <span className="text-[11px] font-semibold text-violet-700">{inst.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 활성 상태: 최소화
  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-40 animate-fade-in">
        <button
          onClick={() => setMinimized(false)}
          className="bg-violet-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-violet-600 transition-colors"
        >
          <span className="text-lg">{currentInstrument.emoji}</span>
        </button>
        {/* 숨겨진 iframe으로 계속 재생 */}
        {videoId && (
          <iframe
            ref={iframeRef}
            className="w-0 h-0 absolute"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0&controls=0`}
            allow="autoplay; encrypted-media"
            title="배경음악"
          />
        )}
      </div>
    );
  }

  // 활성 상태: 전체 플레이어
  return (
    <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl overflow-hidden border border-violet-100">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm">🎶</span>
          <span className="text-xs font-semibold text-violet-700">묵상하기 좋은 찬양</span>
          <span className="text-[10px] bg-violet-200 text-violet-700 px-1.5 py-0.5 rounded-full font-bold">
            {currentInstrument.emoji} {currentInstrument.label}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="w-7 h-7 rounded-full bg-white text-violet-500 flex items-center justify-center hover:bg-violet-100 transition-colors text-xs"
            title="최소화"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
          </button>
          <button
            onClick={handleStop}
            className="w-7 h-7 rounded-full bg-white text-red-400 flex items-center justify-center hover:bg-red-50 transition-colors text-xs"
            title="종료"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 악기 선택 탭 */}
      <div className="flex gap-1 px-4 mb-2">
        {INSTRUMENTS.map((inst) => (
          <button
            key={inst.type}
            onClick={() => handleChangeInstrument(inst.type)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              instrument === inst.type
                ? 'bg-violet-500 text-white shadow-sm'
                : 'bg-white text-violet-500 border border-violet-200'
            }`}
          >
            <span>{inst.emoji}</span>
            <span>{inst.label}</span>
          </button>
        ))}
      </div>

      {/* YouTube 임베드 */}
      <div className="px-4 pb-3">
        {loading ? (
          <div className="bg-black rounded-xl h-48 flex items-center justify-center">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/50 text-xs mt-2">음악 찾는 중...</p>
            </div>
          </div>
        ) : videoId ? (
          <div className="rounded-xl overflow-hidden bg-black">
            <iframe
              ref={iframeRef}
              className="w-full aspect-video"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="묵상 배경음악"
            />
          </div>
        ) : (
          <div className="bg-stone-100 rounded-xl h-48 flex items-center justify-center">
            <p className="text-stone-400 text-sm">음악을 불러올 수 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
