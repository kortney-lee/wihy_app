// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Enhanced Model API - Production endpoints (ONLY ENDPOINT WE USE)
  WIHY_ENHANCED_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
  WIHY_ENHANCED_API_BACKUP: process.env.REACT_APP_WIHY_BACKUP_URL || 'http://40.125.85.74',
  WIHY_ENHANCED_API_CONTAINER: process.env.REACT_APP_WIHY_CONTAINER_URL || 'https://vhealth-wihy-ml-api.gentlebush-f35a13de.westus2.azurecontainerapps.io',
  
  // Legacy endpoints (DEPRECATED - DO NOT USE)
  // These are kept for reference but should not be called
  WIHY_UNIFIED_API_URL: 'DEPRECATED',
  BASE_URL: 'DEPRECATED',
  OPENFOODFACTS_URL: 'DEPRECATED',
  NEWS_API_URL: 'DEPRECATED', 
  READABILITY_API_URL: 'DEPRECATED',
} as const;

// WIHY Enhanced Model API endpoint (2,325 training examples active)
export const WIHY_API_ENDPOINT = `${API_CONFIG.WIHY_ENHANCED_API_URL}/ask`;

// Helper function to get enhanced API endpoint with fallback
export const getEnhancedWihyEndpoint = (path: string = '', usePrimary: boolean = true) => {
  const endpoints = [
    API_CONFIG.WIHY_ENHANCED_API_URL,      // Primary: https://ml.wihy.ai
    API_CONFIG.WIHY_ENHANCED_API_BACKUP,   // Backup: http://40.125.85.74  
    API_CONFIG.WIHY_ENHANCED_API_CONTAINER // Container: Azure Container Apps
  ];
  
  const baseUrl = usePrimary ? endpoints[0] : endpoints[Math.floor(Math.random() * endpoints.length)];
  return `${baseUrl}${path}`;
};

// DEPRECATED FUNCTIONS - DO NOT USE - Redirect to enhanced API
export const getApiEndpoint = (path: string = '') => {
  console.warn('DEPRECATED: getApiEndpoint() called. Use getEnhancedWihyEndpoint() instead.');
  return getEnhancedWihyEndpoint(path);
};

export const getWihyEndpoint = (path: string = '') => {
  console.warn('DEPRECATED: getWihyEndpoint() called. Use getEnhancedWihyEndpoint() instead.');
  return getEnhancedWihyEndpoint(path);
};

// Enhanced Model API Health Check
export const WIHY_HEALTH_CHECK_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/health`;
export const WIHY_DOCS_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/docs`;

// Image Scanner Integration
export const WIHY_SCAN_IMAGE_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scan-image`;
export const WIHY_SCAN_BARCODE_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scan-barcode`;
export const WIHY_SCANNER_STATUS_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scanner-status`;

export default API_CONFIG;