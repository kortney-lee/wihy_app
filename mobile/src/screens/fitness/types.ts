/**
 * Shared types for Fitness Dashboard components
 */

import { DailyWorkout } from '../../services';

// Progressive Overload Tracking
export interface ProgressiveOverload {
  exercise_id: string;
  previous_weight: number;
  recommended_weight: number;
  increase_percentage: number;
  reason: string;
}

// Program Progress Data
export interface ProgramProgress {
  program_id: string;
  program_name: string;
  current_week: number;
  current_day: number;
  total_weeks: number;
  days_per_week: number;
  completed_workouts: number;
  total_workouts: number;
  completion_percentage: number;
  streak_days: number;
  next_workout_date: string;
  is_rest_day: boolean;
  progression_note?: string;
  progressive_overload?: ProgressiveOverload[];
}

// Fitness Level Definition
export interface FitnessLevel {
  id: string;
  title: string;
  icon: string;
  description: string;
  features: string[];
  color: string;
}

// Body Part Option
export interface BodyPartOption {
  id: string;
  label: string;
  icon: string;
}

// Equipment Category
export type EquipmentCategory = 'cardio' | 'free_weights' | 'strength_machines' | 'functional' | 'recovery';

// Equipment Option
export interface EquipmentOption {
  id: string;
  label: string;
  icon: string;
  category: EquipmentCategory;
  difficulty?: 'all_levels' | 'beginner' | 'intermediate' | 'advanced';
}

// Performance Goal
export interface PerformanceGoal {
  id: string;
  label: string;
  icon: string;
  category: string;
  duration: number;
  description: string;
  targetAreas: string[];
}

// Body Goal
export interface BodyGoal {
  id: string;
  label: string;
  icon: string;
  description: string;
  targetAreas: string[];
}

// Quick Goal
export interface QuickGoal {
  label: string;
  icon: string;
  bodyParts: string[];
  duration: number;
  category: string;
}

// Goal Category
export interface GoalCategory {
  id: string;
  label: string;
  icon: string;
}

// Scheduled Workout
export interface ScheduledWorkout {
  date: Date;
  workout: any;
}

// Workout Summary for completion modal
export interface WorkoutSummary {
  duration: string;
  setsCompleted: number;
  calories: number;
  achievements: WorkoutAchievement[];
}

// Achievement
export interface WorkoutAchievement {
  icon: string;
  title: string;
  description: string;
  color: string;
}

// Completed Set
export interface CompletedSet {
  exercise_id: string;
  set: number;
  reps: number;
  weight: number;
}

// Collapsible Section State
export interface ExpandedSections {
  performance: boolean;
  body: boolean;
  quick: boolean;
  bodyAreas: boolean;
  equipment: boolean;
  duration: boolean;
}

// Modal Step Types
export type ModalStep = 'level' | 'goals' | 'program' | 'preview';

// View Mode
export type ViewMode = 'simple' | 'detailed';

// Extended DailyWorkout with running data
export interface ExtendedDailyWorkout extends DailyWorkout {
  runningData?: {
    distance_km: number;
    pace_target: string;
    focus: string;
    type: string;
    instructions: string[];
    calories_estimate: number;
    intervals: any[];
  };
}
