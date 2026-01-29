import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '../shared';
import { colors, borderRadius } from '../../theme/design-tokens';

// Import logo image for web compatibility
const LogoImage = require('../../../assets/Logo_wihy.png');

interface EmailCheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: (email: string) => void;
  planName: string;
  planPrice: string;
  isLoading?: boolean;
}

export default function EmailCheckoutModal({
  visible,
  onClose,
  onContinue,
  planName,
  planPrice,
  isLoading = false,
}: EmailCheckoutModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleContinue = () => {
    setError('');
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    
    onContinue(email.trim().toLowerCase());
  };

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  // Web-specific modal styling
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    if (!visible) return null;
    
    return (
      <div 
        className="checkout-modal-overlay"
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          style={{
            // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
            borderRadius: 16,
            padding: 32,
            maxWidth: 420,
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
            }}
            type="button"
          >
            <Ionicons name="close" size={24} color="#6b7280" />
          </button>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <Image
                source={LogoImage}
                // @ts-ignore - web style prop
                style={{
                  width: 120,
                  height: 40,
                }}
                resizeMode="contain"
              />
            </div>
            <h2 style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#1f2937',
              margin: '0 0 8px',
            }}>
              Subscribe to {planName}
            </h2>
            <p style={{
              fontSize: 18,
              fontWeight: 600,
              color: colors.primary,
              margin: 0,
            }}>
              {planPrice}
            </p>
          </div>

          {/* Email input */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 8,
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px 16px',
                fontSize: 16,
                border: `2px solid ${error ? '#ef4444' : '#e5e7eb'}`,
                borderRadius: 12,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = colors.primary;
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = '#e5e7eb';
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleContinue();
              }}
            />
            {error && (
              <p style={{
                fontSize: 13,
                color: '#ef4444',
                marginTop: 8,
                marginBottom: 0,
              }}>
                {error}
              </p>
            )}
          </div>

          {/* Info text */}
          <p style={{
            fontSize: 13,
            color: '#6b7280',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 1.5,
          }}>
            Sign in with your preferred method, then complete payment.
            You can cancel anytime from your account settings.
          </p>

          {/* Continue button */}
          <button
            onClick={handleContinue}
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
              transition: 'background-color 0.2s',
            }}
            type="button"
          >
            {isLoading ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                Processing...
              </>
            ) : (
              <>
                Continue to Payment
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </button>

          {/* Already have account link */}
          <p style={{
            fontSize: 14,
            color: '#6b7280',
            textAlign: 'center',
            marginTop: 16,
            marginBottom: 0,
          }}>
            Already have an account?{' '}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: colors.primary,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
              type="button"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Native modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          {/* Close button */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Image source={LogoImage} style={{ width: 120, height: 40 }} />
            </View>
            <Text style={styles.title}>Subscribe to {planName}</Text>
            <Text style={styles.price}>{planPrice}</Text>
          </View>

          {/* Email input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          {/* Info text */}
          <Text style={styles.info}>
            Enter your email to continue to secure payment.
            You can cancel anytime from your account settings.
          </Text>

          {/* Continue button */}
          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue to Payment</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </Pressable>

          {/* Already have account link */}
          <Text style={styles.signInText}>
            Already have an account?{' '}
            <Text style={styles.signInLink} onPress={onClose}>
              Sign in
            </Text>
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 420,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e8f0fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#1f2937',
    outlineStyle: 'none' as any,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  error: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
  },
  info: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  signInText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
  },
  signInLink: {
    color: colors.primary,
    fontWeight: '600',
  },
});
