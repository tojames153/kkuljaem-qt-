'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 이미 설치되었거나 이전에 닫았으면 안 보여줌
    const dismissed = localStorage.getItem('kkuljaem-install-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / 86400000;
      if (daysSince < 7) return; // 7일간 안 보여줌
    }

    // standalone 모드(이미 설치)이면 안 보여줌
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS 감지
    const ua = navigator.userAgent;
    const isIOSDevice = /iPhone|iPad|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // iOS는 beforeinstallprompt가 없으므로 직접 배너 표시
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    // Android/Chrome: beforeinstallprompt 이벤트 리스닝
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('kkuljaem-install-dismissed', new Date().toISOString());
  };

  if (!showBanner) return null;

  return (
    <>
      {/* 설치 배너 */}
      <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-up">
        <div className="bg-gradient-to-r from-amber-500 to-orange-400 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
              🍯
            </div>
            <div className="flex-1 text-white">
              <p className="font-bold text-sm">홈 화면에 kkuljaem-qt 추가</p>
              <p className="text-white/80 text-xs mt-0.5">
                {isIOS ? '홈 화면에 추가하여 앱처럼 사용하세요' : '앱처럼 빠르게 접속할 수 있어요'}
              </p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="bg-white text-amber-600 font-bold text-xs px-4 py-2 rounded-lg shadow-sm"
              >
                {isIOS ? '방법 보기' : '설치'}
              </button>
              <button
                onClick={handleDismiss}
                className="text-white/60 text-[10px] text-center"
              >
                나중에
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS 가이드 모달 */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={handleDismiss}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-brown mb-4">홈 화면에 추가하기</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">1</span>
                <div>
                  <p className="text-sm font-semibold text-stone-700">Safari 하단의 공유 버튼 탭</p>
                  <p className="text-xs text-stone-400 mt-0.5">화살표가 위를 가리키는 네모 아이콘</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">2</span>
                <div>
                  <p className="text-sm font-semibold text-stone-700">&quot;홈 화면에 추가&quot; 선택</p>
                  <p className="text-xs text-stone-400 mt-0.5">목록을 아래로 스크롤하세요</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">3</span>
                <div>
                  <p className="text-sm font-semibold text-stone-700">&quot;추가&quot; 버튼 탭</p>
                  <p className="text-xs text-stone-400 mt-0.5">홈 화면에 kkuljaem-qt 아이콘이 생겨요!</p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full mt-5 btn-honey py-3 rounded-xl font-bold text-sm"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
}
