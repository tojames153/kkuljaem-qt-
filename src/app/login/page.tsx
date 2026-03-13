'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const REMEMBER_KEY = 'kkuljaem-remember-email';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberEmail, setRememberEmail] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, demoLogin, user } = useAuth();

  // 저장된 이메일 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(REMEMBER_KEY);
      if (saved) {
        setEmail(saved);
        setRememberEmail(true);
      }
    } catch {}
  }, []);

  // 이미 로그인된 경우 홈으로
  if (user) {
    router.push('/');
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);

    // 이메일 기억하기
    try {
      if (rememberEmail) {
        localStorage.setItem(REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
    } catch {}

    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || '로그인에 실패했습니다.');
      setLoading(false);
      return;
    }
    router.push('/');
  };

  const handleDemoLogin = () => {
    demoLogin();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col">
      {/* 상단 장식 */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 pt-16 pb-12 px-6 rounded-b-[3rem]">
        <div className="max-w-lg mx-auto text-center text-white">
          <div className="text-5xl mb-4">🍯</div>
          <h1 className="text-3xl font-extrabold">꿀잼QT</h1>
          <p className="text-white/80 text-sm mt-2">매일 5분, 달콤한 말씀 묵상</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto w-full px-6 py-8 flex-1">
        <form onSubmit={handleEmailLogin} className="space-y-4">
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
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-white rounded-xl px-4 py-3.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
            />
          </div>

          {/* 이메일 기억하기 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-400"
            />
            <span className="text-sm text-stone-500">이메일 기억하기</span>
          </label>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-amber-100" />
          <span className="text-xs text-stone-400">또는</span>
          <div className="flex-1 h-px bg-amber-100" />
        </div>

        {/* 데모 입장 */}
        <button
          onClick={handleDemoLogin}
          className="w-full bg-cream py-3.5 rounded-2xl font-semibold text-sm text-amber-700 hover:bg-amber-50 transition-colors"
        >
          🍯 체험해보기 (로그인 없이)
        </button>

        {/* 회원가입 링크 */}
        <p className="text-center text-sm text-stone-400 mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-amber-600 font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
