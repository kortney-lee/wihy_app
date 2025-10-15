// Environment configuration for API endpoints
export const API_CONFIG = {
  // Base API URL for health search and general services
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  
  // WiHy AI API URL for health analysis
  WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL || 'http://localhost:8000',
  
  // OpenFoodFacts API for food data
  OPENFOODFACTS_URL: process.env.REACT_APP_OPENFOODFACTS_URL || 'https://world.openfoodfacts.org/api/v0',
  
  // News API for health news
  NEWS_API_URL: process.env.REACT_APP_NEWS_API_URL || 'https://newsapi.org/v2',
  
  // Readability API for article processing
  READABILITY_API_URL: process.env.REACT_APP_READABILITY_API_URL || 'https://readability.com/api',
} as const;

// Helper function to get full API endpoint
export const getApiEndpoint = (path: string = '') => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/api$/, ''); // Remove /api if present
  return `${baseUrl}/api${path}`;
};

// Helper function to get WiHy API endpoint
export const getWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export default API_CONFIG;