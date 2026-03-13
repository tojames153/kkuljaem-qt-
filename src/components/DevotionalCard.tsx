'use client';

import { useState, useEffect } from 'react';
import { Devotional } from '@/types';

interface BibleVerse {
  verse: number;
  text: string;
}

function BibleText({ passage, translation = 'KRV' }: { passage: string; translation?: string }) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setVerses([]);
    async function fetchBible() {
      try {
        const res = await fetch(`/api/bible?passage=${encodeURIComponent(passage)}&translation=${translation}`);
        const data = await res.json();
        if (data.verses && data.verses.length > 0) {
          setVerses(data.verses);
        } else {
          setError(data.error || '본문을 불러올 수 없습니다.');
        }
      } catch {
        setError('성경 본문을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchBible();
  }, [passage, translation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-amber-300 border-t-transparent rounded-full animate-spin" />
        <span className="ml-2 text-sm text-stone-400">본문 불러오는 중...</span>
      </div>
    );
  }

  if (error || verses.length === 0) {
    return (
      <p className="text-sm text-stone-400 italic py-2">
        {error || '성경 본문을 표시할 수 없습니다.'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {verses.map((v) => (
        <p key={v.verse} className="text-stone-700 text-[15px] leading-relaxed">
          <span className="text-amber-500 font-bold text-xs mr-1.5">{v.verse}</span>
          {v.text}
        </p>
      ))}
    </div>
  );
}

interface Props {
  devotional: Devotional;
  compact?: boolean;
}

export default function DevotionalCard({ devotional, compact = false }: Props) {
  const [showBible, setShowBible] = useState(true);
  const [bibleTranslation, setBibleTranslation] = useState<'KRV' | 'HKJV' | 'NIV'>('KRV');

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-honey/10 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            {devotional.season || `Day ${devotional.day}`}
          </span>
          <span className="text-xs text-stone-400">{devotional.passage}</span>
        </div>
        <h3 className="font-bold text-brown text-base mb-1">{devotional.theme}</h3>
        <p className="text-sm text-stone-600 line-clamp-2">{devotional.meditation}</p>
      </div>
    );
  }

  return (
    <article className="space-y-5 animate-fade-in">
      {/* 시즌 & 테마 */}
      <div className="text-center pt-4">
        <span className="inline-block bg-honey/15 text-amber-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-3">
          {devotional.season || `Day ${devotional.day}`}
        </span>
        <h2 className="text-2xl font-bold text-brown">{devotional.theme}</h2>
        <p className="text-amber-600 font-medium mt-1">{devotional.passage}</p>
      </div>

      {/* 성경 본문 */}
      <div className="bg-amber-50/50 rounded-2xl p-6 border border-amber-100">
        <button
          onClick={() => setShowBible(!showBible)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <h3 className="font-semibold text-brown">성경 본문</h3>
          </div>
          <svg
            className={`w-5 h-5 text-stone-400 transition-transform ${showBible ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {showBible && (
          <div className="mt-3">
            <div className="flex gap-2 mb-4">
              {([['KRV', '개역한글'], ['HKJV', '한글KJV'], ['NIV', 'NIV']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setBibleTranslation(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    bibleTranslation === key
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-stone-500 border border-amber-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <BibleText passage={devotional.passage} translation={bibleTranslation} />
          </div>
        )}
      </div>

      {/* 본문 묵상글 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 bg-honey rounded-full" />
          <h3 className="font-semibold text-brown">묵상글</h3>
        </div>
        <p className="text-stone-700 leading-relaxed text-[15px]">{devotional.meditation}</p>
      </div>

      {/* 질문 3개 */}
      <div className="bg-cream rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💭</span>
          <h3 className="font-semibold text-brown">묵상 질문</h3>
        </div>
        <div className="space-y-3">
          {[devotional.question1, devotional.question2, devotional.question3].map((q, i) => (
            <div key={i} className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-honey/20 text-amber-700 text-sm font-bold rounded-full flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-stone-700 text-[15px] pt-0.5">{q}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기도문 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">🙏</span>
          <h3 className="font-semibold text-brown">짧은 기도</h3>
        </div>
        <p className="text-stone-700 leading-relaxed italic text-[15px]">{devotional.prayer}</p>
      </div>

      {/* 오늘의 찬양 — YouTube 연결 */}
      {devotional.ccm && (
        <a
          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(devotional.ccm + ' 찬양')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-2xl overflow-hidden shadow-sm border border-orange-100 hover:shadow-md transition-all"
        >
          <div className="px-5 pt-4 pb-1">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎵</span>
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">오늘의 찬양</span>
            </div>
          </div>
          <div className="flex items-center gap-4 px-5 pb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
              <svg className="w-7 h-7 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-brown font-bold text-base truncate">{devotional.ccm}</p>
              <p className="text-xs text-stone-400 mt-0.5">탭하여 YouTube에서 듣기</p>
            </div>
            <svg className="w-5 h-5 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </div>
        </a>
      )}

      {/* 암송 구절 */}
      {devotional.memory_verse && (
        <div className="bg-honey/10 rounded-2xl p-5 text-center">
          <span className="text-xs text-amber-600 font-semibold uppercase tracking-wide">오늘의 암송</span>
          <p className="text-brown font-bold text-lg mt-2">{devotional.memory_verse}</p>
        </div>
      )}
    </article>
  );
}
