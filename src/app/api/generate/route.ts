import { NextRequest, NextResponse } from 'next/server';
import { getDayAssignments, DayAssignment } from '@/lib/church-calendar';

const MODEL = 'gpt-4o-mini';

function buildPrompt(days: DayAssignment[]): string {
  const items = days
    .map(
      (d) =>
        `- Day ${d.day}: 시즌="${d.seasonNameKo}", 테마힌트="${d.themeHint}", 성경책=[${d.books.join(', ')}]`
    )
    .join('\n');

  return `아래 ${days.length}일분의 묵상 데이터를 JSON 배열로 생성해주세요.

${items}

각 항목은 다음 필드를 포함해야 합니다:
{
  "day": 숫자,
  "season": "시즌 한글명",
  "theme": "오늘의 주제 (2~5단어)",
  "passage": "성경 구절 주소 (예: 이사야 9:2, 요한복음 3:16)",
  "meditation": "묵상글 6~10줄. 따뜻하고 깊이 있게. 개역한글 기준.",
  "question1": "삶 적용 질문 1",
  "question2": "삶 적용 질문 2",
  "question3": "삶 적용 질문 3",
  "prayer": "짧은 기도문 2~3문장",
  "ccm": "추천 한국 CCM 곡명 1곡",
  "memory_verse": "암송 구절 주소 (본문 중 핵심 1절)",
  "age_children": "초등학생용 핵심 한 문장 (쉽고 짧게)",
  "age_youth": "중고등학생용 핵심 한 문장",
  "age_young_adult": "청년용 핵심 한 문장 (깊이 있게)"
}

규칙:
- 같은 시즌 내에서 주제와 성경 구절이 겹치지 않도록
- 묵상글은 해당 시즌의 분위기를 반영
- CCM은 실제 한국에서 부르는 찬양곡
- 반드시 유효한 JSON 배열만 출력 (설명 없이)`;
}

function parseJSON(text: string) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

// POST /api/generate — 특정 배치의 묵상 데이터 생성
export async function POST(request: NextRequest) {
  try {
    const { startDay, batchSize } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 400 }
      );
    }

    const allDays = getDayAssignments();
    const batch = allDays.slice(startDay - 1, startDay - 1 + batchSize);

    if (batch.length === 0) {
      return NextResponse.json({ error: '유효하지 않은 범위입니다.', devotionals: [] }, { status: 400 });
    }

    const prompt = buildPrompt(batch);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `당신은 한국 교회의 묵상 콘텐츠를 작성하는 기독교 교육 전문가입니다.
개역한글 성경을 기준으로 작성합니다.
대상은 초등학생~청년까지이며, 기본 난이도는 청소년 수준입니다.
묵상글은 6~10줄, 따뜻하고 쉬우면서도 깊이가 있어야 합니다.
질문은 삶에 적용할 수 있는 질문형으로 작성합니다.
반드시 JSON 형식으로만 응답하세요.`,
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { error: `OpenAI API 오류 (${res.status}): ${err}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    const parsed = parseJSON(content);

    // day 번호와 시즌 보정
    const corrected = parsed.map((d: Record<string, unknown>, idx: number) => ({
      ...d,
      day: batch[idx].day,
      season: batch[idx].seasonNameKo,
    }));

    return NextResponse.json({ devotionals: corrected });
  } catch (err) {
    return NextResponse.json(
      { error: `생성 실패: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
