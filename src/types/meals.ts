// Types for Create Meals functionality

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  optional: boolean;
  notes?: string;
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

export interface Meal {
  id: string;
  name: string;
  servings: number;
  tags: MealTag[];
  ingredients: Ingredient[];
  prepBatchUsage?: PrepBatchUsage;
  notes?: string;
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
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingCategory;
  needsReview?: boolean; // for mismatched units
  sources: string[]; // meal/prep batch names that need this ingredient
}

export type MealTag = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export type ShoppingCategory = 
  | 'Produce' 
  | 'Protein' 
  | 'Pantry' 
  | 'Dairy' 
  | 'Frozen' 
  | 'Other';

export interface InstacartOrder {
  id: string;
  mealPlanId: string;
  link?: string;
  status: 'pending' | 'generated' | 'ordered';
  createdAt: Date;
}