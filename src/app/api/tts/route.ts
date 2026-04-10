import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// 언어별 음성 매핑
const VOICE_MAP: Record<string, Record<string, string>> = {
  ko: {
    female: 'ko-KR-SunHiNeural',    // 여성 (선희)
    male: 'ko-KR-InJoonNeural',     // 남성 (인준)
    nova: 'ko-KR-SunHiNeural',
    onyx: 'ko-KR-InJoonNeural',
  },
  en: {
    female: 'en-US-JennyNeural',    // 여성 (Jenny) — 부드럽고 자연스러운 영어 음성
    male: 'en-US-GuyNeural',        // 남성 (Guy) — 명료하고 차분한 영어 음성
    nova: 'en-US-JennyNeural',
    onyx: 'en-US-GuyNeural',
  },
};

function pickVoice(lang: string, voice: string): string {
  const langMap = VOICE_MAP[lang] || VOICE_MAP['ko'];
  return langMap[voice] || langMap['female'];
}

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'female', lang = 'ko' } = await request.json();

    if (!text || text.length === 0) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 });
    }

    // 최대 글자 제한
    const truncated = text.slice(0, 5000);

    // 음성 선택 (언어 + 성별)
    const voiceName = pickVoice(lang, voice);

    // Microsoft Edge TTS 생성
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(truncated);

    // 스트림을 버퍼로 수집
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      audioStream.on('end', () => resolve());
      audioStream.on('error', (err: Error) => reject(err));
      // 30초 타임아웃
      setTimeout(() => reject(new Error('TTS timeout')), 30000);
    });

    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
      return NextResponse.json({ error: '음성 생성 실패' }, { status: 502 });
    }

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (err) {
    console.error('TTS error:', err);
    return NextResponse.json({ error: 'TTS 서버 오류' }, { status: 500 });
  }
}
