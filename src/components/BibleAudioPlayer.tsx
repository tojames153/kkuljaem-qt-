'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface Props {
  text: string;
  label?: string;
  lang?: 'ko' | 'en';
}

type VoiceKey = 'sunhi' | 'jimin' | 'injoon' | 'bongjin' | 'jenny' | 'aria' | 'guy' | 'davis';
type Engine = 'edge' | 'google' | 'auto';

interface VoiceOption {
  key: VoiceKey;
  label: string;
  gender: 'female' | 'male';
}

const VOICE_OPTIONS: Record<'ko' | 'en', VoiceOption[]> = {
  ko: [
    { key: 'sunhi',   label: '선희',  gender: 'female' },
    { key: 'jimin',   label: '지민',  gender: 'female' },
    { key: 'injoon',  label: '인준',  gender: 'male' },
    { key: 'bongjin', label: '봉진',  gender: 'male' },
  ],
  en: [
    { key: 'jenny', label: 'Jenny', gender: 'female' },
    { key: 'aria',  label: 'Aria',  gender: 'female' },
    { key: 'guy',   label: 'Guy',   gender: 'male' },
    { key: 'davis', label: 'Davis', gender: 'male' },
  ],
};

const DEFAULT_VOICE: Record<'ko' | 'en', VoiceKey> = {
  ko: 'sunhi',
  en: 'jenny',
};

// 구버전 localStorage 값 ('female'/'male') → 신버전 보이스 키 마이그레이션
function migrateVoiceValue(stored: string | null, currentLang: 'ko' | 'en'): VoiceKey {
  if (!stored) return DEFAULT_VOICE[currentLang];
  if (stored === 'female') return currentLang === 'ko' ? 'sunhi' : 'jenny';
  if (stored === 'male') return currentLang === 'ko' ? 'injoon' : 'guy';
  // 이미 신규 키면 그대로
  const allKeys: VoiceKey[] = ['sunhi', 'jimin', 'injoon', 'bongjin', 'jenny', 'aria', 'guy', 'davis'];
  if (allKeys.includes(stored as VoiceKey)) return stored as VoiceKey;
  return DEFAULT_VOICE[currentLang];
}

const MAX_TTS_LENGTH = 4500;

// 무음 mp3 (모바일 오디오 잠금 해제용, 아주 짧은 무음)
const SILENCE_DATA_URI = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAIF8ANKUAAAIAAANILAAAAEX/Bf/EDBQ+D5/KAgCAIHygIAmD/ygfB8HwfAgCAYPg+D4Pg+BAMHwfB8HwfB8CAYPg+D4Pg+D4EAwfB8HwfB8HwIBg+D4Pg+D4PgQDB8HwfB8HwfAgGD4Pg+D4Pg+BAMH/5cEAQBAEAQBAEAQBAEAf/7UMQOAAAAANIAAAAAAAANIAAAABCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCEIQhCE';

export default function BibleAudioPlayer({ text, label = '성경 듣기', lang = 'ko' }: Props) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceKey>(() => {
    if (typeof window !== 'undefined') {
      return migrateVoiceValue(localStorage.getItem('kkuljaem-tts-voice'), lang);
    }
    return DEFAULT_VOICE[lang];
  });
  const [engine, setEngine] = useState<Engine>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('kkuljaem-tts-engine') as Engine) || 'auto';
    }
    return 'auto';
  });
  const [googleAvailable, setGoogleAvailable] = useState(false);
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [error, setError] = useState('');

  // 핵심: 하나의 Audio 객체를 재사용 (모바일 자동재생 제한 우회)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<string[]>([]);
  const playingRef = useRef(false);
  const currentChunkRef = useRef(0);
  const audioUrlsRef = useRef<string[]>([]);
  const selectedVoiceRef = useRef<VoiceKey>(selectedVoice);
  const langRef = useRef<'ko' | 'en'>(lang);
  const engineRef = useRef<Engine>('auto');
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kkuljaem-tts-voice', selectedVoice);
    }
  }, [selectedVoice]);

  useEffect(() => {
    engineRef.current = engine;
    if (typeof window !== 'undefined') {
      localStorage.setItem('kkuljaem-tts-engine', engine);
    }
  }, [engine]);

  // 마운트 시 사용 가능한 엔진 조회
  useEffect(() => {
    let cancelled = false;
    fetch('/api/tts')
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const available = !!data?.engines?.google?.available;
        setGoogleAvailable(available);
        // 사용자가 고품질을 골랐는데 사용 불가면 auto로 강등
        if (!available && engineRef.current === 'google') {
          setEngine('auto');
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // 언어/본문이 바뀌면 재생을 중단해 새 텍스트/음성으로 다시 시작하도록
  useEffect(() => {
    langRef.current = lang;
    // 현재 선택된 음성이 새 언어의 음성 목록에 없으면 기본값으로 전환
    const validKeys = VOICE_OPTIONS[lang].map((v) => v.key);
    if (!validKeys.includes(selectedVoiceRef.current)) {
      const fallback = DEFAULT_VOICE[lang];
      setSelectedVoice(fallback);
      selectedVoiceRef.current = fallback;
    }
    stopAll();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setCurrentChunk(0);
    setError('');
  }, [lang, text]);

  useEffect(() => {
    return () => { stopAll(); };
  }, []);

  // 모바일 오디오 잠금 해제: 사용자 제스처 내에서 호출해야 함
  const unlockAudio = useCallback(() => {
    if (audioUnlockedRef.current && audioRef.current) return audioRef.current;

    const audio = new Audio();
    audio.src = SILENCE_DATA_URI;
    audio.volume = 0.01;
    audio.play().then(() => {
      audio.pause();
      audio.volume = 1;
      audio.src = '';
      audioUnlockedRef.current = true;
    }).catch(() => {
      // 잠금 해제 실패해도 계속 진행
    });

    audioRef.current = audio;
    return audio;
  }, []);

  const stopAll = () => {
    playingRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    audioUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    audioUrlsRef.current = [];
  };

  const splitIntoChunks = useCallback((input: string): string[] => {
    const cleaned = input.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= MAX_TTS_LENGTH) return [cleaned];

    const chunks: string[] = [];
    let remaining = cleaned;
    while (remaining.length > 0) {
      if (remaining.length <= MAX_TTS_LENGTH) {
        chunks.push(remaining);
        break;
      }
      let cutPoint = remaining.lastIndexOf('.', MAX_TTS_LENGTH);
      if (cutPoint < MAX_TTS_LENGTH * 0.5) cutPoint = remaining.lastIndexOf(' ', MAX_TTS_LENGTH);
      if (cutPoint < 100) cutPoint = MAX_TTS_LENGTH;
      chunks.push(remaining.slice(0, cutPoint + 1).trim());
      remaining = remaining.slice(cutPoint + 1).trim();
    }
    return chunks;
  }, []);

  const fetchTtsAudio = async (chunkText: string, voice: string, voiceLang: 'ko' | 'en', voiceEngine: Engine): Promise<string> => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunkText, voice, lang: voiceLang, engine: voiceEngine }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'TTS 실패' }));
      throw new Error(errData.error || 'TTS 생성 실패');
    }
    const blob = await res.blob();
    if (blob.size < 100) throw new Error('음성 데이터가 비어있습니다');
    const url = URL.createObjectURL(blob);
    audioUrlsRef.current.push(url);
    return url;
  };

  // 이미 잠금 해제된 Audio 객체를 사용하여 재생
  const playAudioUrl = useCallback((url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const audio = audioRef.current;
      if (!audio) {
        reject(new Error('Audio not initialized'));
        return;
      }

      // 이전 이벤트 핸들러 제거
      audio.onended = null;
      audio.onerror = null;
      audio.ontimeupdate = null;

      audio.src = url;
      audio.playbackRate = speed;
      audio.volume = 1;

      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('재생 오류'));

      audio.ontimeupdate = () => {
        if (audio.duration && playingRef.current) {
          const i = currentChunkRef.current;
          const total = chunksRef.current.length;
          const chunkProgress = audio.currentTime / audio.duration;
          const totalProgress = ((i + chunkProgress) / total) * 100;
          setProgress(totalProgress);
        }
      };

      audio.play().catch(reject);
    });
  }, [speed]);

  const playChunks = useCallback(async (startIdx: number) => {
    const chunks = chunksRef.current;
    playingRef.current = true;
    setPlaying(true);
    setPaused(false);
    setError('');

    const voice = selectedVoiceRef.current;
    const voiceLang = langRef.current;
    const voiceEngine = engineRef.current;

    for (let i = startIdx; i < chunks.length; i++) {
      if (!playingRef.current) break;

      currentChunkRef.current = i;
      setCurrentChunk(i);
      setProgress((i / chunks.length) * 100);

      try {
        setLoading(true);
        const audioUrl = await fetchTtsAudio(chunks[i], voice, voiceLang, voiceEngine);
        setLoading(false);

        if (!playingRef.current) break;

        await playAudioUrl(audioUrl);
      } catch (err) {
        setLoading(false);
        if ((err as Error).message === 'stopped') break;
        console.warn('TTS 오류:', err);
        setError(`음성 재생 오류: ${(err as Error).message}`);
        break;
      }
    }

    playingRef.current = false;
    setPlaying(false);
    setLoading(false);
    if (currentChunkRef.current >= chunks.length - 1) {
      setProgress(100);
      setTimeout(() => { setProgress(0); setCurrentChunk(0); }, 1500);
    }
  }, [speed, playAudioUrl]);

  // 사용자 터치/클릭 시점에 호출 (제스처 컨텍스트 유지)
  const handlePlay = useCallback(() => {
    if (!text.trim()) return;

    // 핵심: 사용자 제스처 내에서 즉시 Audio 잠금 해제
    unlockAudio();

    if (paused) {
      if (audioRef.current && audioRef.current.src) {
        playingRef.current = true;
        setPlaying(true);
        setPaused(false);
        audioRef.current.play().catch(() => {});
        return;
      }
      playChunks(currentChunkRef.current);
      return;
    }

    // 새로 시작
    stopAll();
    // stopAll이 audioRef를 비우므로 다시 잠금 해제
    unlockAudio();
    setError('');
    setProgress(0);
    chunksRef.current = splitIntoChunks(text);
    setTotalChunks(chunksRef.current.length);
    currentChunkRef.current = 0;
    playChunks(0);
  }, [text, speed, paused, splitIntoChunks, playChunks, unlockAudio]);

  const handlePause = useCallback(() => {
    playingRef.current = false;
    if (audioRef.current) audioRef.current.pause();
    setPlaying(false);
    setPaused(true);
  }, []);

  const handleStop = useCallback(() => {
    stopAll();
    // Audio 객체를 유지하되 재생 상태만 초기화
    unlockAudio();
    setPlaying(false);
    setPaused(false);
    setProgress(0);
    setCurrentChunk(0);
    setLoading(false);
    setError('');
  }, [unlockAudio]);

  const handleVoiceChange = useCallback((voiceKey: VoiceKey) => {
    setSelectedVoice(voiceKey);
    selectedVoiceRef.current = voiceKey;
    if (playing || paused) handleStop();
  }, [playing, paused, handleStop]);

  const handleEngineChange = useCallback((next: Engine) => {
    if (next === 'google' && !googleAvailable) return;
    setEngine(next);
    engineRef.current = next;
    if (playing || paused) handleStop();
  }, [googleAvailable, playing, paused, handleStop]);

  if (!text.trim()) return null;

  const speeds = [
    { value: 0.8, label: '느리게' },
    { value: 1, label: '보통' },
    { value: 1.2, label: '빠르게' },
    { value: 1.5, label: '매우빠르게' },
  ];

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-3 border border-indigo-100 mb-3">
      {/* 음성 선택 (4종) */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-[10px] text-indigo-500 font-semibold mr-0.5">
          {lang === 'en' ? 'Voice:' : '음성:'}
        </span>
        {VOICE_OPTIONS[lang].map((opt) => {
          const active = selectedVoice === opt.key;
          const isFemale = opt.gender === 'female';
          return (
            <button
              key={opt.key}
              onClick={() => handleVoiceChange(opt.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                active
                  ? isFemale
                    ? 'bg-pink-500 text-white shadow-sm'
                    : 'bg-blue-500 text-white shadow-sm'
                  : isFemale
                    ? 'bg-white text-pink-400 border border-pink-200 hover:bg-pink-50'
                    : 'bg-white text-blue-400 border border-blue-200 hover:bg-blue-50'
              }`}
              title={`${isFemale ? '여성' : '남성'} — ${opt.label}`}
            >
              <span>{isFemale ? '👩' : '👨'}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
        {lang === 'en' && (
          <span className="text-[10px] text-indigo-400 ml-auto">EN</span>
        )}
      </div>

      {/* 품질 선택 — Google API 키가 설정된 경우에만 노출 */}
      {googleAvailable && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] text-indigo-500 font-semibold">품질:</span>
          <button
            onClick={() => handleEngineChange('auto')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              engine === 'auto'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white text-indigo-400 border border-indigo-200 hover:bg-indigo-50'
            }`}
            title="환경에 따라 자동 선택"
          >
            자동
          </button>
          <button
            onClick={() => handleEngineChange('edge')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
              engine === 'edge'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white text-indigo-400 border border-indigo-200 hover:bg-indigo-50'
            }`}
            title="Microsoft Edge TTS — 무료, 빠름"
          >
            표준
          </button>
          <button
            onClick={() => handleEngineChange('google')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1 ${
              engine === 'google'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-white text-emerald-500 border border-emerald-200 hover:bg-emerald-50'
            }`}
            title="Google Cloud Neural2 — 가장 자연스러움"
          >
            <span>✨</span>
            <span>고품질</span>
          </button>
        </div>
      )}

      {/* 메인 컨트롤 */}
      <div className="flex items-center gap-2">
        {!playing && !paused ? (
          <button
            onClick={handlePlay}
            disabled={loading}
            className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-indigo-600 transition-colors flex-shrink-0 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>
        ) : playing ? (
          <button
            onClick={handlePause}
            className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-indigo-600 transition-colors flex-shrink-0"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
              </svg>
            )}
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-sm hover:bg-amber-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-indigo-700 truncate">
              {VOICE_OPTIONS[lang].find((v) => v.key === selectedVoice)?.gender === 'female' ? '👩' : '👨'} {label}
            </span>
            <div className="flex items-center gap-2">
              {loading && <span className="text-[10px] text-indigo-400">음성 생성중...</span>}
              {(playing || paused) && totalChunks > 1 && (
                <span className="text-[10px] text-indigo-400">{currentChunk + 1}/{totalChunks}</span>
              )}
              {(playing || paused) && (
                <button onClick={handleStop} className="text-[10px] text-stone-400 hover:text-red-400">중지</button>
              )}
            </div>
          </div>
          <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* 속도 조절 */}
      <div className="flex items-center justify-end mt-2 gap-1">
        <span className="text-[10px] text-indigo-400 mr-1">속도:</span>
        {speeds.map((s) => (
          <button
            key={s.value}
            onClick={() => setSpeed(s.value)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              speed === s.value
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'bg-white text-indigo-400 border border-indigo-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-2">
          <p className="text-[10px] text-red-400 flex-1">{error}</p>
          <button onClick={handlePlay} className="text-[10px] text-indigo-500 font-semibold">다시 시도</button>
        </div>
      )}
    </div>
  );
}
