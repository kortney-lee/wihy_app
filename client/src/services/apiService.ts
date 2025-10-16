// DEPRECATED: Most functionality moved to wihyAPI
// Only image processing and legacy nutrition functions remain

import { API_CONFIG, getApiEndpoint } from '../config/apiConfig';

const API_URL = API_CONFIG.BASE_URL;

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
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch(getApiEndpoint('/analyze-image'), {
      method: 'POST',
      body: formData
    });
    
    console.log('Image analysis response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image analysis error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Image analysis result:', data);
    
    // The backend returns the expected structure directly
    return data as NutritionResponse;
    
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