// 교회력 시즌 동적 계산 (부활절 기반)
// 2026년, 2027년 및 이후 연도 자동 대응

export type SeasonId =
  | 'advent' | 'christmas' | 'epiphany' | 'lent'
  | 'holy_week' | 'easter' | 'pentecost'
  | 'ordinary_summer' | 'ordinary_autumn' | 'ordinary_late_autumn'
  | 'year_end';

export interface SeasonPeriod {
  seasonId: SeasonId;
  nameKo: string;
  start: Date;
  end: Date;
}

export interface DayAssignment {
  day: number;
  seasonNameKo: string;
  themeHint: string;
  books: string[];
}

// 시즌별 테마 힌트와 성경책 (기존 데이터 유지)
const SEASON_META: Record<SeasonId, { nameKo: string; themes: string[]; books: string[] }> = {
  advent: {
    nameKo: '대림절',
    themes: ['기다림', '소망', '준비', '예언의 성취', '메시아 오심', '빛', '구원의 약속'],
    books: ['이사야', '미가', '말라기', '누가복음', '마태복음'],
  },
  christmas: {
    nameKo: '성탄절',
    themes: ['탄생', '경배', '기쁨', '하나님의 선물', '임마누엘', '목자와 동방박사'],
    books: ['누가복음', '마태복음', '요한복음', '이사야'],
  },
  epiphany: {
    nameKo: '주현절',
    themes: ['나타남', '세례', '부르심', '제자도', '하나님나라', '치유', '기적'],
    books: ['마태복음', '마가복음', '요한복음', '이사야'],
  },
  lent: {
    nameKo: '사순절',
    themes: ['회개', '겸손', '십자가', '자기부인', '고난', '순종', '섬김'],
    books: ['마태복음', '마가복음', '누가복음', '시편', '이사야'],
  },
  holy_week: {
    nameKo: '고난주간',
    themes: ['예루살렘 입성', '성전 정화', '마지막 만찬', '겟세마네', '십자가', '죽음', '무덤'],
    books: ['마태복음', '마가복음', '누가복음', '요한복음'],
  },
  easter: {
    nameKo: '부활절',
    themes: ['부활', '새 생명', '승리', '만남', '증인', '소망', '영생', '성령의 약속'],
    books: ['요한복음', '사도행전', '고린도전서', '로마서', '베드로전서'],
  },
  pentecost: {
    nameKo: '성령강림절',
    themes: ['성령', '능력', '은사', '교회', '선교', '하나됨', '열매'],
    books: ['사도행전', '갈라디아서', '고린도전서', '로마서', '에베소서'],
  },
  ordinary_summer: {
    nameKo: '연중시기(여름)',
    themes: ['믿음', '사랑', '소망', '감사', '순종', '인내', '지혜', '기도', '성장', '섬김'],
    books: ['잠언', '전도서', '야고보서', '빌립보서', '골로새서', '시편'],
  },
  ordinary_autumn: {
    nameKo: '연중시기(가을)',
    themes: ['추수', '감사', '나눔', '공동체', '화해', '용서', '평화', '정의', '긍휼'],
    books: ['룻기', '에스더', '느헤미야', '데살로니가전서', '디모데전서', '시편'],
  },
  ordinary_late_autumn: {
    nameKo: '연중시기(늦가을)',
    themes: ['종말', '심판', '재림', '하나님나라', '영원', '충성', '깨어있음'],
    books: ['다니엘', '요한계시록', '데살로니가전서', '마태복음', '베드로후서'],
  },
  year_end: {
    nameKo: '연말',
    themes: ['돌아봄', '감사', '새출발', '약속', '신실하심', '계획', '헌신'],
    books: ['시편', '빌립보서', '히브리서', '이사야'],
  },
};

// 부활절 날짜 계산 (Meeus/Jones/Butcher 알고리즘)
export function computeEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// 날짜 유틸리티
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// n번째 일요일을 찾기 전에, 특정 날짜 이전의 가장 가까운 일요일
function sundayBefore(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

// 연도별 교회력 시즌 경계 계산
export function getChurchYearSeasons(year: number): SeasonPeriod[] {
  const easter = computeEasterDate(year);

  // 부활절 기반 계산
  const ashWednesday = addDays(easter, -46);       // 재의 수요일 (사순절 시작)
  const palmSunday = addDays(easter, -7);           // 종려주일 (고난주간 시작)
  const pentecostDay = addDays(easter, 49);         // 성령강림절
  const pentecostEnd = addDays(pentecostDay, 13);   // 성령강림절 끝 (2주)

  // 대림절: 성탄절 전 4번째 일요일
  const christmas = new Date(year, 11, 25);
  const adventStart = sundayBefore(addDays(christmas, -21)); // 대략 11/27 ~ 12/3 사이

  // 전년 대림절 → 올해 초 성탄절 계속
  const jan1 = new Date(year, 0, 1);
  const jan5 = new Date(year, 0, 5);
  const jan6 = new Date(year, 0, 6);     // 주현절
  const dec24 = new Date(year, 11, 24);
  const dec31 = new Date(year, 11, 31);

  // 연중시기 (성령강림절 후 ~ 대림절 전)
  const ordinaryStart = addDays(pentecostEnd, 1);
  const ordinaryEnd = addDays(adventStart, -1);
  const ordinaryDays = daysBetween(ordinaryStart, ordinaryEnd) + 1;
  const thirdOfOrdinary = Math.floor(ordinaryDays / 3);

  const ordinarySummerEnd = addDays(ordinaryStart, thirdOfOrdinary - 1);
  const ordinaryAutumnStart = addDays(ordinarySummerEnd, 1);
  const ordinaryAutumnEnd = addDays(ordinaryAutumnStart, thirdOfOrdinary - 1);
  const ordinaryLateAutumnStart = addDays(ordinaryAutumnEnd, 1);

  const seasons: SeasonPeriod[] = [
    // 1/1 ~ 1/5: 성탄절 (전년도 성탄절 계속)
    { seasonId: 'christmas', nameKo: '성탄절', start: jan1, end: jan5 },
    // 1/6 ~ 사순절 전날: 주현절
    { seasonId: 'epiphany', nameKo: '주현절', start: jan6, end: addDays(ashWednesday, -1) },
    // 사순절
    { seasonId: 'lent', nameKo: '사순절', start: ashWednesday, end: addDays(palmSunday, -1) },
    // 고난주간
    { seasonId: 'holy_week', nameKo: '고난주간', start: palmSunday, end: addDays(easter, -1) },
    // 부활절
    { seasonId: 'easter', nameKo: '부활절', start: easter, end: addDays(pentecostDay, -1) },
    // 성령강림절
    { seasonId: 'pentecost', nameKo: '성령강림절', start: pentecostDay, end: pentecostEnd },
    // 연중시기 (여름)
    { seasonId: 'ordinary_summer', nameKo: '연중시기(여름)', start: ordinaryStart, end: ordinarySummerEnd },
    // 연중시기 (가을)
    { seasonId: 'ordinary_autumn', nameKo: '연중시기(가을)', start: ordinaryAutumnStart, end: ordinaryAutumnEnd },
    // 연중시기 (늦가을)
    { seasonId: 'ordinary_late_autumn', nameKo: '연중시기(늦가을)', start: ordinaryLateAutumnStart, end: ordinaryEnd },
    // 대림절
    { seasonId: 'advent', nameKo: '대림절', start: adventStart, end: dec24 },
    // 성탄절 (연말)
    { seasonId: 'christmas', nameKo: '성탄절', start: christmas, end: dec31 },
  ];

  return seasons;
}

// 특정 날짜의 시즌 찾기
export function findSeasonForDate(date: Date): { seasonId: SeasonId; nameKo: string; dayInSeason: number } {
  const year = date.getFullYear();
  const seasons = getChurchYearSeasons(year);

  const dateOnly = new Date(year, date.getMonth(), date.getDate());

  for (const season of seasons) {
    const start = new Date(season.start.getFullYear(), season.start.getMonth(), season.start.getDate());
    const end = new Date(season.end.getFullYear(), season.end.getMonth(), season.end.getDate());

    if (dateOnly >= start && dateOnly <= end) {
      const dayInSeason = daysBetween(start, dateOnly) + 1;
      return { seasonId: season.seasonId, nameKo: season.nameKo, dayInSeason };
    }
  }

  // 폴백: 연중시기
  return { seasonId: 'ordinary_summer', nameKo: '연중시기(여름)', dayInSeason: 1 };
}

// 기존 호환: getDayAssignments (generate API용)
export function getDayAssignments(): DayAssignment[] {
  const assignments: DayAssignment[] = [];
  const year = new Date().getFullYear();

  for (let d = 1; d <= 365; d++) {
    const date = new Date(year, 0, d);
    const { seasonId, dayInSeason } = findSeasonForDate(date);
    const meta = SEASON_META[seasonId];
    assignments.push({
      day: d,
      seasonNameKo: meta.nameKo,
      themeHint: meta.themes[(dayInSeason - 1) % meta.themes.length],
      books: meta.books,
    });
  }

  return assignments;
}

// 시즌 메타데이터 내보내기
export { SEASON_META };

// 기존 호환용: CHURCH_CALENDAR (admin 페이지 등에서 사용)
export interface Season {
  name: string;
  nameKo: string;
  days: number;
  themes: string[];
  books: string[];
}

export const CHURCH_CALENDAR: Season[] = Object.entries(SEASON_META).map(([key, meta]) => {
  const defaultDays: Record<string, number> = {
    advent: 28, christmas: 12, epiphany: 42, lent: 40, holy_week: 7,
    easter: 50, pentecost: 14, ordinary_summer: 56, ordinary_autumn: 56,
    ordinary_late_autumn: 42, year_end: 18,
  };
  return {
    name: key,
    nameKo: meta.nameKo,
    days: defaultDays[key] || 30,
    themes: meta.themes,
    books: meta.books,
  };
});
