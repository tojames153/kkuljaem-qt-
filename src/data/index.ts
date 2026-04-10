import { devotionalsPart1a } from './devotionals-part1a';
import { devotionalsPart1b } from './devotionals-part1b';
import { devotionalsPart2 } from './devotionals-part2';
import { devotionalsPart3 } from './devotionals-part3';
import { type SeasonId, findSeasonForDate } from '@/lib/church-calendar';

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

// 365일 전체 묵상 데이터 (기존 호환용)
export const allDevotionals: DevotionalData[] = [
  ...devotionalsPart1a,
  ...devotionalsPart1b,
  ...devotionalsPart2,
  ...devotionalsPart3,
].sort((a, b) => a.day - b.day);

// 시즌명 정규화: 묵상 데이터의 season 필드 → SeasonId
function normalizeSeasonId(season: string): SeasonId {
  const s = season.trim();
  if (s === '대림절') return 'advent';
  if (s === '성탄절') return 'christmas';
  if (s === '주현절') return 'epiphany';
  if (s === '사순절') return 'lent';
  if (s === '고난주간') return 'holy_week';
  if (s === '부활절') return 'easter';
  if (s === '성령강림절') return 'pentecost';
  if (s.includes('연중시기') && (s.includes('늦가을') || s.includes('LateAutumn'))) return 'ordinary_late_autumn';
  if (s.includes('연중시기') && s.includes('가을')) return 'ordinary_autumn';
  if (s.includes('연중시기')) return 'ordinary_summer'; // "연중시기", "연중시기 여름", "연중시기(여름)" 모두
  if (s === '연말') return 'year_end';
  return 'ordinary_summer'; // 폴백
}

// 시즌별 묵상 풀 생성
const devotionalPool: Record<SeasonId, DevotionalData[]> = {
  advent: [],
  christmas: [],
  epiphany: [],
  lent: [],
  holy_week: [],
  easter: [],
  pentecost: [],
  ordinary_summer: [],
  ordinary_autumn: [],
  ordinary_late_autumn: [],
  year_end: [],
};

// 풀 초기화
for (const d of allDevotionals) {
  const sid = normalizeSeasonId(d.season);
  devotionalPool[sid].push(d);
}

// 날짜 기반 묵상 선택 (교회력 시즌에 맞춰)
export function getDevotionalForDate(date: Date): DevotionalData {
  const { seasonId, dayInSeason } = findSeasonForDate(date);
  const pool = devotionalPool[seasonId];

  if (!pool || pool.length === 0) {
    // 풀이 비어있으면 폴백
    return allDevotionals[0];
  }

  // dayInSeason은 1부터 시작, 풀 크기를 초과하면 순환
  const index = (dayInSeason - 1) % pool.length;
  return pool[index];
}

// 오늘의 묵상 (교회력 기반)
export function getTodayDevotionalData(): DevotionalData {
  return getDevotionalForDate(new Date());
}

// 특정 Day 묵상 가져오기 (기존 호환)
export function getDevotionalByDay(day: number): DevotionalData | undefined {
  return allDevotionals.find((d) => d.day === day);
}

// 시즌 풀 내보내기 (디버깅/관리용)
export { devotionalPool, normalizeSeasonId };
