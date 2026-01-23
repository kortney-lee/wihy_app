import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Linking, Modal, Pressable, useWindowDimensions, Animated, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader, Ionicons } from '../components/shared';
import { dashboardTheme } from '../theme/dashboardTheme';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import {
  useDashboardNavigation,
  BaseDashboardProps,
  BaseQuickAction,
  BaseMetric,
  dashboardColors,
} from '../components/shared';
import { healthDataService } from '../services/healthDataService';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { wihyApiService } from '../services/wihyApiService';
import type { ScanHistoryItem } from '../services/types';
import { AuthContext } from '../context/AuthContext';

// Remove static screenWidth - use dynamic values instead
const BASE_SCREEN_WIDTH = 390; // Reference for scaling

interface QuickActionCard extends BaseQuickAction {}
interface HealthSummaryItem extends BaseMetric {}

// Static data - defined outside component for optimal performance
const TABS = ['Summary', 'Insights', 'Wellness', 'Trends', 'Predictive'];

const OverviewDashboard: React.FC<BaseDashboardProps> = ({ onAnalyze }) => {
  const { user } = React.useContext(AuthContext);
  const layout = useDashboardLayout();
  const { navigation, navigateToCamera, navigateToChat, handleAnalyze } = useDashboardNavigation();
  const [selectedTab, setSelectedTab] = useState('Summary');
  const [healthSummaryData, setHealthSummaryData] = useState<HealthSummaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanHistoryItem[]>([]);
  const [scansLoading, setScansLoading] = useState(false);

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
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Load recent scans
  const loadRecentScans = useCallback(async () => {
    try {
      setScansLoading(true);
      const result = await wihyApiService.getScanHistory(5);
      if (result.success && result.scans) {
        setRecentScans(result.scans);
      }
    } catch (error) {
      console.error('Failed to load recent scans:', error);
    } finally {
      setScansLoading(false);
    }
  }, []);

  // Load health data
  const loadHealthData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userId = user?.id;

      if (!userId) {
        console.error('[OverviewDashboard] User ID not available');
        setIsLoading(false);
        return;
      }

      // Try to get health data from tracker first
      const initialized = await healthDataService.initialize();
      
      // Fetch data from all services in parallel
      const [healthScore, todayMetrics, weeklyData, mealSummary, todayWorkout, workoutHistory] = await Promise.all([
        initialized ? healthDataService.getHealthScore() : Promise.resolve(0),
        initialized ? healthDataService.getTodayMetrics() : Promise.resolve(null),
        initialized ? healthDataService.getWeeklyData() : Promise.resolve(null),
        nutritionService.getDailySummary(userId).catch(() => null),
        fitnessService.getTodayWorkout(userId).catch(() => null),
        fitnessService.getHistory(userId, 7).catch(() => null),
      ]);

      const summary: HealthSummaryItem[] = [];

      // ===== HEALTH TRACKER DATA (if available) =====
      if (initialized && todayMetrics) {
        // Health Score
        let scoreStatus: 'good' | 'warning' | 'alert' = 'good';
        if (healthScore < 60) scoreStatus = 'alert';
        else if (healthScore < 75) scoreStatus = 'warning';

        summary.push({
          id: '1',
          title: 'Health Score',
          value: healthScore.toString(),
          unit: '/100',
          status: scoreStatus,
          trend: 'up',
          icon: 'fitness',
          color: scoreStatus === 'good' ? '#10b981' : scoreStatus === 'warning' ? '#f59e0b' : '#ef4444',
        });

        // Daily Steps
        const steps = todayMetrics.steps;
        const stepsTrend = weeklyData?.trends.steps.trend || 'stable';
        let stepsStatus: 'good' | 'warning' | 'alert' = 'good';
        if (steps < 5000) stepsStatus = 'alert';
        else if (steps < 8000) stepsStatus = 'warning';

        summary.push({
          id: '2',
          title: 'Daily Steps',
          value: healthDataService.formatNumber(steps),
          unit: 'steps',
          status: stepsStatus,
          trend: stepsTrend,
          icon: 'footsteps',
          color: '#3b82f6',
        });

        // Active Minutes
        summary.push({
          id: '3',
          title: 'Active Minutes',
          value: todayMetrics.activeMinutes.toString(),
          unit: 'min',
          status: todayMetrics.activeMinutes >= 30 ? 'good' : 'warning',
          trend: weeklyData?.trends.activeMinutes.trend || 'stable',
          icon: 'fitness',
          color: '#10b981',
        });

        // Distance
        const distance = todayMetrics.distance;
        summary.push({
          id: '4',
          title: 'Distance',
          value: distance.toFixed(1),
          unit: 'km',
          status: distance >= 5 ? 'good' : distance >= 3 ? 'warning' : 'alert',
          trend: 'up',
          icon: 'walk',
          color: '#8b5cf6',
        });

        // Calories Burned (from tracker)
        summary.push({
          id: '5',
          title: 'Calories Burned',
          value: healthDataService.formatNumber(todayMetrics.calories),
          unit: 'kcal',
          status: todayMetrics.calories >= 400 ? 'good' : 'warning',
          trend: weeklyData?.trends.calories.trend || 'stable',
          icon: 'flame',
          color: '#f97316',
        });

        // Sleep (if available)
        if (todayMetrics.sleepHours) {
          let sleepStatus: 'good' | 'warning' | 'alert' = 'good';
          if (todayMetrics.sleepHours < 6) sleepStatus = 'alert';
          else if (todayMetrics.sleepHours < 7) sleepStatus = 'warning';

          summary.push({
            id: '6',
            title: 'Sleep',
            value: todayMetrics.sleepHours.toFixed(1),
            unit: 'hours',
            status: sleepStatus,
            trend: 'stable',
            icon: 'moon',
            color: '#6366f1',
          });
        }

        // Heart Rate (if available)
        if (todayMetrics.heartRate) {
          let hrStatus: 'good' | 'warning' | 'alert' = 'good';
          if (todayMetrics.heartRate < 60 || todayMetrics.heartRate > 100) {
            hrStatus = 'warning';
          }
          if (todayMetrics.heartRate < 40 || todayMetrics.heartRate > 120) {
            hrStatus = 'alert';
          }

          summary.push({
            id: '7',
            title: 'Heart Rate',
            value: todayMetrics.heartRate.toString(),
            unit: 'bpm',
            status: hrStatus,
            trend: 'stable',
            icon: 'heart',
            color: '#ef4444',
          });
        }

        // Hydration (if available)
        if (todayMetrics.hydration !== undefined) {
          const hydrationPercent = Math.round((todayMetrics.hydration / 2.5) * 100);
          summary.push({
            id: '8',
            title: 'Hydration',
            value: hydrationPercent.toString(),
            unit: '%',
            status: hydrationPercent >= 80 ? 'good' : hydrationPercent >= 60 ? 'warning' : 'alert',
            trend: 'stable',
            icon: 'water',
            color: '#06b6d4',
          });
        }

        // Weight (if available)
        if (todayMetrics.weight) {
          summary.push({
            id: '9',
            title: 'Weight',
            value: todayMetrics.weight.toFixed(1),
            unit: 'kg',
            status: 'good',
            trend: 'stable',
            icon: 'scale',
            color: '#a855f7',
          });
        }
      }

      // ===== NUTRITION DATA =====
      if (mealSummary) {
        const mealsLogged = mealSummary.meals?.length || 0;
        const totalCalories = mealSummary.totals?.calories || 0;
        const calorieGoal = mealSummary.goals?.calories || 2200;
        const protein = mealSummary.totals?.protein_g || 0;
        const proteinGoal = mealSummary.goals?.protein_g || 120;
        const water = mealSummary.water_ml || 0;
        const waterGoal = mealSummary.water_goal_ml || 2000;

        // Meals Logged
        let mealsStatus: 'good' | 'warning' | 'alert' = 'good';
        if (mealsLogged < 2) mealsStatus = 'warning';
        if (mealsLogged === 0) mealsStatus = 'alert';

        summary.push({
          id: '10',
          title: 'Meals Logged',
          value: mealsLogged.toString(),
          unit: 'meals',
          status: mealsStatus,
          trend: 'up',
          icon: 'restaurant',
          color: '#ec4899',
        });

        // Calories from Meals
        const caloriePercent = Math.round((totalCalories / calorieGoal) * 100);
        let calorieStatus: 'good' | 'warning' | 'alert' = 'good';
        if (caloriePercent > 110) calorieStatus = 'warning';
        if (caloriePercent < 50) calorieStatus = 'alert';

        summary.push({
          id: '11',
          title: 'Calories Consumed',
          value: healthDataService.formatNumber(totalCalories),
          unit: `/ ${calorieGoal} kcal`,
          status: calorieStatus,
          trend: 'up',
          icon: 'nutrition',
          color: '#f97316',
        });

        // Protein
        const proteinPercent = Math.round((protein / proteinGoal) * 100);
        let proteinStatus: 'good' | 'warning' | 'alert' = 'good';
        if (proteinPercent < 50) proteinStatus = 'warning';
        if (proteinPercent < 30) proteinStatus = 'alert';

        summary.push({
          id: '12',
          title: 'Protein',
          value: protein.toFixed(0),
          unit: `/ ${proteinGoal}g`,
          status: proteinStatus,
          trend: 'up',
          icon: 'nutrition',
          color: '#8b5cf6',
        });

        // Water
        const waterPercent = Math.round((water / waterGoal) * 100);
        let waterStatus: 'good' | 'warning' | 'alert' = 'good';
        if (waterPercent < 50) waterStatus = 'warning';
        if (waterPercent < 25) waterStatus = 'alert';

        summary.push({
          id: '13',
          title: 'Water Intake',
          value: (water / 1000).toFixed(1),
          unit: `/ ${waterGoal / 1000}L`,
          status: waterStatus,
          trend: 'up',
          icon: 'water',
          color: '#06b6d4',
        });
      }

      // ===== FITNESS DATA =====
      if (todayWorkout && todayWorkout.exercises && todayWorkout.exercises.length > 0) {
        summary.push({
          id: '14',
          title: 'Today\'s Workout',
          value: todayWorkout.exercises.length.toString(),
          unit: 'exercises',
          status: 'good',
          trend: 'up',
          icon: 'dumbbell',
          color: '#ef4444',
        });
      }

      if (workoutHistory && workoutHistory.length > 0) {
        summary.push({
          id: '15',
          title: 'Weekly Workouts',
          value: workoutHistory.length.toString(),
          unit: 'sessions',
          status: workoutHistory.length >= 3 ? 'good' : workoutHistory.length >= 1 ? 'warning' : 'alert',
          trend: 'up',
          icon: 'fitness',
          color: '#10b981',
        });
      }

      setHealthSummaryData(summary);
    } catch (error) {
      console.error('[OverviewDashboard] Error loading health data:', error);
      // Fall back to mock data on error
      setHealthSummaryData([
        {
          id: '1',
          title: 'Health Score',
          value: '82',
          unit: '/100',
          status: 'good',
          trend: 'up',
          icon: 'fitness',
          color: '#10b981',
        },
        {
          id: '2',
          title: 'Daily Steps',
          value: '8,247',
          unit: 'steps',
          status: 'good',
          trend: 'up',
          icon: 'footsteps',
          color: '#3b82f6',
        },
        {
          id: '3',
          title: 'Meals Logged',
          value: '3',
          unit: 'meals',
          status: 'good',
          trend: 'up',
          icon: 'restaurant',
          color: '#ec4899',
        },
        {
          id: '4',
          title: 'Calories Consumed',
          value: '1,847',
          unit: '/ 2,200 kcal',
          status: 'warning',
          trend: 'stable',
          icon: 'nutrition',
          color: '#f97316',
        },
        {
          id: '5',
          title: 'Protein',
          value: '98',
          unit: '/ 120g',
          status: 'warning',
          trend: 'up',
          icon: 'nutrition',
          color: '#8b5cf6',
        },
        {
          id: '6',
          title: 'Sleep',
          value: '7.2',
          unit: 'hours',
          status: 'warning',
          trend: 'down',
          icon: 'moon',
          color: '#6366f1',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Load data on mount only
  useEffect(() => {
    loadHealthData();
    loadRecentScans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only memoize dynamic data that depends on navigation functions
  const quickActionCards: QuickActionCard[] = useMemo(() => [
    {
      id: '1',
      title: 'Log Meal',
      subtitle: 'Track your nutrition',
      icon: 'restaurant',
      color: dashboardColors.success,
      onPress: navigateToCamera,
    },
    {
      id: '2',
      title: 'Start Workout',
      subtitle: 'Begin exercise routine',
      icon: 'fitness',
      color: dashboardColors.orange,
      onPress: navigateToChat,
    },
    {
      id: '3',
      title: 'Check Symptoms',
      subtitle: 'Health assessment',
      icon: 'medical',
      color: dashboardColors.error,
      onPress: navigateToChat,
    },
    {
      id: '4',
      title: 'AI Chat',
      subtitle: 'Ask health questions',
      icon: 'chatbubble',
      color: dashboardColors.primary,
      onPress: () => handleAnalyze('I have a health question', 'How can I help you today?'),
    },
  ], [navigateToCamera, navigateToChat, handleAnalyze]);

  // Scan display helpers
  const getScanTypeIcon = (scanType: string): string => {
    switch (scanType) {
      case 'barcode': return 'barcode-outline';
      case 'food_photo': 
      case 'image': return 'restaurant-outline';
      case 'pill': return 'medical-outline';
      case 'product_label': 
      case 'label': return 'document-text-outline';
      default: return 'scan-outline';
    }
  };

  const getScanTypeColor = (scanType: string): string => {
    switch (scanType) {
      case 'barcode': return dashboardColors.primary;
      case 'food_photo': 
      case 'image': return dashboardColors.success;
      case 'pill': return dashboardColors.error;
      case 'product_label': 
      case 'label': return dashboardColors.orange;
      default: return dashboardColors.primary;
    }
  };

  const getScanTypeName = (scanType: string): string => {
    switch (scanType) {
      case 'barcode': return 'Barcode Scan';
      case 'food_photo': 
      case 'image': return 'Food Photo';
      case 'pill': return 'Pill Scan';
      case 'product_label': 
      case 'label': return 'Label Scan';
      default: return 'Scan';
    }
  };

  const formatScanDate = (timestamp: string): string => {
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
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return dashboardColors.success;
    if (score >= 60) return dashboardColors.orange;
    return dashboardColors.error;
  };

  const getStatusColor = (status: HealthSummaryItem['status']) => {
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

  const getTrendIcon = (trend: HealthSummaryItem['trend']) => {
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

  const renderHealthSummaryItem = ({ item }: { item: HealthSummaryItem }) => {
    return (
      <TouchableOpacity key={item.id} style={styles.summaryCard}>
        <View style={[styles.summaryIcon, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Ionicons name={item.icon as any} size={26} color={getStatusColor(item.status)} />
        </View>
        <Text style={styles.summaryValue}>{item.value}</Text>
        <Text style={styles.summaryTitle}>{item.title}</Text>
        <Text style={styles.summaryUnit}>{item.unit}</Text>
        <View style={styles.trendContainer}>
          <Ionicons
            name={getTrendIcon(item.trend) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderQuickActionCard = ({ item }: { item: QuickActionCard }) => {
    // Responsive action card width - 4 columns on phone, 4-6 on tablet
    const actionCardWidth = layout.isTablet 
      ? (layout.maxContentWidth - layout.horizontalPadding * 2) / 6 - 8
      : '23%';
    
    return (
      <TouchableOpacity
        style={[styles.actionCard, { width: actionCardWidth as any }]}
        onPress={item.onPress}
      >
        <View style={[styles.actionIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={layout.rfs(28)} color={item.color} />
        </View>
        <Text style={[styles.actionTitle, { fontSize: layout.rfs(12) }]}>{item.title}</Text>
        <Text style={[styles.actionSubtitle, { fontSize: layout.rfs(10) }]}>{item.subtitle}</Text>
      </TouchableOpacity>
    );
  };

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'Summary':
        return (
          <View>
            <Text style={styles.sectionTitle}>Health Summary</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={dashboardColors.primary} />
                <Text style={styles.loadingText}>Loading health data...</Text>
              </View>
            ) : healthSummaryData.length === 0 ? (
              <View style={styles.permissionDeniedContainer}>
                <Ionicons name="fitness-outline" size={64} color="#9ca3af" />
                <Text style={styles.permissionDeniedTitle}>Health Access Required</Text>
                <Text style={styles.permissionDeniedText}>
                  WiHY needs access to your health and fitness data to provide personalized insights.
                </Text>
                <TouchableOpacity
                  style={styles.permissionButton}
                  onPress={() => setShowPermissionModal(true)}
                >
                  <Text style={styles.permissionButtonText}>
                    Enable Health Tracking
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.summaryGrid}>
                {healthSummaryData.map((item) => renderHealthSummaryItem({ item }))}
              </View>
            )}

            {/* Recent Scans Section */}
            <View style={styles.recentScansSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Scans</Text>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('ScanHistory' as never)}
                  style={styles.viewAllButton}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                  <Ionicons name="chevron-forward" size={16} color={dashboardColors.primary} />
                </TouchableOpacity>
              </View>
              {scansLoading ? (
                <View style={styles.scansLoadingContainer}>
                  <ActivityIndicator size="small" color={dashboardColors.primary} />
                </View>
              ) : recentScans.length === 0 ? (
                <View style={styles.noScansContainer}>
                  <Ionicons name="scan-outline" size={32} color="#9ca3af" />
                  <Text style={styles.noScansText}>No recent scans</Text>
                  <TouchableOpacity 
                    style={styles.startScanButton}
                    onPress={navigateToCamera}
                  >
                    <Text style={styles.startScanButtonText}>Start Scanning</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.scansScrollContent}
                >
                  {recentScans.map((scan) => (
                    <TouchableOpacity 
                      key={scan.id} 
                      style={styles.scanCard}
                      onPress={() => navigation.navigate('ScanHistory' as never)}
                    >
                      <View style={[styles.scanTypeIcon, { backgroundColor: getScanTypeColor(scan.scan_type) + '20' }]}>
                        <Ionicons 
                          name={getScanTypeIcon(scan.scan_type) as any} 
                          size={20} 
                          color={getScanTypeColor(scan.scan_type)} 
                        />
                      </View>
                      <Text style={styles.scanTitle} numberOfLines={1}>
                        {scan.product?.name || getScanTypeName(scan.scan_type)}
                      </Text>
                      <Text style={styles.scanDate}>
                        {formatScanDate(scan.scan_timestamp)}
                      </Text>
                      {scan.health_score !== undefined && (
                        <View style={[styles.scanScoreBadge, { backgroundColor: getScoreColor(scan.health_score) }]}>
                          <Text style={styles.scanScoreText}>{scan.health_score}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        );
      case 'Insights':
        return (
          <View style={styles.insightsContainer}>
            <Text style={styles.sectionTitle}>AI Health Insights</Text>
            <View style={styles.insightCard}>
              <Ionicons name="bulb" size={24} color={dashboardTheme.colors.warning} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Hydration Goal</Text>
                <Text style={styles.insightText}>
                  You're 0.5L behind your daily water goal. Consider drinking a glass now.
                </Text>
              </View>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="moon" size={24} color={dashboardTheme.colors.primary} />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>Sleep Pattern</Text>
                <Text style={styles.insightText}>
                  Your sleep duration decreased by 45 minutes this week. Try a consistent bedtime.
                </Text>
              </View>
            </View>
          </View>
        );
      default:
        return (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="construct" size={48} color={dashboardTheme.colors.textSecondary} />
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonText}>
              {selectedTab} features are being developed and will be available soon.
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {/* Status bar area - Always emerald */}
      <View style={{ height: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : insets.top, backgroundColor: '#059669' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#059669' }]}>
        <Animated.View 
          style={[
            styles.headerContent,
            { 
              opacity: headerOpacity,
              transform: [{ scale: titleScale }]
            }
          ]}
        >
          <Text style={styles.collapsibleHeaderTitle}>Health Overview</Text>
          <Text style={styles.collapsibleHeaderSubtitle}>Your personalized health dashboard</Text>
          <View style={styles.progressBadge}>
            <Text style={styles.progressBadgeText}>{new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {/* Tab Selector - Fixed below header */}
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                selectedTab === tab && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Dynamic Content Area */}
        <View style={[styles.contentArea, { paddingHorizontal: layout.horizontalPadding }]}>
          {renderTabContent()}
        </View>

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Health Permission Modal */}
      <Modal
        visible={showPermissionModal}
        animationType="slide"
        presentationStyle="overFullScreen"
        transparent={true}
        onRequestClose={() => setShowPermissionModal(false)}
      >
        <View style={styles.permissionOverlay}>
          <View style={styles.permissionModalContainer}>
            <SafeAreaView style={styles.permissionModalSafeArea} edges={['bottom']}>
              {/* Header with Icon and Close Button */}
              <View style={styles.permissionModalHeader}>
                <View style={{ width: 40 }} />
                <View style={styles.permissionModalIconContainer}>
                  <Ionicons name="fitness" size={48} color={dashboardColors.primary} />
                </View>
                <Pressable onPress={() => setShowPermissionModal(false)} style={styles.permissionModalCloseButton}>
                  <Ionicons name="close" size={28} color="#6b7280" />
                </Pressable>
              </View>

              {/* Scrollable Content */}
              <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={styles.permissionModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.permissionModalTitle}>Enable Health Tracking</Text>
                <Text style={styles.permissionModalDescription}>
                  WiHY uses Health Connect to access your health data from Samsung Health, Google Fit, and other fitness apps for personalized insights.
                </Text>

                {/* Permissions List */}
                <View style={styles.permissionFeaturesList}>
                  <View style={styles.permissionFeatureItem}>
                    <View style={styles.permissionFeatureIconContainer}>
                      <Ionicons name="footsteps" size={24} color={dashboardColors.primary} />
                    </View>
                    <View style={styles.permissionFeatureTextContainer}>
                      <Text style={styles.permissionFeatureItemTitle}>Activity Tracking</Text>
                      <Text style={styles.permissionFeatureItemDesc}>Steps, distance, and active minutes from any fitness app</Text>
                    </View>
                  </View>

                  <View style={styles.permissionFeatureItem}>
                    <View style={styles.permissionFeatureIconContainer}>
                      <Ionicons name="heart" size={24} color="#ef4444" />
                    </View>
                    <View style={styles.permissionFeatureTextContainer}>
                      <Text style={styles.permissionFeatureItemTitle}>Health Metrics</Text>
                      <Text style={styles.permissionFeatureItemDesc}>Heart rate, weight, sleep, and body measurements</Text>
                    </View>
                  </View>

                  <View style={styles.permissionFeatureItem}>
                    <View style={styles.permissionFeatureIconContainer}>
                      <Ionicons name="barbell" size={24} color="#4cbb17" />
                    </View>
                    <View style={styles.permissionFeatureTextContainer}>
                      <Text style={styles.permissionFeatureItemTitle}>Workout History</Text>
                      <Text style={styles.permissionFeatureItemDesc}>Exercise sessions and calories burned</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.permissionModalNote}>
                  <Ionicons name="shield-checkmark" size={16} color="#10b981" /> 
                  Works with your device's health app. Your data stays private and secure.
                </Text>

                {/* Action Buttons */}
                <TouchableOpacity
                  style={styles.permissionPrimaryButton}
                  onPress={async () => {
                    setShowPermissionModal(false);
                    await loadHealthData();
                  }}
                >
                  <Text style={styles.permissionPrimaryButtonText}>
                    Grant Access
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.permissionSecondaryButton}
                  onPress={() => setShowPermissionModal(false)}
                >
                  <Text style={styles.permissionSecondaryButtonText}>Maybe Later</Text>
                </TouchableOpacity>
              </ScrollView>
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  collapsibleHeader: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  collapsibleHeaderTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  collapsibleHeaderSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  progressBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: '#059669', // overview gradient top color
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },

  header: {
    paddingHorizontal: dashboardTheme.header.paddingHorizontal,
    paddingTop: dashboardTheme.header.paddingTop,
    paddingBottom: dashboardTheme.header.paddingBottom,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  headerStats: {
    alignSelf: 'stretch',
  },

  dateBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },

  headerStatText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },

  tabContainer: {
    backgroundColor: dashboardTheme.colors.surface,
    paddingVertical: dashboardTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: dashboardTheme.colors.border,
  },

  tabScrollContent: {
    paddingHorizontal: dashboardTheme.spacing.md,
  },

  tabButton: {
    backgroundColor: dashboardTheme.colors.background,
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.lg,
    marginRight: dashboardTheme.spacing.sm,
  },

  tabButtonActive: {
    backgroundColor: dashboardTheme.colors.primary,
  },

  tabText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
  },

  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  contentArea: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  sectionTitle: {
    ...dashboardTheme.typography.title,
    marginBottom: dashboardTheme.spacing.md,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  summaryRow: {
    justifyContent: 'flex-start',
  },

  summaryCard: {
    // 2-column layout matching MyProgressDashboard pattern
    width: '48.5%',
    backgroundColor: dashboardTheme.colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    alignItems: 'center',
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  trendContainer: {
    alignItems: 'center',
    marginTop: 4,
  },

  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },

  summaryValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 4,
  },

  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
  },

  summaryUnit: {
    fontSize: 12,
    color: dashboardTheme.colors.textSecondary,
    marginLeft: 2,
    marginBottom: 12,
  },

  quickActions: {
    paddingTop: dashboardTheme.spacing.md,
  },

  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: dashboardTheme.spacing.xs,
  },

  actionCard: {
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
    ...dashboardTheme.shadows.sm,
    alignItems: 'center',
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
  },

  actionIcon: {
    width: 32,
    height: 32,
    borderRadius: dashboardTheme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.xs,
  },

  actionTitle: {
    ...dashboardTheme.typography.caption,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.xs,
    textAlign: 'center',
    fontSize: 12,
  },

  actionSubtitle: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 12,
  },

  insightsContainer: {
    gap: dashboardTheme.spacing.md,
  },

  insightCard: {
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: dashboardTheme.spacing.md,
  },

  insightContent: {
    flex: 1,
  },

  insightTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.xs,
  },

  insightText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    lineHeight: 20,
  },

  comingSoonContainer: {
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.xl,
  },

  comingSoonTitle: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.md,
    marginBottom: dashboardTheme.spacing.sm,
  },

  comingSoonText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: dashboardTheme.spacing.xl,
  },

  loadingContainer: {
    padding: dashboardTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.md,
  },

  permissionDeniedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dashboardTheme.spacing.xl * 2,
    paddingHorizontal: dashboardTheme.spacing.xl,
  },

  permissionDeniedTitle: {
    ...dashboardTheme.typography.title,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginTop: dashboardTheme.spacing.lg,
    marginBottom: dashboardTheme.spacing.sm,
    textAlign: 'center',
  },

  permissionDeniedText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: dashboardTheme.spacing.xl,
    lineHeight: 22,
  },

  permissionButton: {
    backgroundColor: dashboardColors.primary,
    paddingVertical: dashboardTheme.spacing.md,
    paddingHorizontal: dashboardTheme.spacing.xl,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.sm,
  },

  permissionButtonText: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },

  // Permission Modal Styles (matching workout complete modal pattern)
  permissionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  permissionModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    minHeight: '60%',
  },

  permissionModalSafeArea: {
    flex: 1,
  },

  permissionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    marginBottom: 8,
  },

  permissionModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionModalCloseButton: {
    padding: 4,
  },

  permissionModalScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  permissionModalTitle: {
    ...dashboardTheme.typography.headerLarge,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },

  permissionModalDescription: {
    ...dashboardTheme.typography.body,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },

  permissionFeaturesList: {
    gap: 12,
    marginBottom: 20,
  },

  permissionFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },

  permissionFeatureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionFeatureTextContainer: {
    flex: 1,
  },

  permissionFeatureItemTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },

  permissionFeatureItemDesc: {
    ...dashboardTheme.typography.caption,
    color: '#6b7280',
    lineHeight: 18,
  },

  permissionModalNote: {
    ...dashboardTheme.typography.caption,
    color: '#6b7280',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 16,
  },

  permissionPrimaryButton: {
    backgroundColor: dashboardColors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: dashboardColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  permissionPrimaryButtonText: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: '#ffffff',
    fontSize: 16,
  },

  permissionSecondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },

  permissionSecondaryButtonText: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: '#6b7280',
    fontSize: 16,
  },

  // Recent Scans Section Styles
  recentScansSection: {
    marginTop: dashboardTheme.spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.md,
  },

  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewAllText: {
    ...dashboardTheme.typography.caption,
    color: dashboardColors.primary,
    fontWeight: '600',
  },

  scansLoadingContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noScansContainer: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.xl,
    alignItems: 'center',
    ...dashboardTheme.shadows.sm,
  },

  noScansText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.sm,
    marginBottom: dashboardTheme.spacing.md,
  },

  startScanButton: {
    backgroundColor: dashboardColors.primary,
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
  },

  startScanButtonText: {
    ...dashboardTheme.typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },

  scansScrollContent: {
    paddingRight: dashboardTheme.spacing.md,
  },

  scanCard: {
    width: 140,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    marginRight: dashboardTheme.spacing.sm,
    ...dashboardTheme.shadows.sm,
  },

  scanTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },

  scanTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
  },

  scanDate: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
  },

  scanScoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scanScoreText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default OverviewDashboard;
