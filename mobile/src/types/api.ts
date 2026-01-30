/**
 * WIHY API Types
 * 
 * Complete type definitions for WIHY User & Auth API
 * Based on: WIHY User & Auth API Reference
 * 
 * Services:
 * - auth.wihy.ai: Authentication, sessions, password reset
 * - user.wihy.ai: User profiles, preferences, family, coaching, goals, wellness
 */

// ============================================
// COMMON TYPES
// ============================================

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type GoalType = 'weight_loss' | 'muscle_gain' | 'maintain' | 'improve_health' | 'increase_energy' | 'better_sleep';
export type UserRole = 'user' | 'premium' | 'family-basic' | 'family-pro' | 'coach' | 'employee' | 'admin';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';
export type AuthProvider = 'local' | 'google' | 'facebook' | 'microsoft' | 'apple';
export type PlanType = 'free' | 'starter' | 'premium' | 'pro' | 'family_basic' | 'family_premium' | 'enterprise';
export type PlanStatus = 'active' | 'trial' | 'expired' | 'cancelled';
export type FamilyRoleType = 'owner' | 'guardian' | 'member' | 'child';
export type PrivacyLevel = 'private' | 'friends' | 'public';
export type Theme = 'system' | 'light' | 'dark';
export type Platform = 'ios' | 'android' | 'web';

// ============================================
// USER TYPES
// ============================================

export interface UserCapabilities {
  maxProfiles: number;
  canScan: boolean;
  canTrackMeals: boolean;
  canAccessRecipes: boolean;
  canManageFamily: boolean;
  dailyScanLimit: number;
  meals?: boolean;
  workouts?: boolean;
  family?: boolean;
  wihyAI?: boolean;
  progressTracking?: 'none' | 'basic' | 'advanced';
  dataExport?: boolean;
}

export interface UserSettings {
  notificationsEnabled: boolean;
  privacyLevel: PrivacyLevel;
  unitsMetric: boolean;
  theme?: Theme;
  language?: string;
  timezone?: string;
  updatedAt?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email?: string;
  role: FamilyRoleType;
  avatar?: string | null;
  joinedAt?: string;
}

export interface CoachInfo {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface User {
  // Core Identity
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: AuthProvider;
  
  // Role & Status
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  
  // Profile Data
  dateOfBirth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  timezone?: string;
  goals?: GoalType[];
  
  // Health & Progress
  healthScore?: number;
  dayStreak?: number;
  streakDays?: number;
  scansCount?: number;
  memberSince?: string;
  
  // Plan & Subscription
  plan: PlanType;
  planStatus: PlanStatus;
  planExpiresAt?: string | null;
  cancelAtPeriodEnd?: boolean;
  addOns?: string[];
  capabilities: UserCapabilities;
  
  // Family
  familyId?: string | null;
  familyName?: string | null;
  familyRole?: FamilyRoleType | null;
  guardianCode?: string | null;
  familyMembers?: FamilyMember[];
  
  // Coaching
  coachId?: string | null;
  coachName?: string | null;
  isCoach?: boolean;
  coachCode?: string | null;
  coachProfileId?: string | null;
  clientCount?: number;
  clients?: CoachInfo[];
  
  // Settings & Preferences
  settings?: UserSettings;
  
  // Metadata
  lastLogin?: string;
  createdAt: string;
  
  // Legacy/Additional
  profile?: any;
  profile_data?: any;
}

// ============================================
// AUTH TYPES
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  terms_accepted: boolean;
  date_of_birth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activity_level?: ActivityLevel;
  goals?: GoalType[];
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export interface VerifyTokenResponse {
  valid: boolean;
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    status: UserStatus;
  };
  tokenValid: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  data?: {
    token: string;
    expiresIn: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface SessionResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      email: string;
    };
    expiresAt: string;
  };
}

export interface ProvidersResponse {
  success: boolean;
  data?: {
    oauth: string[];
  };
}

// ============================================
// PROFILE TYPES
// ============================================

export interface UpdateProfileRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  timezone?: string;
  goals?: GoalType[];
  healthScore?: number;
  dayStreak?: number;
  scansCount?: number;
  isDeveloper?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UploadAvatarRequest {
  avatarUrl?: string;
  avatarBase64?: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface UpdateSettingsRequest {
  notificationsEnabled?: boolean;
  privacyLevel?: PrivacyLevel;
  unitsMetric?: boolean;
  theme?: Theme;
  language?: string;
  timezone?: string;
}

export interface ToggleNotificationsRequest {
  enabled: boolean;
}

export interface UpdatePrivacyRequest {
  level: PrivacyLevel;
}

// ============================================
// PREFERENCES TYPES
// ============================================

export interface UserPreferences {
  notifications_enabled: boolean;
  privacy_level: PrivacyLevel;
  units_metric: boolean;
  theme: Theme;
  language: string;
  timezone: string;
  updated_at: string;
}

export interface UpdatePreferencesRequest {
  notifications_enabled?: boolean;
  privacy_level?: PrivacyLevel;
  units_metric?: boolean;
  theme?: Theme;
  language?: string;
  timezone?: string;
}

// ============================================
// PERMISSIONS TYPES
// ============================================

export interface UserPermissions {
  max_sessions: number;
  ai_conversations: number;
  export_data: boolean;
  priority_support: boolean;
  custom_branding: boolean;
  plan: PlanType;
  is_active: boolean;
  role: UserRole;
}

// ============================================
// SHOPPING PREFERENCES TYPES
// ============================================

export type BudgetPreference = 'budget' | 'moderate' | 'premium';
export type OrganicPreference = 'always' | 'when_possible' | 'never';
export type DeliveryPreference = 'asap' | 'scheduled' | 'pickup';

export interface BrandPreferences {
  [category: string]: string;
}

export interface ShoppingPreferences {
  user_id: string;
  preferred_stores?: string[];
  budget_preference?: BudgetPreference;
  organic_preference?: OrganicPreference;
  brand_preferences?: BrandPreferences;
  default_postal_code?: string;
  delivery_preference?: DeliveryPreference;
  updated_at?: string;
}

export interface SaveShoppingPreferencesRequest {
  userId: string;
  preferred_stores?: string[];
  budget_preference?: BudgetPreference;
  organic_preference?: OrganicPreference;
  brand_preferences?: BrandPreferences;
  default_postal_code?: string;
  delivery_preference?: DeliveryPreference;
}

// ============================================
// FAMILY TYPES
// ============================================

export interface Family {
  id: string;
  name: string;
  guardianCode: string;
  inviteCode?: string;
  plan: PlanType;
  maxMembers: number;
  role: FamilyRoleType;
  members: FamilyMember[];
  memberCount: number;
  createdAt: string;
}

export interface CreateFamilyRequest {
  name: string;
}

export interface JoinFamilyRequest {
  guardianCode: string;
  role?: 'member' | 'child';
}

export interface AddFamilyMemberRequest {
  targetUserId: string;
  role: FamilyRoleType;
}

export interface UpdateFamilyRequest {
  name: string;
}

// ============================================
// COACHING TYPES
// ============================================

export interface Location {
  city?: string;
  state?: string;
  country?: string;
}

export interface Rates {
  session_rate?: number;
  currency?: string;
}

export interface CreateCoachRequest {
  name: string;
  specialty: string;
  title?: string;
  bio?: string;
  location?: Location;
  phone?: string;
  rates?: Rates;
  credentials?: string;
  experience_years?: number;
  avatar_url?: string;
}

export interface Coach {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  specialties: string[];
  certifications?: string[];
  years_experience?: number;
  session_rate?: number;
  currency?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  profile_complete: boolean;
  accepting_clients: boolean;
  rating?: number;
  review_count?: number;
  clients_count?: number;
  avatar?: string;
  created_at: string;
}

export interface CoachFilters {
  search?: string;
  specialty?: string;
  location?: string;
  min_rating?: number;
  max_price?: number;
  accepting_clients?: boolean;
  sort?: 'rating' | 'price' | 'experience';
  page?: number;
  limit?: number;
}

export interface CoachesDiscoverResponse {
  success: boolean;
  data?: {
    coaches: Coach[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface UpdateCoachProfileRequest {
  bio?: string;
  hourly_rate?: number;
  accepting_clients?: boolean;
  specialty?: string;
  title?: string;
  phone?: string;
  location?: Location;
  credentials?: string;
  experience_years?: number;
}

export interface CoachOverview {
  activeClients: number;
  pendingRequests: number;
  upcomingSessions: number;
  monthlyRevenue: number;
  rating: number;
}

export interface CoachClient {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  startDate: string;
  lastSession?: string;
  avatar?: string;
}

export interface AddClientRequest {
  client_id: string;
  program?: string;
  notes?: string;
}

export interface UpdateClientStatusRequest {
  status: 'active' | 'paused' | 'completed';
  reason?: string;
}

export interface AssignProgramRequest {
  program_id: string;
  start_date: string;
  custom_settings?: any;
}

export interface BookingRequest {
  date: string;
  time: string;
  duration_minutes: number;
  session_type: string;
  notes?: string;
}

export interface BookingResponse {
  booking_id: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

export interface ReviewRequest {
  rating: number;
  title: string;
  content: string;
}

export interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  clientName: string;
  date: string;
}

// ============================================
// GOALS TYPES
// ============================================

export type GoalStatus = 'active' | 'completed' | 'abandoned';
export type GoalCategory = 'health' | 'fitness' | 'nutrition' | 'wellness' | 'weight';

export interface CreateGoalRequest {
  user_id: string;
  type: GoalType;
  title: string;
  target_value: number;
  target_date?: string;
  category?: GoalCategory;
  initial_value?: number;
}

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType;
  title: string;
  target_value: number;
  current_value: number;
  initial_value?: number;
  progress_percent: number;
  status: GoalStatus;
  target_date?: string;
  category?: GoalCategory;
  created_at: string;
  completed_at?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  target_value?: number;
  target_date?: string;
}

export interface LogGoalProgressRequest {
  value: number;
  date?: string;
  notes?: string;
}

export interface GoalProgressResponse {
  progress_id: string;
  new_value: number;
  progress_percent: number;
}

export interface CompleteGoalRequest {
  completion_notes?: string;
  achievement_unlock?: boolean;
}

export interface GoalStats {
  total_goals: number;
  active_goals: number;
  completed_goals: number;
  abandoned_goals: number;
  completion_rate: number;
  current_streak: number;
}

// ============================================
// PROGRESS TYPES
// ============================================

export type PhotoType = 'front' | 'side' | 'back';
export type MeasurementType = 'weight' | 'waist' | 'chest' | 'hips' | 'arms' | 'thighs' | 'body_fat';
export type MeasurementUnit = 'kg' | 'lbs' | 'cm' | 'inches' | 'percent';

export interface UploadProgressPhotoRequest {
  user_id: string;
  type: PhotoType;
  date?: string;
  notes?: string;
  photo_url: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  type: PhotoType;
  url: string;
  date: string;
  notes?: string;
  created_at: string;
}

export interface PhotoComparison {
  before: {
    url: string;
    date: string;
  };
  after: {
    url: string;
    date: string;
  };
  days_between: number;
}

export interface LogMeasurementRequest {
  user_id: string;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  date?: string;
}

export interface Measurement {
  id: string;
  user_id: string;
  type: MeasurementType;
  value: number;
  unit: MeasurementUnit;
  date: string;
  created_at: string;
}

// ============================================
// WELLNESS TYPES
// ============================================

export interface WellnessLog {
  userId: string;
  date: string;
  sleepHours?: number;
  steps?: number;
  mood?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  hydrationCups?: number;
  weightKg?: number;
}

export interface WellnessMetricScore {
  average: number;
  score: number;
}

export interface WellnessSummary {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  metrics: {
    sleep?: WellnessMetricScore;
    activity?: WellnessMetricScore;
    hydration?: WellnessMetricScore;
    [key: string]: WellnessMetricScore | undefined;
  };
  recommendations: string[];
}

export interface WellnessSummaryResponse {
  success: boolean;
  summary: WellnessSummary;
  logsAnalyzed: number;
  dateRange: {
    from: string;
    to: string;
  };
}

// ============================================
// NOTIFICATIONS TYPES
// ============================================

export interface RegisterPushTokenRequest {
  user_id: string;
  token: string;
  platform: Platform;
}

export interface DeactivatePushTokenRequest {
  token: string;
}

export interface NotificationPreferences {
  meal_reminders: boolean;
  meal_reminder_time?: string;
  water_reminders: boolean;
  water_reminder_frequency?: number;
  workout_reminders: boolean;
  workout_reminder_time?: string;
  goal_updates: boolean;
  weekly_summary: boolean;
  marketing: boolean;
}

export interface UpdateNotificationPreferencesRequest extends Partial<NotificationPreferences> {
  user_id: string;
}

export interface CreateReminderRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  days: string[];
  enabled: boolean;
}

export interface Reminder {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  days: string[];
  enabled: boolean;
  created_at: string;
}

export interface UpdateReminderRequest {
  user_id: string;
  time?: string;
  enabled?: boolean;
  title?: string;
  message?: string;
  days?: string[];
}

// ============================================
// GLOBAL GOALS TYPES
// ============================================

export interface GlobalGoalStats {
  total_participants: number;
  goals_completed: number;
  average_progress: number;
  top_goal_types: GoalType[];
}

export interface UserRanking {
  rank: number;
  total_participants: number;
  percentile: number;
  user_progress: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  progress: number;
  avatar?: string;
}

export interface Leaderboard {
  leaderboard: LeaderboardEntry[];
  user_position: {
    rank: number;
    progress: number;
  };
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  participants: number;
  prize?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  user?: T;
  profile?: T;
  preferences?: T;
  settings?: T;
  family?: T;
  coach?: T;
  coaches?: T;
  goals?: T;
  goal?: T;
  wellness?: T;
  summary?: T;
  logs?: T;
  photos?: T;
  measurements?: T;
  notifications?: T;
  reminders?: T;
  stats?: T;
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  count: number;
}
