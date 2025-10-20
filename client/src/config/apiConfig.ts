// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Unified API - Single endpoint for all health and nutrition requests
  WIHY_UNIFIED_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
  
  // Legacy endpoints (for fallback if needed)
  BASE_URL: process.env.REACT_APP_API_URL || 'https://services.wihy.ai/api',
  OPENFOODFACTS_URL: process.env.REACT_APP_OPENFOODFACTS_URL || 'https://world.openfoodfacts.org/api/v0',
  NEWS_API_URL: process.env.REACT_APP_NEWS_API_URL || 'https://services.wihy.ai',
  READABILITY_API_URL: process.env.REACT_APP_READABILITY_API_URL || 'https://readability.com/api',
} as const;

// WIHY Unified API endpoint (corrected to match documentation)
export const WIHY_API_ENDPOINT = `${API_CONFIG.WIHY_UNIFIED_API_URL}/ask`;

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