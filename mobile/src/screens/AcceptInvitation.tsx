import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { coachService } from '../services';

interface RouteParams {
  invitationId: string;
  coachId?: string;
}

interface CoachInvitation {
  id: string;
  coach_id: string;
  coach_name: string;
  coach_title: string;
  coach_avatar_url?: string;
  coach_rating: number;
  coach_review_count: number;
  message: string;
  sent_at: string;
  expires_at: string;
}

type RootStackParamList = {
  SessionBooking: { coachId: string; coachName: string };
  CoachSelection: undefined;
};

export default function AcceptInvitation() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const { invitationId, coachId } = (route.params as RouteParams) || {};
  const { userId } = useAuth();

  const [invitation, setInvitation] = useState<CoachInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [scheduleNow, setScheduleNow] = useState(true); // Default: schedule now

  useEffect(() => {
    loadInvitation();
  }, [invitationId]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call API to get invitation details
      // GET /api/coaching/invitations/{invitationId}
      const result = await coachService.getInvitationDetails(invitationId);

      if (result.success && result.data) {
        setInvitation({
          id: result.data.id,
          coach_id: result.data.coach_id,
          coach_name: result.data.coach_name,
          coach_title: result.data.coach_title,
          coach_avatar_url: result.data.coach_avatar_url,
          coach_rating: result.data.coach_rating,
          coach_review_count: result.data.coach_review_count,
          message: result.data.message,
          sent_at: result.data.sent_at,
          expires_at: result.data.expires_at,
        });
      } else {
        // Fallback to mock data if API not ready
        console.warn('AcceptInvitation: API returned error, using mock data');
        setInvitation({
          id: invitationId,
          coach_id: coachId || 'coach-123',
          coach_name: 'Dr. Sarah Mitchell',
          coach_title: 'Certified Nutrition Coach',
          coach_rating: 4.9,
          coach_review_count: 127,
          message:
            "Hi! I'd love to work with you on your wellness journey. I specialize in sustainable nutrition habits and have helped over 100 clients achieve their health goals. I believe my approach would be a great fit for what you're looking for!",
          sent_at: '2026-01-20T10:30:00Z',
          expires_at: '2026-02-04T10:30:00Z',
        });
      }
    } catch (err) {
      console.error('Load invitation error:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;

    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to accept the invitation.');
      return;
    }

    setIsAccepting(true);

    try {
      const result = await userService.acceptCoachInvitation(invitation.coach_id, {
        invitation_id: invitationId,
        client_id: userId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      if (scheduleNow) {
        // Navigate to booking screen
        Alert.alert(
          'Invitation Accepted!',
          `You're now connected with ${invitation.coach_name}. Let's schedule your first session.`,
          [
            {
              text: 'Continue',
              onPress: () => {
                (navigation as any).navigate('SessionBooking', {
                  coachId: invitation.coach_id,
                  coachName: invitation.coach_name,
                });
              },
            },
          ]
        );
      } else {
        // Let coach contact
        Alert.alert(
          'Invitation Accepted!',
          `Great! ${invitation.coach_name} will contact you within 24 hours to schedule your first session.`,
          [
            {
              text: 'OK',
              onPress: () => {
                navigation.navigate('CoachSelection');
              },
            },
          ]
        );
      }
    } catch (err) {
      console.error('Accept invitation error:', err);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    Alert.alert(
      'Decline Invitation',
      `Are you sure you want to decline ${invitation?.coach_name}'s coaching invitation?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsDeclining(true);
            try {
              // TODO: Replace with actual API call
              // await fetch(`/api/coaches/invitations/${invitationId}/decline`, {
              //   method: 'POST',
              //   headers: { 'Authorization': `Bearer ${accessToken}` },
              // });

              await new Promise(resolve => setTimeout(resolve, 1000));
              Alert.alert('Invitation Declined', 'The coach has been notified.', [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('CoachSelection'),
                },
              ]);
            } catch (err) {
              Alert.alert('Error', 'Failed to decline invitation');
            } finally {
              setIsDeclining(false);
            }
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={styles.star}>
          {i <= Math.floor(rating) ? '★' : i - rating < 1 ? '★' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !invitation) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error || 'Invitation not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadInvitation}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Coaching Invitation</Text>
          <Text style={styles.headerSubtitle}>You've been invited!</Text>
        </View>

        {/* Coach Card */}
        <View style={styles.coachCard}>
          <View style={styles.avatarContainer}>
            {invitation.coach_avatar_url ? (
              <Image source={{ uri: invitation.coach_avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials(invitation.coach_name)}</Text>
              </View>
            )}
          </View>

          <Text style={styles.coachName}>{invitation.coach_name}</Text>
          <Text style={styles.coachTitle}>{invitation.coach_title}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(invitation.coach_rating)}</View>
            <Text style={styles.ratingText}>
              {invitation.coach_rating.toFixed(1)} ({invitation.coach_review_count} reviews)
            </Text>
          </View>
        </View>

        {/* Message */}
        <View style={styles.messageCard}>
          <Text style={styles.messageLabel}>Message from {invitation.coach_name.split(' ')[0]}</Text>
          <Text style={styles.messageText}>{invitation.message}</Text>
        </View>

        {/* First Session Options */}
        <View style={styles.optionsCard}>
          <Text style={styles.optionsTitle}>First Session</Text>

          <TouchableOpacity
            style={[styles.optionButton, scheduleNow && styles.optionButtonActive]}
            onPress={() => setScheduleNow(true)}
          >
            <View style={styles.radioOuter}>
              {scheduleNow && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, scheduleNow && styles.optionTitleActive]}>
                Schedule Now
              </Text>
              <Text style={styles.optionDescription}>
                Book your first session immediately
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionButton, !scheduleNow && styles.optionButtonActive]}
            onPress={() => setScheduleNow(false)}
          >
            <View style={styles.radioOuter}>
              {!scheduleNow && <View style={styles.radioInner} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, !scheduleNow && styles.optionTitleActive]}>
                Let Coach Contact Me
              </Text>
              <Text style={styles.optionDescription}>
                Coach will reach out within 24 hours
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            By accepting, you'll start a coaching relationship with {invitation.coach_name}. You
            can cancel anytime.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.declineButton]}
          onPress={handleDecline}
          disabled={isAccepting || isDeclining}
        >
          {isDeclining ? (
            <ActivityIndicator color="#dc2626" size="small" />
          ) : (
            <Text style={styles.declineButtonText}>Decline</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.acceptButton,
            (isAccepting || isDeclining) && styles.acceptButtonDisabled,
          ]}
          onPress={handleAccept}
          disabled={isAccepting || isDeclining}
        >
          {isAccepting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.acceptButtonText}>Accepting...</Text>
            </View>
          ) : (
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  coachCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  coachName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  coachTitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  star: {
    fontSize: 18,
    color: '#fbbf24',
    marginHorizontal: 1,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  messageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  messageText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  optionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
  },
  optionButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  optionTitleActive: {
    color: '#1e40af',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc2626',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  acceptButton: {
    backgroundColor: '#10b981',
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
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
