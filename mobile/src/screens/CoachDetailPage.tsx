import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import { useTheme } from '../context/ThemeContext';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { coachService } from '../services';

const isWeb = Platform.OS === 'web';

interface CoachProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  specialties: string[];
  certifications: string[];
  years_experience: number;
  city: string;
  state: string;
  session_rate: number;
  currency: string;
  available_days: string[];
  available_hours_start: string;
  available_hours_end: string;
  rating_average: number;
  rating_count: number;
  avatar_url?: string;
}

interface Review {
  id: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function CoachDetailPage() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  const coachId = (route.params as any)?.coachId;
  
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState<CoachProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      // GET /api/coaches/:coachId/profile
      const profile = await coachService.getCoachProfile(coachId);
      setCoach(profile);
      
      // TODO: Load reviews from API
      // const reviewsData = await coachService.getCoachReviews(coachId);
      // setReviews(reviewsData);
      setReviews([]);
    } catch (error) {
      console.error('Error loading coach profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCoaching = () => {
    setShowRequestModal(true);
    // Navigate to request coaching modal/screen
    navigation.navigate('RequestCoaching' as any, { coachId: coach?.id, coachName: coach?.name });
  };

  const handleSendMessage = () => {
    // TODO: Implement messaging
    alert('Messaging feature coming soon!');
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= rating ? 'star' : 'star-outline'}
            size={16}
            color="#f59e0b"
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!coach) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle" size={48} color="#ef4444" />
        <Text style={styles.errorText}>Coach not found</Text>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area */}
      <View style={{ height: insets.top, backgroundColor: '#6366f1' }} />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Coach Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{coach.name.charAt(0)}</Text>
            </View>
          </View>
          
          <Text style={styles.coachName}>{coach.name}</Text>
          <Text style={styles.coachTitle}>{coach.title}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              {renderStars(coach.rating_average)}
              <Text style={styles.ratingText}>
                {coach.rating_average.toFixed(1)}/5 ({coach.rating_count} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="location" size={16} color="#6b7280" />
              <Text style={styles.detailText}>{coach.city}, {coach.state}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash" size={16} color="#6b7280" />
              <Text style={styles.detailText}>${coach.session_rate}/hour</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About {coach.name.split(' ')[0]}</Text>
          <Text style={styles.bioText}>{coach.bio}</Text>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <View style={styles.specialtiesRow}>
            {coach.specialties.map((specialty, index) => (
              <View key={index} style={styles.specialtyBadge}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Credentials */}
        {coach.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credentials</Text>
            <Text style={styles.credentialsText}>{coach.certifications.join(', ')}</Text>
          </View>
        )}

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.experienceText}>{coach.years_experience}+ years of experience</Text>
        </View>

        {/* Availability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <Text style={styles.availabilityText}>
            {coach.available_days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
          </Text>
          <Text style={styles.availabilityText}>
            {coach.available_hours_start} - {coach.available_hours_end}
          </Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reviews ({reviews.length} of {coach.rating_count})</Text>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                {renderStars(review.rating)}
                <Text style={styles.reviewTime}>{review.created_at}</Text>
              </View>
              <Text style={styles.reviewComment}>"{review.comment}"</Text>
              <Text style={styles.reviewAuthor}>- {review.client_name}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Pressable
          style={styles.secondaryActionButton}
          onPress={handleSendMessage}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
          <Text style={styles.secondaryActionText}>Message</Text>
        </Pressable>
        
        <Pressable
          style={styles.primaryActionButton}
          onPress={handleRequestCoaching}
        >
          <Text style={styles.primaryActionText}>Request Coaching</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // Use dashboardTheme or inline for dark mode
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3b82f6',
  },
  coachName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827', // Use dashboardTheme or inline for dark mode
    marginBottom: 4,
  },
  coachTitle: {
    fontSize: 16,
    // color: theme.colors.textSecondary
    marginBottom: 12,
  },
  statsRow: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827', // Use dashboardTheme or inline for dark mode
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    // color: theme.colors.text
    lineHeight: 22,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#166534',
  },
  credentialsText: {
    fontSize: 15,
    // color: theme.colors.text
  },
  experienceText: {
    fontSize: 15,
    // color: theme.colors.text
  },
  availabilityText: {
    fontSize: 15,
    // color: theme.colors.text
    marginBottom: 4,
  },
  reviewCard: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewTime: {
    fontSize: 12,
    // color: theme.colors.textSecondary
  },
  reviewComment: {
    fontSize: 14,
    // color: theme.colors.text
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 13,
    // color: theme.colors.textSecondary
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3b82f6',
    backgroundColor: '#fff',
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  primaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  loadingText: {
    fontSize: 16,
    // color: theme.colors.textSecondary
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: '#e0f2fe', // theme.colors.background
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // Use dashboardTheme or inline for dark mode
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
