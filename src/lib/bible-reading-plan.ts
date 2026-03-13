// 1년 성경읽기 계획 (365일, 구약+신약 병행)
// 매일 구약 2-3장 + 신약 1장으로 1년에 성경 전체 통독

export interface DailyReading {
  day: number;
  ot: string;   // 구약
  nt: string;   // 신약
}

const plan: DailyReading[] = [
  // 1월 (Day 1-31)
  { day: 1, ot: '창세기 1-2', nt: '마태복음 1' },
  { day: 2, ot: '창세기 3-4', nt: '마태복음 2' },
  { day: 3, ot: '창세기 5-7', nt: '마태복음 3' },
  { day: 4, ot: '창세기 8-10', nt: '마태복음 4' },
  { day: 5, ot: '창세기 11-13', nt: '마태복음 5:1-26' },
  { day: 6, ot: '창세기 14-16', nt: '마태복음 5:27-48' },
  { day: 7, ot: '창세기 17-18', nt: '마태복음 6:1-18' },
  { day: 8, ot: '창세기 19-20', nt: '마태복음 6:19-34' },
  { day: 9, ot: '창세기 21-23', nt: '마태복음 7' },
  { day: 10, ot: '창세기 24', nt: '마태복음 8:1-17' },
  { day: 11, ot: '창세기 25-26', nt: '마태복음 8:18-34' },
  { day: 12, ot: '창세기 27-28', nt: '마태복음 9:1-17' },
  { day: 13, ot: '창세기 29-30', nt: '마태복음 9:18-38' },
  { day: 14, ot: '창세기 31-32', nt: '마태복음 10:1-20' },
  { day: 15, ot: '창세기 33-35', nt: '마태복음 10:21-42' },
  { day: 16, ot: '창세기 36-37', nt: '마태복음 11' },
  { day: 17, ot: '창세기 38-40', nt: '마태복음 12:1-21' },
  { day: 18, ot: '창세기 41', nt: '마태복음 12:22-50' },
  { day: 19, ot: '창세기 42-43', nt: '마태복음 13:1-30' },
  { day: 20, ot: '창세기 44-45', nt: '마태복음 13:31-58' },
  { day: 21, ot: '창세기 46-47', nt: '마태복음 14:1-21' },
  { day: 22, ot: '창세기 48-50', nt: '마태복음 14:22-36' },
  { day: 23, ot: '출애굽기 1-3', nt: '마태복음 15:1-20' },
  { day: 24, ot: '출애굽기 4-6', nt: '마태복음 15:21-39' },
  { day: 25, ot: '출애굽기 7-8', nt: '마태복음 16' },
  { day: 26, ot: '출애굽기 9-10', nt: '마태복음 17' },
  { day: 27, ot: '출애굽기 11-12', nt: '마태복음 18:1-20' },
  { day: 28, ot: '출애굽기 13-15', nt: '마태복음 18:21-35' },
  { day: 29, ot: '출애굽기 16-18', nt: '마태복음 19' },
  { day: 30, ot: '출애굽기 19-20', nt: '마태복음 20:1-16' },
  { day: 31, ot: '출애굽기 21-22', nt: '마태복음 20:17-34' },
  // 2월 (Day 32-59)
  { day: 32, ot: '출애굽기 23-24', nt: '마태복음 21:1-22' },
  { day: 33, ot: '출애굽기 25-26', nt: '마태복음 21:23-46' },
  { day: 34, ot: '출애굽기 27-28', nt: '마태복음 22:1-22' },
  { day: 35, ot: '출애굽기 29-30', nt: '마태복음 22:23-46' },
  { day: 36, ot: '출애굽기 31-33', nt: '마태복음 23:1-22' },
  { day: 37, ot: '출애굽기 34-35', nt: '마태복음 23:23-39' },
  { day: 38, ot: '출애굽기 36-38', nt: '마태복음 24:1-28' },
  { day: 39, ot: '출애굽기 39-40', nt: '마태복음 24:29-51' },
  { day: 40, ot: '레위기 1-3', nt: '마태복음 25:1-30' },
  { day: 41, ot: '레위기 4-5', nt: '마태복음 25:31-46' },
  { day: 42, ot: '레위기 6-7', nt: '마태복음 26:1-25' },
  { day: 43, ot: '레위기 8-10', nt: '마태복음 26:26-50' },
  { day: 44, ot: '레위기 11-12', nt: '마태복음 26:51-75' },
  { day: 45, ot: '레위기 13', nt: '마태복음 27:1-26' },
  { day: 46, ot: '레위기 14', nt: '마태복음 27:27-50' },
  { day: 47, ot: '레위기 15-16', nt: '마태복음 27:51-66' },
  { day: 48, ot: '레위기 17-18', nt: '마태복음 28' },
  { day: 49, ot: '레위기 19-20', nt: '마가복음 1:1-22' },
  { day: 50, ot: '레위기 21-22', nt: '마가복음 1:23-45' },
  { day: 51, ot: '레위기 23-24', nt: '마가복음 2' },
  { day: 52, ot: '레위기 25', nt: '마가복음 3' },
  { day: 53, ot: '레위기 26-27', nt: '마가복음 4:1-20' },
  { day: 54, ot: '민수기 1-2', nt: '마가복음 4:21-41' },
  { day: 55, ot: '민수기 3-4', nt: '마가복음 5:1-20' },
  { day: 56, ot: '민수기 5-6', nt: '마가복음 5:21-43' },
  { day: 57, ot: '민수기 7-8', nt: '마가복음 6:1-29' },
  { day: 58, ot: '민수기 9-11', nt: '마가복음 6:30-56' },
  { day: 59, ot: '민수기 12-14', nt: '마가복음 7:1-13' },
  // 3월 (Day 60-90)
  { day: 60, ot: '민수기 15-16', nt: '마가복음 7:14-37' },
  { day: 61, ot: '민수기 17-19', nt: '마가복음 8:1-21' },
  { day: 62, ot: '민수기 20-22', nt: '마가복음 8:22-38' },
  { day: 63, ot: '민수기 23-25', nt: '마가복음 9:1-29' },
  { day: 64, ot: '민수기 26-27', nt: '마가복음 9:30-50' },
  { day: 65, ot: '민수기 28-30', nt: '마가복음 10:1-31' },
  { day: 66, ot: '민수기 31-32', nt: '마가복음 10:32-52' },
  { day: 67, ot: '민수기 33-34', nt: '마가복음 11:1-18' },
  { day: 68, ot: '민수기 35-36', nt: '마가복음 11:19-33' },
  { day: 69, ot: '신명기 1-2', nt: '마가복음 12:1-27' },
  { day: 70, ot: '신명기 3-4', nt: '마가복음 12:28-44' },
  { day: 71, ot: '신명기 5-7', nt: '마가복음 13:1-20' },
  { day: 72, ot: '신명기 8-10', nt: '마가복음 13:21-37' },
  { day: 73, ot: '신명기 11-13', nt: '마가복음 14:1-26' },
  { day: 74, ot: '신명기 14-16', nt: '마가복음 14:27-53' },
  { day: 75, ot: '신명기 17-19', nt: '마가복음 14:54-72' },
  { day: 76, ot: '신명기 20-22', nt: '마가복음 15:1-25' },
  { day: 77, ot: '신명기 23-25', nt: '마가복음 15:26-47' },
  { day: 78, ot: '신명기 26-27', nt: '마가복음 16' },
  { day: 79, ot: '신명기 28-29', nt: '누가복음 1:1-25' },
  { day: 80, ot: '신명기 30-31', nt: '누가복음 1:26-56' },
  { day: 81, ot: '신명기 32-34', nt: '누가복음 1:57-80' },
  { day: 82, ot: '여호수아 1-3', nt: '누가복음 2:1-24' },
  { day: 83, ot: '여호수아 4-6', nt: '누가복음 2:25-52' },
  { day: 84, ot: '여호수아 7-9', nt: '누가복음 3' },
  { day: 85, ot: '여호수아 10-12', nt: '누가복음 4:1-30' },
  { day: 86, ot: '여호수아 13-15', nt: '누가복음 4:31-44' },
  { day: 87, ot: '여호수아 16-18', nt: '누가복음 5:1-16' },
  { day: 88, ot: '여호수아 19-21', nt: '누가복음 5:17-39' },
  { day: 89, ot: '여호수아 22-24', nt: '누가복음 6:1-26' },
  { day: 90, ot: '사사기 1-3', nt: '누가복음 6:27-49' },
  // Day 91-365: 나머지는 순서대로 배정
];

// 91일 이후 자동 생성 (구약/신약 순서 배분)
const otBooks = [
  { name: '사사기', chapters: 21, start: 4 },
  { name: '룻기', chapters: 4 },
  { name: '사무엘상', chapters: 31 },
  { name: '사무엘하', chapters: 24 },
  { name: '열왕기상', chapters: 22 },
  { name: '열왕기하', chapters: 25 },
  { name: '역대상', chapters: 29 },
  { name: '역대하', chapters: 36 },
  { name: '에스라', chapters: 10 },
  { name: '느헤미야', chapters: 13 },
  { name: '에스더', chapters: 10 },
  { name: '욥기', chapters: 42 },
  { name: '시편', chapters: 150 },
  { name: '잠언', chapters: 31 },
  { name: '전도서', chapters: 12 },
  { name: '아가', chapters: 8 },
  { name: '이사야', chapters: 66 },
  { name: '예레미야', chapters: 52 },
  { name: '예레미야애가', chapters: 5 },
  { name: '에스겔', chapters: 48 },
  { name: '다니엘', chapters: 12 },
  { name: '호세아', chapters: 14 },
  { name: '요엘', chapters: 3 },
  { name: '아모스', chapters: 9 },
  { name: '오바댜', chapters: 1 },
  { name: '요나', chapters: 4 },
  { name: '미가', chapters: 7 },
  { name: '나훔', chapters: 3 },
  { name: '하박국', chapters: 3 },
  { name: '스바냐', chapters: 3 },
  { name: '학개', chapters: 2 },
  { name: '스가랴', chapters: 14 },
  { name: '말라기', chapters: 4 },
];

const ntBooks = [
  { name: '누가복음', chapters: 24, start: 7 },
  { name: '요한복음', chapters: 21 },
  { name: '사도행전', chapters: 28 },
  { name: '로마서', chapters: 16 },
  { name: '고린도전서', chapters: 16 },
  { name: '고린도후서', chapters: 13 },
  { name: '갈라디아서', chapters: 6 },
  { name: '에베소서', chapters: 6 },
  { name: '빌립보서', chapters: 4 },
  { name: '골로새서', chapters: 4 },
  { name: '데살로니가전서', chapters: 5 },
  { name: '데살로니가후서', chapters: 3 },
  { name: '디모데전서', chapters: 6 },
  { name: '디모데후서', chapters: 4 },
  { name: '디도서', chapters: 3 },
  { name: '빌레몬서', chapters: 1 },
  { name: '히브리서', chapters: 13 },
  { name: '야고보서', chapters: 5 },
  { name: '베드로전서', chapters: 5 },
  { name: '베드로후서', chapters: 3 },
  { name: '요한일서', chapters: 5 },
  { name: '요한이서', chapters: 1 },
  { name: '요한삼서', chapters: 1 },
  { name: '유다서', chapters: 1 },
  { name: '요한계시록', chapters: 22 },
];

// 91일부터 남은 장 할당
function generateRemaining(): DailyReading[] {
  const result: DailyReading[] = [];
  let otChapterList: string[] = [];
  let ntChapterList: string[] = [];

  for (const book of otBooks) {
    const s = book.start || 1;
    for (let ch = s; ch <= book.chapters; ch++) {
      otChapterList.push(`${book.name} ${ch}`);
    }
  }

  for (const book of ntBooks) {
    const s = book.start || 1;
    for (let ch = s; ch <= book.chapters; ch++) {
      ntChapterList.push(`${book.name} ${ch}`);
    }
  }

  const totalDays = 275; // 91~365
  const otPerDay = Math.ceil(otChapterList.length / totalDays);
  const ntPerDay = Math.max(1, Math.ceil(ntChapterList.length / totalDays));

  for (let i = 0; i < totalDays; i++) {
    const day = 91 + i;
    const otStart = i * otPerDay;
    const otEnd = Math.min(otStart + otPerDay, otChapterList.length);
    const ntStart = i * ntPerDay;
    const ntEnd = Math.min(ntStart + ntPerDay, ntChapterList.length);

    const otText = otChapterList.slice(otStart, otEnd);
    const ntText = ntChapterList.slice(ntStart, ntEnd);

    // 같은 책의 연속 장 축약: "시편 1, 시편 2" → "시편 1-2"
    const formatChapters = (chapters: string[]) => {
      if (chapters.length === 0) return '';
      if (chapters.length === 1) return chapters[0];
      const first = chapters[0];
      const last = chapters[chapters.length - 1];
      const bookFirst = first.replace(/\s*\d+$/, '');
      const bookLast = last.replace(/\s*\d+$/, '');
      if (bookFirst === bookLast) {
        const chFirst = first.match(/\d+$/)?.[0];
        const chLast = last.match(/\d+$/)?.[0];
        return `${bookFirst} ${chFirst}-${chLast}`;
      }
      return `${first} ~ ${last}`;
    };

    result.push({
      day,
      ot: formatChapters(otText) || '시편 119',
      nt: formatChapters(ntText) || '요한계시록 22',
    });
  }

  return result;
}

const fullPlan: DailyReading[] = [...plan, ...generateRemaining()];

export function getTodayReading(): DailyReading {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  const index = ((dayOfYear - 1) % 365 + 365) % 365;
  return fullPlan[index] || fullPlan[0];
}

export function getReadingForDay(day: number): DailyReading {
  return fullPlan.find((r) => r.day === day) || fullPlan[0];
}

export function getAllReadings(): DailyReading[] {
  return fullPlan;
}
