import { Devotional } from '@/types';
import { allDevotionals, getTodayDevotionalData } from '@/data';

// 365일 전체 묵상 데이터를 Devotional 타입으로 변환
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
