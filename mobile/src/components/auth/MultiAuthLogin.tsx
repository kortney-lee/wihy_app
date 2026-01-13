import React, { useState, useContext, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { colors, sizes } from '../../theme/design-tokens';
import { getResponsiveIconSize } from '../../utils/responsive';
import SvgIcon from '../shared/SvgIcon';
import { authService } from '../../services/authService';

interface MultiAuthLoginProps {
  onUserChange?: (user: any) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
  customProviders?: string[];
  title?: string;
  visible?: boolean;
  onClose?: () => void;
}

const providers = [
  {
    id: 'google',
    name: 'Continue with Google',
    icon: 'logo-google',
    color: '#DB4437',
  },
  {
    id: 'apple',
    name: Platform.OS === 'ios' ? 'Continue with Apple' : 'Continue with Apple ID',
    icon: 'logo-apple',
    color: '#000000',
  },
  {
    id: 'microsoft',
    name: 'Continue with Microsoft',
    icon: 'logo-microsoft',
    color: '#00BCF2',
  },
  {
    id: 'email',
    name: 'Continue with Email',
    icon: 'mail',
    color: colors.primary,
  },
];

export default function MultiAuthLogin({
  onUserChange,
  onSignIn,
  onSignOut,
  customProviders,
  title = 'Log in or sign up to WIHY',
  visible = false,
  onClose,
}: MultiAuthLoginProps) {
  const { user, loading, signIn, signOut } = useContext(AuthContext);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) {
      setShowEmailForm(false);
      setShowForgotPassword(false);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setName('');
      setResetEmail('');
      setResetSent(false);
      setError('');
      setShowPassword(false);
    }
  }, [visible]);

  const activeProviders = useMemo(() => {
    if (!customProviders || customProviders.length === 0) {return providers;}
    const normalized = customProviders.map((id) => id.toLowerCase());
    return providers.filter((provider) => normalized.includes(provider.id));
  }, [customProviders]);

  const handleProviderPress = async (providerId: string) => {
    console.log(`[Auth] handleProviderPress called with: ${providerId}`);
    if (providerId === 'email') {
      console.log('[Auth] Setting showEmailForm to true');
      setShowEmailForm(true);
      console.log('[Auth] showEmailForm state updated');
      return;
    }

    try {
      const newUser = await signIn(providerId);
      onUserChange?.(newUser);
      onSignIn?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      Alert.alert('Authentication Error', `${message} (${providerId})`);
    }
  };

  const handleEmailAuth = async () => {
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isSignUp && !name) {
      setError('Please enter your name');
      return;
    }

    try {
      const newUser = await signIn('email', { 
        email, 
        password, 
        name: isSignUp ? name : undefined,
        isRegister: isSignUp 
      });
      onUserChange?.(newUser);
      onSignIn?.();
      setShowEmailForm(false);
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
      setError('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to authenticate';
      setError(message);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      setError('Please enter your email address');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      await authService.requestPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onUserChange?.(null);
      onSignOut?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  return (
    <View style={styles.container}>
      {/* Provider Selection Modal */}
      <Modal
        visible={visible && !user && !showEmailForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('Modal onRequestClose called');
          if (onClose) {
            onClose();
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.providerContainer}>
            {/* Close button for web */}
            {Platform.OS === 'web' && onClose && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>

            {activeProviders.map((provider, index) => (
              <Pressable
                key={provider.id}
                style={({ pressed }) => [
                  styles.providerButton,
                  pressed && { opacity: 0.7 },
                  index === activeProviders.length - 1 && { marginBottom: 20 }
                ]}
                onPress={() => {
                  console.log(`[Auth] Provider button pressed: ${provider.id}`);
                  handleProviderPress(provider.id);
                }}
                onPressIn={() => console.log(`[Auth] PressIn: ${provider.id}`)}
                onPressOut={() => console.log(`[Auth] PressOut: ${provider.id}`)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <SvgIcon
                  name={provider.icon as any}
                  size={getResponsiveIconSize(sizes.icons.md)}
                  color={provider.color}
                  style={styles.providerIcon}
                />
                <Text style={styles.providerText}>{provider.name}</Text>
              </Pressable>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                console.log('Cancel button onPress called');
                if (onClose) {
                  console.log('Calling onClose callback');
                  onClose();
                } else {
                  console.log('No onClose callback provided');
                }
              }}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Show dev login only in development mode (native or localhost) */}
            {__DEV__ && (Platform.OS !== 'web' || 
              (typeof window !== 'undefined' && 
               (window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname.includes('192.168.')))) && (
              <TouchableOpacity
                style={styles.devButton}
                onPress={async () => {
                  try {
                    const newUser = await signIn('dev', {
                      email: 'dev@wihy.app',
                      name: 'Dev User',
                    });
                    console.log('[DevLogin] success', newUser);
                    setShowEmailForm(false);
                    setIsSignUp(false);
                    onUserChange?.(newUser);
                    onSignIn?.();
                    // Allow state to propagate before closing
                    setTimeout(() => onClose?.(), 50);
                  } catch (error) {
                    console.error('[DevLogin] failed', error);
                    const message = error instanceof Error ? error.message : 'Could not sign in automatically';
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.alert('Dev Login Failed: ' + message);
                    } else {
                      Alert.alert('Dev Login Failed', message);
                    }
                  }
                }}
              >
                <SvgIcon name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.devText}>Dev Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Email Form Modal */}
      <Modal
        visible={showEmailForm && !showForgotPassword}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowEmailForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.emailFormContainer, Platform.OS === 'web' && styles.emailFormContainerWeb]}>
            {/* Close button for web */}
            {Platform.OS === 'web' && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => setShowEmailForm(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {/* Logo/Icon for web */}
            {Platform.OS === 'web' && (
              <View style={styles.formLogoContainer}>
                <Image 
                  source={require('../../../assets/Logo_wihy.png')} 
                  style={styles.formLogo}
                  resizeMode="contain"
                />
              </View>
            )}

            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            
            {Platform.OS === 'web' && (
              <Text style={styles.formSubtitle}>
                {isSignUp ? 'Start your health journey today' : 'Sign in to continue'}
              </Text>
            )}

            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={16} color="#dc2626" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="John Doe"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    textContentType="name"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.placeholder}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>Password</Text>
                {!isSignUp && (
                  <TouchableOpacity onPress={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                  }}>
                    <Text style={styles.forgotLink}>Forgot password?</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.placeholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                    size={20} 
                    color="#9ca3af" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>

            {Platform.OS === 'web' && (
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>
            )}

            {Platform.OS === 'web' && (
              <View style={styles.socialButtonsRow}>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleProviderPress('google')}
                >
                  <SvgIcon name="logo-google" size={20} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleProviderPress('apple')}
                >
                  <SvgIcon name="logo-apple" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.socialButton}
                  onPress={() => handleProviderPress('microsoft')}
                >
                  <SvgIcon name="logo-microsoft" size={20} color="#00BCF2" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={styles.toggleTextBold}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowEmailForm(false);
                setError('');
              }}
            >
              <Text style={styles.cancelText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        visible={showForgotPassword}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.emailFormContainer, Platform.OS === 'web' && styles.emailFormContainerWeb]}>
            {/* Close button for web */}
            {Platform.OS === 'web' && (
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => {
                  setShowForgotPassword(false);
                  setResetSent(false);
                  setResetEmail('');
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            )}

            {resetSent ? (
              <>
                <View style={styles.successIconContainer}>
                  <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
                </View>
                <Text style={styles.formTitle}>Check Your Email</Text>
                <Text style={styles.resetSuccessText}>
                  We've sent password reset instructions to{'\n'}
                  <Text style={styles.resetEmailHighlight}>{resetEmail}</Text>
                </Text>
                <Text style={styles.resetHelpText}>
                  Didn't receive the email? Check your spam folder or try again.
                </Text>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail('');
                  }}
                >
                  <Text style={styles.submitText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.resetIconContainer}>
                  <Ionicons name="key-outline" size={48} color={colors.primary} />
                </View>
                <Text style={styles.formTitle}>Reset Password</Text>
                <Text style={styles.formSubtitle}>
                  Enter your email address and we'll send you instructions to reset your password.
                </Text>

                {error ? (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={20} color="#9ca3af" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.placeholder}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      textContentType="emailAddress"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, resetLoading && styles.submitButtonDisabled]}
                  onPress={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>Send Reset Link</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowForgotPassword(false);
                    setError('');
                  }}
                >
                  <Text style={styles.cancelText}>Back to Sign In</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1000,
  },
  authButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  unauthenticatedButton: {
    backgroundColor: '#f0f4ff',
    borderColor: '#e0e8ff',
  },
  authenticatedButton: {
    backgroundColor: '#e8f5e8',
    borderColor: '#c8e6c9',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: Platform.OS === 'web' ? 'center' : 'flex-end',
    alignItems: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  providerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: Platform.OS === 'web' ? 20 : 0,
    borderTopLeftRadius: Platform.OS === 'web' ? 20 : 28,
    borderTopRightRadius: Platform.OS === 'web' ? 20 : 28,
    padding: 24,
    width: Platform.OS === 'web' ? 420 : '100%',
    maxWidth: Platform.OS === 'web' ? '90%' : undefined,
    maxHeight: Platform.OS === 'web' ? '80%' : '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: Platform.OS === 'web' ? 4 : -6 },
    shadowOpacity: Platform.OS === 'web' ? 0.15 : 0.2,
    shadowRadius: Platform.OS === 'web' ? 20 : 12,
    elevation: 18,
    borderWidth: Platform.OS === 'web' ? 0 : 1,
    borderTopWidth: Platform.OS === 'web' ? 0 : 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  providerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  providerIcon: {
    marginRight: 12,
  },
  providerText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  emailFormContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 18,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  emailFormContainerWeb: {
    borderRadius: 20,
    width: 420,
    maxWidth: '95%',
    padding: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    borderTopWidth: 0,
  },
  formLogoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  formLogo: {
    width: 120,
    height: 40,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeButton: {
    padding: 8,
    position: 'absolute',
    right: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 52,
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowOpacity: 0,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    fontSize: 13,
    color: '#9ca3af',
    paddingHorizontal: 16,
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  toggleButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  toggleTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  devButton: {
    marginTop: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  devText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: '400',
  },
  // Forgot Password Styles
  resetIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  resetSuccessText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  resetEmailHighlight: {
    color: colors.text,
    fontWeight: '600',
  },
  resetHelpText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 24,
  },
});
