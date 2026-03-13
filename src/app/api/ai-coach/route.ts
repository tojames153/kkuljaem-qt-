import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `당신은 기독교 영성 상담가입니다.
사용자가 작성한 묵상을 읽고 다음 형식으로 응답하세요.

1. 공감하는 한 문장
2. 성경적 영적 통찰 2~3문장
3. 추가 묵상 질문 3개
4. 짧은 기도문 1개

조건:
- 따뜻한 상담가 스타일
- 비판하거나 정죄하지 말 것
- 답변은 쉽고 깊이 있게
- 청소년도 이해할 수 있는 표현 사용
- 성경 중심 관점 유지`;

export async function POST(request: NextRequest) {
  try {
    const { reflection_text } = await request.json();

    if (!reflection_text?.trim()) {
      return NextResponse.json(
        { error: '묵상 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // OpenAI API가 설정되지 않은 경우 데모 응답
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      return NextResponse.json({
        response: generateDemoResponse(reflection_text),
      });
    }

    // OpenAI API 호출
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: reflection_text },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      throw new Error('OpenAI API error');
    }

    const data = await res.json();
    return NextResponse.json({
      response: data.choices[0].message.content,
    });
  } catch {
    return NextResponse.json(
      { error: 'AI 코치 응답 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}

function generateDemoResponse(text: string): string {
  return `💛 공감 한 문장
당신의 묵상 속에서 하나님을 향한 진실한 마음이 느껴져요. 그 솔직함이 참 아름답습니다.

📖 영적 통찰
${text.length > 20 ? '당신이 나눈 이야기 속에서' : '묵상 가운데'} 하나님의 은혜가 역사하고 계심을 봅니다. 성경은 "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라"(살전 5:16-18)고 말씀하십니다. 오늘의 묵상이 당신의 삶 속에서 하나님의 임재를 더 깊이 경험하는 시간이 되길 바랍니다.

때로는 말씀이 머리로는 이해되지만 마음으로 와닿지 않을 때가 있어요. 그럴 때일수록 조용히 하나님 앞에 머무는 것이 중요합니다.

💭 추가 묵상 질문
1. 오늘 말씀 중 가장 마음에 남는 한 구절은 무엇인가요?
2. 이 말씀을 통해 하나님이 나에게 하시는 말씀은 무엇일까요?
3. 내일 하루를 이 말씀으로 살아간다면, 무엇이 달라질까요?

🙏 기도문
사랑의 하나님, 오늘도 말씀 앞에 나아온 이 귀한 자녀를 축복해 주세요. 묵상 가운데 깨달은 것들이 삶 속에서 열매 맺게 하시고, 날마다 주님과 더 깊은 교제를 누리게 하소서. 예수님의 이름으로 기도합니다. 아멘.`;
}
