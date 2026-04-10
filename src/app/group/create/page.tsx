'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { createGroup } from '@/lib/group-helpers';

export default function GroupCreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [groupType, setGroupType] = useState<'church' | 'small_group'>('small_group');
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // 소그룹 전용
  const [maxMembers, setMaxMembers] = useState(12);
  const [meetingDay, setMeetingDay] = useState('');
  const [meetingTime, setMeetingTime] = useState('');

  // 교회 전용
  const [pastorName, setPastorName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  if (!user) {
    router.push('/login');
    return null;
  }

  async function handleSubmit() {
    if (!groupName.trim()) {
      setError('그룹명을 입력해주세요.');
      return;
    }

    setCreating(true);
    setError('');

    const result = await createGroup({
      group_type: groupType,
      group_name: groupName.trim(),
      description: description.trim(),
      created_by: user!.id,
      creator_name: user!.name,
      ...(groupType === 'small_group' ? {
        max_members: maxMembers,
        meeting_day: meetingDay || undefined,
        meeting_time: meetingTime || undefined,
      } : {
        pastor_name: pastorName || undefined,
        address: address || undefined,
        phone: phone || undefined,
      }),
    });

    setCreating(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.group) {
      router.push(`/group/${result.group.id}`);
    }
  }

  const dayOptions = ['월', '화', '수', '목', '금', '토', '일'];

  return (
    <AppShell>
      <div className="pt-4 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-stone-400 hover:text-stone-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-brown">새 그룹 만들기</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            {error}
          </div>
        )}

        {/* 그룹 타입 선택 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4">
          <label className="block text-sm font-bold text-brown">그룹 종류</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setGroupType('small_group')}
              className={`p-4 rounded-xl text-center transition-all ${
                groupType === 'small_group'
                  ? 'bg-green-50 border-2 border-green-400 text-green-700'
                  : 'bg-warm-white border-2 border-transparent text-stone-400'
              }`}
            >
              <span className="text-2xl block mb-1">👥</span>
              <span className="text-sm font-semibold">소그룹</span>
              <p className="text-[10px] mt-1 opacity-70">성경공부, 셀모임 등</p>
            </button>
            <button
              onClick={() => setGroupType('church')}
              className={`p-4 rounded-xl text-center transition-all ${
                groupType === 'church'
                  ? 'bg-blue-50 border-2 border-blue-400 text-blue-700'
                  : 'bg-warm-white border-2 border-transparent text-stone-400'
              }`}
            >
              <span className="text-2xl block mb-1">⛪</span>
              <span className="text-sm font-semibold">교회</span>
              <p className="text-[10px] mt-1 opacity-70">교회 전체 공동체</p>
            </button>
          </div>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4">
          <div>
            <label className="block text-sm font-bold text-brown mb-1.5">
              {groupType === 'church' ? '교회명' : '그룹명'}
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={groupType === 'church' ? '예: 사랑의교회' : '예: 청년부 셀모임'}
              className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-brown mb-1.5">소개 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="그룹을 소개해주세요"
              rows={2}
              className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 text-sm resize-none"
            />
          </div>
        </div>

        {/* 소그룹 추가 정보 */}
        {groupType === 'small_group' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-brown">소그룹 설정</h3>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">최대 인원</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={2}
                  max={30}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="flex-1 h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-honey"
                />
                <span className="text-sm font-bold text-amber-700 w-10 text-right">{maxMembers}명</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">모임 요일 (선택)</label>
              <div className="flex gap-2">
                {dayOptions.map((day) => (
                  <button
                    key={day}
                    onClick={() => setMeetingDay(meetingDay === day ? '' : day)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                      meetingDay === day
                        ? 'bg-honey text-white'
                        : 'bg-warm-white text-stone-400'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">모임 시간 (선택)</label>
              <input
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
                className="bg-warm-white rounded-xl px-4 py-2.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 text-sm"
              />
            </div>
          </div>
        )}

        {/* 교회 추가 정보 */}
        {groupType === 'church' && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-brown">교회 정보</h3>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">담임목사 (선택)</label>
              <input
                type="text"
                value={pastorName}
                onChange={(e) => setPastorName(e.target.value)}
                placeholder="예: 홍길동 목사"
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">주소 (선택)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 서울특별시 강남구..."
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1.5">전화번호 (선택)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="예: 02-1234-5678"
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 placeholder:text-stone-300 text-sm"
              />
            </div>

            <p className="text-[10px] text-stone-400">
              * 교회명으로 유일성을 확인합니다. 동일 이름의 교회가 이미 등록되어 있으면 가입을 통해 참여해주세요.
            </p>
          </div>
        )}

        {/* 생성 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={creating || !groupName.trim()}
          className={`w-full btn-honey py-3.5 rounded-xl font-bold text-base shadow-lg transition-all ${
            creating || !groupName.trim() ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {creating ? '생성 중...' : groupType === 'church' ? '교회 등록하기' : '소그룹 만들기'}
        </button>
      </div>
    </AppShell>
  );
}
