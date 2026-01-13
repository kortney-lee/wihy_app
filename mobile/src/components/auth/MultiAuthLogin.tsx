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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { colors, sizes } from '../../theme/design-tokens';
import { getResponsiveIconSize } from '../../utils/responsive';

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
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) {
      setShowEmailForm(false);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setName('');
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
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isSignUp && !name) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      const newUser = await signIn('email', { email, password, name: isSignUp ? name : undefined });
      onUserChange?.(newUser);
      onSignIn?.();
      setShowEmailForm(false);
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to authenticate';
      Alert.alert('Authentication Error', message);
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
                <Ionicons
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
                  Alert.alert('Dev Login Failed', message);
                }
              }}
            >
              <Ionicons name="rocket" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.devText}>Dev Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email Form Modal */}
      <Modal
        visible={showEmailForm}
        animationType="slide"
        transparent={true}
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowEmailForm(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.emailFormContainer}>
            <Text style={styles.formTitle}>
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Text>

            {isSignUp && (
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={colors.placeholder}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                textContentType="name"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType="password"
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleEmailAuth}
              disabled={loading}
            >
              <Text style={styles.submitText}>
                {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.toggleText}>
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowEmailForm(false);
              }}
            >
              <Text style={styles.cancelText}>Back</Text>
            </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  providerContainer: {
    backgroundColor: '#f1f5f9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 18,
    borderTopWidth: 1,
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
    backgroundColor: '#f1f5f9',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 18,
    borderTopWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    color: colors.text,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
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
});
