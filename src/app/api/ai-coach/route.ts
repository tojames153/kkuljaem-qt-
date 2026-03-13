import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `당신은 기독교 영성 상담가입니다.
사용자가 작성한 묵상을 읽고 다음 형식으로 응답하세요.

💛 공감 한 문장
(사용자의 묵상 내용에 맞춘 따뜻한 공감 한 문장)

📖 영적 통찰
(사용자의 묵상 내용을 바탕으로 성경적 영적 통찰 2~3문장. 관련 성경 구절을 반드시 인용하세요.)

💭 추가 묵상 질문
1. (사용자의 묵상에서 더 깊이 생각해볼 수 있는 질문)
2. (삶에 적용할 수 있는 실천적 질문)
3. (하나님과의 관계를 돌아보는 질문)

🙏 기도문
(사용자의 묵상 내용을 반영한 짧고 따뜻한 기도문 2~3문장. "예수님의 이름으로 기도합니다. 아멘."으로 마무리)

조건:
- 따뜻하고 부드러운 상담가 스타일
- 절대 비판하거나 정죄하지 말 것
- 답변은 쉽고 깊이 있게
- 청소년도 이해할 수 있는 표현 사용
- 성경 중심 관점 유지
- 각 섹션 제목(💛, 📖, 💭, 🙏)을 반드시 포함할 것`;

// Anthropic Claude API 호출
async function callAnthropic(apiKey: string, text: string): Promise<string | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: text },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic API error:', res.status, errText);
      // 임시 디버그: 에러 내용을 반환
      return `[Anthropic 오류 ${res.status}]: ${errText}`;
    }

    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch (err) {
    console.error('Anthropic API call failed:', err);
    return `[Anthropic 연결 실패]: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// OpenAI API 호출
async function callOpenAI(apiKey: string, text: string): Promise<string | null> {
  try {
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
          { role: 'user', content: text },
        ],
        temperature: 0.7,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      console.error('OpenAI API error:', res.status, await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('OpenAI API call failed:', err);
    return null;
  }
}

// GET /api/ai-coach — 연결 상태 진단 (배포 후 삭제 가능)
export async function GET() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return NextResponse.json({
    anthropic: anthropicKey ? `set (${anthropicKey.substring(0, 12)}...)` : 'not set',
    openai: openaiKey ? `set (${openaiKey.substring(0, 12)}...)` : 'not set',
    supabase_url: supabaseUrl || 'not set',
    env_keys: Object.keys(process.env).filter(k =>
      k.includes('ANTHROPIC') || k.includes('OPENAI') || k.includes('SUPABASE')
    ),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { reflection_text } = await request.json();

    if (!reflection_text?.trim()) {
      return NextResponse.json(
        { error: '묵상 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // 1순위: Anthropic Claude API
    if (anthropicKey && anthropicKey !== 'your_anthropic_api_key_here') {
      const result = await callAnthropic(anthropicKey, reflection_text);
      if (result) {
        return NextResponse.json({ response: result, provider: 'anthropic' });
      }
    }

    // 2순위: OpenAI API
    if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      const result = await callOpenAI(openaiKey, reflection_text);
      if (result) {
        return NextResponse.json({ response: result, provider: 'openai' });
      }
    }

    // 3순위: 데모 응답 (API 키 없거나 모두 실패 시)
    return NextResponse.json({
      response: generateDemoResponse(reflection_text),
      provider: 'demo',
    });
  } catch (err) {
    console.error('AI Coach error:', err);
    return NextResponse.json(
      { error: 'AI 코치 응답 생성에 실패했습니다. 잠시 후 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}

function generateDemoResponse(text: string): string {
  const keywords = ['감사', '기쁨', '사랑', '두려움', '걱정', '힘든', '어려운', '슬픔', '용서', '기도'];
  const found = keywords.find((k) => text.includes(k));

  const empathyMap: Record<string, string> = {
    감사: '감사하는 마음으로 묵상에 임하신 모습이 정말 아름다워요.',
    기쁨: '기쁨 가운데 묵상하시는 모습에서 하나님의 은혜가 느껴져요.',
    사랑: '사랑에 대해 묵상하시는 마음이 참 따뜻합니다.',
    두려움: '두려움 속에서도 하나님 앞에 나아오신 용기가 대단해요.',
    걱정: '걱정을 하나님 앞에 내려놓으려는 마음이 느껴져서 감동이에요.',
    힘든: '힘든 상황에서도 말씀을 찾으시는 모습이 정말 귀해요.',
    어려운: '어려운 가운데서도 묵상을 놓지 않으시는 신앙이 놀라워요.',
    슬픔: '슬픔을 하나님 앞에 솔직히 드러내시는 모습이 참 아름다워요.',
    용서: '용서에 대해 고민하시는 마음에서 성숙한 신앙이 보여요.',
    기도: '기도하는 마음으로 묵상에 임하신 모습이 은혜로워요.',
  };

  const empathy = found
    ? empathyMap[found]
    : '당신의 묵상 속에서 하나님을 향한 진실한 마음이 느껴져요. 그 솔직함이 참 아름답습니다.';

  const insightMap: Record<string, string> = {
    감사: '데살로니가전서 5장 18절은 "범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라"고 말씀합니다. 감사는 환경에 따른 것이 아니라, 하나님의 신실하심을 인식하는 데서 시작됩니다. 작은 것에서부터 감사를 발견할 때, 우리의 영적 눈이 열립니다.',
    두려움: '이사야 41장 10절은 "두려워하지 말라 내가 너와 함께 함이라"고 말씀합니다. 하나님은 두려움 속에 있는 우리를 외면하지 않으시고, 오히려 더 가까이 다가오십니다. 두려움은 하나님의 크심을 경험할 수 있는 기회이기도 합니다.',
    힘든: '시편 34편 18절은 "여호와는 마음이 상한 자에게 가까이 하시고 중심에 통회하는 자를 구원하시는도다"라고 말씀합니다. 힘든 시간이야말로 하나님이 가장 가까이 계시는 때입니다.',
    default: '시편 119편 105절은 "주의 말씀은 내 발에 등이요 내 길에 빛이니이다"라고 말씀합니다. 말씀을 묵상하는 것은 어둠 속에서 등불을 켜는 것과 같습니다. 오늘 묵상 가운데 하나님의 음성을 듣고, 그 빛을 따라 한 걸음씩 나아가시길 바랍니다.',
  };

  const insight = found && insightMap[found] ? insightMap[found] : insightMap['default'];

  const questionSets = [
    ['오늘 말씀 중 가장 마음에 남는 한 구절은 무엇인가요?', '이 말씀을 통해 하나님이 나에게 하시는 말씀은 무엇일까요?', '내일 하루를 이 말씀으로 살아간다면, 무엇이 달라질까요?'],
    ['오늘 묵상에서 새롭게 발견한 것은 무엇인가요?', '이 깨달음을 일상에서 어떻게 실천할 수 있을까요?', '이 말씀을 누구와 나누고 싶나요?'],
    ['하나님이 오늘 내게 주시는 위로는 무엇인가요?', '내가 하나님께 솔직히 드리고 싶은 마음은 무엇인가요?', '오늘 하루 하나님과 동행한다는 것은 구체적으로 어떤 모습일까요?'],
  ];
  const questions = questionSets[text.length % questionSets.length];

  return `💛 공감 한 문장
${empathy}

📖 영적 통찰
${insight}

💭 추가 묵상 질문
1. ${questions[0]}
2. ${questions[1]}
3. ${questions[2]}

🙏 기도문
사랑의 하나님, 오늘도 말씀 앞에 나아온 이 귀한 자녀를 축복해 주세요. 묵상 가운데 깨달은 것들이 삶 속에서 열매 맺게 하시고, 날마다 주님과 더 깊은 교제를 누리게 하소서. 예수님의 이름으로 기도합니다. 아멘.`;
}
