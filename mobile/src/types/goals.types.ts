/**
 * Goals & Milestones Types
 * 
 * Type definitions for the Goals API (services.wihy.ai)
 */

// ============================================
// GOAL TYPES
// ============================================

export type GoalStatus = 'active' | 'completed' | 'paused';

export type GoalType =
  | 'weight_loss'
  | 'muscle_gain'
  | 'body_recomposition'
  | 'nutrition'
  | 'hydration'
  | 'steps'
  | 'sleep'
  | 'custom';

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType | string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  status: GoalStatus;
  progress_percentage: number;
  target_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  value: number;
  label: string;
  achieved: boolean;
  achieved_at?: string;
}

export interface ProgressEntry {
  id: string;
  goal_id: string;
  value: number;
  date: string;
  notes?: string;
  created_at: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateGoalRequest {
  type: GoalType | string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  target_date?: string;
  milestones?: Array<{ value: number; label: string }>;
}

export interface UpdateGoalRequest {
  title?: string;
  target_value?: number;
  status?: GoalStatus;
  target_date?: string;
}

export interface LogProgressRequest {
  value: number;
  date: string;
  notes?: string;
}

export interface GoalFilters {
  status?: GoalStatus;
  type?: GoalType | string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface CreateGoalResponse {
  success: boolean;
  goal: Goal;
  milestones: Milestone[];
}

export interface ListGoalsResponse {
  success: boolean;
  goals: Goal[];
  count: number;
}

export interface GetGoalResponse {
  success: boolean;
  goal: Goal;
  milestones: Milestone[];
  progress_history: ProgressEntry[];
}

export interface LogProgressResponse {
  success: boolean;
  progress: ProgressEntry;
  milestones_achieved: Milestone[];
  goal_updated: Goal;
}

export interface DeleteGoalResponse {
  success: boolean;
}

// ============================================
// ACTIVE GOALS RESPONSE
// ============================================

export interface ActiveGoalsResponse {
  success: boolean;
  goals: Goal[];
  count: number;
}
