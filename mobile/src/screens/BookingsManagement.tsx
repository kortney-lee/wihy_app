import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Animated,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardColors, Ionicons, BackToHubButton } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { coachService } from '../services';
import { useAuth } from '../context/AuthContext';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';
const { width: screenWidth } = Dimensions.get('window');

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  sessionType: 'initial-60' | 'followup-30' | 'followup-60';
  scheduledAt: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  notes?: string;
}

interface BookingsManagementProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function BookingsManagement({
  isDashboardMode = false,
  onBack,
}: BookingsManagementProps) {
  const { coachId } = useAuth();
  
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed'>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 180;
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    loadBookings();
  }, [coachId]);

  const loadBookings = useCallback(async () => {
    if (!coachId) {
      setError('Coach ID not found');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Call API to get coach bookings
      // GET /api/coaches/{coachId}/bookings
      const result = await coachService.getCoachBookings(coachId);
      
      if (result.success && result.data) {
        // Transform API response to local Booking interface
        const transformedBookings: Booking[] = result.data.bookings.map(booking => ({
          id: booking.id,
          clientName: booking.client.name,
          clientEmail: booking.client.email,
          sessionType: booking.session_type as Booking['sessionType'],
          scheduledAt: booking.scheduled_at,
          status: booking.status,
          price: booking.duration_minutes === 60 ? 150 : 75, // Derive price from duration
          notes: booking.notes,
        }));
        setBookings(transformedBookings);
      } else {
        // Fallback to mock data if API not ready
        console.warn('BookingsManagement: API returned error, using mock data');
        const mockBookings: Booking[] = [
          {
            id: '1',
            clientName: 'Sarah Johnson',
            clientEmail: 'sarah@example.com',
            sessionType: 'initial-60',
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'confirmed',
            price: 150,
          },
          {
            id: '2',
            clientName: 'Mike Chen',
            clientEmail: 'mike@example.com',
            sessionType: 'followup-30',
            scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            price: 75,
          },
          {
            id: '3',
            clientName: 'Emma Wilson',
            clientEmail: 'emma@example.com',
            sessionType: 'followup-60',
            scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            price: 120,
          },
        ];
        setBookings(mockBookings);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bookings';
      setError(message);
      console.error('BookingsManagement: Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadBookings();
    setRefreshing(false);
  }, [loadBookings]);

  const getSessionTypeLabel = (type: Booking['sessionType']): string => {
    switch (type) {
      case 'initial-60': return 'Initial (60 min)';
      case 'followup-30': return 'Follow-up (30 min)';
      case 'followup-60': return 'Follow-up (60 min)';
      default: return type;
    }
  };

  const getStatusColor = (status: Booking['status']): string => {
    switch (status) {
      case 'confirmed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      case 'completed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const handleConfirmBooking = async (bookingId: string) => {
    Alert.alert(
      'Confirm Booking',
      'Are you sure you want to confirm this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            try {
              // Call API to confirm booking
              // PUT /api/coaches/{coachId}/bookings/{bookingId}
              if (coachId) {
                const result = await coachService.updateBookingStatus(coachId, bookingId, {
                  action: 'confirm',
                  meeting_link: `https://meet.wihy.ai/session/${bookingId}`,
                });
                
                if (result.success) {
                  setBookings(prev => prev.map(b => 
                    b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
                  ));
                } else {
                  throw new Error(result.error?.message || 'Failed to confirm booking');
                }
              } else {
                // Fallback for local state update if no coachId
                setBookings(prev => prev.map(b => 
                  b.id === bookingId ? { ...b, status: 'confirmed' as const } : b
                ));
              }
            } catch (error) {
              console.error('BookingsManagement: Error confirming booking:', error);
              Alert.alert('Error', 'Failed to confirm booking. Please try again.');
            }
          }
        },
      ]
    );
  };

  const handleCancelBooking = async (bookingId: string) => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              // Call API to cancel booking
              // PUT /api/coaches/{coachId}/bookings/{bookingId}
              if (coachId) {
                const result = await coachService.updateBookingStatus(coachId, bookingId, {
                  action: 'cancel',
                  reason: 'Cancelled by coach',
                });
                
                if (result.success) {
                  setBookings(prev => prev.map(b => 
                    b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
                  ));
                } else {
                  throw new Error(result.error?.message || 'Failed to cancel booking');
                }
              } else {
                // Fallback for local state update if no coachId
                setBookings(prev => prev.map(b => 
                  b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
                ));
              }
            } catch (error) {
              console.error('BookingsManagement: Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          }
        },
      ]
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const now = new Date();
    const bookingDate = new Date(booking.scheduledAt);
    
    switch (selectedFilter) {
      case 'upcoming':
        return bookingDate > now && booking.status !== 'cancelled';
      case 'pending':
        return booking.status === 'pending';
      case 'completed':
        return booking.status === 'completed' || bookingDate < now;
      default:
        return true;
    }
  });

  const stats = {
    total: bookings.length,
    upcoming: bookings.filter(b => new Date(b.scheduledAt) > new Date() && b.status !== 'cancelled').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    thisWeek: bookings.filter(b => {
      const date = new Date(b.scheduledAt);
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return date >= now && date <= weekFromNow && b.status !== 'cancelled';
    }).length,
  };

  const renderBookingCard = (booking: Booking) => {
    const { date, time } = formatDateTime(booking.scheduledAt);
    const isPast = new Date(booking.scheduledAt) < new Date();
    
    return (
      <View key={booking.id} style={[styles.bookingCard, isPast && styles.bookingCardPast]}>
        <View style={styles.bookingHeader}>
          <View style={styles.clientInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{booking.clientName.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.clientName}>{booking.clientName}</Text>
              <Text style={styles.sessionType}>{getSessionTypeLabel(booking.sessionType)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cash-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>${booking.price}</Text>
          </View>
        </View>
        
        {booking.status === 'pending' && !isPast && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.actionButton, styles.confirmButton]}
              onPress={() => handleConfirmBooking(booking.id)}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(booking.id)}
            >
              <Text style={styles.cancelButtonText}>Decline</Text>
            </Pressable>
          </View>
        )}
        
        {booking.status === 'confirmed' && !isPast && (
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.actionButton, styles.rescheduleButton]}
              onPress={() => Alert.alert('Reschedule', 'Reschedule functionality coming soon')}
            >
              <Text style={styles.rescheduleButtonText}>Reschedule</Text>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={() => handleCancelBooking(booking.id)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading bookings...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Back to Coach Hub button - only on web */}
      {isDashboardMode && onBack && (
        <BackToHubButton
          hubName="Coach Hub"
          color="#6366f1"
          onPress={onBack}
          isMobileWeb={isWeb && screenWidth < 768}
          spinnerGif={spinnerGif}
        />
      )}

      {/* Status bar area */}
      <View style={{ height: insets.top, backgroundColor: '#6366f1' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
          <Text style={styles.headerTitle}>Bookings</Text>
          <Text style={styles.headerSubtitle}>Manage your scheduled sessions</Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: '#6366f1' }]}>
            <Text style={styles.statNumber}>{stats.upcoming}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'upcoming', 'pending', 'completed'] as const).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterTabText,
                selectedFilter === filter && styles.filterTabTextActive,
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Bookings List */}
        <View style={styles.bookingsContainer}>
          {filteredBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No bookings found</Text>
              <Text style={styles.emptySubtitle}>
                {selectedFilter === 'upcoming' 
                  ? 'You have no upcoming sessions scheduled'
                  : selectedFilter === 'pending'
                  ? 'No pending booking requests'
                  : 'No bookings match this filter'}
              </Text>
            </View>
          ) : (
            filteredBookings.map(renderBookingCard)
          )}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  collapsibleHeader: {
    backgroundColor: '#6366f1',
    overflow: 'hidden',
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  filterTabTextActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
  bookingsContainer: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingCardPast: {
    opacity: 0.7,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionType: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: '#fee2e2',
  },
  cancelButtonText: {
    color: '#dc2626',
    fontWeight: '600',
    fontSize: 14,
  },
  rescheduleButton: {
    backgroundColor: '#e0e7ff',
  },
  rescheduleButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
