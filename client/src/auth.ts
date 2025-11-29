// ============================================================
// WIHY AUTH API - MAIN EXPORTS
// ============================================================
// Central export file for all authentication-related modules

// Services
export { authService } from './services/authService';
export type {
  User,
  AuthState,
  RegisterRequest,
  LoginRequest,
  LoginResponse,
  SessionResponse,
  AuthProvider as AuthProviderType,
  HealthResponse
} from './services/authService';

// Context
export { AuthProvider, useAuth } from './contexts/AuthContext';
export { default as AuthContext } from './contexts/AuthContext';

// Components
export { default as MultiAuthLogin } from './components/shared/MultiAuthLogin';
export { default as ProtectedRoute } from './components/auth/ProtectedRoute';
export type { AuthProvider as AuthProviderConfig } from './components/shared/MultiAuthLogin';

// Configuration
export { API_CONFIG } from './config/apiConfig';
