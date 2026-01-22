export type TabParamList = {
  Home: undefined;
  Scan: undefined;
  Chat: { context?: any; initialMessage?: string } | undefined;
  Health: { openResearchDashboard?: boolean } | undefined;
  Profile: undefined;
  CoachSelection: undefined;
};

import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  FullChat: { context?: any; initialMessage?: string };
  ChatHistory: undefined;
  NutritionFacts: { foodItem: any; context?: any };
  BeautyFacts: { product: any; context?: any };
  PetFoodFacts: { product: any; context?: any };
  FoodPhotoFacts: { photoData: any; context?: any; capturedImage?: string };
  PillIdentification: { pillData: any; context?: any; capturedImage?: string };
  LabelReader: { labelData: any; context?: any; capturedImage?: string };
  Dashboard: { filter?: string };
  Profile: undefined;
  Camera: { mode?: 'barcode' | 'food' | 'pill' | 'label' };
  WihyHomeScreen: undefined;
  WihyHome: undefined;
  ResearchDashboard: undefined;
  Permissions: undefined;
  Subscription: undefined;
  B2BPricing: undefined;
  PostPaymentRegistration: { 
    email?: string; 
    planId?: string; 
    planName?: string; 
    sessionId?: string;
  };
  ScanHistory: undefined;
  CoachDashboardPage: undefined;
  FamilyDashboardPage: undefined;
  ParentDashboard: undefined; // Legacy - will be removed
  ClientManagement: undefined;
  ClientOnboarding: undefined;
  ClientProgress: { clientId: string; clientName?: string };
  
  // Coaching Workflow Routes
  CoachProfileSetup: undefined;
  CoachSelection: undefined;
  CoachDetailPage: { coachId: string };
  RequestCoaching: { coachId: string; coachName: string };
  AcceptInvitation: { invitationId: string; coachId?: string };
  SessionBooking: { coachId: string; coachName: string };
  
  CreateMeals: { showShoppingList?: boolean; shoppingListId?: string } | undefined;
  MealPreferences: { returnTo?: keyof RootStackParamList };
  ShoppingList: { 
    mealPlanId: number; 
    shoppingListData: any; 
  };
  MealDetails: { mealId: string };
  IntegrationTest: undefined;
  
  // Created resource navigation routes
  FitnessProgramDetails: { programId?: string; programName?: string; autoStart?: boolean };
  MealPlanDetails: { planId?: string; planName?: string };
  
  // Enrollment for coaches and parents
  Enrollment: { tab?: 'parent' | 'coach' } | undefined;
  
  // Onboarding flow
  OnboardingFlow: undefined;
  
  // Auth callback (web OAuth redirect)
  AuthCallback: {
    session_token?: string;
    provider?: string;
    state?: string;
    error?: string;
    error_description?: string;
  } | undefined;
  
  // Subscribe complete (OAuth-first then pay flow)
  SubscribeComplete: undefined;
  
  // Payment success (Stripe redirect)
  PaymentSuccess: {
    session_id?: string;
  } | undefined;
  
  // Legal and info pages
  About: undefined;
  Terms: undefined;
  Privacy: undefined;
  
  // Profile screens
  EditProfile: undefined;
  ProfileSetup: { isOnboarding?: boolean } | undefined;
  HealthData: undefined;
  
  // User Profile Management Routes
  ProfileSettings: undefined;
  PrivacySettings: undefined;
};
