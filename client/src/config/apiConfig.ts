// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Unified API - Single endpoint for all health and nutrition requests
  WIHY_UNIFIED_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://wihy-main-api.graypebble-2c416c49.westus2.azurecontainerapps.io',
  
  // Legacy endpoints (for fallback if needed)
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  OPENFOODFACTS_URL: process.env.REACT_APP_OPENFOODFACTS_URL || 'https://world.openfoodfacts.org/api/v0',
  NEWS_API_URL: process.env.REACT_APP_NEWS_API_URL || 'https://newsapi.org/v2',
  READABILITY_API_URL: process.env.REACT_APP_READABILITY_API_URL || 'https://readability.com/api',
} as const;

// WIHY Unified API endpoint (corrected to match documentation)
export const WIHY_API_ENDPOINT = `${API_CONFIG.WIHY_UNIFIED_API_URL}/wihy/api`;

// Helper function to get full API endpoint (legacy)
export const getApiEndpoint = (path: string = '') => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/api$/, ''); // Remove /api if present
  return `${baseUrl}/api${path}`;
};

// Helper function to get WiHy Unified API endpoint
export const getWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_UNIFIED_API_URL}${path}`;
};

export default API_CONFIG;