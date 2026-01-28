import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { coachService } from '../services';
import type { RootStackParamList } from '../types/navigation';

interface RouteParams {
  coachId: string;
  coachName: string;
}

type SessionType = 'initial-60' | 'followup-30' | 'followup-60';
type PaymentMethod = 'pay-now' | 'membership';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface DaySlots {
  date: Date;
  dateString: string;
  dayName: string;
  slots: TimeSlot[];
}

export default function SessionBooking() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'SessionBooking'>>();
  const { coachId, coachName } = route.params;
  const { userId } = useAuth();

  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const HEADER_MAX_HEIGHT = 140;
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

  const [sessionType, setSessionType] = useState<SessionType>('initial-60');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pay-now');
  const [loading, setLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [availableDays, setAvailableDays] = useState<DaySlots[]>([]);

  useEffect(() => {
    loadAvailability();
  }, [coachId]);

  const loadAvailability = async () => {
    try {
      setLoading(true);

      // Calculate date range (next 7 days)
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      // Call API to get coach availability
      // GET /api/coaches/{coachId}/availability
      const result = await coachService.getCoachAvailability(coachId, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });

      if (result.success && result.data?.available_slots) {
        // Transform API response to local DaySlots format
        const days: DaySlots[] = result.data.available_slots.map(slot => {
          const date = new Date(slot.date);
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          
          return {
            date,
            dateString: `${monthNames[date.getMonth()]} ${date.getDate()}`,
            dayName: dayNames[date.getDay()],
            slots: slot.slots.map(time => ({
              time: formatTimeSlot(time),
              available: true,
            })),
          };
        });
        setAvailableDays(days);
      } else {
        // Show error state - no mock data fallback
        console.error('SessionBooking: API returned error');
        setAvailableDays([]);
      }
    } catch (error) {
      console.error('Load availability error:', error);
      Alert.alert('Error', 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  // Helper to format time slot from 24h to 12h format
  const formatTimeSlot = (time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const sessionTypes = [
    {
      id: 'initial-60' as SessionType,
      title: 'Initial Consultation',
      duration: '60 minutes',
      price: '$150',
      description: 'Comprehensive assessment and goal setting',
    },
    {
      id: 'followup-30' as SessionType,
      title: 'Follow-up Session',
      duration: '30 minutes',
      price: '$75',
      description: 'Quick check-in and adjustments',
    },
    {
      id: 'followup-60' as SessionType,
      title: 'Extended Follow-up',
      duration: '60 minutes',
      price: '$120',
      description: 'In-depth progress review',
    },
  ];

  const handleBookSession = async () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing Information', 'Please select a date and time');
      return;
    }

    if (!coachId) {
      Alert.alert('Error', 'Coach not found. Please try again.');
      return;
    }

    if (!userId) {
      Alert.alert('Sign in required', 'Please sign in to book a session.');
      return;
    }

    setIsBooking(true);

    try {
      const selectedDay = availableDays.find((d) => d.dateString === selectedDate);
      if (!selectedDay) {
        throw new Error('Selected date unavailable');
      }

      const timeMatch = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeMatch) {
        throw new Error('Invalid time format');
      }
      const [, hourStr, minuteStr, meridiem] = timeMatch;
      let hour = parseInt(hourStr, 10) % 12;
      if (meridiem?.toUpperCase() === 'PM') {
        hour += 12;
      }
      const minutes = parseInt(minuteStr, 10) || 0;

      const scheduledAtDate = new Date(selectedDay.date);
      scheduledAtDate.setHours(hour, minutes, 0, 0);
      const scheduledAtIso = scheduledAtDate.toISOString();

      const durationMinutes = sessionType === 'followup-30' ? 30 : 60;
      const apiSessionType =
        sessionType === 'initial-60'
          ? 'initial_consultation'
          : sessionType === 'followup-30'
            ? 'followup_30'
            : 'followup_60';
      const priceNumber = Number((selectedSessionType?.price || '').replace(/[^0-9.]/g, '')) || undefined;

      const result = await userService.bookCoachSession(coachId, {
        scheduled_at: scheduledAtIso,
        duration_minutes: durationMinutes,
        session_type: apiSessionType,
        price: priceNumber,
        client_id: userId,
        notes: paymentMethod === 'membership' ? 'membership' : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to book session');
      }

      Alert.alert(
        'Session Booked!',
        `Your ${sessionTypes.find(s => s.id === sessionType)?.title} with ${coachName} is confirmed for ${selectedDate} at ${selectedTime}.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('CoachDashboardPage'),
          },
        ]
      );
    } catch (error) {
      console.error('Book session error:', error);
      Alert.alert('Error', 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const selectedSessionType = sessionTypes.find(s => s.id === sessionType);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading availability...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Status bar area */}
      <View style={{ height: insets.top, backgroundColor: '#6366f1' }} />

      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
        <Animated.View style={[styles.headerContent, { opacity: headerOpacity }]}>
          <Text style={styles.headerTitle}>Book Session</Text>
          <Text style={styles.headerSubtitle}>with {coachName}</Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Session Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Type</Text>
          {sessionTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.sessionTypeCard,
                sessionType === type.id && styles.sessionTypeCardActive,
              ]}
              onPress={() => setSessionType(type.id)}
            >
              <View style={styles.radioOuter}>
                {sessionType === type.id && <View style={styles.radioInner} />}
              </View>
              <View style={styles.sessionTypeInfo}>
                <View style={styles.sessionTypeHeader}>
                  <Text
                    style={[
                      styles.sessionTypeTitle,
                      sessionType === type.id && styles.sessionTypeTitleActive,
                    ]}
                  >
                    {type.title}
                  </Text>
                  <Text style={styles.sessionTypePrice}>{type.price}</Text>
                </View>
                <Text style={styles.sessionTypeDuration}>{type.duration}</Text>
                <Text style={styles.sessionTypeDescription}>{type.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Calendar / Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroller}>
            {availableDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dateCard,
                  selectedDate === day.dateString && styles.dateCardActive,
                ]}
                onPress={() => {
                  setSelectedDate(day.dateString);
                  setSelectedTime(null); // Reset time selection
                }}
              >
                <Text
                  style={[
                    styles.dayName,
                    selectedDate === day.dateString && styles.dayNameActive,
                  ]}
                >
                  {day.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateText,
                    selectedDate === day.dateString && styles.dateTextActive,
                  ]}
                >
                  {day.dateString}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Slot Selection */}
        {selectedDate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Time</Text>
            <View style={styles.timeGrid}>
              {availableDays
                .find((d) => d.dateString === selectedDate)
                ?.slots.map((slot, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeSlot,
                      !slot.available && styles.timeSlotUnavailable,
                      selectedTime === slot.time && styles.timeSlotActive,
                    ]}
                    onPress={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                  >
                    <Text
                      style={[
                        styles.timeSlotText,
                        !slot.available && styles.timeSlotTextUnavailable,
                        selectedTime === slot.time && styles.timeSlotTextActive,
                      ]}
                    >
                      {slot.time}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* Payment Method */}
        {selectedTime && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>
            
            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'pay-now' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('pay-now')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'pay-now' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text
                  style={[
                    styles.paymentTitle,
                    paymentMethod === 'pay-now' && styles.paymentTitleActive,
                  ]}
                >
                  Pay Now
                </Text>
                <Text style={styles.paymentDescription}>
                  {selectedSessionType?.price} charged immediately
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.paymentCard,
                paymentMethod === 'membership' && styles.paymentCardActive,
              ]}
              onPress={() => setPaymentMethod('membership')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'membership' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.paymentInfo}>
                <Text
                  style={[
                    styles.paymentTitle,
                    paymentMethod === 'membership' && styles.paymentTitleActive,
                  ]}
                >
                  Coaching Membership
                </Text>
                <Text style={styles.paymentDescription}>
                  Use included session from membership
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Booking Summary */}
        {selectedDate && selectedTime && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Coach:</Text>
              <Text style={styles.summaryValue}>{coachName}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Session:</Text>
              <Text style={styles.summaryValue}>{selectedSessionType?.title}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Date:</Text>
              <Text style={styles.summaryValue}>{selectedDate}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Time:</Text>
              <Text style={styles.summaryValue}>{selectedTime}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total:</Text>
              <Text style={styles.summaryTotalValue}>{selectedSessionType?.price}</Text>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Book Button */}
      {selectedDate && selectedTime && (
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.bookButton, isBooking && styles.bookButtonDisabled]}
            onPress={handleBookSession}
            disabled={isBooking}
          >
            {isBooking ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.bookButtonText}>Booking...</Text>
              </View>
            ) : (
              <Text style={styles.bookButtonText}>Confirm Booking</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  collapsibleHeader: {
    backgroundColor: '#6366f1',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  sessionTypeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  sessionTypeCardActive: {
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
    marginTop: 2,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  sessionTypeInfo: {
    flex: 1,
  },
  sessionTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  sessionTypeTitleActive: {
    color: '#1e40af',
  },
  sessionTypePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  sessionTypeDuration: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  sessionTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  dateScroller: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  dateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    minWidth: 80,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  dateCardActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  dayNameActive: {
    color: '#fff',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  dateTextActive: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  timeSlot: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    minWidth: 100,
    alignItems: 'center',
  },
  timeSlotActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  timeSlotUnavailable: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  timeSlotTextActive: {
    color: '#fff',
  },
  timeSlotTextUnavailable: {
    color: '#9ca3af',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  paymentCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  paymentTitleActive: {
    color: '#065f46',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  summaryTotal: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  bookButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
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
