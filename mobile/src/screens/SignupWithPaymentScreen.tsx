/**
 * SignupWithPaymentScreen
 * 
 * Shown after a user completes Stripe payment when they don't have an existing account.
 * Allows them to choose their preferred authentication method:
 * - Email/Password
 * - Google OAuth
 * - Apple OAuth
 * - Facebook OAuth
 * - Microsoft OAuth
 * 
 * The Stripe payment info (customerId, subscriptionId) is passed via route params
 * and linked to the new account during registration.
 * 
 * Flow:
 * 1. User pays via Stripe → PaymentSuccessScreen detects needsSignup=true
 * 2. Redirected here with Stripe customer/subscription IDs
 * 3. User chooses auth method (email/password or OAuth)
 * 4. POST /api/auth/register-with-payment creates account + links Stripe
 * 5. Redirected to ProfileSetup as new user
 */

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';
import { enhancedAuthService } from '../services/enhancedAuthService';
import { appleAuthService } from '../services/appleAuthService';
import { API_CONFIG } from '../services/config';
import { fetchWithLogging } from '../utils/apiLogger';
import SvgIcon from '../components/shared/SvgIcon';

// Key for storing payment info during OAuth flow
const PAYMENT_INFO_KEY = '@wihy_pending_payment_info';

// Theme colors
const theme = {
  background: '#e0f2fe',
  card: '#ffffff',
  cardBorder: '#e5e7eb',
  text: '#1f2937',
  textSecondary: '#6b7280',
  accent: '#3b82f6',
  success: '#22c55e',
  error: '#ef4444',
  inputBg: '#f9fafb',
};

// OAuth provider colors
const providerColors = {
  google: '#4285F4',
  apple: '#000000',
  facebook: '#1877F2',
  microsoft: '#00A4EF',
};

interface SignupWithPaymentParams {
  email: string;
  name?: string;
  plan: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

export default function SignupWithPaymentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { refreshUserContext } = useContext(AuthContext);
  const { theme: themeContext } = useTheme();

  // Get payment info from route params
  const params: SignupWithPaymentParams = route.params || {};
  const { email: prefilledEmail, name: prefilledName, plan, stripeCustomerId, stripeSubscriptionId } = params;

  // Form state
  const [authMethod, setAuthMethod] = useState<'email' | 'oauth' | null>(null);
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState(prefilledName?.split(' ')[0] || '');
  const [lastName, setLastName] = useState(prefilledName?.split(' ').slice(1).join(' ') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check for pending payment info from interrupted OAuth flow
  useEffect(() => {
    const checkPendingPayment = async () => {
      if (Platform.OS !== 'web') {
        try {
          const pendingInfo = await AsyncStorage.getItem(PAYMENT_INFO_KEY);
          if (pendingInfo) {
            console.log('Found pending payment info from previous OAuth attempt');
            // If we have route params, prefer those (they're more recent)
            // Otherwise, we could restore from pending info if needed
            // For now, just log it - the OAuth flow will clean it up when complete
          }
        } catch (err) {
          console.warn('Error checking pending payment info:', err);
        }
      }
    };
    checkPendingPayment();
  }, []);

  // Validate password
  const validatePassword = (): boolean => {
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Handle email/password signup
  const handleEmailSignup = async () => {
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }
    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/auth/register-with-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: email.trim(),
            password,
            name: `${firstName} ${lastName}`.trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            provider: 'local',
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Store tokens
        await storeTokensAndRedirect(data.data.sessionToken, data.data.refreshToken);
      } else {
        setError(data.error || 'Failed to create account');
      }
    } catch (err: any) {
      console.error('Email signup error:', err);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle OAuth signup (Google, Apple, Facebook, Microsoft)
   * 
   * Flow:
   * 1. Store payment info in AsyncStorage (survives app restart)
   * 2. Start OAuth flow (WebBrowser for Google/FB/MS, native for Apple)
   * 3. On OAuth success, get session token
   * 4. Call /register-with-payment to link Stripe payment to new account
   * 5. Store tokens and redirect to ProfileSetup
   */
  const handleOAuthSignup = async (provider: 'google' | 'apple' | 'facebook' | 'microsoft') => {
    setError('');
    setLoading(true);

    try {
      // Store payment info before OAuth redirect (in case app is restarted)
      const paymentInfo = {
        stripeCustomerId,
        stripeSubscriptionId,
        plan,
        email: prefilledEmail,
        name: prefilledName,
      };
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web: Use sessionStorage and redirect
        sessionStorage.setItem('wihy_oauth_payment_info', JSON.stringify(paymentInfo));
        
        const { url, state } = await authService.getWebOAuthUrl(provider);
        window.location.href = url;
        return;
      }
      
      // Native: Store in AsyncStorage before OAuth
      await AsyncStorage.setItem(PAYMENT_INFO_KEY, JSON.stringify(paymentInfo));
      console.log('=== SIGNUP WITH PAYMENT: STARTING NATIVE OAUTH ===');
      console.log('Provider:', provider);
      console.log('Payment info stored for post-OAuth linking');
      
      let oauthResult: { success: boolean; user?: any; sessionToken?: string; error?: string };
      
      if (provider === 'apple') {
        // Use Apple-specific auth service
        oauthResult = await appleAuthService.signInWithApple();
      } else {
        // Use enhanced auth service for Google/Facebook/Microsoft
        oauthResult = await enhancedAuthService.authenticateWithOAuth(provider);
      }
      
      console.log('OAuth result:', {
        success: oauthResult.success,
        hasUser: !!oauthResult.user,
        hasToken: !!oauthResult.sessionToken,
      });
      
      if (!oauthResult.success || !oauthResult.user) {
        throw new Error(oauthResult.error || 'OAuth authentication failed');
      }
      
      // OAuth succeeded - now link Stripe payment to account
      console.log('OAuth successful, linking Stripe payment to account...');
      
      const registerResponse = await fetchWithLogging(
        `${API_CONFIG.authUrl}/api/auth/register-with-payment`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: oauthResult.user.email,
            name: oauthResult.user.name || `${firstName} ${lastName}`.trim(),
            firstName: oauthResult.user.name?.split(' ')[0] || firstName,
            lastName: oauthResult.user.name?.split(' ').slice(1).join(' ') || lastName,
            provider,
            providerId: oauthResult.user.id,
            stripeCustomerId,
            stripeSubscriptionId,
            plan,
          }),
        }
      );

      const registerData = await registerResponse.json();
      console.log('Register-with-payment response:', {
        success: registerData.success,
        hasToken: !!registerData.data?.sessionToken,
        error: registerData.error,
        code: registerData.code,
      });

      // Clear stored payment info
      await AsyncStorage.removeItem(PAYMENT_INFO_KEY);

      if (registerData.success && registerData.data?.sessionToken) {
        // Registration successful - store tokens and redirect
        await storeTokensAndRedirect(
          registerData.data.sessionToken,
          registerData.data.refreshToken || ''
        );
      } else if (registerData.code === 'USER_EXISTS') {
        // User already exists (e.g., they paid but OAuth account already exists)
        // This is OK - the OAuth session is already valid
        console.log('User already exists, using OAuth session');
        
        // Get session token from OAuth result or storage
        const sessionToken = oauthResult.sessionToken || await authService.getSessionToken();
        if (sessionToken) {
          await storeTokensAndRedirect(sessionToken, '');
        } else {
          // Fallback: refresh user context with existing session
          await refreshUserContext();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'ProfileSetup', params: { isOnboarding: true } }],
            })
          );
        }
      } else {
        throw new Error(registerData.error || 'Failed to link payment to account');
      }
    } catch (err: any) {
      console.error('OAuth signup error:', err);
      setError(err.message || 'OAuth authentication failed');
      // Clean up payment info on error
      await AsyncStorage.removeItem(PAYMENT_INFO_KEY).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  // Store tokens and redirect to ProfileSetup
  const storeTokensAndRedirect = async (sessionToken: string, refreshToken: string) => {
    try {
      // Store tokens
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem('authToken', sessionToken);
        localStorage.setItem('accessToken', sessionToken);
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        await authService.storeSessionToken(sessionToken);
      }

      // Refresh user context
      await refreshUserContext();

      // Redirect to ProfileSetup for new users
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = '/ProfileSetup?isOnboarding=true&plan=' + encodeURIComponent(plan);
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'ProfileSetup', params: { isOnboarding: true } }],
          })
        );
      }
    } catch (err) {
      console.error('Failed to store tokens:', err);
      setError('Failed to complete signup. Please try again.');
    }
  };

  // Get plan display name
  const getPlanDisplayName = () => {
    const planMap: Record<string, string> = {
      'pro_monthly': 'Premium ($12.99/mo)',
      'pro_yearly': 'Premium Annual ($99/yr)',
      'family_basic': 'Family Basic ($24.99/mo)',
      'family_pro': 'Family Pro ($49.99/mo)',
      'family_yearly': 'Family Pro Annual ($479.99/yr)',
      'coach': 'Coach Platform ($29.99/mo)',
    };
    return planMap[plan] || plan;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeContext.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Success Header */}
          <View style={styles.header}>
            <View style={styles.successBadge}>
              <SvgIcon name="checkmark-circle" size={48} color={theme.success} />
            </View>
            <Text style={[styles.title, { color: themeContext.colors.text }]}>
              Payment Successful! 🎉
            </Text>
            <Text style={[styles.subtitle, { color: themeContext.colors.textSecondary }]}>
              Complete your account setup to access {getPlanDisplayName()}
            </Text>
          </View>

          {/* Payment Info Card */}
          <View style={[styles.infoCard, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border }]}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeContext.colors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: themeContext.colors.text }]}>{prefilledEmail}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeContext.colors.textSecondary }]}>Plan</Text>
              <Text style={[styles.infoValue, { color: theme.success }]}>{getPlanDisplayName()}</Text>
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={styles.errorContainer}>
              <SvgIcon name="alert-circle" size={20} color={theme.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Auth Method Selection */}
          {authMethod === null && (
            <View style={styles.authOptions}>
              <Text style={[styles.sectionTitle, { color: themeContext.colors.text }]}>
                Choose how to create your account
              </Text>

              {/* OAuth Buttons */}
              <Pressable
                style={[styles.oauthButton, { backgroundColor: providerColors.google }]}
                onPress={() => handleOAuthSignup('google')}
                disabled={loading}
              >
                <SvgIcon name="logo-google" size={24} color="#fff" />
                <Text style={styles.oauthButtonText}>Continue with Google</Text>
              </Pressable>

              {Platform.OS === 'ios' && (
                <Pressable
                  style={[styles.oauthButton, { backgroundColor: providerColors.apple }]}
                  onPress={() => handleOAuthSignup('apple')}
                  disabled={loading}
                >
                  <SvgIcon name="logo-apple" size={24} color="#fff" />
                  <Text style={styles.oauthButtonText}>Continue with Apple</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.oauthButton, { backgroundColor: providerColors.facebook }]}
                onPress={() => handleOAuthSignup('facebook')}
                disabled={loading}
              >
                <SvgIcon name="logo-facebook" size={24} color="#fff" />
                <Text style={styles.oauthButtonText}>Continue with Facebook</Text>
              </Pressable>

              <Pressable
                style={[styles.oauthButton, { backgroundColor: providerColors.microsoft }]}
                onPress={() => handleOAuthSignup('microsoft')}
                disabled={loading}
              >
                <SvgIcon name="logo-microsoft" size={24} color="#fff" />
                <Text style={styles.oauthButtonText}>Continue with Microsoft</Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: themeContext.colors.border }]} />
                <Text style={[styles.dividerText, { color: themeContext.colors.textSecondary }]}>or</Text>
                <View style={[styles.dividerLine, { backgroundColor: themeContext.colors.border }]} />
              </View>

              {/* Email/Password Option */}
              <Pressable
                style={[styles.emailButton, { borderColor: themeContext.colors.border }]}
                onPress={() => setAuthMethod('email')}
                disabled={loading}
              >
                <SvgIcon name="mail" size={24} color={theme.accent} />
                <Text style={[styles.emailButtonText, { color: themeContext.colors.text }]}>
                  Create with Email & Password
                </Text>
              </Pressable>
            </View>
          )}

          {/* Email/Password Form */}
          {authMethod === 'email' && (
            <View style={styles.emailForm}>
              <Pressable
                style={styles.backButton}
                onPress={() => setAuthMethod(null)}
              >
                <SvgIcon name="arrow-back" size={20} color={theme.accent} />
                <Text style={[styles.backButtonText, { color: theme.accent }]}>Back to options</Text>
              </Pressable>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeContext.colors.text }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border, color: themeContext.colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={themeContext.colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!prefilledEmail}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: themeContext.colors.text }]}>First Name *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border, color: themeContext.colors.text }]}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="John"
                    placeholderTextColor={themeContext.colors.textSecondary}
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={[styles.label, { color: themeContext.colors.text }]}>Last Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border, color: themeContext.colors.text }]}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Doe"
                    placeholderTextColor={themeContext.colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeContext.colors.text }]}>Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border, color: themeContext.colors.text }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 8 characters"
                    placeholderTextColor={themeContext.colors.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <SvgIcon
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={22}
                      color={themeContext.colors.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeContext.colors.text }]}>Confirm Password *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: themeContext.colors.card, borderColor: themeContext.colors.border, color: themeContext.colors.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor={themeContext.colors.textSecondary}
                  secureTextEntry={!showPassword}
                />
              </View>

              <Pressable
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleEmailSignup}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Text style={styles.submitButtonText}>Create Account</Text>
                    <SvgIcon name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          )}

          {/* Loading Overlay */}
          {loading && authMethod === null && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.loadingText, { color: themeContext.colors.textSecondary }]}>
                Creating your account...
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: theme.error,
    fontSize: 14,
    flex: 1,
  },
  authOptions: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  oauthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  oauthButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#fff',
    gap: 12,
  },
  emailButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emailForm: {
    gap: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 14,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
