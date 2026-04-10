'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const hideTimer = setTimeout(() => setHidden(true), 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden={fadeOut}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 via-yellow-400 to-orange-300 transition-opacity duration-500 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${mounted ? '' : 'opacity-0'}`}
    >
      {/* 장식: 부드러운 광원 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center gap-7 px-8">
        {/* 앱 아이콘 */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl bg-white/30 blur-xl streak-glow" />
          <div className="relative w-28 h-28 rounded-3xl shadow-2xl overflow-hidden bg-white/90 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-512.png"
              alt="꿀잼QT"
              width={112}
              height={112}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 앱 이름 */}
        <h1 className="text-3xl font-bold text-white drop-shadow-md tracking-tight">
          <span className="mr-1.5">🍯</span>꿀잼QT
        </h1>

        {/* 시편 19:10 */}
        <div className="max-w-xs text-center animate-fade-in">
          <p className="text-white text-base leading-relaxed font-medium drop-shadow-sm">
            금 곧 많은 순금보다
            <br />
            더 사모할 것이며
            <br />
            <span className="font-bold">꿀과 송이꿀보다 더 달도다</span>
          </p>
          <p className="text-white/85 text-xs mt-4 font-semibold tracking-widest uppercase">
            — 시편 19:10 —
          </p>
        </div>

        {/* 로딩 점 */}
        <div className="flex gap-1.5 mt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '200ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}
