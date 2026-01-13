import { API_CONFIG } from './config';
import { fetchWithLogging } from '../utils/apiLogger';

// ============= CORE INTERFACES =============

export interface FitnessProfile {
  userId: string;
  name: string;
  age?: number;
  weight_lbs?: number;
  height_inches?: number;
  goals?: string[];
  equipment?: string[];
  injuries?: string[];
  experience_level?: 'beginner' | 'intermediate' | 'advanced';
  available_days?: number[];
  workout_duration_min?: number;
}

export interface FitnessProgram {
  id: string;
  userId: string;
  name: string;
  goal: 'HYPERTROPHY' | 'STRENGTH' | 'ENDURANCE' | 'WEIGHT_LOSS';
  durationWeeks: number;
  daysPerWeek: number;
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DELETED';
  completion_rate?: number;
  created_at?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  workoutId: string;
  programId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  started_at: string;
  completed_at?: string;
  exercises?: ExerciseLog[];
}

export interface ExerciseLog {
  exerciseId: string;
  setNumber: number;
  repsCompleted: number;
  weightUsed?: number;
  formScore?: number;
}

export interface WorkoutFeedback {
  userId: string;
  workoutId: string;
  date: string;
  rpe: number;
  felt_pain: boolean;
  pain_locations?: string[];
  adherence: number;
  overall_notes?: string;
}

/** Warmup exercise in today's workout */
export interface WarmupExercise {
  exercise: string;
  duration: number;
  notes?: string;
}

/** Main exercise in today's workout */
export interface MainExercise {
  exercise: string;
  sets: number;
  reps: number | string;
  rest: number;
  weight?: string;
  notes?: string;
}

/** Cooldown stretch in today's workout */
export interface CooldownStretch {
  exercise: string;
  duration: number;
  perSide: boolean;
  targetMuscles: string[];
  instructions?: string;
}

/** Today's workout session from /api/fitness/today/:userId */
export interface TodayWorkoutSession {
  sessionId: string;
  dayOfWeek: string;
  title: string;
  category: string;
  warmupMinutes: number;
  mainMinutes: number;
  cooldownMinutes: number;
  totalMinutes: number;
  equipment: string[];
  warmup: WarmupExercise[];
  main: MainExercise[];
  cooldown: CooldownStretch[];
}

/** Program row showing weekly schedule */
export interface ProgramRow {
  day: string;
  focus: string;
  status: 'active' | 'completed' | 'upcoming';
  minutes: number;
}

/** Wellness metrics from today's workout response */
export interface WellnessMetrics {
  weeklyVolume: number;
  restDays: number;
  varietyScore: number;
  progressionRate: string;
}

/** Full response from GET /api/fitness/today/:userId */
export interface TodayWorkoutResponse {
  success: boolean;
  userId: string;
  session: TodayWorkoutSession;
  programRows: ProgramRow[];
  wellness: WellnessMetrics;
  fromBlockPlan: boolean;
}

/** Legacy DailyWorkout interface for backwards compatibility */
export interface DailyWorkout {
  workout_id: string;
  date: string;
  phase: string;
  level: string;
  day_of_week: string;
  exercises: Exercise[];
  stretches: Stretch[];
  estimated_duration_min: number;
  // New session-based fields
  session?: TodayWorkoutSession;
  programRows?: ProgramRow[];
  wellness?: WellnessMetrics;
}

export interface Exercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string;
  intensity: string;
  rest_sec: number;
  equipment?: string;
  instructions?: string;
}

export interface Stretch {
  stretch_id: string;
  name: string;
  target_muscle: string;
  duration_sec: number;
  instructions?: string;
}

export interface MuscleGroup {
  id: string;
  name: string;
  category: string;
}

// ============= NEW API INTERFACES =============

/** Request body for creating a workout program from natural language */
export interface CreateProgramRequest {
  /** Optional - for trainers creating plans for clients. If omitted, uses authenticated user */
  userId?: string;
  /** Natural language description like "I want to focus on chest and triceps with dumbbells" */
  description: string;
  /** User's fitness level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Workout duration in minutes (15, 30, 45, 60) */
  duration: number;
  /** Available equipment */
  equipment?: string[];
  /** Target muscle groups */
  targetMuscles?: string[];
  /** How many days per week to workout */
  daysPerWeek?: number;
  /** For interval-based programs like C25K */
  programType?: 'strength' | 'interval_cardio' | 'sport' | 'race' | 'challenge' | 'yoga' | 'pilates' | 'stretching' | 'core';
  /** Program duration in weeks (0 = single workout) */
  duration_weeks?: number;
  /** Generate a single workout only (not a multi-week program) */
  singleWorkout?: boolean;
  /** For sport-specific training */
  sport?: 'cycling' | 'football' | 'soccer' | 'basketball' | 'tennis' | 'golf' | 'swimming' | 'baseball' | 'hockey' | 'volleyball' | 'boxing' | 'mma' | 'crossfit';
  /** For race training programs */
  raceType?: 'c25k' | '5k' | '10k' | 'half_marathon' | 'marathon' | 'ironman';
  /** For challenge programs */
  challenge?: '30_day_shred' | 'couch_potato_fix' | 'weight_loss_challenge' | 'plank_challenge' | 'pushup_challenge';
}

/** Progressive overload tracking for an exercise */
export interface ProgressiveOverload {
  exercise_id: string;
  previous_weight?: number;
  recommended_weight?: number;
  increase_percentage?: number;
  reason?: string;
  week_1_weight?: number;
  week_2_weight?: number;
}

/** Full exercise details from API */
export interface ProgramExercise {
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
  progressive_overload?: ProgressiveOverload;
  /** For quick workouts - superset pairing */
  superset_with?: string;
  notes?: string;
}

/** Warm up activity */
export interface WarmUpActivity {
  name: string;
  duration_seconds?: number;
  reps?: number;
}

/** Warm up section */
export interface WarmUp {
  duration_minutes: number;
  activities: WarmUpActivity[];
}

/** Cool down section */
export interface CoolDown {
  duration_minutes: number;
  activities: WarmUpActivity[];
}

/** Interval for cardio workouts (C25K style) */
export interface WorkoutInterval {
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

/** A single workout day within a program */
export interface ProgramWorkout {
  workout_id: string;
  program_id?: string;
  day: number;
  week: number;
  scheduled_date: string;
  name: string;
  focus?: string;
  type: 'strength' | 'cardio' | 'rest' | 'quick_strength' | 'interval_cardio' | 'race_training' | 'yoga' | 'pilates' | 'core' | 'sport_specific' | 'challenge' | 'stretching';
  estimated_duration: number;
  difficulty?: string;
  is_rest_day: boolean;
  exercises: ProgramExercise[];
  
  // ========== SCHEDULING FIELDS (Beginner/Intermediate/Advanced) ==========
  /** Day of the week (Monday, Tuesday, etc.) */
  day_of_week?: string | number;
  /** Whether there's a rest day before this workout */
  rest_day_before?: boolean;
  /** Whether there's a rest day after this workout */
  rest_day_after?: boolean;
  /** Whether this is a consecutive workout day (back-to-back) */
  is_consecutive_day?: boolean;
  /** Workout intensity level for scheduling (easy days after hard days) */
  intensity?: 'easy' | 'moderate' | 'hard';
  /** Phase of the training program */
  phase?: string;
  /** Phase number for challenge programs */
  phase_number?: number;
  
  // ========== RACE TRAINING FIELDS ==========
  /** Race type for race training programs */
  race_type?: '5k' | '10k' | 'half_marathon' | 'marathon' | 'c25k';
  /** Specific workout data for race training */
  workout?: {
    workout_type: 'walk_run_intervals' | 'long_walk_run' | 'easy_run' | 'tempo_run' | 'intervals' | 'long_run' | 'continuous_run' | 'strides' | 'extended_runs';
    total_distance_km?: number;
    structure?: string;
    run_time_minutes?: number;
    walk_time_minutes?: number;
    target_pace?: string;
    tempo_pace?: string;
    interval_pace?: string;
    recovery_pace?: string;
    heart_rate_zone?: string;
    instructions?: string;
    progression_note?: string;
  };
  /** Is this the race day itself */
  is_race_day?: boolean;
  /** Race plan for race day */
  race_plan?: {
    distance_km: number;
    target_time: string;
    target_pace: string;
    strategy: Record<string, { pace: string; instructions: string }>;
    pre_race_checklist?: string[];
    during_race_tips?: string[];
    post_race?: string[];
  };
  /** Motivation message for the workout */
  motivation?: string;
  /** Suggestion for rest days */
  suggestion?: string;
  
  // ========== YOGA/PILATES/STRETCHING FIELDS ==========
  /** Style of yoga (Gentle Flow, Power, etc.) */
  style?: string;
  /** Breath work section for yoga */
  breath_work?: {
    name: string;
    duration: string;
    instructions: string;
  };
  /** Pilates principles */
  principles?: string[];
  /** Tips for the workout */
  tips?: string[];
  
  // ========== SPORT-SPECIFIC FIELDS ==========
  /** Sport type for sport-specific training */
  sport?: string;
  
  // ========== CHALLENGE FIELDS ==========
  /** Challenge name */
  challenge_name?: string;
  
  // ========== INTERVAL/CARDIO FIELDS ==========
  /** For interval/cardio workouts */
  intervals?: WorkoutInterval[];
  total_intervals?: number;
  total_run_time?: number;
  total_walk_time?: number;
  distance_goal_km?: number;
  calories_estimate?: number;
  warm_up?: WarmUp;
  cool_down?: CoolDown;
  is_completed?: boolean;
  completed_at?: string | null;
  user_notes?: string;
  performance?: any[];
  progression_note?: string;
  notes?: string;
  /** Recovery note for rest days */
  recovery_note?: string;
  
  // ========== QUICK WORKOUT FIELDS ==========
  /** For quick workouts */
  circuit_style?: boolean;
  total_rounds?: number;
  time_breakdown?: {
    warm_up: number;
    work_time: number;
    cool_down: number;
  };
  
  // ========== LIST VIEW FIELDS ==========
  /** For list views */
  exercises_count?: number;
  energy_level?: string | null;
}

/** Scheduling rules for different difficulty levels */
export interface DifficultySchedulingRule {
  /** Scheduling pattern name */
  pattern: 'every_other_day' | 'hard_easy_alternating' | 'consecutive_ok';
  /** Example schedule */
  example: string;
  /** Whether consecutive workout days are allowed */
  consecutive_allowed: boolean;
  /** Condition for consecutive days (if allowed) */
  condition?: string;
  /** Reason for this scheduling pattern */
  reason: string;
}

/** Difficulty scheduling rules for a program */
export interface DifficultySchedulingRules {
  beginner: DifficultySchedulingRule;
  intermediate: DifficultySchedulingRule;
  advanced: DifficultySchedulingRule;
}

/** Progress tracking within a program */
export interface ProgramProgress {
  current_week: number;
  current_day: number;
  completed_workouts: number;
  total_workouts: number;
  completion_percentage: number;
  streak_days?: number;
  total_distance_km?: number;
  total_run_time_minutes?: number;
  next_workout?: {
    workout_id: string;
    scheduled_date: string;
    day: number;
    week?: number;
    name: string;
  };
}

/** User stats for a program */
export interface ProgramUserStats {
  times_completed: number;
  last_completed: string | null;
  average_duration: number | null;
  total_calories_burned: number;
}

/** Milestone for interval programs */
export interface ProgramMilestone {
  week: number;
  achievement: string;
  goal: string;
}

/** Weekly summary for training programs */
export interface WeeklySummary {
  week: number;
  focus: string;
  total_run_min?: number;
  total_walk_min?: number;
  total_km?: number;
  note?: string;
}

/** Full program response from create endpoint */
export interface CreateProgramResponse {
  success: boolean;
  program_id: string;
  name: string;
  description: string;
  duration_weeks: number;
  days_per_week: number;
  difficulty: string;
  total_workouts: number;
  created_at: string;
  supports_quick_workouts?: boolean;
  workouts: ProgramWorkout[];
  progress_tracking: ProgramProgress;
  user_stats?: ProgramUserStats;
  milestones?: ProgramMilestone[];
  
  // ========== SCHEDULING FIELDS (Beginner/Intermediate/Advanced) ==========
  /** Scheduling pattern for the program (every_other_day, consecutive_allowed) */
  schedule_pattern?: 'every_other_day' | 'consecutive_allowed' | 'hard_easy_alternating';
  /** Note explaining the scheduling pattern */
  schedule_note?: string;
  /** Weekly schedule pattern (for intermediate/advanced) */
  weekly_schedule_pattern?: Record<string, { type: string; workout: string }>;
  /** Difficulty-specific scheduling rules */
  difficulty_scheduling_rules?: DifficultySchedulingRules;
  /** Weekly summary for race/interval programs */
  weekly_summary?: WeeklySummary[];
  
  // ========== RACE TRAINING FIELDS ==========
  /** Race distance in km */
  race_distance_km?: number;
  /** Target finish time */
  target_finish_time?: string;
  /** Total days in the program */
  total_days?: number;
}

/** Response from get program workouts endpoint */
export interface ProgramWorkoutsResponse {
  program_id: string;
  program_name: string;
  total_workouts: number;
  workouts: ProgramWorkout[];
  completed_count: number;
  remaining_count: number;
  next_workout?: {
    workout_id: string;
    scheduled_date: string;
    name: string;
  };
}

/** Query parameters for filtering program workouts */
export interface ProgramWorkoutsParams {
  /** Filter by specific week (1-4) */
  week?: number;
  /** Filter by type */
  type?: 'strength' | 'cardio' | 'rest' | 'quick_strength';
  /** Filter rest days */
  is_rest_day?: boolean;
  /** Get workouts under X minutes */
  duration_max?: number;
  /** Get workouts after date (YYYY-MM-DD) */
  scheduled_after?: string;
  /** Get workouts before date (YYYY-MM-DD) */
  scheduled_before?: string;
}

/** Workout history item with full details (for coach view) */
export interface WorkoutHistoryItem {
  workout_id: string;
  program_id?: string;
  program_name?: string;
  workout_type: string;
  completed_at: string;
  duration_minutes: number;
  calories_burned?: number;
  exercises_completed?: any[];
  distance_km?: number;
  average_heart_rate?: number;
  energy_level?: 'low' | 'moderate' | 'high';
  notes?: string;
}

/** Weekly activity summary */
export interface WeeklyActivity {
  total_workouts: number;
  total_minutes: number;
  total_calories: number;
  avg_duration: number;
  workouts_by_day: Record<string, WorkoutHistoryItem[]>;
}

/** Set completion data for workout completion */
export interface SetCompletion {
  set: number;
  reps: number;
  weight: number | 'bodyweight';
  difficulty?: 'easy' | 'moderate' | 'challenging' | 'hard';
}

/** Exercise completion data */
export interface ExerciseCompletion {
  exercise_id: string;
  sets_completed: SetCompletion[];
}

/** Interval completion data for cardio workouts */
export interface IntervalCompletion {
  interval_id: string;
  completed: boolean;
  actual_duration_seconds?: number;
}

/** Request body for completing a workout */
export interface CompleteWorkoutRequest {
  completed_at: string;
  duration_minutes: number;
  exercises_completed?: ExerciseCompletion[];
  intervals_completed?: IntervalCompletion[];
  notes?: string;
  energy_level?: 'low' | 'medium' | 'high';
  calories_burned?: number;
  distance_km?: number;
  average_heart_rate?: number;
}

/** Achievement earned after completing workout */
export interface WorkoutAchievement {
  type: string;
  title: string;
  description: string;
  icon: string;
}

/** Progressive overload recommendation */
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

/** Response from completing a workout */
export interface CompleteWorkoutResponse {
  success: boolean;
  workout_completed: boolean;
  program_id: string;
  workout_id: string;
  progress: {
    completed_workouts: number;
    total_workouts: number;
    completion_percentage: number;
    current_week: number;
    current_day: number;
    next_workout?: {
      workout_id: string;
      day: number;
      week: number;
      name: string;
      scheduled_date: string;
    };
  };
  achievements?: WorkoutAchievement[];
  recommendations?: {
    rest_until?: string;
    next_focus?: string;
    progressive_overload?: Record<string, ProgressiveOverloadRecommendation>;
  };
}

/** Calendar day data */
export interface CalendarDay {
  date: string;
  workouts: Array<{
    workout_id: string;
    name: string;
    type: string;
    week: number;
    day: number;
    estimated_duration: number;
    is_rest_day: boolean;
    is_completed: boolean;
    completed_at: string | null;
    energy_level: string | null;
    exercise_count: number;
    interval_count: number;
  }>;
  has_workout: boolean;
  has_rest_day: boolean;
  all_completed: boolean;
}

/** Calendar summary stats */
export interface CalendarSummary {
  total_days: number;
  workout_days: number;
  rest_days: number;
  completed_days: number;
  completion_percentage: number;
}

/** Response from calendar endpoint */
export interface CalendarResponse {
  success: boolean;
  program_id: string;
  program_name: string;
  start_date: string;
  end_date: string;
  calendar_days: CalendarDay[];
  summary: CalendarSummary;
}

/** Query parameters for calendar endpoint */
export interface CalendarParams {
  /** Month in YYYY-MM format */
  month?: string;
  /** Start date for custom range (YYYY-MM-DD) */
  start_date?: string;
  /** End date for custom range (YYYY-MM-DD) */
  end_date?: string;
}

/** Enhanced exercise from library endpoint */
export interface LibraryExercise {
  exercise_id: string;
  name: string;
  category: string;
  target_muscle: string;
  secondary_muscles?: string[];
  difficulty: string;
  equipment: string[];
  instructions: string[];
  video_url?: string;
  image_url?: string;
}

/** Exercise library response */
export interface ExerciseLibraryResponse {
  exercises: LibraryExercise[];
  total: number;
}

// ============= QUICK WORKOUT API (NEW!) =============
// All 3 modes use the unified /api/fitness/quick-workout endpoint
// - mode: 'quick' (default) = Single workout for today
// - mode: 'routine' = Multi-day weekly program
// - mode: 'training' = Sport-specific workout

/** Request body for generating a workout (all modes) */
export interface QuickWorkoutRequest {
  /** User ID */
  user_id: string;
  /** Workout type - determines exercise focus */
  workout_type?: 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'hiit' | 'strength' | 'flexibility' | 'walking';
  /** Intensity level - affects rest times, reps, and calories */
  intensity?: 'light' | 'moderate' | 'intense';
  /** Duration in minutes (15, 20, 30, 45, 60) */
  duration?: number;
  /** Available equipment (use equipmentPreset instead for presets) */
  equipment?: string[];
  /** Equipment preset - use instead of equipment array */
  equipmentPreset?: 'bodyweight' | 'basic' | 'home_gym' | 'home_gym_plus' | 'full_gym' | 'weights_only' | 'cardio_gym' | 'crossfit_box' | 'apartment' | 'travel' | 'outdoor' | 'planet_fitness' | 'ymca' | 'la_fitness';
  /** Workout mode: quick (single), routine (multi-day), training (sport-specific) */
  mode?: 'quick' | 'routine' | 'training';
  /** Fitness level */
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  /** Muscle groups to target */
  muscleGroups?: string[];
  
  // ===== ROUTINE MODE ONLY =====
  /** Days per week for routine mode (1-7) */
  days_per_week?: number;
  /** Goals for routine mode */
  goals?: ('weight_loss' | 'muscle_gain' | 'endurance' | 'flexibility' | 'general_fitness' | 'sports_performance')[];
  
  // ===== TRAINING MODE ONLY =====
  /** Sport for training mode */
  sport?: 'running' | 'swimming' | 'cycling' | 'triathlon' | 'hiking' | 'basketball' | 'soccer' | 'tennis' | 'golf' | 'rock_climbing' | 'skiing' | 'weightlifting' | 'crossfit' | 'yoga' | 'martial_arts' | 'general_fitness';
  /** Training phase for training mode */
  training_phase?: 'off_season' | 'pre_season' | 'in_season';
}

/** Exercise in a quick workout segment */
export interface QuickWorkoutExercise {
  name: string;
  sets?: number;
  reps?: number | string;
  duration_seconds?: number | null;
  rest_seconds?: number;
  per_side?: boolean;
  instructions?: string;
}

/** Segment in a quick workout (warmup, main, cooldown) */
export interface QuickWorkoutSegment {
  phase: 'warmup' | 'main' | 'cooldown';
  duration_minutes: number;
  exercises: QuickWorkoutExercise[];
}

/** Intensity info in quick workout response */
export interface QuickWorkoutIntensity {
  level: 'light' | 'moderate' | 'intense';
  label: string;
  description: string;
}

/** Section format that API sometimes returns */
export interface QuickWorkoutSection {
  duration_minutes?: number;
  exercises?: QuickWorkoutExercise[];
}

/** Sections object containing warmup, main_workout, and cooldown */
export interface QuickWorkoutSections {
  warmup?: QuickWorkoutSection;
  main_workout?: QuickWorkoutSection;
  cooldown?: QuickWorkoutSection;
}

/** The generated quick workout */
export interface QuickWorkout {
  workout_id: string;
  user_id: string;
  title: string;
  subtitle: string;
  workout_type: string;
  intensity: QuickWorkoutIntensity;
  /** Optional intensity details with additional info */
  intensity_details?: QuickWorkoutIntensity;
  duration_minutes: number;
  equipment_used: string[];
  estimated_calories: number;
  mode: string;
  segments: QuickWorkoutSegment[];
  /** Alternative format - API may return sections instead of segments */
  sections?: QuickWorkoutSections;
  total_exercises: number;
  created_at: string;
}

/** Response from quick workout endpoint */
export interface QuickWorkoutResponse {
  success: boolean;
  workout: QuickWorkout;
}

/** Query parameters for exercise library */
export interface ExerciseLibraryParams {
  /** Target muscle group (e.g., 'chest', 'legs') */
  target?: string;
  /** Required equipment */
  equipment?: string;
  /** Difficulty level */
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  /** Exercise category */
  category?: 'strength' | 'cardio' | 'flexibility';
}

/** User's saved programs list item */
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
  last_completed: string | null;
  progress?: {
    [exercise_id: string]: {
      sets_completed: SetCompletion[];
    };
  };
}

/** Response from list programs endpoint */
export interface ListProgramsResponse {
  programs: SavedProgram[];
}

/** Update program request */
export interface UpdateProgramRequest {
  is_favorite?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  days_per_week?: number;
  times_completed?: number;
  last_completed?: string;
  progress?: any;
}

class FitnessService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  // ============= PROFILE MANAGEMENT =============

  /**
   * Create a new fitness profile for a user
   */
  async createProfile(profile: FitnessProfile): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    return response.json();
  }

  /**
   * Get user's fitness profile
   */
  async getProfile(userId: string): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/profile/${userId}`);
    return response.json();
  }

  // ============= DAILY WORKOUTS =============

  /**
   * Get today's adaptive workout for user
   * GET /api/fitness/today/:userId?dayOfWeek=Mon
   * 
   * Returns workout with warmup, main exercises, and cooldown stretches
   */
  async getTodayWorkout(userId: string, dayOfWeek?: string): Promise<DailyWorkout> {
    console.log('[FitnessService] Getting today workout for user:', userId, 'dayOfWeek:', dayOfWeek);
    
    let url = `${this.baseUrl}/api/fitness/today/${userId}`;
    if (dayOfWeek) {
      url += `?dayOfWeek=${dayOfWeek}`;
    }
    
    const response = await fetchWithLogging(url);
    const data: TodayWorkoutResponse = await response.json();
    console.log('[FitnessService] getTodayWorkout response:', JSON.stringify(data, null, 2));
    
    // Check for API error response
    if (!data.success && (data as any).error) {
      throw new Error((data as any).error);
    }
    
    // Convert session-based response to DailyWorkout format for backwards compatibility
    if (data.session) {
      const session = data.session;
      
      // Convert main exercises to Exercise[] format
      const exercises: Exercise[] = session.main.map((ex, index) => ({
        exercise_id: `${session.sessionId}-main-${index}`,
        name: ex.exercise,
        muscle_group: 'mixed', // API doesn't provide this directly
        sets: ex.sets,
        reps: typeof ex.reps === 'number' ? ex.reps.toString() : ex.reps,
        intensity: ex.weight || 'moderate',
        rest_sec: ex.rest,
        equipment: session.equipment?.[0],
        instructions: ex.notes,
      }));
      
      // Convert cooldown stretches to Stretch[] format
      const stretches: Stretch[] = session.cooldown.map((stretch, index) => ({
        stretch_id: `${session.sessionId}-cooldown-${index}`,
        name: stretch.exercise,
        target_muscle: stretch.targetMuscles?.[0] || 'general',
        duration_sec: stretch.duration * (stretch.perSide ? 2 : 1),
        instructions: stretch.instructions,
      }));
      
      return {
        workout_id: session.sessionId,
        date: new Date().toISOString().split('T')[0],
        phase: session.title,
        level: 'intermediate',
        day_of_week: session.dayOfWeek,
        exercises,
        stretches,
        estimated_duration_min: session.totalMinutes,
        // Include full session data for enhanced display
        session: session,
        programRows: data.programRows,
        wellness: data.wellness,
      };
    }
    
    // Fallback to legacy format if data.data exists (for backwards compatibility)
    return (data as any).data || data as any;
  }

  /**
   * Submit workout feedback (RPE, pain tracking, adherence)
   */
  async submitFeedback(feedback: WorkoutFeedback): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });
    return response.json();
  }

  // ============= PROGRAM MANAGEMENT (NEW API) =============

  /**
   * Create a workout program from natural language description
   * POST /api/fitness/programs/create
   * 
   * @example
   * const program = await fitnessService.createProgramFromDescription({
   *   description: "I want to focus on chest and triceps with dumbbells",
   *   difficulty: "intermediate",
   *   duration: 30,
   *   equipment: ["dumbbells"],
   *   targetMuscles: ["chest", "triceps"],
   *   daysPerWeek: 3
   * });
   */
  async createProgramFromDescription(
    request: CreateProgramRequest,
    authToken?: string
  ): Promise<CreateProgramResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('[FitnessService] Creating program with request:', JSON.stringify(request, null, 2));
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/create`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );
    const data = await response.json();
    console.log('[FitnessService] createProgramFromDescription response:', JSON.stringify(data, null, 2));
    return data;
  }

  /**
   * Generate a quick workout using the NEW /api/fitness/quick-workout endpoint
   * This is optimized for instant workout generation with intensity support
   * POST /api/fitness/quick-workout
   * 
   * @example
   * const workout = await fitnessService.generateQuickWorkout({
   *   user_id: "test_user",
   *   workout_type: "full_body",
   *   intensity: "moderate",
   *   duration: 30,
   *   equipment: ["dumbbells"],
   *   mode: "quick"
   * });
   */
  async generateQuickWorkout(
    request: QuickWorkoutRequest,
    authToken?: string
  ): Promise<QuickWorkoutResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('[FitnessService] Generating quick workout with request:', JSON.stringify(request, null, 2));
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/quick-workout`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      }
    );
    const data = await response.json();
    console.log('[FitnessService] generateQuickWorkout response:', JSON.stringify(data, null, 2));
    return data;
  }

  /**
   * Get all workouts for a program (full schedule)
   * GET /api/fitness/programs/:programId/workouts
   * 
   * @param programId - The program ID
   * @param params - Optional filter parameters (week, type, duration_max, etc.)
   * @param authToken - Optional auth token
   */
  async getProgramWorkouts(
    programId: string,
    params?: ProgramWorkoutsParams,
    authToken?: string
  ): Promise<ProgramWorkoutsResponse> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let queryString = '';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.week !== undefined) queryParams.append('week', params.week.toString());
      if (params.type) queryParams.append('type', params.type);
      if (params.is_rest_day !== undefined) queryParams.append('is_rest_day', params.is_rest_day.toString());
      if (params.duration_max !== undefined) queryParams.append('duration_max', params.duration_max.toString());
      if (params.scheduled_after) queryParams.append('scheduled_after', params.scheduled_after);
      if (params.scheduled_before) queryParams.append('scheduled_before', params.scheduled_before);
      queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}/workouts${queryString}`,
      { headers }
    );
    return response.json();
  }

  /**
   * Get specific workout day details
   * GET /api/fitness/programs/:programId/workouts/:workoutId
   */
  async getWorkoutDetails(
    programId: string,
    workoutId: string,
    authToken?: string
  ): Promise<ProgramWorkout> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}/workouts/${workoutId}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get workout details: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Complete a workout day (track progress)
   * POST /api/fitness/programs/:programId/workouts/:workoutId/complete
   */
  async completeWorkout(
    programId: string,
    workoutId: string,
    completionData: CompleteWorkoutRequest,
    authToken?: string
  ): Promise<CompleteWorkoutResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}/workouts/${workoutId}/complete`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(completionData),
      }
    );
    return response.json();
  }

  /**
   * Get calendar view for a program
   * GET /api/fitness/programs/:programId/calendar
   * 
   * Use cases:
   * - Populate monthly calendar view with workout dots
   * - Show rest days vs workout days
   * - Display completion status per day
   * - Schedule push notifications for upcoming workouts
   */
  async getProgramCalendar(
    programId: string,
    params?: CalendarParams,
    authToken?: string
  ): Promise<CalendarResponse> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let queryString = '';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.month) queryParams.append('month', params.month);
      if (params.start_date) queryParams.append('start_date', params.start_date);
      if (params.end_date) queryParams.append('end_date', params.end_date);
      queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}/calendar${queryString}`,
      { headers }
    );
    return response.json();
  }

  /**
   * List all fitness programs for a user
   * GET /api/fitness/programs?userId=
   * If userId is omitted, returns authenticated user's programs
   */
  async listPrograms(userId?: string, authToken?: string): Promise<ListProgramsResponse> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const queryString = userId ? `?userId=${userId}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs${queryString}`,
      { headers }
    );
    const data = await response.json();
    return { programs: data.programs || data.data || [] };
  }

  /**
   * Get specific program details
   */
  async getProgram(programId: string, authToken?: string): Promise<FitnessProgram> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}`,
      { headers }
    );
    const data = await response.json();
    return data.data || data;
  }

  /**
   * Create a new fitness program (legacy endpoint)
   * @deprecated Use createProgramFromDescription for natural language program creation
   */
  async createProgram(program: Partial<FitnessProgram>): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/programs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(program),
    });
    return response.json();
  }

  /**
   * Update program settings (favorite, difficulty, days per week)
   * PUT /api/fitness/programs/:programId
   */
  async updateProgram(
    programId: string,
    updates: UpdateProgramRequest,
    authToken?: string
  ): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      }
    );
    return response.json();
  }

  /**
   * Delete a fitness program
   */
  async deleteProgram(programId: string, authToken?: string): Promise<any> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/programs/${programId}`,
      {
        method: 'DELETE',
        headers,
      }
    );
    return response.json();
  }

  // ============= EXERCISE LIBRARY (ENHANCED) =============

  /**
   * Get exercise library with filtering by body part and equipment
   * GET /api/fitness/exercises?target=chest&equipment=dumbbells
   */
  async getExerciseLibrary(
    params?: ExerciseLibraryParams,
    authToken?: string
  ): Promise<ExerciseLibraryResponse> {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let queryString = '';
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.target) queryParams.append('target', params.target);
      if (params.equipment) queryParams.append('equipment', params.equipment);
      if (params.difficulty) queryParams.append('difficulty', params.difficulty);
      if (params.category) queryParams.append('category', params.category);
      queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    }

    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/exercises${queryString}`,
      { headers }
    );
    const data = await response.json();
    return {
      exercises: data.exercises || data.data || [],
      total: data.total || (data.exercises || data.data || []).length,
    };
  }

  /**
   * Get exercise library with optional filtering (legacy)
   * @deprecated Use getExerciseLibrary for enhanced filtering
   */
  async getExercises(params?: {
    muscle_group?: string;
    equipment?: string;
    difficulty?: string;
  }): Promise<Exercise[]> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/exercises${queryString}`);
    const data = await response.json();
    return data.data || [];
  }

  // ============= SESSION TRACKING =============

  /**
   * Start a new workout session
   */
  async startSession(session: {
    userId: string;
    workoutId: string;
    programId?: string;
  }): Promise<WorkoutSession> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    const data = await response.json();
    return data.data;
  }

  /**
   * Get session details
   */
  async getSession(sessionId: string): Promise<WorkoutSession> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/sessions/${sessionId}`);
    const data = await response.json();
    return data.data;
  }

  /**
   * Log exercise performance during session
   */
  async logExercise(
    sessionId: string,
    exerciseId: string,
    log: ExerciseLog
  ): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/sessions/${sessionId}/exercise/${exerciseId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      }
    );
    return response.json();
  }

  /**
   * Complete a workout session (legacy)
   * @deprecated Use completeWorkout for program-based workout completion
   */
  async completeSession(
    sessionId: string,
    feedback: {
      rpe: number;
      felt_pain: boolean;
      overall_notes?: string;
    }
  ): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/sessions/${sessionId}/complete`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedback),
      }
    );
    return response.json();
  }

  /**
   * Cancel a workout session
   */
  async cancelSession(sessionId: string): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/sessions/${sessionId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // ============= WORKOUT HISTORY =============

  /**
   * Get workout history with trends
   */
  async getHistory(userId: string, limit?: number): Promise<any> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/history/${userId}${params}`);
    return response.json();
  }

  /**
   * Get detailed workout history for a user
   * GET /api/workouts/history/:userId
   * 
   * Returns list of completed workouts with full details for coach view
   */
  async getWorkoutHistory(
    userId: string,
    options?: {
      programId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<WorkoutHistoryItem[]> {
    const params = new URLSearchParams();
    
    if (options?.programId) params.append('programId', options.programId);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', options.limit.toString());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/workouts/history/${userId}${queryString}`
    );
    const data = await response.json();
    return data.workouts || data.data || [];
  }

  /**
   * Get weekly activity summary
   * Aggregates workout data for the week starting from weekStart
   */
  async getWeeklyActivity(userId: string, weekStart: string): Promise<WeeklyActivity> {
    const workouts = await this.getWorkoutHistory(userId, {
      startDate: weekStart,
      limit: 7,
    });

    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration_minutes, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
    
    // Group by day
    const workoutsByDay = workouts.reduce((acc, workout) => {
      const day = new Date(workout.completed_at).toISOString().split('T')[0];
      if (!acc[day]) acc[day] = [];
      acc[day].push(workout);
      return acc;
    }, {} as Record<string, WorkoutHistoryItem[]>);

    return {
      total_workouts: workouts.length,
      total_minutes: totalMinutes,
      total_calories: totalCalories,
      avg_duration: workouts.length > 0 ? Math.round(totalMinutes / workouts.length) : 0,
      workouts_by_day: workoutsByDay,
    };
  }

  /**
   * Get available tracking metrics
   */
  async getMetrics(): Promise<string[]> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/metrics`);
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get injury/constraint management
   */
  async getConstraints(userId: string): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/constraints?userId=${userId}`);
    return response.json();
  }

  // ============= MUSCLE GROUPS =============

  /**
   * Get muscle group taxonomy
   */
  async getMuscleGroups(): Promise<MuscleGroup[]> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/muscle-groups`);
    const data = await response.json();
    return data.data || [];
  }

  // ============= STRETCHES =============

  /**
   * Get stretch selection API
   */
  async getStretches(params?: {
    target_muscle?: string;
    difficulty?: string;
  }): Promise<Stretch[]> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/stretches${queryString}`);
    const data = await response.json();
    return data.data || [];
  }

  /**
   * Get weekly stretch coverage analysis
   */
  async getStretchCoverage(userId: string, weekStart?: string): Promise<any> {
    const params = weekStart ? `?weekStart=${weekStart}` : '';
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/stretch-coverage?userId=${userId}${params}`
    );
    return response.json();
  }

  // ============= PROGRAM GENERATION =============

  /**
   * Generate multi-week block plan
   */
  async generateBlockPlan(params: {
    userId: string;
    weeks: number;
    goal: 'HYPERTROPHY' | 'STRENGTH' | 'ENDURANCE' | 'WEIGHT_LOSS';
    days_per_week: number;
  }): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/block-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  }

  // ============= COACH FEATURES =============

  /**
   * Assign workout plan to client
   */
  async assignPlan(plan: {
    coachId: string;
    clientId: string;
    programId: string;
  }): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan),
    });
    return response.json();
  }

  /**
   * Get client progress dashboard
   */
  async getClientDashboard(coachId: string, clientId: string): Promise<any> {
    const response = await fetchWithLogging(
      `${this.baseUrl}/api/fitness/coach/${coachId}/client/${clientId}/dashboard`
    );
    return response.json();
  }

  /**
   * Get coach overview (all clients)
   */
  async getCoachDashboard(coachId: string): Promise<any> {
    const response = await fetchWithLogging(`${this.baseUrl}/api/fitness/dashboard/${coachId}`);
    return response.json();
  }
}

export const fitnessService = new FitnessService();
