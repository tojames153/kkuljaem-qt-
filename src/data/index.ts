import { devotionalsPart1a } from './devotionals-part1a';
import { devotionalsPart1b } from './devotionals-part1b';
import { devotionalsPart2 } from './devotionals-part2';
import { devotionalsPart3 } from './devotionals-part3';

export interface DevotionalData {
  day: number;
  season: string;
  theme: string;
  passage: string;
  meditation: string;
  question1: string;
  question2: string;
  question3: string;
  prayer: string;
  ccm: string;
  memory_verse: string;
  age_children: string;
  age_youth: string;
  age_young_adult: string;
}

// 365일 전체 묵상 데이터 (교회력 기반)
export const allDevotionals: DevotionalData[] = [
  ...devotionalsPart1a,  // Day 1-60:   대림절, 성탄절, 주현절
  ...devotionalsPart1b,  // Day 61-120: 주현절, 사순절
  ...devotionalsPart2,   // Day 121-240: 사순절, 고난주간, 부활절, 성령강림절, 연중시기(여름)
  ...devotionalsPart3,   // Day 241-365: 연중시기(여름/가을/늦가을), 연말
].sort((a, b) => a.day - b.day);

// 오늘의 묵상 가져오기 (1월 1일 = Day 1)
export function getTodayDevotionalData(): DevotionalData {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const index = ((dayOfYear - 1) % 365 + 365) % 365;
  return allDevotionals[index] || allDevotionals[0];
}

// 특정 Day 묵상 가져오기
export function getDevotionalByDay(day: number): DevotionalData | undefined {
  return allDevotionals.find((d) => d.day === day);
}
