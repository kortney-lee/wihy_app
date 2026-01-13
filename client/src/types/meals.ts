// Types for Create Meals functionality

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  notes?: string;
  brand?: string;
  aisle?: string;
  cost?: number;
}

export interface PrepBatch {
  id: string;
  name: string;
  servings: number;
  ingredients: Ingredient[];
  notes?: string;
  usedBy: string[]; // meal IDs that reference this prep batch
}

export interface PrepBatchUsage {
  batchId: string;
  batchName: string;
  servingsUsed: number;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

export interface Meal {
  id: string;
  name: string;
  servings: number;
  tags: MealTag[];
  ingredients: Ingredient[];
  prepBatchUsage?: PrepBatchUsage;
  notes?: string;
  mealType?: MealType;
  nutrition?: NutritionInfo;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  instructions?: string[];
  costPerServing?: number;
  imageUrl?: string;
  recipeId?: string;
}

export interface MealPlan {
  id: string;
  name: string;
  planType: 'This Week' | 'Next 7 Days' | 'Custom';
  goals: string[];
  meals: Meal[];
  prepBatches: PrepBatch[];
  createdBy?: string; // coach ID if created by coach
  clientId?: string; // if assigned to client
}

export interface ShoppingListItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  needsReview?: boolean; // for mismatched units
  sources?: string[]; // meal/prep batch names that need this ingredient
  checked?: boolean;
  estimatedPrice?: number;
  brand?: string;
  aisle?: string;
}

export type MealTag = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type ShoppingCategory = 
  | 'Produce' 
  | 'Protein' 
  | 'Pantry' 
  | 'Dairy' 
  | 'Frozen' 
  | 'Grains & Carbs'
  | 'Other';

export interface InstacartOrder {
  id: string;
  mealPlanId: string;
  link?: string;
  status: 'pending' | 'generated' | 'ordered';
  createdAt: Date;
}

// ============================================
// NEW TYPES FOR ENHANCED MEAL PLANNING
// ============================================

export type PlanningGoal = 'family-meals' | 'quick-easy' | 'budget-friendly' | 'health-fitness';
export type CookingSkill = 'beginner' | 'intermediate' | 'advanced';
export type DietaryRestriction = 
  | 'vegetarian' 
  | 'vegan' 
  | 'gluten-free' 
  | 'dairy-free' 
  | 'nut-allergy' 
  | 'kid-friendly' 
  | 'low-carb' 
  | 'diabetic-friendly'
  | 'keto'
  | 'mediterranean'
  | 'high-protein'
  | 'leviticus-11';

export interface MealPlanningPreferences {
  planningGoal: PlanningGoal;
  dietaryRestrictions: DietaryRestriction[];
  preferredStores: string[];
  cookingSkill: CookingSkill;
  familySize: number;
  budgetPerMeal?: number;
}

export interface MealProgramDay {
  dayNumber: number;
  dayName: string;
  date: string;
  totalDailyCost?: number;
  dailyMacros?: NutritionInfo;
  meals: GeneratedMeal[];
}

export interface GeneratedMeal {
  mealId: string;
  mealType: MealType;
  type?: MealType;
  mealName: string;
  name?: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  totalTime: number;
  costPerServing?: number;
  totalCost?: number;
  nutrition: NutritionInfo;
  ingredients: MealIngredient[];
  instructions: string[];
  tags: string[];
  kidApproved?: boolean;
  usesLeftovers?: boolean;
  leftoverFrom?: string;
  leftoverPlan?: {
    savesFor: string;
    amount: string;
    storage: string;
  };
  image?: string;
}

export interface MealIngredient {
  name: string;
  amount: number;
  unit: string;
  brand?: string;
  aisle?: string;
  cost?: number;
  notes?: string;
}

export interface GeneratedMealProgram {
  id?: string;
  programId?: string;
  name: string;
  description: string;
  durationDays: number;
  totalMeals: number;
  familySize: number;
  weeklyCost?: {
    total: number;
    perPerson: number;
    perMeal: number;
  };
  weeklyMacros?: NutritionInfo;
  days: MealProgramDay[];
  shoppingList?: GeneratedShoppingList;
}

export interface GeneratedShoppingList {
  shoppingListId: string;
  totalItems: number;
  estimatedCost: {
    min: number;
    max: number;
  };
  storeBreakdown?: Record<string, { items: number; cost: number }>;
  itemsByCategory: Record<string, ShoppingListItem[]>;
  mealPrepTips?: string[];
}

export interface MealTemplate {
  templateId: string;
  name: string;
  nutrition: NutritionInfo;
  ingredients: MealIngredient[];
  tags: string[];
  category: MealType;
  prepTime: number;
  cookTime: number;
}

export interface CalendarDay {
  date: string;
  dayNumber?: number;
  dayName?: string;
  meals: CalendarMeal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  hasBreakfast?: boolean;
  hasLunch?: boolean;
  hasDinner?: boolean;
  hasSnacks?: boolean;
}

export interface CalendarMeal {
  id?: string;
  mealId?: string;
  name?: string;
  mealType?: MealType;
  type?: MealType;
  mealName?: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servings?: number;
  recipeId?: string;
  time?: string;
  isCompleted?: boolean;
  image?: string;
}

export interface InstacartCartResponse {
  success: boolean;
  instacartCartId: string;
  cartUrl: string;
  mobileDeepLink: string;
  store: {
    name: string;
    address: string;
    availableSlots: {
      time: string;
      deliveryFee: number;
      serviceFee: number;
    }[];
  };
  estimatedTotal: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    tax: number;
    total: number;
  };
  itemsMatched: number;
  itemsTotal: number;
  unmatchedItems: {
    name: string;
    reason: string;
    alternative?: string;
  }[];
  expirationTime: string;
}