// DEPRECATED: This service is being phased out in favor of direct wihyAPI calls
// Only barcode functionality remains for legacy support

import axios from 'axios';
import { HealthSearchResult } from '../types/healthTypes';

// Debug utility function
const safeLog = (message: string, data?: any) => {
  if (data === undefined) {
    console.log(message);
    return;
  }
  
  try {
    if (typeof data === 'object' && data !== null) {
      console.log(message, JSON.stringify(data));
    } else {
      console.log(message, data);
    }
  } catch (error) {
    console.log(message, '(Object could not be stringified)');
  }
};

// Helper functions for barcode scanning (legacy support only)
const fetchNutritionData = async (barcode: string) => {
  try {
    const response = await axios.post('/vnutrition/analyze', { barcode });
    const responseData: any = response.data || {};
    return responseData;
  } catch (error) {
    console.error('Error fetching nutrition data:', error);
    throw error;
  }
};

const getErrorResponse = (query: string): HealthSearchResult => {
  return {
    summary: `Please use the main search functionality for "${query}".`,
    details: `This service has been deprecated. Please use the main search interface which now uses our improved WiHy AI system for better health and nutrition information.`,
    sources: ['System'],
    relatedTopics: [],
    recommendations: ['Use the main search interface for better results']
  };
};

// DEPRECATED: Use wihyAPI.searchHealth() directly instead
export const healthSearchService = {
  async searchHealthInfo(query: string, signal?: AbortSignal): Promise<HealthSearchResult> {
    safeLog("⚠️ DEPRECATED: healthSearchService.searchHealthInfo called for: " + query);
    safeLog("⚠️ Please use wihyAPI.searchHealth() directly instead");
    
    try {
      // If request is aborted, throw AbortError
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      // Only handle barcodes for legacy support
      if (/^\d{8,14}$/.test(query.trim())) {
        const nutritionResult = await fetchNutritionData(query.trim());
        return {
          summary: `Nutrition info for barcode: ${query}`,
          details: JSON.stringify(nutritionResult, null, 2),
          sources: [],
          relatedTopics: [],
          recommendations: [],
          medicalDisclaimer: 'Nutrition data from barcode lookup.',
          dataSource: 'vnutrition'
        };
      }

      // For all other queries, return deprecation notice
      return getErrorResponse(query);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error;
      }
      safeLog("Error in deprecated health search", error);
      return getErrorResponse(query);
    }
  },

  // Keep barcode search for legacy support
  async searchByBarcode(barcode: string) {
    try {
      const nutritionData = await fetchNutritionData(barcode);
      return nutritionData;
    } catch (error) {
      console.error('Error in barcode search:', error);
      return getErrorResponse(`food with barcode ${barcode}`);
    }
  },

  // Deprecated service status check
  async checkServiceStatus() {
    return { 
      status: 'deprecated', 
      message: 'This service has been replaced by wihyAPI. Please use wihyAPI.searchHealth() directly.' 
    };
  }
};