import { Devotional } from '@/types';
import { allDevotionals, getTodayDevotionalData, getDevotionalForDate } from '@/data';

export const sampleDevotionals = allDevotionals;

export function getTodayDevotional(): Devotional {
  const data = getTodayDevotionalData();
  return {
    ...data,
    id: `day-${data.day}`,
    created_at: new Date().toISOString(),
  } as Devotional;
}

export function getDevotionalForDay(day: number): Devotional | null {
  const data = allDevotionals.find((d) => d.day === day);
  if (!data) return null;
  return {
    ...data,
    id: `day-${data.day}`,
    created_at: new Date().toISOString(),
  } as Devotional;
}

// 특정 날짜의 묵상 (교회력 기반)
export function getDevotionalByDate(date: Date): Devotional {
  const data = getDevotionalForDate(date);
  return {
    ...data,
    id: `day-${data.day}`,
    created_at: new Date().toISOString(),
  } as Devotional;
}
