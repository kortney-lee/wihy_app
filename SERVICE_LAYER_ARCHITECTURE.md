# Service Layer Architecture

## Overview
This document outlines the comprehensive service layer required to support the coach/client management system based on the analyzed pages and components.

## Core Service Interfaces

### 1. **RelationshipService**
Manages coach-client relationships, invitations, and connections.

```typescript
interface RelationshipService {
  // Coach-Client Relationships
  getCoachClients(coachId: string): Promise<Client[]>;
  addNewClient(client: ClientProfile): Promise<Client>;
  updateClientStatus(clientId: string, status: ClientStatus): Promise<void>;
  removeClient(clientId: string): Promise<void>;
  assignCoachToClient(coachId: string, clientId: string): Promise<void>;
  
  // Coach Discovery & Search
  searchCoaches(filters: CoachSearchFilters): Promise<Coach[]>;
  getCoachProfile(coachId: string): Promise<Coach>;
  getCoachAvailability(coachId: string): Promise<AvailabilitySlot[]>;
  
  // Invitation Management
  sendCoachInvitation(invitation: CoachInvitation): Promise<void>;
  acceptCoachInvitation(invitationId: string): Promise<void>;
  declineCoachInvitation(invitationId: string): Promise<void>;
  getPendingInvitations(userId: string): Promise<PendingInvitation[]>;
  getInvitationHistory(userId: string): Promise<InvitationHistory[]>;
  
  // Relationship Status
  getActiveCoachForClient(clientId: string): Promise<Coach | null>;
  getClientCountForCoach(coachId: string): Promise<number>;
  isCoachClientPaired(coachId: string, clientId: string): Promise<boolean>;
}
```

### 2. **ProfileService**
Handles user profile management, onboarding, and personal information.

```typescript
interface ProfileService {
  // Client Profile Management
  createClientProfile(profile: ClientProfile): Promise<string>;
  getClientProfile(clientId: string): Promise<ClientProfile>;
  updateClientProfile(clientId: string, updates: Partial<ClientProfile>): Promise<void>;
  deleteClientProfile(clientId: string): Promise<void>;
  
  // Coach Profile Management
  getCoachProfile(coachId: string): Promise<CoachProfile>;
  updateCoachProfile(coachId: string, updates: Partial<CoachProfile>): Promise<void>;
  setCoachAvailability(coachId: string, availability: AvailabilitySchedule): Promise<void>;
  updateCoachSpecialties(coachId: string, specialties: string[]): Promise<void>;
  
  // Onboarding Process
  startOnboarding(userId: string): Promise<OnboardingSession>;
  saveOnboardingStep(sessionId: string, stepData: OnboardingStepData): Promise<void>;
  completeOnboarding(sessionId: string, profile: ClientProfile): Promise<void>;
  getOnboardingProgress(userId: string): Promise<OnboardingProgress>;
  
  // Personal Information
  updatePersonalInfo(userId: string, info: PersonalInfo): Promise<void>;
  uploadProfileImage(userId: string, imageFile: File): Promise<string>;
  updateGoals(userId: string, goals: Goal[]): Promise<void>;
}
```

### 3. **MealPlanService**
Comprehensive meal planning, nutrition management, and shopping list generation.

```typescript
interface MealPlanService {
  // Meal Plan Management
  createMealPlan(coachId: string, clientId: string, plan: CoachMealProgram): Promise<string>;
  getMealPlan(planId: string): Promise<CoachMealProgram>;
  getClientMealPlans(clientId: string): Promise<CoachMealProgram[]>;
  updateMealPlan(planId: string, updates: Partial<CoachMealProgram>): Promise<void>;
  deleteMealPlan(planId: string): Promise<void>;
  duplicateMealPlan(planId: string, newClientId?: string): Promise<string>;
  
  // Meal Management
  addMealToDay(planId: string, dayId: string, mealType: MealType, meal: CoachMealItem): Promise<void>;
  removeMealFromDay(planId: string, dayId: string, mealType: MealType, mealId: string): Promise<void>;
  updateMealInDay(planId: string, dayId: string, mealType: MealType, mealId: string, updates: Partial<CoachMealItem>): Promise<void>;
  
  // Shopping List Management
  generateShoppingList(planId: string): Promise<CoachShoppingListItem[]>;
  updateShoppingList(planId: string, items: CoachShoppingListItem[]): Promise<void>;
  categorizeShoppingItems(items: string[]): Promise<CoachShoppingListItem[]>;
  
  // Nutrition Analysis
  analyzeMealNutrition(meal: CoachMealItem): Promise<NutritionAnalysis>;
  analyzeDayNutrition(dayMeals: Partial<Record<MealType, CoachMealItem[]>>): Promise<NutritionAnalysis>;
  analyzePlanNutrition(planId: string): Promise<NutritionAnalysis>;
  
  // Diet Goal Support
  applyDietGoalConstraints(planId: string, dietGoals: DietGoalKey[]): Promise<void>;
  validatePlanAgainstDietGoals(planId: string, dietGoals: DietGoalKey[]): Promise<ValidationResult>;
  suggestMealsForDietGoal(dietGoal: DietGoalKey, restrictions: string[]): Promise<CoachMealItem[]>;
  
  // External Integrations
  generateInstacartLink(shoppingList: CoachShoppingListItem[]): Promise<string>;
  searchFoodDatabase(query: string): Promise<FoodItem[]>;
  importRecipeFromUrl(url: string): Promise<CoachMealItem>;
}
```

### 4. **WorkoutService**
Workout program management, exercise library, and fitness planning.

```typescript
interface WorkoutService {
  // Workout Program Management
  createWorkoutProgram(coachId: string, clientId: string, program: CoachWorkoutProgram): Promise<string>;
  getWorkoutProgram(programId: string): Promise<CoachWorkoutProgram>;
  getClientWorkoutPrograms(clientId: string): Promise<CoachWorkoutProgram[]>;
  updateWorkoutProgram(programId: string, updates: Partial<CoachWorkoutProgram>): Promise<void>;
  deleteWorkoutProgram(programId: string): Promise<void>;
  
  // Exercise Library
  getExercises(filters?: ExerciseFilters): Promise<Exercise[]>;
  getExerciseById(exerciseId: string): Promise<Exercise>;
  createCustomExercise(exercise: Exercise): Promise<string>;
  searchExercises(query: string): Promise<Exercise[]>;
  getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  getExercisesByEquipment(equipment: string): Promise<Exercise[]>;
  
  // Workout Structure
  addPhaseToProgram(programId: string, phase: CoachWorkoutPhase): Promise<void>;
  addLevelToPhase(programId: string, phaseId: string, level: CoachWorkoutLevel): Promise<void>;
  addDayToLevel(programId: string, phaseId: string, levelId: string, day: CoachWorkoutDay): Promise<void>;
  addExerciseToDay(programId: string, dayId: string, exercise: ExerciseRowView): Promise<void>;
  
  // Program Templates
  getWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  createProgramFromTemplate(templateId: string, clientId: string, customizations: ProgramCustomizations): Promise<string>;
  saveAsTemplate(programId: string, templateName: string): Promise<string>;
  
  // Progress & Analytics
  trackWorkoutCompletion(clientId: string, workoutId: string, completion: WorkoutCompletion): Promise<void>;
  getWorkoutProgress(clientId: string, programId: string): Promise<WorkoutProgress>;
  generateProgressReport(clientId: string, dateRange: DateRange): Promise<WorkoutProgressReport>;
}
```

### 5. **ProgressService**
Client progress tracking, analytics, and goal management.

```typescript
interface ProgressService {
  // Progress Tracking
  getClientProgress(clientId: string): Promise<ProgressData>;
  updateProgress(clientId: string, progress: ProgressUpdate): Promise<void>;
  getProgressHistory(clientId: string, dateRange: DateRange): Promise<ProgressHistory[]>;
  
  // Goal Management
  setGoals(clientId: string, goals: Goal[]): Promise<void>;
  updateGoalProgress(clientId: string, goalId: string, progress: number): Promise<void>;
  getGoalProgress(clientId: string): Promise<GoalProgress[]>;
  completeGoal(clientId: string, goalId: string): Promise<void>;
  
  // Metrics & Analytics
  getProgressCharts(clientId: string): Promise<ChartData[]>;
  getProgressSummary(clientId: string): Promise<ProgressSummary>;
  calculateProgressScore(clientId: string): Promise<number>;
  
  // Streaks & Habits
  getStreaks(clientId: string): Promise<Streak[]>;
  updateHabitTracking(clientId: string, habits: HabitUpdate[]): Promise<void>;
  getHabitProgress(clientId: string): Promise<HabitProgress[]>;
  
  // Comparative Analytics
  getCoachClientProgress(coachId: string): Promise<ClientProgressSummary[]>;
  generateProgressReport(clientId: string, reportType: ReportType): Promise<ProgressReport>;
  exportProgressData(clientId: string, format: 'pdf' | 'csv'): Promise<Blob>;
}
```

### 6. **ActionService**
Task and action management for client accountability and engagement.

```typescript
interface ActionService {
  // Action Management
  createAction(clientId: string, action: Action): Promise<string>;
  getClientActions(clientId: string, status?: ActionStatus): Promise<Action[]>;
  updateActionStatus(actionId: string, status: ActionStatus): Promise<void>;
  updateAction(actionId: string, updates: Partial<Action>): Promise<void>;
  deleteAction(actionId: string): Promise<void>;
  
  // Bulk Operations
  createBulkActions(clientId: string, actions: Action[]): Promise<string[]>;
  updateBulkActionStatus(actionIds: string[], status: ActionStatus): Promise<void>;
  
  // Priority Management
  setClientPriorities(clientId: string, priorities: Priority[]): Promise<void>;
  updatePriorities(clientId: string, priorities: Priority[]): Promise<void>;
  getClientPriorities(clientId: string): Promise<Priority[]>;
  
  // Action Templates
  getActionTemplates(actionType?: ActionType): Promise<ActionTemplate[]>;
  createActionFromTemplate(clientId: string, templateId: string, customizations?: ActionCustomizations): Promise<string>;
  
  // Scheduling & Reminders
  scheduleAction(actionId: string, schedule: ActionSchedule): Promise<void>;
  setActionReminder(actionId: string, reminder: ActionReminder): Promise<void>;
  getUpcomingActions(clientId: string, days: number): Promise<Action[]>;
  
  // Analytics
  getActionCompletionRate(clientId: string, dateRange: DateRange): Promise<number>;
  getActionAnalytics(coachId: string): Promise<ActionAnalytics>;
}
```

### 7. **CommunicationService**
Messaging, notifications, and check-in management.

```typescript
interface CommunicationService {
  // Direct Messaging
  sendMessage(fromId: string, toId: string, message: string, attachments?: File[]): Promise<string>;
  getConversation(userId1: string, userId2: string, pagination?: PaginationOptions): Promise<Conversation>;
  getConversations(userId: string): Promise<ConversationSummary[]>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;
  
  // Notifications
  sendNotification(userId: string, notification: Notification): Promise<void>;
  getNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  updateNotificationPreferences(userId: string, preferences: NotificationPreferences): Promise<void>;
  
  // Check-ins & Surveys
  createCheckIn(coachId: string, clientId: string, checkIn: CheckIn): Promise<string>;
  sendCheckIn(checkInId: string): Promise<void>;
  respondToCheckIn(checkInId: string, response: CheckInResponse): Promise<void>;
  getCheckInHistory(clientId: string): Promise<CheckIn[]>;
  getCheckInTemplates(): Promise<CheckInTemplate[]>;
  
  // Announcements
  sendAnnouncement(coachId: string, clientIds: string[], announcement: Announcement): Promise<void>;
  getAnnouncements(userId: string): Promise<Announcement[]>;
  
  // Real-time Communication
  joinChatRoom(roomId: string, userId: string): Promise<void>;
  leaveChatRoom(roomId: string, userId: string): Promise<void>;
  sendRealTimeMessage(roomId: string, message: Message): Promise<void>;
}
```

### 8. **AnalyticsService**
Comprehensive analytics and reporting for coaches and administrators.

```typescript
interface AnalyticsService {
  // Coach Analytics
  getCoachDashboardStats(coachId: string): Promise<DashboardStats>;
  getClientEngagementMetrics(coachId: string): Promise<EngagementMetrics>;
  getCoachPerformanceMetrics(coachId: string, dateRange: DateRange): Promise<PerformanceMetrics>;
  
  // Client Analytics
  getClientMetrics(clientId: string): Promise<ClientMetrics>;
  getClientEngagement(clientId: string): Promise<ClientEngagement>;
  getClientRetentionData(coachId: string): Promise<RetentionData>;
  
  // Business Intelligence
  generateProgressReport(clientId: string, reportType: ReportType): Promise<ProgressReport>;
  generateCoachReport(coachId: string, reportType: ReportType): Promise<CoachReport>;
  getSystemAnalytics(dateRange: DateRange): Promise<SystemAnalytics>;
  
  // Predictive Analytics
  predictClientChurn(clientId: string): Promise<ChurnPrediction>;
  suggestInterventions(clientId: string): Promise<Intervention[]>;
  analyzeGoalAchievementProbability(clientId: string, goalId: string): Promise<number>;
  
  // Custom Reports
  createCustomReport(definition: ReportDefinition): Promise<string>;
  generateCustomReport(reportId: string, parameters: ReportParameters): Promise<CustomReport>;
  scheduleRecurringReport(reportId: string, schedule: ReportSchedule): Promise<void>;
}
```

### 9. **PaymentService**
Handles coach payments, subscriptions, and financial transactions.

```typescript
interface PaymentService {
  // Payment Processing
  processCoachPayment(clientId: string, coachId: string, amount: number, description: string): Promise<PaymentResult>;
  setupRecurringPayment(clientId: string, coachId: string, subscription: SubscriptionPlan): Promise<string>;
  cancelRecurringPayment(subscriptionId: string): Promise<void>;
  
  // Payment Methods
  addPaymentMethod(userId: string, paymentMethod: PaymentMethod): Promise<string>;
  removePaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
  
  // Invoicing
  generateInvoice(coachId: string, clientId: string, services: BillingItem[]): Promise<Invoice>;
  sendInvoice(invoiceId: string): Promise<void>;
  getInvoices(userId: string, role: 'coach' | 'client'): Promise<Invoice[]>;
  markInvoicePaid(invoiceId: string, paymentReference: string): Promise<void>;
  
  // Coach Payouts
  initiateCoachPayout(coachId: string, amount: number): Promise<PayoutResult>;
  getPayoutHistory(coachId: string): Promise<Payout[]>;
  setupPayoutMethod(coachId: string, payoutMethod: PayoutMethod): Promise<void>;
  
  // Financial Reporting
  getEarningsReport(coachId: string, dateRange: DateRange): Promise<EarningsReport>;
  getSpendingReport(clientId: string, dateRange: DateRange): Promise<SpendingReport>;
  generateTaxDocuments(userId: string, taxYear: number): Promise<TaxDocument[]>;
}
```

### 10. **FileService**
File upload, storage, and document management.

```typescript
interface FileService {
  // File Upload & Storage
  uploadFile(file: File, category: FileCategory, userId: string): Promise<UploadResult>;
  downloadFile(fileId: string): Promise<Blob>;
  deleteFile(fileId: string): Promise<void>;
  getFileMetadata(fileId: string): Promise<FileMetadata>;
  
  // Profile Images
  uploadProfileImage(userId: string, imageFile: File): Promise<string>;
  generateProfileImageUrl(userId: string): Promise<string>;
  
  // Document Generation
  generatePDFReport(data: any, template: ReportTemplate): Promise<Blob>;
  exportMealPlan(planId: string, format: 'pdf' | 'csv'): Promise<Blob>;
  exportWorkoutProgram(programId: string, format: 'pdf' | 'csv'): Promise<Blob>;
  generateProgressReport(clientId: string, format: 'pdf' | 'docx'): Promise<Blob>;
  
  // File Organization
  createFolder(userId: string, folderName: string, parentFolderId?: string): Promise<string>;
  moveFile(fileId: string, newFolderId: string): Promise<void>;
  getUserFiles(userId: string, folderId?: string): Promise<FileInfo[]>;
  
  // File Sharing
  shareFile(fileId: string, userId: string, permissions: FilePermissions): Promise<string>;
  getSharedFiles(userId: string): Promise<SharedFile[]>;
  revokeFileAccess(fileId: string, userId: string): Promise<void>;
}
```

## Supporting Services

### 11. **ValidationService**
Data validation and business rule enforcement.

```typescript
interface ValidationService {
  validateClientProfile(profile: ClientProfile): ValidationResult;
  validateMealPlan(plan: CoachMealProgram): ValidationResult;
  validateWorkoutProgram(program: CoachWorkoutProgram): ValidationResult;
  validateGoals(goals: Goal[]): ValidationResult;
  validateSchedule(schedule: Schedule): ValidationResult;
  validatePaymentInfo(paymentInfo: PaymentMethod): ValidationResult;
}
```

### 12. **IntegrationService**
External API integrations and third-party services.

```typescript
interface IntegrationService {
  // Calendar Integration
  syncWithGoogleCalendar(userId: string, events: CalendarEvent[]): Promise<void>;
  syncWithOutlook(userId: string, events: CalendarEvent[]): Promise<void>;
  
  // Fitness Trackers
  syncWithFitbit(userId: string): Promise<FitnessData>;
  syncWithAppleHealth(userId: string): Promise<FitnessData>;
  syncWithGoogleFit(userId: string): Promise<FitnessData>;
  
  // Nutrition Databases
  searchUSDADatabase(query: string): Promise<FoodItem[]>;
  getNutritionInfo(foodId: string): Promise<NutritionInfo>;
  
  // E-commerce Integration
  generateInstacartLink(shoppingList: ShoppingItem[]): Promise<string>;
  generateAmazonFreshLink(shoppingList: ShoppingItem[]): Promise<string>;
  
  // Communication Platforms
  sendSMSNotification(phoneNumber: string, message: string): Promise<void>;
  sendEmailNotification(email: string, template: EmailTemplate, data: any): Promise<void>;
}
```

### 13. **CacheService**
Performance optimization through intelligent caching.

```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  
  // Specialized caching
  cacheUserProfile(userId: string, profile: any, ttl?: number): Promise<void>;
  getCachedUserProfile(userId: string): Promise<any | null>;
  invalidateUserCache(userId: string): Promise<void>;
  
  cacheSearchResults(query: string, results: any[], ttl?: number): Promise<void>;
  getCachedSearchResults(query: string): Promise<any[] | null>;
}
```

## Implementation Strategy

### 1. **Service Layer Architecture**
```
Presentation Layer (React Components)
    ↓
Business Logic Layer (Hooks/Context)
    ↓
Service Layer (Service Classes)
    ↓
Data Access Layer (API Clients)
    ↓
External APIs/Database
```

### 2. **Service Registration & Dependency Injection**
```typescript
// Service container
class ServiceContainer {
  private services: Map<string, any> = new Map();
  
  register<T>(name: string, service: T): void;
  get<T>(name: string): T;
  resolve<T>(constructor: new (...args: any[]) => T): T;
}

// Usage in React
const useService = <T>(serviceName: string): T => {
  return serviceContainer.get<T>(serviceName);
};
```

### 3. **Error Handling Strategy**
```typescript
interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
}

interface ServiceResponse<T> {
  data?: T;
  error?: ServiceError;
  success: boolean;
}
```

### 4. **Testing Strategy**
```typescript
// Service mocking for tests
interface ServiceMock<T> {
  mockImplementation(impl: Partial<T>): void;
  mockResolvedValue(value: any): void;
  mockRejectedValue(error: any): void;
  restore(): void;
}

// Mock factory
const createServiceMock = <T>(service: T): ServiceMock<T> => {
  // Mock implementation
};
```

### 5. **Performance Optimization**
- Implement request batching for multiple API calls
- Use service-level caching for frequently accessed data
- Implement optimistic updates for better UX
- Add request deduplication for identical concurrent requests
- Use pagination for large data sets

### 6. **Monitoring & Observability**
- Add service-level logging and metrics
- Implement request tracing across service calls
- Monitor service performance and availability
- Add alerting for service failures
- Track business metrics and KPIs

This comprehensive service layer provides the foundation for a robust, scalable coach/client management system with proper separation of concerns, error handling, and performance optimization.