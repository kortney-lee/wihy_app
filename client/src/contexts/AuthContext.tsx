// ============================================================
// AUTHENTICATION CONTEXT
// ============================================================
// Global authentication state management using React Context
// Integrates with wihy_auth API service

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User, AuthState } from '../services/authService';

// ============================================================
// CONTEXT TYPE DEFINITIONS
// ============================================================

interface AuthContextType extends AuthState {
  // Authentication actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  
  // OAuth actions
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  loginWithSamsung: () => Promise<void>;
  
  // Session management
  checkSession: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

// ============================================================
// CONTEXT CREATION
// ============================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// PROVIDER COMPONENT
// ============================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  // Subscribe to auth service state changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((state) => {
      setAuthState(state);
    });

    // Initialize authentication on mount
    authService.initAuth().catch((error) => {
      console.error('Failed to initialize auth:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        error: 'Failed to initialize authentication'
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ============================================================
  // AUTHENTICATION ACTIONS
  // ============================================================

  const login = async (email: string, password: string) => {
    const result = await authService.login(email, password);
    return {
      success: result.success,
      error: result.error
    };
  };

  const register = async (email: string, password: string, name?: string) => {
    const result = await authService.register({
      email,
      password,
      name
    });
    return {
      success: result.success,
      error: result.error
    };
  };

  const logout = async () => {
    await authService.logout();
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    return await authService.changePassword(currentPassword, newPassword);
  };

  // ============================================================
  // OAUTH ACTIONS
  // ============================================================

  const loginWithGoogle = async () => {
    await authService.initiateOAuth('google');
  };

  const loginWithMicrosoft = async () => {
    await authService.initiateOAuth('microsoft');
  };

  const loginWithFacebook = async () => {
    await authService.initiateOAuth('facebook');
  };

  const loginWithApple = async () => {
    await authService.initiateOAuth('apple');
  };

  const loginWithSamsung = async () => {
    await authService.initiateOAuth('samsung');
  };

  // ============================================================
  // SESSION MANAGEMENT
  // ============================================================

  const checkSession = async () => {
    await authService.checkSession();
  };

  const refreshAuth = async () => {
    await authService.initAuth();
  };

  // ============================================================
  // CONTEXT VALUE
  // ============================================================

  const contextValue: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    changePassword,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithFacebook,
    loginWithApple,
    loginWithSamsung,
    checkSession,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// CUSTOM HOOK
// ============================================================

/**
 * Hook to access authentication context
 * @throws Error if used outside AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// ============================================================
// EXPORTS
// ============================================================

export default AuthContext;
