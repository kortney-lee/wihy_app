import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  Alert,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GoogleAuthService } from '../services/googleAuthService';

interface GoogleSignInButtonProps {
  onSignInSuccess: (idToken: string) => Promise<void>;
  onSignInError?: (error: Error) => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function GoogleSignInButton({
  onSignInSuccess,
  onSignInError,
  loading: externalLoading = false,
  disabled: externalDisabled = false,
  style,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const isLoading = loading || externalLoading;
  const isDisabled = isLoading || externalDisabled;

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const idToken = await GoogleAuthService.signIn();

      if (idToken) {
        // Send token to your backend
        await onSignInSuccess(idToken);
      } else {
        // User cancelled or error occurred
        console.log('Google Sign-In cancelled or failed');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      onSignInError?.(err);
      Alert.alert('Sign-In Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleGoogleSignIn}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <View style={styles.buttonContent}>
          <MaterialIcons name="login" size={20} color="#fff" />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#EA4335',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    minHeight: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
