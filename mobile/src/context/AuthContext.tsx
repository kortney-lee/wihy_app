import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, UserData } from '../services/authService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { appleAuthService } from '../services/appleAuthService';
import { getPlanCapabilities, Capabilities } from '../utils/capabilities';

interface UserPreferences {
  notifications: boolean;
  biometrics: boolean;
  darkMode: boolean;
  analytics: boolean;
  autoScan: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  provider: string;
  memberSince: string;
  healthScore: number;
  streakDays: number;
  preferences: UserPreferences;
  
  // Plan-based access control (NEW)
  plan: 'free' | 'premium' | 'family-basic' | 'family-pro' | 'family-premium' | 'coach' | 'coach-family' 
    | 'workplace-core' | 'workplace-plus' | 'corporate-enterprise' | 'k12-school' 
    | 'university' | 'hospital' | 'hospitality';
  addOns?: string[];  // e.g., ['ai', 'instacart']
  capabilities: Capabilities;
  
  // Onboarding state
  isFirstTimeUser?: boolean;  // Indicates if user should see onboarding flow
  onboardingCompleted?: boolean;  // Tracks if onboarding has been completed
  
  // Family info (if applicable)
  familyId?: string;
  familyRole?: 'owner' | 'member';
  guardianCode?: string;  // For family plans
  
  // Coach info (if applicable)
  coachId?: string;
  commissionRate?: number;
  
  // B2B/Enterprise info (if applicable)
  organizationId?: string;
  organizationRole?: 'admin' | 'user' | 'student' | 'employee';
  
  // Legacy field (deprecated, keep for migration)
  userRole?: 'user' | 'coach' | 'parent' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (provider: string, credentials?: any) => Promise<User>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<User>;
  createAccountAfterPayment: (data: {
    email: string;
    password: string;
    planId: string;
    stripeSessionId?: string;
  }) => Promise<User>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  signOut: async () => {
    throw new Error('AuthContext not initialized');
  },
  updateUser: async () => {
    throw new Error('AuthContext not initialized');
  },
  createAccountAfterPayment: async () => {
    throw new Error('AuthContext not initialized');
  },
});

interface AuthProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'wihy_user_data';
const defaultPreferences: UserPreferences = {
  notifications: true,
  biometrics: false,
  darkMode: false,
  analytics: true,
  autoScan: true,
};

const normalizeUser = (userData: Omit<User, 'preferences'> & { preferences?: Partial<UserPreferences> }): User => ({
  ...userData,
  preferences: { ...defaultPreferences, ...userData.preferences },
});

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user data on app start
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // First check if we have a valid session
      const sessionValid = await authService.verifySession();
      
      if (sessionValid.valid && sessionValid.user) {
        // Convert UserData to User format
        const userData = await convertUserData(sessionValid.user);
        setUser(userData);
      } else {
        // Try loading from local storage as fallback
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          setUser(normalizeUser(JSON.parse(storedData)));
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const convertUserData = async (authUser: UserData): Promise<User> => {
    // Try to get existing preferences or use defaults
    const storedData = await AsyncStorage.getItem(STORAGE_KEY);
    const existingData = storedData ? JSON.parse(storedData) : null;
    const existingPrefs = existingData?.preferences || defaultPreferences;
    
    // Check if this is a first-time user (no stored data = new signup)
    const isFirstTimeUser = !existingData;
    
    // Determine plan and capabilities
    // In production, this would come from backend/GHL tags
    const plan = existingData?.plan || 'free';
    const addOns = existingData?.addOns || [];
    const capabilities = getPlanCapabilities(plan, addOns);
    
    return {
      id: authUser.id || `${authUser.provider}-${Date.now()}`,
      name: authUser.name,
      email: authUser.email,
      picture: authUser.profile_data?.picture,
      provider: authUser.provider,
      memberSince: authUser.profile_data?.memberSince || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      healthScore: authUser.profile_data?.healthScore || 85,
      streakDays: authUser.profile_data?.streakDays || 0,
      preferences: existingPrefs,
      plan,
      addOns,
      capabilities,
      isFirstTimeUser,  // Mark new users
      onboardingCompleted: existingData?.onboardingCompleted || false,
      familyId: existingData?.familyId,
      familyRole: existingData?.familyRole,
      guardianCode: existingData?.guardianCode,
      coachId: existingData?.coachId,
      commissionRate: existingData?.commissionRate,
      userRole: existingData?.userRole, // Keep for backward compatibility
    };
  };

  const saveUserData = async (userData: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  };

  const signIn = async (provider: string, credentials?: any): Promise<User> => {
    setLoading(true);

    try {
      let userData: User;

      switch (provider) {
        case 'email':
          userData = await handleEmailAuth(credentials);
          break;
        case 'google':
          userData = await handleGoogleAuth();
          break;
        case 'apple':
          userData = await handleAppleAuth();
          break;
        case 'microsoft':
          userData = await handleMicrosoftAuth();
          break;
        case 'facebook':
          userData = await handleFacebookAuth();
          break;
        case 'dev':
          userData = await handleDevAuth(credentials);
          break;
        default:
          throw new Error('Unsupported provider');
      }

      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      await saveUserData(normalizedUser);
      return normalizedUser;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);

    try {
      // Clean up enhanced auth features
      await enhancedAuthService.cleanup();
      
      // Logout from auth service
      await authService.logout();
      
      // Clear local storage
      await AsyncStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<User> => {
    if (!user) {
      throw new Error('No user to update');
    }

    // Handle plan/add-on updates - recompute capabilities
    let updatedCapabilities = user.capabilities;
    if (userData.plan || userData.addOns) {
      const newPlan = userData.plan || user.plan;
      const newAddOns = userData.addOns || user.addOns || [];
      updatedCapabilities = getPlanCapabilities(newPlan, newAddOns);
    }

    const updatedUser: User = normalizeUser({
      ...user,
      ...userData,
      capabilities: updatedCapabilities,
      preferences: {
        ...user.preferences,
        ...userData.preferences,
      },
    });

    setUser(updatedUser);
    await saveUserData(updatedUser);
    return updatedUser;
  };

  // Authentication functions using WIHY Auth Service
  const handleEmailAuth = async (credentials: { 
    email: string; 
    password: string; 
    name?: string; 
    isRegister?: boolean;
    phone?: string;
    plan?: string;
    referralCode?: string;
  }): Promise<User> => {
    let authResult;
    
    if (credentials.isRegister && credentials.name) {
      // Register new user
      authResult = await authService.register(
        credentials.email,
        credentials.password,
        credentials.name,
        {
          phone: credentials.phone,
          plan: credentials.plan || 'free',
          referralCode: credentials.referralCode,
        }
      );
    } else {
      // Login existing user
      authResult = await authService.login(
        credentials.email,
        credentials.password
      );
    }

    console.log('=== AUTH CONTEXT: authResult ===');
    console.log('authResult.success:', authResult.success);
    console.log('authResult.user:', authResult.user);
    console.log('authResult.data:', authResult.data);
    console.log('Full authResult:', JSON.stringify(authResult, null, 2));

    if (!authResult.success || !authResult.user) {
      console.log('=== AUTH CONTEXT: FAILING ===');
      console.log('Reason: success=', authResult.success, 'user=', authResult.user);
      throw new Error(authResult.error || 'Authentication failed');
    }

    return convertUserData(authResult.user);
  };

  const handleGoogleAuth = async (): Promise<User> => {
    // Use enhanced OAuth flow with WebView
    const result = await enhancedAuthService.authenticateWithOAuth('google');
    
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Google authentication failed');
    }
    
    return convertUserData(result.user);
  };

  const handleFacebookAuth = async (): Promise<User> => {
    // Use enhanced OAuth flow with WebView
    const result = await enhancedAuthService.authenticateWithOAuth('facebook');
    
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Facebook authentication failed');
    }
    
    return convertUserData(result.user);
  };

  const handleAppleAuth = async (): Promise<User> => {
    // Use Apple Sign-In service
    const result = await appleAuthService.signInWithApple();
    
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Apple authentication failed');
    }
    
    return convertUserData(result.user);
  };

  const handleMicrosoftAuth = async (): Promise<User> => {
    // Use enhanced OAuth flow with WebView
    const result = await enhancedAuthService.authenticateWithOAuth('microsoft');
    
    if (!result.success || !result.user) {
      throw new Error(result.error || 'Microsoft authentication failed');
    }
    
    return convertUserData(result.user);
  };

  const handleDevAuth = async (credentials?: { email?: string; name?: string }): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      id: 'test_user', // Always use test_user for dev mode to match backend test data
      name: credentials?.name || 'Dev User',
      email: credentials?.email || 'dev@wihy.app',
      provider: 'dev',
      memberSince: 'January 2024',
      healthScore: 99,
      streakDays: 42,
      preferences: { ...defaultPreferences },
      plan: 'premium', // Give dev user full access for testing
      addOns: ['ai', 'instacart'],
      capabilities: getPlanCapabilities('premium', ['ai', 'instacart']),
    };
  };

  // Create account after successful Stripe payment (new subscription flow)
  const createAccountAfterPayment = async (data: {
    email: string;
    password: string;
    planId: string;
    stripeSessionId?: string;
  }): Promise<User> => {
    setLoading(true);
    
    try {
      // Register with the backend, linking to the Stripe payment
      const authResult = await authService.registerAfterPayment(
        data.email,
        data.password,
        {
          planId: data.planId,
          stripeSessionId: data.stripeSessionId,
        }
      );

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || 'Failed to create account');
      }

      // Convert to User format and set state
      const userData = await convertUserData(authResult.user);
      
      // Mark as new user with the purchased plan
      const planFromId = data.planId.replace('-yearly', '').replace('-monthly', '') as User['plan'];
      userData.plan = planFromId;
      userData.capabilities = getPlanCapabilities(planFromId, []);
      userData.isFirstTimeUser = true;
      
      const normalizedUser = normalizeUser(userData);
      setUser(normalizedUser);
      await saveUserData(normalizedUser);
      
      return normalizedUser;
    } catch (error) {
      console.error('Create account after payment error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    updateUser,
    createAccountAfterPayment,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper hook for easy access to user data
export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return {
    ...context,
    userId: context.user?.id || 'test_user', // Fallback for development
    coachId: context.user?.coachId || 'coach_123', // Fallback for development
    isCoach: context.user?.plan?.includes('coach') || false,
    isAuthenticated: !!context.user,
  };
};
