import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// 한국어 음성 매핑
const VOICE_MAP: Record<string, string> = {
  female: 'ko-KR-SunHiNeural',    // 여성 (선희)
  male: 'ko-KR-InJoonNeural',     // 남성 (인준)
  nova: 'ko-KR-SunHiNeural',      // OpenAI 호환 (여성)
  onyx: 'ko-KR-InJoonNeural',     // OpenAI 호환 (남성)
};

export async function POST(request: NextRequest) {
  try {
    const { text, voice = 'female' } = await request.json();

    if (!text || text.length === 0) {
      return NextResponse.json({ error: '텍스트가 없습니다.' }, { status: 400 });
    }

    // 최대 글자 제한
    const truncated = text.slice(0, 5000);

    // 음성 선택
    const voiceName = VOICE_MAP[voice] || VOICE_MAP['female'];

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
