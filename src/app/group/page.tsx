'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import { useAuth } from '@/lib/auth-context';
import { fetchMyGroups, searchGroups, joinGroup, findByInviteCode } from '@/lib/group-helpers';
import { Group, SmallGroup, ChurchGroup } from '@/types';

export default function GroupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [myGroups, setMyGroups] = useState<(Group | SmallGroup | ChurchGroup)[]>([]);
  const [searchResults, setSearchResults] = useState<(Group | SmallGroup | ChurchGroup)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'my' | 'search'>('my');
  const [joinMsg, setJoinMsg] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteResult, setInviteResult] = useState<(Group | SmallGroup | ChurchGroup) | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadMyGroups();
  }, [user, router]);

  async function loadMyGroups() {
    if (!user) return;
    setLoading(true);
    const groups = await fetchMyGroups(user.id);
    setMyGroups(groups);
    setLoading(false);
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchGroups(searchQuery.trim());
    // 내 그룹 제외
    const myIds = new Set(myGroups.map((g) => g.id));
    setSearchResults(results.filter((g) => !myIds.has(g.id)));
    setSearching(false);
  }

  async function handleInviteCode() {
    if (!inviteCode.trim()) return;
    const group = await findByInviteCode(inviteCode.trim());
    if (group) {
      setInviteResult(group);
    } else {
      setJoinMsg('유효하지 않은 초대 코드입니다.');
      setTimeout(() => setJoinMsg(''), 2500);
    }
  }

  async function handleJoin(groupId: string) {
    if (!user) return;
    const result = await joinGroup(groupId, user.id, user.name);
    if (result.success) {
      setJoinMsg('그룹에 가입했습니다!');
      loadMyGroups();
      setSearchResults((prev) => prev.filter((g) => g.id !== groupId));
    } else {
      setJoinMsg(result.error || '가입에 실패했습니다.');
    }
    setTimeout(() => setJoinMsg(''), 2500);
  }

  if (!user) return null;

  return (
    <AppShell>
      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-brown">그룹</h1>
          <Link
            href="/group/create"
            className="btn-honey px-4 py-2 rounded-xl text-sm font-bold shadow-md"
          >
            + 새 그룹
          </Link>
        </div>

        {joinMsg && (
          <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium animate-fade-in">
            {joinMsg}
          </div>
        )}

        {/* 탭 */}
        <div className="flex bg-amber-50 rounded-xl p-1">
          <button
            onClick={() => setTab('my')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'my' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            내 그룹
          </button>
          <button
            onClick={() => setTab('search')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'search' ? 'bg-white text-brown shadow-sm' : 'text-stone-400'
            }`}
          >
            그룹 찾기
          </button>
        </div>

        {tab === 'my' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-stone-400">불러오는 중...</div>
            ) : myGroups.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-3xl">👥</p>
                <p className="text-stone-500 text-sm">아직 가입한 그룹이 없어요</p>
                <p className="text-stone-400 text-xs">그룹을 만들거나 찾아서 가입해보세요</p>
              </div>
            ) : (
              myGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/group/${group.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-sm border border-amber-50 hover:shadow-md transition-shadow animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                      group.group_type === 'church' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {group.group_type === 'church' ? '⛪' : '👥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brown text-sm truncate">{group.group_name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {group.group_type === 'church' ? '교회' : '소그룹'} · {group.member_count}명
                      </p>
                    </div>
                    <svg className="w-5 h-5 text-stone-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                  {group.description && (
                    <p className="text-xs text-stone-400 mt-2 line-clamp-2">{group.description}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        )}

        {tab === 'search' && (
          <div className="space-y-3">
            {/* 초대 코드 입력 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50">
              <label className="block text-xs font-bold text-brown mb-2">초대 코드로 가입</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleInviteCode()}
                  placeholder="초대 코드 입력"
                  maxLength={8}
                  className="flex-1 bg-warm-white rounded-xl px-4 py-2.5 border-2 border-amber-100 focus:border-honey focus:outline-none text-sm text-stone-700 placeholder:text-stone-300 text-center tracking-widest font-mono font-bold"
                />
                <button
                  onClick={handleInviteCode}
                  className="bg-honey/15 text-amber-700 px-4 rounded-xl text-sm font-semibold hover:bg-honey/25 transition-colors"
                >
                  확인
                </button>
              </div>
              {inviteResult && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl animate-fade-in flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-green-700">
                      {inviteResult.group_type === 'church' ? '⛪' : '👥'} {inviteResult.group_name}
                    </p>
                    <p className="text-xs text-green-600">{inviteResult.member_count}명</p>
                  </div>
                  <button
                    onClick={() => { handleJoin(inviteResult.id); setInviteResult(null); setInviteCode(''); }}
                    className="btn-honey px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                  >
                    가입
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <hr className="flex-1 border-amber-100" />
              <span className="text-xs text-stone-300">또는</span>
              <hr className="flex-1 border-amber-100" />
            </div>

            {/* 이름으로 검색 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="그룹명으로 검색"
                className="flex-1 bg-white rounded-xl px-4 py-3 border-2 border-amber-100 focus:border-honey focus:outline-none text-sm text-stone-700 placeholder:text-stone-300"
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="btn-honey px-4 rounded-xl font-semibold text-sm shadow-sm"
              >
                {searching ? '...' : '검색'}
              </button>
            </div>

            {searchResults.length > 0 ? (
              searchResults.map((group) => (
                <div
                  key={group.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-amber-50 animate-fade-in"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${
                      group.group_type === 'church' ? 'bg-blue-50' : 'bg-green-50'
                    }`}>
                      {group.group_type === 'church' ? '⛪' : '👥'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brown text-sm truncate">{group.group_name}</h3>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {group.group_type === 'church' ? '교회' : '소그룹'} · {group.member_count}명
                        {group.group_type === 'small_group' && (group as SmallGroup).max_members &&
                          ` / ${(group as SmallGroup).max_members}명`
                        }
                      </p>
                    </div>
                    <button
                      onClick={() => handleJoin(group.id)}
                      className="bg-honey/15 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-honey/25 transition-colors"
                    >
                      가입
                    </button>
                  </div>
                  {group.description && (
                    <p className="text-xs text-stone-400 mt-2">{group.description}</p>
                  )}
                </div>
              ))
            ) : searchQuery && !searching ? (
              <div className="text-center py-8 text-stone-400 text-sm">
                검색 결과가 없습니다
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}
