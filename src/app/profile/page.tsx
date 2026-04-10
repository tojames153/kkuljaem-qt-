'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { useFontSize, FONT_SIZES } from '@/lib/font-size-context';
import { AgeGroup } from '@/types';

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { fontSize, setFontSize } = useFontSize();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('youth');
  const [churchName, setChurchName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    setName(user.name);
    setAgeGroup(user.age_group);
    setChurchName(user.church_name || '');
  }, [user, router]);

  // 통계 데이터
  const stats = useMemo(() => {
    if (typeof window === 'undefined') return { reflections: 0, prayers: 0, prayersAnswered: 0, streak: 0 };
    try {
      const reflections = JSON.parse(localStorage.getItem('kkuljaem-reflections') || '[]');
      const prayers = JSON.parse(localStorage.getItem('kkuljaem-prayers') || '[]');
      const streakData = JSON.parse(localStorage.getItem('kkuljaem-streak') || '{"count":0}');
      return {
        reflections: reflections.length,
        prayers: prayers.length,
        prayersAnswered: prayers.filter((p: { is_answered: boolean }) => p.is_answered).length,
        streak: streakData.count || 0,
      };
    } catch {
      return { reflections: 0, prayers: 0, prayersAnswered: 0, streak: 0 };
    }
  }, []);

  const ageOptions: { value: AgeGroup; label: string; emoji: string }[] = [
    { value: 'children', label: '어린이', emoji: '🌱' },
    { value: 'youth', label: '청소년', emoji: '🌿' },
    { value: 'young_adult', label: '청년', emoji: '🌳' },
    { value: 'senior', label: '장년', emoji: '🌾' },
    { value: 'teacher', label: '교사/교역자', emoji: '📖' },
  ];

  const ageLabel = ageOptions.find((o) => o.value === user?.age_group)?.label || '';
  const ageEmoji = ageOptions.find((o) => o.value === user?.age_group)?.emoji || '';

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setSaveError(null);
    const result = await updateProfile({
      name: name.trim(),
      age_group: ageGroup,
      church_name: churchName.trim(),
    });
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error || '프로필 저장에 실패했습니다.');
      return;
    }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!user) return null;

  const joinDate = new Date(user.created_at);
  const joinDateStr = `${joinDate.getFullYear()}년 ${joinDate.getMonth() + 1}월 ${joinDate.getDate()}일`;

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        {/* 프로필 카드 */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 rounded-2xl p-6 text-white animate-fade-in">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-white/80 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {ageEmoji} {ageLabel}
                </span>
                {user.church_name && (
                  <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    ⛪ {user.church_name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <p className="text-white/60 text-xs mt-3">가입일: {joinDateStr}</p>
        </div>

        {saved && (
          <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            프로필이 저장되었습니다!
          </div>
        )}

        {/* 나의 묵상 통계 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
          <h3 className="font-bold text-brown mb-4">나의 묵상 통계</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.streak}</p>
              <p className="text-xs text-stone-500 mt-1">연속 묵상일</p>
            </div>
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.reflections}</p>
              <p className="text-xs text-stone-500 mt-1">묵상 기록</p>
            </div>
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.prayers}</p>
              <p className="text-xs text-stone-500 mt-1">기도 제목</p>
            </div>
            <div className="bg-cream rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{stats.prayersAnswered}</p>
              <p className="text-xs text-stone-500 mt-1">응답된 기도</p>
            </div>
          </div>
        </div>

        {/* 프로필 수정 */}
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex items-center justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-honey/15 rounded-xl flex items-center justify-center text-lg">✏️</span>
              <span className="font-semibold text-brown text-sm">프로필 수정</span>
            </div>
            <svg className="w-5 h-5 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4 animate-fade-in">
            <h3 className="font-bold text-brown">프로필 수정</h3>

            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">이름</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">연령대</label>
              <div className="grid grid-cols-2 gap-2">
                {ageOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setAgeGroup(opt.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl text-left text-sm transition-all ${
                      ageGroup === opt.value
                        ? 'bg-honey/15 border-2 border-honey text-amber-700 font-semibold'
                        : 'bg-warm-white border-2 border-transparent text-stone-500'
                    }`}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-brown mb-1.5">소속 교회</label>
              <input
                type="text"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
                placeholder="교회명 (선택)"
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 transition-colors"
              />
            </div>

            {saveError && (
              <p className="text-sm text-red-500 font-medium">{saveError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setEditing(false); setSaveError(null); setName(user.name); setAgeGroup(user.age_group); setChurchName(user.church_name || ''); }}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-semibold disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 btn-honey py-3 rounded-xl font-bold shadow-md disabled:opacity-60"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* 글자 크기 조절 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
          <h3 className="font-bold text-brown mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-honey/15 rounded-lg flex items-center justify-center text-sm">Aa</span>
            글자 크기
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-stone-500">
              <span>작게</span>
              <span className="font-semibold text-amber-700">
                {FONT_SIZES.find((f) => f.value === fontSize)?.label || '보통'}
              </span>
              <span>크게</span>
            </div>
            <input
              type="range"
              min={0}
              max={FONT_SIZES.length - 1}
              step={1}
              value={FONT_SIZES.findIndex((f) => f.value === fontSize)}
              onChange={(e) => setFontSize(FONT_SIZES[Number(e.target.value)].value)}
              className="w-full h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-honey"
            />
            <p className="text-xs text-stone-400 text-center" style={{ fontSize: `${fontSize}rem` }}>
              미리보기: 오늘도 말씀과 함께 하루를 시작해요
            </p>
          </div>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-50 flex items-center gap-3 hover:bg-red-50 transition-colors"
        >
          <span className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🚪</span>
          <span className="font-semibold text-red-500 text-sm">로그아웃</span>
        </button>
      </div>
    </AppShell>
  );
}
