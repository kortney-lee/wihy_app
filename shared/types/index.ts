// Shared TypeScript types for web and mobile
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface FoodItem {
  id: string;
  name: string;
  nutrition: NutritionData;
  servingSize?: string;
  brand?: string;
}

export interface Meal {
  id: string;
  userId: string;
  name: string;
  items: FoodItem[];
  totalNutrition: NutritionData;
  createdAt: Date;
}

export interface SearchResult {
  id: string;
  name: string;
  description?: string;
  nutrition?: NutritionData;
  source?: string;
}
