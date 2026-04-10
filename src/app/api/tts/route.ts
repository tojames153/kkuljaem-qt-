import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Lang = 'ko' | 'en';
type Engine = 'edge' | 'google' | 'auto';
type VoiceId = 'female' | 'male';

// ─────────────────────────────────────────────────────────
// 음성 매핑: 엔진 × 언어 × 음성ID → 실제 음성 이름
// 음성ID는 프론트엔드와 공유되는 논리 키
// ─────────────────────────────────────────────────────────
const VOICE_MAP: Record<'edge' | 'google', Record<Lang, Record<string, string>>> = {
  edge: {
    ko: {
      // 한국어 4종 (성별 × 2)
      sunhi: 'ko-KR-SunHiNeural',     // 여성 — 선희, 따뜻하고 표준적
      jimin: 'ko-KR-JiMinNeural',     // 여성 — 지민, 밝고 또렷함
      injoon: 'ko-KR-InJoonNeural',   // 남성 — 인준, 차분하고 표준적
      bongjin: 'ko-KR-BongJinNeural', // 남성 — 봉진, 따뜻하고 묵직함
      // 호환 (구버전 voice='female'/'male'/'nova'/'onyx')
      female: 'ko-KR-SunHiNeural',
      male: 'ko-KR-InJoonNeural',
      nova: 'ko-KR-SunHiNeural',
      onyx: 'ko-KR-InJoonNeural',
    },
    en: {
      // 영어 4종
      jenny: 'en-US-JennyNeural',     // 여성 — Jenny, 자연스럽고 친근
      aria: 'en-US-AriaNeural',       // 여성 — Aria, 명료하고 차분
      guy: 'en-US-GuyNeural',         // 남성 — Guy, 차분하고 명료
      davis: 'en-US-DavisNeural',     // 남성 — Davis, 깊고 따뜻함
      // 호환
      female: 'en-US-JennyNeural',
      male: 'en-US-GuyNeural',
      nova: 'en-US-JennyNeural',
      onyx: 'en-US-GuyNeural',
    },
  },
  google: {
    ko: {
      sunhi: 'ko-KR-Neural2-B',
      jimin: 'ko-KR-Neural2-A',
      injoon: 'ko-KR-Neural2-C',
      bongjin: 'ko-KR-Standard-D',
      female: 'ko-KR-Neural2-B',
      male: 'ko-KR-Neural2-C',
      nova: 'ko-KR-Neural2-A',
      onyx: 'ko-KR-Neural2-C',
    },
    en: {
      jenny: 'en-US-Neural2-F',
      aria: 'en-US-Neural2-G',
      guy: 'en-US-Neural2-D',
      davis: 'en-US-Neural2-J',
      female: 'en-US-Neural2-F',
      male: 'en-US-Neural2-D',
      nova: 'en-US-Neural2-G',
      onyx: 'en-US-Neural2-J',
    },
  },
};

function pickVoice(engine: 'edge' | 'google', lang: Lang, voice: string): string {
  const map = VOICE_MAP[engine][lang] || VOICE_MAP[engine]['ko'];
  return map[voice] || map['female'];
}

// ─────────────────────────────────────────────────────────
// 텍스트 → SSML 변환
// 마침표·물음표·느낌표·콜론·세미콜론 뒤에 자연스러운 호흡을 추가하고
// 한국어 종결어미("~다.", "~요.")에 더 긴 호흡을, 쉼표에 짧은 호흡을 추가.
// ─────────────────────────────────────────────────────────
function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSSMLBody(text: string, lang: Lang): string {
  // 1. 공백 정리 + XML escape (반드시 먼저)
  let processed = escapeXml(text.replace(/\s+/g, ' ').trim());

  if (lang === 'ko') {
    // (a) 한국어 종결어미 (~다./요./네./까?/죠. 등) → 가장 긴 호흡 (문장 단락)
    processed = processed.replace(
      /([다요네까죠라리야임니])([.!?])/g,
      '$1$2<break time="600ms"/>'
    );
    // (b) 일반 마침표/물음표/느낌표 → 중간 호흡
    processed = processed.replace(/([.!?])(?!<)/g, '$1<break time="380ms"/>');
    // (c) 콜론·세미콜론 → 중간 호흡 (성경 본문에서 자주 등장)
    processed = processed.replace(/([:;])/g, '$1<break time="320ms"/>');
    // (d) 쉼표 → 짧은 호흡
    processed = processed.replace(/,(?!<)/g, ',<break time="200ms"/>');

    // (e) 한국어 접속 부사 앞 짧은 단락 — 자연스러운 운율 형성
    //     예: "그러나 ~", "그러므로 ~", "이는 ~"
    processed = processed.replace(
      /(^|\s)(그러나|그러므로|그러면|그런즉|그래서|그리고|또한|이는|보라|이에|이로써|그러나|그렇지만|그런데|그러나|그렇기에|그래도|만일|만약|그렇다면)([\s,])/g,
      '$1<break time="220ms"/>$2$3'
    );

    // (f) 직접화법 도입어 ("이르시되", "말씀하시되", "가라사대" 등) 뒤에 짧은 호흡
    processed = processed.replace(
      /(이르시되|말씀하시되|말씀하시기를|말하기를|가라사대|이르되|대답하여|대답하되|이르시기를)(\s)/g,
      '$1<break time="380ms"/>$2'
    );

    // (g) 인용/직접화법 따옴표 처리 — 따옴표 앞뒤로 짧은 호흡
    processed = processed.replace(/(&quot;|&apos;|"|')/g, '<break time="150ms"/>$1');
  } else {
    // 영어: 문장 끝 호흡
    processed = processed.replace(/([.!?])(?!<)/g, '$1<break time="420ms"/>');
    processed = processed.replace(/([:;])/g, '$1<break time="300ms"/>');
    processed = processed.replace(/,(?!<)/g, ',<break time="170ms"/>');
    // 영어 접속사 앞 짧은 호흡
    processed = processed.replace(
      /(^|\s)(But|However|Therefore|Moreover|Furthermore|Yet|For|Behold|And so)\s/g,
      '$1<break time="200ms"/>$2 '
    );
  }

  return processed;
}

// ─────────────────────────────────────────────────────────
// Edge TTS — msedge-tts 라이브러리 사용
// toStream 의 input 인자에는 인라인 SSML 요소(<break>, <emphasis>)를 넣을 수 있음
// ─────────────────────────────────────────────────────────
async function synthesizeWithEdge(text: string, voiceName: string, lang: Lang): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const ssmlBody = buildSSMLBody(text, lang);

  const { audioStream } = tts.toStream(ssmlBody, {
    rate: lang === 'ko' ? '-10%' : '-4%',  // 한국어는 더 느리고 차분한 묵상 톤
    pitch: lang === 'ko' ? '-3%' : '-2%',  // 살짝 낮은 음높이로 따뜻함 강조
  });

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => resolve());
    audioStream.on('error', (err: Error) => reject(err));
    setTimeout(() => reject(new Error('Edge TTS timeout')), 30000);
  });

  return Buffer.concat(chunks);
}

// ─────────────────────────────────────────────────────────
// Google Cloud TTS — REST API + API key (SDK 의존성 없음)
// ─────────────────────────────────────────────────────────
function googleApiKey(): string | null {
  return process.env.GOOGLE_TTS_API_KEY || null;
}

async function synthesizeWithGoogle(text: string, voiceName: string, lang: Lang): Promise<Buffer> {
  const apiKey = googleApiKey();
  if (!apiKey) throw new Error('Google TTS not configured');

  const ssmlBody = buildSSMLBody(text, lang);
  const ssml = `<speak><prosody rate="${lang === 'ko' ? '0.92' : '0.96'}" pitch="-1st">${ssmlBody}</prosody></speak>`;
  const languageCode = lang === 'en' ? 'en-US' : 'ko-KR';

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { ssml },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: 'MP3',
          effectsProfileId: ['headphone-class-device'],
        },
      }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google TTS HTTP ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as { audioContent?: string };
  if (!data.audioContent) throw new Error('Google TTS: empty response');

  return Buffer.from(data.audioContent, 'base64');
}

// ─────────────────────────────────────────────────────────
// 엔진 선택 (auto 모드)
// ─────────────────────────────────────────────────────────
function resolveEngine(requested: Engine): 'edge' | 'google' {
  if (requested === 'google') return 'google';
  if (requested === 'edge') return 'edge';
  // auto: Google API 키가 있으면 Google, 없으면 Edge
  return googleApiKey() ? 'google' : 'edge';
}

// ─────────────────────────────────────────────────────────
// GET /api/tts — 사용 가능한 엔진 정보 조회
// ─────────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    engines: {
      edge: { available: true, label: '표준' },
      google: { available: !!googleApiKey(), label: '고품질' },
    },
    defaultEngine: googleApiKey() ? 'google' : 'edge',
  });
}

// ─────────────────────────────────────────────────────────
// POST /api/tts — 음성 합성
// ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text: string = body.text || '';
    const voice: VoiceId = body.voice || 'female';
    const lang: Lang = body.lang === 'en' ? 'en' : 'ko';
    const requestedEngine: Engine = body.engine || 'auto';

    if (!text || text.length === 0) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 });
    }

    const truncated = text.slice(0, 5000);
    const engine = resolveEngine(requestedEngine);
    const voiceName = pickVoice(engine, lang, voice);

    let audioBuffer: Buffer;
    try {
      if (engine === 'google') {
        audioBuffer = await synthesizeWithGoogle(truncated, voiceName, lang);
      } else {
        audioBuffer = await synthesizeWithEdge(truncated, voiceName, lang);
      }
    } catch (err) {
      // Google 실패 시 Edge로 폴백 (auto 모드일 때만)
      if (engine === 'google' && requestedEngine === 'auto') {
        console.warn('Google TTS failed, falling back to Edge:', (err as Error).message);
        const fallbackVoice = pickVoice('edge', lang, voice);
        audioBuffer = await synthesizeWithEdge(truncated, fallbackVoice, lang);
      } else {
        throw err;
      }
    }

    if (audioBuffer.length === 0) {
      return NextResponse.json({ error: '음성 생성 실패' }, { status: 502 });
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'X-TTS-Engine': engine,
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    const message = (err as Error).message || 'TTS 서버 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
