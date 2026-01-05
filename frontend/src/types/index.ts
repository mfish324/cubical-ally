// User types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  subscription_tier: 'free' | 'pro';
  profile: UserProfile | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  current_occupation_code: string;
  current_occupation_title: string;
  target_occupation_code: string;
  target_occupation_title: string;
  industry: string;
  years_in_current_role: number | null;
  checkin_enabled: boolean;
  checkin_day: number | null;
  checkin_time: string | null;
  last_checkin_at: string | null;
  readiness_score: number | null;
  created_at: string;
  updated_at: string;
}

// Occupation types
export interface Occupation {
  onet_soc_code: string;
  title: string;
  description: string;
  job_zone: number;
}

export interface OccupationSearchResult {
  occupation: Occupation;
  match_score: number;
  matched_alias?: string;
}

// Skill types
export interface Skill {
  id: string;
  element_id: string;
  name: string;
  description: string;
  category: 'knowledge' | 'skill' | 'ability' | 'tool';
}

export interface OccupationSkill {
  skill: Skill;
  importance: number;
  level: number;
}

export interface UserSkill {
  id: string;
  skill: Skill | null;
  skill_name: string;
  skill_detail?: Skill;
  proficiency: 1 | 2 | 3;
  proficiency_display: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// Promotion path types
export interface PromotionPath {
  id: string;
  target_occupation: Occupation;
  frequency: number;
  sector: string;
  region: string;
  confidence_score: number;
  transition_percentage: number;
}

// Evidence types
export interface Evidence {
  id: string;
  skill: string | null;
  skill_detail?: Skill;
  situation: string;
  action: string;
  result: string;
  date: string | null;
  ai_enhanced_version: string;
  combined_text: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceCreate {
  skill?: string;
  situation?: string;
  action: string;
  result?: string;
  date?: string;
}

// Gap analysis types
export interface GapDetail {
  skill: Skill;
  priority: 'high' | 'medium' | 'low';
  importance: number;
  user_proficiency: number | null;
  required_level: number;
}

export interface GapAnalysis {
  readiness_score: number;
  target_occupation: string;
  computed_at: string;
  strengths: Skill[];
  gaps: GapDetail[];
  partial_matches: Skill[];
  total_target_skills: number;
  matched_skills: number;
}

// Gap coaching types
export interface GapCoaching {
  why_it_matters: string;
  develop_at_work: string[];
  develop_independently: string[];
  how_to_demonstrate: string[];
}

// Document types
export interface GeneratedDocument {
  id: string;
  target_occupation: string;
  target_occupation_title: string;
  tone: 'formal' | 'conversational' | 'concise';
  audience: string;
  content_markdown: string;
  version: number;
  generated_at: string;
}

export interface DocumentGenerateRequest {
  audience: 'manager' | 'hr' | 'skip_level' | 'unknown';
  tone: 'formal' | 'conversational' | 'concise';
  emphasis?: string;
}

// Check-in types
export interface CheckinLog {
  id: string;
  scheduled_at: string;
  completed_at: string | null;
  skipped: boolean;
  wins_added: number;
  skills_updated: number;
  notes: string;
  readiness_score_snapshot: number | null;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password1: string;
  password2: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

// Onboarding state
export interface OnboardingState {
  currentOccupation: Occupation | null;
  targetOccupation: Occupation | null;
  skills: Map<string, { skillId: string; proficiency: 1 | 2 | 3 }>;
  industry?: string;
}
