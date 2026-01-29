import React, { useState, useContext, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons, BackToHubButton } from '../components/shared';
import { hasAIAccess } from '../utils/capabilities';
import { dashboardTheme } from '../theme/dashboardTheme';
import { coachService, CoachOverview as CoachOverviewData } from '../services';

const spinnerGif = require('../../assets/whatishealthyspinner.gif');
const isWeb = Platform.OS === 'web';

const { width: screenWidth } = Dimensions.get('window');

interface RevenueStats {
  totalRevenue: number;
  monthlyRevenue: number;
  activeClients: number;
  commissionRate: number;
}

interface CoachOverviewProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

export default function CoachOverview({
  isDashboardMode = false,
  onBack,
}: CoachOverviewProps) {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const coachId = user?.coachId;
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overviewData, setOverviewData] = useState<CoachOverviewData | null>(null);
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

  // Load coach overview data
  const loadOverviewData = useCallback(async () => {
    if (!coachId) {
      setLoading(false);
      return;
    }
    
    try {
      setError(null);
      const data = await coachService.getCoachOverview(coachId);
      setOverviewData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load overview';
      setError(message);
      console.error('CoachOverview: Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [coachId]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOverviewData();
    setRefreshing(false);
  }, [loadOverviewData]);

  // Use real API revenue data
  const revenueStats: RevenueStats = {
    totalRevenue: overviewData?.total_revenue ?? 0,
    monthlyRevenue: overviewData?.monthly_revenue ?? 0,
    activeClients: overviewData?.active_clients ?? 0,
    commissionRate: overviewData?.commission_rate ? overviewData.commission_rate * 100 : (user?.commissionRate || 30),
  };

  const quickActions = [
    {
      id: 'new-client',
      title: 'Add Client',
      icon: 'person-add',
      color: '#10b981',
      onPress: () => console.log('Add client'),
    },
    {
      id: 'create-plan',
      title: 'Create Plan',
      icon: 'restaurant',
      color: '#3b82f6',
      onPress: () => console.log('Create plan'),
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      icon: 'sparkles',
      color: '#8b5cf6',
      locked: !hasAIAccess(user),
      onPress: () => console.log('AI assistant'),
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: 'analytics',
      color: '#f59e0b',
      onPress: () => console.log('Analytics'),
    },
  ];

  // Get recent activity from API data
  const recentActivity = overviewData?.recent_activity?.length 
    ? overviewData.recent_activity.map((activity, index) => ({
        id: String(index + 1),
        client: activity.client_name || 'Client',
        action: formatActivityType(activity.type),
        time: formatRelativeTime(activity.timestamp),
      }))
    : [
        { id: '1', client: 'No recent activity', action: '', time: '' },
      ];

  // Helper to format activity type for display
  function formatActivityType(type: string): string {
    const typeMap: Record<string, string> = {
      'client_joined': 'Joined as client',
      'session_booked': 'Booked a session',
      'session_completed': 'Completed session',
      'meal_logged': 'Logged a meal',
      'goal_achieved': 'Achieved a goal',
      'invitation_sent': 'Invitation sent',
      'invitation_accepted': 'Accepted invitation',
    };
    return typeMap[type] || type.replace(/_/g, ' ');
  }

  // Helper to format timestamp as relative time
  function formatRelativeTime(timestamp: string): string {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading overview...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Back to Coach Hub button - only on web */}
      {isDashboardMode && onBack && (
        <BackToHubButton
          hubName="Coach Hub"
          color="#3b82f6"
          onPress={onBack}
          isMobileWeb={isWeb && screenWidth < 768}
          spinnerGif={spinnerGif}
        />
      )}

      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.headerTitle}>Coach Overview</Text>
            <Text style={styles.headerSubtitle}>Revenue & quick actions</Text>
            <View style={styles.statsRow}>
              <Text style={styles.statsLabel}>Active Clients</Text>
              <Text style={styles.statsValue}>{revenueStats.activeClients}</Text>
            </View>
          </Animated.View>
        </Animated.View>

        <Animated.ScrollView
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
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
          {/* Revenue Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Overview</Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['week', 'month', 'year'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Revenue Cards */}
          <View style={styles.revenueGrid}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="cash" size={28} color="#fff" />
              <Text style={styles.revenueLabel}>Monthly Revenue</Text>
              <Text style={styles.revenueValue}>
                ${revenueStats.monthlyRevenue.toFixed(2)}
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={['#3b82f6', '#2563eb']}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trending-up" size={28} color="#fff" />
              <Text style={styles.revenueLabel}>Total Revenue</Text>
              <Text style={styles.revenueValue}>
                ${revenueStats.totalRevenue.toFixed(2)}
              </Text>
            </LinearGradient>

            <LinearGradient
              colors={['#8b5cf6', '#7c3aed']}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people" size={28} color="#fff" />
              <Text style={styles.revenueLabel}>Active Clients</Text>
              <Text style={styles.revenueValue}>{revenueStats.activeClients}</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.revenueCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="stats-chart" size={28} color="#fff" />
              <Text style={styles.revenueLabel}>Commission</Text>
              <Text style={styles.revenueValue}>{revenueStats.commissionRate}%</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionCard}
                onPress={action.onPress}
                disabled={action.locked}
              >
                <View
                  style={[
                    styles.actionIconContainer,
                    { backgroundColor: action.color + '20' },
                  ]}
                >
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                  {action.locked && (
                    <View style={styles.lockBadge}>
                      <Ionicons name="lock-closed" size={12} color="#fff" />
                    </View>
                  )}
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                {action.locked && (
                  <Text style={styles.upgradeText}>Add AI</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivity.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityClient}>{activity.client}</Text>
                  <Text style={styles.activityAction}>{activity.action}</Text>
                </View>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            ))}
          </View>
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
    backgroundColor: '#e0f2fe',
  },
  collapsibleHeader: {
    backgroundColor: '#3b82f6',
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
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginRight: 8,
  },
  statsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#3b82f6',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  revenueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  revenueCard: {
    width: '48%',
    minWidth: 140,
    padding: 16,
    borderRadius: 16,
    minHeight: 120,
  },
  revenueLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
  },
  revenueValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    minWidth: 140,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  upgradeText: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 4,
  },
  activityList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityClient: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityAction: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
});
