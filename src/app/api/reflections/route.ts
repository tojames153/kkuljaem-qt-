import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/reflections — 묵상 기록 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { devotional_id, reflection_text, visibility } = await request.json();

    const { data, error } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        devotional_id,
        reflection_text,
        visibility: visibility || 'private',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
  }
}

// GET /api/reflections — 내 묵상 기록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }
}
