'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { fetchGroupDetail, leaveGroup, deleteGroup } from '@/lib/group-helpers';
import { Group, SmallGroup, ChurchGroup, GroupMember } from '@/types';

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<Group | SmallGroup | ChurchGroup | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editMaxMembers, setEditMaxMembers] = useState(12);
  const [editMeetingDay, setEditMeetingDay] = useState('');
  const [editMeetingTime, setEditMeetingTime] = useState('');
  const [showTransferLeader, setShowTransferLeader] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadGroup();
  }, [user, router, groupId]);

  async function loadGroup() {
    setLoading(true);
    const result = await fetchGroupDetail(groupId);
    if (result.error) {
      setError(result.error);
    } else {
      setGroup(result.group || null);
      setMembers(result.members || []);
    }
    setLoading(false);
  }

  const myMembership = members.find((m) => m.user_id === user?.id);
  const isLeader = myMembership?.role === 'leader' || myMembership?.role === 'admin';
  const isCreator = group?.created_by === user?.id;

  function openEditSettings() {
    if (!group) return;
    setEditName(group.group_name);
    setEditDesc(group.description);
    if (group.group_type === 'small_group') {
      const sg = group as SmallGroup;
      setEditMaxMembers(sg.max_members || 12);
      setEditMeetingDay(sg.meeting_day || '');
      setEditMeetingTime(sg.meeting_time || '');
    }
    setShowEditSettings(true);
  }

  async function handleSaveSettings() {
    if (!group || !user) return;
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(group.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          group_name: editName.trim(),
          description: editDesc.trim(),
          ...(group.group_type === 'small_group' ? {
            max_members: editMaxMembers,
            meeting_day: editMeetingDay,
            meeting_time: editMeetingTime,
          } : {}),
        }),
      });
      const data = await res.json();
      if (data.group) {
        setGroup(data.group);
        setActionMsg('설정이 저장되었습니다!');
      } else {
        setActionMsg(data.error || '저장에 실패했습니다.');
      }
    } catch {
      // localStorage 폴백
      const stored = JSON.parse(localStorage.getItem('kkuljaem-groups') || '{}');
      if (stored[group.id]) {
        stored[group.id] = { ...stored[group.id], group_name: editName.trim(), description: editDesc.trim(), ...(group.group_type === 'small_group' ? { max_members: editMaxMembers, meeting_day: editMeetingDay, meeting_time: editMeetingTime } : {}) };
        localStorage.setItem('kkuljaem-groups', JSON.stringify(stored));
        setGroup(stored[group.id]);
        setActionMsg('설정이 저장되었습니다!');
      }
    }
    setShowEditSettings(false);
    setTimeout(() => setActionMsg(''), 2500);
  }

  async function handleTransferLeader(targetUserId: string) {
    if (!group || !user) return;
    try {
      // 대상을 리더로 변경
      await fetch(`/api/groups/${encodeURIComponent(group.id)}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, target_user_id: targetUserId, new_role: 'leader' }),
      });
      // 기존 리더를 멤버로 변경
      await fetch(`/api/groups/${encodeURIComponent(group.id)}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, target_user_id: user.id, new_role: 'member' }),
      });
    } catch {
      // localStorage 폴백
      const storedMembers = JSON.parse(localStorage.getItem('kkuljaem-group-members') || '{}');
      if (storedMembers[group.id]) {
        storedMembers[group.id] = storedMembers[group.id].map((m: GroupMember) => {
          if (m.user_id === targetUserId) return { ...m, role: 'leader' };
          if (m.user_id === user.id) return { ...m, role: 'member' };
          return m;
        });
        localStorage.setItem('kkuljaem-group-members', JSON.stringify(storedMembers));
      }
    }
    setShowTransferLeader(false);
    setActionMsg('리더가 위임되었습니다!');
    setTimeout(() => setActionMsg(''), 2500);
    loadGroup();
  }

  async function handleLeave() {
    if (!user || !group) return;
    const result = await leaveGroup(group.id, user.id);
    if (result.success) {
      router.push('/group');
    } else {
      setActionMsg(result.error || '탈퇴에 실패했습니다.');
      setTimeout(() => setActionMsg(''), 2500);
    }
  }

  async function handleDelete() {
    if (!user || !group) return;
    const result = await deleteGroup(group.id, user.id);
    if (result.success) {
      router.push('/group');
    } else {
      setActionMsg(result.error || '삭제에 실패했습니다.');
      setTimeout(() => setActionMsg(''), 2500);
    }
  }

  if (!user) return null;

  if (loading) {
    return (
      <AppShell>
        <div className="pt-4 text-center text-stone-400 py-20">불러오는 중...</div>
      </AppShell>
    );
  }

  if (error || !group) {
    return (
      <AppShell>
        <div className="pt-4 text-center py-20">
          <p className="text-red-500 text-sm">{error || '그룹을 찾을 수 없습니다.'}</p>
          <button onClick={() => router.push('/group')} className="mt-4 text-amber-600 text-sm font-semibold">
            그룹 목록으로
          </button>
        </div>
      </AppShell>
    );
  }

  const isChurch = group.group_type === 'church';
  const churchInfo = isChurch ? group as ChurchGroup : null;
  const smallGroupInfo = !isChurch ? group as SmallGroup : null;

  const roleLabel = (role: string) => {
    switch (role) {
      case 'leader': return '리더';
      case 'admin': return '관리자';
      default: return '멤버';
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'leader': return 'bg-amber-100 text-amber-700';
      case 'admin': return 'bg-blue-100 text-blue-700';
      default: return 'bg-stone-100 text-stone-500';
    }
  };

  return (
    <AppShell>
      <div className="pt-4 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/group')} className="text-stone-400 hover:text-stone-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-brown flex-1 truncate">{group.group_name}</h1>
        </div>

        {actionMsg && (
          <div className="bg-yellow-50 text-yellow-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            {actionMsg}
          </div>
        )}

        {/* 그룹 정보 카드 */}
        <div className={`rounded-2xl p-6 text-white animate-fade-in ${
          isChurch
            ? 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-500'
            : 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{isChurch ? '⛪' : '👥'}</span>
            <div>
              <h2 className="text-lg font-bold">{group.group_name}</h2>
              <p className="text-white/70 text-xs">{isChurch ? '교회' : '소그룹'}</p>
            </div>
          </div>

          {group.description && (
            <p className="text-white/80 text-sm mb-3">{group.description}</p>
          )}

          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-white/60">멤버</span>
              <span className="ml-1 font-bold">{group.member_count}명</span>
            </div>
            {smallGroupInfo?.max_members && (
              <div>
                <span className="text-white/60">최대</span>
                <span className="ml-1 font-bold">{smallGroupInfo.max_members}명</span>
              </div>
            )}
            {smallGroupInfo?.meeting_day && (
              <div>
                <span className="text-white/60">모임</span>
                <span className="ml-1 font-bold">
                  {smallGroupInfo.meeting_day}{smallGroupInfo.meeting_time ? ` ${smallGroupInfo.meeting_time}` : ''}
                </span>
              </div>
            )}
          </div>

          {churchInfo && (
            <div className="mt-3 space-y-1 text-sm">
              {churchInfo.pastor_name && (
                <p className="text-white/70">담임: {churchInfo.pastor_name}</p>
              )}
              {churchInfo.address && (
                <p className="text-white/70">주소: {churchInfo.address}</p>
              )}
              {churchInfo.phone && (
                <p className="text-white/70">전화: {churchInfo.phone}</p>
              )}
            </div>
          )}

          {group.invite_code && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-white/60 text-xs">초대 코드:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(group.invite_code!);
                  setActionMsg('초대 코드가 복사되었습니다!');
                  setTimeout(() => setActionMsg(''), 2000);
                }}
                className="bg-white/20 text-white text-sm font-mono font-bold px-3 py-1 rounded-lg tracking-widest hover:bg-white/30 transition-colors"
              >
                {group.invite_code}
              </button>
            </div>
          )}

          {myMembership && (
            <div className="mt-3">
              <span className="bg-white/20 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {roleLabel(myMembership.role)}
              </span>
            </div>
          )}
        </div>

        {/* 멤버 목록 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50">
          <h3 className="font-bold text-brown mb-3 flex items-center gap-2">
            <span className="w-8 h-8 bg-honey/15 rounded-lg flex items-center justify-center text-sm">👥</span>
            멤버 ({members.length})
          </h3>

          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 bg-amber-50 rounded-full flex items-center justify-center text-sm font-bold text-amber-600">
                  {(member.user_name || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-brown truncate">
                    {member.user_name || '이름 없음'}
                    {member.user_id === user?.id && (
                      <span className="text-xs text-stone-400 ml-1">(나)</span>
                    )}
                  </p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColor(member.role)}`}>
                  {roleLabel(member.role)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 그룹 설정 편집 (리더/생성자만) */}
        {isLeader && !showEditSettings && (
          <button
            onClick={openEditSettings}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-amber-50 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <span className="w-10 h-10 bg-honey/15 rounded-xl flex items-center justify-center text-lg">⚙️</span>
            <span className="font-semibold text-brown text-sm">그룹 설정 수정</span>
          </button>
        )}

        {showEditSettings && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 space-y-4 animate-fade-in">
            <h3 className="font-bold text-brown">그룹 설정 수정</h3>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">그룹명</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 mb-1">소개</label>
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2}
                className="w-full bg-warm-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-stone-700 text-sm resize-none" />
            </div>
            {group?.group_type === 'small_group' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-stone-500 mb-1">최대 인원</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={2} max={30} value={editMaxMembers} onChange={(e) => setEditMaxMembers(Number(e.target.value))}
                      className="flex-1 h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer accent-honey" />
                    <span className="text-sm font-bold text-amber-700 w-10 text-right">{editMaxMembers}명</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 mb-1">모임 요일</label>
                    <select value={editMeetingDay} onChange={(e) => setEditMeetingDay(e.target.value)}
                      className="w-full bg-warm-white rounded-xl px-3 py-2.5 border-2 border-amber-100 text-sm text-stone-700">
                      <option value="">선택 안함</option>
                      {['월','화','수','목','금','토','일'].map(d => <option key={d} value={d}>{d}요일</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-stone-500 mb-1">모임 시간</label>
                    <input type="time" value={editMeetingTime} onChange={(e) => setEditMeetingTime(e.target.value)}
                      className="w-full bg-warm-white rounded-xl px-3 py-2.5 border-2 border-amber-100 text-sm text-stone-700" />
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={() => setShowEditSettings(false)} className="flex-1 py-3 rounded-xl bg-stone-100 text-stone-500 font-semibold text-sm">취소</button>
              <button onClick={handleSaveSettings} className="flex-1 btn-honey py-3 rounded-xl font-bold text-sm shadow-md">저장</button>
            </div>
          </div>
        )}

        {/* 리더 위임 */}
        {isLeader && (
          <>
            {!showTransferLeader ? (
              <button
                onClick={() => setShowTransferLeader(true)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-blue-50 flex items-center gap-3 hover:bg-blue-50 transition-colors"
              >
                <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">👑</span>
                <span className="font-semibold text-blue-600 text-sm">리더 위임</span>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 space-y-3 animate-fade-in">
                <h3 className="font-bold text-brown text-sm">리더를 위임할 멤버를 선택하세요</h3>
                {members.filter(m => m.user_id !== user?.id).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleTransferLeader(member.user_id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-sm font-bold text-amber-600">
                      {(member.user_name || '?').charAt(0)}
                    </div>
                    <span className="text-sm font-semibold text-brown">{member.user_name || '이름 없음'}</span>
                  </button>
                ))}
                <button onClick={() => setShowTransferLeader(false)} className="w-full py-2 rounded-xl bg-stone-100 text-stone-500 font-semibold text-sm">취소</button>
              </div>
            )}
          </>
        )}

        {/* 액션 버튼들 */}
        <div className="space-y-2">
          {myMembership && myMembership.role !== 'leader' && (
            <button
              onClick={handleLeave}
              className="w-full bg-white rounded-2xl p-4 shadow-sm border border-orange-50 flex items-center gap-3 hover:bg-orange-50 transition-colors"
            >
              <span className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-lg">🚪</span>
              <span className="font-semibold text-orange-500 text-sm">그룹 탈퇴</span>
            </button>
          )}

          {isCreator && (
            <>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-red-50 flex items-center gap-3 hover:bg-red-50 transition-colors"
                >
                  <span className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-lg">🗑️</span>
                  <span className="font-semibold text-red-500 text-sm">그룹 삭제</span>
                </button>
              ) : (
                <div className="bg-red-50 rounded-2xl p-4 border border-red-200 animate-fade-in">
                  <p className="text-sm text-red-600 font-medium mb-3">
                    정말로 이 그룹을 삭제하시겠습니까? 모든 멤버가 자동으로 탈퇴됩니다.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 py-2 rounded-xl bg-white text-stone-500 font-semibold text-sm"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDelete}
                      className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
