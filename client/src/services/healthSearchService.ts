import openaiAPI, { openaiAPI as openaiService } from './openaiAPI';
import { healthAPI } from './healthAPI';
import axios from 'axios';

interface HealthSearchResult {
  summary: string;
  details: string;
  sources: string[];
  relatedTopics: string[];
  recommendations: string[];
  medicalDisclaimer: string;
  dataSource: 'openai' | 'local' | 'error' | 'vnutrition';
}

class HealthSearchService {
  async searchHealthInfo(query: string): Promise<HealthSearchResult> {
    console.log("HealthSearchService: Searching for", query);
    try {
      // If barcode, call nutrition
      if (/^\d{8,14}$/.test(query.trim())) {
        const nutritionResult = await this.fetchNutritionData(query.trim());
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

      // Otherwise, call OpenAI or local health API
      if (openaiAPI.isConfigured()) {
        console.log("OpenAI API configured, using it for search");
        const openaiResult = await openaiAPI.searchHealthInfo(query);
        console.log("OpenAI search result:", openaiResult);
        return {
          ...openaiResult,
          dataSource: 'openai'
        };
      } else {
        console.log("OpenAI API not configured, using fallback");
        const localResult = await healthAPI.searchHealthInfo(query);
        return {
          ...localResult,
          dataSource: 'local'
        };
      }
    } catch (error) {
      console.error("Error in health search:", error);
      return this.getErrorResponse(query);
    }
  }

  private async fetchNutritionData(barcode: string) {
    try {
      const response = await axios.post('/vnutrition/analyze', { barcode });
      const responseData: any = response.data || {};
      return {
        success: responseData.success || false,
        item: responseData.item || '',
        calories_per_serving: responseData.calories_per_serving || 0,
        macros: responseData.macros || { protein: '0g', carbs: '0g', fat: '0g' },
        dataSource: 'vnutrition'
      };
    } catch (error) {
      console.error('vNutrition API failed:', error);
      return null;
    }
  }

  private getErrorResponse(query: string): HealthSearchResult {
    return {
      summary: `We encountered an issue searching for information about "${query}".`,
      details: `We're currently unable to provide detailed health information about "${query}". This could be due to:\n\n• Temporary service issues\n• Network connectivity problems\n• API limitations\n\nPlease try again in a few moments, or consider these general health resources:\n\n• Contact your healthcare provider\n• Visit reputable medical websites like Mayo Clinic or WebMD\n• Call a health information hotline\n• Consult medical reference books`,
      sources: ['Error Response'],
      relatedTopics: ['Healthcare Providers', 'Medical Resources', 'Health Information'],
      recommendations: [
        'Try your search again in a few minutes',
        'Contact a healthcare professional for urgent concerns',
        'Use reputable medical websites for basic information',
        'Keep a list of trusted health resources'
      ],
      medicalDisclaimer: 'For any health concerns, please consult with a qualified healthcare provider. This error message should not delay seeking professional medical advice.',
      dataSource: 'error'
    };
  }

  // Check service availability
  async checkServiceStatus(): Promise<{
    openai: boolean;
    local: boolean;
    recommended: 'openai' | 'local';
  }> {
    const openaiAvailable = openaiAPI.isConfigured();
    const localAvailable = true; // Local service is always available

    return {
      openai: openaiAvailable,
      local: localAvailable,
      recommended: openaiAvailable ? 'openai' : 'local'
    };
  }

  // Add this method for vNutrition integration
  async searchNutritionByBarcode(barcode: string): Promise<any> {
    try {
      const response = await axios.post('/vnutrition/analyze', { barcode });
      const responseData: any = response.data || {};
      return {
        success: responseData.success || false,
        item: responseData.item || '',
        calories_per_serving: responseData.calories_per_serving || 0,
        macros: responseData.macros || { protein: '0g', carbs: '0g', fat: '0g' },
        dataSource: 'vnutrition'
      };
    } catch (error) {
      console.error('vNutrition API failed:', error);
      return {
        summary: `Could not retrieve nutrition info for barcode "${barcode}".`,
        details: 'There was a problem connecting to the nutrition service.',
        dataSource: 'error'
      };
    }
  }

  // Optionally, add a method for image upload as well
  async searchNutritionByImage(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await axios.post('/vnutrition/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const responseData: any = response.data || {};
      return {
        success: responseData.success || false,
        item: responseData.item || '',
        calories_per_serving: responseData.calories_per_serving || 0,
        macros: responseData.macros || { protein: '0g', carbs: '0g', fat: '0g' },
        dataSource: 'vnutrition'
      };
    } catch (error) {
      console.error('vNutrition API failed:', error);
      return {
        summary: `Could not analyze the uploaded image.`,
        details: 'There was a problem connecting to the nutrition service.',
        dataSource: 'error'
      };
    }
  }
}

export const healthSearchService = new HealthSearchService();