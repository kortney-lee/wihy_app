import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '../components/shared';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../types/navigation';
import { WebPageWrapper } from '../components/shared';
import { coachService, fitnessService, nutritionService, mealService, ClientNote, NoteCategory } from '../services';
import { healthDataService, HealthMetrics, WeeklyHealthData } from '../services/healthDataService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const isWeb = Platform.OS === 'web';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ============= TYPES =============

interface ClientProgressData {
  client: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    joined_date: string;
    last_active?: string;
    goals?: string[];
    diet_type?: string;
  };
  fitness: {
    current_program?: {
      id: string;
      name: string;
      goal: string;
      week_number: number;
      total_weeks: number;
    };
    workouts_completed: number;
    workouts_scheduled: number;
    adherence_rate: number;
    streak_days: number;
    total_workout_minutes: number;
    recent_sessions: Array<{
      id: string;
      date: string;
      name: string;
      duration_minutes: number;
      exercises_completed: number;
      rpe?: number;
    }>;
    weekly_progress: Array<{
      week: string;
      workouts: number;
      minutes: number;
    }>;
  };
  nutrition: {
    current_meal_plan?: {
      id: string;
      name: string;
      days_completed: number;
      total_days: number;
    };
    daily_average_calories: number;
    calorie_goal: number;
    goal_compliance_rate: number;
    macros_average: {
      protein: number;
      carbs: number;
      fat: number;
    };
    macros_target: {
      protein: number;
      carbs: number;
      fat: number;
    };
    meals_logged_today: number;
    water_intake_today: number;
    water_goal: number;
    recent_meals: Array<{
      id: string;
      name: string;
      meal_type: string;
      calories: number;
      logged_at: string;
    }>;
    weekly_calories: Array<{
      day: string;
      calories: number;
      goal: number;
    }>;
  };
  body_metrics?: {
    current_weight?: number;
    start_weight?: number;
    goal_weight?: number;
    weight_change?: number;
    bmi?: number;
    body_fat_percentage?: number;
    weight_history: Array<{
      date: string;
      weight: number;
    }>;
  };
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    earned_at: string;
    icon: string;
  }>;
  coach_notes: Array<{
    id: string;
    note: string;
    created_at: string;
    category: 'general' | 'fitness' | 'nutrition' | 'milestone';
  }>;
}

// Platform-specific health data from device
interface DeviceHealthData {
  platform: 'ios' | 'android';
  source: string; // 'Apple Health' | 'Health Connect' | 'Google Fit'
  isAvailable: boolean;
  hasPermissions: boolean;
  todayMetrics?: HealthMetrics;
  weeklyData?: WeeklyHealthData;
  healthScore?: number;
  lastSynced?: string;
}

// Note category filter options
const NOTE_CATEGORIES: { key: NoteCategory | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: 'list' },
  { key: 'progress', label: 'Progress', icon: 'trending-up' },
  { key: 'fitness', label: 'Fitness', icon: 'fitness' },
  { key: 'nutrition', label: 'Nutrition', icon: 'restaurant' },
  { key: 'health', label: 'Health', icon: 'heart' },
  { key: 'general', label: 'General', icon: 'chatbubble' },
];

type TabType = 'overview' | 'fitness' | 'nutrition' | 'health' | 'body' | 'notes';

// ============= COMPONENT =============

export default function ClientProgressScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { theme } = useTheme();
  const route = useRoute<RouteProp<RootStackParamList, 'ClientProgress'>>();
  const { coachId } = useAuth();
  
  const clientId = route.params?.clientId;
  const clientName = route.params?.clientName;
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progressData, setProgressData] = useState<ClientProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Platform-specific health data state
  const [deviceHealthData, setDeviceHealthData] = useState<DeviceHealthData | null>(null);
  const [healthDataLoading, setHealthDataLoading] = useState(false);
  
  // Notes state
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [noteCategory, setNoteCategory] = useState<NoteCategory | 'all'>('all');
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>('general');

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

  // Load device health data (platform-specific)
  const loadDeviceHealthData = useCallback(async () => {
    try {
      setHealthDataLoading(true);
      
      // Determine platform and source
      const platform = Platform.OS as 'ios' | 'android';
      let source = 'Unknown';
      
      if (platform === 'ios') {
        source = 'Apple Health';
      } else if (platform === 'android') {
        // Health Connect takes priority, fallback to Google Fit
        source = 'Health Connect / Google Fit';
      }
      
      // Initialize health service
      const hasPermissions = await healthDataService.initialize();
      
      if (!hasPermissions) {
        setDeviceHealthData({
          platform,
          source,
          isAvailable: true,
          hasPermissions: false,
          lastSynced: new Date().toISOString(),
        });
        return;
      }
      
      // Fetch health data based on platform
      const [todayMetrics, weeklyData, healthScore] = await Promise.all([
        healthDataService.getTodayMetrics().catch(() => undefined),
        healthDataService.getWeeklyData().catch(() => undefined),
        healthDataService.getHealthScore().catch(() => undefined),
      ]);
      
      setDeviceHealthData({
        platform,
        source,
        isAvailable: true,
        hasPermissions: true,
        todayMetrics,
        weeklyData,
        healthScore,
        lastSynced: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error loading device health data:', err);
      setDeviceHealthData({
        platform: Platform.OS as 'ios' | 'android',
        source: Platform.OS === 'ios' ? 'Apple Health' : 'Health Connect / Google Fit',
        isAvailable: false,
        hasPermissions: false,
      });
    } finally {
      setHealthDataLoading(false);
    }
  }, []);

  // Load client notes
  const loadClientNotes = useCallback(async () => {
    if (!clientId || !coachId) return;
    
    try {
      setNotesLoading(true);
      const notes = await coachService.getClientNotes(
        coachId,
        clientId,
        {
          category: noteCategory !== 'all' ? noteCategory : undefined,
          limit: 50,
        }
      );
      setClientNotes(notes);
    } catch (err) {
      console.error('Error loading client notes:', err);
    } finally {
      setNotesLoading(false);
    }
  }, [clientId, coachId, noteCategory]);

  // Add new note
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !clientId || !coachId) return;
    
    try {
      await coachService.addClientNote(
        coachId,
        clientId,
        newNoteText.trim(),
        newNoteCategory
      );
      setNewNoteText('');
      setShowAddNoteModal(false);
      loadClientNotes();
      Alert.alert('Success', 'Note added successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to add note');
      console.error('Error adding note:', err);
    }
  };

  // Delete note
  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await coachService.deleteClientNote(coachId, noteId);
              loadClientNotes();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  const loadProgressData = useCallback(async () => {
    if (!clientId) return;
    
    try {
      setError(null);
      
      // Fetch all data in parallel
      const [dashboardData, fitnessHistory, nutritionData] = await Promise.all([
        coachService.getClientDashboard(coachId, clientId),
        fitnessService.getHistory(clientId, 30).catch(() => ({ sessions: [] })),
        nutritionService.getDailySummary(clientId).catch(() => null),
      ]);
      
      // Also get assigned programs
      const [mealPrograms, workoutPrograms] = await Promise.all([
        coachService.getClientMealPrograms(coachId, clientId).catch(() => []),
        coachService.getClientWorkoutPrograms(coachId, clientId).catch(() => []),
      ]);
      
      // Transform data into our format
      const data: ClientProgressData = {
        client: {
          id: dashboardData.client.id,
          name: dashboardData.client.name,
          email: dashboardData.client.email,
          joined_date: dashboardData.client.joined_date,
          last_active: dashboardData.client.last_active,
          goals: (dashboardData.client as any).goals || [],
          diet_type: (dashboardData.client as any).diet_type,
        },
        fitness: {
          current_program: workoutPrograms.length > 0 ? {
            id: workoutPrograms[0].program_id,
            name: workoutPrograms[0].name,
            goal: workoutPrograms[0].goal,
            week_number: Math.ceil(workoutPrograms[0].completion_percentage / 12.5), // Approximate
            total_weeks: 8, // Default
          } : undefined,
          workouts_completed: dashboardData.fitness_progress.workouts_completed,
          workouts_scheduled: dashboardData.fitness_progress.workouts_completed + 10, // Approximate
          adherence_rate: dashboardData.fitness_progress.adherence_rate,
          streak_days: calculateStreak(dashboardData.fitness_progress.recent_sessions),
          total_workout_minutes: calculateTotalMinutes(dashboardData.fitness_progress.recent_sessions),
          recent_sessions: dashboardData.fitness_progress.recent_sessions.slice(0, 5).map((s: any) => ({
            id: s.id || String(Math.random()),
            date: s.date || s.completed_at,
            name: s.name || s.workout_name || 'Workout',
            duration_minutes: s.duration_minutes || 45,
            exercises_completed: s.exercises_completed || 8,
            rpe: s.rpe,
          })),
          weekly_progress: generateWeeklyProgress(dashboardData.fitness_progress.recent_sessions),
        },
        nutrition: {
          current_meal_plan: mealPrograms.length > 0 ? {
            id: mealPrograms[0].program_id,
            name: mealPrograms[0].program_name,
            days_completed: Math.round(mealPrograms[0].completion_percentage * 14 / 100),
            total_days: 14,
          } : undefined,
          daily_average_calories: dashboardData.nutrition_summary.daily_average_calories,
          calorie_goal: 2000, // Default, should come from API
          goal_compliance_rate: dashboardData.nutrition_summary.goal_compliance_rate,
          macros_average: {
            protein: nutritionData?.protein_g || 120,
            carbs: nutritionData?.carbs_g || 200,
            fat: nutritionData?.fat_g || 65,
          },
          macros_target: {
            protein: 150,
            carbs: 200,
            fat: 60,
          },
          meals_logged_today: dashboardData.nutrition_summary.recent_meals.filter(
            (m: any) => isToday(m.logged_at)
          ).length,
          water_intake_today: nutritionData?.water_ml || 1500,
          water_goal: 2500,
          recent_meals: dashboardData.nutrition_summary.recent_meals.slice(0, 5).map((m: any) => ({
            id: m.id || String(Math.random()),
            name: m.name || m.meal_name,
            meal_type: m.meal_type || 'lunch',
            calories: m.calories || 400,
            logged_at: m.logged_at || new Date().toISOString(),
          })),
          weekly_calories: generateWeeklyCalories(),
        },
        body_metrics: undefined, // Would need separate API
        achievements: [],
        coach_notes: [],
      };
      
      setProgressData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load client progress';
      setError(message);
      console.error('Error loading client progress:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId, coachId]);

  useEffect(() => {
    loadProgressData();
    // Also load device health data
    loadDeviceHealthData();
  }, [loadProgressData, loadDeviceHealthData]);

  // Load notes when notes tab is active or category changes
  useEffect(() => {
    if (activeTab === 'notes') {
      loadClientNotes();
    }
  }, [activeTab, loadClientNotes]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadProgressData(),
      loadDeviceHealthData(),
    ]);
    setRefreshing(false);
  };

  const handleAssignMealPlan = async () => {
    Alert.prompt(
      'Assign Meal Plan',
      'Enter the meal program ID to assign:',
      async (programId) => {
        if (!programId?.trim()) return;
        try {
          await coachService.assignMealProgram({
            coachId,
            clientId: clientId!,
            programId: programId.trim(),
          });
          Alert.alert('Success', 'Meal plan assigned successfully');
          loadProgressData();
        } catch (err) {
          Alert.alert('Error', 'Failed to assign meal plan');
        }
      }
    );
  };

  const handleAssignWorkout = async () => {
    Alert.prompt(
      'Assign Workout Plan',
      'Enter the workout program ID to assign:',
      async (programId) => {
        if (!programId?.trim()) return;
        try {
          await coachService.assignFitnessPlan({
            coachId,
            clientId: clientId!,
            programId: programId.trim(),
          });
          Alert.alert('Success', 'Workout plan assigned successfully');
          loadProgressData();
        } catch (err) {
          Alert.alert('Error', 'Failed to assign workout plan');
        }
      }
    );
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: 'grid-outline' },
    { id: 'fitness' as TabType, label: 'Fitness', icon: 'fitness-outline' },
    { id: 'nutrition' as TabType, label: 'Nutrition', icon: 'nutrition-outline' },
    { id: 'health' as TabType, label: 'Health Data', icon: 'heart-outline' },
    { id: 'body' as TabType, label: 'Body', icon: 'body-outline' },
    { id: 'notes' as TabType, label: 'Notes', icon: 'document-text-outline' },
  ];

  // ============= RENDER TABS =============

  const renderOverviewTab = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.tabContent}>
        {/* Quick Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient colors={['#10b981', '#059669']} style={styles.statGradient}>
              <Ionicons name="fitness" size={24} color="#fff" />
              <Text style={styles.statValue}>{progressData.fitness.adherence_rate}%</Text>
              <Text style={styles.statLabel}>Workout Adherence</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.statGradient}>
              <Ionicons name="flame" size={24} color="#fff" />
              <Text style={styles.statValue}>{progressData.fitness.streak_days}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.statGradient}>
              <Ionicons name="restaurant" size={24} color="#fff" />
              <Text style={styles.statValue}>{progressData.nutrition.goal_compliance_rate}%</Text>
              <Text style={styles.statLabel}>Diet Compliance</Text>
            </LinearGradient>
          </View>
          <View style={styles.statCard}>
            <LinearGradient colors={['#8b5cf6', '#7c3aed']} style={styles.statGradient}>
              <Ionicons name="trophy" size={24} color="#fff" />
              <Text style={styles.statValue}>{progressData.fitness.workouts_completed}</Text>
              <Text style={styles.statLabel}>Workouts Done</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Current Programs */}
        <Text style={styles.sectionTitle}>Active Programs</Text>
        <View style={styles.card}>
          {progressData.fitness.current_program ? (
            <View style={styles.programItem}>
              <View style={styles.programIcon}>
                <Ionicons name="barbell" size={20} color="#3b82f6" />
              </View>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{progressData.fitness.current_program.name}</Text>
                <Text style={styles.programMeta}>
                  Week {progressData.fitness.current_program.week_number} of {progressData.fitness.current_program.total_weeks}
                </Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>
                  {Math.round((progressData.fitness.current_program.week_number / progressData.fitness.current_program.total_weeks) * 100)}%
                </Text>
              </View>
            </View>
          ) : (
            <Pressable style={styles.emptyProgram} onPress={handleAssignWorkout}>
              <Ionicons name="add-circle-outline" size={24} color="#9ca3af" />
              <Text style={styles.emptyProgramText}>No workout program assigned</Text>
              <Text style={styles.emptyProgramAction}>Tap to assign</Text>
            </Pressable>
          )}
          
          {progressData.nutrition.current_meal_plan ? (
            <View style={[styles.programItem, { marginTop: 12 }]}>
              <View style={[styles.programIcon, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="restaurant" size={20} color="#f59e0b" />
              </View>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{progressData.nutrition.current_meal_plan.name}</Text>
                <Text style={styles.programMeta}>
                  Day {progressData.nutrition.current_meal_plan.days_completed} of {progressData.nutrition.current_meal_plan.total_days}
                </Text>
              </View>
              <View style={[styles.progressBadge, { backgroundColor: '#fef3c7' }]}>
                <Text style={[styles.progressBadgeText, { color: '#f59e0b' }]}>
                  {Math.round((progressData.nutrition.current_meal_plan.days_completed / progressData.nutrition.current_meal_plan.total_days) * 100)}%
                </Text>
              </View>
            </View>
          ) : (
            <Pressable style={[styles.emptyProgram, { marginTop: 12 }]} onPress={handleAssignMealPlan}>
              <Ionicons name="add-circle-outline" size={24} color="#9ca3af" />
              <Text style={styles.emptyProgramText}>No meal plan assigned</Text>
              <Text style={styles.emptyProgramAction}>Tap to assign</Text>
            </Pressable>
          )}
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.card}>
          {progressData.fitness.recent_sessions.length > 0 ? (
            progressData.fitness.recent_sessions.slice(0, 3).map((session, index) => (
              <View key={session.id} style={[styles.activityItem, index > 0 && styles.activityItemBorder]}>
                <View style={styles.activityIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{session.name}</Text>
                  <Text style={styles.activityMeta}>{formatDate(session.date)} • {session.duration_minutes} min</Text>
                </View>
                {session.rpe && (
                  <View style={styles.rpeBadge}>
                    <Text style={styles.rpeText}>RPE {session.rpe}</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>

        {/* Client Goals */}
        {progressData.client.goals && progressData.client.goals.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Goals</Text>
            <View style={styles.card}>
              {progressData.client.goals.map((goal, index) => (
                <View key={index} style={styles.goalItem}>
                  <Ionicons name="flag" size={18} color="#10b981" />
                  <Text style={styles.goalText}>{goal}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    );
  };

  const renderFitnessTab = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.tabContent}>
        {/* Fitness Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{progressData.fitness.workouts_completed}</Text>
            <Text style={styles.statBoxLabel}>Total Workouts</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{progressData.fitness.adherence_rate}%</Text>
            <Text style={styles.statBoxLabel}>Adherence</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{Math.round(progressData.fitness.total_workout_minutes / 60)}h</Text>
            <Text style={styles.statBoxLabel}>Total Time</Text>
          </View>
        </View>

        {/* Current Program */}
        {progressData.fitness.current_program && (
          <>
            <Text style={styles.sectionTitle}>Current Program</Text>
            <View style={styles.card}>
              <View style={styles.programHeader}>
                <Text style={styles.programTitle}>{progressData.fitness.current_program.name}</Text>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>{progressData.fitness.current_program.goal}</Text>
                </View>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(progressData.fitness.current_program.week_number / progressData.fitness.current_program.total_weeks) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Week {progressData.fitness.current_program.week_number} of {progressData.fitness.current_program.total_weeks}
              </Text>
            </View>
          </>
        )}

        {/* Weekly Progress Chart Placeholder */}
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        <View style={styles.card}>
          <View style={styles.chartPlaceholder}>
            {progressData.fitness.weekly_progress.map((week, index) => (
              <View key={index} style={styles.chartBar}>
                <View 
                  style={[
                    styles.chartBarFill, 
                    { height: `${Math.min((week.workouts / 5) * 100, 100)}%` }
                  ]} 
                />
                <Text style={styles.chartLabel}>{week.week}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Sessions */}
        <Text style={styles.sectionTitle}>Recent Sessions</Text>
        <View style={styles.card}>
          {progressData.fitness.recent_sessions.map((session, index) => (
            <View key={session.id} style={[styles.sessionItem, index > 0 && styles.sessionBorder]}>
              <View style={styles.sessionDate}>
                <Text style={styles.sessionDay}>{formatDay(session.date)}</Text>
                <Text style={styles.sessionDateNum}>{formatDateNum(session.date)}</Text>
              </View>
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionMeta}>
                  {session.exercises_completed} exercises • {session.duration_minutes} min
                </Text>
              </View>
              {session.rpe && (
                <View style={[styles.rpeBadge, getRpeColor(session.rpe)]}>
                  <Text style={styles.rpeText}>{session.rpe}/10</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleAssignWorkout}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Assign Program</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderNutritionTab = () => {
    if (!progressData) return null;
    
    return (
      <View style={styles.tabContent}>
        {/* Nutrition Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{progressData.nutrition.daily_average_calories}</Text>
            <Text style={styles.statBoxLabel}>Avg Calories</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{progressData.nutrition.goal_compliance_rate}%</Text>
            <Text style={styles.statBoxLabel}>Compliance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBoxValue}>{progressData.nutrition.meals_logged_today}</Text>
            <Text style={styles.statBoxLabel}>Meals Today</Text>
          </View>
        </View>

        {/* Macros Breakdown */}
        <Text style={styles.sectionTitle}>Macros (Daily Average)</Text>
        <View style={styles.card}>
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#3b82f6' }]}>
                <View 
                  style={[
                    styles.macroFill, 
                    { 
                      backgroundColor: '#60a5fa',
                      height: `${Math.min((progressData.nutrition.macros_average.protein / progressData.nutrition.macros_target.protein) * 100, 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue}>{progressData.nutrition.macros_average.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroTarget}>/ {progressData.nutrition.macros_target.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#f59e0b' }]}>
                <View 
                  style={[
                    styles.macroFill, 
                    { 
                      backgroundColor: '#fbbf24',
                      height: `${Math.min((progressData.nutrition.macros_average.carbs / progressData.nutrition.macros_target.carbs) * 100, 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue}>{progressData.nutrition.macros_average.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroTarget}>/ {progressData.nutrition.macros_target.carbs}g</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: '#ef4444' }]}>
                <View 
                  style={[
                    styles.macroFill, 
                    { 
                      backgroundColor: '#f87171',
                      height: `${Math.min((progressData.nutrition.macros_average.fat / progressData.nutrition.macros_target.fat) * 100, 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.macroValue}>{progressData.nutrition.macros_average.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroTarget}>/ {progressData.nutrition.macros_target.fat}g</Text>
            </View>
          </View>
        </View>

        {/* Water Intake */}
        <Text style={styles.sectionTitle}>Hydration</Text>
        <View style={styles.card}>
          <View style={styles.waterRow}>
            <Ionicons name="water" size={32} color="#3b82f6" />
            <View style={styles.waterInfo}>
              <Text style={styles.waterValue}>
                {(progressData.nutrition.water_intake_today / 1000).toFixed(1)}L
                <Text style={styles.waterGoal}> / {(progressData.nutrition.water_goal / 1000).toFixed(1)}L</Text>
              </Text>
              <View style={styles.waterBar}>
                <View 
                  style={[
                    styles.waterFill, 
                    { width: `${Math.min((progressData.nutrition.water_intake_today / progressData.nutrition.water_goal) * 100, 100)}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>

        {/* Recent Meals */}
        <Text style={styles.sectionTitle}>Recent Meals</Text>
        <View style={styles.card}>
          {progressData.nutrition.recent_meals.map((meal, index) => (
            <View key={meal.id} style={[styles.mealItem, index > 0 && styles.mealBorder]}>
              <View style={styles.mealIcon}>
                <Ionicons name={getMealIcon(meal.meal_type)} size={18} color="#6b7280" />
              </View>
              <View style={styles.mealInfo}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealMeta}>{meal.meal_type} • {formatTime(meal.logged_at)}</Text>
              </View>
              <Text style={styles.mealCalories}>{meal.calories} cal</Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={handleAssignMealPlan}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Assign Meal Plan</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderBodyTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.emptyState}>
        <Ionicons name="body-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyStateText}>Body metrics coming soon</Text>
        <Text style={styles.emptyStateSubtext}>Weight, measurements, and progress photos</Text>
      </View>
    </View>
  );

  // ============= HEALTH TAB (Platform-Specific) =============
  const renderHealthTab = () => {
    const platformName = 'Health Data';
    const platformIcon = 'heart-outline';
    const platformColor = '#4285f4';
    
    if (healthDataLoading) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={platformColor} />
            <Text style={styles.loadingText}>Loading {platformName} data...</Text>
          </View>
        </View>
      );
    }
    
    if (!deviceHealthData?.hasPermissions) {
      return (
        <View style={styles.tabContent}>
          <View style={styles.healthPermissionCard}>
            <LinearGradient 
              colors={['#4285f4', '#34a853']} 
              style={styles.healthPermissionGradient}
            >
              <Ionicons name={platformIcon as any} size={48} color="#fff" />
              <Text style={styles.healthPermissionTitle}>
                Connect to {platformName}
              </Text>
              <Text style={styles.healthPermissionSubtext}>
                Access steps, heart rate, sleep, and more from your device's health app
              </Text>
              <Pressable 
                style={styles.healthPermissionButton}
                onPress={loadDeviceHealthData}
              >
                <Text style={styles.healthPermissionButtonText}>Grant Access</Text>
              </Pressable>
            </LinearGradient>
          </View>
          
          {/* Platform Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Device Health Integration
            </Text>
            <Text style={styles.healthInfoText}>
              WiHY integrates with your device's health app to read your health and fitness data. This includes steps, distance, calories, heart rate, sleep, and weight data.
            </Text>
          </View>
        </View>
      );
    }
    
    const metrics = deviceHealthData.todayMetrics;
    const weekly = deviceHealthData.weeklyData;
    
    return (
      <View style={styles.tabContent}>
        {/* Platform Header */}
        <View style={styles.healthHeaderCard}>
          <LinearGradient 
            colors={['#4285f4', '#34a853']} 
            style={styles.healthHeaderGradient}
          >
            <View style={styles.healthHeaderRow}>
              <View style={styles.healthHeaderInfo}>
                <Ionicons name={platformIcon as any} size={24} color="#fff" />
                <Text style={styles.healthHeaderTitle}>{deviceHealthData.source}</Text>
              </View>
              {deviceHealthData.healthScore !== undefined && (
                <View style={styles.healthScoreBadge}>
                  <Text style={styles.healthScoreValue}>{deviceHealthData.healthScore}</Text>
                  <Text style={styles.healthScoreLabel}>Health Score</Text>
                </View>
              )}
            </View>
            <Text style={styles.healthHeaderSubtext}>
              Last synced: {deviceHealthData.lastSynced 
                ? new Date(deviceHealthData.lastSynced).toLocaleTimeString() 
                : 'Never'}
            </Text>
          </LinearGradient>
        </View>

        {/* Today's Metrics */}
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.healthMetricsGrid}>
          {/* Steps */}
          <View style={styles.healthMetricCard}>
            <Ionicons name="footsteps-outline" size={24} color="#3b82f6" />
            <Text style={styles.healthMetricValue}>
              {metrics?.steps?.toLocaleString() || '--'}
            </Text>
            <Text style={styles.healthMetricLabel}>Steps</Text>
          </View>
          
          {/* Distance */}
          <View style={styles.healthMetricCard}>
            <Ionicons name="map-outline" size={24} color="#10b981" />
            <Text style={styles.healthMetricValue}>
              {metrics?.distance?.toFixed(1) || '--'} km
            </Text>
            <Text style={styles.healthMetricLabel}>Distance</Text>
          </View>
          
          {/* Calories */}
          <View style={styles.healthMetricCard}>
            <Ionicons name="flame-outline" size={24} color="#f59e0b" />
            <Text style={styles.healthMetricValue}>
              {metrics?.calories?.toLocaleString() || '--'}
            </Text>
            <Text style={styles.healthMetricLabel}>Calories</Text>
          </View>
          
          {/* Active Minutes */}
          <View style={styles.healthMetricCard}>
            <Ionicons name="timer-outline" size={24} color="#8b5cf6" />
            <Text style={styles.healthMetricValue}>
              {metrics?.activeMinutes || '--'} min
            </Text>
            <Text style={styles.healthMetricLabel}>Active</Text>
          </View>
        </View>

        {/* Vitals */}
        <Text style={styles.sectionTitle}>Vitals</Text>
        <View style={styles.healthVitalsCard}>
          <View style={styles.healthVitalItem}>
            <View style={[styles.healthVitalIcon, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="heart" size={20} color="#ef4444" />
            </View>
            <View style={styles.healthVitalInfo}>
              <Text style={styles.healthVitalValue}>
                {metrics?.heartRate || '--'} bpm
              </Text>
              <Text style={styles.healthVitalLabel}>Heart Rate</Text>
            </View>
          </View>
          
          <View style={styles.healthVitalItem}>
            <View style={[styles.healthVitalIcon, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="moon" size={20} color="#3b82f6" />
            </View>
            <View style={styles.healthVitalInfo}>
              <Text style={styles.healthVitalValue}>
                {metrics?.sleepHours?.toFixed(1) || '--'} hrs
              </Text>
              <Text style={styles.healthVitalLabel}>Sleep</Text>
            </View>
          </View>
          
          <View style={styles.healthVitalItem}>
            <View style={[styles.healthVitalIcon, { backgroundColor: '#d1fae5' }]}>
              <Ionicons name="scale" size={20} color="#10b981" />
            </View>
            <View style={styles.healthVitalInfo}>
              <Text style={styles.healthVitalValue}>
                {metrics?.weight || '--'} kg
              </Text>
              <Text style={styles.healthVitalLabel}>Weight</Text>
            </View>
          </View>
          
          <View style={styles.healthVitalItem}>
            <View style={[styles.healthVitalIcon, { backgroundColor: theme.colors.background }]}>
              <Ionicons name="water" size={20} color="#0ea5e9" />
            </View>
            <View style={styles.healthVitalInfo}>
              <Text style={styles.healthVitalValue}>
                {metrics?.hydration?.toFixed(1) || '--'} L
              </Text>
              <Text style={styles.healthVitalLabel}>Hydration</Text>
            </View>
          </View>
        </View>

        {/* Weekly Summary */}
        {weekly && (
          <>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            <View style={styles.card}>
              <View style={styles.weeklyStatsRow}>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>
                    {weekly.averages.steps.toLocaleString()}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>Avg Steps</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>
                    {weekly.averages.calories.toLocaleString()}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>Avg Calories</Text>
                </View>
                <View style={styles.weeklyStat}>
                  <Text style={styles.weeklyStatValue}>
                    {weekly.averages.activeMinutes}
                  </Text>
                  <Text style={styles.weeklyStatLabel}>Avg Active Min</Text>
                </View>
              </View>
              
              {/* Trend Indicators */}
              <View style={styles.trendsRow}>
                <View style={styles.trendItem}>
                  <Ionicons 
                    name={weekly.trends.steps.trend === 'up' ? 'trending-up' : weekly.trends.steps.trend === 'down' ? 'trending-down' : 'remove'} 
                    size={16} 
                    color={weekly.trends.steps.trend === 'up' ? '#10b981' : weekly.trends.steps.trend === 'down' ? '#ef4444' : '#6b7280'} 
                  />
                  <Text style={styles.trendText}>
                    {weekly.trends.steps.change > 0 ? '+' : ''}{weekly.trends.steps.change.toFixed(0)}% steps
                  </Text>
                </View>
                <View style={styles.trendItem}>
                  <Ionicons 
                    name={weekly.trends.calories.trend === 'up' ? 'trending-up' : weekly.trends.calories.trend === 'down' ? 'trending-down' : 'remove'} 
                    size={16} 
                    color={weekly.trends.calories.trend === 'up' ? '#10b981' : weekly.trends.calories.trend === 'down' ? '#ef4444' : '#6b7280'} 
                  />
                  <Text style={styles.trendText}>
                    {weekly.trends.calories.change > 0 ? '+' : ''}{weekly.trends.calories.change.toFixed(0)}% cal
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* Refresh Button */}
        <Pressable style={styles.refreshHealthButton} onPress={loadDeviceHealthData}>
          <Ionicons name="refresh" size={18} color="#3b82f6" />
          <Text style={styles.refreshHealthText}>Refresh Health Data</Text>
        </Pressable>
      </View>
    );
  };

  const renderNotesTab = () => {
    const getCategoryColor = (category: NoteCategory) => {
      switch (category) {
        case 'progress': return '#10b981';
        case 'fitness': return '#3b82f6';
        case 'nutrition': return '#f59e0b';
        case 'health': return '#ef4444';
        default: return '#6b7280';
      }
    };

    const getCategoryIcon = (category: NoteCategory) => {
      switch (category) {
        case 'progress': return 'trending-up';
        case 'fitness': return 'fitness';
        case 'nutrition': return 'restaurant';
        case 'health': return 'heart';
        default: return 'chatbubble';
      }
    };

    return (
      <View style={styles.tabContent}>
        {/* Add Note Button */}
        <View style={styles.card}>
          <Pressable style={styles.addNoteButton} onPress={() => setShowAddNoteModal(true)}>
            <Ionicons name="add" size={20} color="#3b82f6" />
            <Text style={styles.addNoteText}>Add Coach Note</Text>
          </Pressable>
        </View>

        {/* Category Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
          {NOTE_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.key}
              style={[
                styles.categoryChip,
                noteCategory === cat.key && styles.categoryChipActive,
              ]}
              onPress={() => setNoteCategory(cat.key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={noteCategory === cat.key ? '#fff' : '#6b7280'}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  noteCategory === cat.key && styles.categoryChipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Notes List */}
        {notesLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingStateText}>Loading notes...</Text>
          </View>
        ) : clientNotes.length > 0 ? (
          <View style={styles.notesContainer}>
            {clientNotes.map((note) => (
              <View key={note.note_id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <View style={[styles.noteCategoryBadge, { backgroundColor: getCategoryColor(note.category) + '20' }]}>
                    <Ionicons
                      name={getCategoryIcon(note.category) as any}
                      size={12}
                      color={getCategoryColor(note.category)}
                    />
                    <Text style={[styles.noteCategoryText, { color: getCategoryColor(note.category) }]}>
                      {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                    </Text>
                  </View>
                  <Pressable onPress={() => handleDeleteNote(note.note_id)}>
                    <Ionicons name="trash-outline" size={18} color="#9ca3af" />
                  </Pressable>
                </View>
                <Text style={styles.noteContent}>{note.content}</Text>
                <Text style={styles.noteDate}>{formatDate(note.created_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>Add notes about client progress and milestones</Text>
          </View>
        )}

        {/* Add Note Modal */}
        {showAddNoteModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Note</Text>
                <Pressable onPress={() => setShowAddNoteModal(false)}>
                  <Ionicons name="close" size={24} color="#6b7280" />
                </Pressable>
              </View>
              
              {/* Category Selection */}
              <Text style={styles.modalLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalCategoryRow}>
                {NOTE_CATEGORIES.filter(c => c.key !== 'all').map((cat) => (
                  <Pressable
                    key={cat.key}
                    style={[
                      styles.categoryChip,
                      newNoteCategory === cat.key && styles.categoryChipActive,
                    ]}
                    onPress={() => setNewNoteCategory(cat.key as NoteCategory)}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={14}
                      color={newNoteCategory === cat.key ? '#fff' : '#6b7280'}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        newNoteCategory === cat.key && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              
              {/* Note Input */}
              <Text style={styles.modalLabel}>Note</Text>
              <View style={styles.noteInputContainer}>
                <Ionicons name="create-outline" size={20} color="#9ca3af" style={styles.noteInputIcon} />
                <Text
                  style={styles.noteInput}
                  numberOfLines={5}
                  onPress={() => {
                    Alert.prompt(
                      'Enter Note',
                      'Write your note below:',
                      (text) => setNewNoteText(text || ''),
                      'plain-text',
                      newNoteText
                    );
                  }}
                >
                  {newNoteText || 'Tap to enter note...'}
                </Text>
              </View>
              
              {/* Save Button */}
              <Pressable
                style={[styles.saveNoteButton, !newNoteText.trim() && styles.saveNoteButtonDisabled]}
                onPress={handleAddNote}
                disabled={!newNoteText.trim()}
              >
                <Text style={styles.saveNoteButtonText}>Save Note</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'fitness': return renderFitnessTab();
      case 'nutrition': return renderNutritionTab();
      case 'health': return renderHealthTab();
      case 'body': return renderBodyTab();
      case 'notes': return renderNotesTab();
      default: return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading client progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadProgressData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <WebPageWrapper activeTab="health">
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Status bar area - solid color */}
        <View style={{ height: insets.top, backgroundColor: '#3b82f6' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.collapsibleHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.headerContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            {/* Back Button */}
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </Pressable>
            <Text style={styles.headerTitle}>{progressData?.client.name || clientName || 'Client Progress'}</Text>
            <Text style={styles.headerSubtitle}>{progressData?.client.email || 'Detailed progress view'}</Text>
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
          {/* Tab Bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.id ? '#3b82f6' : '#6b7280'}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Tab Content */}
          {renderTabContent()}
          
          {/* Bottom spacing */}
          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      </View>
    </WebPageWrapper>
  );
}

// ============= HELPER FUNCTIONS =============

function calculateStreak(sessions: any[]): number {
  // Simple streak calculation
  if (!sessions || sessions.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];
    const hasSession = sessions.some(s => s.date?.startsWith(dateStr) || s.completed_at?.startsWith(dateStr));
    if (hasSession) streak++;
    else if (i > 0) break;
  }
  return streak;
}

function calculateTotalMinutes(sessions: any[]): number {
  if (!sessions) return 0;
  return sessions.reduce((sum, s) => sum + (s.duration_minutes || 45), 0);
}

function generateWeeklyProgress(sessions: any[]): Array<{ week: string; workouts: number; minutes: number }> {
  const weeks = ['W1', 'W2', 'W3', 'W4'];
  
  // Calculate actual weekly data from sessions
  const now = new Date();
  return weeks.map((week, i) => {
    // Calculate date range for each week (most recent to oldest)
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - (i * 7));
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 7);
    
    // Filter sessions for this week
    const weekSessions = sessions.filter(s => {
      const sessionDate = new Date(s.date || s.completed_at || '');
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });
    
    return {
      week,
      workouts: weekSessions.length,
      minutes: weekSessions.reduce((sum, s) => sum + (s.duration_minutes || 45), 0),
    };
  });
}

function generateWeeklyCalories(): Array<{ day: string; calories: number; goal: number }> {
  // Note: Without meal logging data, showing default goals
  // Real data should come from nutrition API when available
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map(day => ({
    day,
    calories: 0, // Will show "No data" state in UI
    goal: 2000,
  }));
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr?.startsWith(today);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

function formatDateNum(dateStr: string): string {
  const date = new Date(dateStr);
  return date.getDate().toString();
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function getMealIcon(mealType: string): any {
  switch (mealType.toLowerCase()) {
    case 'breakfast': return 'sunny';
    case 'lunch': return 'partly-sunny';
    case 'dinner': return 'moon';
    case 'snack': return 'cafe';
    default: return 'restaurant';
  }
}

function getRpeColor(rpe: number): object {
  if (rpe <= 5) return { backgroundColor: '#d1fae5' };
  if (rpe <= 7) return { backgroundColor: '#fef3c7' };
  return { backgroundColor: '#fee2e2' };
}

// ============= STYLES =============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#e0f2fe', // theme.colors.background
  },
  collapsibleHeader: {
    backgroundColor: '#3b82f6',
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
  backButton: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -12,
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    // color: theme.colors.textSecondary
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  tabBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
  },
  tabActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    // color: theme.colors.textSecondary
  },
  tabTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    // color: theme.colors.text
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '700',
    // color: theme.colors.text
  },
  statBoxLabel: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  programIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  programInfo: {
    flex: 1,
    marginLeft: 12,
  },
  programName: {
    fontSize: 15,
    fontWeight: '600',
    // color: theme.colors.text
  },
  programMeta: {
    fontSize: 13,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  emptyProgram: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyProgramText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  emptyProgramAction: {
    fontSize: 13,
    color: '#3b82f6',
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    // color: theme.colors.text
  },
  activityMeta: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  rpeBadge: {
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rpeText: {
    fontSize: 11,
    fontWeight: '600',
    // color: theme.colors.textSecondary
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  goalText: {
    fontSize: 14,
    // color: theme.colors.text
    marginLeft: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    padding: 16,
  },
  programHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.text
  },
  goalBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b82f6',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 8,
    textAlign: 'center',
  },
  chartPlaceholder: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 16,
  },
  chartBar: {
    alignItems: 'center',
    width: 40,
    height: 100,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    width: 24,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: 11,
    // color: theme.colors.textSecondary
    marginTop: 8,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sessionDate: {
    alignItems: 'center',
    width: 44,
  },
  sessionDay: {
    fontSize: 11,
    // color: theme.colors.textSecondary
  },
  sessionDateNum: {
    fontSize: 18,
    fontWeight: '700',
    // color: theme.colors.text
  },
  sessionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '500',
    // color: theme.colors.text
  },
  sessionMeta: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  actionRow: {
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroBar: {
    width: 40,
    height: 80,
    borderRadius: 20,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  macroFill: {
    width: '100%',
    borderRadius: 20,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    // color: theme.colors.text
    marginTop: 8,
  },
  macroLabel: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  macroTarget: {
    fontSize: 11,
    color: '#9ca3af',
  },
  waterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waterInfo: {
    flex: 1,
    marginLeft: 16,
  },
  waterValue: {
    fontSize: 20,
    fontWeight: '700',
    // color: theme.colors.text
  },
  waterGoal: {
    fontSize: 14,
    fontWeight: '400',
    // color: theme.colors.textSecondary
  },
  waterBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  waterFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mealBorder: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  mealIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '500',
    // color: theme.colors.text
  },
  mealMeta: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 2,
  },
  mealCalories: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.textSecondary
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.textSecondary
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 4,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addNoteText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
  },
  // ============= HEALTH TAB STYLES =============
  healthPermissionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  healthPermissionGradient: {
    padding: 24,
    alignItems: 'center',
  },
  healthPermissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 16,
    textAlign: 'center',
  },
  healthPermissionSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  healthPermissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  healthPermissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color: theme.colors.text
  },
  healthInfoText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    lineHeight: 20,
  },
  healthHeaderCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  healthHeaderGradient: {
    padding: 16,
  },
  healthHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  healthHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  healthScoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  healthScoreValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  healthScoreLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  healthHeaderSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
  },
  healthMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  healthMetricCard: {
    flex: 1,
    minWidth: 140,
    maxWidth: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  healthMetricValue: {
    fontSize: 24,
    fontWeight: '700',
    // color: theme.colors.text
    marginTop: 8,
  },
  healthMetricLabel: {
    fontSize: 12,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  healthVitalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  healthVitalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  healthVitalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthVitalInfo: {
    marginLeft: 12,
    flex: 1,
  },
  healthVitalValue: {
    fontSize: 18,
    fontWeight: '600',
    // color: theme.colors.text
  },
  healthVitalLabel: {
    fontSize: 13,
    // color: theme.colors.textSecondary
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weeklyStat: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: '700',
    // color: theme.colors.text
  },
  weeklyStatLabel: {
    fontSize: 11,
    // color: theme.colors.textSecondary
    marginTop: 4,
  },
  trendsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 13,
    // color: theme.colors.textSecondary
  },
  refreshHealthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  refreshHealthText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginLeft: 8,
  },
  // ============= NOTES TAB STYLES =============
  categoryFilter: {
    marginVertical: 12,
    flexGrow: 0,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // Use theme.colors.background
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    // color: theme.colors.textSecondary
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  notesContainer: {
    gap: 12,
  },
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  noteCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  noteCategoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteContent: {
    fontSize: 14,
    // color: theme.colors.text
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 12,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingStateText: {
    fontSize: 14,
    // color: theme.colors.textSecondary
    marginTop: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    // color: theme.colors.text
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    // color: theme.colors.text
    marginBottom: 8,
  },
  modalCategoryRow: {
    marginBottom: 16,
    flexGrow: 0,
  },
  noteInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    // backgroundColor: '#f9fafb', // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noteInputIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  noteInput: {
    flex: 1,
    fontSize: 15,
    // color: theme.colors.text
    minHeight: 100,
    lineHeight: 22,
    outlineStyle: 'none' as any,
  },
  saveNoteButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveNoteButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  saveNoteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
