import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SvgIcon from '../components/shared/SvgIcon';
import { AuthContext } from '../context/AuthContext';
import { mealCalendarService } from '../services/mealCalendarService';
import { CalendarDay as MealCalendarDay } from '../services/mealCalendarService';

interface MealCalendarProps {
  isDashboardMode?: boolean;
}

// Meal type icons and colors
const mealTypeConfig: Record<string, { icon: string; color: string; bgColor: string }> = {
  breakfast: { icon: 'sunny-outline', color: '#f59e0b', bgColor: '#fef3c7' },
  lunch: { icon: 'restaurant-outline', color: '#3b82f6', bgColor: '#dbeafe' },
  dinner: { icon: 'moon-outline', color: '#8b5cf6', bgColor: '#ede9fe' },
  snack: { icon: 'cafe-outline', color: '#10b981', bgColor: '#d1fae5' },
  'pre-workout': { icon: 'fitness-outline', color: '#f59e0b', bgColor: '#fef3c7' },
  'post-workout': { icon: 'fitness-outline', color: '#10b981', bgColor: '#d1fae5' },
};

const MealCalendar: React.FC<MealCalendarProps> = ({ isDashboardMode = false }) => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const insets = useSafeAreaInsets();
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
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
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<MealCalendarDay[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  // Load calendar data
  const loadCalendarData = async () => {
    if (!userId) {
      console.log('[MealCalendar] No userId for calendar data');
      return;
    }

    try {
      setCalendarLoading(true);
      setCalendarError(null);

      // Get the month range to load
      const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
      const lastDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];

      console.log('[MealCalendar] Loading calendar data from', startDate, 'to', endDate);

      // Load calendar days from services.wihy.ai
      const days = await mealCalendarService.getCalendar(userId, startDate, endDate);
      
      if (days && days.length > 0) {
        console.log('[MealCalendar] Loaded', days.length, 'calendar days');
        setCalendarDays(days);
      } else {
        console.log('[MealCalendar] No calendar data found for month');
        setCalendarDays([]);
      }
    } catch (error) {
      console.error('[MealCalendar] Error loading calendar data:', error);
      setCalendarError('Failed to load calendar');
    } finally {
      setCalendarLoading(false);
    }
  };

  // Load calendar data when month changes
  useEffect(() => {
    if (userId) {
      loadCalendarData();
    }
  }, [calendarMonth, userId]);

  // Generate calendar grid
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: Array<{ date: Date | null; day: number; isCurrentMonth: boolean; meals: any[] }> = [];
    
    // Add empty days for padding
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: null, day: 0, isCurrentMonth: false, meals: [] });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Find meals for this day from calendarDays
      const dayData = calendarDays.find(d => d.date === dateStr);
      const dayMeals = dayData?.meals || [];
      
      days.push({ date: currentDate, day, isCurrentMonth: true, meals: dayMeals });
    }
    
    return days;
  };

  const calendarGridDays = getDaysInMonth(calendarMonth);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  const isSelected = (date: Date | null) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() && 
           date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };
  
  const handleDayPress = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handleNavigateMonth = (delta: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };
  
  // Get meals for selected date
  const dateStr = selectedDate.toISOString().split('T')[0];
  const selectedDayData = calendarDays.find(d => d.date === dateStr);
  const selectedDayMeals = selectedDayData?.meals || [];

  return (
    <View style={styles.calendarContainer}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#f59e0b' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#f59e0b' }]}>
        <Animated.View style={[styles.dashboardHeaderContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
          <Text style={styles.dashboardHeaderTitle}>Meal Calendar</Text>
          <Text style={styles.dashboardHeaderSubtitle}>
            {calendarLoading ? 'Loading...' : calendarDays.length > 0 ? `${calendarDays.length} days scheduled` : 'No meals scheduled'}
          </Text>
        </Animated.View>
      </Animated.View>
      
      <Animated.ScrollView
        style={styles.calendarContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {calendarLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 16, color: '#6b7280', fontSize: 14 }}>Loading calendar...</Text>
          </View>
        ) : calendarError ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <SvgIcon name="alert-circle-outline" size={48} color="#ef4444" />
            <Text style={{ marginTop: 16, color: '#ef4444', fontSize: 14 }}>{calendarError}</Text>
            <TouchableOpacity 
              style={{ marginTop: 16, padding: 12, backgroundColor: '#3b82f6', borderRadius: 8 }}
              onPress={() => loadCalendarData()}
            >
              <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Month Navigation */}
            <View style={styles.calendarMonthNav}>
              <TouchableOpacity onPress={() => handleNavigateMonth(-1)} style={styles.calendarNavButton}>
                <SvgIcon name="chevron-back" size={24} color="#3b82f6" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthTitle}>
                {monthNames[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
              </Text>
              <TouchableOpacity onPress={() => handleNavigateMonth(1)} style={styles.calendarNavButton}>
                <SvgIcon name="chevron-forward" size={24} color="#3b82f6" />
              </TouchableOpacity>
            </View>
            
            {/* Day Names Header */}
            <View style={styles.calendarDayNames}>
              {dayNames.map((name) => (
                <Text key={name} style={styles.calendarDayName}>{name}</Text>
              ))}
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {calendarGridDays.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDayCell,
                    !item.isCurrentMonth && styles.calendarDayCellEmpty,
                    isToday(item.date) && styles.calendarDayCellToday,
                    isSelected(item.date) && styles.calendarDayCellSelected,
                  ]}
                  onPress={() => handleDayPress(item.date)}
                  disabled={!item.isCurrentMonth}
                >
                  {item.isCurrentMonth && (
                    <>
                      <Text style={[
                        styles.calendarDayText,
                        isToday(item.date) && styles.calendarDayTextToday,
                        isSelected(item.date) && styles.calendarDayTextSelected,
                      ]}>
                        {item.day}
                      </Text>
                      {item.meals.length > 0 && (
                        <View style={styles.calendarMealDots}>
                          {item.meals.slice(0, 3).map((meal, mealIdx) => (
                            <View 
                              key={mealIdx} 
                              style={[
                                styles.calendarMealDot,
                                { backgroundColor: mealTypeConfig[meal.meal_slot]?.color || '#9ca3af' }
                              ]} 
                            />
                          ))}
                        </View>
                      )}
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Selected Day Meals */}
            <View style={styles.calendarSelectedDay}>
              <View style={styles.calendarSelectedDayHeader}>
                <Text style={styles.calendarSelectedDayTitle}>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </Text>
                <TouchableOpacity style={styles.addMealButton}>
                  <SvgIcon name="add" size={20} color="#ffffff" />
                  <Text style={styles.addMealButtonText}>Add Meal</Text>
                </TouchableOpacity>
              </View>
              
              {selectedDayMeals.length > 0 ? (
                <View style={styles.calendarMealsList}>
                  {selectedDayMeals.map((scheduledMeal, index) => (
                    <View key={index} style={styles.calendarMealCard}>
                      <View style={[
                        styles.calendarMealIcon,
                        { backgroundColor: mealTypeConfig[scheduledMeal.meal_slot]?.bgColor || '#f3f4f6' }
                      ]}>
                        <SvgIcon 
                          name={mealTypeConfig[scheduledMeal.meal_slot]?.icon as any || 'restaurant-outline'} 
                          size={20} 
                          color={mealTypeConfig[scheduledMeal.meal_slot]?.color || '#6b7280'} 
                        />
                      </View>
                      <View style={styles.calendarMealInfo}>
                        <Text style={styles.calendarMealType}>
                          {scheduledMeal.meal_slot.charAt(0).toUpperCase() + scheduledMeal.meal_slot.slice(1)}
                        </Text>
                        <Text style={styles.calendarMealName}>{scheduledMeal.meal.name}</Text>
                        <Text style={styles.calendarMealMacros}>
                          {scheduledMeal.meal.nutrition.calories || 0} cal • {scheduledMeal.meal.nutrition.protein || 0}g protein
                        </Text>
                      </View>
                      <SvgIcon name="chevron-forward" size={20} color="#9ca3af" />
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.calendarNoMeals}>
                  <SvgIcon name="restaurant-outline" size={48} color="#d1d5db" />
                  <Text style={styles.calendarNoMealsText}>No meals planned for this day</Text>
                </View>
              )}
            </View>
          </>
        )}
        
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  collapsibleHeader: {
    backgroundColor: '#f59e0b',
    overflow: 'hidden',
  },
  dashboardHeaderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dashboardHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  dashboardHeaderSubtitle: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
  },
  calendarContent: {
    flex: 1,
  },
  calendarMonthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  calendarNavButton: {
    padding: 8,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calendarDayNames: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
  },
  calendarDayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  calendarDayCellEmpty: {
    backgroundColor: '#f9fafb',
  },
  calendarDayCellToday: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  calendarDayCellSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayTextToday: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  calendarDayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  calendarMealDots: {
    flexDirection: 'row',
    marginTop: 2,
    gap: 2,
  },
  calendarMealDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  calendarSelectedDay: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    padding: 16,
  },
  calendarSelectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarSelectedDayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addMealButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  calendarMealsList: {
    gap: 12,
  },
  calendarMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    gap: 12,
  },
  calendarMealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarMealInfo: {
    flex: 1,
  },
  calendarMealType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  calendarMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  calendarMealMacros: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  calendarNoMeals: {
    padding: 40,
    alignItems: 'center',
  },
  calendarNoMealsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default MealCalendar;
