import React, { useState, useMemo, useEffect, useCallback, useContext, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GradientDashboardHeader, Ionicons } from '../components/shared';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { TabParamList, RootStackParamList } from '../types/navigation';
import { dashboardTheme } from '../theme/dashboardTheme';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import { dashboardColors } from '../components/shared';
import { healthDataService } from '../services/healthDataService';
import { nutritionService } from '../services/nutritionService';
import { fitnessService } from '../services/fitnessService';
import { AuthContext } from '../context/AuthContext';
import { wihyApiService } from '../services/wihyApiService';
import { useGoalsDashboard } from '../hooks/useGoalsDashboard';
import type { HealthTrends } from '../services/wihyApiService';

const { width: screenWidth } = Dimensions.get('window');

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList>,
  StackNavigationProp<RootStackParamList>
>;

interface MyProgressDashboardProps {
  onToggleAction?: (actionId: string) => void;
  onStartWorkout?: () => void;
  onAddHydration?: () => void;
  onLogMeal?: () => void;
  onEducationClick?: () => void;
}

interface ProgressCard {
  id: string;
  title: string;
  completed: number;
  target: number;
  icon: string;
  color: string;
  unit: string;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  type: 'workout' | 'meal' | 'habit' | 'health';
  icon: string;
  time?: string;
}

interface CoachRecommendation {
  id: string;
  title: string;
  message: string;
  type: 'workout' | 'nutrition' | 'wellness';
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

const MyProgressDashboard: React.FC<MyProgressDashboardProps> = ({
  onToggleAction,
  onStartWorkout,
  onAddHydration,
  onLogMeal,
  onEducationClick,
}) => {
  const layout = useDashboardLayout();
  const navigation = useNavigation<NavigationProp>();
  const { user } = useContext(AuthContext);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [progressCards, setProgressCards] = useState<ProgressCard[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [coachRecommendations, setCoachRecommendations] = useState<CoachRecommendation[]>([]);
  const [healthTrends, setHealthTrends] = useState<HealthTrends | null>(null);
  const [trendsLoading, setTrendsLoading] = useState(false);

  // Goals Dashboard Hook - Clean backend-driven data
  const {
    data: goalsData,
    isLoading: goalsLoading,
    selectGoal,
    clearGoal,
    refresh: refreshGoals,
  } = useGoalsDashboard(selectedPeriod);

  // Load health trends from scan data
  const loadHealthTrends = useCallback(async () => {
    try {
      setTrendsLoading(true);
      const userId = user?.id;
      if (!userId) return;
      const timeRange = selectedPeriod === 'today' ? 'day' : selectedPeriod;
      const trends = await scanService.getHealthTrends(userId, timeRange);
      setHealthTrends(trends);
    } catch (error) {
      console.error('Failed to load health trends:', error);
    } finally {
      setTrendsLoading(false);
    }
  }, [selectedPeriod, user?.id]);

  // Load trends when period changes
  useEffect(() => {
    loadHealthTrends();
  }, [loadHealthTrends]);

  const loadProgressData = async () => {
    try {
      setIsLoading(true);
      
      // Initialize health service
      const initialized = await healthDataService.initialize();
      console.log('[MyProgressDashboard] Health service initialized:', initialized);
      
      if (!initialized) {
        // Fall back to meal and workout data if health tracker unavailable
        console.log('[MyProgressDashboard] Health data unavailable, loading meal/workout data...');
        await loadMealAndWorkoutData();
        setIsLoading(false);
        return;
      }

      if (selectedPeriod === 'today') {
        const todayMetrics = await healthDataService.getTodayMetrics();
        console.log('[MyProgressDashboard] Today metrics:', todayMetrics);
        
        if (!todayMetrics || todayMetrics.steps === 0) {
          // No health data available, fall back to meals and workouts
          console.log('[MyProgressDashboard] No health metrics available, using meal/workout data...');
          await loadMealAndWorkoutData();
          setIsLoading(false);
          return;
        }
        if (todayMetrics) {
          const cards: ProgressCard[] = [
            {
              id: '1',
              title: 'Daily Steps',
              completed: todayMetrics.steps,
              target: 10000,
              icon: 'footsteps',
              color: dashboardTheme.colors.primary,
              unit: 'steps',
            },
            {
              id: '2',
              title: 'Active Minutes',
              completed: todayMetrics.activeMinutes,
              target: 30,
              icon: 'fitness',
              color: dashboardTheme.colors.orange,
              unit: 'minutes',
            },
            {
              id: '3',
              title: 'Calories Burned',
              completed: todayMetrics.calories,
              target: 500,
              icon: 'flame',
              color: dashboardTheme.colors.error,
              unit: 'kcal',
            },
            {
              id: '4',
              title: 'Distance',
              completed: parseFloat(todayMetrics.distance.toFixed(1)),
              target: 8,
              icon: 'walk',
              color: dashboardTheme.colors.secondary,
              unit: 'km',
            },
          ];

          // Add sleep if available
          if (todayMetrics.sleepHours) {
            cards.push({
              id: '5',
              title: 'Sleep Duration',
              completed: parseFloat(todayMetrics.sleepHours.toFixed(1)),
              target: 8,
              icon: 'moon',
              color: '#6366f1',
              unit: 'hours',
            });
          }

          // Add heart rate if available
          if (todayMetrics.heartRate) {
            cards.push({
              id: '6',
              title: 'Heart Rate',
              completed: todayMetrics.heartRate,
              target: 80,
              icon: 'heart',
              color: '#ef4444',
              unit: 'bpm',
            });
          }

          // Add hydration if available
          if (todayMetrics.hydration !== undefined) {
            cards.push({
              id: '7',
              title: 'Hydration',
              completed: parseFloat(todayMetrics.hydration.toFixed(1)),
              target: 2.5,
              icon: 'water',
              color: '#06b6d4',
              unit: 'liters',
            });
          }

          // Add weight if available
          if (todayMetrics.weight) {
            cards.push({
              id: '8',
              title: 'Current Weight',
              completed: parseFloat(todayMetrics.weight.toFixed(1)),
              target: 75,
              icon: 'scale',
              color: '#a855f7',
              unit: 'kg',
            });
          }

          setProgressCards(cards);
        }
      } else if (selectedPeriod === 'week') {
        const weeklyData = await healthDataService.getWeeklyData();
        if (weeklyData && weeklyData.averages) {
          const totalSteps = weeklyData.days.reduce((sum, d) => sum + d.steps, 0);
          const totalCalories = weeklyData.days.reduce((sum, d) => sum + d.calories, 0);
          const avgHeartRate = weeklyData.averages.heartRate || 72;
          
          setProgressCards([
            {
              id: '1',
              title: 'Avg Daily Steps',
              completed: weeklyData.averages.steps,
              target: 10000,
              icon: 'footsteps',
              color: dashboardTheme.colors.primary,
              unit: 'steps/day',
            },
            {
              id: '2',
              title: 'Total Steps',
              completed: totalSteps,
              target: 70000,
              icon: 'walk',
              color: '#3b82f6',
              unit: 'steps',
            },
            {
              id: '3',
              title: 'Avg Active Minutes',
              completed: weeklyData.averages.activeMinutes || 0,
              target: 30,
              icon: 'fitness',
              color: dashboardTheme.colors.orange,
              unit: 'min/day',
            },
            {
              id: '4',
              title: 'Avg Calories',
              completed: weeklyData.averages.calories,
              target: 500,
              icon: 'flame',
              color: dashboardTheme.colors.error,
              unit: 'kcal/day',
            },
            {
              id: '5',
              title: 'Total Calories',
              completed: totalCalories,
              target: 3500,
              icon: 'flame',
              color: '#f97316',
              unit: 'kcal',
            },
            {
              id: '6',
              title: 'Days Active',
              completed: weeklyData.days.filter(d => d.steps > 5000).length,
              target: 7,
              icon: 'calendar',
              color: dashboardTheme.colors.success,
              unit: 'days',
            },
            {
              id: '7',
              title: 'Avg Heart Rate',
              completed: avgHeartRate,
              target: 80,
              icon: 'heart',
              color: '#ef4444',
              unit: 'bpm',
            },
            {
              id: '8',
              title: 'Avg Sleep',
              completed: weeklyData.averages.sleepHours || 7.2,
              target: 8,
              icon: 'moon',
              color: '#6366f1',
              unit: 'hours',
            },
          ]);
        }
      } else {
        // Month view - show totals and progress trends
        const weeklyData = await healthDataService.getWeeklyData();
        if (weeklyData && weeklyData.days) {
          const totalSteps = weeklyData.days.reduce((sum, d) => sum + d.steps, 0);
          const totalCalories = weeklyData.days.reduce((sum, d) => sum + d.calories, 0);
          const avgActiveMinutes = Math.round(
            weeklyData.days.reduce((sum, d) => sum + d.activeMinutes, 0) / weeklyData.days.length
          );
          const totalActiveMinutes = weeklyData.days.reduce((sum, d) => sum + d.activeMinutes, 0);
          const avgSteps = Math.round(totalSteps / weeklyData.days.length);
          const avgHeartRate = Math.round(
            weeklyData.days.reduce((sum, d) => sum + (d.heartRate || 72), 0) / weeklyData.days.length
          );
          const activeDays = weeklyData.days.filter(d => d.steps > 5000).length;
          const totalDistance = weeklyData.days.reduce((sum, d) => sum + (d.steps * 0.0008), 0);
          
          setProgressCards([
            {
              id: '1',
              title: 'Total Steps (7d)',
              completed: totalSteps,
              target: 70000,
              icon: 'footsteps',
              color: dashboardTheme.colors.primary,
              unit: 'steps',
            },
            {
              id: '2',
              title: 'Avg Steps/Day',
              completed: avgSteps,
              target: 10000,
              icon: 'walk',
              color: '#3b82f6',
              unit: 'steps',
            },
            {
              id: '3',
              title: 'Total Distance (7d)',
              completed: parseFloat(totalDistance.toFixed(1)),
              target: 56,
              icon: 'navigate',
              color: '#8b5cf6',
              unit: 'km',
            },
            {
              id: '4',
              title: 'Total Calories (7d)',
              completed: totalCalories,
              target: 3500,
              icon: 'flame',
              color: dashboardTheme.colors.error,
              unit: 'kcal',
            },
            {
              id: '5',
              title: 'Avg Active Minutes',
              completed: avgActiveMinutes,
              target: 30,
              icon: 'fitness',
              color: dashboardTheme.colors.orange,
              unit: 'min/day',
            },
            {
              id: '6',
              title: 'Total Active Time',
              completed: totalActiveMinutes,
              target: 210,
              icon: 'time',
              color: '#10b981',
              unit: 'minutes',
            },
            {
              id: '7',
              title: 'Active Days',
              completed: activeDays,
              target: 7,
              icon: 'checkmark-circle',
              color: dashboardTheme.colors.success,
              unit: 'days',
            },
            {
              id: '8',
              title: 'Avg Heart Rate',
              completed: avgHeartRate,
              target: 80,
              icon: 'heart',
              color: '#ef4444',
              unit: 'bpm',
            },
            {
              id: '9',
              title: 'Consistency',
              completed: Math.round((activeDays / 7) * 100),
              target: 100,
              icon: 'trending-up',
              color: '#a855f7',
              unit: '%',
            },
          ]);
        }
      }
    } catch (error) {
      console.error('[MyProgressDashboard] Error loading progress data:', error);
      setProgressCards(getMockDataForPeriod(selectedPeriod));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load meal and workout data as fallback when health tracker is unavailable
   */
  const loadMealAndWorkoutData = async () => {
    try {
      const { user } = useContext(AuthContext);
      const userId = user?.id;

      if (!userId) {
        console.error('[MyProgressDashboard] User ID not available');
        return;
      }

      console.log('[MyProgressDashboard] Loading meal and workout data for period:', selectedPeriod);

      if (selectedPeriod === 'today') {
        // Load today's meal summary and workout history
        console.log('[MyProgressDashboard] Fetching meal summary...');
        const mealSummary = await nutritionService.getDailySummary(userId);
        console.log('[MyProgressDashboard] Meal summary:', mealSummary);
        
        console.log('[MyProgressDashboard] Fetching today workout...');
        let todayWorkout = null;
        try {
          todayWorkout = await fitnessService.getTodayWorkout(userId);
          console.log('[MyProgressDashboard] Today workout:', todayWorkout);
        } catch (workoutError) {
          console.error('[MyProgressDashboard] Error fetching workout:', workoutError);
        }
        
        const mealsLogged = mealSummary?.meals?.length || 0;
        const mealCalories = mealSummary?.totals?.calories || 0;
        const mealProtein = mealSummary?.totals?.protein_g || 0;
        
        // Count workouts completed today
        const workoutsCompleted = (todayWorkout && todayWorkout.success && todayWorkout.exercises?.length > 0) ? 1 : 0;
        
        // If we have actual data, show it; otherwise show mock data
        const hasActualData = mealsLogged > 0 || mealCalories > 0 || workoutsCompleted > 0;
        
        console.log('[MyProgressDashboard] Has actual meal/workout data:', hasActualData, { mealsLogged, mealCalories, mealProtein, workoutsCompleted });

        if (!hasActualData) {
          // No actual data - use mock data instead
          console.log('[MyProgressDashboard] No actual meal/workout data, falling back to mock data');
          setProgressCards(getMockDataForPeriod(selectedPeriod));
          return;
        }

        setProgressCards([
          {
            id: '1',
            title: 'Meals Logged',
            completed: mealsLogged,
            target: 4,
            icon: 'restaurant',
            color: dashboardTheme.colors.secondary,
            unit: 'meals',
          },
          {
            id: '2',
            title: 'Calories',
            completed: mealCalories,
            target: 2200,
            icon: 'flame',
            color: dashboardTheme.colors.error,
            unit: 'kcal',
          },
          {
            id: '3',
            title: 'Protein',
            completed: mealProtein,
            target: 120,
            icon: 'nutrition',
            color: dashboardTheme.colors.orange,
            unit: 'g',
          },
          {
            id: '4',
            title: 'Workouts',
            completed: workoutsCompleted,
            target: 1,
            icon: 'fitness',
            color: dashboardTheme.colors.primary,
            unit: 'sessions',
          },
        ]);
      } else if (selectedPeriod === 'week') {
        // Load weekly meal and workout data
        const mealSummary = await nutritionService.getDailySummary(userId);
        const weeklyTrends = await nutritionService.getWeeklyTrends(userId);
        
        let workoutHistory: any[] = [];
        try {
          workoutHistory = await fitnessService.getHistory(userId, 7);
        } catch (error) {
          console.error('[MyProgressDashboard] Error fetching workout history:', error);
        }
        
        const avgDailyCalories = weeklyTrends?.daily_averages?.calories || 2000;
        const avgDailyProtein = weeklyTrends?.daily_averages?.protein_g || 100;
        const totalMeals = 28; // 4 meals x 7 days (simplified)
        const workoutsCompleted = (Array.isArray(workoutHistory) && workoutHistory.length > 0) ? workoutHistory.length : 0;
        
        // Check if we have actual data
        const hasActualData = avgDailyCalories > 0 || avgDailyProtein > 0 || workoutsCompleted > 0;
        
        if (!hasActualData) {
          console.log('[MyProgressDashboard] No actual weekly data, falling back to mock data');
          setProgressCards(getMockDataForPeriod(selectedPeriod));
          return;
        }
        
        setProgressCards([
          {
            id: '1',
            title: 'Avg Daily Calories',
            completed: avgDailyCalories,
            target: 2200,
            icon: 'flame',
            color: dashboardTheme.colors.error,
            unit: 'kcal',
          },
          {
            id: '2',
            title: 'Avg Daily Protein',
            completed: avgDailyProtein,
            target: 120,
            icon: 'nutrition',
            color: dashboardTheme.colors.orange,
            unit: 'g',
          },
          {
            id: '3',
            title: 'Meals Logged',
            completed: totalMeals,
            target: 28,
            icon: 'restaurant',
            color: dashboardTheme.colors.secondary,
            unit: 'meals',
          },
          {
            id: '4',
            title: 'Workouts',
            completed: workoutsCompleted,
            target: 7,
            icon: 'fitness',
            color: dashboardTheme.colors.primary,
            unit: 'sessions',
          },
        ]);
      } else {
        // Monthly view - show trends and totals
        const monthlyTrends = await nutritionService.getWeeklyTrends(userId);
        
        let workoutHistory: any[] = [];
        try {
          workoutHistory = await fitnessService.getHistory(userId, 30);
        } catch (error) {
          console.error('[MyProgressDashboard] Error fetching monthly workout history:', error);
        }
        
        const totalCalories = (monthlyTrends?.daily_averages?.calories || 2000) * 30;
        const avgCalories = monthlyTrends?.daily_averages?.calories || 2000;
        const avgProtein = monthlyTrends?.daily_averages?.protein_g || 100;
        const workoutsCompleted = (Array.isArray(workoutHistory) && workoutHistory.length > 0) ? workoutHistory.length : 0;

        // Check if we have actual data
        const hasActualData = avgCalories > 0 || avgProtein > 0 || workoutsCompleted > 0;
        
        if (!hasActualData) {
          console.log('[MyProgressDashboard] No actual monthly data, falling back to mock data');
          setProgressCards(getMockDataForPeriod(selectedPeriod));
          return;
        }

        setProgressCards([
          {
            id: '1',
            title: 'Avg Daily Calories',
            completed: avgCalories,
            target: 2200,
            icon: 'flame',
            color: dashboardTheme.colors.error,
            unit: 'kcal/day',
          },
          {
            id: '2',
            title: 'Total Calories (30d)',
            completed: totalCalories,
            target: 66000,
            icon: 'flame',
            color: '#f97316',
            unit: 'kcal',
          },
          {
            id: '3',
            title: 'Avg Daily Protein',
            completed: avgProtein,
            target: 120,
            icon: 'nutrition',
            color: dashboardTheme.colors.orange,
            unit: 'g',
          },
          {
            id: '4',
            title: 'Meals Logged',
            completed: 90,
            target: 120,
            icon: 'restaurant',
            color: dashboardTheme.colors.secondary,
            unit: 'meals',
          },
          {
            id: '5',
            title: 'Workouts',
            completed: workoutsCompleted,
            target: 30,
            icon: 'fitness',
            color: dashboardTheme.colors.primary,
            unit: 'sessions',
          },
        ]);
      }
    } catch (error) {
      console.error('[MyProgressDashboard] Error loading meal/workout data:', error);
      setProgressCards(getMockDataForPeriod(selectedPeriod));
    }
  };

  const getMockDataForPeriod = (period: 'today' | 'week' | 'month'): ProgressCard[] => {
    const mockData = {
      today: [
        {
          id: '1',
          title: 'Workouts',
          completed: 2,
          target: 3,
          icon: 'fitness',
          color: dashboardTheme.colors.orange,
          unit: 'sessions',
        },
        {
          id: '2',
          title: 'Meals',
          completed: 3,
          target: 4,
          icon: 'restaurant',
          color: dashboardTheme.colors.secondary,
          unit: 'meals',
        },
        {
          id: '3',
          title: 'Hydration',
          completed: 6,
          target: 8,
          icon: 'water',
          color: dashboardTheme.colors.primary,
          unit: 'glasses',
        },
        {
          id: '4',
          title: 'Sleep',
          completed: 7.2,
          target: 8,
          icon: 'moon',
          color: dashboardTheme.colors.accent,
          unit: 'hours',
        },
      ],
      week: [
        {
          id: '1',
          title: 'Workouts',
          completed: 12,
          target: 21,
          icon: 'fitness',
          color: dashboardTheme.colors.orange,
          unit: 'sessions',
        },
        {
          id: '2',
          title: 'Meals',
          completed: 19,
          target: 28,
          icon: 'restaurant',
          color: dashboardTheme.colors.secondary,
          unit: 'meals',
        },
        {
          id: '3',
          title: 'Hydration',
          completed: 45,
          target: 56,
          icon: 'water',
          color: dashboardTheme.colors.primary,
          unit: 'glasses',
        },
        {
          id: '4',
          title: 'Sleep',
          completed: 7.5,
          target: 8,
          icon: 'moon',
          color: dashboardTheme.colors.accent,
          unit: 'hours avg',
        },
      ],
      month: [
        {
          id: '1',
          title: 'Workouts',
          completed: 48,
          target: 90,
          icon: 'fitness',
          color: dashboardTheme.colors.orange,
          unit: 'sessions',
        },
        {
          id: '2',
          title: 'Meals',
          completed: 82,
          target: 120,
          icon: 'restaurant',
          color: dashboardTheme.colors.secondary,
          unit: 'meals',
        },
        {
          id: '3',
          title: 'Hydration',
          completed: 185,
          target: 240,
          icon: 'water',
          color: dashboardTheme.colors.primary,
          unit: 'glasses',
        },
        {
          id: '4',
          title: 'Sleep',
          completed: 7.3,
          target: 8,
          icon: 'moon',
          color: dashboardTheme.colors.accent,
          unit: 'hours avg',
        },
      ],
    };
    return mockData[period];
  };

  const loadActionItems = async () => {
    try {
      // Try to load from service if available
      // For now, using mock data with dynamic initialization
      const mockActionItems: ActionItem[] = [
        {
          id: '1',
          title: 'Morning Workout',
          description: 'Complete your 30-minute HIIT routine',
          completed: true,
          type: 'workout',
          icon: 'fitness',
          time: '7:00 AM',
        },
        {
          id: '2',
          title: 'Healthy Breakfast',
          description: 'Log your morning meal with protein focus',
          completed: true,
          type: 'meal',
          icon: 'restaurant',
          time: '8:30 AM',
        },
        {
          id: '3',
          title: 'Hydration Check',
          description: 'Drink 2 more glasses of water',
          completed: false,
          type: 'habit',
          icon: 'water',
          time: '2:00 PM',
        },
        {
          id: '4',
          title: 'Evening Stretch',
          description: 'Complete 15-minute flexibility routine',
          completed: false,
          type: 'workout',
          icon: 'body',
          time: '7:00 PM',
        },
        {
          id: '5',
          title: 'Dinner Planning',
          description: 'Plan and log your evening meal',
          completed: false,
          type: 'meal',
          icon: 'restaurant',
          time: '6:00 PM',
        },
      ];
      setActionItems(mockActionItems);
    } catch (error) {
      console.error('[MyProgressDashboard] Error loading action items:', error);
      setActionItems([]);
    }
  };

  const loadCoachRecommendations = async () => {
    try {
      // Try to load from service if available
      // For now, using mock data with dynamic initialization
      const mockRecommendations: CoachRecommendation[] = [
        {
          id: '1',
          title: 'Adjust Workout Intensity',
          message: 'Based on yesterday\'s performance, consider reducing intensity by 10% today.',
          type: 'workout',
          priority: 'medium',
          icon: 'fitness',
        },
        {
          id: '2',
          title: 'Increase Protein Intake',
          message: 'Your protein intake is below target. Add a protein shake or nuts to your snack.',
          type: 'nutrition',
          priority: 'high',
          icon: 'nutrition',
        },
        {
          id: '3',
          title: 'Sleep Optimization',
          message: 'Try winding down 30 minutes earlier tonight for better sleep quality.',
          type: 'wellness',
          priority: 'medium',
          icon: 'moon',
        },
      ];
      setCoachRecommendations(mockRecommendations);
    } catch (error) {
      console.error('[MyProgressDashboard] Error loading coach recommendations:', error);
      setCoachRecommendations([]);
    }
  };

  // Load health data on mount and when period changes
  useEffect(() => {
    loadProgressData();
    loadActionItems();
    loadCoachRecommendations();
  }, [selectedPeriod]);

  // Period navigation
  const handlePreviousPeriod = () => {
    if (selectedPeriod === 'week') setSelectedPeriod('today');
    else if (selectedPeriod === 'month') setSelectedPeriod('week');
  };

  const handleNextPeriod = () => {
    if (selectedPeriod === 'today') setSelectedPeriod('week');
    else if (selectedPeriod === 'week') setSelectedPeriod('month');
  };

  const handleToggleAction = (actionId: string) => {
    setActionItems(prev =>
      prev.map(item =>
        item.id === actionId
          ? { ...item, completed: !item.completed }
          : item
      )
    );
    onToggleAction?.(actionId);
  };

  const getProgressPercentage = (completed: number, target: number) => {
    return Math.min((completed / target) * 100, 100);
  };

  const getActionTypeColor = (type: ActionItem['type']) => {
    switch (type) {
      case 'workout':
        return dashboardTheme.colors.orange;
      case 'meal':
        return dashboardTheme.colors.secondary;
      case 'habit':
        return dashboardTheme.colors.primary;
      case 'health':
        return dashboardTheme.colors.error;
      default:
        return dashboardTheme.colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: CoachRecommendation['priority']) => {
    switch (priority) {
      case 'high':
        return dashboardTheme.colors.error;
      case 'medium':
        return dashboardTheme.colors.warning;
      case 'low':
        return dashboardTheme.colors.success;
      default:
        return dashboardTheme.colors.textSecondary;
    }
  };

  const renderProgressCard = ({ item }: { item: ProgressCard }) => {
    const percentage = getProgressPercentage(item.completed, item.target);

    return (
      <View key={item.id} style={styles.progressCard}>
        <View style={[styles.progressIcon, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon as any} size={26} color={item.color} />
        </View>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.progressTitle}>{item.title}</Text>
        <Text style={styles.progressValue}>
          {item.completed} / {item.target} {item.unit}
        </Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%`, backgroundColor: item.color },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderActionItem = ({ item }: { item: ActionItem }) => (
    <TouchableOpacity
      style={[styles.actionItem, item.completed && styles.actionItemCompleted]}
      onPress={() => handleToggleAction(item.id)}
    >
      <View style={styles.actionLeft}>
        <View style={[
          styles.actionIcon,
          { backgroundColor: getActionTypeColor(item.type) + '20' },
        ]}>
          <Ionicons
            name={item.completed ? 'checkmark' : item.icon as any}
            size={18}
            color={item.completed ? dashboardTheme.colors.success : getActionTypeColor(item.type)}
          />
        </View>
        <View style={styles.actionContent}>
          <Text style={[styles.actionTitle, item.completed && styles.actionTitleCompleted]}>
            {item.title}
          </Text>
          <Text style={styles.actionDescription}>{item.description}</Text>
          {item.time && (
            <Text style={styles.actionTime}>{item.time}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={[styles.actionCheckbox, item.completed && styles.actionCheckboxCompleted]}
        onPress={() => handleToggleAction(item.id)}
      >
        {item.completed && <Ionicons name="checkmark" size={16} color="#ffffff" />}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderCoachRecommendation = ({ item }: { item: CoachRecommendation }) => (
    <TouchableOpacity style={styles.coachCard}>
      <View style={styles.coachHeader}>
        <View style={[styles.coachIcon, { backgroundColor: getPriorityColor(item.priority) + '20' }]}>
          <Ionicons name={item.icon as any} size={20} color={getPriorityColor(item.priority)} />
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
          <Text style={styles.priorityText}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.coachTitle}>{item.title}</Text>
      <Text style={styles.coachMessage}>{item.message}</Text>
      <TouchableOpacity style={styles.coachAction}>
        <Text style={styles.coachActionText}>Apply Suggestion</Text>
        <Ionicons name="arrow-forward" size={16} color={dashboardTheme.colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const completedActions = actionItems.filter(item => item.completed).length;
  const totalActions = actionItems.length;
  const dailyProgress = (completedActions / totalActions) * 100;

  // Helper function for health score gradient colors
  const getHealthScoreGradient = (score: number): readonly [string, string] => {
    if (score >= 80) return ['#10b981', '#059669'] as const;
    if (score >= 60) return ['#f59e0b', '#d97706'] as const;
    return ['#ef4444', '#dc2626'] as const;
  };

  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  
  const HEADER_MAX_HEIGHT = 140;
  const HEADER_MIN_HEIGHT = 0;
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // Interpolate header height
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  // Interpolate header opacity
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Interpolate title scale
  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.8],
    extrapolate: 'clamp',
  });

  // Interpolate title translateY
  const titleTranslateY = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      {/* Status bar area - Always red */}
      <View style={{ height: insets.top, backgroundColor: '#dc2626' }} />
      
      {/* Collapsing Header */}
      <Animated.View style={[styles.collapsibleHeader, { height: headerHeight, backgroundColor: '#dc2626' }]}>
        <LinearGradient
          colors={['#dc2626', '#dc2626']}
          style={styles.headerGradient}
        >
          <Animated.View 
            style={[
              styles.headerContent,
              { 
                opacity: headerOpacity,
                transform: [
                  { scale: titleScale },
                  { translateY: titleTranslateY }
                ]
              }
            ]}
          >
            <Text style={styles.collapsibleHeaderTitle}>My Progress</Text>
            <Text style={styles.collapsibleHeaderSubtitle}>Track your daily health journey</Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressBadgeText}>Today's Progress: {Math.round(dailyProgress)}%</Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>

      {/* Period Selector - Fixed outside ScrollView */}
      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as const).map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text style={[
              styles.periodText,
              selectedPeriod === period && styles.periodTextActive,
            ]}>
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Progress Cards */}
        <View style={[styles.progressSection, { paddingHorizontal: layout.horizontalPadding }]}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity 
              style={[styles.navButton, selectedPeriod === 'today' && styles.navButtonDisabled]}
              onPress={handlePreviousPeriod}
              disabled={selectedPeriod === 'today'}
            >
              <Ionicons 
                name="chevron-back" 
                size={24} 
                color={selectedPeriod === 'today' ? '#cbd5e1' : dashboardTheme.colors.primary} 
              />
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>
              {selectedPeriod === 'today' ? "Today's Metrics" : 
               selectedPeriod === 'week' ? "This Week's Metrics" : 
               "This Month's Metrics"}
            </Text>
            <TouchableOpacity 
              style={[styles.navButton, selectedPeriod === 'month' && styles.navButtonDisabled]}
              onPress={handleNextPeriod}
              disabled={selectedPeriod === 'month'}
            >
              <Ionicons 
                name="chevron-forward" 
                size={24} 
                color={selectedPeriod === 'month' ? '#cbd5e1' : dashboardTheme.colors.primary} 
              />
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={dashboardColors.primary} />
              <Text style={styles.loadingText}>Loading health data...</Text>
            </View>
          ) : (
            <View style={styles.progressGrid}>
              {progressCards.map(card => renderProgressCard({ item: card }))}
            </View>
          )}
        </View>

        {/* Health Trends from Scans Section */}
        <View style={[styles.trendsSection, { paddingHorizontal: layout.horizontalPadding }]}>
          <View style={styles.trendsSectionHeader}>
            <Text style={styles.sectionTitle}>Scan-Based Health Trends</Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('ScanHistory' as never)}
              style={styles.viewHistoryButton}
            >
              <Text style={styles.viewHistoryText}>Scan History</Text>
              <Ionicons name="chevron-forward" size={14} color={dashboardColors.primary} />
            </TouchableOpacity>
          </View>
          {trendsLoading ? (
            <View style={styles.trendsLoadingContainer}>
              <ActivityIndicator size="small" color={dashboardColors.primary} />
            </View>
          ) : healthTrends && healthTrends.totalScans > 0 ? (
            <View style={styles.trendsContent}>
              {/* Scan Statistics */}
              <View style={styles.scanStatsRow}>
                <View style={styles.scanStatCard}>
                  <Ionicons name="scan-outline" size={24} color={dashboardColors.primary} />
                  <Text style={styles.scanStatValue}>{healthTrends.totalScans}</Text>
                  <Text style={styles.scanStatLabel}>Total Scans</Text>
                </View>
                <View style={styles.scanStatCard}>
                  <Ionicons name="heart-outline" size={24} color={dashboardColors.success} />
                  <Text style={styles.scanStatValue}>
                    {healthTrends.averageHealthScore > 0 ? Math.round(healthTrends.averageHealthScore) : '--'}
                  </Text>
                  <Text style={styles.scanStatLabel}>Avg Score</Text>
                </View>
                <View style={styles.scanStatCard}>
                  <Ionicons name="restaurant-outline" size={24} color={dashboardColors.orange} />
                  <Text style={styles.scanStatValue}>{(healthTrends.scansByType.food_photo || 0) + (healthTrends.scansByType.image || 0)}</Text>
                  <Text style={styles.scanStatLabel}>Food Scans</Text>
                </View>
              </View>
              
              {/* Scan Type Breakdown */}
              {(healthTrends.scansByType.barcode > 0 || healthTrends.scansByType.pill > 0 || (healthTrends.scansByType.product_label || 0) + (healthTrends.scansByType.label || 0) > 0) && (
                <View style={styles.scanBreakdownContainer}>
                  <Text style={styles.scanBreakdownTitle}>Scan Types</Text>
                  <View style={styles.scanBreakdownRow}>
                    {healthTrends.scansByType.barcode > 0 && (
                      <View style={styles.scanBreakdownItem}>
                        <Ionicons name="barcode-outline" size={16} color={dashboardColors.primary} />
                        <Text style={styles.scanBreakdownText}>{healthTrends.scansByType.barcode} Barcodes</Text>
                      </View>
                    )}
                    {healthTrends.scansByType.pill > 0 && (
                      <View style={styles.scanBreakdownItem}>
                        <Ionicons name="medical-outline" size={16} color={dashboardColors.error} />
                        <Text style={styles.scanBreakdownText}>{healthTrends.scansByType.pill} Pills</Text>
                      </View>
                    )}
                    {((healthTrends.scansByType.product_label || 0) + (healthTrends.scansByType.label || 0)) > 0 && (
                      <View style={styles.scanBreakdownItem}>
                        <Ionicons name="document-text-outline" size={16} color={dashboardColors.orange} />
                        <Text style={styles.scanBreakdownText}>{(healthTrends.scansByType.product_label || 0) + (healthTrends.scansByType.label || 0)} Labels</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Health Score Trend Indicator */}
              {healthTrends.averageHealthScore > 0 && (
                <View style={styles.healthScoreTrendContainer}>
                  <LinearGradient
                    colors={getHealthScoreGradient(healthTrends.averageHealthScore)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.healthScoreTrendBar}
                  >
                    <View style={[styles.healthScoreIndicator, { 
                      left: `${Math.min(healthTrends.averageHealthScore, 100)}%` 
                    }]} />
                  </LinearGradient>
                  <View style={styles.healthScoreLabels}>
                    <Text style={styles.healthScoreLabel}>Poor</Text>
                    <Text style={styles.healthScoreLabel}>Good</Text>
                    <Text style={styles.healthScoreLabel}>Excellent</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noTrendsContainer}>
              <Ionicons name="analytics-outline" size={32} color="#9ca3af" />
              <Text style={styles.noTrendsText}>No scan data for this period</Text>
              <TouchableOpacity 
                style={styles.startScanningButton}
                onPress={() => navigation.navigate('Camera' as never)}
              >
                <Text style={styles.startScanningButtonText}>Start Scanning</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Action Items */}
        <View style={[styles.actionSection, { paddingHorizontal: layout.horizontalPadding }]}>
          <Text style={styles.sectionTitle}>Today's Actions ({completedActions}/{totalActions})</Text>
          <View style={styles.actionList}>
            {actionItems.map((item, index) => (
              <View key={item.id}>
                {renderActionItem({ item })}
              </View>
            ))}
          </View>
        </View>

        {/* Goals Dashboard Section - Backend-Driven */}
        <View style={[styles.combinedProgramSection, { paddingHorizontal: layout.horizontalPadding }]}>
          <View style={styles.combinedSectionHeader}>
            <Text style={styles.sectionTitle}>Meal & Fitness Goals</Text>
          </View>
          
          <Text style={styles.goalSectionSubtitle}>
            Select your goal to get a personalized plan
          </Text>
          
          {goalsLoading ? (
            <View style={styles.programLoadingContainer}>
              <ActivityIndicator size="small" color={dashboardColors.primary} />
            </View>
          ) : goalsData ? (
            <>
              <View style={styles.goalsGrid}>
                {goalsData.goals.map((goal) => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalCard,
                      { 
                        backgroundColor: goal.isActive ? goal.color : dashboardTheme.colors.surface,
                        borderWidth: goal.isActive ? 0 : 1,
                        borderColor: '#e5e7eb',
                      }
                    ]}
                    onPress={() => selectGoal(goal.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.goalCardIconContainer, 
                      { backgroundColor: goal.isActive ? 'rgba(255,255,255,0.2)' : goal.color + '20' }
                    ]}>
                      <Ionicons 
                        name={goal.icon as any} 
                        size={28} 
                        color={goal.isActive ? '#ffffff' : goal.color} 
                      />
                    </View>
                    <Text style={[
                      styles.goalCardTitle,
                      goal.isActive && styles.goalCardTitleActive
                    ]}>
                      {goal.label}
                    </Text>
                    <Text style={[
                      styles.goalCardFormula,
                      goal.isActive && styles.goalCardFormulaActive
                    ]}>
                      {goal.formula}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Active Goal Progress (from backend) */}
              {goalsData.activeGoal && goalsData.userProgress && (
                <View style={styles.activeProgramStats}>
                  <View style={styles.activeProgramStatsHeader}>
                    <Text style={styles.activeProgramStatsTitle}>
                      {goalsData.goals.find(g => g.id === goalsData.activeGoal)?.label} Progress
                    </Text>
                    <TouchableOpacity 
                      onPress={() => clearGoal()}
                      style={styles.programActionButton}
                    >
                      <Text style={styles.programActionText}>Clear Goal</Text>
                      <Ionicons name="close-circle-outline" size={14} color={dashboardColors.primary} />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.todayStatsContainer}>
                    <View style={[
                      styles.todayStatCard,
                      goalsData.userProgress.workoutsCompleted > 0 && styles.todayStatCardCompleted
                    ]}>
                      <Ionicons 
                        name={goalsData.userProgress.workoutsCompleted > 0 ? 'checkmark-circle' : 'fitness'} 
                        size={24} 
                        color={goalsData.userProgress.workoutsCompleted > 0 ? '#10b981' : '#f97316'} 
                      />
                      <Text style={styles.todayStatValue}>
                        {goalsData.userProgress.workoutsCompleted > 0 ? 'Done!' : 'Workout'}
                      </Text>
                    </View>
                    <View style={styles.todayStatCard}>
                      <Ionicons name="restaurant" size={24} color="#8b5cf6" />
                      <Text style={styles.todayStatValue}>
                        {goalsData.userProgress.caloriesLogged || 0} cal
                      </Text>
                    </View>
                    <View style={styles.todayStatCard}>
                      <Ionicons name="trending-up" size={24} color="#10b981" />
                      <Text style={styles.todayStatValue}>
                        {goalsData.userProgress.overallProgress || 0}%
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Community Stats */}
              {goalsData.community && (
                <View style={styles.communityStatsContainer}>
                  <Text style={styles.communityStatsTitle}>Community</Text>
                  <View style={styles.communityStatsRow}>
                    <View style={styles.communityStatItem}>
                      <Ionicons name="people" size={20} color={dashboardColors.primary} />
                      <Text style={styles.communityStatValue}>
                        {(goalsData.community.totalActiveUsers / 1000).toFixed(0)}k
                      </Text>
                      <Text style={styles.communityStatLabel}>Active</Text>
                    </View>
                    <View style={styles.communityStatItem}>
                      <Ionicons name="leaf" size={20} color="#10b981" />
                      <Text style={styles.communityStatValue}>
                        {(goalsData.community.totalWasteReduced / 1000).toFixed(0)}k lbs
                      </Text>
                      <Text style={styles.communityStatLabel}>Waste Reduced</Text>
                    </View>
                    <View style={styles.communityStatItem}>
                      <Ionicons name="trophy" size={20} color="#f97316" />
                      <Text style={styles.communityStatValue}>
                        {goalsData.community.topGoal?.replace('_', ' ')}
                      </Text>
                      <Text style={styles.communityStatLabel}>Top Goal</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          ) : null}
        </View>

        {/* Coach Recommendations */}
        <View style={[styles.coachSection, { paddingHorizontal: layout.horizontalPadding }]}>
          <Text style={styles.sectionTitle}>AI Coach Recommendations</Text>
          <View style={styles.coachList}>
            {coachRecommendations.map((item, index) => (
              <View key={item.id}>
                {renderCoachRecommendation({ item })}
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacing for tab navigation */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
};

// Helper function for goal colors
const getGoalColor = (goalId: string): string => {
  const colors: Record<string, string> = {
    weight_loss: '#ef4444',
    muscle_gain: '#f97316',
    body_recomposition: '#8b5cf6',
    maintenance: '#10b981',
    athletic_performance: '#3b82f6',
    general_health: '#ec4899',
  };
  return colors[goalId] || '#6b7280';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
  },

  // Collapsible header styles
  collapsibleHeader: {
    overflow: 'hidden',
  },

  headerGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },

  headerContent: {
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingBottom: dashboardTheme.spacing.md,
  },

  collapsibleHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },

  collapsibleHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
  },

  progressBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },

  progressBadgeText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  header: {
    padding: dashboardTheme.spacing.lg,
    paddingTop: dashboardTheme.spacing.lg,
  },

  headerTitle: {
    ...dashboardTheme.typography.headerLarge,
    color: '#ffffff',
    marginBottom: dashboardTheme.spacing.xs,
  },

  headerSubtitle: {
    ...dashboardTheme.typography.body,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: dashboardTheme.spacing.md,
  },

  dailyProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  dailyProgressText: {
    ...dashboardTheme.typography.body,
    color: 'rgba(255,255,255,0.8)',
  },

  dailyProgressValue: {
    ...dashboardTheme.typography.header,
    color: '#ffffff',
    fontWeight: '700',
  },

  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: dashboardTheme.spacing.lg,
    marginVertical: dashboardTheme.spacing.md,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.xs,
    ...dashboardTheme.shadows.sm,
  },

  periodButton: {
    flex: 1,
    paddingVertical: dashboardTheme.spacing.sm,
    alignItems: 'center',
    borderRadius: dashboardTheme.borderRadius.md,
  },

  periodButtonActive: {
    backgroundColor: dashboardTheme.colors.secondary,
  },

  periodText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
  },

  periodTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  progressSection: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: dashboardTheme.spacing.md,
  },

  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: dashboardTheme.colors.surface,
    ...dashboardTheme.shadows.sm,
  },

  navButtonDisabled: {
    opacity: 0.3,
  },

  sectionTitle: {
    ...dashboardTheme.typography.title,
    marginBottom: dashboardTheme.spacing.md,
  },

  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },

  progressCard: {
    width: '48.5%',
    backgroundColor: dashboardTheme.colors.surface,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
    alignItems: 'center',
  },

  progressIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  progressPercentage: {
    fontSize: 28,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
  },

  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: 4,
  },

  progressValue: {
    fontSize: 12,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: 12,
  },

  progressBarBackground: {
    width: '80%',
    height: 5,
    backgroundColor: dashboardTheme.colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  actionSection: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  actionList: {
    gap: dashboardTheme.spacing.sm,
  },

  actionItem: {
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  actionItemCompleted: {
    opacity: 0.7,
  },

  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: dashboardTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: dashboardTheme.spacing.md,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.xs,
  },

  actionTitleCompleted: {
    textDecorationLine: 'line-through',
    color: dashboardTheme.colors.textSecondary,
  },

  actionDescription: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.xs,
  },

  actionTime: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.primary,
    fontWeight: '500',
  },

  actionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: dashboardTheme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionCheckboxCompleted: {
    backgroundColor: dashboardTheme.colors.success,
    borderColor: dashboardTheme.colors.success,
  },

  coachSection: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  coachList: {
    gap: dashboardTheme.spacing.md,
  },

  coachCard: {
    backgroundColor: dashboardTheme.colors.surface,
    padding: dashboardTheme.spacing.md,
    borderRadius: dashboardTheme.borderRadius.lg,
    ...dashboardTheme.shadows.md,
  },

  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.sm,
  },

  coachIcon: {
    width: 32,
    height: 32,
    borderRadius: dashboardTheme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  priorityBadge: {
    paddingHorizontal: dashboardTheme.spacing.sm,
    paddingVertical: dashboardTheme.spacing.xs,
    borderRadius: dashboardTheme.borderRadius.sm,
  },

  priorityText: {
    ...dashboardTheme.typography.caption,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 10,
  },

  coachTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '600',
    color: dashboardTheme.colors.text,
    marginBottom: dashboardTheme.spacing.xs,
  },

  coachMessage: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: dashboardTheme.spacing.md,
  },

  coachAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dashboardTheme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
  },

  coachActionText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.primary,
    fontWeight: '500',
    marginRight: dashboardTheme.spacing.xs,
  },

  loadingContainer: {
    padding: dashboardTheme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },

  loadingText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.md,
  },

  // Health Trends Section Styles
  trendsSection: {
    paddingTop: dashboardTheme.spacing.lg,
  },

  trendsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.md,
  },

  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  viewHistoryText: {
    ...dashboardTheme.typography.caption,
    color: dashboardColors.primary,
    fontWeight: '600',
  },

  trendsLoadingContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trendsContent: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.md,
    ...dashboardTheme.shadows.sm,
  },

  scanStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: dashboardTheme.spacing.md,
  },

  scanStatCard: {
    alignItems: 'center',
    flex: 1,
  },

  scanStatValue: {
    ...dashboardTheme.typography.title,
    color: dashboardTheme.colors.text,
    fontWeight: '700',
    marginTop: dashboardTheme.spacing.xs,
  },

  scanStatLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginTop: 2,
  },

  scanBreakdownContainer: {
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
    paddingTop: dashboardTheme.spacing.md,
    marginBottom: dashboardTheme.spacing.md,
  },

  scanBreakdownTitle: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.sm,
    fontWeight: '600',
  },

  scanBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dashboardTheme.spacing.sm,
  },

  scanBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: dashboardTheme.colors.background,
    paddingHorizontal: dashboardTheme.spacing.sm,
    paddingVertical: dashboardTheme.spacing.xs,
    borderRadius: dashboardTheme.borderRadius.sm,
  },

  scanBreakdownText: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.text,
    marginLeft: 4,
  },

  healthScoreTrendContainer: {
    borderTopWidth: 1,
    borderTopColor: dashboardTheme.colors.border,
    paddingTop: dashboardTheme.spacing.md,
  },

  healthScoreTrendBar: {
    height: 8,
    borderRadius: 4,
    position: 'relative',
  },

  healthScoreIndicator: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: dashboardColors.primary,
    marginLeft: -8,
  },

  healthScoreLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: dashboardTheme.spacing.xs,
  },

  healthScoreLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 10,
  },

  noTrendsContainer: {
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: dashboardTheme.borderRadius.lg,
    padding: dashboardTheme.spacing.xl,
    alignItems: 'center',
    ...dashboardTheme.shadows.sm,
  },

  noTrendsText: {
    ...dashboardTheme.typography.body,
    color: dashboardTheme.colors.textSecondary,
    marginTop: dashboardTheme.spacing.sm,
    marginBottom: dashboardTheme.spacing.md,
  },

  startScanningButton: {
    backgroundColor: dashboardColors.primary,
    paddingHorizontal: dashboardTheme.spacing.lg,
    paddingVertical: dashboardTheme.spacing.sm,
    borderRadius: dashboardTheme.borderRadius.md,
  },

  startScanningButtonText: {
    ...dashboardTheme.typography.body,
    color: '#ffffff',
    fontWeight: '600',
  },

  // Combined Program Section Styles
  combinedProgramSection: {
    marginTop: dashboardTheme.spacing.xl,
  },

  combinedSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.xs,
  },

  goalSectionSubtitle: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    marginBottom: dashboardTheme.spacing.md,
  },

  programActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  programActionText: {
    ...dashboardTheme.typography.caption,
    color: dashboardColors.primary,
    fontWeight: '600',
  },

  programLoadingContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  goalCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    ...dashboardTheme.shadows.sm,
  },

  goalCardActive: {
    // No longer needed - styles applied inline
  },

  goalCardGradient: {
    // No longer used
  },

  goalCardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  goalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },

  goalCardTitleActive: {
    color: '#ffffff',
  },

  goalCardFormula: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },

  goalCardFormulaActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },

  goalCardActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: dashboardTheme.spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: dashboardTheme.spacing.md,
    gap: 6,
  },

  goalCardActiveBadgeText: {
    ...dashboardTheme.typography.caption,
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },

  activeProgramStats: {
    marginTop: dashboardTheme.spacing.lg,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: 16,
    padding: dashboardTheme.spacing.md,
    ...dashboardTheme.shadows.sm,
  },

  activeProgramStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dashboardTheme.spacing.md,
  },

  activeProgramStatsTitle: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
  },

  todayStatsContainer: {
    flexDirection: 'row',
    gap: dashboardTheme.spacing.sm,
  },

  todayStatCard: {
    flex: 1,
    backgroundColor: dashboardTheme.colors.background,
    borderRadius: 12,
    padding: dashboardTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  todayStatCardCompleted: {
    backgroundColor: '#d1fae5',
  },

  todayStatValue: {
    ...dashboardTheme.typography.caption,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginTop: 6,
    textAlign: 'center',
    fontSize: 16,
  },

  todayStatLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    textAlign: 'center',
  },

  // Community Stats Styles
  communityStatsContainer: {
    marginTop: dashboardTheme.spacing.lg,
    backgroundColor: dashboardTheme.colors.surface,
    borderRadius: 16,
    padding: dashboardTheme.spacing.md,
    ...dashboardTheme.shadows.sm,
  },

  communityStatsTitle: {
    ...dashboardTheme.typography.caption,
    fontWeight: '700',
    color: dashboardTheme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: dashboardTheme.spacing.md,
    fontSize: 12,
  },

  communityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  communityStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: dashboardTheme.spacing.sm,
  },

  communityStatValue: {
    ...dashboardTheme.typography.body,
    fontWeight: '700',
    color: dashboardTheme.colors.text,
    marginTop: 6,
    textTransform: 'capitalize',
    fontSize: 16,
  },

  communityStatLabel: {
    ...dashboardTheme.typography.caption,
    color: dashboardTheme.colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
});

export default MyProgressDashboard;
