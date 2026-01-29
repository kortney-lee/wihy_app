/**
 * ZipcodeInput Component
 * 
 * Input field for collecting user's postal code for shopping integration.
 * Validates US zipcode format and provides clear UX.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ZipcodeInputProps {
  value?: string;
  onSubmit: (zipcode: string) => void;
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  onCancel?: () => void;
}

// US Zipcode validation (5 digits or 5+4 format)
const ZIPCODE_REGEX = /^\d{5}(-\d{4})?$/;

export const ZipcodeInput: React.FC<ZipcodeInputProps> = ({
  value = '',
  onSubmit,
  loading = false,
  error,
  title = 'Enter Your Zipcode',
  subtitle = 'We\'ll find stores near you for accurate pricing and delivery',
  buttonText = 'Find Stores',
  onCancel,
}) => {
  const { theme } = useTheme();
  const [zipcode, setZipcode] = useState(value);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const isValid = ZIPCODE_REGEX.test(zipcode);
  const displayError = error || validationError;

  const handleChangeText = useCallback((text: string) => {
    // Only allow numbers and dash
    const cleaned = text.replace(/[^\d-]/g, '');
    
    // Auto-format: add dash after 5 digits if more are entered
    let formatted = cleaned;
    if (cleaned.length > 5 && !cleaned.includes('-')) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5, 9)}`;
    }
    
    // Limit length
    if (formatted.length <= 10) {
      setZipcode(formatted);
      setValidationError(null);
    }
  }, []);

  const handleSubmit = useCallback(() => {
    if (loading) return;

    // Validate
    if (!zipcode.trim()) {
      setValidationError('Please enter a zipcode');
      return;
    }

    // Accept 5-digit format
    const normalizedZip = zipcode.split('-')[0];
    if (!/^\d{5}$/.test(normalizedZip)) {
      setValidationError('Please enter a valid 5-digit zipcode');
      return;
    }

    Keyboard.dismiss();
    onSubmit(normalizedZip);
  }, [zipcode, loading, onSubmit]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.inputContainer}>
        <View
          style={[
            styles.inputWrapper,
            isFocused && styles.inputWrapperFocused,
            displayError && styles.inputWrapperError,
          ]}
        >
          <Text style={styles.inputIcon}>📍</Text>
          <TextInput
            style={styles.input}
            value={zipcode}
            onChangeText={handleChangeText}
            placeholder="Enter zipcode (e.g., 90210)"
            placeholderTextColor="#999"
            keyboardType="number-pad"
            maxLength={10}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            editable={!loading}
          />
          {zipcode.length > 0 && !loading && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setZipcode('');
                setValidationError(null);
              }}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {displayError && (
          <Text style={styles.errorText}>{displayError}</Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!zipcode || loading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!zipcode || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>{buttonText}</Text>
          )}
        </TouchableOpacity>

        {onCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.benefitsContainer}>
        <Text style={styles.benefitsTitle}>With your zipcode you get:</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🏪</Text>
          <Text style={styles.benefitText}>See stores near you</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>💰</Text>
          <Text style={styles.benefitText}>Accurate local pricing</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🛒</Text>
          <Text style={styles.benefitText}>One-click Instacart ordering</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: '#007AFF',
    // backgroundColor: '#ffffff', // theme.colors.surface
  },
  inputWrapperError: {
    borderColor: '#FF3B30',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1A1A1A',
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  clearButton: {
    padding: 8,
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelButton: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
  },
  benefitsContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
  },
});

export default ZipcodeInput;
