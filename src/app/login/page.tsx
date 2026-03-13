'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, demoLogin, user } = useAuth();

  // 이미 로그인된 경우 홈으로
  if (user) {
    router.push('/');
    return null;
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    if (!supabase) {
      // 데모 모드: localStorage 기반 로그인
      const result = login(email, password);
      if (!result.success) {
        setError(result.error || '로그인에 실패했습니다.');
        setLoading(false);
        return;
      }
      router.push('/');
      return;
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError('로그인에 실패했습니다. 다시 시도해주세요.');
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

  const handleGoogleLogin = async () => {
    const supabase = createClient();
    if (!supabase) {
      setError('Google 로그인은 Supabase 연결 후 사용 가능합니다. 체험하기를 이용해주세요.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
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

          {error && (
            <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-honey py-4 rounded-2xl font-bold text-base shadow-md mt-2"
          >
            {loading ? '로그인 중...' : '이메일로 로그인'}
          </button>
        </form>

        {/* 구분선 */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-amber-100" />
          <span className="text-xs text-stone-400">또는</span>
          <div className="flex-1 h-px bg-amber-100" />
        </div>

        {/* Google 로그인 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white py-3.5 rounded-2xl font-semibold text-sm text-stone-700 border-2 border-stone-200 hover:border-stone-300 transition-colors flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google로 로그인
        </button>

        {/* 데모 입장 */}
        <button
          onClick={handleDemoLogin}
          className="w-full bg-cream py-3.5 rounded-2xl font-semibold text-sm text-amber-700 mt-3 hover:bg-amber-50 transition-colors"
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
