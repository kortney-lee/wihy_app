import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { userService } from '../services/userService';

const isWeb = Platform.OS === 'web';

type Frequency = 'weekly' | 'bi-weekly' | 'monthly';

export default function RequestCoaching() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { userId } = useAuth();
  const { theme } = useTheme();
  
  const { coachId, coachName } = (route.params as any) || {};
  
  const [message, setMessage] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('weekly');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert('Please add a message to your request');
      return;
    }

    if (!coachId) {
      alert('Coach not found. Please go back and retry.');
      return;
    }

    if (!userId) {
      alert('Please sign in before sending a coaching request.');
      return;
    }

    try {
      setSubmitting(true);
      const result = await userService.requestCoaching(coachId, {
        client_id: userId,
        message: message.trim(),
        preferred_frequency: frequency,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send request');
      }

      alert(`Coaching request sent to ${coachName}!\n\nThey will review your request and contact you via email within 24-48 hours.`);
      navigation.goBack();
    } catch (error) {
      console.error('Error sending request:', error);
      alert('Failed to send request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Request Coaching from {coachName}</Text>
            <Pressable
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
            {/* Message */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message to Coach (Optional)</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Tell the coach about your goals and what you're looking for..."
                placeholderTextColor="#9ca3af"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={6}
                maxLength={500}
              />
              <Text style={styles.helpText}>{message.length}/500 characters</Text>
            </View>

            {/* Frequency */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Preferred Session Frequency</Text>
              <View style={styles.frequencyOptions}>
                <Pressable
                  style={[
                    styles.frequencyOption,
                    frequency === 'weekly' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('weekly')}
                >
                  <View style={styles.radio}>
                    {frequency === 'weekly' && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === 'weekly' && styles.frequencyTextSelected,
                    ]}
                  >
                    Weekly
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.frequencyOption,
                    frequency === 'bi-weekly' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('bi-weekly')}
                >
                  <View style={styles.radio}>
                    {frequency === 'bi-weekly' && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === 'bi-weekly' && styles.frequencyTextSelected,
                    ]}
                  >
                    Bi-weekly
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.frequencyOption,
                    frequency === 'monthly' && styles.frequencyOptionSelected,
                  ]}
                  onPress={() => setFrequency('monthly')}
                >
                  <View style={styles.radio}>
                    {frequency === 'monthly' && <View style={styles.radioInner} />}
                  </View>
                  <Text
                    style={[
                      styles.frequencyText,
                      frequency === 'monthly' && styles.frequencyTextSelected,
                    ]}
                  >
                    Monthly
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3b82f6" />
              <Text style={styles.infoText}>
                {coachName} will review your request and contact you via email within 24-48 hours.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <Text style={styles.submitButtonText}>Sending...</Text>
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Request</Text>
                  <Ionicons name="send" size={16} color="#fff" />
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    // backgroundColor: '#fff', // Now using theme.colors.surface dynamically
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    paddingRight: 12,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  frequencyOptions: {
    gap: 12,
  },
  frequencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
  },
  frequencyOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  frequencyText: {
    fontSize: 15,
    color: '#374151',
  },
  frequencyTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1e40af',
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
