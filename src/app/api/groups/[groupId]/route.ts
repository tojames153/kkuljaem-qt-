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
  groupList: () => 'groups:all',
  userGroups: (userId: string) => `user-groups:${userId}`,
  churchUnique: (identifier: string) => `church-unique:${identifier}`,
  groupMembers: (groupId: string) => `group-members:${groupId}`,
};

interface StoredGroup {
  id: string;
  group_name: string;
  group_type: 'church' | 'small_group';
  member_count: number;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  max_members?: number;
  leader_id?: string | null;
  church_id?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  pastor_name?: string | null;
  address?: string | null;
  phone?: string | null;
  unique_identifier?: string;
  is_verified?: boolean;
}

interface MemberEntry {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

// GET /api/groups/[groupId] — 그룹 상세 조회
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

    const raw = await redis.get(KEYS.group(groupId));
    if (!raw) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    const group: StoredGroup = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // 멤버 목록도 함께 반환
    const memberEntries = await redis.smembers(KEYS.groupMembers(groupId));
    const members: MemberEntry[] = memberEntries.map((m) =>
      typeof m === 'string' ? JSON.parse(m) : m
    );

    return NextResponse.json({ group, members });
  } catch (err) {
    console.error('Group detail error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/groups/[groupId] — 그룹 수정 (생성자/리더만)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const body = await request.json();
    const { user_id, ...updates } = body;

    if (!user_id) {
      return NextResponse.json({ error: '사용자 인증이 필요합니다.' }, { status: 401 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const raw = await redis.get(KEYS.group(groupId));
    if (!raw) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    const group: StoredGroup = typeof raw === 'string' ? JSON.parse(raw) : raw;

    // 권한 확인: 생성자 또는 리더만 수정 가능
    if (group.created_by !== user_id && group.leader_id !== user_id) {
      return NextResponse.json({ error: '그룹 수정 권한이 없습니다.' }, { status: 403 });
    }

    // 허용된 필드만 업데이트
    const allowedFields = ['group_name', 'description', 'meeting_day', 'meeting_time', 'max_members', 'pastor_name', 'address', 'phone'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (group as unknown as Record<string, unknown>)[field] = updates[field];
      }
    }
    group.updated_at = new Date().toISOString();

    await redis.set(KEYS.group(groupId), JSON.stringify(group));

    return NextResponse.json({ group });
  } catch (err) {
    console.error('Group update error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId] — 그룹 삭제 (생성자만)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { groupId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: '사용자 인증이 필요합니다.' }, { status: 401 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const raw = await redis.get(KEYS.group(groupId));
    if (!raw) {
      return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
    }

    const group: StoredGroup = typeof raw === 'string' ? JSON.parse(raw) : raw;

    if (group.created_by !== userId) {
      return NextResponse.json({ error: '그룹 삭제는 생성자만 가능합니다.' }, { status: 403 });
    }

    // 멤버들의 user-groups에서 제거
    const memberEntries = await redis.smembers(KEYS.groupMembers(groupId));
    for (const m of memberEntries) {
      const member: MemberEntry = typeof m === 'string' ? JSON.parse(m) : m;
      await redis.srem(KEYS.userGroups(member.user_id), groupId);
    }

    // 교회 유일성 키 제거
    if (group.unique_identifier) {
      await redis.del(KEYS.churchUnique(group.unique_identifier));
    }

    // 그룹 데이터 삭제
    await redis.del(KEYS.group(groupId));
    await redis.del(KEYS.groupMembers(groupId));
    await redis.srem(KEYS.groupList(), groupId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Group delete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
