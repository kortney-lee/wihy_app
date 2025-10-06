export interface Food {
  food_id: number;
  name: string;
  brand?: string;
  category?: string;
  serving_size?: string;
  serving_unit?: string;
  calories_per_serving?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  cholesterol_mg?: number;
  saturated_fat_g?: number;
  trans_fat_g?: number;
  vitamin_a_iu?: number;
  vitamin_c_mg?: number;
  calcium_mg?: number;
  iron_mg?: number;
  usda_code?: string;
  barcode?: string;
  nova_classification?: number;
  nova_description?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface NovaClassification {
  nova_id: number;
  classification_name: string;
  description: string;
  examples: string;
}