import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

function getRedis() {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

// 유저 키: user:{email}
function userKey(email: string) {
  return `user:${email.toLowerCase()}`;
}

interface StoredUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  age_group: string;
  church_name: string;
  created_at: string;
}

// POST /api/users — 회원가입
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password_hash, name, age_group, church_name } = body;

    if (!email || !password_hash || !name) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const key = userKey(email);

    // 이미 가입된 이메일 확인
    const existing = await redis.get<StoredUser>(key);
    if (existing) {
      return NextResponse.json({ error: '이미 가입된 이메일입니다.' }, { status: 409 });
    }

    // 회원 생성
    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: email.toLowerCase(),
      password_hash,
      name,
      age_group: age_group || 'youth',
      church_name: church_name || '',
      created_at: new Date().toISOString(),
    };

    await redis.set(key, JSON.stringify(newUser));

    // 비밀번호 해시는 응답에서 제외
    const { password_hash: _, ...safeUser } = newUser;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}

// PATCH /api/users — 비밀번호 재설정 또는 프로필 수정
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, new_password_hash, name, age_group, church_name } = body;

    if (!email) {
      return NextResponse.json({ error: '이메일이 필요합니다.' }, { status: 400 });
    }

    const isPasswordReset = typeof new_password_hash === 'string';
    const isProfileUpdate =
      typeof name === 'string' || typeof age_group === 'string' || typeof church_name === 'string';

    if (!isPasswordReset && !isProfileUpdate) {
      return NextResponse.json({ error: '수정할 정보가 없습니다.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const key = userKey(email);
    const stored = await redis.get<StoredUser>(key);

    if (!stored) {
      return NextResponse.json({ error: '등록되지 않은 이메일입니다.', fallback: true }, { status: 404 });
    }

    const userData: StoredUser = typeof stored === 'string' ? JSON.parse(stored) : stored;

    if (isPasswordReset) {
      userData.password_hash = new_password_hash;
    }
    if (typeof name === 'string' && name.trim()) {
      userData.name = name.trim();
    }
    if (typeof age_group === 'string' && age_group) {
      userData.age_group = age_group;
    }
    if (typeof church_name === 'string') {
      userData.church_name = church_name.trim();
    }

    await redis.set(key, JSON.stringify(userData));

    if (isProfileUpdate) {
      const { password_hash: _, ...safeUser } = userData;
      return NextResponse.json({ success: true, user: safeUser });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('User PATCH error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}

// PUT /api/users — 로그인 (이메일+비밀번호 조회)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password_hash } = body;

    if (!email || !password_hash) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ error: 'DB 연결 실패', fallback: true }, { status: 500 });
    }

    const key = userKey(email);
    const stored = await redis.get<StoredUser>(key);

    if (!stored) {
      return NextResponse.json({ error: '등록되지 않은 이메일입니다.', fallback: true });
    }

    // stored가 string이면 파싱
    const userData: StoredUser = typeof stored === 'string' ? JSON.parse(stored) : stored;

    if (userData.password_hash !== password_hash) {
      return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' });
    }

    const { password_hash: _, ...safeUser } = userData;
    return NextResponse.json({ user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Server error', fallback: true }, { status: 500 });
  }
}
