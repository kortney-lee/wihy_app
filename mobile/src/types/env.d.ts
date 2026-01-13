/**
 * Environment Variable Type Definitions
 * ======================================
 * TypeScript declarations for environment variables loaded from .env
 */

declare module '@env' {
  // 📱 WIHY Native App (iOS/Android)
  export const WIHY_NATIVE_CLIENT_ID: string;
  export const WIHY_NATIVE_CLIENT_SECRET: string;

  // 🔧 WIHY Services API (Backend)
  export const WIHY_SERVICES_CLIENT_ID: string;
  export const WIHY_SERVICES_CLIENT_SECRET: string;

  // 🤖 WIHY ML Platform
  export const WIHY_ML_CLIENT_ID: string;
  export const WIHY_ML_CLIENT_SECRET: string;

  // 🌐 WIHY Frontend (Web)
  export const WIHY_FRONTEND_CLIENT_ID: string;
  export const WIHY_FRONTEND_CLIENT_SECRET: string;
}
