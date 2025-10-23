// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Enhanced Model API - Production endpoints
  WIHY_ENHANCED_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
  WIHY_ENHANCED_API_BACKUP: process.env.REACT_APP_WIHY_BACKUP_URL || 'http://40.125.85.74',
  WIHY_ENHANCED_API_CONTAINER: process.env.REACT_APP_WIHY_CONTAINER_URL || 'https://vhealth-wihy-ml-api.gentlebush-f35a13de.westus2.azurecontainerapps.io',
  
  // Legacy endpoints (deprecated - use enhanced API)
  WIHY_UNIFIED_API_URL: process.env.REACT_APP_WIHY_LEGACY_URL || 'http://wihymlapi.westus2.cloudapp.azure.com',
  BASE_URL: process.env.REACT_APP_API_URL || 'http://wihymlapi.westus2.cloudapp.azure.com/api',
  OPENFOODFACTS_URL: process.env.REACT_APP_OPENFOODFACTS_URL || 'https://world.openfoodfacts.org/api/v0',
  NEWS_API_URL: process.env.REACT_APP_NEWS_API_URL || 'https://services.wihy.ai',
  READABILITY_API_URL: process.env.REACT_APP_READABILITY_API_URL || 'https://readability.com/api',
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

// Helper function to get full API endpoint (legacy)
export const getApiEndpoint = (path: string = '') => {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/api$/, ''); // Remove /api if present
  return `${baseUrl}/api${path}`;
};

// Helper function to get WiHy Unified API endpoint (legacy)
export const getWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_UNIFIED_API_URL}${path}`;
};

// Enhanced Model API Health Check
export const WIHY_HEALTH_CHECK_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/health`;
export const WIHY_DOCS_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/docs`;

// Image Scanner Integration
export const WIHY_SCAN_IMAGE_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scan-image`;
export const WIHY_SCAN_BARCODE_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scan-barcode`;
export const WIHY_SCANNER_STATUS_URL = `${API_CONFIG.WIHY_ENHANCED_API_URL}/wihy/scanner-status`;

export default API_CONFIG;