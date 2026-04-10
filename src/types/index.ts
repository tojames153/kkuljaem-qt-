export type AgeGroup = 'children' | 'youth' | 'young_adult' | 'senior' | 'teacher' | 'admin';
export type Visibility = 'private' | 'group' | 'church';
export type ReactionType = 'pray' | 'empathy' | 'grace';

export interface User {
  id: string;
  name: string;
  email: string;
  age_group: AgeGroup;
  church_id: string | null;
  created_at: string;
}

export interface Church {
  id: string;
  church_name: string;
  pastor_name: string | null;
  location: string | null;
  created_at: string;
}

export interface Devotional {
  id: string;
  day: number;
  season: string | null;
  theme: string;
  passage: string;
  meditation: string;
  question1: string;
  question2: string;
  question3: string;
  prayer: string;
  ccm: string | null;
  memory_verse: string | null;
  age_children: string | null;
  age_youth: string | null;
  age_young_adult: string | null;
  created_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  devotional_id: string;
  reflection_text: string;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
  user?: { name: string };
}

export interface Prayer {
  id: string;
  user_id: string;
  prayer_text: string;
  is_answered: boolean;
  created_at: string;
}

export interface CommunityReaction {
  id: string;
  reflection_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

// ===== 그룹 시스템 =====

export type GroupType = 'church' | 'small_group';
export type MemberRole = 'leader' | 'admin' | 'member';

// 기본 그룹 엔티티
export interface Group {
  id: string;
  group_name: string;
  group_type: GroupType;
  member_count: number;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  invite_code?: string;
}

// 소그룹 (Group 상속)
export interface SmallGroup extends Group {
  group_type: 'small_group';
  max_members: number;
  leader_id: string | null;
  church_id: string | null; // 소속 교회
  meeting_day: string | null;
  meeting_time: string | null;
}

// 교회 (Group 상속) - 유일성 보장
export interface ChurchGroup extends Group {
  group_type: 'church';
  pastor_name: string | null;
  address: string | null;
  phone: string | null;
  unique_identifier: string; // 교회 유일성 (이름+주소 조합 or 전화번호)
  is_verified: boolean;
}

// 그룹 멤버
export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  user_name?: string;
  role: MemberRole;
  joined_at: string;
}
