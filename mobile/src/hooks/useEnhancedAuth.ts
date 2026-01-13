/**
 * Enhanced Authentication Hook
 * Provides biometric auth, OAuth WebView, and auto token refresh
 */

import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { enhancedAuthService, BiometricCapability } from '../services/enhancedAuthService';

export function useEnhancedAuth() {
  const [biometricCapability, setBiometricCapability] = useState<BiometricCapability | null>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load initial settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [capability, settings] = await Promise.all([
      enhancedAuthService.checkBiometricCapability(),
      enhancedAuthService.getEnhancementSettings(),
    ]);

    setBiometricCapability(capability);
    setBiometricEnabled(settings.biometricEnabled);
    setAutoRefreshEnabled(settings.autoRefreshEnabled);
  };

  /**
   * Enable biometric authentication
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const success = await enhancedAuthService.enableBiometricLogin();
      if (success) {
        setBiometricEnabled(true);
      }
      return success;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disable biometric authentication
   */
  const disableBiometric = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await enhancedAuthService.disableBiometricLogin();
      setBiometricEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Login with biometric authentication
   */
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      return await enhancedAuthService.loginWithBiometrics();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Authenticate using OAuth provider with WebView
   */
  const loginWithOAuth = useCallback(async (
    provider: 'google' | 'facebook' | 'microsoft'
  ): Promise<{ success: boolean; user?: any; error?: string }> => {
    setLoading(true);
    try {
      return await enhancedAuthService.authenticateWithOAuth(provider);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Enable automatic token refresh
   */
  const enableAutoRefresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await enhancedAuthService.startAutoTokenRefresh();
      setAutoRefreshEnabled(true);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Disable automatic token refresh
   */
  const disableAutoRefresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await enhancedAuthService.stopAutoTokenRefresh();
      setAutoRefreshEnabled(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Manually trigger token refresh
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      return await enhancedAuthService.checkAndRefreshToken();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get biometric type name for display
   */
  const getBiometricTypeName = (): string => {
    if (!biometricCapability?.available) return 'Biometric';
    
    if (biometricCapability.supportsFaceID) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    }
    
    if (biometricCapability.supportsTouchID) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    }
    
    return 'Biometric';
  };

  return {
    // State
    biometricCapability,
    biometricEnabled,
    autoRefreshEnabled,
    loading,
    
    // Biometric methods
    enableBiometric,
    disableBiometric,
    loginWithBiometric,
    getBiometricTypeName,
    
    // OAuth methods
    loginWithOAuth,
    
    // Token refresh methods
    enableAutoRefresh,
    disableAutoRefresh,
    refreshToken,
    
    // Utility
    reload: loadSettings,
  };
}
