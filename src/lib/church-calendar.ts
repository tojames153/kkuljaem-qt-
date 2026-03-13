export interface Season {
  name: string;
  nameKo: string;
  days: number;
  themes: string[];
  books: string[];
}

export const CHURCH_CALENDAR: Season[] = [
  {
    name: 'Advent',
    nameKo: '대림절',
    days: 28,
    themes: ['기다림', '소망', '준비', '예언의 성취', '메시아 오심', '빛', '구원의 약속'],
    books: ['이사야', '미가', '말라기', '누가복음', '마태복음'],
  },
  {
    name: 'Christmas',
    nameKo: '성탄절',
    days: 12,
    themes: ['탄생', '경배', '기쁨', '하나님의 선물', '임마누엘', '목자와 동방박사'],
    books: ['누가복음', '마태복음', '요한복음', '이사야'],
  },
  {
    name: 'Epiphany',
    nameKo: '주현절',
    days: 42,
    themes: ['나타남', '세례', '부르심', '제자도', '하나님나라', '치유', '기적'],
    books: ['마태복음', '마가복음', '요한복음', '이사야'],
  },
  {
    name: 'Lent',
    nameKo: '사순절',
    days: 40,
    themes: ['회개', '겸손', '십자가', '자기부인', '고난', '순종', '섬김'],
    books: ['마태복음', '마가복음', '누가복음', '시편', '이사야'],
  },
  {
    name: 'Holy Week',
    nameKo: '고난주간',
    days: 7,
    themes: ['예루살렘 입성', '성전 정화', '마지막 만찬', '겟세마네', '십자가', '죽음', '무덤'],
    books: ['마태복음', '마가복음', '누가복음', '요한복음'],
  },
  {
    name: 'Easter',
    nameKo: '부활절',
    days: 50,
    themes: ['부활', '새 생명', '승리', '만남', '증인', '소망', '영생', '성령의 약속'],
    books: ['요한복음', '사도행전', '고린도전서', '로마서', '베드로전서'],
  },
  {
    name: 'Pentecost',
    nameKo: '성령강림절',
    days: 14,
    themes: ['성령', '능력', '은사', '교회', '선교', '하나됨', '열매'],
    books: ['사도행전', '갈라디아서', '고린도전서', '로마서', '에베소서'],
  },
  {
    name: 'Ordinary_Summer',
    nameKo: '연중시기(여름)',
    days: 56,
    themes: ['믿음', '사랑', '소망', '감사', '순종', '인내', '지혜', '기도', '성장', '섬김'],
    books: ['잠언', '전도서', '야고보서', '빌립보서', '골로새서', '시편', '창세기', '출애굽기'],
  },
  {
    name: 'Ordinary_Autumn',
    nameKo: '연중시기(가을)',
    days: 56,
    themes: ['추수', '감사', '나눔', '공동체', '화해', '용서', '평화', '정의', '긍휼'],
    books: ['룻기', '에스더', '느헤미야', '데살로니가전서', '디모데전서', '빌레몬서', '시편'],
  },
  {
    name: 'Ordinary_LateAutumn',
    nameKo: '연중시기(늦가을)',
    days: 42,
    themes: ['종말', '심판', '재림', '하나님나라', '영원', '충성', '깨어있음'],
    books: ['다니엘', '요한계시록', '데살로니가전서', '마태복음', '베드로후서'],
  },
  {
    name: 'YearEnd',
    nameKo: '연말',
    days: 18,
    themes: ['돌아봄', '감사', '새출발', '약속', '신실하심', '계획', '헌신'],
    books: ['시편', '예레미야 애가', '빌립보서', '히브리서', '이사야'],
  },
];

export interface DayAssignment {
  day: number;
  seasonNameKo: string;
  themeHint: string;
  books: string[];
}

export function getDayAssignments(): DayAssignment[] {
  const assignments: DayAssignment[] = [];
  let currentDay = 1;
  for (const season of CHURCH_CALENDAR) {
    for (let i = 0; i < season.days; i++) {
      assignments.push({
        day: currentDay,
        seasonNameKo: season.nameKo,
        themeHint: season.themes[i % season.themes.length],
        books: season.books,
      });
      currentDay++;
    }
  }
  return assignments;
}
