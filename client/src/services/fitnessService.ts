// Fitness API Service
// ==================
// Handles all API calls to the WIHY Fitness backend
// Based on Mobile Fitness Dashboard Enhancement Guide

import { authService } from './authService';

const API_BASE_URL = process.env.REACT_APP_SERVICES_API_URL || 'https://services.wihy.ai';

// ============================================
// Types
// ============================================

export type IntensityLevel = 'light' | 'moderate' | 'intense';
export type WorkoutType = 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'hiit' | 'strength' | 'yoga' | 'mobility' | 'pilates';
export type QuickWorkoutMode = 'quick' | 'routine' | 'train_sports';
export type QuickEquipment = 'none' | 'dumbbells' | 'bands' | 'kettlebell';
export type FitnessDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgramType = 'strength' | 'interval_cardio' | 'sport' | 'race' | 'challenge' | 'yoga' | 'pilates' | 'stretching' | 'core';
export type RaceType = 'c25k' | '5k' | '10k' | 'half_marathon' | 'marathon' | 'ironman';
export type SportType = 'cycling' | 'football' | 'soccer' | 'basketball' | 'tennis' | 'golf' | 'swimming' | 'baseball' | 'hockey' | 'volleyball' | 'boxing' | 'mma' | 'crossfit';
export type ChallengeType = '30_day_shred' | 'couch_potato_fix' | 'weight_loss_challenge' | 'plank_challenge' | 'pushup_challenge';

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

export interface CreateProgramRequest {
  userId?: string;
  description: string;
  difficulty: FitnessDifficulty;
  duration: number;
  duration_weeks?: number;
  equipment?: string[];
  targetMuscles?: string[];
  daysPerWeek?: number;
  programType?: ProgramType;
  sport?: SportType;
  raceType?: RaceType;
  challenge?: ChallengeType;
  singleWorkout?: boolean;
}

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'cardio' | 'free_weights' | 'strength_machines' | 'functional' | 'recovery';
  difficulty: 'all_levels' | 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  commonExercises: EquipmentExercise[];
  tips: string[];
  availableAt: string[];
  icon: string;
}

export interface EquipmentExercise {
  name: string;
  sets: string;
  reps: string;
  muscle: string;
  level: FitnessDifficulty | 'all_levels';
}

export interface EquipmentListResponse {
  success: boolean;
  equipment: EquipmentItem[];
  categories: {
    id: string;
    name: string;
    count: number;
  }[];
  total: number;
}

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

export interface WorkoutHistoryResponse {
  success: boolean;
  history: {
    total_workouts_completed: number;
    total_programs_completed: number;
    active_programs: number;
    total_programs: number;
    recent_completions: any[];
    programs_summary: any[];
  };
}

// ============================================
// API Functions
// ============================================

/**
 * Get authenticated headers with OAuth credentials
 */
async function getHeaders(): Promise<HeadersInit> {
  const authHeaders = authService.getAuthenticatedHeaders();
  return {
    ...authHeaders,
    'Content-Type': 'application/json'
  };
}

/**
 * Get workout options for dropdowns (workout types, intensities, durations, equipment)
 */
export async function getWorkoutOptions(): Promise<WorkoutOptions> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/workout-options`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch workout options: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.options;
}

/**
 * Generate a quick workout based on user preferences
 */
export async function generateQuickWorkout(request: QuickWorkoutRequest): Promise<QuickWorkout> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/quick-workout`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate quick workout: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to generate workout');
  }
  
  return data.workout;
}

/**
 * Create a full fitness program
 */
export async function createProgram(request: CreateProgramRequest): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/programs/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create program: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message || 'Failed to create program');
  }
  
  return data;
}

/**
 * Get all programs for a user
 */
export async function getUserPrograms(userId?: string, status?: string): Promise<UserProgramsResponse> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (status) params.append('status', status);
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/programs?${params.toString()}`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch user programs: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a specific program by ID
 */
export async function getProgram(programId: string): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/programs/${programId}`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch program: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get workouts for a program
 */
export async function getProgramWorkouts(
  programId: string, 
  options?: {
    page?: number;
    limit?: number;
    include_rest_days?: boolean;
    week?: number;
    type?: string;
    duration_max?: number;
  }
): Promise<any> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (options?.page) params.append('page', options.page.toString());
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.include_rest_days) params.append('include_rest_days', 'true');
  if (options?.week) params.append('week', options.week.toString());
  if (options?.type) params.append('type', options.type);
  if (options?.duration_max) params.append('duration_max', options.duration_max.toString());
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/programs/${programId}/workouts?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch program workouts: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a specific workout by ID
 */
export async function getWorkout(programId: string, workoutId: string): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/programs/${programId}/workouts/${workoutId}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch workout: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Complete a workout
 */
export async function completeWorkout(
  programId: string, 
  workoutId: string, 
  completionData: {
    completed_at?: string;
    duration_minutes?: number;
    exercises_completed?: any[];
    intervals_completed?: any[];
    notes?: string;
    energy_level?: string;
    calories_burned?: number;
  }
): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/programs/${programId}/workouts/${workoutId}/complete`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        completed_at: completionData.completed_at || new Date().toISOString(),
        ...completionData
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to complete workout: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get calendar view for a program
 */
export async function getProgramCalendar(
  programId: string,
  options?: { month?: string; start_date?: string; end_date?: string }
): Promise<any> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (options?.month) params.append('month', options.month);
  if (options?.start_date) params.append('start_date', options.start_date);
  if (options?.end_date) params.append('end_date', options.end_date);
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/programs/${programId}/calendar?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch calendar: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update program settings
 */
export async function updateProgram(
  programId: string,
  updates: { is_favorite?: boolean; difficulty?: FitnessDifficulty; days_per_week?: number }
): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/programs/${programId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(updates)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update program: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Delete a program
 */
export async function deleteProgram(programId: string): Promise<any> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/programs/${programId}`, {
    method: 'DELETE',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete program: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get equipment library with optional filtering
 */
export async function getEquipment(options?: {
  difficulty?: FitnessDifficulty;
  category?: string;
  muscle?: string;
}): Promise<EquipmentListResponse> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (options?.difficulty) params.append('difficulty', options.difficulty);
  if (options?.category) params.append('category', options.category);
  if (options?.muscle) params.append('muscle', options.muscle);
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/equipment?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch equipment: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get a specific equipment item by ID
 */
export async function getEquipmentById(equipmentId: string): Promise<EquipmentItem> {
  const headers = await getHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/fitness/equipment/${equipmentId}`, {
    method: 'GET',
    headers
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch equipment: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.equipment || data;
}

/**
 * Get exercises for specific equipment filtered by level
 */
export async function getEquipmentExercises(
  equipmentId: string,
  level?: FitnessDifficulty
): Promise<EquipmentExercise[]> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (level) params.append('level', level);
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/equipment/${equipmentId}/exercises?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch equipment exercises: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.exercises || data;
}

/**
 * Get workout history for a user
 */
export async function getWorkoutHistory(
  userId?: string,
  options?: { limit?: number; offset?: number; status?: string }
): Promise<WorkoutHistoryResponse> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (userId) params.append('userId', userId);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  if (options?.status) params.append('status', options.status);
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/history?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch workout history: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Get exercise library filtered by parameters
 */
export async function getExercises(options?: {
  target?: string;
  equipment?: string;
  difficulty?: FitnessDifficulty;
}): Promise<any> {
  const headers = await getHeaders();
  
  const params = new URLSearchParams();
  if (options?.target) params.append('target', options.target);
  if (options?.equipment) params.append('equipment', options.equipment);
  if (options?.difficulty) params.append('difficulty', options.difficulty);
  
  const response = await fetch(
    `${API_BASE_URL}/api/fitness/exercises?${params.toString()}`,
    { method: 'GET', headers }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to fetch exercises: ${response.statusText}`);
  }
  
  return await response.json();
}

/**
 * Update user fitness preferences (including fitness level)
 */
export async function updateUserPreferences(
  preferences: {
    fitnessLevel?: FitnessDifficulty;
    preferredEquipment?: string[];
    preferredDuration?: number;
    goals?: string[];
  },
  userId?: string
): Promise<any> {
  const headers = await getHeaders();
  
  const body: any = { ...preferences };
  if (userId) body.userId = userId;
  
  const response = await fetch(`${API_BASE_URL}/api/users/preferences`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update preferences: ${response.statusText}`);
  }
  
  return await response.json();
}

// Export as a service object for convenience
export const fitnessService = {
  getWorkoutOptions,
  generateQuickWorkout,
  createProgram,
  getUserPrograms,
  getProgram,
  getProgramWorkouts,
  getWorkout,
  completeWorkout,
  getProgramCalendar,
  updateProgram,
  deleteProgram,
  getEquipment,
  getEquipmentById,
  getEquipmentExercises,
  getWorkoutHistory,
  getExercises,
  updateUserPreferences
};

export default fitnessService;
