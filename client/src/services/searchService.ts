// Enhanced searchService to use WiHy Enhanced Model API only

import { wihyAPI } from './wihyAPI';

export interface SearchResult {
  text: string;
  source: string;
  qualityScore?: number;
  details?: string;
  citations?: string[];
  recommendations?: string[];
  disclaimer?: string;
}

export const searchHealthAPI = async (query: string): Promise<SearchResult> => {
  try {
    console.log("Searching for:", query);
    
    // Use WiHy Health Intelligence API v4.0.0 exclusively
    const response = await wihyAPI.askHealthQuestion({ query });
    
    console.log("WiHy API v4.0.0 response:", response);
    
    return {
      text: response.data.response || "No information found",
      source: "WiHy Health Intelligence v4.0.0",
      qualityScore: 0.95, // High quality for WiHy responses
      details: response.data.response || "",
      citations: [`WiHy Health Intelligence v4.0.0 (${response.data.processor_used})`],
      recommendations: response.data.health_insights.recommendations || [],
      disclaimer: "This information is provided by WiHy Health Intelligence v4.0.0. Please consult healthcare professionals for medical advice."
    };
  } catch (error) {
    console.error('Error calling WiHy Enhanced API:', error);
    // Return a valid SearchResult even in case of error
    return {
      text: `Sorry, we encountered an error while searching for information about "${query}".`,
      source: "error",
      qualityScore: 0,
      details: `We couldn't retrieve data for "${query}". Please check your network connection or try a different search term.`,
      citations: [],
      recommendations: ["Try a different search term", "Check your network connection"],
      disclaimer: "This is an error message, not medical advice."
    };
  }
};

// Mock search function for development and fallbacks
export const mockSearchAPI = async (query: string): Promise<SearchResult> => {
  console.log("Using mock search for:", query);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For blueberries, provide detailed mock data
  if (query.toLowerCase().includes('blueberr')) {
    return {
      text: `# Blueberries\n\nBlueberries are perennial flowering plants with blue or purple berries. They are classified in the section Cyanococcus within the genus Vaccinium.\n\n## Nutrition Facts\n\nBlueberries are low in calories but high in fiber, vitamin C, vitamin K and manganese.`,
      source: 'local',
      qualityScore: 0.8,
      details: `# Blueberries\n\nBlueberries are perennial flowering plants with blue or purple berries. They are classified in the section Cyanococcus within the genus Vaccinium.\n\n## Nutrition Facts\n\nBlueberries are low in calories but high in fiber, vitamin C, vitamin K and manganese. One cup (148 grams) of blueberries contains:\n\n- Calories: 84\n- Fiber: 3.6g\n- Vitamin C: 24% of RDI\n- Vitamin K: 36% of RDI\n- Manganese: 25% of RDI\n\n## Health Benefits\n\n- High in Antioxidants: Blueberries are believed to contain the highest antioxidant capacity among common fruits and vegetables.\n- May Reduce DNA Damage: Oxidative DNA damage is an unavoidable part of daily life, but blueberries can help neutralize some free radicals that damage your DNA.\n- May Protect Cholesterol: Blueberries may reduce LDL oxidation, a crucial step in heart disease development.\n- May Lower Blood Pressure: Regular blueberry intake is linked to lower blood pressure.`,
      citations: ["USDA Food Database", "Harvard Health Publishing"],
      recommendations: ["Add blueberries to your breakfast", "Try frozen blueberries for smoothies"],
      disclaimer: "This information is for educational purposes only and not intended as medical advice."
    };
  }
  
  return {
    text: `# Information about ${query}\n\nThis is mock data for development purposes.`,
    source: 'mock_api',
    qualityScore: 0.75,
    details: `# Information about ${query}\n\nThis is mock data for development purposes. In a real app, this would be actual information about ${query} from an AI service or database.\n\n## Key Points\n- ${query} contains nutrients\n- It's part of a balanced diet\n- Consult with healthcare professionals for specific advice`,
    citations: ["Mock Database"],
    recommendations: ["Maintain a balanced diet", "Consult healthcare professionals for personalized advice"],
    disclaimer: "This is mock data for development purposes only, not medical advice."
  };
};

// Export a unified search function that tries the API first, then falls back to mock
export const searchHealth = async (query: string): Promise<SearchResult> => {
  try {
    return await searchHealthAPI(query);
  } catch (error) {
    console.error("API search failed, falling back to mock:", error);
    return mockSearchAPI(query);
  }
};

export default searchHealth;