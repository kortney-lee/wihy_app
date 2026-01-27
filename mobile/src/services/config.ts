// API Configuration
// Using Expo's built-in env support (SDK 53+)
// Note: EXPO_PUBLIC_ prefix required for client-side env vars
//
// WIHY Microservices Architecture:
// - Auth Service (auth.wihy.ai): Authentication, login, register, token validation
// - User Service (user.wihy.ai): User profiles, preferences, family/coach data
// - Services API (services.wihy.ai): Barcode scanning, meal tracking, workouts
// - ML API (ml.wihy.ai): AI chat, health questions, personalized recommendations
// - Payment Service (payment.wihy.ai): Stripe integration, subscriptions
//
// See complete API docs: docs/WIHY_API_REFERENCE.md

export const API_CONFIG = {
  baseUrl: 'https://services.wihy.ai',
  servicesUrl: 'https://services.wihy.ai', // Services API (scanning, meals, workouts)
  mlApiUrl: 'https://ml.wihy.ai', // ML API for chat/ask
  authUrl: 'https://auth.wihy.ai', // Auth service (login, register, tokens)
  paymentUrl: 'https://payment.wihy.ai', // Payment service (Stripe)
  userUrl: 'https://user.wihy.ai', // User service (profiles, preferences)
  coachingUrl: 'https://services.wihy.ai', // Coaching service
  expoProjectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id', // For push notifications
  
  // Client credentials for API auth
  // App credentials (for auth.wihy.ai - login, register, verify)
  appClientId: process.env.EXPO_PUBLIC_WIHY_APP_CLIENT_ID || '',
  appClientSecret: process.env.EXPO_PUBLIC_WIHY_APP_CLIENT_SECRET || '',
  // Services API credentials (for services.wihy.ai)
  servicesClientId: process.env.EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID || '',
  servicesClientSecret: process.env.EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET || '',
  // ML API credentials (for ml.wihy.ai)
  mlClientId: process.env.EXPO_PUBLIC_WIHY_ML_CLIENT_ID || '',
  mlClientSecret: process.env.EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET || '',
  
  endpoints: {
    scan: '/api/scan', // Barcode scan endpoint
    scanPhoto: '/api/scan/photo', // Food photo analysis
    scanLabel: '/api/scan/label', // Label scanning (greenwashing detection)
    labelScan: '/api/scan/label', // Alias for label scanning
    scanHistory: '/api/scan/history',
    pillScan: '/api/v1/medications/pills/scan', // Pill identification
    pillConfirm: '/api/v1/medications/pills/confirm', // Pill confirmation
    labelByNdc: '/api/scan/product', // NDC lookup
    // ML Chat API endpoints (v3.0 - Jan 2026)
    // See docs: WIHY_ML_CLIENT_API.md
    // All chat now goes through /ask with client-generated sessionId
    ask: '/ask', // Universal entry point - all chat goes here
    // Session retrieval endpoints (still valid)
    chatHistory: '/chat/session', // Get session history: /{session_id}/history
    chatMySessions: '/chat/me/sessions', // Get authenticated user's sessions
    fdaIngredient: '/api/openfda/ingredient',
  },
  timeout: 30000, // 30 seconds
};

/**
 * Get auth headers for App API calls (auth.wihy.ai - login, register, verify)
 */
export const getAppAuthHeaders = () => ({
  'X-Client-ID': API_CONFIG.appClientId,
  'X-Client-Secret': API_CONFIG.appClientSecret,
});

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
