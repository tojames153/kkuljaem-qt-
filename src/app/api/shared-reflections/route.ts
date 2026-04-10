import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

interface SharedReflection {
  id: string;
  user_id: string;
  user_name: string;
  devotional_id: string;
  reflection_text: string;
  visibility: 'group' | 'church';
  group_id?: string;
  created_at: string;
}

// POST /api/shared-reflections — 공유 묵상 저장
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, user_name, devotional_id, reflection_text, visibility, group_id } = body;

    if (!user_id || !reflection_text || !visibility) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const entry: SharedReflection = {
      id: id || `reflection-${Date.now()}`,
      user_id,
      user_name: user_name || '익명',
      devotional_id: devotional_id || '',
      reflection_text,
      visibility,
      group_id,
      created_at: new Date().toISOString(),
    };

    // LIST에 추가 (최신순)
    await redis.lpush('shared-reflections', JSON.stringify(entry));
    // 최대 200개만 유지
    await redis.ltrim('shared-reflections', 0, 199);

    return NextResponse.json({ reflection: entry });
  } catch (err) {
    console.error('Shared reflection save error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}

// GET /api/shared-reflections — 공유 묵상 목록 조회
// ?visibility=group|church&limit=50
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibility = searchParams.get('visibility');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const raw = await redis.lrange('shared-reflections', 0, limit - 1);
    let reflections: SharedReflection[] = raw.map((r) =>
      typeof r === 'string' ? JSON.parse(r) : r
    );

    // visibility 필터
    if (visibility) {
      reflections = reflections.filter((r) => r.visibility === visibility);
    }

    return NextResponse.json({ reflections });
  } catch (err) {
    console.error('Shared reflection list error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}

// DELETE /api/shared-reflections — 공유 묵상 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    // 전체 조회 후 해당 항목 제거
    const raw = await redis.lrange('shared-reflections', 0, -1);
    for (const r of raw) {
      const parsed: SharedReflection = typeof r === 'string' ? JSON.parse(r) : r;
      if (parsed.id === id && parsed.user_id === userId) {
        await redis.lrem('shared-reflections', 1, typeof r === 'string' ? r : JSON.stringify(r));
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: '해당 기록을 찾을 수 없습니다.' }, { status: 404 });
  } catch (err) {
    console.error('Shared reflection delete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
