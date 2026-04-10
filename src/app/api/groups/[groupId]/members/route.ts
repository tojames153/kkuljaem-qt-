import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const KEYS = {
  group: (id: string) => `group:${id}`,
  userGroups: (userId: string) => `user-groups:${userId}`,
  groupMembers: (groupId: string) => `group-members:${groupId}`,
};

interface StoredGroup {
  id: string;
  group_name: string;
  group_type: 'church' | 'small_group';
  member_count: number;
  created_by: string;
  max_members?: number;
  leader_id?: string | null;
  [key: string]: unknown;
}

interface MemberEntry {
  id: string;
  group_id: string;
  user_id: string;
  user_name?: string;
  role: 'leader' | 'admin' | 'member';
  joined_at: string;
}

// 멤버 찾기 헬퍼
async function findMember(redis: Redis, groupId: string, userId: string): Promise<{ entry: MemberEntry; raw: string } | null> {
  const members = await redis.smembers(KEYS.groupMembers(groupId));
  for (const m of members) {
    const parsed: MemberEntry = typeof m === 'string' ? JSON.parse(m) : m;
    if (parsed.user_id === userId) {
      return { entry: parsed, raw: typeof m === 'string' ? m : JSON.stringify(m) };
    }
  }
  return null;
}

// 리더/관리자 확인 헬퍼
async function isLeaderOrAdmin(redis: Redis, groupId: string, userId: string): Promise<boolean> {
  const found = await findMember(redis, groupId, userId);
  return found ? ['leader', 'admin'].includes(found.entry.role) : false;
}

// GET /api/groups/[groupId]/members — 멤버 목록
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const memberEntries = await redis.smembers(KEYS.groupMembers(groupId));
    const members: MemberEntry[] = memberEntries.map((m) =>
      typeof m === 'string' ? JSON.parse(m) : m
    );

    // 역할순 정렬: leader > admin > member
    const roleOrder = { leader: 0, admin: 1, member: 2 };
    members.sort((a, b) => (roleOrder[a.role] || 2) - (roleOrder[b.role] || 2));

    return NextResponse.json({ members });
  } catch (err) {
    console.error('Members list error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/groups/[groupId]/members — 멤버 가입
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { user_id, user_name } = body;

    if (!user_id) {
      return NextResponse.json({ error: '사용자 정보가 필요합니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    // 그룹 존재 확인
    const raw = await redis.get(KEYS.group(groupId));
    if (!raw) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    const group: StoredGroup = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // 이미 멤버인지 확인
    const existing = await findMember(redis, groupId, user_id);
    if (existing) {
      return NextResponse.json({ error: '이미 그룹에 가입되어 있습니다.' }, { status: 409 });
    }

    // 소그룹: 최대 인원 확인
    if (group.group_type === 'small_group' && group.max_members) {
      if (group.member_count >= group.max_members) {
        return NextResponse.json({ error: `소그룹 최대 인원(${group.max_members}명)에 도달했습니다.` }, { status: 400 });
      }
    }

    // 멤버 추가
    const newMember: MemberEntry = {
      id: `member-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      group_id: groupId,
      user_id,
      user_name: user_name || '',
      role: 'member',
      joined_at: new Date().toISOString(),
    };

    await redis.sadd(KEYS.groupMembers(groupId), JSON.stringify(newMember));
    await redis.sadd(KEYS.userGroups(user_id), groupId);

    // member_count 증가
    group.member_count = (group.member_count || 0) + 1;
    await redis.set(KEYS.group(groupId), JSON.stringify(group));

    return NextResponse.json({ member: newMember });
  } catch (err) {
    console.error('Member join error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH /api/groups/[groupId]/members — 멤버 역할 변경 (리더/관리자만)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { user_id, target_user_id, new_role } = body;

    if (!user_id || !target_user_id || !new_role) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    if (!['leader', 'admin', 'member'].includes(new_role)) {
      return NextResponse.json({ error: '유효하지 않은 역할입니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    // 권한 확인
    if (!(await isLeaderOrAdmin(redis, groupId, user_id))) {
      return NextResponse.json({ error: '멤버 역할 변경 권한이 없습니다.' }, { status: 403 });
    }

    // 대상 멤버 찾기
    const target = await findMember(redis, groupId, target_user_id);
    if (!target) {
      return NextResponse.json({ error: '해당 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // SET에서 기존 엔트리 제거 후 새 엔트리 추가
    await redis.srem(KEYS.groupMembers(groupId), target.raw);
    const updated: MemberEntry = { ...target.entry, role: new_role };
    await redis.sadd(KEYS.groupMembers(groupId), JSON.stringify(updated));

    return NextResponse.json({ member: updated });
  } catch (err) {
    console.error('Role change error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]/members — 멤버 탈퇴/추방
// ?user_id=요청자&target_user_id=대상 (자기 자신이면 탈퇴, 타인이면 추방)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const targetUserId = searchParams.get('target_user_id') || userId;

    if (!userId || !targetUserId) {
      return NextResponse.json({ error: '사용자 정보가 필요합니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    // 자기 탈퇴가 아니면 권한 확인 (추방)
    if (userId !== targetUserId) {
      if (!(await isLeaderOrAdmin(redis, groupId, userId))) {
        return NextResponse.json({ error: '멤버 추방 권한이 없습니다.' }, { status: 403 });
      }
    }

    // 대상 멤버 찾기
    const target = await findMember(redis, groupId, targetUserId);
    if (!target) {
      return NextResponse.json({ error: '해당 멤버를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 리더는 탈퇴 불가 (리더 위임 후 탈퇴해야 함)
    if (target.entry.role === 'leader' && userId === targetUserId) {
      return NextResponse.json({ error: '리더는 직접 탈퇴할 수 없습니다. 다른 멤버에게 리더를 위임해주세요.' }, { status: 400 });
    }

    // SET에서 제거
    await redis.srem(KEYS.groupMembers(groupId), target.raw);
    await redis.srem(KEYS.userGroups(targetUserId), groupId);

    // member_count 감소
    const raw = await redis.get(KEYS.group(groupId));
    if (raw) {
      const group: StoredGroup = typeof raw === 'string' ? JSON.parse(raw) : raw;
      group.member_count = Math.max(0, (group.member_count || 1) - 1);
      await redis.set(KEYS.group(groupId), JSON.stringify(group));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Member remove error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
