// Fitness Types for Enhanced Fitness Dashboard
// ============================================

// Fitness Level Types
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

// Intensity Types (for quick workouts)
export type IntensityLevel = 'light' | 'moderate' | 'intense';

// Quick Workout Types
export type WorkoutType = 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'hiit' | 'strength' | 'yoga' | 'mobility' | 'pilates';
export type QuickWorkoutMode = 'quick' | 'routine' | 'train_sports';
export type QuickEquipment = 'none' | 'dumbbells' | 'bands' | 'kettlebell';

// Program Types
export type ProgramType = 'strength' | 'interval_cardio' | 'sport' | 'race' | 'challenge' | 'yoga' | 'pilates' | 'stretching' | 'core';
export type RaceType = 'c25k' | '5k' | '10k' | 'half_marathon' | 'marathon' | 'ironman';
export type SportType = 'cycling' | 'football' | 'soccer' | 'basketball' | 'tennis' | 'golf' | 'swimming' | 'baseball' | 'hockey' | 'volleyball' | 'boxing' | 'mma' | 'crossfit';
export type ChallengeType = '30_day_shred' | 'couch_potato_fix' | 'weight_loss_challenge' | 'plank_challenge' | 'pushup_challenge';

// Equipment Category Types
export type EquipmentCategory = 'cardio' | 'free_weights' | 'strength_machines' | 'functional' | 'recovery';

export interface FitnessLevelOption {
  id: FitnessLevel;
  title: string;
  emoji: string;
  description: string;
  features: string[];
  color: string;
  repsRange: string;
  restTime: string;
}

// Body Part Types
export type BodyPart = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'arms' 
  | 'legs' 
  | 'core' 
  | 'glutes' 
  | 'calves';

export interface BodyPartOption {
  id: BodyPart;
  label: string;
  emoji: string;
}

// Equipment Types
export type Equipment = 
  | 'dumbbells' 
  | 'barbell' 
  | 'resistance_bands' 
  | 'bodyweight' 
  | 'cable_machine'
  | 'bench'
  | 'kettlebell';

export interface EquipmentOption {
  id: Equipment;
  label: string;
  emoji?: string;
}

// Quick Goal Types
export interface QuickGoal {
  id: string;
  label: string;
  emoji: string;
  bodyParts: BodyPart[];
  duration: number;
  type?: 'strength' | 'cardio' | 'hiit' | 'flexibility';
}

// Exercise Types
export interface Exercise {
  exercise_id: string;
  name: string;
  target_muscle: string;
  secondary_muscles?: string[];
  sets: number;
  reps: string;
  rest_seconds: number;
  equipment?: string[];
  instructions?: string[];
  video_url?: string;
  image_url?: string;
  weight_recommendation?: string;
  form_tips?: string[];
  superset_with?: string;
  notes?: string;
}

// Warm Up / Cool Down Types
export interface ActivityItem {
  name: string;
  duration_seconds?: number;
  reps?: number;
}

export interface WarmUpCoolDown {
  duration_minutes: number;
  activities: ActivityItem[];
}

// Interval Types (for cardio workouts)
export interface Interval {
  interval_id: string;
  sequence: number;
  type: 'warm_up' | 'work' | 'recovery' | 'cool_down';
  activity: string;
  duration_minutes?: number;
  duration_seconds: number;
  intensity: 'low' | 'moderate' | 'high';
  instructions?: string;
  target_heart_rate?: string;
  repeat?: number;
  repeat_with_interval?: string;
}

// Workout Types
export interface Workout {
  workout_id: string;
  program_id?: string;
  day: number;
  week: number;
  scheduled_date?: string;
  name: string;
  focus?: string;
  type: 'strength' | 'cardio' | 'rest' | 'quick_strength' | 'interval_cardio';
  estimated_duration: number;
  difficulty?: FitnessLevel;
  is_rest_day: boolean;
  is_completed?: boolean;
  completed_at?: string;
  exercises: Exercise[];
  intervals?: Interval[];
  warm_up?: WarmUpCoolDown;
  cool_down?: WarmUpCoolDown;
  progression_note?: string;
  notes?: string;
  circuit_style?: boolean;
  total_rounds?: number;
  time_breakdown?: {
    warm_up: number;
    work_time: number;
    cool_down: number;
  };
  user_notes?: string;
  performance?: CompletedSet[][];
  energy_level?: 'low' | 'moderate' | 'high';
  exercise_count?: number;
  interval_count?: number;
}

// Completed Set Tracking
export interface CompletedSet {
  set: number;
  reps: number;
  weight: number | 'bodyweight';
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'hard';
  timestamp?: string;
}

export interface ExerciseCompletion {
  exercise_id: string;
  sets_completed: CompletedSet[];
}

// Workout Completion Types
export interface WorkoutCompletionData {
  completed_at: string;
  duration_minutes: number;
  exercises_completed: ExerciseCompletion[];
  intervals_completed?: any[];
  distance_km?: number;
  average_heart_rate?: number;
  notes?: string;
  energy_level?: 'low' | 'moderate' | 'high';
  calories_burned?: number;
}

export interface WorkoutCompletionResponse {
  success: boolean;
  workout_completed: boolean;
  program_id: string;
  workout_id: string;
  progress: ProgramProgress;
  achievements?: Achievement[];
  recommendations?: {
    rest_until?: string;
    next_focus?: string;
    progressive_overload?: Record<string, ProgressiveOverloadRecommendation>;
  };
}

export interface ProgressiveOverloadRecommendation {
  current: {
    weight: number;
    reps: string;
  };
  next_workout: {
    weight: number;
    reps: string;
    reason: string;
  };
}

export interface Achievement {
  type: string;
  title: string;
  description: string;
  icon: string;
}

// Program Types
export interface FitnessProgram {
  program_id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  days_per_week: number;
  difficulty: FitnessLevel;
  total_workouts: number;
  created_at?: string;
  supports_quick_workouts?: boolean;
  workouts: Workout[];
  progress_tracking?: ProgramProgress;
  user_stats?: UserProgramStats;
  is_favorite?: boolean;
  completed_workouts?: number;
  current_week?: number;
  current_day?: number;
  completion_percentage?: number;
}

export interface ProgramProgress {
  current_week: number;
  current_day: number;
  completed_workouts: number;
  total_workouts: number;
  completion_percentage: number;
  total_distance_km?: number;
  total_run_time_minutes?: number;
  next_workout?: {
    workout_id: string;
    scheduled_date?: string;
    day?: number;
    week?: number;
    name?: string;
  };
}

export interface UserProgramStats {
  times_completed: number;
  last_completed?: string;
  average_duration?: number;
  total_calories_burned: number;
}

// Calendar Types
export interface CalendarWorkout {
  workout_id: string;
  name: string;
  type: string;
  week: number;
  day: number;
  estimated_duration: number;
  is_rest_day: boolean;
  is_completed: boolean;
  completed_at?: string;
  energy_level?: string;
  exercise_count: number;
  interval_count: number;
}

export interface CalendarDayData {
  date: string;
  workouts: CalendarWorkout[];
  has_workout: boolean;
  has_rest_day: boolean;
  all_completed: boolean;
}

export interface CalendarData {
  success: boolean;
  program_id: string;
  program_name: string;
  start_date?: string;
  end_date?: string;
  calendar_days: CalendarDayData[];
  summary: {
    total_days: number;
    workout_days: number;
    rest_days: number;
    completed_days: number;
    completion_percentage: number;
  };
}

// Milestone Types (for interval programs like C25K)
export interface Milestone {
  week: number;
  achievement: string;
  goal: string;
}

// API Request/Response Types
export interface CreateProgramRequest {
  userId?: string;
  description: string;
  difficulty: FitnessLevel;
  duration: number;
  equipment?: Equipment[];
  targetMuscles?: BodyPart[];
  daysPerWeek?: number;
  programType?: 'strength' | 'interval_cardio' | 'hiit' | 'flexibility';
}

export interface CreateProgramResponse {
  success: boolean;
  program_id: string;
  program?: FitnessProgram;
  message?: string;
}

export interface GetExercisesParams {
  target?: BodyPart;
  equipment?: Equipment;
  difficulty?: FitnessLevel;
}

export interface ExerciseLibraryResponse {
  exercises: Exercise[];
  total: number;
}

// User Preferences
export interface FitnessUserPreferences {
  fitnessLevel: FitnessLevel;
  preferredEquipment?: Equipment[];
  preferredDuration?: number;
  goals?: string[];
  targetMuscleGroups?: BodyPart[];
}

// Saved Program Types
export interface SavedProgram {
  program_id: string;
  name: string;
  created_at: string;
  duration_weeks: number;
  total_workouts: number;
  completed_workouts: number;
  current_week: number;
  current_day: number;
  completion_percentage: number;
  is_favorite: boolean;
  times_completed: number;
  last_completed?: string;
}

// Rest Timer State
export interface RestTimerState {
  isActive: boolean;
  timeRemaining: number;
  totalTime: number;
}

// Workout Session State
export interface WorkoutSessionState {
  currentExerciseIndex: number;
  currentSetNumber: number;
  completedSets: CompletedSet[];
  completedExercises: ExerciseCompletion[];
  startTime: string;
  restTimer: RestTimerState;
  isPaused: boolean;
}

// Quick Workout Types (for Quick Workout Generator)
// =================================================

export interface WorkoutOptionItem {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  calories_multiplier?: number;
}

export interface WorkoutOptions {
  workout_types: WorkoutOptionItem[];
  intensities: WorkoutOptionItem[];
  durations: WorkoutOptionItem[];
  equipment: WorkoutOptionItem[];
  modes: WorkoutOptionItem[];
}

export interface QuickWorkoutRequest {
  user_id?: string;
  workout_type: WorkoutType;
  intensity: IntensityLevel;
  duration: number;
  equipment: QuickEquipment[];
  mode?: QuickWorkoutMode;
}

export interface QuickWorkoutExercise {
  name: string;
  duration_seconds?: number | null;
  reps?: number | null;
  sets?: number;
  rest_seconds?: number;
  per_side?: boolean;
}

export interface QuickWorkoutSegment {
  phase: 'warmup' | 'main' | 'cooldown';
  duration_minutes: number;
  exercises: QuickWorkoutExercise[];
}

export interface QuickWorkout {
  workout_id: string;
  user_id?: string;
  title: string;
  subtitle: string;
  workout_type: WorkoutType;
  intensity: {
    level: IntensityLevel;
    label: string;
    description: string;
  };
  duration_minutes: number;
  equipment_used: string[];
  estimated_calories: number;
  mode: QuickWorkoutMode;
  segments: QuickWorkoutSegment[];
  total_exercises: number;
  created_at: string;
}

// Equipment Library Types
// =======================

export interface EquipmentExercise {
  name: string;
  sets: string;
  reps: string;
  muscle: string;
  level: FitnessLevel | 'all_levels';
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: EquipmentCategory;
  difficulty: FitnessLevel | 'all_levels';
  muscleGroups: string[];
  commonExercises: EquipmentExercise[];
  tips: string[];
  availableAt: string[];
  icon: string;
}

export interface EquipmentCategoryInfo {
  id: string;
  name: string;
  count: number;
}

export interface EquipmentListResponse {
  success: boolean;
  equipment: EquipmentItem[];
  categories: EquipmentCategoryInfo[];
  total: number;
}

// Program List Types
// ==================

export interface ProgramListItem {
  programId: string;
  name: string;
  goal: string;
  durationWeeks: number;
  daysPerWeek: number;
  currentWeek: number;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'DELETED';
  completionRate: number;
  equipment: string[];
  createdAt: string;
}

export interface UserProgramsResponse {
  success: boolean;
  programs: ProgramListItem[];
  total_programs?: number;
  active_programs?: number;
  completed_programs?: number;
}

