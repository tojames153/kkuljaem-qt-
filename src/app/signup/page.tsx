'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { AgeGroup } from '@/types';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('youth');
  const [churchName, setChurchName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const ageOptions: { value: AgeGroup; label: string; emoji: string; desc: string }[] = [
    { value: 'children', label: '어린이', emoji: '🌱', desc: '쉽고 재미있는 묵상' },
    { value: 'youth', label: '청소년', emoji: '🌿', desc: '질문과 함께하는 묵상' },
    { value: 'young_adult', label: '청년', emoji: '🌳', desc: '깊이 있는 영적 묵상' },
    { value: 'teacher', label: '교사/교역자', emoji: '📖', desc: '교육 자료와 함께' },
  ];

  const validateStep1 = () => {
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return false;
    }
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return false;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    return true;
  };

  const handleSignup = () => {
    setError('');
    setLoading(true);

    const result = signup({
      name: name.trim(),
      email: email.trim(),
      password,
      age_group: ageGroup,
      church_name: churchName.trim(),
    });

    if (!result.success) {
      setError(result.error || '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    router.push('/');
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
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={() => {
                setError('');
                if (validateStep1()) {
                  setStep(2);
                }
              }}
              className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
            >
              다음
            </button>
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
                onClick={() => { setError(''); setStep(1); }}
                className="flex-1 py-3.5 rounded-2xl bg-stone-100 text-stone-500 font-semibold"
              >
                이전
              </button>
              <button
                onClick={() => { setError(''); setStep(3); }}
                className="flex-1 btn-honey py-3.5 rounded-2xl font-bold shadow-md"
              >
                다음
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
              <label className="block text-sm font-semibold text-brown mb-1.5">교회명 (선택)</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="예: 사랑의교회, 온누리교회"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
              <p className="text-xs text-stone-400 mt-1.5">교회명은 나중에 프로필에서 수정할 수 있어요</p>
            </div>

            {/* 가입 정보 확인 */}
            <div className="bg-amber-50/50 rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-amber-700 mb-2">가입 정보 확인</p>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">이름</span>
                <span className="text-brown font-medium">{name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">이메일</span>
                <span className="text-brown font-medium">{email}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-500">연령대</span>
                <span className="text-brown font-medium">
                  {ageOptions.find(o => o.value === ageGroup)?.label}
                </span>
              </div>
              {churchName.trim() && (
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">교회</span>
                  <span className="text-brown font-medium">{churchName}</span>
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setError(''); setStep(2); }}
                className="flex-1 py-3.5 rounded-2xl bg-stone-100 text-stone-500 font-semibold"
              >
                이전
              </button>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="flex-1 btn-honey py-3.5 rounded-2xl font-bold shadow-md"
              >
                {loading ? '가입 중...' : '가입 완료'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
