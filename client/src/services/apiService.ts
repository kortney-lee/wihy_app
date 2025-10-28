// UPDATED: Now uses WiHy Enhanced API for all functionality
// Image processing and nutrition analysis via ml.wihy.ai

import { wihyAPI } from './wihyAPI';

// Updated interface to match backend response structure
export interface NutritionResponse {
  success: boolean;
  message?: string;
  
  // Image analysis results
  foodName?: string;
  confidence?: number;
  tags?: string[];
  
  // Nutrition data
  nutrition?: {
    item?: string;
    calories?: number;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
  };
  
  // Additional analysis data
  analysis?: {
    provider?: string;
    confidence?: number;
    tags?: string[];
  };
  
  // Health scoring
  healthScore?: number;
  
  // Timestamp
  timestamp?: string;
  
  // Legacy fields for backward compatibility
  item?: string;
  calories_per_serving?: number;
  macros?: {
    protein: string;
    carbs: string;
    fat: string;
  };
  processed_level?: string;
  verdict?: string;
  snap_eligible?: boolean;
}

// DEPRECATED: Use wihyAPI.searchNutrition() instead
export const fetchNutritionData = async (query: string): Promise<NutritionResponse> => {
  console.warn('⚠️ DEPRECATED: fetchNutritionData() - Use wihyAPI.searchNutrition() instead');
  
  return {
    success: false,
    message: 'This function has been deprecated. Please use wihyAPI.searchNutrition() for nutrition queries.'
  };
};

// Keep image processing for image uploads (this is still needed)
export const processUploadedFoodImage = async (file: File): Promise<NutritionResponse> => {
  console.log('Processing uploaded food image:', file.name, 'Size:', file.size);
  
  try {
    // Use WiHy Enhanced API for image scanning
    const response = await wihyAPI.scanFoodImage(file);
    console.log('WiHy Enhanced API image analysis result:', response);
    
    // Convert WiHy response to legacy format for compatibility
    // Handle both UnifiedResponse and WihyResponse formats
    const isSuccessful = ('success' in response) ? response.success : true;
    
    // Extract relevant data based on response type
    let foodName = 'Unknown food';
    let confidence = 0;
    let tags: string[] = [];
    let analysisText = '';
    
    if ('data' in response && response.data) {
      // Handle UnifiedResponse format
      if (response.data.ai_response) {
        analysisText = response.data.ai_response.response;
        confidence = response.data.ai_response.confidence || 0.8;
      }
      foodName = response.data.response || 'Food item analyzed';
    } else if ('wihy_response' in response && response.wihy_response) {
      // Handle WihyResponse format
      foodName = response.wihy_response.core_principle || 'Food item analyzed';
      analysisText = response.wihy_response.core_principle || '';
      confidence = 0.8;
    } else if ('overall_assessment' in response) {
      // Handle legacy response format (if it still exists)
      foodName = (response as any).overall_assessment?.verdict || 'Unknown food';
      confidence = (response as any).overall_assessment?.health_score || 0;
      tags = (response as any).detected_foods?.map((f: any) => f.name) || [];
    }
    
    return {
      success: isSuccessful,
      message: isSuccessful ? 'Image analyzed successfully' : 'Image analysis failed',
      foodName,
      confidence,
      tags,
      nutrition: {
        item: foodName,
        // Note: nutrition details would need to come from additional API calls
      },
      analysis: {
        provider: 'WiHy Enhanced Model (ml.wihy.ai)',
        confidence: confidence,
        tags: tags
      }
    };
    
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    return {
      success: false,
      message: 'Error processing uploaded image'
    };
  }
};

// Keep for image analysis (converts image data to file for processing)
export const analyzeFoodImage = async (imageData: string): Promise<NutritionResponse> => {
  try {
    const response = await fetch(imageData);
    const blob = await response.blob();
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    
    return await processUploadedFoodImage(file);
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { 
      success: false, 
      message: 'Error analyzing image' 
    };
  }
};

// DEPRECATED: Use wihyAPI.searchNutrition() instead
export const searchFoodDatabase = async (query: string) => {
  console.warn('⚠️ DEPRECATED: searchFoodDatabase() - Use wihyAPI.searchNutrition() instead');
  
  throw new Error('This function has been deprecated. Please use wihyAPI.searchNutrition() for food database queries.');
};