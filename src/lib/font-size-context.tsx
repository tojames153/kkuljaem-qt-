'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface FontSizeContextType {
  fontSize: number; // 0.8 ~ 1.4 (배율)
  setFontSize: (size: number) => void;
  fontSizeLabel: string;
}

const FontSizeContext = createContext<FontSizeContextType | null>(null);

const STORAGE_KEY = 'kkuljaem-font-size';
const FONT_SIZES = [
  { value: 0.85, label: '작게' },
  { value: 0.925, label: '조금 작게' },
  { value: 1, label: '보통' },
  { value: 1.1, label: '조금 크게' },
  { value: 1.2, label: '크게' },
  { value: 1.35, label: '매우 크게' },
];

export { FONT_SIZES };

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState(1);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (parsed >= 0.8 && parsed <= 1.5) {
          setFontSizeState(parsed);
          document.documentElement.style.setProperty('--font-scale', String(parsed));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const setFontSize = useCallback((size: number) => {
    const clamped = Math.max(0.8, Math.min(1.5, size));
    setFontSizeState(clamped);
    document.documentElement.style.setProperty('--font-scale', String(clamped));
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      // ignore
    }
  }, []);

  const fontSizeLabel = FONT_SIZES.find((f) => f.value === fontSize)?.label || '보통';

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, fontSizeLabel }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  const ctx = useContext(FontSizeContext);
  if (!ctx) throw new Error('useFontSize must be used within FontSizeProvider');
  return ctx;
}
