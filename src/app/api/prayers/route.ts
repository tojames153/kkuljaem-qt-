import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

// POST /api/prayers — 기도 저장
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { prayer_text } = await request.json();

    const { data, error } = await supabase
      .from('prayers')
      .insert({
        user_id: user.id,
        prayer_text,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 });
  }
}

// GET /api/prayers — 내 기도 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('prayers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: '조회에 실패했습니다.' }, { status: 500 });
  }
}
