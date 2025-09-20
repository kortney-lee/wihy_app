// (Create this file if it doesn't exist)

class FoodAnalysisService {
  private baseUrl = 'http://localhost:5000/api';

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