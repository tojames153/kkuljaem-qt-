import { NextRequest, NextResponse } from 'next/server';

// 한글 성경 책 이름 → bolls.life API 책 번호 매핑
const BOOK_MAP: Record<string, number> = {
  // 구약
  '창세기': 1, '창': 1,
  '출애굽기': 2, '출': 2,
  '레위기': 3, '레': 3,
  '민수기': 4, '민': 4,
  '신명기': 5, '신': 5,
  '여호수아': 6, '수': 6,
  '사사기': 7, '삿': 7,
  '룻기': 8, '룻': 8,
  '사무엘상': 9, '삼상': 9,
  '사무엘하': 10, '삼하': 10,
  '열왕기상': 11, '왕상': 11,
  '열왕기하': 12, '왕하': 12,
  '역대상': 13, '대상': 13,
  '역대하': 14, '대하': 14,
  '에스라': 15, '스': 15,
  '느헤미야': 16, '느': 16,
  '에스더': 17, '에': 17,
  '욥기': 18, '욥': 18,
  '시편': 19, '시': 19,
  '잠언': 20, '잠': 20,
  '전도서': 21, '전': 21,
  '아가': 22,
  '이사야': 23, '사': 23,
  '예레미야': 24, '렘': 24,
  '예레미야애가': 25, '애가': 25, '애': 25,
  '에스겔': 26, '겔': 26,
  '다니엘': 27, '단': 27,
  '호세아': 28, '호': 28,
  '요엘': 29, '욜': 29,
  '아모스': 30, '암': 30,
  '오바댜': 31, '옵': 31,
  '요나': 32, '욘': 32,
  '미가': 33, '미': 33,
  '나훔': 34, '나': 34,
  '하박국': 35, '합': 35,
  '스바냐': 36, '습': 36,
  '학개': 37, '학': 37,
  '스가랴': 38, '슥': 38,
  '말라기': 39, '말': 39,
  // 신약
  '마태복음': 40, '마태': 40, '마': 40, '맛': 40,
  '마가복음': 41, '마가': 41, '막': 41,
  '누가복음': 42, '누가': 42, '눅': 42,
  '요한복음': 43, '요한': 43, '요': 43,
  '사도행전': 44, '행': 44,
  '로마서': 45, '롬': 45,
  '고린도전서': 46, '고전': 46,
  '고린도후서': 47, '고후': 47,
  '갈라디아서': 48, '갈': 48,
  '에베소서': 49, '엡': 49,
  '빌립보서': 50, '빌': 50,
  '골로새서': 51, '골': 51,
  '데살로니가전서': 52, '살전': 52,
  '데살로니가후서': 53, '살후': 53,
  '디모데전서': 54, '딤전': 54,
  '디모데후서': 55, '딤후': 55,
  '디도서': 56, '딛': 56,
  '빌레몬서': 57, '몬': 57,
  '히브리서': 58, '히': 58,
  '야고보서': 59, '약': 59,
  '베드로전서': 60, '벧전': 60,
  '베드로후서': 61, '벧후': 61,
  '요한일서': 62, '요일': 62,
  '요한이서': 63, '요이': 63,
  '요한삼서': 64, '요삼': 64,
  '유다서': 65, '유': 65,
  '요한계시록': 66, '계': 66,
};

// "시편 23:1-6" → { bookNum: 19, chapter: 23, startVerse: 1, endVerse: 6 }
function parsePassage(passage: string) {
  // 쉼표로 여러 구절이 있으면 첫 번째만 사용
  const first = passage.split(',')[0].trim();

  // "책이름 장:절-절" 또는 "책이름 장:절" 패턴
  const match = first.match(/^(.+?)\s*(\d+):(\d+)(?:\s*[-~]\s*(\d+))?/);
  if (!match) return null;

  const bookName = match[1].trim();
  const chapter = parseInt(match[2]);
  const startVerse = parseInt(match[3]);
  const endVerse = match[4] ? parseInt(match[4]) : startVerse;

  const bookNum = BOOK_MAP[bookName];
  if (!bookNum) return null;

  return { bookNum, chapter, startVerse, endVerse };
}

const VALID_TRANSLATIONS = ['KRV', 'NIV'];

export async function GET(request: NextRequest) {
  const passage = request.nextUrl.searchParams.get('passage');
  const translation = request.nextUrl.searchParams.get('translation') || 'KRV';

  if (!passage) {
    return NextResponse.json({ error: '구절을 입력해주세요.' }, { status: 400 });
  }

  if (!VALID_TRANSLATIONS.includes(translation)) {
    return NextResponse.json({ error: '지원하지 않는 번역입니다.' }, { status: 400 });
  }

  const parsed = parsePassage(passage);
  if (!parsed) {
    return NextResponse.json({ error: '구절 형식을 인식할 수 없습니다.', passage }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://bolls.life/get-text/${translation}/${parsed.bookNum}/${parsed.chapter}/`,
      { next: { revalidate: 86400 } } // 24시간 캐시
    );

    if (!res.ok) {
      return NextResponse.json({ error: '성경 본문을 가져올 수 없습니다.' }, { status: 502 });
    }

    const allVerses: { verse: number; text: string }[] = await res.json();

    const verses = allVerses
      .filter((v) => v.verse >= parsed.startVerse && v.verse <= parsed.endVerse)
      .map((v) => ({ verse: v.verse, text: v.text }));

    return NextResponse.json({ passage, verses });
  } catch {
    return NextResponse.json({ error: '성경 API 연결에 실패했습니다.' }, { status: 502 });
  }
}
