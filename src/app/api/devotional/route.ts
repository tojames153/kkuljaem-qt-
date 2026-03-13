import { NextResponse } from 'next/server';
import { getTodayDevotional, sampleDevotionals } from '@/lib/sample-devotional';

// GET /api/devotional — 오늘의 묵상 반환
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get('day');

  if (day) {
    const index = (parseInt(day) - 1) % sampleDevotionals.length;
    const devotional = {
      ...sampleDevotionals[index],
      id: `sample-${index + 1}`,
      created_at: new Date().toISOString(),
    };
    return NextResponse.json(devotional);
  }

  return NextResponse.json(getTodayDevotional());
}
