import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface NutritionResponse {
  success?: boolean;
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
  message?: string;
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

export const processUploadedFoodImage = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(`${API_URL}/nutrition/analyze`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    // Type assertion for image analysis response
    const data = response.data as any;
    return {
      success: true,
      analysis: data?.analysis,
      nutrition: data?.nutrition,
      foodName: data?.foodName,
      tags: data?.tags,
      confidence: data?.confidence,
      timestamp: data?.timestamp
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { 
      success: false, 
      message: 'Error analyzing image' 
    };
  }
};

export const analyzeFoodImage = async (imageData: string): Promise<any> => {
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