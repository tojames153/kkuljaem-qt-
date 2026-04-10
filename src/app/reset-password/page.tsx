'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function ResetPasswordPage() {
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { resetPassword } = useAuth();

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setStep('reset');
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword.trim()) {
      setError('새 비밀번호를 입력해주세요.');
      return;
    }

    if (newPassword.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, newPassword);
    setLoading(false);

    if (!result.success) {
      setError(result.error || '비밀번호 재설정에 실패했습니다.');
      return;
    }

    router.push('/login?reset=success');
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* 상단 장식 */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 pt-16 pb-12 px-6 rounded-b-[3rem]">
        <div className="max-w-lg mx-auto text-center text-white">
          <div className="text-5xl mb-4">🔑</div>
          <h1 className="text-3xl font-extrabold">비밀번호 재설정</h1>
          <p className="text-white/80 text-sm mt-2">
            {step === 'email' ? '가입한 이메일을 입력해주세요' : '새 비밀번호를 설정해주세요'}
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-6 py-8 flex-1">
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="가입할 때 사용한 이메일"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
            >
              다음
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-700">
              <span className="font-semibold">{email}</span> 계정의 비밀번호를 재설정합니다.
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6자 이상"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 한 번 더 입력"
                className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
            >
              {loading ? '재설정 중...' : '비밀번호 재설정'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); }}
              className="w-full text-sm text-stone-400 hover:text-stone-600 py-2"
            >
              이메일 다시 입력
            </button>
          </form>
        )}

        <p className="text-center text-sm text-stone-400 mt-6">
          <Link href="/login" className="text-amber-600 font-semibold hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
