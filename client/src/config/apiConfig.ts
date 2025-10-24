// Environment configuration for API endpoints
export const API_CONFIG = {
  // WIHY Enhanced Model API - Production endpoint (ONLY ENDPOINT WE USE)
  WIHY_API_URL: process.env.REACT_APP_WIHY_API_URL || 'https://ml.wihy.ai',
} as const;

// WIHY Enhanced Model API endpoints (following integration guide)
export const WIHY_API_ENDPOINT = `${API_CONFIG.WIHY_API_URL}/ask`;
export const WIHY_HEALTH_CHECK_URL = `${API_CONFIG.WIHY_API_URL}/health`;
export const WIHY_SCAN_ENDPOINT = `${API_CONFIG.WIHY_API_URL}/scan`;
export const WIHY_DOCS_URL = `${API_CONFIG.WIHY_API_URL}/docs`;

// Legacy compatibility - these now point to the correct endpoints
export const WIHY_SCAN_IMAGE_URL = WIHY_SCAN_ENDPOINT;
export const WIHY_SCAN_BARCODE_URL = WIHY_API_ENDPOINT; // Barcodes go through /ask endpoint

// Legacy compatibility functions
export const getApiEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export const getWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export const getEnhancedWihyEndpoint = (path: string = '') => {
  return `${API_CONFIG.WIHY_API_URL}${path}`;
};

export default API_CONFIG;