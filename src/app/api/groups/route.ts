import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// Redis 키 구조
const KEYS = {
  group: (id: string) => `group:${id}`,
  groupList: () => 'groups:all',              // SET of all group IDs
  userGroups: (userId: string) => `user-groups:${userId}`, // SET of group IDs per user
  churchUnique: (identifier: string) => `church-unique:${identifier}`,
  groupMembers: (groupId: string) => `group-members:${groupId}`, // SET of member entries
  inviteCode: (code: string) => `invite:${code}`,
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
  // 소그룹 전용
  max_members?: number;
  leader_id?: string | null;
  church_id?: string | null;
  meeting_day?: string | null;
  meeting_time?: string | null;
  invite_code?: string;
  // 교회 전용
  pastor_name?: string | null;
  address?: string | null;
  phone?: string | null;
  unique_identifier?: string;
  is_verified?: boolean;
}

// POST /api/groups — 그룹 생성 (교회 or 소그룹)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group_type, group_name, description, created_by, ...extra } = body;

    if (!group_name || !group_type || !created_by) {
      return NextResponse.json({ error: '그룹명, 타입, 생성자 정보가 필요합니다.' }, { status: 400 });
    }

    if (!['church', 'small_group'].includes(group_type)) {
      return NextResponse.json({ error: '유효하지 않은 그룹 타입입니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const groupId = `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const inviteCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const now = new Date().toISOString();

    const newGroup: StoredGroup = {
      id: groupId,
      group_name,
      group_type,
      member_count: 1, // 생성자 자동 포함
      description: description || '',
      created_by,
      created_at: now,
      updated_at: now,
      invite_code: inviteCode,
    };

    // 교회: 유일성 보장 (교회명 기반)
    if (group_type === 'church') {
      const uniqueId = extra.unique_identifier || group_name.trim().toLowerCase().replace(/\s+/g, '');
      const existingChurch = await redis.get(KEYS.churchUnique(uniqueId));
      if (existingChurch) {
        return NextResponse.json({ error: '이미 등록된 교회입니다. 동일한 이름의 교회가 존재합니다.' }, { status: 409 });
      }
      newGroup.pastor_name = extra.pastor_name || null;
      newGroup.address = extra.address || null;
      newGroup.phone = extra.phone || null;
      newGroup.unique_identifier = uniqueId;
      newGroup.is_verified = false;

      // 유일성 키 등록
      await redis.set(KEYS.churchUnique(uniqueId), groupId);
    }

    // 소그룹: 최대 인원, 리더 설정
    if (group_type === 'small_group') {
      newGroup.max_members = extra.max_members || 12;
      newGroup.leader_id = created_by;
      newGroup.church_id = extra.church_id || null;
      newGroup.meeting_day = extra.meeting_day || null;
      newGroup.meeting_time = extra.meeting_time || null;
    }

    // 그룹 저장
    await redis.set(KEYS.group(groupId), JSON.stringify(newGroup));
    await redis.sadd(KEYS.groupList(), groupId);
    await redis.set(KEYS.inviteCode(inviteCode), groupId);

    // 생성자를 멤버로 추가 (리더 역할)
    const memberEntry = JSON.stringify({
      id: `member-${Date.now()}`,
      group_id: groupId,
      user_id: created_by,
      user_name: extra.creator_name || '',
      role: 'leader',
      joined_at: now,
    });
    await redis.sadd(KEYS.groupMembers(groupId), memberEntry);
    await redis.sadd(KEYS.userGroups(created_by), groupId);

    return NextResponse.json({ group: newGroup });
  } catch (err) {
    console.error('Group creation error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}

// GET /api/groups — 그룹 목록 조회
// ?user_id=xxx → 내 그룹만 / ?type=church|small_group → 타입별 / ?search=xxx → 검색
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const groupType = searchParams.get('type');
    const search = searchParams.get('search');
    const inviteCode = searchParams.get('invite_code');

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    // 초대 코드로 단일 그룹 조회
    if (inviteCode) {
      const groupId = await redis.get(KEYS.inviteCode(inviteCode.toUpperCase()));
      if (!groupId) {
        return NextResponse.json({ error: '유효하지 않은 초대 코드입니다.' }, { status: 404 });
      }
      const raw = await redis.get(KEYS.group(groupId as string));
      if (!raw) {
        return NextResponse.json({ error: '그룹을 찾을 수 없습니다.' }, { status: 404 });
      }
      const group = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return NextResponse.json({ groups: [group] });
    }

    let groupIds: string[];

    if (userId) {
      // 사용자가 속한 그룹만
      groupIds = await redis.smembers(KEYS.userGroups(userId));
    } else {
      // 전체 그룹
      groupIds = await redis.smembers(KEYS.groupList());
    }

    if (!groupIds || groupIds.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // 그룹 데이터 조회
    const pipeline = redis.pipeline();
    for (const id of groupIds) {
      pipeline.get(KEYS.group(id));
    }
    const results = await pipeline.exec();

    let groups: StoredGroup[] = results
      .filter((r): r is string => r !== null)
      .map((r) => (typeof r === 'string' ? JSON.parse(r) : r));

    // 타입 필터
    if (groupType) {
      groups = groups.filter((g) => g.group_type === groupType);
    }

    // 검색 필터
    if (search) {
      const keyword = search.toLowerCase();
      groups = groups.filter((g) =>
        g.group_name.toLowerCase().includes(keyword) ||
        (g.description && g.description.toLowerCase().includes(keyword))
      );
    }

    // 최신순 정렬
    groups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ groups });
  } catch (err) {
    console.error('Group list error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}
