'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { AgeGroup } from '@/types';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('youth');
  const [churchName, setChurchName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const ageOptions: { value: AgeGroup; label: string; emoji: string; desc: string }[] = [
    { value: 'children', label: '초등학생', emoji: '🌱', desc: '쉽고 재미있는 묵상' },
    { value: 'youth', label: '중고등학생', emoji: '🌿', desc: '질문과 함께하는 묵상' },
    { value: 'young_adult', label: '청년', emoji: '🌳', desc: '깊이 있는 영적 묵상' },
    { value: 'teacher', label: '교사/교역자', emoji: '📖', desc: '교육 자료와 함께' },
  ];

  const handleSignup = async () => {
    setError('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      // 데모 모드
      router.push('/');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            age_group: ageGroup,
            church_name: churchName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('이미 가입된 이메일입니다.');
        } else {
          setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* 상단 */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 pt-12 pb-8 px-6 rounded-b-[3rem]">
        <div className="max-w-lg mx-auto text-white">
          <Link href="/login" className="inline-flex items-center text-white/80 mb-4">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            돌아가기
          </Link>
          <h1 className="text-2xl font-extrabold">회원가입</h1>
          <p className="text-white/80 text-sm mt-1">꿀잼QT와 함께 묵상을 시작해요!</p>
          {/* 단계 표시 */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full flex-1 transition-all ${
                  s <= step ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-6 py-6 flex-1">
        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-brown">기본 정보를 입력해주세요</h2>
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력하세요"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>
            <button
              onClick={() => {
                if (!name.trim() || !email.trim() || password.length < 6) {
                  setError('모든 필드를 올바르게 입력해주세요. (비밀번호 6자 이상)');
                  return;
                }
                setError('');
                setStep(2);
              }}
              className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
            >
              다음 →
            </button>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}
          </div>
        )}

        {/* Step 2: 연령대 선택 */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-brown">연령대를 선택해주세요</h2>
            <p className="text-sm text-stone-500">연령에 맞는 묵상 콘텐츠를 제공해 드려요</p>
            <div className="space-y-3">
              {ageOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAgeGroup(opt.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all text-left ${
                    ageGroup === opt.value
                      ? 'bg-honey/15 border-2 border-honey shadow-sm'
                      : 'bg-white border-2 border-transparent shadow-sm hover:border-amber-100'
                  }`}
                >
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <p className="font-bold text-brown">{opt.label}</p>
                    <p className="text-xs text-stone-500">{opt.desc}</p>
                  </div>
                  {ageGroup === opt.value && (
                    <span className="ml-auto text-honey font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3.5 rounded-2xl bg-stone-100 text-stone-500 font-semibold"
              >
                ← 이전
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 btn-honey py-3.5 rounded-2xl font-bold shadow-md"
              >
                다음 →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 교회 정보 */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-brown">소속 교회를 알려주세요</h2>
            <p className="text-sm text-stone-500">공동체 묵상에서 교회 친구들과 함께할 수 있어요</p>
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">교회명</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="교회 이름을 입력하세요 (선택)"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3.5 rounded-2xl bg-stone-100 text-stone-500 font-semibold"
              >
                ← 이전
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 btn-honey py-3.5 rounded-2xl font-bold shadow-md"
              >
                {loading ? '가입 중...' : '가입 완료 🎉'}
              </button>
            </div>

            <button
              onClick={handleSignup}
              className="w-full text-center text-sm text-stone-400 mt-2"
            >
              교회 없이 가입하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
