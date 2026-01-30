import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardColors, Ionicons } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { familyService, Family, FamilyMember, FamilyDashboard as FamilyDashboardData } from '../services/familyService';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';

const isWeb = Platform.OS === 'web';

const { width: screenWidth } = Dimensions.get('window');

interface ChildHealthData {
  id: string;
  name: string;
  age: number;
  role: string;
  avatar?: string;
  healthScore?: number;
  mealsLogged?: number;
  workoutsCompleted?: number;
  lastActive?: string;
}

export default function ParentDashboard() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [selectedChild, setSelectedChild] = useState<ChildHealthData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [familyMembers, setFamilyMembers] = useState<ChildHealthData[]>([]);
  const [familyStats, setFamilyStats] = useState<FamilyDashboardData['family_stats'] | null>(null);
  const [recentActivity, setRecentActivity] = useState<FamilyDashboardData['recent_activity']>([]);
  const [error, setError] = useState<string | null>(null);

  const { isTablet } = useDashboardLayout();
  
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

  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Load family data from API
  const loadFamilyData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userId = user?.id;
      if (!userId) {
        setError('Please log in to view family data');
        setIsLoading(false);
        return;
      }

      // Get user's family
      const userFamily = await familyService.getUserFamily(userId);
      
      if (!userFamily) {
        setError('No family found. Create or join a family in your Profile settings.');
        setIsLoading(false);
        return;
      }

      setFamily(userFamily);

      // Get family members
      const members = await familyService.getMembers(userFamily.id);
      
      // Transform to ChildHealthData format (only show children, not the current user)
      // Note: Individual member health data not yet available from API
      // Using family_stats for aggregate data when available
      const childMembers: ChildHealthData[] = members
        .filter(m => m.role === 'CHILD' || (m.id !== userId && m.role === 'MEMBER'))
        .map(m => ({
          id: m.id,
          name: m.name,
          age: calculateAge(m.age_group),
          role: m.role,
          avatar: m.avatar_url,
          healthScore: undefined, // Will show "--" in UI until backend provides per-member data
          mealsLogged: undefined, // Aggregate data available in familyStats
          workoutsCompleted: undefined,
          lastActive: m.is_active ? 'Active now' : 'Yesterday',
        }));

      setFamilyMembers(childMembers);

      // Try to get dashboard data with stats
      try {
        const dashboardData = await familyService.getFamilyDashboard(userFamily.id);
        if (dashboardData) {
          setFamilyStats(dashboardData.family_stats);
          setRecentActivity(dashboardData.recent_activity || []);
        }
      } catch (dashErr) {
        console.log('[ParentDashboard] Dashboard data not available:', dashErr);
      }

    } catch (err) {
      console.error('[ParentDashboard] Error loading family data:', err);
      setError('Failed to load family data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate approximate age from age_group
  const calculateAge = (ageGroup?: 'adult' | 'teen' | 'child'): number => {
    switch (ageGroup) {
      case 'child': return 8;
      case 'teen': return 14;
      case 'adult': return 30;
      default: return 10;
    }
  };

  useEffect(() => {
    loadFamilyData();
  }, [loadFamilyData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFamilyData();
    setRefreshing(false);
  };

  // Progress card data for selected child - matches Health Overview pattern
  // Note: Per-member health data not yet available from API, showing "--" for unavailable data
  const getChildProgressCards = (child: ChildHealthData) => [
    {
      id: '1',
      title: 'Health Score',
      value: child.healthScore !== undefined ? `${child.healthScore}` : '--',
      unit: '/100',
      icon: 'heart',
      color: dashboardColors.success,
      status: child.healthScore !== undefined 
        ? (child.healthScore >= 80 ? 'good' : child.healthScore >= 60 ? 'warning' : 'alert')
        : 'pending',
      trend: 'stable' as const,
    },
    {
      id: '2',
      title: 'Meals Today',
      value: child.mealsLogged !== undefined ? `${child.mealsLogged}` : '--',
      unit: 'meals',
      icon: 'restaurant',
      color: dashboardColors.orange,
      status: child.mealsLogged !== undefined
        ? (child.mealsLogged >= 3 ? 'good' : child.mealsLogged >= 1 ? 'warning' : 'alert')
        : 'pending',
      trend: 'stable' as const,
    },
    {
      id: '3',
      title: 'Activity',
      value: child.workoutsCompleted !== undefined ? `${child.workoutsCompleted}` : '--',
      unit: 'sessions',
      icon: 'fitness',
      color: dashboardColors.primary,
      status: child.workoutsCompleted !== undefined
        ? (child.workoutsCompleted >= 1 ? 'good' : 'warning')
        : 'pending',
      trend: 'stable' as const,
    },
    {
      id: '4',
      title: 'Steps',
      value: '--',
      unit: 'steps',
      icon: 'footsteps',
      color: '#3b82f6',
      status: 'pending' as const,
      trend: 'stable' as const,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return dashboardTheme.colors.success;
      case 'warning':
        return dashboardTheme.colors.warning;
      case 'alert':
        return dashboardTheme.colors.error;
      default:
        return dashboardTheme.colors.textSecondary;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      case 'stable':
        return 'remove';
      default:
        return 'remove';
    }
  };

  const renderChildCard = (child: ChildHealthData) => {
    const isSelected = selectedChild?.id === child.id;
    return (
      <TouchableOpacity
        key={child.id}
        style={[
          styles.childCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          isSelected && styles.childCardSelected,
        ]}
        onPress={() => setSelectedChild(isSelected ? null : child)}
        activeOpacity={0.7}
      >
        <View style={[styles.childAvatar, isSelected && styles.childAvatarSelected]}>
          <Text style={[styles.childAvatarText, isSelected && styles.childAvatarTextSelected]}>
            {child.name[0]}
          </Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <Text style={styles.childAge}>{child.age} years old</Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={dashboardColors.success} />
        )}
      </TouchableOpacity>
    );
  };

  const renderProgressCard = (card: ReturnType<typeof getChildProgressCards>[0]) => {
    const statusColor = getStatusColor(card.status);
    return (
      <View key={card.id} style={[styles.progressCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.progressIcon, { backgroundColor: statusColor + '20' }]}>
          <Ionicons name={card.icon as any} size={24} color={statusColor} />
        </View>
        <View style={styles.progressValueContainer}>
          <Text style={styles.progressValue}>{card.value}</Text>
          <Text style={styles.progressUnit}>{card.unit}</Text>
        </View>
        <Text style={styles.progressTitle}>{card.title}</Text>
        <View style={styles.trendContainer}>
          <Ionicons
            name={getTrendIcon(card.trend) as any}
            size={16}
            color={statusColor}
          />
        </View>
      </View>
    );
  };

  const renderActivityItem = (activity: FamilyDashboardData['recent_activity'][0]) => {
    const getActivityIcon = (type: string) => {
      switch (type) {
        case 'meal_logged': return 'restaurant';
        case 'workout_completed': return 'fitness';
        case 'item_checked': return 'checkbox';
        case 'plan_shared': return 'share';
        default: return 'ellipse';
      }
    };

    const getActivityColor = (type: string) => {
      switch (type) {
        case 'meal_logged': return dashboardColors.orange;
        case 'workout_completed': return dashboardColors.primary;
        case 'item_checked': return dashboardColors.success;
        case 'plan_shared': return '#8b5cf6';
        default: return dashboardTheme.colors.textSecondary;
      }
    };

    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: getActivityColor(activity.type) + '20' }]}>
          <Ionicons name={getActivityIcon(activity.type) as any} size={18} color={getActivityColor(activity.type)} />
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityMember}>{activity.member_name}</Text>
          <Text style={styles.activityDescription}>{activity.description}</Text>
        </View>
        <Text style={styles.activityTime}>
          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ height: insets.top, backgroundColor: '#f59e0b' }} />
        <View style={[styles.collapsibleHeader, { height: HEADER_MAX_HEIGHT }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Family Dashboard</Text>
            <Text style={styles.headerSubtitle}>Track your family's health journey</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ec4899" />
          <Text style={styles.loadingText}>Loading family data...</Text>
        </View>
      </View>
    );
  }

  // Error state - Navigate to Enrollment to set up family
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ height: insets.top, backgroundColor: '#f59e0b' }} />
        <View style={[styles.collapsibleHeader, { height: HEADER_MAX_HEIGHT }]}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Family Dashboard</Text>
            <Text style={styles.headerSubtitle}>Track your family's health journey</Text>
          </View>
        </View>
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#ec4899" />
            <Text style={styles.emptyStateTitle}>No Family Set Up Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Create or join a family to track your children's health
            </Text>
            <TouchableOpacity 
              style={styles.setupButton} 
              onPress={() => navigation.navigate('Enrollment', { tab: 'parent' })}
            >
              <LinearGradient
                colors={['#ec4899', '#db2777']}
                style={styles.setupButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="add-circle" size={24} color="#ffffff" />
                <Text style={styles.setupButtonText}>Set Up Family</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => navigation.navigate('Home' as any)}
            >
              <Text style={styles.secondaryButtonText}>Go to Dashboard</Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  }

  return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Status bar area - solid color */}
        <View style={{ height: insets.top, backgroundColor: '#f59e0b' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Family Dashboard</Text>
            <Text style={styles.headerSubtitle}>{family?.name || "Track your family's health journey"}</Text>
            {familyMembers.length > 0 && (
              <View style={styles.headerStats}>
                <View style={styles.headerStatBadge}>
                  <Text style={styles.headerStatText}>{familyMembers.length + 1} family members</Text>
                </View>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView 
          style={styles.scrollView}
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
          {/* Family Stats Summary */}
          {familyStats && (
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Family Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Ionicons name="restaurant" size={24} color={dashboardColors.orange} />
                  <Text style={styles.statValue}>{familyStats.total_meals_logged_today}</Text>
                  <Text style={styles.statLabel}>Meals Today</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Ionicons name="fitness" size={24} color={dashboardColors.primary} />
                  <Text style={styles.statValue}>{familyStats.total_workouts_completed_week}</Text>
                  <Text style={styles.statLabel}>Workouts This Week</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                  <Ionicons name="calendar" size={24} color={dashboardColors.success} />
                  <Text style={styles.statValue}>{familyStats.active_meal_plans}</Text>
                  <Text style={styles.statLabel}>Active Plans</Text>
                </View>
              </View>
            </View>
          )}

          {/* Children Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Children</Text>
            {familyMembers.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childrenScroll}>
                {familyMembers.map(renderChildCard)}
              </ScrollView>
            ) : (
              <View style={[styles.noChildrenContainer, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Ionicons name="person-add-outline" size={32} color="#9ca3af" />
                <Text style={styles.noChildrenText}>No children added yet</Text>
                <Text style={styles.noChildrenSubtext}>Add family members in Profile settings</Text>
              </View>
            )}
          </View>

          {/* Selected Child Progress */}
          {selectedChild ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{selectedChild.name}'s Progress</Text>
              <View style={styles.progressGrid}>
                {getChildProgressCards(selectedChild).map(renderProgressCard)}
              </View>
            </View>
          ) : familyMembers.length > 0 ? (
            <View style={styles.selectChildPrompt}>
              <Ionicons name="people" size={48} color="#d1d5db" />
              <Text style={styles.selectChildText}>Select a child to view their health details</Text>
            </View>
          ) : null}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={[styles.activityList, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                {recentActivity.slice(0, 5).map(renderActivityItem)}
              </View>
            </View>
          )}

          {/* Go to My Dashboard Button */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.goToDashboardButton}
              onPress={() => navigation.navigate('Home' as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#ec4899', '#db2777']}
                style={styles.goToDashboardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="home" size={24} color="#ffffff" />
                <View style={styles.goToDashboardTextContainer}>
                  <Text style={styles.goToDashboardTitle}>Go to My Dashboard</Text>
                  <Text style={styles.goToDashboardSubtitle}>View your personal health data</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

            {/* Bottom spacing */}
            <View style={{ height: 40 }} />
          </Animated.ScrollView>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },
  
  // Collapsing Header
  collapsibleHeader: {
    backgroundColor: '#f59e0b',
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 16,
  },
  headerStats: {
    flexDirection: 'row',
  },
  headerStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  headerStatText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: dashboardTheme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  setupButton: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  setupButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  setupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  secondaryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ec4899',
  },
  retryButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ec4899',
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginBottom: 12,
  },
  statsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  childrenScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    minWidth: 180,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  childCardSelected: {
    borderColor: dashboardColors.success,
    backgroundColor: dashboardColors.success + '10',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: dashboardColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  childAvatarSelected: {
    backgroundColor: dashboardColors.success + '30',
  },
  childAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: dashboardColors.primary,
  },
  childAvatarTextSelected: {
    color: dashboardColors.success,
  },
  childInfo: {
    flex: 1,
    marginLeft: 12,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },
  childAge: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 2,
  },
  noChildrenContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 16,
    borderWidth: 2,
  },
  noChildrenText: {
    fontSize: 16,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginTop: 12,
  },
  noChildrenSubtext: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 4,
  },
  selectChildPrompt: {
    alignItems: 'center',
    paddingVertical: 48,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  selectChildText: {
    fontSize: 16,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  progressCard: {
    // 2-column layout matching MyProgressDashboard pattern
    width: '48.5%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    alignItems: 'center',
    borderWidth: 2,
  },
  progressIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.md,
    flexShrink: 0,
  },
  progressValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
  },
  progressUnit: {
    fontSize: 14,
    color: dashboardTheme.colors.textSecondary,
    marginLeft: 2,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  trendContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  activityList: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    marginLeft: 12,
  },
  activityMember: {
    fontSize: 14,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
  },
  activityDescription: {
    fontSize: 13,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: dashboardTheme.colors.textSecondary,
  },
  goToDashboardButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  goToDashboardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  goToDashboardTextContainer: {
    flex: 1,
  },
  goToDashboardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
  },
  goToDashboardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
