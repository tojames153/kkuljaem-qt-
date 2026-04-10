// 그룹 관련 localStorage 폴백 및 API 호출 헬퍼

import { Group, SmallGroup, ChurchGroup, GroupMember } from '@/types';

const STORAGE_KEYS = {
  GROUPS: 'kkuljaem-groups',
  GROUP_MEMBERS: 'kkuljaem-group-members',
  USER_GROUPS: 'kkuljaem-user-groups',
};

// === localStorage 헬퍼 ===
function getStoredGroups(): Record<string, Group | SmallGroup | ChurchGroup> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUPS) || '{}');
  } catch { return {}; }
}

function saveStoredGroups(groups: Record<string, Group | SmallGroup | ChurchGroup>) {
  localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
}

function getStoredMembers(): Record<string, GroupMember[]> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.GROUP_MEMBERS) || '{}');
  } catch { return {}; }
}

function saveStoredMembers(members: Record<string, GroupMember[]>) {
  localStorage.setItem(STORAGE_KEYS.GROUP_MEMBERS, JSON.stringify(members));
}

// === API + 폴백 통합 함수 ===

export async function createGroup(data: {
  group_type: 'church' | 'small_group';
  group_name: string;
  description?: string;
  created_by: string;
  creator_name?: string;
  // 교회 전용
  pastor_name?: string;
  address?: string;
  phone?: string;
  unique_identifier?: string;
  // 소그룹 전용
  max_members?: number;
  church_id?: string;
  meeting_day?: string;
  meeting_time?: string;
}): Promise<{ group?: Group | SmallGroup | ChurchGroup; error?: string }> {
  // 서버 시도
  try {
    const res = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.group) {
      // localStorage에도 캐시
      const groups = getStoredGroups();
      groups[result.group.id] = result.group;
      saveStoredGroups(groups);

      const members = getStoredMembers();
      members[result.group.id] = [{
        id: `member-${Date.now()}`,
        group_id: result.group.id,
        user_id: data.created_by,
        user_name: data.creator_name,
        role: 'leader',
        joined_at: new Date().toISOString(),
      }];
      saveStoredMembers(members);

      return { group: result.group };
    }
    if (res.status === 409) return { error: result.error };
    if (!result.fallback) return { error: result.error };
  } catch {
    // 서버 연결 실패 → 폴백
  }

  // localStorage 폴백
  const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  // 교회 유일성 체크 (로컬)
  if (data.group_type === 'church') {
    const groups = getStoredGroups();
    const uniqueId = data.unique_identifier || data.group_name.trim().toLowerCase().replace(/\s+/g, '');
    const existing = Object.values(groups).find(
      (g) => g.group_type === 'church' && (g as ChurchGroup).unique_identifier === uniqueId
    );
    if (existing) return { error: '이미 등록된 교회입니다.' };
  }

  const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();

  const baseGroup: Group = {
    id: groupId,
    group_name: data.group_name,
    group_type: data.group_type,
    member_count: 1,
    description: data.description || '',
    created_by: data.created_by,
    created_at: now,
    updated_at: now,
    invite_code: inviteCode,
  };

  let newGroup: Group | SmallGroup | ChurchGroup;

  if (data.group_type === 'small_group') {
    newGroup = {
      ...baseGroup,
      group_type: 'small_group' as const,
      max_members: data.max_members || 12,
      leader_id: data.created_by,
      church_id: data.church_id || null,
      meeting_day: data.meeting_day || null,
      meeting_time: data.meeting_time || null,
    };
  } else {
    newGroup = {
      ...baseGroup,
      group_type: 'church' as const,
      pastor_name: data.pastor_name || null,
      address: data.address || null,
      phone: data.phone || null,
      unique_identifier: data.unique_identifier || data.group_name.trim().toLowerCase().replace(/\s+/g, ''),
      is_verified: false,
    };
  }

  const groups = getStoredGroups();
  groups[groupId] = newGroup;
  saveStoredGroups(groups);

  const members = getStoredMembers();
  members[groupId] = [{
    id: `member-${Date.now()}`,
    group_id: groupId,
    user_id: data.created_by,
    user_name: data.creator_name,
    role: 'leader',
    joined_at: now,
  }];
  saveStoredMembers(members);

  return { group: newGroup };
}

export async function fetchMyGroups(userId: string): Promise<(Group | SmallGroup | ChurchGroup)[]> {
  // 서버 시도
  try {
    const res = await fetch(`/api/groups?user_id=${encodeURIComponent(userId)}`);
    const data = await res.json();
    if (data.groups && !data.fallback) {
      // 캐시 업데이트
      const stored = getStoredGroups();
      for (const g of data.groups) stored[g.id] = g;
      saveStoredGroups(stored);
      return data.groups;
    }
  } catch {
    // 폴백
  }

  // localStorage 폴백
  const groups = getStoredGroups();
  const members = getStoredMembers();
  return Object.values(groups).filter((g) => {
    const groupMembers = members[g.id] || [];
    return g.created_by === userId || groupMembers.some((m) => m.user_id === userId);
  });
}

export async function fetchGroupDetail(groupId: string): Promise<{
  group?: Group | SmallGroup | ChurchGroup;
  members?: GroupMember[];
  error?: string;
}> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}`);
    const data = await res.json();
    if (data.group) {
      // 캐시
      const groups = getStoredGroups();
      groups[data.group.id] = data.group;
      saveStoredGroups(groups);
      if (data.members) {
        const stored = getStoredMembers();
        stored[groupId] = data.members;
        saveStoredMembers(stored);
      }
      return { group: data.group, members: data.members || [] };
    }
    if (!data.fallback) return { error: data.error };
  } catch {
    // 폴백
  }

  const groups = getStoredGroups();
  const members = getStoredMembers();
  const group = groups[groupId];
  if (!group) return { error: '그룹을 찾을 수 없습니다.' };
  return { group, members: members[groupId] || [] };
}

export async function searchGroups(query: string, type?: 'church' | 'small_group'): Promise<(Group | SmallGroup | ChurchGroup)[]> {
  try {
    let url = `/api/groups?search=${encodeURIComponent(query)}`;
    if (type) url += `&type=${type}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.groups) return data.groups;
  } catch {
    // 폴백
  }

  const groups = getStoredGroups();
  const keyword = query.toLowerCase();
  return Object.values(groups).filter((g) => {
    if (type && g.group_type !== type) return false;
    return g.group_name.toLowerCase().includes(keyword) ||
      g.description.toLowerCase().includes(keyword);
  });
}

export async function findByInviteCode(code: string): Promise<(Group | SmallGroup | ChurchGroup) | null> {
  const upperCode = code.toUpperCase().trim();

  try {
    const res = await fetch(`/api/groups?invite_code=${encodeURIComponent(upperCode)}`);
    const data = await res.json();
    if (data.groups && data.groups.length > 0) return data.groups[0];
  } catch {
    // 폴백
  }

  // localStorage 폴백
  const groups = getStoredGroups();
  return Object.values(groups).find((g) => g.invite_code === upperCode) || null;
}

export async function joinGroup(groupId: string, userId: string, userName?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, user_name: userName }),
    });
    const data = await res.json();
    if (data.member) {
      // 캐시 업데이트
      const members = getStoredMembers();
      if (!members[groupId]) members[groupId] = [];
      members[groupId].push(data.member);
      saveStoredMembers(members);
      return { success: true };
    }
    if (!data.fallback) return { success: false, error: data.error };
  } catch {
    // 폴백
  }

  // localStorage 폴백
  const members = getStoredMembers();
  if (!members[groupId]) members[groupId] = [];
  if (members[groupId].some((m) => m.user_id === userId)) {
    return { success: false, error: '이미 그룹에 가입되어 있습니다.' };
  }

  const groups = getStoredGroups();
  const group = groups[groupId];
  if (group?.group_type === 'small_group') {
    const sg = group as SmallGroup;
    if (sg.max_members && members[groupId].length >= sg.max_members) {
      return { success: false, error: `최대 인원(${sg.max_members}명)에 도달했습니다.` };
    }
  }

  members[groupId].push({
    id: `member-${Date.now()}`,
    group_id: groupId,
    user_id: userId,
    user_name: userName,
    role: 'member',
    joined_at: new Date().toISOString(),
  });
  saveStoredMembers(members);

  if (group) {
    group.member_count = members[groupId].length;
    saveStoredGroups({ ...groups, [groupId]: group });
  }

  return { success: true };
}

export async function leaveGroup(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}/members?user_id=${encodeURIComponent(userId)}&target_user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      const members = getStoredMembers();
      if (members[groupId]) {
        members[groupId] = members[groupId].filter((m) => m.user_id !== userId);
        saveStoredMembers(members);
      }
      return { success: true };
    }
    if (!data.fallback) return { success: false, error: data.error };
  } catch {
    // 폴백
  }

  const members = getStoredMembers();
  if (!members[groupId]) return { success: false, error: '그룹을 찾을 수 없습니다.' };

  const member = members[groupId].find((m) => m.user_id === userId);
  if (member?.role === 'leader') return { success: false, error: '리더는 직접 탈퇴할 수 없습니다.' };

  members[groupId] = members[groupId].filter((m) => m.user_id !== userId);
  saveStoredMembers(members);

  const groups = getStoredGroups();
  const group = groups[groupId];
  if (group) {
    group.member_count = members[groupId].length;
    saveStoredGroups({ ...groups, [groupId]: group });
  }

  return { success: true };
}

export async function deleteGroup(groupId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/groups/${encodeURIComponent(groupId)}?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      const groups = getStoredGroups();
      delete groups[groupId];
      saveStoredGroups(groups);
      const members = getStoredMembers();
      delete members[groupId];
      saveStoredMembers(members);
      return { success: true };
    }
    if (!data.fallback) return { success: false, error: data.error };
  } catch {
    // 폴백
  }

  const groups = getStoredGroups();
  const group = groups[groupId];
  if (!group) return { success: false, error: '그룹을 찾을 수 없습니다.' };
  if (group.created_by !== userId) return { success: false, error: '생성자만 삭제할 수 있습니다.' };

  delete groups[groupId];
  saveStoredGroups(groups);
  const members = getStoredMembers();
  delete members[groupId];
  saveStoredMembers(members);

  return { success: true };
}
