/**
 * Environment Variable Type Definitions
 * ======================================
 * TypeScript declarations for environment variables loaded from .env
 */

declare module '@env' {
  // 📱 WIHY Native App (iOS/Android)
  export const EXPO_PUBLIC_WIHY_NATIVE_CLIENT_ID: string;
  export const EXPO_PUBLIC_WIHY_NATIVE_CLIENT_SECRET: string;

  // 🔧 WIHY Services API (Backend)
  export const EXPO_PUBLIC_WIHY_SERVICES_CLIENT_ID: string;
  export const EXPO_PUBLIC_WIHY_SERVICES_CLIENT_SECRET: string;

  // 🤖 WIHY ML Platform
  export const EXPO_PUBLIC_WIHY_ML_CLIENT_ID: string;
  export const EXPO_PUBLIC_WIHY_ML_CLIENT_SECRET: string;

  // 🌐 WIHY Frontend (Web)
  export const EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_ID: string;
  export const EXPO_PUBLIC_WIHY_FRONTEND_CLIENT_SECRET: string;

  // API Endpoints
  export const EXPO_PUBLIC_AUTH_URL: string;
  export const EXPO_PUBLIC_SERVICES_URL: string;
  export const EXPO_PUBLIC_ML_URL: string;
  export const EXPO_PUBLIC_COACHING_URL: string;
  export const EXPO_PUBLIC_FITNESS_URL: string;

  // Stripe
  export const EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  // Push Notifications
  export const EXPO_PUBLIC_PROJECT_ID: string;
}
