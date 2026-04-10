// 묵상 주제/시즌 기반 연령별 찬양 추천 시스템
// 어린이: 어린이 찬송가 / 어린이 CCM
// 청소년: CCM (현대 기독교 대중음악)
// 청년: 찬양 (모던 워십)
// 장년: 찬송가 (전통 찬송가, 장 번호 포함)

interface CcmSet {
  children: string;
  youth: string;
  young_adult: string;
  senior: string;
}

// 시즌별 찬양
const seasonCcm: Record<string, CcmSet> = {
  '대림절': {
    children: '이 땅에 오신 예수님 (어린이찬송)',
    youth: '오랫동안 기다리던 (CCM)',
    young_adult: '오소서 오소서 임마누엘 (워십)',
    senior: '오랫동안 기다리던 (찬송가 102장)',
  },
  '성탄절': {
    children: '아기 예수 나셨네 (어린이찬송)',
    youth: '메리 크리스마스 - 캐롤 (CCM)',
    young_adult: 'O Holy Night (워십)',
    senior: '고요한 밤 거룩한 밤 (찬송가 109장)',
  },
  '주현절': {
    children: '빛으로 오신 예수님 (어린이찬송)',
    youth: '세상의 빛 - 마커스워십 (CCM)',
    young_adult: '주 예수보다 더 귀한 것은 없네 (워십)',
    senior: '저 들 밖에 한밤중에 (찬송가 115장)',
  },
  '사순절': {
    children: '십자가 사랑 (어린이CCM)',
    youth: '주님의 십자가를 묵상하면 - 옹기장이 (CCM)',
    young_adult: '옛 험한 십자가 (워십)',
    senior: '만세반석 열리니 (찬송가 188장)',
  },
  '고난주간': {
    children: '예수님이 좋아요 (어린이CCM)',
    youth: '십자가 그 사랑 - 예수전도단 (CCM)',
    young_adult: '거룩한 성 예루살렘 (워십)',
    senior: '십자가를 질 수 있나 (찬송가 150장)',
  },
  '부활절': {
    children: '예수님은 살아계셔 (어린이찬송)',
    youth: '살아계신 주 - 소원 (CCM)',
    young_adult: '다시 살아나신 주 (워십)',
    senior: '할렐루야 주 다시 사셨네 (찬송가 161장)',
  },
  '성령강림절': {
    children: '성령님은 나의 친구 (어린이찬송)',
    youth: '성령이여 오소서 - 마커스워십 (CCM)',
    young_adult: '성령의 바람 불어와 (워십)',
    senior: '성령이여 강림하사 (찬송가 176장)',
  },
};

// 주제 키워드 → 연령별 찬양 매핑
const themeCcm: { keywords: string[]; ccm: CcmSet }[] = [
  {
    keywords: ['기다림', '소망', '기대', '인내'],
    ccm: {
      children: '하나님은 너를 지키시는 분 (어린이찬송)',
      youth: '소망을 품고 - 제이어스 (CCM)',
      young_adult: '내 영혼의 그윽히 깊은 데서 (워십)',
      senior: '내 영혼의 그윽히 깊은 데서 (찬송가 370장)',
    },
  },
  {
    keywords: ['빛', '어둠', '밝', '등불'],
    ccm: {
      children: '이 작은 나의 빛 (어린이찬송)',
      youth: '빛 되신 주 - 찬미워십 (CCM)',
      young_adult: '주의 말씀은 내 발의 등 (워십)',
      senior: '주의 말씀 내 발에 등이요 (찬송가 209장)',
    },
  },
  {
    keywords: ['사랑', '은혜'],
    ccm: {
      children: '하나님의 사랑은 (어린이찬송)',
      youth: '사랑해요 예수님 - 소원 (CCM)',
      young_adult: '놀라운 은혜 (워십)',
      senior: '나 같은 죄인 살리신 (찬송가 305장)',
    },
  },
  {
    keywords: ['기도', '간구', '응답', '부르짖'],
    ccm: {
      children: '기도하면 좋겠네 (어린이CCM)',
      youth: '기도를 멈추지 마 - 제이어스 (CCM)',
      young_adult: '주의 이름을 부를 때 (워십)',
      senior: '기도하는 이 시간 (찬송가 364장)',
    },
  },
  {
    keywords: ['믿음', '신뢰', '의지'],
    ccm: {
      children: '내가 믿는 하나님 (어린이CCM)',
      youth: '주를 신뢰합니다 - 아이자야 (CCM)',
      young_adult: '나의 갈 길 다 가도록 (워십)',
      senior: '믿음으로 사는 자는 (찬송가 430장)',
    },
  },
  {
    keywords: ['평안', '평화', '쉼', '안식'],
    ccm: {
      children: '걱정 말아요 하나님이 함께해 (어린이CCM)',
      youth: '내 평생에 가는 길 - 김윤진 (CCM)',
      young_adult: '주 안에서 쉼을 얻으리 (워십)',
      senior: '내 평생에 가는 길 (찬송가 413장)',
    },
  },
  {
    keywords: ['찬양', '찬미', '영광', '경배'],
    ccm: {
      children: '내 입술의 찬양이 (어린이찬송)',
      youth: '주님께 드려요 - 옹기장이 (CCM)',
      young_adult: '나 무엇과도 주님을 바꿀 수 없네 (워십)',
      senior: '만복의 근원 하나님 (찬송가 1장)',
    },
  },
  {
    keywords: ['치유', '회복', '고침', '아픔', '눈물'],
    ccm: {
      children: '예수님이 함께하시면 (어린이CCM)',
      youth: '치유자 - 뉴젠워십 (CCM)',
      young_adult: '나의 영혼 아름답게 하소서 (워십)',
      senior: '예수 사랑하심은 (찬송가 563장)',
    },
  },
  {
    keywords: ['용기', '담대', '두려움', '무서'],
    ccm: {
      children: '두려워 말라 (어린이찬송)',
      youth: '담대하라 겁내지 말아라 - 예수전도단 (CCM)',
      young_adult: '여호와 니시 (워십)',
      senior: '내 주를 가까이 하게 함은 (찬송가 338장)',
    },
  },
  {
    keywords: ['순종', '헌신', '따름', '섬김'],
    ccm: {
      children: '예수님처럼 (어린이CCM)',
      youth: '나의 모습 나의 소유 - 마커스워십 (CCM)',
      young_adult: '주를 따르리 (워십)',
      senior: '주여 지금 이 시간 (찬송가 491장)',
    },
  },
  {
    keywords: ['용서', '회개', '돌이킴', '죄'],
    ccm: {
      children: '아버지 사랑해요 (어린이CCM)',
      youth: '주님 앞에 나아갑니다 - 소원 (CCM)',
      young_adult: '은혜 아니면 (워십)',
      senior: '주 예수 넓은 품에 (찬송가 279장)',
    },
  },
  {
    keywords: ['공동체', '하나', '교회', '형제', '이웃'],
    ccm: {
      children: '우리 모두 다 함께 (어린이찬송)',
      youth: '함께 모여 찬양해 - 캠퍼스워십 (CCM)',
      young_adult: '우리가 한 몸인 것 (워십)',
      senior: '교회의 참된 터는 (찬송가 230장)',
    },
  },
  {
    keywords: ['말씀', '성경', '진리'],
    ccm: {
      children: '성경은 하나님의 말씀 (어린이찬송)',
      youth: '주의 말씀 따라 살 때 - 제이어스 (CCM)',
      young_adult: '살아있는 말씀 (워십)',
      senior: '성경에 주신 말씀 (찬송가 200장)',
    },
  },
  {
    keywords: ['창조', '자연', '세계', '피조물', '하늘', '별'],
    ccm: {
      children: '하나님이 만드신 세상 (어린이찬송)',
      youth: '참 아름다워라 - 어노인팅 (CCM)',
      young_adult: '주 하나님 지으신 모든 세계 (워십)',
      senior: '주 하나님 지으신 모든 세계 (찬송가 40장)',
    },
  },
  {
    keywords: ['전도', '선교', '복음', '세상'],
    ccm: {
      children: '예수 사랑 전해요 (어린이CCM)',
      youth: '세상을 품은 주의 사랑 - 예수전도단 (CCM)',
      young_adult: '주의 나라가 임하게 하소서 (워십)',
      senior: '저 높은 곳을 향하여 (찬송가 488장)',
    },
  },
  {
    keywords: ['십자가', '보혈', '희생', '고난'],
    ccm: {
      children: '십자가 사랑 (어린이CCM)',
      youth: '주님의 십자가를 묵상하면 - 옹기장이 (CCM)',
      young_adult: '옛 험한 십자가 (워십)',
      senior: '옛 험한 십자가 (찬송가 149장)',
    },
  },
  {
    keywords: ['부활', '생명', '승리'],
    ccm: {
      children: '예수님은 살아계셔 (어린이찬송)',
      youth: '살아계신 주 - 소원 (CCM)',
      young_adult: '다시 살아나신 주 (워십)',
      senior: '예수 부활했으니 (찬송가 161장)',
    },
  },
  {
    keywords: ['성령', '능력', '기름부음'],
    ccm: {
      children: '성령님은 나의 친구 (어린이찬송)',
      youth: '성령이여 오소서 - 마커스워십 (CCM)',
      young_adult: '성령의 바람 불어와 (워십)',
      senior: '성령이여 강림하사 (찬송가 176장)',
    },
  },
  {
    keywords: ['감사', '축복', '복'],
    ccm: {
      children: '감사해요 하나님 (어린이CCM)',
      youth: '감사 감사 감사합니다 - 예수전도단 (CCM)',
      young_adult: '주의 선하심과 인자하심이 (워십)',
      senior: '이 세상의 모든 것 다 (찬송가 45장)',
    },
  },
  {
    keywords: ['가정', '부모', '자녀', '가족'],
    ccm: {
      children: '우리 집에 복을 주세요 (어린이찬송)',
      youth: '좋은 아버지 - 하우스처치 (CCM)',
      young_adult: '주님의 사랑이 머무는 곳 (워십)',
      senior: '즐거운 가정 만들자 (찬송가 242장)',
    },
  },
  {
    keywords: ['지혜', '분별', '길'],
    ccm: {
      children: '내 발이 예뻐진 건 (어린이CCM)',
      youth: '주님 뜻대로 - 아이자야 (CCM)',
      young_adult: '나의 갈 길 다 가도록 (워십)',
      senior: '나의 갈 길 다 가도록 (찬송가 384장)',
    },
  },
  {
    keywords: ['기쁨', '즐거움', '행복'],
    ccm: {
      children: '기뻐 노래해 (어린이찬송)',
      youth: '기쁨으로 충만 - 캠퍼스워십 (CCM)',
      young_adult: '주 안에 있는 나에게 (워십)',
      senior: '즐겁게 안식할 날 (찬송가 50장)',
    },
  },
  {
    keywords: ['목자', '양', '인도', '보호'],
    ccm: {
      children: '주님은 나의 목자 (어린이찬송)',
      youth: '선한 목자 되신 우리 주 - 어노인팅 (CCM)',
      young_adult: '여호와 로이 (워십)',
      senior: '목자 되신 우리 주 (찬송가 370장)',
    },
  },
];

// 기본 찬양 (매칭 안 될 때)
const defaultCcm: CcmSet = {
  children: '예수님이 좋아요 (어린이CCM)',
  youth: '주는 좋은 하나님 - 제이어스 (CCM)',
  young_adult: '주님은 나의 최고의 친구 (워십)',
  senior: '만복의 근원 하나님 (찬송가 1장)',
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
      senior: defaultCcm.senior,
    };
  }

  return defaultCcm;
}
