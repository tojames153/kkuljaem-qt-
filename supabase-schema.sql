-- 꿀잼QT 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 1. users 테이블
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  age_group text not null check (age_group in ('children','youth','young_adult','teacher','admin')),
  church_id uuid,
  created_at timestamp with time zone default now()
);

-- 2. churches 테이블
create table churches (
  id uuid primary key default gen_random_uuid(),
  church_name text not null,
  pastor_name text,
  location text,
  created_at timestamp with time zone default now()
);

-- 3. devotionals 테이블
create table devotionals (
  id uuid primary key default gen_random_uuid(),
  day integer not null unique,
  season text,
  theme text not null,
  passage text not null,
  meditation text not null,
  question1 text not null,
  question2 text not null,
  question3 text not null,
  prayer text not null,
  ccm text,
  memory_verse text,
  age_children text,
  age_youth text,
  age_young_adult text,
  created_at timestamp with time zone default now()
);

-- 4. reflections 테이블
create table reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  devotional_id uuid references devotionals(id) on delete cascade,
  reflection_text text not null,
  visibility text not null default 'private' check (visibility in ('private','group','church')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. prayers 테이블
create table prayers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  prayer_text text not null,
  is_answered boolean default false,
  created_at timestamp with time zone default now()
);

-- 6. community_reactions 테이블
create table community_reactions (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid references reflections(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('pray','empathy','grace')),
  created_at timestamp with time zone default now()
);

-- 7. ai_coach_logs 테이블
create table ai_coach_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  reflection_id uuid references reflections(id) on delete set null,
  prompt text not null,
  response text not null,
  created_at timestamp with time zone default now()
);

-- 인덱스
create index idx_reflections_user on reflections(user_id);
create index idx_reflections_visibility on reflections(visibility);
create index idx_prayers_user on prayers(user_id);
create index idx_devotionals_day on devotionals(day);
create index idx_community_reactions_reflection on community_reactions(reflection_id);
create index idx_ai_coach_logs_user on ai_coach_logs(user_id);

-- RLS (Row Level Security) 정책
alter table users enable row level security;
alter table reflections enable row level security;
alter table prayers enable row level security;
alter table community_reactions enable row level security;
alter table ai_coach_logs enable row level security;

-- 사용자는 자신의 데이터만 접근
create policy "Users can view own data" on users for select using (auth.uid() = id);
create policy "Users can update own data" on users for update using (auth.uid() = id);

-- 묵상 기록: 자신의 것만 CRUD, 공개된 것은 읽기 가능
create policy "Users can insert own reflections" on reflections for insert with check (auth.uid() = user_id);
create policy "Users can view own reflections" on reflections for select using (auth.uid() = user_id or visibility in ('group', 'church'));
create policy "Users can update own reflections" on reflections for update using (auth.uid() = user_id);
create policy "Users can delete own reflections" on reflections for delete using (auth.uid() = user_id);

-- 기도: 자신의 것만
create policy "Users can manage own prayers" on prayers for all using (auth.uid() = user_id);

-- 공동체 반응: 누구나 추가 가능, 자신의 것만 수정/삭제
create policy "Users can insert reactions" on community_reactions for insert with check (auth.uid() = user_id);
create policy "Users can view reactions" on community_reactions for select using (true);
create policy "Users can delete own reactions" on community_reactions for delete using (auth.uid() = user_id);

-- AI 코치 로그: 자신의 것만
create policy "Users can manage own ai logs" on ai_coach_logs for all using (auth.uid() = user_id);

-- 묵상 콘텐츠는 모두 읽기 가능
alter table devotionals enable row level security;
create policy "Everyone can read devotionals" on devotionals for select using (true);
