import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';

interface SendInvitationProps {
  visible: boolean;
  onClose: () => void;
  coachId?: string; // Current coach's ID
}

export default function SendInvitation({ visible, onClose, coachId }: SendInvitationProps) {
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { coachId: authCoachId } = useAuth();

  const handleSendInvitation = async () => {
    // Validate inputs
    if (!clientEmail.trim()) {
      Alert.alert('Required', 'Please enter client email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clientEmail.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Required', 'Please add a personal message to the invitation');
      return;
    }

    const effectiveCoachId = coachId || authCoachId;
    if (!effectiveCoachId) {
      Alert.alert('Error', 'Coach profile not found. Please sign in again.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await userService.sendCoachInvitation(effectiveCoachId, {
        client_email: clientEmail.trim(),
        client_name: clientName.trim() || undefined,
        message: message.trim(),
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to send invitation');
      }

      Alert.alert(
        'Invitation Sent!',
        `An email invitation has been sent to ${clientEmail}. They will receive a link to accept your coaching invitation.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setClientEmail('');
              setClientName('');
              setMessage('');
              onClose();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Send invitation error:', error);
      Alert.alert('Error', 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form and close
    setClientEmail('');
    setClientName('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <View style={styles.modalContainer}>
          <SafeAreaView edges={['bottom']} style={styles.safeArea}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Invite Client</Text>
                <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>ℹ️</Text>
                <Text style={styles.infoText}>
                  Send an invitation to a new or existing client. They'll receive an email with a
                  link to accept your coaching services.
                </Text>
              </View>

              {/* Client Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Client Email <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="client@example.com"
                  value={clientEmail}
                  onChangeText={setClientEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                />
              </View>

              {/* Client Name (Optional) */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Client Name (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={clientName}
                  onChangeText={setClientName}
                  autoCapitalize="words"
                  editable={!isSubmitting}
                />
              </View>

              {/* Personal Message */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Personal Message <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Introduce yourself and explain how you can help them achieve their goals..."
                  value={message}
                  onChangeText={(text) => {
                    if (text.length <= 500) {
                      setMessage(text);
                    }
                  }}
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!isSubmitting}
                />
                <Text style={styles.charCount}>{message.length}/500</Text>
              </View>

              {/* Tips */}
              <View style={styles.tipsBox}>
                <Text style={styles.tipsTitle}>💡 Tips for a Great Invitation</Text>
                <Text style={styles.tipItem}>• Personalize your message</Text>
                <Text style={styles.tipItem}>• Explain your coaching approach</Text>
                <Text style={styles.tipItem}>• Highlight what makes you unique</Text>
                <Text style={styles.tipItem}>• Mention any relevant experience</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.sendButton,
                    isSubmitting && styles.sendButtonDisabled,
                  ]}
                  onPress={handleSendInvitation}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#fff" size="small" />
                      <Text style={styles.sendButtonText}>Sending...</Text>
                    </View>
                  ) : (
                    <Text style={styles.sendButtonText}>Send Invitation</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: 400,
  },
  safeArea: {
  },
  scrollView: {
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#6b7280',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
    outlineStyle: 'none' as any,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  tipsBox: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
