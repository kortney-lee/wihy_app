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

import { API_CONFIG, getApiEndpoint } from '../config/apiConfig';

const API_URL = API_CONFIG.BASE_URL;

// Create or update this file to properly send images to your backend

class FoodAnalysisService {
  async analyzeFoodImage(file: File): Promise<string> {
    try {
      console.log('Using WiHy Scan API for food image analysis...');
      
      // Import wihyAPI to use the new scan endpoint
      const { wihyAPI } = await import('../services/wihyAPI');
      
      const result = await wihyAPI.scanFood(file);
      console.log('WiHy Scan API result:', result);
      
      // Extract food name from the scan result using unified format
      let foodName = 'Unknown food item';
      
      // Type-safe check for unified response format
      if (result.success && 'data' in result && result.data) {
        const unifiedResult = result as any; // Use any to handle type checking
        
        // Primary: Get health advice from AI response
        if (unifiedResult.data.ai_response?.response) {
          foodName = unifiedResult.data.ai_response.response;
          console.log('📊 Using AI response for food name:', foodName);
        }
        // Fallback: Try to get product name or other analysis
        else if (unifiedResult.data.product_name) {
          foodName = unifiedResult.data.product_name;
          console.log('📊 Using product name:', foodName);
        }
        else if (unifiedResult.data.analysis) {
          foodName = unifiedResult.data.analysis;
          console.log('📊 Using analysis:', foodName);
        }
        else {
          foodName = 'Food item analyzed';
          console.log('📊 Using fallback name');
        }
      } else {
        console.log('❌ No valid response data found in food analysis');
        foodName = 'Food analysis unavailable';
      }
      
      return foodName;
      
    } catch (error) {
      console.error('Error analyzing food image:', error);
      throw error;
    }
  }
}

export const foodAnalysisService = new FoodAnalysisService();