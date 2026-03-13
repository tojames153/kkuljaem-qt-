import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// GET /api/community — 공개된 공동체 묵상 목록 반환
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let query = supabase
      .from('reflections')
      .select('*, user:users(name)')
      .in('visibility', ['group', 'church'])
      .order('created_at', { ascending: false })
      .limit(20);

    if (filter === 'church') {
      query = query.eq('visibility', 'church');
    } else if (filter === 'group') {
      query = query.eq('visibility', 'group');
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }
}

// POST /api/community/reaction — 공동체 반응 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { reflection_id, reaction_type } = await request.json();

    // 기존 반응 확인
    const { data: existing } = await supabase
      .from('community_reactions')
      .select('id')
      .eq('reflection_id', reflection_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // 기존 반응 업데이트
      const { data, error } = await supabase
        .from('community_reactions')
        .update({ reaction_type })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    // 새 반응 생성
    const { data, error } = await supabase
      .from('community_reactions')
      .insert({
        reflection_id,
        user_id: user.id,
        reaction_type,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '반응 저장에 실패했습니다.' }, { status: 500 });
  }
}
