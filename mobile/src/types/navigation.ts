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
  
  // Legal and info pages
  About: undefined;
  Terms: undefined;
  Privacy: undefined;
};
