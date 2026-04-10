'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import { getTodayDevotional } from '@/lib/sample-devotional';
import { Devotional, Visibility, Reflection } from '@/types';
import { useAuth } from '@/lib/auth-context';

// 아빠(관리자)가 설정한 추천 질문 풀
const recommendedQuestions = [
  '오늘 말씀에서 하나님이 나에게 하시는 말씀은 무엇인가요?',
  '이 말씀을 통해 회개할 것이 있나요?',
  '오늘 말씀을 삶에서 어떻게 실천할 수 있을까요?',
  '이 말씀에서 감사한 것은 무엇인가요?',
  '이 말씀을 누구에게 나누고 싶나요? 왜 그런가요?',
  '오늘 말씀이 나의 현재 상황과 어떻게 연결되나요?',
  '이 말씀에서 하나님의 성품을 무엇으로 발견했나요?',
  '이 말씀을 읽고 기도하고 싶은 것은 무엇인가요?',
  '오늘 말씀에서 가장 마음에 와닿는 구절은 무엇인가요?',
  '이 말씀대로 살기 어려운 점은 무엇이며, 어떻게 극복할 수 있을까요?',
];

interface QuestionAnswer {
  question: string;
  answer: string;
  isCustom: boolean; // 사용자가 직접 입력한 질문인지
}

export default function ReflectionPage() {
  const { user } = useAuth();
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [visibility, setVisibility] = useState<Visibility>('private');
  const [saved, setSaved] = useState(false);
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');

  // 질문별 답변 관리
  const [qaPairs, setQaPairs] = useState<QuestionAnswer[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');

  useEffect(() => {
    const dev = getTodayDevotional();
    setDevotional(dev);

    // 기본 질문 3개로 초기화
    if (dev) {
      setQaPairs([
        { question: dev.question1, answer: '', isCustom: false },
        { question: dev.question2, answer: '', isCustom: false },
        { question: dev.question3, answer: '', isCustom: false },
      ]);
    }

    const stored = localStorage.getItem('kkuljaem-reflections');
    if (stored) setReflections(JSON.parse(stored));
  }, []);

  const updateAnswer = (index: number, answer: string) => {
    setQaPairs(prev => prev.map((qa, i) => i === index ? { ...qa, answer } : qa));
  };

  const updateQuestion = (index: number, question: string) => {
    setQaPairs(prev => prev.map((qa, i) => i === index ? { ...qa, question, isCustom: true } : qa));
  };

  const addRecommendedQuestion = (question: string) => {
    setQaPairs(prev => [...prev, { question, answer: '', isCustom: false }]);
    setShowRecommendations(false);
  };

  const addCustomQuestion = () => {
    if (!customQuestion.trim()) return;
    setQaPairs(prev => [...prev, { question: customQuestion.trim(), answer: '', isCustom: true }]);
    setCustomQuestion('');
  };

  const removeQuestion = (index: number) => {
    if (qaPairs.length <= 1) return;
    setQaPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const hasContent = qaPairs.some(qa => qa.answer.trim());
    if (!hasContent || !devotional) return;

    // 질문+답변을 하나의 텍스트로 저장 (구분자 사용)
    const reflectionText = qaPairs
      .filter(qa => qa.answer.trim())
      .map(qa => `[Q] ${qa.question}\n[A] ${qa.answer}`)
      .join('\n\n');

    const newReflection: Reflection = {
      id: Date.now().toString(),
      user_id: user?.id || 'demo-user',
      devotional_id: devotional.id,
      reflection_text: reflectionText,
      visibility,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newReflection, ...reflections];
    setReflections(updated);
    localStorage.setItem('kkuljaem-reflections', JSON.stringify(updated));

    // 공유 묵상이면 서버에도 저장 (다른 사용자에게 보이도록)
    if (visibility !== 'private') {
      fetch('/api/shared-reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newReflection.id,
          user_id: user?.id || 'demo-user',
          user_name: user?.name || '익명',
          devotional_id: devotional.id,
          reflection_text: reflectionText,
          visibility,
        }),
      }).catch(() => { /* 서버 실패해도 localStorage에는 저장됨 */ });
    }

    setSaved(true);
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

  // 저장된 Q&A 포맷 파싱
  const parseReflection = (text: string) => {
    const pairs = text.split('\n\n').filter(Boolean);
    return pairs.map(pair => {
      const lines = pair.split('\n');
      const q = lines.find(l => l.startsWith('[Q] '))?.replace('[Q] ', '') || '';
      const a = lines.find(l => l.startsWith('[A] '))?.replace('[A] ', '') || '';
      if (q && a) return { q, a };
      return null;
    }).filter(Boolean) as { q: string; a: string }[];
  };

  const totalChars = qaPairs.reduce((sum, qa) => sum + qa.answer.length, 0);
  const hasContent = qaPairs.some(qa => qa.answer.trim());

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

            {/* 질문별 답변 칸 */}
            <div className="space-y-4">
              {qaPairs.map((qa, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
                  {/* 질문 영역 */}
                  <div className="flex items-start gap-2 mb-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-honey/20 text-amber-700 text-sm font-bold rounded-full flex items-center justify-center mt-0.5">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      {qa.isCustom ? (
                        <input
                          type="text"
                          value={qa.question}
                          onChange={(e) => updateQuestion(index, e.target.value)}
                          className="w-full text-stone-700 text-[15px] font-medium bg-transparent border-b border-dashed border-amber-200 focus:border-amber-400 focus:outline-none pb-1"
                          placeholder="질문을 입력하세요..."
                        />
                      ) : (
                        <p className="text-stone-700 text-[15px] font-medium">{qa.question}</p>
                      )}
                    </div>
                    {qaPairs.length > 1 && (
                      <button
                        onClick={() => removeQuestion(index)}
                        className="flex-shrink-0 w-6 h-6 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* 답변 영역 */}
                  <div className="relative">
                    <textarea
                      value={qa.answer}
                      onChange={(e) => updateAnswer(index, e.target.value)}
                      placeholder="이 질문에 대한 묵상을 적어보세요..."
                      rows={4}
                      className="w-full bg-amber-50/30 rounded-xl p-3 border border-amber-100 focus:border-honey focus:outline-none resize-none text-[14px] text-stone-700 leading-relaxed placeholder:text-stone-300 transition-colors"
                    />
                    <span className="absolute bottom-2 right-3 text-[10px] text-stone-300">
                      {qa.answer.length}자
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* 질문 추가 영역 */}
            <div className="space-y-2">
              <div className="flex gap-2">
                {/* 추천 질문 받기 */}
                <button
                  onClick={() => setShowRecommendations(!showRecommendations)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    showRecommendations
                      ? 'border-honey bg-honey/10 text-amber-700'
                      : 'border-amber-100 bg-white text-stone-500 hover:border-amber-200'
                  }`}
                >
                  💡 질문 추천받기
                </button>
                {/* 자유 질문 추가 */}
                <button
                  onClick={() => setQaPairs(prev => [...prev, { question: '', answer: '', isCustom: true }])}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold border-2 border-amber-100 bg-white text-stone-500 hover:border-amber-200 transition-all"
                >
                  ✏️ 내가 질문 만들기
                </button>
              </div>

              {/* 추천 질문 목록 */}
              {showRecommendations && (
                <div className="bg-amber-50/50 rounded-2xl p-4 space-y-2 animate-fade-in border border-amber-100">
                  <p className="text-xs font-semibold text-amber-700 mb-2">추천 질문을 선택하세요</p>
                  {recommendedQuestions
                    .filter(q => !qaPairs.some(qa => qa.question === q))
                    .map((q, i) => (
                    <button
                      key={i}
                      onClick={() => addRecommendedQuestion(q)}
                      className="w-full text-left p-3 bg-white rounded-xl text-sm text-stone-600 hover:bg-amber-50 hover:text-amber-700 transition-all border border-transparent hover:border-amber-200"
                    >
                      + {q}
                    </button>
                  ))}
                </div>
              )}
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
            <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
              <span>총 {totalChars}자</span>
              <span>{qaPairs.filter(qa => qa.answer.trim()).length}/{qaPairs.length} 질문 답변 완료</span>
            </div>
            <button
              onClick={handleSave}
              disabled={!hasContent}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
                hasContent
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
              reflections.map((r) => {
                const parsed = parseReflection(r.reflection_text);
                const isQaFormat = parsed.length > 0;

                return (
                  <div key={r.id} className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-stone-400">{formatDate(r.created_at)}</span>
                      <div className="flex items-center gap-2">
                        <select
                          value={r.visibility}
                          onChange={(e) => {
                            const newVis = e.target.value as Visibility;
                            const oldVis = r.visibility;
                            const updated = reflections.map((ref) =>
                              ref.id === r.id ? { ...ref, visibility: newVis, updated_at: new Date().toISOString() } : ref
                            );
                            setReflections(updated);
                            localStorage.setItem('kkuljaem-reflections', JSON.stringify(updated));

                            // 서버 동기화: private→공유 시 서버에 추가, 공유→private 시 서버에서 삭제
                            if (newVis !== 'private' && oldVis === 'private') {
                              fetch('/api/shared-reflections', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: r.id, user_id: user?.id, user_name: user?.name,
                                  devotional_id: r.devotional_id, reflection_text: r.reflection_text, visibility: newVis,
                                }),
                              }).catch(() => {});
                            } else if (newVis === 'private' && oldVis !== 'private') {
                              fetch(`/api/shared-reflections?id=${r.id}&user_id=${user?.id}`, { method: 'DELETE' }).catch(() => {});
                            }
                          }}
                          className="text-xs bg-cream px-2 py-0.5 rounded-full text-stone-500 border-none focus:outline-none cursor-pointer appearance-none"
                          style={{ backgroundImage: 'none' }}
                        >
                          <option value="private">{visibilityLabels.private.icon} {visibilityLabels.private.label}</option>
                          <option value="group">{visibilityLabels.group.icon} {visibilityLabels.group.label}</option>
                          <option value="church">{visibilityLabels.church.icon} {visibilityLabels.church.label}</option>
                        </select>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-xs text-stone-300 hover:text-red-400 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {isQaFormat ? (
                      <div className="space-y-3">
                        {parsed.map((pair, i) => (
                          <div key={i}>
                            <p className="text-xs text-amber-600 font-semibold mb-1">Q. {pair.q}</p>
                            <p className="text-stone-700 text-sm leading-relaxed bg-cream rounded-lg p-3">{pair.a}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-stone-700 text-sm leading-relaxed">{r.reflection_text}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
