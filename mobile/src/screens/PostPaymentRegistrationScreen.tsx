import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '../components/shared';
import { RootStackParamList } from '../types/navigation';
import { colors, borderRadius } from '../theme/design-tokens';
import { useAuth } from '../context/AuthContext';

// Success green color
const SUCCESS_COLOR = '#22c55e';

// Import CSS for web only
if (Platform.OS === 'web') {
  require('../styles/web-landing.css');
  require('../styles/pricing.css');
}

const isWeb = Platform.OS === 'web';

type PostPaymentRegistrationNavigationProp = StackNavigationProp<RootStackParamList, 'PostPaymentRegistration'>;

interface Props {
  navigation: PostPaymentRegistrationNavigationProp;
  route?: {
    params?: {
      email?: string;
      planId?: string;
      planName?: string;
      sessionId?: string;
    };
  };
}

export const PostPaymentRegistrationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { createAccountAfterPayment } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Get checkout info from route params or session storage
  const [checkoutInfo, setCheckoutInfo] = useState<{
    email: string;
    planId: string;
    planName: string;
    sessionId?: string;
  } | null>(null);

  useEffect(() => {
    // First, try route params
    if (route?.params?.email) {
      setCheckoutInfo({
        email: route.params.email,
        planId: route.params.planId || '',
        planName: route.params.planName || '',
        sessionId: route.params.sessionId,
      });
      return;
    }

    // For web, try to get from URL params or session storage
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      // Try session storage first (set before checkout)
      const stored = sessionStorage.getItem('pendingCheckout');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCheckoutInfo({
            ...parsed,
            sessionId,
          });
          return;
        } catch (e) {
          console.error('Failed to parse stored checkout info:', e);
        }
      }

      // If no stored data, check URL params
      const email = urlParams.get('email');
      const planId = urlParams.get('plan');
      if (email) {
        setCheckoutInfo({
          email,
          planId: planId || '',
          planName: '',
          sessionId,
        });
      }
    }
  }, [route?.params]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleCreateAccount = async () => {
    setError('');

    if (!checkoutInfo?.email) {
      setError('Unable to find your checkout information. Please contact support.');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      // Call auth service to create account with the payment info
      await createAccountAfterPayment({
        email: checkoutInfo.email,
        password,
        planId: checkoutInfo.planId,
        stripeSessionId: checkoutInfo.sessionId,
      });

      // Clear stored checkout info
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingCheckout');
      }

      setSuccess(true);

      // Redirect to dashboard after short delay
      setTimeout(() => {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = '/health';
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }, 2000);

    } catch (err: any) {
      console.error('Account creation error:', err);
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    if (isWeb) {
      return (
        <div className="pricing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 48,
            maxWidth: 420,
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <Ionicons name="checkmark-circle" size={48} color={SUCCESS_COLOR} />
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1f2937', margin: '0 0 12px' }}>
              Welcome to WIHY!
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', margin: '0 0 24px' }}>
              Your account has been created and your subscription is active.
            </p>
            <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={SUCCESS_COLOR} />
          </View>
          <Text style={styles.successTitle}>Welcome to WIHY!</Text>
          <Text style={styles.successText}>
            Your account has been created and your subscription is active.
          </Text>
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  // Loading state while fetching checkout info
  if (!checkoutInfo) {
    if (isWeb) {
      return (
        <div className="pricing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </div>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Web render
  if (isWeb) {
    return (
      <div className="pricing-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 40,
          maxWidth: 460,
          width: '100%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Ionicons name="checkmark-circle" size={36} color={SUCCESS_COLOR} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>
              Payment Successful!
            </h1>
            <p style={{ fontSize: 16, color: '#6b7280', margin: '0 0 4px' }}>
              Create your password to complete setup
            </p>
            <p style={{ fontSize: 14, color: colors.primary, fontWeight: 600, margin: 0 }}>
              {checkoutInfo.email}
            </p>
          </div>

          {/* Password form */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8,
            }}>
              Create Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a secure password"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
                type="button"
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9ca3af" 
                />
              </button>
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8,
            }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '14px 48px 14px 16px',
                  fontSize: 16,
                  border: '2px solid #e5e7eb',
                  borderRadius: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleCreateAccount();
                }}
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                }}
                type="button"
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9ca3af" 
                />
              </button>
            </div>
          </div>

          {/* Password requirements */}
          <div style={{
            backgroundColor: '#f9fafb',
            borderRadius: 8,
            padding: 12,
            marginBottom: 24,
          }}>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 8px', fontWeight: 600 }}>
              Password must have:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { check: password.length >= 8, text: '8+ characters' },
                { check: /[A-Z]/.test(password), text: 'Uppercase' },
                { check: /[a-z]/.test(password), text: 'Lowercase' },
                { check: /[0-9]/.test(password), text: 'Number' },
              ].map((req, i) => (
                <span key={i} style={{
                  fontSize: 11,
                  color: req.check ? SUCCESS_COLOR : '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Ionicons 
                    name={req.check ? 'checkmark-circle' : 'ellipse-outline'} 
                    size={14} 
                    color={req.check ? SUCCESS_COLOR : '#9ca3af'} 
                  />
                  {req.text}
                </span>
              ))}
            </div>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: 12,
              marginBottom: 24,
            }}>
              <p style={{ fontSize: 14, color: '#dc2626', margin: 0 }}>
                {error}
              </p>
            </div>
          )}

          <button
            onClick={handleCreateAccount}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px 24px',
              fontSize: 16,
              fontWeight: 600,
              color: '#fff',
              backgroundColor: isLoading ? '#9ca3af' : colors.primary,
              border: 'none',
              borderRadius: 12,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            type="button"
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                Creating Account...
              </>
            ) : (
              <>
                Complete Setup
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // Native render
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.successIconSmall}>
            <Ionicons name="checkmark-circle" size={36} color={SUCCESS_COLOR} />
          </View>
          <Text style={styles.title}>Payment Successful!</Text>
          <Text style={styles.subtitle}>Create your password to complete setup</Text>
          <Text style={styles.email}>{checkoutInfo.email}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Create Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter a secure password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9ca3af" 
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#9ca3af" 
                />
              </Pressable>
            </View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleCreateAccount}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Setup</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIconSmall: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    paddingRight: 48,
    fontSize: 16,
    color: '#1f2937',
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    color: '#dc2626',
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  successText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});

export default PostPaymentRegistrationScreen;
