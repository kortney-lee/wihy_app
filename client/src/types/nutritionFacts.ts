// Universal nutrition facts data structure
// Supports all food analysis sources: barcode, image, meal, recipe, etc.

export type FoodSource = "barcode" | "image" | "nutrition_label" | "meal" | "recipe" | "generic";

export type SeverityLevel = "low" | "medium" | "high";

export interface Additive {
  name: string;
  severity: SeverityLevel;
}

export interface Macros {
  protein?: number;
  carbs?: number;
  fat?: number;
  sugar?: number;
  fiber?: number;
}

export interface Insight {
  label: string;
  description?: string;
}

export interface ResearchItem {
  id: string;
  summary: string;
}

export interface Recommendation {
  id: string;
  name: string;
  brand?: string;
  score?: number;
  imageUrl?: string;
}

export interface NutritionFactsData {
  source: FoodSource;

  // Identity
  name?: string;
  brand?: string;
  imageUrl?: string;

  // Nutrition & serving
  calories?: number;
  macros?: Macros;
  servingSize?: string;
  servingsPerContainer?: string;

  // Processing / quality
  novaScore?: number;
  ultraProcessed?: boolean;
  additives?: Additive[];

  // WIHY score
  healthScore?: number;
  grade?: string;

  // Insight lists
  positives?: Insight[];
  negatives?: Insight[];
  research?: ResearchItem[];

  // Recommendations
  recommendations?: Recommendation[];
}
