'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { Suspense } from 'react';

function AiCoachContent() {
  const searchParams = useSearchParams();
  const [reflectionText, setReflectionText] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ prompt: string; response: string; date: string }[]>([]);

  useEffect(() => {
    const textFromParam = searchParams.get('text');
    if (textFromParam) setReflectionText(textFromParam);

    const stored = localStorage.getItem('kkuljaem-ai-logs');
    if (stored) setHistory(JSON.parse(stored));
  }, [searchParams]);

  const handleAsk = async () => {
    if (!reflectionText.trim()) return;
    setLoading(true);

    // 데모용 AI 응답 (실제 배포 시 OpenAI API 연결)
    await new Promise((r) => setTimeout(r, 1500));

    const demoResponse = generateDemoResponse(reflectionText);
    setResponse(demoResponse);

    const newLog = {
      prompt: reflectionText,
      response: demoResponse,
      date: new Date().toISOString(),
    };
    const updated = [newLog, ...history];
    setHistory(updated);
    localStorage.setItem('kkuljaem-ai-logs', JSON.stringify(updated));
    setLoading(false);
  };

  return (
    <div className="pt-4 space-y-5">
      {/* 소개 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-honey/20 rounded-2xl flex items-center justify-center text-2xl">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-brown">AI 묵상 코치</h3>
            <p className="text-xs text-stone-500">따뜻한 영성 상담가 스타일로 응답해요</p>
          </div>
        </div>
        <p className="text-sm text-stone-600 leading-relaxed">
          묵상하면서 느낀 점이나 질문을 적어주세요. 공감, 영적 통찰, 추가 묵상 질문, 기도문으로 응답해 드려요.
        </p>
      </div>

      {/* 입력 */}
      <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <textarea
          value={reflectionText}
          onChange={(e) => setReflectionText(e.target.value)}
          placeholder="오늘 묵상하면서 느낀 것, 궁금한 것을 적어보세요..."
          rows={5}
          className="w-full bg-white rounded-2xl p-5 border-2 border-amber-100 focus:border-honey focus:outline-none resize-none text-[15px] text-stone-700 leading-relaxed placeholder:text-stone-300 transition-colors"
        />
        <button
          onClick={handleAsk}
          disabled={!reflectionText.trim() || loading}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
            reflectionText.trim() && !loading
              ? 'btn-honey shadow-md'
              : 'bg-stone-100 text-stone-300 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              코치가 응답하고 있어요...
            </span>
          ) : (
            '🤖 AI 코치에게 질문하기'
          )}
        </button>
      </div>

      {/* AI 응답 */}
      {response && (
        <div className="space-y-4 animate-slide-up">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-50">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-honey/20 rounded-full flex items-center justify-center text-sm">
                🤖
              </div>
              <span className="font-semibold text-brown text-sm">AI 묵상 코치</span>
            </div>
            <div className="space-y-4 text-[15px] text-stone-700 leading-relaxed whitespace-pre-line">
              {response}
            </div>
          </div>
        </div>
      )}

      {/* 이전 기록 */}
      {history.length > 0 && !response && (
        <div className="space-y-3">
          <h3 className="font-semibold text-brown text-sm">이전 코칭 기록</h3>
          {history.slice(0, 5).map((log, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
              <p className="text-xs text-stone-400 mb-2">
                {new Date(log.date).toLocaleDateString('ko-KR')}
              </p>
              <p className="text-sm text-stone-600 line-clamp-2 mb-2">
                <span className="font-medium">나:</span> {log.prompt}
              </p>
              <p className="text-sm text-amber-700 line-clamp-3">
                <span className="font-medium">코치:</span> {log.response.slice(0, 100)}...
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function generateDemoResponse(text: string): string {
  return `💛 공감 한 문장
당신의 묵상 속에서 하나님을 향한 진실한 마음이 느껴져요. 그 솔직함이 참 아름답습니다.

📖 영적 통찰
${text.length > 20 ? '당신이 나눈 이야기 속에서' : '묵상 가운데'} 하나님의 은혜가 역사하고 계심을 봅니다. 성경은 "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라"(살전 5:16-18)고 말씀하십니다. 오늘의 묵상이 당신의 삶 속에서 하나님의 임재를 더 깊이 경험하는 시간이 되길 바랍니다.

때로는 말씀이 머리로는 이해되지만 마음으로 와닿지 않을 때가 있어요. 그럴 때일수록 조용히 하나님 앞에 머무는 것이 중요합니다.

💭 추가 묵상 질문
1. 오늘 말씀 중 가장 마음에 남는 한 구절은 무엇인가요?
2. 이 말씀을 통해 하나님이 나에게 하시는 말씀은 무엇일까요?
3. 내일 하루를 이 말씀으로 살아간다면, 무엇이 달라질까요?

🙏 기도문
사랑의 하나님, 오늘도 말씀 앞에 나아온 이 귀한 자녀를 축복해 주세요. 묵상 가운데 깨달은 것들이 삶 속에서 열매 맺게 하시고, 날마다 주님과 더 깊은 교제를 누리게 하소서. 예수님의 이름으로 기도합니다. 아멘.`;
}

export default function AiCoachPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="pt-4 text-center text-stone-400">로딩 중...</div>}>
        <AiCoachContent />
      </Suspense>
    </AppShell>
  );
}
