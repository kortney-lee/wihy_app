import axios from 'axios';

import { getApiEndpoint } from '../config/apiConfig';

export const fetchNutritionData = async (query: string): Promise<any> => {
  try {
    const response = await axios.get(getApiEndpoint(`/nutrition/${encodeURIComponent(query)}`));
    return response.data;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    return { success: false, message: 'Error fetching nutrition data' };
  }
};

export const processUploadedFoodImage = async (file: File): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await axios.post(getApiEndpoint('/nutrition/analyze'), formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { success: false, message: 'Error analyzing image' };
  }
};

export const analyzeFoodImage = async (imageData: string): Promise<any> => {
  // Convert base64 to File if needed
  const response = await fetch(imageData);
  const blob = await response.blob();
  const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
  
  return await processUploadedFoodImage(file);
};