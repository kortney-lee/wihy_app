// (Create this file if it doesn't exist)

import { API_CONFIG, getApiEndpoint } from '../config/apiConfig';

class FoodAnalysisService {
  private baseUrl = API_CONFIG.WIHY_API_URL;

  async analyzeFoodImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${this.baseUrl}/analyze-image`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.foodName || result.analysis || 'Unknown food item';
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }
}

export const foodAnalysisService = new FoodAnalysisService();