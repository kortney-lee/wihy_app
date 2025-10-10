import openaiAPI, { openaiAPI as openaiService } from './openaiAPI';
import { healthAPI } from './healthAPI';
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

// Helper functions defined outside the object
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
    summary: `We encountered an issue searching for information about "${query}".`,
    details: `We're currently unable to provide detailed health information about "${query}". This could be due to:\n\n• Temporary service issues\n• Network connectivity problems\n• API limitations\n\nPlease try again in a few moments, or consider these general health resources:\n\n• Contact your healthcare provider\n• Visit reputable medical websites like Mayo Clinic or WebMD\n• Call a health information hotline\n• Consult medical reference books`,
    sources: ['System'],
    relatedTopics: [],
    recommendations: []
  };
};

export const healthSearchService = {
  async searchHealthInfo(query: string, signal?: AbortSignal): Promise<HealthSearchResult> {
    safeLog("HealthSearchService: Searching for " + query);
    try {
      // If request is aborted, throw AbortError
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted', 'AbortError');
      }
      
      // If barcode, call nutrition
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

      // Try to use the API with fetch and abort signal
      try {
        const response = await fetch('http://localhost:5000/api/search/food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
          signal: signal
        });
        
        if (!response.ok) {
          throw new Error('API request failed');
        }
        
        return await response.json();
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          safeLog('Search request was aborted');
          throw fetchError; // Re-throw to handle in caller
        }
        // Fall through to OpenAI if fetch failed
      }

      // Otherwise, call OpenAI or local health API
      if (openaiAPI.isConfigured()) {
        safeLog("OpenAI API configured, using it for search");
        const openaiResult = await openaiAPI.searchHealthInfo(query);
        safeLog("OpenAI search result", openaiResult);
        return {
          ...openaiResult,
          dataSource: 'openai'
        };
      } else {
        safeLog("OpenAI API not configured, using fallback");
        const localResult = await healthAPI.searchHealthInfo(query);
        return {
          ...localResult,
          dataSource: 'local'
        };
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw error; // Let caller handle abort errors
      }
      safeLog("Error in health search", error);
      return getErrorResponse(query);
    }
  },

  async searchByBarcode(barcode: string) {
    try {
      const nutritionData = await fetchNutritionData(barcode);
      return nutritionData;
    } catch (error) {
      console.error('Error in barcode search:', error);
      return getErrorResponse(`food with barcode ${barcode}`);
    }
  },

  // Add missing checkServiceStatus method
  async checkServiceStatus() {
    try {
      const response = await fetch('http://localhost:5000/api/status', {
        method: 'GET',
      });
      
      if (!response.ok) {
        return { status: 'error', message: 'Service is not responding properly' };
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error checking service status:", error);
      return { status: 'offline', message: 'Service is offline or unreachable' };
    }
  }
};