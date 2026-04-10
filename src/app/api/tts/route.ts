import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Lang = 'ko' | 'en';
type Engine = 'edge' | 'google' | 'auto';

// ─────────────────────────────────────────────────────────
// 음성 매핑: 엔진 × 언어 × 음성ID → 실제 음성 이름
//
// ⚠️ Edge TTS 무료 엔드포인트(speech.platform.bing.com)는 Azure 전체 음성 중
// 일부만 노출함. 실제 라이브 엔드포인트에서 검증한 결과:
//   · 한국어 3개: SunHi, InJoon, HyunsuMultilingual
//   · 영어 17개 (그 중 4개를 채택)
// ─────────────────────────────────────────────────────────
const VOICE_MAP: Record<'edge' | 'google', Record<Lang, Record<string, string>>> = {
  edge: {
    ko: {
      sunhi: 'ko-KR-SunHiNeural',                  // 여성 — 표준
      injoon: 'ko-KR-InJoonNeural',                // 남성 — 표준
      hyunsu: 'ko-KR-HyunsuMultilingualNeural',    // 남성 — 멀티링구얼 신형
      // 호환 (구버전 voice='female'/'male')
      female: 'ko-KR-SunHiNeural',
      male: 'ko-KR-InJoonNeural',
      nova: 'ko-KR-SunHiNeural',
      onyx: 'ko-KR-InJoonNeural',
    },
    en: {
      jenny: 'en-US-JennyNeural',
      aria: 'en-US-AriaNeural',
      guy: 'en-US-GuyNeural',
      andrew: 'en-US-AndrewMultilingualNeural',
      female: 'en-US-JennyNeural',
      male: 'en-US-GuyNeural',
      nova: 'en-US-JennyNeural',
      onyx: 'en-US-GuyNeural',
    },
  },
  google: {
    ko: {
      sunhi: 'ko-KR-Neural2-B',
      injoon: 'ko-KR-Neural2-C',
      hyunsu: 'ko-KR-Neural2-A',
      female: 'ko-KR-Neural2-B',
      male: 'ko-KR-Neural2-C',
      nova: 'ko-KR-Neural2-A',
      onyx: 'ko-KR-Neural2-C',
    },
    en: {
      jenny: 'en-US-Neural2-F',
      aria: 'en-US-Neural2-G',
      guy: 'en-US-Neural2-D',
      andrew: 'en-US-Neural2-J',
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
// 텍스트 전처리
//
// ⚠️ 중대한 발견 (라이브 테스트로 검증):
// Edge TTS 무료 엔드포인트는 인라인 SSML 태그를 일체 거부한다.
// <break>, <emphasis>, <prosody>, <p>, <s> 등을 포함하면 silent하게
// 0 bytes 응답을 반환함. 따라서 본문은 *순수 평문* 으로 보내야 함.
//
// 자연스러운 호흡은:
//   1. punctuation (마침표/쉼표/물음표) — Microsoft TTS가 자동으로 호흡 생성
//   2. msedge-tts ProsodyOptions (rate/pitch) — 라이브러리가 SSML 래퍼에서 처리
// 두 가지로만 만들어야 한다.
//
// XML escape 필수: `&`, `<`, `>` 가 본문에 포함되면 라이브러리의 SSML 템플릿
// 안에서 XML이 깨진다. (`"`, `'` 는 element content 이므로 escape 불필요)
// ─────────────────────────────────────────────────────────
function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ─────────────────────────────────────────────────────────
// Edge TTS — msedge-tts 라이브러리
// ─────────────────────────────────────────────────────────
async function synthesizeWithEdge(text: string, voiceName: string, lang: Lang): Promise<Buffer> {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const processed = preprocessText(text);

  // ⚠️ rate/pitch 만 사용. 둘 다 라이브러리가 SSML 래퍼의 <prosody> 속성으로 적용한다.
  // 한국어는 -10% 로 차분한 묵상 톤. 영어는 -5% 로 살짝 느리게.
  // pitch 는 default('+0Hz')가 가장 자연스러움 — 음성마다 다른 기본 음높이를 그대로 살림.
  const { audioStream } = tts.toStream(processed, {
    rate: lang === 'ko' ? '-10%' : '-5%',
    pitch: '+0Hz',
  });

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
    audioStream.on('end', () => resolve());
    audioStream.on('error', (err: Error) => reject(err));
    setTimeout(() => reject(new Error('Edge TTS timeout')), 30000);
  });

  try { tts.close(); } catch {}
  return Buffer.concat(chunks);
}

// ─────────────────────────────────────────────────────────
// Google Cloud TTS — REST API + API key (선택, 키 있을 때만)
// Google 은 SSML 을 완벽 지원하므로 break tag 도 사용 가능하지만,
// 일관성을 위해 평문 + speakingRate 만 사용.
// ─────────────────────────────────────────────────────────
function googleApiKey(): string | null {
  return process.env.GOOGLE_TTS_API_KEY || null;
}

async function synthesizeWithGoogle(text: string, voiceName: string, lang: Lang): Promise<Buffer> {
  const apiKey = googleApiKey();
  if (!apiKey) throw new Error('Google TTS not configured');

  const cleaned = text.replace(/\s+/g, ' ').trim();
  const languageCode = lang === 'en' ? 'en-US' : 'ko-KR';

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text: cleaned },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: lang === 'ko' ? 0.92 : 0.96,
          pitch: 0,
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
    const voice: string = body.voice || 'female';
    const lang: Lang = body.lang === 'en' ? 'en' : 'ko';
    const requestedEngine: Engine = body.engine || 'auto';

    if (!text || text.length === 0) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 });
    }

    // 라이브 테스트 결과 4500자까지 안전하게 처리됨. 4000자로 안전 마진 확보.
    const truncated = text.slice(0, 4000);
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
      return NextResponse.json({ error: '음성 생성 실패 (빈 응답)' }, { status: 502 });
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
