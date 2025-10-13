import { HealthSearchResult } from '../types';

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
      // For dashboard context, we could integrate with the client app's search
      // or provide a simplified search experience
      // For now, return a placeholder response
      return {
        summary: `Search results for "${query}"`,
        details: `This is a placeholder search result for "${query}". In a full implementation, this would connect to the health search APIs.`,
        sources: ['Dashboard Search'],
        relatedTopics: ['General Health', 'Nutrition', 'Wellness'],
        recommendations: ['Consult healthcare professionals', 'Verify information with medical providers']
      };
    } catch (error) {
      safeLog("HealthSearchService error:", error);
      return getErrorResponse(query);
    }
  }
};