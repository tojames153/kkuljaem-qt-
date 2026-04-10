import { NextRequest, NextResponse } from 'next/server';

// YouTube 페이지를 스크래핑하여 첫 번째 동영상 ID를 추출
async function searchYouTubeVideoId(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();

    // ytInitialData에서 videoId 추출
    const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (match) return match[1];

    // 대체 패턴
    const altMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
    if (altMatch) return altMatch[1];

    return null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해주세요.' }, { status: 400 });
  }

  const videoId = await searchYouTubeVideoId(query);

  if (!videoId) {
    return NextResponse.json({ error: '영상을 찾을 수 없습니다.', videoId: null });
  }

  return NextResponse.json({ videoId });
}
