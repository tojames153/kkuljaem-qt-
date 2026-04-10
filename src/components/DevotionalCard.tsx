'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Devotional } from '@/types';
import { getAgeCcm } from '@/lib/ccm-recommendations';
import BibleAudioPlayer from './BibleAudioPlayer';

// ===== 텍스트 선택 하이라이트 관련 타입 =====
interface TextHighlight {
  verseNum: number;
  startOffset: number;
  endOffset: number;
  color: string;
  text: string;
}

function getStoredHighlights(passage: string): TextHighlight[] {
  try {
    const raw = localStorage.getItem(`kkuljaem-text-highlights-${passage}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveHighlights(passage: string, highlights: TextHighlight[]) {
  localStorage.setItem(`kkuljaem-text-highlights-${passage}`, JSON.stringify(highlights));
}

// ===== 형광펜/밑줄/각주 관련 타입 =====
type MarkType = 'highlight' | 'underline';
type MarkColor = 'yellow' | 'green' | 'blue' | 'pink';

interface VerseMark {
  verseNum: number;
  type: MarkType;
  color: MarkColor;
}

interface VerseNote {
  verseNum: number;
  note: string;
}

interface BibleVerse {
  verse: number;
  text: string;
}

// ===== 로컬스토리지 헬퍼 =====
function getStoredMarks(passage: string): VerseMark[] {
  try {
    const raw = localStorage.getItem(`kkuljaem-marks-${passage}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveMarks(passage: string, marks: VerseMark[]) {
  localStorage.setItem(`kkuljaem-marks-${passage}`, JSON.stringify(marks));
}

function getStoredNotes(passage: string): VerseNote[] {
  try {
    const raw = localStorage.getItem(`kkuljaem-notes-${passage}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveNotes(passage: string, notes: VerseNote[]) {
  localStorage.setItem(`kkuljaem-notes-${passage}`, JSON.stringify(notes));
}

// ===== 성경 본문 컴포넌트 (형광펜/밑줄/각주 포함) =====
function BibleText({ passage, translation = 'KRV' }: { passage: string; translation?: string }) {
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marks, setMarks] = useState<VerseMark[]>([]);
  const [notes, setNotes] = useState<VerseNote[]>([]);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showToolbar, setShowToolbar] = useState(false);
  const [textHighlights, setTextHighlights] = useState<TextHighlight[]>([]);
  const [selectionPopup, setSelectionPopup] = useState<{ x: number; y: number; verseNum: number; start: number; end: number; text: string } | null>(null);

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

  useEffect(() => {
    setMarks(getStoredMarks(passage));
    setNotes(getStoredNotes(passage));
    setTextHighlights(getStoredHighlights(passage));
  }, [passage]);

  const toggleMark = useCallback((verseNum: number, type: MarkType, color: MarkColor) => {
    setMarks(prev => {
      const existing = prev.findIndex(m => m.verseNum === verseNum && m.type === type);
      let updated: VerseMark[];
      if (existing >= 0) {
        // 같은 색이면 제거, 다른 색이면 변경
        if (prev[existing].color === color) {
          updated = prev.filter((_, i) => i !== existing);
        } else {
          updated = prev.map((m, i) => i === existing ? { ...m, color } : m);
        }
      } else {
        updated = [...prev, { verseNum, type, color }];
      }
      saveMarks(passage, updated);
      return updated;
    });
  }, [passage]);

  const saveNote = useCallback((verseNum: number, text: string) => {
    setNotes(prev => {
      let updated: VerseNote[];
      if (!text.trim()) {
        updated = prev.filter(n => n.verseNum !== verseNum);
      } else {
        const existing = prev.findIndex(n => n.verseNum === verseNum);
        if (existing >= 0) {
          updated = prev.map((n, i) => i === existing ? { ...n, note: text } : n);
        } else {
          updated = [...prev, { verseNum, note: text }];
        }
      }
      saveNotes(passage, updated);
      return updated;
    });
    setEditingNote(null);
    setNoteText('');
  }, [passage]);

  const handleTextSelect = useCallback((verseNum: number) => {
    if (!showToolbar) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      setSelectionPopup(null);
      return;
    }

    const selectedText = selection.toString().trim();
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // 구절 텍스트 내에서의 오프셋 계산
    const container = range.startContainer.parentElement;
    if (!container) return;

    const fullText = container.textContent || '';
    const startOffset = fullText.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;

    if (startOffset < 0) return;

    setSelectionPopup({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      verseNum,
      start: startOffset,
      end: endOffset,
      text: selectedText,
    });
  }, [showToolbar]);

  const addTextHighlight = useCallback((color: string) => {
    if (!selectionPopup) return;
    const newHighlight: TextHighlight = {
      verseNum: selectionPopup.verseNum,
      startOffset: selectionPopup.start,
      endOffset: selectionPopup.end,
      color,
      text: selectionPopup.text,
    };
    setTextHighlights(prev => {
      const updated = [...prev, newHighlight];
      saveHighlights(passage, updated);
      return updated;
    });
    setSelectionPopup(null);
    window.getSelection()?.removeAllRanges();
  }, [selectionPopup, passage]);

  const removeTextHighlight = useCallback((index: number) => {
    setTextHighlights(prev => {
      const updated = prev.filter((_, i) => i !== index);
      saveHighlights(passage, updated);
      return updated;
    });
  }, [passage]);

  // 텍스트에 하이라이트를 적용하여 렌더링
  const renderHighlightedText = useCallback((text: string, verseNum: number) => {
    const verseHighlights = textHighlights.filter(h => h.verseNum === verseNum);
    if (verseHighlights.length === 0) return text;

    // 하이라이트 영역을 정렬
    const sorted = [...verseHighlights].sort((a, b) => a.startOffset - b.startOffset);
    const parts: React.ReactNode[] = [];
    let lastEnd = 0;

    sorted.forEach((h, i) => {
      if (h.startOffset > lastEnd) {
        parts.push(text.slice(lastEnd, h.startOffset));
      }
      const colorMap: Record<string, string> = {
        yellow: 'bg-yellow-200/80',
        green: 'bg-green-200/80',
        blue: 'bg-blue-200/80',
        pink: 'bg-pink-200/80',
      };
      parts.push(
        <mark
          key={`h-${i}`}
          className={`${colorMap[h.color] || 'bg-yellow-200/80'} rounded px-0.5 cursor-pointer`}
          onClick={(e) => { e.stopPropagation(); if (showToolbar) removeTextHighlight(textHighlights.indexOf(h)); }}
        >
          {text.slice(h.startOffset, h.endOffset)}
        </mark>
      );
      lastEnd = h.endOffset;
    });

    if (lastEnd < text.length) {
      parts.push(text.slice(lastEnd));
    }

    return <>{parts}</>;
  }, [textHighlights, showToolbar, removeTextHighlight]);

  const getVerseStyle = (verseNum: number) => {
    const verseMark = marks.filter(m => m.verseNum === verseNum);
    const highlight = verseMark.find(m => m.type === 'highlight');
    const underline = verseMark.find(m => m.type === 'underline');

    const colorMap: Record<MarkColor, string> = {
      yellow: 'bg-yellow-200/60',
      green: 'bg-green-200/60',
      blue: 'bg-blue-200/60',
      pink: 'bg-pink-200/60',
    };

    const underlineMap: Record<MarkColor, string> = {
      yellow: 'decoration-yellow-500',
      green: 'decoration-green-500',
      blue: 'decoration-blue-500',
      pink: 'decoration-pink-500',
    };

    let className = 'text-stone-700 text-[15px] leading-relaxed rounded px-0.5 transition-all cursor-pointer';
    if (highlight) className += ` ${colorMap[highlight.color]}`;
    if (underline) className += ` underline decoration-2 ${underlineMap[underline.color]}`;

    return className;
  };

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

  const highlightColors: { color: MarkColor; label: string; bg: string }[] = [
    { color: 'yellow', label: '노랑', bg: 'bg-yellow-300' },
    { color: 'green', label: '초록', bg: 'bg-green-300' },
    { color: 'blue', label: '파랑', bg: 'bg-blue-300' },
    { color: 'pink', label: '분홍', bg: 'bg-pink-300' },
  ];

  const allText = verses.map(v => v.text).join(' ');

  return (
    <div>
      {/* 음성 듣기 */}
      <BibleAudioPlayer text={allText} label={`${passage} 듣기`} />
      <div className="h-3" />

      {/* 도구 토글 버튼 */}
      <button
        onClick={() => setShowToolbar(!showToolbar)}
        className={`mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
          showToolbar ? 'bg-amber-600 text-white' : 'bg-white text-stone-500 border border-amber-200'
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
        </svg>
        {showToolbar ? '편집 모드 끄기' : '형광펜 / 밑줄 / 각주'}
      </button>

      {/* 텍스트 선택 하이라이트 팝업 */}
      {selectionPopup && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-amber-200 p-2 flex gap-1 animate-fade-in"
          style={{ left: Math.max(10, selectionPopup.x - 60), top: Math.max(10, selectionPopup.y - 50) }}
        >
          {[
            { color: 'yellow', bg: 'bg-yellow-300' },
            { color: 'green', bg: 'bg-green-300' },
            { color: 'blue', bg: 'bg-blue-300' },
            { color: 'pink', bg: 'bg-pink-300' },
          ].map(({ color, bg }) => (
            <button
              key={color}
              onClick={() => addTextHighlight(color)}
              className={`w-7 h-7 rounded-full ${bg} border-2 border-transparent hover:border-stone-400 transition-all`}
            />
          ))}
          <button
            onClick={() => { setSelectionPopup(null); window.getSelection()?.removeAllRanges(); }}
            className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center text-xs hover:bg-stone-200"
          >
            ✕
          </button>
        </div>
      )}

      {/* 구절 목록 */}
      <div className="space-y-1">
        {verses.map((v) => {
          const verseNote = notes.find(n => n.verseNum === v.verse);
          const isActive = activeVerse === v.verse;

          return (
            <div key={v.verse}>
              <p
                onClick={() => showToolbar && setActiveVerse(isActive ? null : v.verse)}
                onMouseUp={() => handleTextSelect(v.verse)}
                onTouchEnd={() => setTimeout(() => handleTextSelect(v.verse), 300)}
                className={getVerseStyle(v.verse)}
              >
                <span className="text-amber-500 font-bold text-xs mr-1.5">{v.verse}</span>
                {renderHighlightedText(v.text, v.verse)}
                {verseNote && (
                  <span
                    className="inline-flex items-center ml-1 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded font-bold cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setEditingNote(v.verse); setNoteText(verseNote.note); }}
                  >
                    *
                  </span>
                )}
              </p>

              {/* 도구 팔레트 */}
              {showToolbar && isActive && (
                <div className="ml-6 mt-1 mb-2 p-2 bg-white rounded-xl border border-amber-100 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-stone-400 font-semibold w-12">형광펜</span>
                    {highlightColors.map(({ color, bg }) => (
                      <button
                        key={`h-${color}`}
                        onClick={() => toggleMark(v.verse, 'highlight', color)}
                        className={`w-6 h-6 rounded-full ${bg} border-2 ${
                          marks.some(m => m.verseNum === v.verse && m.type === 'highlight' && m.color === color)
                            ? 'border-stone-800 scale-110' : 'border-transparent'
                        } transition-all`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] text-stone-400 font-semibold w-12">밑줄</span>
                    {highlightColors.map(({ color, bg }) => (
                      <button
                        key={`u-${color}`}
                        onClick={() => toggleMark(v.verse, 'underline', color)}
                        className={`w-6 h-3 rounded ${bg} border-2 ${
                          marks.some(m => m.verseNum === v.verse && m.type === 'underline' && m.color === color)
                            ? 'border-stone-800' : 'border-transparent'
                        } transition-all`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => { setEditingNote(v.verse); setNoteText(verseNote?.note || ''); }}
                    className="flex items-center gap-1 text-xs text-amber-700 font-semibold hover:text-amber-900"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                    </svg>
                    {verseNote ? '각주 수정' : '각주 추가'}
                  </button>
                </div>
              )}

              {/* 각주 편집 */}
              {editingNote === v.verse && (
                <div className="ml-6 mt-1 mb-2 p-3 bg-amber-50 rounded-xl border border-amber-200 animate-fade-in">
                  <p className="text-xs text-amber-700 font-semibold mb-1.5">{v.verse}절 각주</p>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="이 구절에 대한 메모를 적어보세요..."
                    rows={2}
                    className="w-full bg-white rounded-lg px-3 py-2 text-sm border border-amber-200 focus:border-amber-400 focus:outline-none resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => { setEditingNote(null); setNoteText(''); }}
                      className="px-3 py-1 text-xs text-stone-500 bg-stone-100 rounded-lg"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => saveNote(v.verse, noteText)}
                      className="px-3 py-1 text-xs text-white bg-amber-500 rounded-lg font-semibold"
                    >
                      저장
                    </button>
                    {verseNote && (
                      <button
                        onClick={() => saveNote(v.verse, '')}
                        className="px-3 py-1 text-xs text-red-500 bg-red-50 rounded-lg"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 각주 표시 (편집 모드 아닐 때) */}
              {verseNote && editingNote !== v.verse && !showToolbar && (
                <div className="ml-6 mt-0.5 mb-1 px-3 py-1.5 bg-amber-50/70 rounded-lg border-l-2 border-amber-300">
                  <p className="text-xs text-stone-600 italic">{verseNote.note}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 마킹 통계 */}
      {(marks.length > 0 || textHighlights.length > 0) && (
        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between">
          <span className="text-[10px] text-stone-400">
            형광펜 {marks.filter(m => m.type === 'highlight').length}개 / 밑줄 {marks.filter(m => m.type === 'underline').length}개
            {textHighlights.length > 0 && ` / 텍스트 강조 ${textHighlights.length}개`}
            {notes.length > 0 && ` / 각주 ${notes.length}개`}
          </span>
          <button
            onClick={() => { setMarks([]); setNotes([]); setTextHighlights([]); saveMarks(passage, []); saveNotes(passage, []); saveHighlights(passage, []); }}
            className="text-[10px] text-red-400 hover:text-red-600"
          >
            모두 지우기
          </button>
        </div>
      )}

      {/* 편집 모드 안내 */}
      {showToolbar && (
        <p className="text-[10px] text-stone-400 mt-2 text-center">
          텍스트를 드래그하여 선택하면 색상을 골라 강조할 수 있어요
        </p>
      )}
    </div>
  );
}

// ===== YouTube 임베드 재생기 =====
function YouTubePlayer({ songTitle, onClose }: { songTitle: string; onClose: () => void }) {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function searchVideo() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(songTitle + ' 찬양')}`);
        const data = await res.json();
        if (data.videoId) {
          setVideoId(data.videoId);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    searchVideo();
  }, [songTitle]);

  return (
    <div className="mt-2 animate-fade-in">
      <div className="bg-black rounded-xl overflow-hidden relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        {loading ? (
          <div className="flex items-center justify-center h-48 bg-stone-900">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white/50 text-xs mt-2">찬양 찾는 중...</p>
            </div>
          </div>
        ) : error || !videoId ? (
          <div className="h-48 bg-stone-900 flex flex-col items-center justify-center gap-3">
            <p className="text-white/60 text-sm">영상을 찾을 수 없습니다</p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(songTitle + ' 찬양')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-red-600 text-white text-xs font-semibold px-4 py-2 rounded-lg"
            >
              YouTube에서 직접 검색
            </a>
          </div>
        ) : (
          <iframe
            className="w-full aspect-video"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={songTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <p className="text-center text-xs text-stone-400 mt-2">{songTitle}</p>
    </div>
  );
}

// ===== 메인 DevotionalCard =====
interface Props {
  devotional: Devotional;
  compact?: boolean;
}

export default function DevotionalCard({ devotional, compact = false }: Props) {
  const [showBible, setShowBible] = useState(true);
  const [bibleTranslation, setBibleTranslation] = useState<'KRV' | 'HKJV' | 'NIV'>('KRV');
  const [playingSong, setPlayingSong] = useState<string | null>(null);

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

  const ageCcm = devotional.ccm ? getAgeCcm(devotional) : null;
  const songs = ageCcm ? [
    { label: '어린이찬송', emoji: '🌱', song: ageCcm.children },
    { label: 'CCM', emoji: '🌿', song: ageCcm.youth },
    { label: '찬양', emoji: '🌳', song: ageCcm.young_adult },
    { label: '찬송가', emoji: '🌾', song: ageCcm.senior },
  ] : [];

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

      {/* 성경 본문 (형광펜/밑줄/각주 포함) */}
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
              {([['KRV', '개역한글'], ['HKJV', '한글킹제임스'], ['NIV', 'NIV(영어)']] as const).map(([key, label]) => (
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">💭</span>
            <h3 className="font-semibold text-brown">묵상 질문</h3>
          </div>
          <Link
            href="/reflection"
            className="flex items-center gap-1 bg-honey/15 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-honey/25 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
            바로 기록
          </Link>
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

      {/* 오늘의 찬양 — 연령별 4곡 추천 (앱 내 재생) */}
      {songs.length > 0 && (
        <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 rounded-2xl overflow-hidden shadow-sm border border-orange-100">
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">🎵</span>
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">오늘의 찬양</span>
            </div>
          </div>
          <div className="px-5 pb-4 space-y-2.5">
            {songs.map(({ label, emoji, song }) => (
              <div key={label}>
                <button
                  onClick={() => setPlayingSong(playingSong === song ? null : song)}
                  className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all ${
                    playingSong === song ? 'bg-white shadow-sm' : 'bg-white/70 hover:bg-white'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 ${
                    playingSong === song
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500'
                      : 'bg-gradient-to-br from-red-500 to-red-600'
                  }`}>
                    {playingSong === song ? (
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{emoji}</span>
                      <span className="text-xs text-stone-400 font-medium">{label}</span>
                    </div>
                    <p className="text-brown font-bold text-sm truncate">{song}</p>
                  </div>
                  {playingSong === song ? (
                    <span className="text-xs text-amber-600 font-semibold flex-shrink-0">재생 중</span>
                  ) : (
                    <svg className="w-4 h-4 text-stone-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                  )}
                </button>
                {/* YouTube 임베드 재생기 */}
                {playingSong === song && (
                  <YouTubePlayer songTitle={song} onClose={() => setPlayingSong(null)} />
                )}
              </div>
            ))}
          </div>
        </div>
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
