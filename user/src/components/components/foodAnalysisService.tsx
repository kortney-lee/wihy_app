// src/services/foodAnalysisService.ts
import axios from 'axios';

interface FoodAnalysisResult {
  classification: {
    foodName: string;
    confidence: number;
    category: string;
    portionSize?: string;
    alternatives?: string[];
  };
  nutrition: {
    calories: number;
    macros: {
      protein: number;
      carbs: number;
      fat: number;
      saturatedFat: number;
      sugar: number;
      fiber: number;
      sodium: number;
    };
    healthScore: number;
    novaClassification: 1 | 2 | 3 | 4;
    allergens: string[];
    snapEligible: boolean;
  };
  healthInsight: string;
  recommendations: string[];
}

// Add a type for the API response
interface AnalyzeImageResponse {
  foodName: string;
  name?: string;  // Alternative field name
  nutrition?: any;
  confidence?: number;
  // Add other fields as needed
}

const API_URL = 'http://localhost:5000/api';

// Create or update this file to properly send images to your backend

class FoodAnalysisService {
  private baseUrl = 'http://localhost:5000/api';

  async analyzeFoodImage(file: File): Promise<any> {
    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append('image', file); // This must match your backend's upload.single('image')

      // Send to your backend endpoint
      const response = await fetch(`${this.baseUrl}/analyze-image`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Backend analysis result:', result);
      
      // Return the food name or relevant data
      return result.foodName || result.name || result.analysis || 'Unknown food item';
      
    } catch (error) {
      console.error('Error analyzing food image:', error);
      throw error;
    }
  }
}

export const foodAnalysisService = new FoodAnalysisService();