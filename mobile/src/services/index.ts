// Export all services
export { scanService } from './scanService';
export { chatService } from './chatService';
export { fdaService } from './fdaService';
export { authService } from './authService';
export { userService } from './userService'; // NEW: User management (user.wihy.ai)
export { enhancedAuthService } from './enhancedAuthService';
export { enhancedScanService } from './enhancedScanService';
export { purchaseService } from './purchaseService'; // IAP service - handles platform detection internally
export type { IAPItemDetails, InAppPurchase } from './purchaseService';
export { ghlService } from './ghlService';
export { profileService } from './profileService';

// NEW: Unified API Client with automatic authentication
export { apiClient, authenticatedFetch, getAuthorizationHeaders, ApiError } from './apiClient';
export type { WihyService, HttpMethod, ApiRequestOptions, ApiResponse } from './apiClient';

// NEW: Export WIHY API Service
export { wihyApiService, WIHYApiService } from './wihyApiService';

// NEW: Export Dopamine & Behavioral Tracking Service
export { dopamineService, DopamineService } from './dopamineService';

// NEW: Export backend-connected services
export { fitnessService } from './fitnessService';
export { nutritionService } from './nutritionService';
export { mealService } from './mealService';
export { shoppingService } from './shoppingService';
export { coachService } from './coachService';
export { familyService } from './familyService';
export { paymentService } from './paymentService';
export { weatherService } from './weatherService';
export { researchService } from './researchService';
export { notificationService } from './notificationService';
export { debugLogService } from './debugLogService';
export { consumptionService } from './consumptionService';

// NEW: Export Wellness Service (user.wihy.ai)
export { wellnessService, WellnessService } from './wellnessService';

// NEW: Export Progress Service (user.wihy.ai/api/progress)
export { progressService } from './progressService';
export type {
  ProgressCard,
  ProgressSummary,
  WeightData,
  WeightEntry,
  ActionItem,
  ActionsSummary,
  Recommendation,
  HydrationData,
  MacrosData,
  StreaksData,
  MeasurementsData,
  GoalsData,
  DashboardData,
} from './progressService';

// NEW: Export Checkout & Subscription Services
export { checkoutService, WIHY_PLANS } from './checkoutService';
export type { Plan, CheckoutResult, PaymentStatus } from './checkoutService';

// NEW: Export Subscription Service (payment.wihy.ai)
export { subscriptionService } from './subscriptionService';
export type {
  PlanId,
  AddOnId,
  SubscriptionPlan,
  AddOn,
  CheckoutSession,
  ActiveSubscription,
  SubscriptionAddon,
  UpgradeOption,
} from './subscriptionService';

// NEW: Export Apple Sign-In Service
export { appleAuthService } from './appleAuthService';
export type { AppleAuthResult } from './appleAuthService';

// NEW: Export Offline-First Architecture Services (services.wihy.ai)
export { mealProgramService } from './mealProgramService';
export { workoutLogService } from './workoutLogService';
export { combinedProgramService } from './combinedProgramService';

// NEW: Export Health Tracking Client Services (services.wihy.ai)
export { servicesApi } from './servicesApiClient';
export { userApi } from './userApiClient';
export { goalsService } from './goalsService';
export { progressService } from './progressTrackingService';
export { remindersService } from './remindersService';
export { scanHistoryService } from './scanHistoryService';
export { uploadService } from './uploadService';
export { shoppingPreferencesService } from './shoppingPreferencesService';

// NEW: Export Client Data Service (user.wihy.ai/api/client-data)
export { clientDataService } from './clientDataService';
export type { 
  ClientDataNamespace, 
  UserLinks, 
  FeatureFlags, 
  SessionData, 
  UserPreferences,
  SetValueOptions,
} from './clientDataService';

// NEW: Export Additional Feature Services (January 7, 2026)
export { messagingService } from './messagingService';
export { achievementService } from './achievementService';
export { calendarService } from './calendarService';
export { journalService } from './journalService';
export { favoritesService } from './favoritesService';

// NEW: Export Meal Diary & Shopping List Services (January 10, 2026)
export { 
  MealDiaryAPI, 
  getMealDiaryService, 
  createMealDiaryService,
  type Meal,
  type DietaryPreferences,
  type MealDiaryResponse,
  type CreateMealRequest,
} from './mealDiary';

export { 
  ShoppingListAPI, 
  getShoppingListService, 
  createShoppingListService,
  type GenerateFromMealPlanRequest,
} from './shoppingList';
export { reviewService } from './reviewService';
export { dataExportService } from './dataExportService';

// Export error handling
export { 
  WIHYError, 
  WIHYErrorCode,
  createErrorFromResponse,
  createNetworkError,
  createImageError,
  createTimeoutError,
} from './errors';

// Export types
export type {
  ProductInfo,
  NutritionData,
  HealthAlert,
  HealthAnalysis,
  ScanMetadata,
  BarcodeScanResult,
  ImageScanResult,
  ChatResponse,
  IngredientAnalysis,
} from './types';

// NEW: Export service-specific types
export type {
  FitnessProfile,
  FitnessProgram,
  WorkoutSession,
  DailyWorkout,
  Exercise,
  Stretch,
  MuscleGroup,
  // New API types
  CreateProgramRequest,
  CreateProgramResponse,
  ProgramWorkout,
  ProgramExercise,
  ProgramProgress,
  CompleteWorkoutRequest,
  CompleteWorkoutResponse,
  CalendarResponse,
  CalendarDay,
  ExerciseLibraryResponse,
  LibraryExercise,
  ListProgramsResponse,
  SavedProgram,
  // Today's Workout API types
  TodayWorkoutSession,
  TodayWorkoutResponse,
  WarmupExercise,
  MainExercise,
  CooldownStretch,
  ProgramRow,
  WellnessMetrics,
  // Workout history types (for coach view)
  WorkoutHistoryItem,
  WeeklyActivity,
  // Quick Workout API types (NEW!)
  QuickWorkoutRequest,
  QuickWorkoutResponse,
  QuickWorkout,
  QuickWorkoutSegment,
  QuickWorkoutExercise,
  QuickWorkoutIntensity,
} from './fitnessService';

export type {
  MealLog,
  NutritionGoals,
  DailySummary,
  WeeklyTrends,
} from './nutritionService';

export type {
  MealProgram,
  Recipe,
  DietType,
  RecipeDifficulty,
  MealType,
  PlanningFocus,
  CookingSkillLevel,
  MealVariety,
  TimePerMeal,
  MealPlanningPreferences,
  CreateMealPlanRequest,
  PlanMeal,
  PlanDay,
  MealPlanResponse,
  MealCalendarResponse,
  CalendarDay as MealCalendarDay,
  CalendarSummary,
  MealTemplate,
  MealIngredient,
  ScannedRecipe,
  ShoppingListItem as MealShoppingListItem,
  ShoppingList as MealShoppingList,
  SavedMeal,
  QuickTemplatePreset,
  // Progressive Enhancement Types (NEW!)
  EnhancementLevel,
  AvailableStore,
  EnhancedIngredient,
  ShoppingData,
  NextStepAction,
  EnhancedMealPlanResponse,
  ShoppingSetupRequest,
  UserShoppingPreferences,
} from './mealService';

export { QUICK_TEMPLATE_PRESETS } from './mealService';

export type {
  ShoppingList,
  ShoppingListItem,
  ShoppingListStatus,
} from './shoppingService';

export type {
  CoachInvitation,
  CoachingRelationship,
  Client,
  ClientDashboard,
  CoachOverview,
  InvitationStatus,
  RelationshipStatus,
  MealProgramAssignment,
  WorkoutProgramAssignment,
  CreateMealPlanParams,
  CreateWorkoutPlanParams,
  APIClient,
  NoteCategory,
  ClientNote,
} from './coachService';

export type {
  Family,
  FamilyMember,
  FamilyRole,
  FamilyInvite,
  SharedItem,
  ShareType,
  SharePermission,
  FamilyMealPlan,
  FamilyWorkout,
  FamilyShoppingList,
  FamilyDashboard,
  InviteStatus,
} from './familyService';

export type {
  UserProfile,
  AppPreferences,
  NotificationSettings,
  ScanSettings,
  PrivacySettings,
  PermissionStates,
  DevSettings,
  AdminSettings,
  HealthIntegrationSettings,
  SecuritySettings,
  ProfileSettings,
  DeviceInfo,
} from './profileService';

export type {
  WeatherData,
  ForecastDay,
  WeatherLocation,
} from './weatherService';

export type {
  ResearchArticle,
  ResearchSearchParams,
  ResearchCategory,
  ResearchDashboardStats,
  ResearchBookmark,
  SearchHistoryItem,
  ReadingListItem,
} from './researchService';

export type {
  NotificationPermissionStatus,
  ScheduledNotification,
  NotificationHandler,
  BackendReminder,
  BackendRemindersResponse,
  NotificationPreferences,
  QuietHours,
} from './notificationService';

export type {
  DebugLog,
} from './debugLogService';

// Consumption Service types
export type {
  NutritionData as ConsumptionNutritionData,
  NutritionGoals as ConsumptionNutritionGoals,
  NutritionProgress,
  MealType as ConsumptionMealType,
  MealSource,
  MealLog as ConsumptionMealLog,
  MealTypeBreakdown,
  SourceBreakdown,
  WaterLog,
  ContainerType,
  WaterData,
  DashboardSummary,
  ConsumptionTrends,
  NutritionRecommendation,
  DashboardData,
  PendingMeal,
  PendingMealStatus,
  SkipReason,
  DailySummary as ConsumptionDailySummary,
  TopFood,
  WeeklySummaryData,
  HistoryLog,
  Pagination,
  DashboardParams,
  LogMealRequest,
  LogFromScanRequest,
  LogFromRecipeRequest,
  LogFromShoppingRequest,
  ConfirmMealRequest,
  SkipMealRequest,
  LogWaterRequest,
  UpdateLogRequest,
  HistoryParams,
  LogMealResponse,
  LogFromSourceResponse,
  LogFromShoppingResponse,
  ConfirmMealResponse,
  SkipMealResponse,
  LogWaterResponse,
  UpdateLogResponse,
  HistoryResponse,
} from './consumptionService';
export { WATER_PRESETS } from './consumptionService';

// Export auth types
export type {
  UserData,
  LoginResponse,
  TokenResponse,
  RegistrationOptions,
} from './authService';

export type {
  BiometricCapability,
  AuthEnhancements,
} from './enhancedAuthService';

// Export config
export { API_CONFIG, AUTH_CONFIG } from './config';

// Export Dopamine & Behavioral Tracking types
export type {
  PresenceLevel,
  ConnectionLevel,
  QuadrantName,
  DeviceType,
  AppCategory,
  InteractionIntensity,
  EatingContext,
  TriggerType,
  DistractionSource,
  ResistanceLevel,
  EatingState,
  TimePeriod,
  HealthIndicator,
  PresenceStateAssessment,
  PresenceStateResult,
  QuadrantInsights,
  ScreenTimeLog,
  DistractionPattern,
  FoodIntakeBehavioral,
  DopaminePieChartData,
  PieChartDetails,
  QuadrantDetail,
  ChartConfig,
  DopamineAnalysis,
  ScreenTimeSummary,
  EatingBehaviorSummary,
  QuadrantCount,
  PieChartSimulationParams,
} from './dopamineService';

// ============================================
// OFFLINE-FIRST INFRASTRUCTURE
// ============================================

// Storage
export { storageService } from './storage/storageService';

// Connectivity
export { connectivityService } from './connectivity/connectivityService';
export type { ConnectivityInfo, ConnectivityListener } from './connectivity/connectivityService';

// Sync Engine
export { syncEngine } from './sync/syncEngine';
export type { SyncQueueItem, SyncStatus, SyncPriority, SyncOperation } from './sync/syncEngine';

// Goals Dashboard (Offline-First)
export { goalsDashboardService } from './goalsDashboardService';
export type { GoalId, GoalCard, GoalsDashboardData } from './goalsDashboardService';

// Global Goals (Cache-First)
export { globalGoalsService } from './globalGoalsService';
export type { GlobalGoalStats, UserGoalRanking, GlobalLeaderboard, CommunityChallenge, GoalType } from './globalGoalsService';

// Combined Programs (Backend API)
export type {
  CombinedGoal,
  CombinedProgram,
  CombinedProgramConfig,
  CombinedProgramOptions,
  CombinedDashboardView,
  UserProfile as CombinedUserProfile,
  SyncOptions,
  WorkoutDay,
  SyncedMealDay,
  PostWorkoutCombo,
  PostWorkoutMealSuggestion,
  Recommendation,
} from './combinedProgramService';

// Shopping Preferences (user.wihy.ai)
export type {
  BudgetPreference,
  OrganicPreference,
  DeliveryPreference,
  PreferredStore,
  BrandPreferences,
  ShoppingPreferences,
  SavePreferencesRequest,
} from './shoppingPreferencesService';

// Export all API types from centralized types/api.ts
export type {
  // Core types
  ActivityLevel,
  Gender,
  GoalType,
  UserRole,
  UserStatus,
  AuthProvider,
  PlanType,
  PlanStatus,
  FamilyRoleType,
  PrivacyLevel,
  Theme,
  Platform,
  
  // User types
  UserCapabilities,
  UserSettings,
  User,
  
  // Auth types
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  VerifyTokenResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  SessionResponse,
  ProvidersResponse,
  
  // Profile types
  UpdateProfileRequest,
  ChangePasswordRequest,
  UploadAvatarRequest,
  
  // Settings types
  UpdateSettingsRequest,
  ToggleNotificationsRequest,
  UpdatePrivacyRequest,
  
  // Preferences types
  UserPreferences,
  UpdatePreferencesRequest,
  
  // Permissions types
  UserPermissions,
  
  // Shopping types
  SaveShoppingPreferencesRequest as SaveShoppingPreferencesApiRequest,
  
  // Family types
  Family,
  FamilyMember,
  CreateFamilyRequest,
  JoinFamilyRequest,
  AddFamilyMemberRequest,
  UpdateFamilyRequest,
  
  // Coaching types
  Location,
  Rates,
  CreateCoachRequest,
  Coach,
  CoachFilters,
  CoachesDiscoverResponse,
  UpdateCoachProfileRequest,
  CoachOverview,
  CoachClient,
  AddClientRequest,
  UpdateClientStatusRequest,
  AssignProgramRequest,
  BookingRequest,
  BookingResponse,
  ReviewRequest,
  Review,
  
  // Goals types
  GoalStatus,
  GoalCategory,
  CreateGoalRequest,
  Goal,
  UpdateGoalRequest,
  LogGoalProgressRequest,
  GoalProgressResponse,
  CompleteGoalRequest,
  GoalStats,
  
  // Progress types
  PhotoType,
  MeasurementType,
  MeasurementUnit,
  UploadProgressPhotoRequest,
  ProgressPhoto,
  PhotoComparison,
  LogMeasurementRequest,
  Measurement,
  
  // Wellness types
  WellnessLog,
  WellnessMetricScore,
  WellnessSummary,
  WellnessSummaryResponse,
  
  // Notifications types
  RegisterPushTokenRequest,
  DeactivatePushTokenRequest,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
  CreateReminderRequest,
  Reminder,
  UpdateReminderRequest,
  
  // Global Goals types
  GlobalGoalStats,
  UserRanking,
  LeaderboardEntry,
  Leaderboard,
  Challenge,
  
  // API Response types
  ApiResponse as ApiResponseType,
  PaginatedResponse,
  ListResponse,
} from '../types/api';

// Initialize all services
export async function initializeServices(): Promise<void> {
  const { storageService } = await import('./storage/storageService');
  const { connectivityService } = await import('./connectivity/connectivityService');
  const { syncEngine } = await import('./sync/syncEngine');

  await storageService.initialize();
  await connectivityService.initialize();
  await syncEngine.initialize();

  console.log('[Services] All services initialized');
}
