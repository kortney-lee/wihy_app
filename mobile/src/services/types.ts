// API Response Types

export interface ProductInfo {
  name: string;
  brand?: string;
  barcode?: string;
  categories?: string[];
  nova_group?: number;
  image_url?: string;
}

export interface NutritionData {
  score: number;
  grade: string;
  per_100g: {
    energy_kcal: number;
    fat: number;
    saturated_fat: number;
    carbohydrates: number;
    sugars: number;
    fiber: number;
    proteins: number;
    salt: number;
    sodium: number;
  };
  daily_values?: {
    energy: number;
    fat: number;
    saturated_fat: number;
  };
}

export interface HealthAlert {
  type: string;
  message: string;
  severity: string;
}

export interface HealthAnalysis {
  alerts?: HealthAlert[];
  recommendations?: string[];
  positive_aspects?: string[];
  areas_of_concern?: string[];
  serving_recommendations?: any;
  processing_level?: {
    nova_group: number;
    description: string;
    details: string;
  };
}

export interface ScanMetadata {
  scan_id: string;
  timestamp: string;
  confidence_score: number;
  data_sources: string[];
  session_id?: string;
  ingredients_text?: string;
  ask_wihy?: string;
  scan_type?: string;
}

export interface NutritionFacts {
  energy_kcal?: number;
  calories?: number;
  fat?: number;
  fat_g?: number;
  saturated_fat?: number;
  carbohydrates?: number;
  carbohydrates_g?: number;
  sugars?: number;
  sugar_g?: number;
  fiber?: number;
  fiber_g?: number;
  protein?: number;  // Singular to match API response
  proteins?: number;  // Keep plural for backward compatibility
  protein_g?: number;
  salt?: number;
  sodium?: number;
  daily_values?: {
    energy?: number;
    fat?: number;
    saturated_fat?: number;
    carbohydrates?: number;
    protein?: number;
    sodium?: number;
    [key: string]: number | undefined;
  };
}

export interface CompleteMetadata {
  product_name?: string;
  brand?: string;
  barcode?: string;
  categories?: string[];
  nova_group?: number;
  image_url?: string;
  nutrition_facts?: NutritionFacts;
  health_score?: number;
  grade?: string;
  ingredients_text?: string;
  ingredients?: string[];
  ask_wihy?: string;
  additives?: any;
  allergens?: any;
  labels?: any;
  nutrition_analysis?: {
    health_alerts?: HealthAlert[];
    positive_aspects?: string[];
    areas_of_concern?: string[];
    serving_recommendations?: string[];
    daily_value_percentages?: Record<string, number>;
  };
  nova_health_analysis?: {
    recommendations?: string[];
  };
}

// ========================================
// API v2.0 TYPES (January 2026) - services.wihy.ai
// Complete type definitions for all scan endpoints
// ========================================

export interface Additive {
  name: string;
  concern_level: 'low' | 'moderate' | 'high';
  description: string;
}

// ========================================
// BARCODE SCAN RESPONSE
// Used by: /api/scan/barcode, /api/scan/product
// ========================================
export interface BarcodeScanResponse {
  success: boolean;
  timestamp: string;
  processing_time_ms: number;
  scan_type: 'barcode' | 'image' | 'product_name';
  
  // Product Info
  product_name: string;
  brand: string;
  barcode: string;
  image_url: string | null;
  categories: string[];
  
  // Additional Product Images (from OpenFoodFacts)
  image_front_url: string | null;
  image_front_small_url: string | null;
  image_nutrition_url: string | null;
  image_nutrition_small_url: string | null;
  image_ingredients_url: string | null;
  image_ingredients_small_url: string | null;
  
  // Object detection data for product highlighting
  detectedObjects?: DetectedObject[];
  
  // Scores (0-100)
  health_score: number;
  nutrition_score: number;
  nutrition_grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  confidence_score: number;
  
  // Processing Level (NOVA Classification)
  nova_group: 1 | 2 | 3 | 4;
  processing_level: 'unprocessed' | 'processed_ingredient' | 'processed' | 'ultra_processed';
  
  // Nutrition Facts (per 100g unless noted)
  calories: number;
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  saturated_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  
  // Extended Nutrition
  cholesterol_mg: number;
  trans_fat_g: number;
  polyunsaturated_fat_g: number;
  monounsaturated_fat_g: number;
  potassium_mg: number;
  calcium_mg: number;
  iron_mg: number;
  vitamin_a_mcg: number;
  vitamin_c_mg: number;
  vitamin_d_mcg: number;
  
  // Serving Info
  serving_size: string;
  servings_per_container: number;
  
  // Chart Data (for UI visualization)
  chart_protein: number;
  chart_carbs: number;
  chart_fat: number;
  chart_health_score: number;
  chart_nova_group: number;
  
  // Health Analysis
  summary: string;
  health_alerts: string[];
  positive_aspects: string[];
  areas_of_concern: string[];
  
  // Ingredients
  ingredients_text: string;
  total_ingredients: number;
  allergens: string[];
  additives: Additive[];
  total_additives: number;
  
  // AI Context
  ask_wihy: string;
  
  // Quick Booleans for UI
  is_healthy: boolean;
  is_processed: boolean;
  has_allergens: boolean;
  has_additives: boolean;
}

// ========================================
// OBJECT DETECTION (for product highlighting)
// ========================================
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedObject {
  name: string;
  boundingBox: BoundingBox;
  confidence: number;
  category?: string;
}

// ========================================
// PHOTO SCAN RESPONSE (Food Image)
// Used by: /api/scan/photo
// ========================================
export interface PhotoScanResponse {
  success: boolean;
  scan_id: string;
  scan_type: 'food_photo';
  image_url: string | null;
  timestamp: string;
  processing_time: number;
  
  // Object detection data for product highlighting
  detectedObjects?: DetectedObject[];
  
  analysis: {
    detected_foods: string[];
    confidence_score: number;
    meal_type: string;
    summary: string;
  };
  
  metadata: {
    product_name: string;
    health_score: number;
    nutrition_score: number;
    nutrition_grade: {
      grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
      score: number;
    };
    nova_group: 1 | 2 | 3 | 4;
    processing_level: 'unprocessed' | 'processed_ingredient' | 'processed' | 'ultra_processed';
    vision_confidence: number;
    detected_foods: string[];
    
    nutrition_facts: {
      serving_size: string;
      serving_size_g: number;
      servings_per_container: number;
      calories: number;
      calories_serving: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      saturated_fat: number;
      fiber: number;
      sugars: number;
      sodium: number;
      cholesterol: number;
      trans_fat: number;
      polyunsaturated_fat: number;
      monounsaturated_fat: number;
      potassium: number;
      calcium: number;
      iron: number;
      vitamin_a: number;
      vitamin_c: number;
      vitamin_d: number;
    };
    
    nutrition_analysis: {
      health_alerts: string[];
      positive_aspects: string[];
      areas_of_concern: string[];
    };
    
    categories: string[];
    estimated_ingredients?: string;
  };
  
  ask_wihy: string;
}

// ========================================
// RECIPE SCAN RESPONSE
// Used by: /api/scan/recipe
// ========================================
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  estimated_grams: number;
  calories_estimate: number;
}

export interface RecipeNutrition {
  serving_size: string;
  servings_per_recipe: number;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  saturated_fat?: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface RecipeAnalysis {
  meal_name: string;
  confidence_score: number;
  detected_text: string;
  ingredients: RecipeIngredient[];
  nutrition_facts: RecipeNutrition;
  instructions: string[];
  preparation_time: string | null;
  cooking_time: string | null;
  total_time: string | null;
  suggested_tags: string[];
  category: string;
}

export interface RecipeScanResponse {
  success: boolean;
  scan_id: string;
  scan_type: 'recipe';
  image_url: string | null;
  analysis: RecipeAnalysis;
  timestamp: string;
  processing_time: number;
}

// ========================================
// LABEL SCAN RESPONSE (Greenwashing Detection)
// Used by: /api/scan/label
// ========================================
export interface GreenwashingFlag {
  flag: string;
  severity: 'low' | 'medium' | 'high' | 'positive';
  detail: string;
  claim_text: string;
}

export interface MarketingClaim {
  claim: string;
  category: 'certification' | 'marketing' | 'ingredient' | 'health' | 'environmental';
  verified: boolean;
  needs_verification: boolean;
  description: string;
}

export interface LabelScanResponse {
  success: boolean;
  scan_id: string;
  scan_type: 'label';
  image_url: string | null;
  timestamp: string;
  processing_time: number;
  
  analysis: {
    product_name: string;
    confidence: number;
    greenwashing_score: number;
    claim_count: number;
    greenwashing_flags: GreenwashingFlag[];
    detected_claims: MarketingClaim[];
    full_text: string;
    recommendations: string[];
  };
  
  ask_wihy: string;
}

// ========================================
// UNION TYPE FOR ALL SCAN RESPONSES
// ========================================
export type ScanResponse = 
  | BarcodeScanResponse 
  | PhotoScanResponse 
  | RecipeScanResponse 
  | LabelScanResponse;

// ========================================
// LEGACY ALIASES (for backward compatibility)
// ========================================
export type BarcodeScanResult = BarcodeScanResponse;
export type ImageScanResult = PhotoScanResponse;
export type FoodPhotoScanResult = PhotoScanResponse;
    confidence_score?: number;
    charts?: any;
    visualizations?: any;
    openai_analysis?: string | null;
  };
}

// ========================================
// PILL SCAN RESULT
// ========================================
export interface PillMatch {
  rxcui: string;
  name: string;
  brandName?: string;
  ndc11?: string;
  imprint?: string;
  color?: string;
  shape?: string;
  confidence: number;
  image_url?: string;
}

export interface PillScanResult {
  success: boolean;
  scanId?: string;
  matches?: PillMatch[];
  requiresConfirmation?: boolean;
  status?: string;
  error?: string;
}

// ========================================
// SCAN HISTORY
// ========================================
export interface ScanHistoryItem {
  id: number;
  scan_type: 'barcode' | 'image' | 'food_photo' | 'pill' | 'label' | 'product_label';
  scan_timestamp: string;
  health_score?: number;
  image_url?: string;
  product?: {
    name: string;
    barcode?: string;
    detected_items?: string[];
  };
  medication?: {
    name: string;
    rxcui: string;
  };
}

export interface ScanHistoryResult {
  success: boolean;
  count: number;
  scans: ScanHistoryItem[];
  error?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  session_id?: string;
  timestamp: string;
  type?: 'food' | 'ingredient' | 'health' | 'general' | 'fitness_program' | 'meal_program' | 'fitness_combined_program' | 'research_clarification'; // Response type from ML API
  detected_type?: string; // Original detected type from backend
  confidence?: number; // Confidence score (0-1)
  source?: 'wihy_model_service' | 'openai_enhancer' | 'research_orchestrator' | 'wihy_fitness_service' | 'wihy_meal_service' | 'wihy_interactive_research'; // Response source
  chart_data?: any; // Optional chart data for visualizations
  error?: string;
  
  // Created resources - populated when /ask creates programs/plans
  created_resources?: CreatedResource[];
  
  // Suggested actions for UI
  suggested_actions?: SuggestedAction[];
  
  // Follow-up suggestions for chat
  follow_up_suggestions?: string[];
  
  // Clarifying questions from research_clarification responses
  clarifying_questions?: string[];
  
  // Suggested searches from research_clarification responses
  suggested_searches?: string[];
  
  // Recommendations from the response
  recommendations?: string[];
}

/** Resource created by /ask or /api/chat/message */
export interface CreatedResource {
  type: 'fitness_program' | 'meal_program' | 'shopping_list';
  id: string;
  name: string;
  navigate_to: string;
  metadata?: {
    duration_weeks?: number;
    days_per_week?: number;
    servings?: number;
    calories?: number;
    [key: string]: any;
  };
}

/** Suggested action for UI buttons */
export interface SuggestedAction {
  action: 'view_program' | 'start_workout' | 'view_meals' | 'shopping_list' | 'navigate';
  label: string;
  route: string;
}

export interface IngredientAnalysis {
  ingredient: string;
  success: boolean;
  safety_score: number;
  risk_level: string;
  recall_count: number;
  adverse_event_count: number;
  recommendations: Array<{
    type: string;
    message: string;
  }>;
  fda_status: string;
  analysis_summary: string;
}
