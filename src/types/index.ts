export type AgeGroup = 'children' | 'youth' | 'young_adult' | 'teacher' | 'admin';
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

export interface AiCoachLog {
  id: string;
  user_id: string;
  reflection_id: string | null;
  prompt: string;
  response: string;
  created_at: string;
}
