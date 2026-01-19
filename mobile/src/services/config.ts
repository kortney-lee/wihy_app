// API Configuration
// Using Expo's built-in env support (SDK 53+)
// Note: EXPO_PUBLIC_ prefix required for client-side env vars

export const API_CONFIG = {
  baseUrl: 'https://services.wihy.ai',
  servicesUrl: 'https://services.wihy.ai', // Services API
  mlApiUrl: 'https://ml.wihy.ai', // ML API for chat/ask
  authUrl: 'https://auth.wihy.ai', // Auth service
  paymentUrl: 'https://payment.wihy.ai', // Payment service (Stripe) - fallback: wihy-payment-service-xxx.run.app
  userUrl: 'https://user.wihy.ai', // User service - fallback: wihy-user-service-xxx.run.app
  expoProjectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id', // For push notifications
  
  // Client credentials for service-to-service auth
  servicesClientId: process.env.EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID || '',
  servicesClientSecret: process.env.EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET || '',
  mlClientId: process.env.EXPO_PUBLIC_WIHY_ML_CLIENT_ID || '',
  mlClientSecret: process.env.EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET || '',
  
  endpoints: {
    scan: '/api/scan', // Barcode scan endpoint
    scanPhoto: '/api/scan/photo', // Food photo analysis
    scanLabel: '/api/scan/label', // Label scanning (greenwashing detection)
    scanHistory: '/api/scan/history',
    pillScan: '/api/v1/medications/pills/scan', // Pill identification
    pillConfirm: '/api/v1/medications/pills/confirm', // Pill confirmation
    labelByNdc: '/api/scan/product', // NDC lookup
    // ML Chat API endpoints
    ask: '/api/chat/public/ask', // Public ask endpoint (stateless, no auth)
    askProtected: '/ask', // Protected ask endpoint (requires Bearer token)
    chatStartSession: '/api/chat/start-session', // Start a chat session
    chatSendMessage: '/api/chat/send-message', // Send message in session
    chatHistory: '/api/chat/session', // Get session history: {id}/history
    chatUserSessions: '/api/chat/user', // Get user sessions: {userId}/sessions
    fdaIngredient: '/api/openfda/ingredient',
  },
  timeout: 30000, // 30 seconds
};

/**
 * Get auth headers for Services API calls
 */
export const getServicesAuthHeaders = () => ({
  'X-Client-ID': API_CONFIG.servicesClientId,
  'X-Client-Secret': API_CONFIG.servicesClientSecret,
});

/**
 * Get auth headers for ML API calls
 */
export const getMLAuthHeaders = () => ({
  'X-Client-ID': API_CONFIG.mlClientId,
  'X-Client-Secret': API_CONFIG.mlClientSecret,
});

// Auth Configuration (re-export from authService)
export { AUTH_CONFIG } from './authService';

// User context for API calls
export const getDefaultUserContext = () => ({
  userId: 'mobile-user',
  trackHistory: true,
  health_goals: ['nutrition_analysis'],
  dietary_restrictions: [],
});
