/**
 * 꿀잼QT 365일 묵상 데이터 AI 자동 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/generate-devotionals.ts
 *
 * 출력:
 *   scripts/output/devotionals.json       — 전체 365일 데이터
 *   scripts/output/devotionals-supabase.sql — Supabase INSERT문
 *
 * 참고:
 *   - 교회력 기반 시즌별 생성
 *   - 비용 절감을 위해 gpt-4o-mini 사용
 *   - 하루 약 1개씩 생성, 전체 약 $2~3 예상
 */

import fs from 'fs';
import path from 'path';

// ─── 설정 ───────────────────────────────────────────
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const MODEL = 'gpt-4o-mini';
const OUTPUT_DIR = path.join(__dirname, 'output');
const BATCH_SIZE = 5; // 한 번에 생성할 일수
const DELAY_MS = 1500; // API 호출 간 대기 (rate limit 방지)

// ─── 교회력 시즌 정의 (365일 순환) ──────────────────
interface Season {
  name: string;
  nameKo: string;
  days: number;
  themes: string[];
  books: string[];
}

const CHURCH_CALENDAR: Season[] = [
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
    name: 'Ordinary Time - Summer',
    nameKo: '연중시기(여름)',
    days: 56,
    themes: ['믿음', '사랑', '소망', '감사', '순종', '인내', '지혜', '기도', '성장', '섬김'],
    books: ['잠언', '전도서', '야고보서', '빌립보서', '골로새서', '시편', '창세기', '출애굽기'],
  },
  {
    name: 'Ordinary Time - Autumn',
    nameKo: '연중시기(가을)',
    days: 56,
    themes: ['추수', '감사', '나눔', '공동체', '화해', '용서', '평화', '정의', '긍휼'],
    books: ['룻기', '에스더', '느헤미야', '데살로니가전서', '디모데전서', '빌레몬서', '시편'],
  },
  {
    name: 'Ordinary Time - Late Autumn',
    nameKo: '연중시기(늦가을)',
    days: 42,
    themes: ['종말', '심판', '재림', '하나님나라', '영원', '충성', '깨어있음'],
    books: ['다니엘', '요한계시록', '데살로니가전서', '마태복음', '베드로후서'],
  },
  {
    name: 'Year End',
    nameKo: '연말',
    days: 18,
    themes: ['돌아봄', '감사', '새출발', '약속', '신실하심', '계획', '헌신'],
    books: ['시편', '예레미야 애가', '빌립보서', '히브리서', '이사야'],
  },
];

// 총 일수 확인 (365)
const totalDays = CHURCH_CALENDAR.reduce((sum, s) => sum + s.days, 0);
console.log(`📅 교회력 총 일수: ${totalDays}일`);

// ─── 타입 정의 ──────────────────────────────────────
interface Devotional {
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

// ─── OpenAI API 호출 ────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: `당신은 한국 교회의 묵상 콘텐츠를 작성하는 기독교 교육 전문가입니다.
새번역 성경을 기준으로 작성합니다.
대상은 초등학생~청년까지이며, 기본 난이도는 청소년 수준입니다.
묵상글은 6~10줄, 따뜻하고 쉬우면서도 깊이가 있어야 합니다.
질문은 삶에 적용할 수 있는 질문형으로 작성합니다.
반드시 JSON 형식으로만 응답하세요.`,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ─── 배치 생성 프롬프트 ─────────────────────────────
function buildPrompt(days: { day: number; season: Season; themeHint: string }[]): string {
  const items = days
    .map(
      (d) =>
        `- Day ${d.day}: 시즌="${d.season.nameKo}", 테마힌트="${d.themeHint}", 성경책=[${d.season.books.join(', ')}]`
    )
    .join('\n');

  return `아래 ${days.length}일분의 묵상 데이터를 JSON 배열로 생성해주세요.

${items}

각 항목은 다음 필드를 포함해야 합니다:
{
  "day": 숫자,
  "season": "시즌 한글명",
  "theme": "오늘의 주제 (2~5단어)",
  "passage": "성경 구절 주소 (예: 이사야 9:2, 요한복음 3:16)",
  "meditation": "묵상글 6~10줄. 따뜻하고 깊이 있게. 새번역 기준.",
  "question1": "삶 적용 질문 1",
  "question2": "삶 적용 질문 2",
  "question3": "삶 적용 질문 3",
  "prayer": "짧은 기도문 2~3문장",
  "ccm": "추천 한국 CCM 곡명 1곡",
  "memory_verse": "암송 구절 주소 (본문 중 핵심 1절)",
  "age_children": "초등학생용 핵심 한 문장 (쉽고 짧게)",
  "age_youth": "중고등학생용 핵심 한 문장",
  "age_young_adult": "청년용 핵심 한 문장 (깊이 있게)"
}

규칙:
- 같은 시즌 내에서 주제와 성경 구절이 겹치지 않도록
- 묵상글은 해당 시즌의 분위기를 반영
- CCM은 실제 한국에서 부르는 찬양곡
- 반드시 유효한 JSON 배열만 출력 (설명 없이)`;
}

// ─── JSON 파싱 (코드블록 제거) ──────────────────────
function parseJSON(text: string): Devotional[] {
  // ```json ... ``` 형태 제거
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return JSON.parse(cleaned);
}

// ─── 지연 함수 ──────────────────────────────────────
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── SQL 변환 ───────────────────────────────────────
function toSQL(devotionals: Devotional[]): string {
  const escape = (s: string) => s.replace(/'/g, "''");

  const values = devotionals
    .map(
      (d) =>
        `  (${d.day}, '${escape(d.season)}', '${escape(d.theme)}', '${escape(d.passage)}', '${escape(d.meditation)}', '${escape(d.question1)}', '${escape(d.question2)}', '${escape(d.question3)}', '${escape(d.prayer)}', '${escape(d.ccm)}', '${escape(d.memory_verse)}', '${escape(d.age_children)}', '${escape(d.age_youth)}', '${escape(d.age_young_adult)}')`
    )
    .join(',\n');

  return `-- 꿀잼QT 365일 묵상 데이터 INSERT
-- Supabase SQL Editor에서 실행하세요

INSERT INTO devotionals (day, season, theme, passage, meditation, question1, question2, question3, prayer, ccm, memory_verse, age_children, age_youth, age_young_adult)
VALUES
${values};
`;
}

// ─── 진행 상황 저장/복원 ────────────────────────────
const PROGRESS_FILE = path.join(OUTPUT_DIR, 'progress.json');

function loadProgress(): Devotional[] {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }
  return [];
}

function saveProgress(data: Devotional[]) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// ─── 메인 실행 ──────────────────────────────────────
async function main() {
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
    console.error('   .env.local 파일에 키를 설정한 후 다시 실행하세요.');
    process.exit(1);
  }

  // 출력 디렉토리 생성
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 기존 진행 상황 로드
  let allDevotionals = loadProgress();
  const startDay = allDevotionals.length + 1;

  if (startDay > 1) {
    console.log(`📂 이전 진행 상황 발견: ${allDevotionals.length}일 완료. Day ${startDay}부터 재개합니다.\n`);
  }

  // 시즌별 일 배정
  const dayAssignments: { day: number; season: Season; themeHint: string }[] = [];
  let currentDay = 1;
  for (const season of CHURCH_CALENDAR) {
    for (let i = 0; i < season.days; i++) {
      const themeHint = season.themes[i % season.themes.length];
      dayAssignments.push({ day: currentDay, season, themeHint });
      currentDay++;
    }
  }

  // 이미 생성된 일수는 건너뛰기
  const remaining = dayAssignments.filter((d) => d.day >= startDay);
  const totalBatches = Math.ceil(remaining.length / BATCH_SIZE);

  console.log(`🍯 꿀잼QT 365일 묵상 데이터 생성 시작!`);
  console.log(`📊 남은 일수: ${remaining.length}일 / 배치 크기: ${BATCH_SIZE}일 / 총 배치: ${totalBatches}회\n`);

  let batchNum = 0;
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batchNum++;
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const dayRange = `Day ${batch[0].day}~${batch[batch.length - 1].day}`;

    console.log(`⏳ [${batchNum}/${totalBatches}] ${dayRange} (${batch[0].season.nameKo}) 생성 중...`);

    try {
      const prompt = buildPrompt(batch);
      const response = await callOpenAI(prompt);
      const parsed = parseJSON(response);

      // day 번호 보정
      const corrected = parsed.map((d, idx) => ({
        ...d,
        day: batch[idx].day,
        season: batch[idx].season.nameKo,
      }));

      allDevotionals.push(...corrected);
      saveProgress(allDevotionals);

      console.log(`   ✅ 완료! (누적: ${allDevotionals.length}/365)\n`);
    } catch (err) {
      console.error(`   ❌ 오류 발생:`, err);
      console.log(`   💾 ${allDevotionals.length}일까지 저장됨. 다시 실행하면 이어서 생성합니다.\n`);
      break;
    }

    // Rate limit 방지
    if (i + BATCH_SIZE < remaining.length) {
      await delay(DELAY_MS);
    }
  }

  // 최종 출력
  if (allDevotionals.length === 365) {
    console.log(`\n🎉 365일 묵상 데이터 생성 완료!\n`);

    // JSON 저장
    const jsonPath = path.join(OUTPUT_DIR, 'devotionals.json');
    fs.writeFileSync(jsonPath, JSON.stringify(allDevotionals, null, 2), 'utf-8');
    console.log(`📄 JSON 저장: ${jsonPath}`);

    // SQL 저장
    const sqlPath = path.join(OUTPUT_DIR, 'devotionals-supabase.sql');
    fs.writeFileSync(sqlPath, toSQL(allDevotionals), 'utf-8');
    console.log(`📄 SQL 저장: ${sqlPath}`);

    // progress 파일 삭제
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE);
    }

    console.log(`\n📌 다음 단계:`);
    console.log(`   1. devotionals.json을 검수하세요`);
    console.log(`   2. Supabase SQL Editor에서 devotionals-supabase.sql을 실행하세요`);
    console.log(`   또는 devotionals.json을 Supabase Table Editor에서 Import하세요`);
  } else {
    console.log(`\n⚠️  ${allDevotionals.length}/365일 생성됨. 다시 실행하면 이어서 생성합니다.`);
  }
}

main().catch(console.error);
