'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { Prayer } from '@/types';

export default function PrayerPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [newPrayer, setNewPrayer] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'answered'>('all');

  useEffect(() => {
    const stored = localStorage.getItem('kkuljaem-prayers');
    if (stored) setPrayers(JSON.parse(stored));
  }, []);

  const savePrayers = (updated: Prayer[]) => {
    setPrayers(updated);
    localStorage.setItem('kkuljaem-prayers', JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!newPrayer.trim()) return;

    const prayer: Prayer = {
      id: Date.now().toString(),
      user_id: 'demo-user',
      prayer_text: newPrayer,
      is_answered: false,
      created_at: new Date().toISOString(),
    };

    savePrayers([prayer, ...prayers]);
    setNewPrayer('');
    setShowInput(false);
  };

  const toggleAnswered = (id: string) => {
    const updated = prayers.map((p) =>
      p.id === id ? { ...p, is_answered: !p.is_answered } : p
    );
    savePrayers(updated);
  };

  const deletePrayer = (id: string) => {
    savePrayers(prayers.filter((p) => p.id !== id));
  };

  const filtered = prayers.filter((p) => {
    if (filter === 'active') return !p.is_answered;
    if (filter === 'answered') return p.is_answered;
    return true;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  const activePrayers = prayers.filter((p) => !p.is_answered).length;
  const answeredPrayers = prayers.filter((p) => p.is_answered).length;

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-amber-50">
            <p className="text-2xl font-extrabold text-brown">{prayers.length}</p>
            <p className="text-xs text-stone-400 mt-0.5">전체</p>
          </div>
          <div className="bg-honey/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-amber-600">{activePrayers}</p>
            <p className="text-xs text-amber-600 mt-0.5">기도 중</p>
          </div>
          <div className="bg-green-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-extrabold text-green-600">{answeredPrayers}</p>
            <p className="text-xs text-green-600 mt-0.5">응답됨</p>
          </div>
        </div>

        {/* 새 기도 입력 */}
        {showInput ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-100 animate-slide-up space-y-3">
            <textarea
              value={newPrayer}
              onChange={(e) => setNewPrayer(e.target.value)}
              placeholder="기도 제목을 적어주세요..."
              rows={4}
              autoFocus
              className="w-full bg-cream rounded-xl p-4 border-0 focus:outline-none resize-none text-[15px] text-stone-700 leading-relaxed placeholder:text-stone-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowInput(false); setNewPrayer(''); }}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-semibold text-sm"
              >
                취소
              </button>
              <button
                onClick={handleAdd}
                disabled={!newPrayer.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm ${
                  newPrayer.trim() ? 'btn-honey' : 'bg-stone-100 text-stone-300'
                }`}
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md animate-fade-in"
          >
            + 새 기도 제목 추가
          </button>
        )}

        {/* 필터 */}
        <div className="flex bg-cream rounded-xl p-1">
          {(['all', 'active', 'answered'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                filter === f ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
              }`}
            >
              {f === 'all' ? '전체' : f === 'active' ? '기도 중 🙏' : '응답됨 ✅'}
            </button>
          ))}
        </div>

        {/* 기도 목록 */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <span className="text-5xl block mb-4">🙏</span>
              <p className="text-stone-400 font-medium">
                {filter === 'all' ? '기도 제목을 추가해보세요' : filter === 'active' ? '기도 중인 제목이 없어요' : '아직 응답된 기도가 없어요'}
              </p>
            </div>
          ) : (
            filtered.map((prayer) => (
              <div
                key={prayer.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  prayer.is_answered ? 'border-green-100 bg-green-50/30' : 'border-amber-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`text-[15px] leading-relaxed ${prayer.is_answered ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                      {prayer.prayer_text}
                    </p>
                    <p className="text-xs text-stone-400 mt-2">{formatDate(prayer.created_at)}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => toggleAnswered(prayer.id)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                        prayer.is_answered
                          ? 'bg-green-100 text-green-600'
                          : 'bg-amber-50 text-amber-500 hover:bg-amber-100'
                      }`}
                    >
                      {prayer.is_answered ? '✅' : '🙏'}
                    </button>
                    <button
                      onClick={() => deletePrayer(prayer.id)}
                      className="w-9 h-9 rounded-full bg-stone-50 flex items-center justify-center text-sm text-stone-300 hover:text-red-400 hover:bg-red-50 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
