'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional, Visibility, Reflection } from '@/types';

export default function ReflectionPage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [text, setText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [saved, setSaved] = useState(false);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');

  useEffect(() => {
    setDevotional(getTodayDevotional());
    // 로컬 스토리지에서 이전 묵상 기록 불러오기
    const stored = localStorage.getItem('kkuljaem-reflections');
    if (stored) setReflections(JSON.parse(stored));
  }, []);

  const handleSave = () => {
    if (!text.trim() || !devotional) return;

    const newReflection: Reflection = {
      id: Date.now().toString(),
      user_id: 'demo-user',
      devotional_id: devotional.id,
      reflection_text: text,
      visibility,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newReflection, ...reflections];
    setReflections(updated);
    localStorage.setItem('kkuljaem-reflections', JSON.stringify(updated));
    setSaved(true);
    setText('');
    setTimeout(() => {
      setSaved(false);
      setActiveTab('list');
    }, 1500);
  };

  const visibilityLabels: Record<Visibility, { label: string; icon: string; desc: string }> = {
    private: { label: '나만 보기', icon: '🔒', desc: '나만 볼 수 있어요' },
    group: { label: '소그룹', icon: '👥', desc: '소그룹 친구들이 볼 수 있어요' },
    church: { label: '교회 전체', icon: '⛪', desc: '교회 전체에 공유돼요' },
  };

  const handleDelete = (id: string) => {
    const updated = reflections.filter((r) => r.id !== id);
    setReflections(updated);
    localStorage.setItem('kkuljaem-reflections', JSON.stringify(updated));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 탭 */}
        <div className="flex bg-cream rounded-xl p-1">
          <button
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'write' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            ✍️ 기록하기
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'list' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            📋 내 기록 ({reflections.length})
          </button>
        </div>

        {activeTab === 'write' ? (
          <div className="space-y-4 animate-fade-in">
            {/* 오늘의 묵상 요약 */}
            {devotional && (
              <div className="bg-cream rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-semibold mb-1">오늘의 묵상</p>
                <p className="font-bold text-brown">{devotional.theme}</p>
                <p className="text-sm text-stone-500">{devotional.passage}</p>
              </div>
            )}

            {/* 질문 리마인드 */}
            {devotional && (
              <div className="space-y-2">
                {[devotional.question1, devotional.question2, devotional.question3].map((q, i) => (
                  <div key={i} className="flex gap-2 text-sm text-stone-500">
                    <span className="text-amber-400 font-bold">{i + 1}.</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 텍스트 입력 */}
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="오늘 묵상하며 느낀 점을 자유롭게 적어보세요..."
                rows={8}
                className="w-full bg-white rounded-2xl p-5 border-2 border-amber-100 focus:border-honey focus:outline-none resize-none text-[15px] text-stone-700 leading-relaxed placeholder:text-stone-300 transition-colors"
              />
              <span className="absolute bottom-3 right-4 text-xs text-stone-300">
                {text.length}자
              </span>
            </div>

            {/* 공개 범위 */}
            <div>
              <p className="text-sm font-semibold text-brown mb-2">공개 범위</p>
              <div className="flex gap-2">
                {(Object.keys(visibilityLabels) as Visibility[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVisibility(v)}
                    className={`flex-1 py-3 rounded-xl text-center transition-all ${
                      visibility === v
                        ? 'bg-honey/15 border-2 border-honey text-amber-700'
                        : 'bg-white border-2 border-transparent text-stone-400 shadow-sm'
                    }`}
                  >
                    <span className="text-lg block">{visibilityLabels[v].icon}</span>
                    <span className="text-xs font-semibold block mt-0.5">{visibilityLabels[v].label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-2 text-center">
                {visibilityLabels[visibility].desc}
              </p>
            </div>

            {/* 저장 버튼 */}
            <button
              onClick={handleSave}
              disabled={!text.trim()}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                text.trim()
                  ? 'btn-honey shadow-md'
                  : 'bg-stone-100 text-stone-300 cursor-not-allowed'
              }`}
            >
              {saved ? '✅ 저장되었습니다!' : '💾 묵상 기록 저장'}
            </button>

          </div>
        ) : (
          /* 기록 목록 */
          <div className="space-y-3 animate-fade-in">
            {reflections.length === 0 ? (
              <div className="text-center py-16">
                <span className="text-5xl block mb-4">📝</span>
                <p className="text-stone-400 font-medium">아직 기록이 없어요</p>
                <p className="text-stone-300 text-sm mt-1">첫 묵상을 기록해보세요!</p>
              </div>
            ) : (
              reflections.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-stone-400">{formatDate(r.created_at)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-cream px-2 py-0.5 rounded-full text-stone-500">
                        {visibilityLabels[r.visibility].icon} {visibilityLabels[r.visibility].label}
                      </span>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs text-stone-300 hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed">{r.reflection_text}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
