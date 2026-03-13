// 묵상 주제/시즌 기반 연령별 CCM 추천 시스템
// 어린이: 쉽고 밝은 찬양, 청소년: 워십/CCM, 청년: 깊이 있는 워십

interface CcmSet {
  children: string;
  youth: string;
  young_adult: string;
}

// 시즌별 기본 CCM
const seasonCcm: Record<string, CcmSet> = {
  '대림절': {
    children: '이 땅에 오신 예수님',
    youth: '오랫동안 기다리던',
    young_adult: '오소서 오소서 임마누엘',
  },
  '성탄절': {
    children: '아기 예수 나셨네',
    youth: '기쁘다 구주 오셨네',
    young_adult: 'O Holy Night',
  },
  '주현절': {
    children: '빛으로 오신 예수님',
    youth: '세상의 빛',
    young_adult: '주 예수보다 더 귀한 것은 없네',
  },
  '사순절': {
    children: '십자가 사랑',
    youth: '주님의 십자가를 묵상하면',
    young_adult: '옛 험한 십자가',
  },
  '고난주간': {
    children: '예수님이 좋아요',
    youth: '십자가 그 사랑',
    young_adult: '거룩한 성 예루살렘',
  },
  '부활절': {
    children: '예수님은 살아계셔',
    youth: '부활하신 주를 찬양',
    young_adult: '다시 살아나신 주',
  },
  '성령강림절': {
    children: '성령님은 나의 친구',
    youth: '성령이여 오소서',
    young_adult: '성령의 바람 불어와',
  },
};

// 주제 키워드 → 연령별 CCM 매핑
const themeCcm: { keywords: string[]; ccm: CcmSet }[] = [
  {
    keywords: ['기다림', '소망', '기대', '인내'],
    ccm: {
      children: '하나님은 너를 지키시는 분',
      youth: '소망을 품고',
      young_adult: '내 영혼의 그윽히 깊은 데서',
    },
  },
  {
    keywords: ['빛', '어둠', '밝', '등불'],
    ccm: {
      children: '이 작은 나의 빛',
      youth: '빛 되신 주',
      young_adult: '주의 말씀은 내 발의 등',
    },
  },
  {
    keywords: ['사랑', '은혜', '감사'],
    ccm: {
      children: '하나님의 사랑은',
      youth: '사랑해요 예수님',
      young_adult: '놀라운 은혜',
    },
  },
  {
    keywords: ['기도', '간구', '응답', '부르짖'],
    ccm: {
      children: '기도하면 좋겠네',
      youth: '기도를 멈추지 마',
      young_adult: '주의 이름을 부를 때',
    },
  },
  {
    keywords: ['믿음', '신뢰', '의지'],
    ccm: {
      children: '내가 믿는 하나님',
      youth: '주를 신뢰합니다',
      young_adult: '나의 갈 길 다 가도록',
    },
  },
  {
    keywords: ['평안', '평화', '쉼', '안식'],
    ccm: {
      children: '걱정 말아요 하나님이 함께해',
      youth: '내 평생에 가는 길',
      young_adult: '주 안에서 쉼을 얻으리',
    },
  },
  {
    keywords: ['찬양', '찬미', '영광', '경배'],
    ccm: {
      children: '내 입술의 찬양이',
      youth: '주님께 드려요',
      young_adult: '나 무엇과도 주님을 바꿀 수 없네',
    },
  },
  {
    keywords: ['치유', '회복', '고침', '아픔', '눈물'],
    ccm: {
      children: '예수님이 함께하시면',
      youth: '치유자',
      young_adult: '나의 영혼 아름답게 하소서',
    },
  },
  {
    keywords: ['용기', '담대', '두려움', '무서'],
    ccm: {
      children: '두려워 말라',
      youth: '담대하라 겁내지 말아라',
      young_adult: '여호와 니시',
    },
  },
  {
    keywords: ['순종', '헌신', '따름', '섬김'],
    ccm: {
      children: '예수님처럼',
      youth: '나의 모습 나의 소유',
      young_adult: '주를 따르리',
    },
  },
  {
    keywords: ['용서', '회개', '돌이킴', '죄'],
    ccm: {
      children: '아버지 사랑해요',
      youth: '주님 앞에 나아갑니다',
      young_adult: '은혜 아니면',
    },
  },
  {
    keywords: ['공동체', '하나', '교회', '형제', '이웃'],
    ccm: {
      children: '우리 모두 다 함께',
      youth: '함께 모여 찬양해',
      young_adult: '우리가 한 몸인 것',
    },
  },
  {
    keywords: ['말씀', '성경', '진리'],
    ccm: {
      children: '성경은 하나님의 말씀',
      youth: '주의 말씀 따라 살 때',
      young_adult: '살아있는 말씀',
    },
  },
  {
    keywords: ['창조', '자연', '세계', '피조물', '하늘', '별'],
    ccm: {
      children: '하나님이 만드신 세상',
      youth: '참 아름다워라',
      young_adult: '주 하나님 지으신 모든 세계',
    },
  },
  {
    keywords: ['전도', '선교', '복음', '세상'],
    ccm: {
      children: '예수 사랑 전해요',
      youth: '세상을 품은 주의 사랑',
      young_adult: '주의 나라가 임하게 하소서',
    },
  },
  {
    keywords: ['십자가', '보혈', '희생', '고난'],
    ccm: {
      children: '십자가 사랑',
      youth: '주님의 십자가를 묵상하면',
      young_adult: '옛 험한 십자가',
    },
  },
  {
    keywords: ['부활', '생명', '승리'],
    ccm: {
      children: '예수님은 살아계셔',
      youth: '부활하신 주를 찬양',
      young_adult: '다시 살아나신 주',
    },
  },
  {
    keywords: ['성령', '능력', '기름부음'],
    ccm: {
      children: '성령님은 나의 친구',
      youth: '성령이여 오소서',
      young_adult: '성령의 바람 불어와',
    },
  },
  {
    keywords: ['감사', '축복', '복'],
    ccm: {
      children: '감사해요 하나님',
      youth: '감사 감사 감사합니다',
      young_adult: '주의 선하심과 인자하심이',
    },
  },
  {
    keywords: ['가정', '부모', '자녀', '가족'],
    ccm: {
      children: '우리 집에 복을 주세요',
      youth: '좋은 아버지',
      young_adult: '주님의 사랑이 머무는 곳',
    },
  },
  {
    keywords: ['지혜', '분별', '길'],
    ccm: {
      children: '내 발이 예뻐진 건',
      youth: '주님 뜻대로',
      young_adult: '나의 갈 길 다 가도록',
    },
  },
  {
    keywords: ['기쁨', '즐거움', '행복'],
    ccm: {
      children: '기뻐 노래해',
      youth: '기쁨으로 충만',
      young_adult: '주 안에 있는 나에게',
    },
  },
  {
    keywords: ['목자', '양', '인도', '보호'],
    ccm: {
      children: '주님은 나의 목자',
      youth: '선한 목자 되신 우리 주',
      young_adult: '여호와 로이',
    },
  },
];

// 기본 CCM (매칭 안 될 때)
const defaultCcm: CcmSet = {
  children: '예수님이 좋아요',
  youth: '주는 좋은 하나님',
  young_adult: '주님은 나의 최고의 친구',
};

export function getAgeCcm(devotional: {
  theme: string;
  season: string | null;
  ccm: string | null;
}): CcmSet {
  // 1. 주제 키워드 매칭
  const theme = devotional.theme;
  for (const entry of themeCcm) {
    if (entry.keywords.some((kw) => theme.includes(kw))) {
      return entry.ccm;
    }
  }

  // 2. 묵상글 내 시즌 매칭
  if (devotional.season) {
    for (const [season, ccm] of Object.entries(seasonCcm)) {
      if (devotional.season.includes(season)) {
        return ccm;
      }
    }
  }

  // 3. 기존 CCM을 청소년용으로, 나머지는 기본값
  if (devotional.ccm) {
    return {
      children: defaultCcm.children,
      youth: devotional.ccm,
      young_adult: defaultCcm.young_adult,
    };
  }

  return defaultCcm;
}
