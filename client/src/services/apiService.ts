import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const fetchNutritionData = async (query: string): Promise<NutritionResponse> => {
  try {
    const response = await axios.get(`${API_URL}/nutrition/${encodeURIComponent(query)}`);
    
    // Type assertion to tell TypeScript what to expect
    const data = response.data as any;
    return {
      success: true,
      item: data?.item,
      calories_per_serving: data?.calories_per_serving,
      macros: data?.macros,
      processed_level: data?.processed_level,
      verdict: data?.verdict,
      snap_eligible: data?.snap_eligible,
      message: data?.message
    };
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return { 
      success: false, 
      message: 'Error fetching nutrition data' 
    };
  }
};

// Updated to handle the new response structure from analyze-image endpoint
export const processUploadedFoodImage = async (file: File): Promise<NutritionResponse> => {
  console.log('Sending file:', file.name, 'Size:', file.size);
  
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await fetch('http://localhost:5000/api/analyze-image', {
      method: 'POST',
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Received data:', data); // Add debugging
    
    // The backend now returns the expected structure directly
    return data as NutritionResponse;
    
  } catch (error) {
    console.error('Error processing uploaded image:', error);
    return {
      success: false,
      message: 'Error processing uploaded image'
    };
  }
};

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