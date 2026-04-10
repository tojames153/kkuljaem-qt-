-- 꿀잼QT 데이터베이스 스키마
-- Supabase SQL Editor에서 실행하세요

-- 0. app_users 테이블 (앱 자체 인증용)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  name text not null,
  age_group text not null default 'youth' check (age_group in ('children','youth','young_adult','senior','teacher','admin')),
  church_name text default '',
  created_at timestamp with time zone default now()
);

-- RLS: 누구나 가입/로그인 가능
alter table app_users enable row level security;
create policy "Anyone can insert" on app_users for insert with check (true);
create policy "Anyone can select" on app_users for select using (true);

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

-- 8. groups 테이블 (기본 그룹 엔티티)
create table groups (
  id uuid primary key default gen_random_uuid(),
  group_name text not null,
  group_type text not null check (group_type in ('church', 'small_group')),
  member_count integer default 0,
  description text default '',
  created_by uuid references users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 9. small_groups 테이블 (소그룹 - groups 상속)
create table small_groups (
  id uuid primary key references groups(id) on delete cascade,
  max_members integer not null default 12,
  leader_id uuid references users(id),
  church_id uuid references groups(id),
  meeting_day text,
  meeting_time text
);

-- 10. church_details 테이블 (교회 - groups 상속, 유일성 보장)
create table church_details (
  id uuid primary key references groups(id) on delete cascade,
  pastor_name text,
  address text,
  phone text,
  unique_identifier text unique not null,
  is_verified boolean default false
);

-- 11. group_members 테이블 (그룹 멤버십)
create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text not null default 'member' check (role in ('leader', 'admin', 'member')),
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
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

-- 그룹 관련 인덱스
create index idx_groups_type on groups(group_type);
create index idx_groups_created_by on groups(created_by);
create index idx_small_groups_church on small_groups(church_id);
create index idx_small_groups_leader on small_groups(leader_id);
create index idx_church_details_unique on church_details(unique_identifier);
create index idx_group_members_group on group_members(group_id);
create index idx_group_members_user on group_members(user_id);

-- 그룹 RLS
alter table groups enable row level security;
alter table small_groups enable row level security;
alter table church_details enable row level security;
alter table group_members enable row level security;

create policy "Everyone can read groups" on groups for select using (true);
create policy "Authenticated users can create groups" on groups for insert with check (auth.uid() is not null);
create policy "Group creators can update" on groups for update using (auth.uid() = created_by);
create policy "Group creators can delete" on groups for delete using (auth.uid() = created_by);

create policy "Everyone can read small_groups" on small_groups for select using (true);
create policy "Everyone can read church_details" on church_details for select using (true);
create policy "Everyone can read group_members" on group_members for select using (true);
create policy "Members can manage own membership" on group_members for delete using (auth.uid() = user_id);
