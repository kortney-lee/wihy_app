import React, { useState, useMemo, useEffect, useCallback, memo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/design-tokens';
import { dashboardColors, GradientDashboardHeader } from '../components/shared';
import { 
  fitnessService, 
  DailyWorkout, 
  WorkoutSession, 
  Exercise, 
  weatherService, 
  WeatherData,
  CreateProgramRequest,
  CreateProgramResponse,
  ProgramWorkout,
  CompleteWorkoutRequest,
  TodayWorkoutSession,
  WarmupExercise,
  MainExercise,
  CooldownStretch,
  QuickWorkoutRequest,
  QuickWorkoutResponse,
} from '../services';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { UpgradePrompt } from '../components/UpgradePrompt';
import { useFeatureAccess } from '../hooks/usePaywall';
import {
  FITNESS_LEVELS,
  BODY_PARTS,
  EQUIPMENT_OPTIONS,
  PERFORMANCE_GOALS,
  BODY_GOALS,
  QUICK_GOALS,
  PERFORMANCE_CATEGORIES,
  GOAL_CATEGORIES,
} from './fitness/constants';
import { FitnessLevelSelection } from './fitness/FitnessLevelSelection';
import { GoalSelection } from './fitness/GoalSelectionV2';
import { ExpandedSections } from './fitness/types';
import { styles } from './fitness/FitnessDashboardStyles';

// Progressive Overload type
interface ProgressiveOverload {
  exercise_id: string;
  previous_weight: number;
  recommended_weight: number;
  increase_percentage: number;
  reason: string;
}

// Program Progress type for tracking workout completion
interface ProgramProgress {
  program_id: string;
  program_name: string;
  current_week: number;
  current_day: number;
  total_weeks: number;
  days_per_week: number;
  completed_workouts: number;
  total_workouts: number;
  completion_percentage: number;
  streak_days: number;
  next_workout_date: string;
  is_rest_day: boolean;
  progression_note?: string;
  progressive_overload?: ProgressiveOverload[];
}

// Type Definitions
interface Phase {
  id: string;
  name: string;
}

interface Level {
  id: string;
  label: string;
}

interface Day {
  id: string;
  label: string;
}

interface FitnessLoad {
  CARDIO?: number;
  STRENGTH?: number;
  MOBILITY?: number;
  FLEXIBILITY?: number;
}

interface MuscleLoad {
  [key: string]: number;
}

interface ExerciseMeta {
  id: string;
  name: string;
  equipment: string;
  fitnessLoad: FitnessLoad;
  muscleLoad: MuscleLoad;
}

interface Prescription {
  sets: number;
  intensityLabel: string;
  duration?: string;
  rest?: string;
}

interface ExerciseRowView {
  meta: ExerciseMeta;
  prescription: Prescription;
}

interface FitnessDashboardModel {
  title: string;
  subtitle: string;
  phases: Phase[];
  levels: Level[];
  days: Day[];
  defaultPhaseId?: string;
  defaultLevelId?: string;
  defaultDayId?: string;
  variants: { [key: string]: ExerciseRowView[] };
}

interface SessionParams {
  phaseId: string;
  levelId: string;
  dayId: string;
}

interface FitnessDashboardProps {
  data?: FitnessDashboardModel;
  onStartSession?: (params: SessionParams) => void;
}

// Sample data for demonstration
const defaultData: FitnessDashboardModel = {
  title: 'Your Personalized Workout',
  subtitle: 'Science-backed exercises tailored to your fitness level',
  phases: [
    { id: 'foundation', name: 'Foundation Building' },
    { id: 'strength', name: 'Strength Focus' },
    { id: 'endurance', name: 'Endurance Training' },
    { id: 'hiit', name: 'HIIT Workouts' },
  ],
  levels: [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
  ],
  days: [
    { id: 'day1', label: 'Day 1' },
    { id: 'day2', label: 'Day 2' },
    { id: 'day3', label: 'Day 3' },
    { id: 'day4', label: 'Day 4' },
    { id: 'day5', label: 'Day 5' },
  ],
  defaultPhaseId: 'foundation',
  defaultLevelId: 'beginner',
  defaultDayId: 'day1',
  variants: {
    'foundation-beginner-day1': [
      {
        meta: {
          id: 'pushup',
          name: 'Push-ups',
          equipment: 'NONE',
          fitnessLoad: { STRENGTH: 2, CARDIO: 1 },
          muscleLoad: { chest: 3, shoulders: 2, triceps: 2 },
        },
        prescription: {
          sets: 3,
          intensityLabel: '8-12 reps',
          rest: '60 seconds',
        },
      },
      {
        meta: {
          id: 'squat',
          name: 'Bodyweight Squats',
          equipment: 'NONE',
          fitnessLoad: { STRENGTH: 2, CARDIO: 1 },
          muscleLoad: { legs: 3, glutes: 3, core: 1 },
        },
        prescription: {
          sets: 3,
          intensityLabel: '10-15 reps',
          rest: '60 seconds',
        },
      },
    ],
  },
};

// Exercise Card Component
const ExerciseCard: React.FC<{
  exercise: ExerciseRowView;
  simplified?: boolean;
  borderColor?: string;
}> = ({ exercise, simplified = true, borderColor = '#4cbb17' }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.exerciseCard, { borderLeftColor: borderColor }]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      {/* Exercise Header */}
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{exercise.meta.name}</Text>
          <Text style={styles.exerciseEquipment}>
            {exercise.meta.equipment === 'NONE' ? 'Bodyweight' : exercise.meta.equipment}
          </Text>
        </View>
        <View style={styles.setsContainer}>
          <Text style={styles.setsText}>{exercise.prescription.sets} sets</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>
      </View>

      {/* Intensity */}
      <Text style={styles.intensityText}>
        {exercise.prescription.intensityLabel}
      </Text>

      {/* Load Indicators */}
      <View style={styles.loadContainer}>
        <View style={[styles.loadBadge, { backgroundColor: '#ef4444' }]}>
          <Text style={styles.loadText}>
            Cardio {exercise.meta.fitnessLoad.CARDIO || 0}/3
          </Text>
        </View>
        <View style={[styles.loadBadge, { backgroundColor: '#8b5cf6' }]}>
          <Text style={styles.loadText}>
            Strength {exercise.meta.fitnessLoad.STRENGTH || 0}/3
          </Text>
        </View>
        {!simplified && (
          <View style={[styles.loadBadge, { backgroundColor: '#f59e0b' }]}>
            <Text style={styles.loadText}>
              Mobility {exercise.meta.fitnessLoad.MOBILITY || 0}/3
            </Text>
          </View>
        )}
      </View>

      {/* Expanded Details */}
      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.expandedTitle}>Exercise Details</Text>
          {exercise.prescription.rest && (
            <Text style={styles.detailText}>Rest: {exercise.prescription.rest}</Text>
          )}
          {exercise.prescription.duration && (
            <Text style={styles.detailText}>Duration: {exercise.prescription.duration}</Text>
          )}
          <Text style={styles.detailText}>
            Primary muscles: {Object.keys(exercise.meta.muscleLoad).join(', ')}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Main FitnessDashboard Component
const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  data = defaultData,
  onStartSession,
}) => {
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Paywall check
  const hasWorkoutAccess = useFeatureAccess('workouts');
  const [showUpgrade, setShowUpgrade] = useState(false);
  
  // Collapsing header animation
  const scrollY = useRef(new Animated.Value(0)).current;
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
  
  // API State
  const [workout, setWorkout] = useState<DailyWorkout | null>(null);
  const [todayWorkouts, setTodayWorkouts] = useState<DailyWorkout[]>([]); // Workouts for today only
  const [scheduledWorkouts, setScheduledWorkouts] = useState<{date: Date, workout: any, programId: string, programName: string}[]>([]); // All scheduled workouts for calendar
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [programProgress, setProgramProgress] = useState<ProgramProgress | null>(null);
  
  // User Programs State - stores all user's saved programs from API
  const [userPrograms, setUserPrograms] = useState<any[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);
  const [deletingProgramId, setDeletingProgramId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Calendar State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // UI State
  const [phaseId, setPhaseId] = useState(data.defaultPhaseId || data.phases[0]?.id || '');
  const [levelId, setLevelId] = useState(data.defaultLevelId || data.levels[0]?.id || '');
  const [dayId, setDayId] = useState(data.defaultDayId || data.days[0]?.id || '');
  const [showGuide, setShowGuide] = useState(true);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // NEW: Goal Selection State
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [modalStep, setModalStep] = useState<'goals' | 'program' | 'preview'>('goals');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [workoutDuration, setWorkoutDuration] = useState(30);
  const [programDays, setProgramDays] = useState<number | null>(null);
  const [goalText, setGoalText] = useState('');
  const [isQuickWorkout, setIsQuickWorkout] = useState(false); // Quick workout = single session, not a multi-week program
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [lastGeneratedGoals, setLastGeneratedGoals] = useState<string>(''); // Track goals hash to avoid re-generating
  const [selectedGoalCategory, setSelectedGoalCategory] = useState('all');
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(0); // Index of selected workout day
  const [selectedStartDayOffset, setSelectedStartDayOffset] = useState(0); // Days from today to start
  
  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    performance: false,
    body: false,
    quick: false,
    bodyAreas: false,
    equipment: false,
    duration: true, // Duration stays open by default
  });
  
  // Exercise Execution State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState<any[]>([]);
  const [restTimerActive, setRestTimerActive] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [loggedReps, setLoggedReps] = useState('');
  const [loggedWeight, setLoggedWeight] = useState('');
  const [showWorkoutCompleteModal, setShowWorkoutCompleteModal] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState<{
    duration: string;
    setsCompleted: number;
    calories: number;
    achievements: Array<{ icon: string; title: string; description: string; color: string }>;
  } | null>(null);
  
  // Workout History State - track user's completed workouts
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const { width } = Dimensions.get('window');
  const isTablet = width > 768;

  // Use imported constants (aliased for backwards compatibility)
  const bodyParts = BODY_PARTS;
  const equipmentOptions = EQUIPMENT_OPTIONS;
  const performanceGoals = PERFORMANCE_GOALS;
  const bodyGoals = BODY_GOALS;
  const quickGoals = QUICK_GOALS;
  const performanceCategories = PERFORMANCE_CATEGORIES;
  const goalCategories = GOAL_CATEGORIES;
  const fitnessLevels = FITNESS_LEVELS;

  // State for selected goals - NOW SUPPORTS MULTIPLE SELECTIONS
  const [selectedPerformanceGoals, setSelectedPerformanceGoals] = useState<string[]>([]);
  const [selectedBodyGoals, setSelectedBodyGoals] = useState<string[]>([]);
  const [performanceCategory, setPerformanceCategory] = useState('all');
  
  // Legacy single selection state for backwards compatibility
  const selectedPerformanceGoal = selectedPerformanceGoals[0] || null;
  const selectedBodyGoal = selectedBodyGoals[0] || null;

  // Load today's workout, user's programs, and history on mount
  useEffect(() => {
    loadTodayWorkout();
    loadUserPrograms();
    loadWorkoutHistory();
  }, []);

  // Load user's saved programs from API
  const loadUserPrograms = async (forceRefresh = false) => {
    try {
      setProgramsLoading(true);
      const authToken = await authService.getAccessToken();
      const response = await fitnessService.listPrograms(userId, authToken || undefined);
      console.log('[FitnessDashboard] Loaded user programs:', response.programs?.length);
      
      // Filter to show only active programs, sort by most recent
      const activePrograms = (response.programs || [])
        .filter((p: any) => p.status === 'ACTIVE')
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setUserPrograms(activePrograms);
      
      // If user has programs, populate calendar with their scheduled workouts
      if (activePrograms.length > 0) {
        await loadProgramsToCalendar(activePrograms, forceRefresh);
      }
    } catch (err) {
      console.error('[FitnessDashboard] Failed to load user programs:', err);
    } finally {
      setProgramsLoading(false);
    }
  };

  // Cache keys and duration
  const CACHE_KEY_PREFIX = '@wihy_program_workouts_';
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes cache
  
  // Get cached program workouts
  const getCachedProgramWorkouts = async (programId: string): Promise<{workouts: any[], timestamp: number} | null> => {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_KEY_PREFIX}${programId}`);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        if (age < CACHE_DURATION_MS) {
          return data;
        }
      }
      return null;
    } catch (err) {
      console.error('[FitnessDashboard] Cache read error:', err);
      return null;
    }
  };
  
  // Set cached program workouts
  const setCachedProgramWorkouts = async (programId: string, workouts: any[]) => {
    try {
      await AsyncStorage.setItem(`${CACHE_KEY_PREFIX}${programId}`, JSON.stringify({
        workouts,
        timestamp: Date.now()
      }));
    } catch (err) {
      console.error('[FitnessDashboard] Cache write error:', err);
    }
  };
  
  // Clear cache for a specific program (call after program update/delete)
  const clearProgramCache = async (programId: string) => {
    try {
      await AsyncStorage.removeItem(`${CACHE_KEY_PREFIX}${programId}`);
    } catch (err) {
      console.error('[FitnessDashboard] Cache clear error:', err);
    }
  };

  // Load scheduled workouts from all active programs to calendar
  const loadProgramsToCalendar = async (programs: any[], forceRefresh = false) => {
    try {
      const authToken = await authService.getAccessToken();
      const allScheduledWorkouts: {date: Date, workout: any, programId: string, programName: string}[] = [];
      
      // Fetch workouts in parallel with caching
      const workoutPromises = programs.map(async (program) => {
        // Check cache first (unless force refresh)
        if (!forceRefresh) {
          const cached = await getCachedProgramWorkouts(program.programId);
          if (cached) {
            console.log(`[FitnessDashboard] Using cached workouts for ${program.programId}`);
            return { program, workouts: cached.workouts, fromCache: true };
          }
        }
        
        // Fetch from API
        const workoutsResponse = await fitnessService.getProgramWorkouts(
          program.programId,
          {},
          authToken || undefined
        );
        
        // Cache the response
        if (workoutsResponse.workouts) {
          await setCachedProgramWorkouts(program.programId, workoutsResponse.workouts);
        }
        
        return { program, workouts: workoutsResponse.workouts || [], fromCache: false };
      });
      
      const results = await Promise.all(workoutPromises);
      
      // Process results
      let cachedCount = 0;
      let fetchedCount = 0;
      for (const { program, workouts, fromCache } of results) {
        if (fromCache) cachedCount++;
        else fetchedCount++;
        
        for (const workout of workouts) {
          if (workout.scheduled_date) {
            allScheduledWorkouts.push({
              date: new Date(workout.scheduled_date),
              workout: workout,
              programId: program.programId,
              programName: program.name
            });
          }
        }
      }
      
      setScheduledWorkouts(allScheduledWorkouts);
      console.log(`[FitnessDashboard] Loaded ${allScheduledWorkouts.length} scheduled workouts (${cachedCount} from cache, ${fetchedCount} fetched)`);
    } catch (err) {
      console.error('[FitnessDashboard] Failed to load program workouts to calendar:', err);
    }
  };

  // Load workout history for trends and completed workouts
  const loadWorkoutHistory = async () => {
    try {
      setHistoryLoading(true);
      const history = await fitnessService.getHistory(userId, 30); // Last 30 workouts
      setWorkoutHistory(history.workouts || history.data || []);
      console.log('[FitnessDashboard] Loaded workout history:', history);
    } catch (err) {
      console.error('[FitnessDashboard] Failed to load workout history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load specific workout details from API
  const loadWorkoutDetails = async (programId: string, workoutId: string) => {
    try {
      const authToken = await authService.getAccessToken();
      const workoutDetails = await fitnessService.getWorkoutDetails(
        programId,
        workoutId,
        authToken || undefined
      );
      console.log('[FitnessDashboard] Loaded workout details:', workoutDetails);
      return workoutDetails;
    } catch (err) {
      console.error('[FitnessDashboard] Failed to load workout details:', err);
      return null;
    }
  };

  // Delete a program - show confirmation modal
  const deleteProgram = (programId: string, programName?: string) => {
    setProgramToDelete({ id: programId, name: programName || 'this program' });
    setShowDeleteModal(true);
  };

  // Actually perform the delete
  const confirmDeleteProgram = async () => {
    if (!programToDelete) return;
    
    try {
      setDeletingProgramId(programToDelete.id);
      const authToken = await authService.getAccessToken();
      await fitnessService.deleteProgram(programToDelete.id, authToken || undefined);
      
      // Clear cache for deleted program
      await clearProgramCache(programToDelete.id);
      
      // Remove from local state
      setUserPrograms(prev => prev.filter(p => p.programId !== programToDelete.id));
      
      // Remove workouts from calendar
      setScheduledWorkouts(prev => prev.filter(sw => sw.programId !== programToDelete.id));
      
      // If this was the current workout, clear it
      if (workout && generatedProgram?.program_id === programToDelete.id) {
        setWorkout(null);
        setGeneratedProgram(null);
      }
      
      setShowDeleteModal(false);
      setProgramToDelete(null);
    } catch (err) {
      console.error('[FitnessDashboard] Failed to delete program:', err);
      Alert.alert('Error', 'Failed to delete program. Please try again.');
    } finally {
      setDeletingProgramId(null);
    }
  };

  // Update displayed workouts when selected date changes
  // Uses local cached data first, then optionally fetches detailed workout info
  useEffect(() => {
    const updateWorkoutsForDate = async () => {
      if (scheduledWorkouts.length > 0) {
        const selectedDateStr = selectedDate.toDateString();
        const workoutsForDate = scheduledWorkouts
          .filter(sw => sw.date.toDateString() === selectedDateStr)
          .filter(sw => !sw.workout.is_rest_day);
        
        // Map cached workout data for quick display
        const mappedWorkouts = workoutsForDate.map((sw, idx) => ({
          workout_id: `${sw.workout.workout_id}_${sw.date.toISOString().split('T')[0]}_${idx}`,
          original_workout_id: sw.workout.workout_id, // Keep original for API calls
          date: sw.date.toISOString(),
          day_of_week: sw.date.toLocaleDateString('en-US', { weekday: 'long' }),
          phase: sw.workout.name || 'Custom Workout',
          level: sw.workout.level || 'intermediate',
          stretches: [],
          estimated_duration_min: sw.workout.estimated_duration || 30,
          programId: sw.programId, // Include for API calls
          programName: sw.programName,
          exercises: sw.workout.exercises?.map((ex: any) => ({
            exercise_id: ex.exercise_id || ex.name,
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps?.toString() || '10-12',
            intensity: ex.intensity || 'Moderate',
            rest_sec: ex.rest_seconds || 60,
            muscle_group: ex.target_muscle || 'Mixed',
            equipment: ex.equipment?.[0] || 'Bodyweight',
            instructions: ex.instructions || []
          })) || []
        }));
        
        setTodayWorkouts(mappedWorkouts);
        
        // If workout has no exercises in cache, fetch full details from API
        if (mappedWorkouts.length > 0) {
          const firstWorkout = mappedWorkouts[0];
          // Use original_workout_id for API calls (without date suffix)
          const apiWorkoutId = (firstWorkout as any).original_workout_id || firstWorkout.workout_id;
          if (firstWorkout.exercises.length === 0 && firstWorkout.programId && apiWorkoutId) {
            console.log('[FitnessDashboard] Fetching full workout details from API...');
            const details = await loadWorkoutDetails(firstWorkout.programId, apiWorkoutId);
            if (details && details.exercises) {
              const detailedWorkout = {
                ...firstWorkout,
                exercises: details.exercises.map((ex: any) => ({
                  exercise_id: ex.exercise_id || ex.name,
                  name: ex.name,
                  sets: ex.sets || 3,
                  reps: ex.reps?.toString() || '10-12',
                  intensity: ex.intensity || 'Moderate',
                  rest_sec: ex.rest_seconds || 60,
                  muscle_group: ex.target_muscle || 'Mixed',
                  equipment: ex.equipment?.[0] || 'Bodyweight',
                  instructions: ex.instructions || []
                }))
              };
              setWorkout(detailedWorkout);
              return;
            }
          }
          setWorkout(firstWorkout);
        }
      }
    };
    
    updateWorkoutsForDate();
  }, [selectedDate, scheduledWorkouts]);

  const loadTodayWorkout = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fitnessService.getTodayWorkout(userId);
      setWorkout(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load workout';
      setError(message);
      // Don't show alert on initial load failure - user can generate a workout
      console.log('Workout load error:', message);
    } finally {
      setLoading(false);
    }
  };

  const loadWeatherData = async () => {
    try {
      setWeatherLoading(true);
      const data = await weatherService.getCompleteWeatherData();
      setWeather(data);
      setShowWeather(true);
    } catch (err) {
      console.error('Failed to load weather:', err);
      Alert.alert('Weather Unavailable', 'Could not fetch current weather conditions');
    } finally {
      setWeatherLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Force refresh from API, bypassing cache
    await Promise.all([
      loadTodayWorkout(),
      loadUserPrograms(true), // forceRefresh = true
      loadWorkoutHistory(),
      showWeather ? loadWeatherData() : Promise.resolve(),
    ]);
    setRefreshing(false);
  };

  // Toggle body part selection
  const toggleBodyPart = (bodyPartId: string) => {
    setSelectedBodyParts(prev =>
      prev.includes(bodyPartId)
        ? prev.filter(bp => bp !== bodyPartId)
        : [...prev, bodyPartId]
    );
  };

  // Toggle equipment selection
  const toggleEquipment = (equipmentId: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipmentId)
        ? prev.filter(eq => eq !== equipmentId)
        : [...prev, equipmentId]
    );
  };

  // Select quick workout type - generates a single workout, not a multi-week program
  const selectQuickGoal = (goal: typeof quickGoals[0]) => {
    console.log('[FitnessDashboard] Selected quick workout:', goal.label, goal);
    setSelectedBodyParts(goal.bodyParts);
    setWorkoutDuration(goal.duration);
    setGoalText(`${goal.label} workout`);
    // Clear performance goals since this is a quick workout
    setSelectedPerformanceGoals([]);
    setSelectedBodyGoals([]);
    // Mark as quick workout so generateWorkout uses singleWorkout: true
    setIsQuickWorkout(true);
  };

  // Toggle performance goal selection (supports multiple)
  // Example: Select both "5K Training" AND "Basketball" for a combined program
  const togglePerformanceGoal = (goal: typeof performanceGoals[0]) => {
    console.log('[FitnessDashboard] Toggling performance goal:', goal.label, goal);
    
    // Selecting a performance goal means user wants a full program, not quick workout
    setIsQuickWorkout(false);
    
    setSelectedPerformanceGoals(prev => {
      const isSelected = prev.includes(goal.id);
      if (isSelected) {
        // Deselect this goal
        return prev.filter(id => id !== goal.id);
      } else {
        // Add this goal to selections
        return [...prev, goal.id];
      }
    });
    
    // Update body parts to show combined target areas from all selected goals
    setTimeout(() => {
      updateBodyPartsFromGoals();
    }, 0);
  };
  
  // Update body parts based on all selected goals
  const updateBodyPartsFromGoals = () => {
    const allTargetAreas = new Set<string>();
    
    // Add target areas from all selected performance goals
    selectedPerformanceGoals.forEach(goalId => {
      const goal = performanceGoals.find(p => p.id === goalId);
      if (goal) {
        goal.targetAreas.forEach(area => allTargetAreas.add(area));
      }
    });
    
    // Add target areas from all selected body goals
    selectedBodyGoals.forEach(goalId => {
      const goal = bodyGoals.find(b => b.id === goalId);
      if (goal) {
        goal.targetAreas.forEach(area => allTargetAreas.add(area));
      }
    });
    
    setSelectedBodyParts(Array.from(allTargetAreas));
    
    // Build combined goal text
    const perfGoalNames = selectedPerformanceGoals
      .map(id => performanceGoals.find(p => p.id === id)?.label)
      .filter(Boolean);
    const bodyGoalNames = selectedBodyGoals
      .map(id => bodyGoals.find(b => b.id === id)?.label)
      .filter(Boolean);
    
    const allGoals = [...perfGoalNames, ...bodyGoalNames];
    if (allGoals.length > 0) {
      setGoalText(`Combined training: ${allGoals.join(' + ')}`);
    }
  };

  // Toggle body goal selection (supports multiple)
  const toggleBodyGoal = (goal: typeof bodyGoals[0]) => {
    console.log('[FitnessDashboard] Toggling body goal:', goal.label, goal);
    
    // Selecting a body goal means user wants a full program, not quick workout
    setIsQuickWorkout(false);
    
    setSelectedBodyGoals(prev => {
      const isSelected = prev.includes(goal.id);
      if (isSelected) {
        return prev.filter(id => id !== goal.id);
      } else {
        return [...prev, goal.id];
      }
    });
    
    // Update body parts to show combined target areas
    setTimeout(() => {
      updateBodyPartsFromGoals();
    }, 0);
  };

  // Legacy single-select functions for backwards compatibility
  const selectPerformanceGoal = (goal: typeof performanceGoals[0]) => {
    togglePerformanceGoal(goal);
  };

  const selectBodyGoal = (goal: typeof bodyGoals[0]) => {
    toggleBodyGoal(goal);
  };

  // Generate workout from selections or natural language
  // Uses POST /api/fitness/programs/create with full API parameters
  const generateWorkout = async (isQuick?: boolean, durationOverride?: number) => {
    // Use passed parameters or fall back to state
    const shouldBeQuickWorkout = isQuick ?? isQuickWorkout;
    const actualDuration = durationOverride ?? workoutDuration;
    
    // Create a hash of current goals to check if anything changed
    const currentGoalsHash = JSON.stringify({
      perfGoals: selectedPerformanceGoals.sort(),
      bodyGoals: selectedBodyGoals.sort(),
      bodyParts: selectedBodyParts.sort(),
      equipment: selectedEquipment.sort(),
      duration: actualDuration,
      level: levelId,
      goalText: goalText,
      isQuick: shouldBeQuickWorkout
    });
    
    // Skip API call if goals haven't changed and we already have a program
    if (currentGoalsHash === lastGeneratedGoals && generatedProgram) {
      console.log('[FitnessDashboard] Goals unchanged, using existing program');
      setModalStep('program');
      return;
    }
    
    setIsGenerating(true);

    try {
      // Get auth token for authenticated API calls
      const authToken = await authService.getAccessToken();
      
      // Build natural language description from all selected goals
      let description = goalText;
      
      // Collect all selected goal names for description
      const selectedPerfGoalNames = selectedPerformanceGoals
        .map(id => performanceGoals.find(p => p.id === id)?.label)
        .filter(Boolean);
      const selectedBodyGoalNames = selectedBodyGoals
        .map(id => bodyGoals.find(b => b.id === id)?.label)
        .filter(Boolean);
      
      if (!description) {
        if (selectedPerfGoalNames.length > 0 || selectedBodyGoalNames.length > 0) {
          const allGoals = [...selectedPerfGoalNames, ...selectedBodyGoalNames];
          description = `Combined training program for: ${allGoals.join(', ')}`;
        } else if (selectedBodyParts.length > 0) {
          description = `I want to focus on ${selectedBodyParts.join(', ')}`;
          if (selectedEquipment.length > 0) {
            description += ` using ${selectedEquipment.join(', ')}`;
          }
        } else {
          description = "Give me a full body workout";
        }
      }

      // Calculate days per week based on number of goals
      // More goals = more workout days needed
      const totalGoals = selectedPerformanceGoals.length + selectedBodyGoals.length;
      const daysPerWeek = Math.min(6, Math.max(3, totalGoals + 2)); // 3-6 days based on goals

      // Build the request with all supported API parameters
      const request: CreateProgramRequest = {
        userId: userId,
        description: description,
        difficulty: (levelId as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
        duration: actualDuration,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : ['bodyweight'],
        targetMuscles: selectedBodyParts,
        daysPerWeek: shouldBeQuickWorkout ? 1 : daysPerWeek,
        // Quick workout = single session (duration_weeks: 0, singleWorkout: true)
        // Regular program = multi-week training plan
        duration_weeks: shouldBeQuickWorkout ? 0 : 4,
        singleWorkout: shouldBeQuickWorkout,
      };
      
      console.log('[FitnessDashboard] API Request - isQuick:', shouldBeQuickWorkout, 'duration:', actualDuration, 'singleWorkout:', shouldBeQuickWorkout);

      // Handle multiple performance goals for combined training
      // Example: 5K Training (running 3x/week) + Strength Training (3x/week)
      if (selectedPerformanceGoals.length > 0) {
        // Check if any running goals are selected
        const runningGoals = selectedPerformanceGoals.filter(id => {
          const goal = performanceGoals.find(p => p.id === id);
          return goal?.category === 'running';
        });
        
        // Check if any sports goals are selected
        const sportsGoals = selectedPerformanceGoals.filter(id => {
          const goal = performanceGoals.find(p => p.id === id);
          return goal?.category === 'sports';
        });
        
        // Build combined description with all goals
        const goalDescriptions: string[] = [];
        
        runningGoals.forEach(goalId => {
          const goal = performanceGoals.find(p => p.id === goalId);
          if (goal) {
            goalDescriptions.push(`${goal.label} running program`);
            // Add race type for running goals
            const raceTypeMap: Record<string, string> = {
              'run_5k_starter': 'c25k',
              'run_5k': '5k',
              'run_10k': '10k',
              'run_half': 'half_marathon',
              'run_marathon': 'marathon',
              'triathlon': 'ironman',
            };
            if (raceTypeMap[goalId]) {
              (request as any).raceType = raceTypeMap[goalId];
            }
          }
        });
        
        sportsGoals.forEach(goalId => {
          const goal = performanceGoals.find(p => p.id === goalId);
          if (goal) {
            goalDescriptions.push(`${goal.label} sport training`);
            (request as any).sport = goalId;
          }
        });
        
        // Set program type based on combination
        if (runningGoals.length > 0 && sportsGoals.length === 0) {
          request.programType = 'interval_cardio';
        } else if (sportsGoals.length > 0 && runningGoals.length === 0) {
          (request as any).programType = 'sport';
        } else if (runningGoals.length > 0 && sportsGoals.length > 0) {
          // Mixed - describe as combined
          request.description = `Combined program: ${goalDescriptions.join(' + ')} with cross-training`;
        }
      }

      // Handle multiple body goals
      if (selectedBodyGoals.length > 0) {
        const bodyGoalDescriptions: string[] = [];
        let primaryProgramType: string | null = null;
        
        selectedBodyGoals.forEach(goalId => {
          const goal = bodyGoals.find(b => b.id === goalId);
          if (goal) {
            bodyGoalDescriptions.push(goal.label);
            
            // Set program type from first relevant body goal
            if (!primaryProgramType) {
              if (['build_muscle', 'get_toned', 'upper_body', 'stronger_legs'].includes(goalId)) {
                primaryProgramType = 'strength';
              } else if (['lose_weight', 'improve_endurance'].includes(goalId)) {
                primaryProgramType = 'interval_cardio';
              } else if (goalId === 'increase_flexibility') {
                primaryProgramType = 'stretching';
              } else if (goalId === 'six_pack') {
                primaryProgramType = 'core';
              }
            }
          }
        });
        
        // Only set programType if not already set by performance goals
        if (!request.programType && primaryProgramType) {
          request.programType = primaryProgramType as any;
        }
        
        // Add body goals to description
        if (bodyGoalDescriptions.length > 0) {
          request.description += ` with body goals: ${bodyGoalDescriptions.join(', ')}`;
        }
      }

      console.log('[FitnessDashboard] Creating program with request:', JSON.stringify(request, null, 2));

      // Use the fitnessService for proper API call with auth
      const result = await fitnessService.createProgramFromDescription(
        request,
        authToken || undefined
      );

      console.log('[FitnessDashboard] Program creation response:', JSON.stringify(result, null, 2));

      // Check for workouts in response - could be at top level or nested in program
      const resultAny = result as any;
      const workouts = result.workouts || resultAny.program?.workouts;
      
      if (result.success && workouts && workouts.length > 0) {
        // Store the generated program for preview
        // Normalize the response structure
        setGeneratedProgram({
          success: true,
          program: resultAny.program || result,
          program_id: result.program_id || resultAny.program?.program_id,
          workouts: workouts,
        });
        setSelectedWorkoutDay(0); // Default to first workout
        
        // Save the goals hash so we don't regenerate if user goes back without changes
        setLastGeneratedGoals(JSON.stringify({
          perfGoals: selectedPerformanceGoals.sort(),
          bodyGoals: selectedBodyGoals.sort(),
          bodyParts: selectedBodyParts.sort(),
          equipment: selectedEquipment.sort(),
          duration: workoutDuration,
          level: levelId,
          goalText: goalText
        }));
        
        // Move to program overview step
        setModalStep('program');
      } else {
        Alert.alert('Error', (result as any).message || (result as any).error || 'Failed to generate workout');
      }
    } catch (err) {
      console.error('[FitnessDashboard] Generate workout error:', err);
      Alert.alert('Error', 'Failed to generate workout. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Use API data if available, fallback to default
  const displayData = workout && workout.exercises ? {
    title: 'Today\'s Workout',
    subtitle: workout.phase || 'Personalized for you',
    phases: [{ id: workout.phase || 'current', name: workout.phase || 'Current Phase' }],
    levels: [{ id: workout.level || 'current', label: workout.level || 'Your Level' }],
    days: [{ id: 'today', label: 'Today' }],
    defaultPhaseId: workout.phase || 'current',
    defaultLevelId: workout.level || 'current',
    defaultDayId: 'today',
    variants: {
      [`${workout.phase || 'current'}-${workout.level || 'current'}-today`]: (workout.exercises || []).map((ex) => ({
        meta: {
          id: ex.exercise_id,
          name: ex.name,
          equipment: ex.equipment || 'NONE',
          fitnessLoad: { STRENGTH: 2, CARDIO: 1 },
          muscleLoad: { [ex.muscle_group]: 3 },
        },
        prescription: {
          sets: ex.sets,
          intensityLabel: ex.intensity,
          duration: `${ex.reps} reps`,
          rest: `${ex.rest_sec}s`,
        },
      })),
    },
  } : data;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isWorkoutActive && workoutStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - workoutStartTime.getTime()) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isWorkoutActive, workoutStartTime]);

  // Get current exercises based on selections
  const currentExercises = useMemo(() => {
    const key = `${phaseId}-${levelId}-${dayId}`;
    return displayData.variants[key] || displayData.variants[Object.keys(displayData.variants)[0]] || [];
  }, [phaseId, levelId, dayId, displayData.variants]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = async () => {
    if (isWorkoutActive && session) {
      // Complete workout
      Alert.alert(
        'Complete Workout',
        'How was your workout?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Complete',
            onPress: async () => {
              try {
                await fitnessService.completeSession(session.id, {
                  rpe: 7, // Default RPE, could show a picker
                  felt_pain: false,
                  overall_notes: 'Completed via app',
                });
                setIsWorkoutActive(false);
                setWorkoutStartTime(null);
                setSession(null);
                Alert.alert('Success', 'Workout completed! Great job!');
                await loadTodayWorkout(); // Refresh for next workout
              } catch (err) {
                Alert.alert('Error', 'Could not complete workout');
              }
            },
          },
        ]
      );
    } else {
      // Start workout session
      if (!workout) {
        // No workout loaded - prompt to generate one
        if (!hasWorkoutAccess) {
          setShowUpgrade(true);
          return;
        }
        setShowGoalSelector(true);
        return;
      }
      
      try {
        const newSession = await fitnessService.startSession({
          userId,
          workoutId: workout.workout_id,
        });
        
        setSession(newSession);
        setIsWorkoutActive(true);
        setWorkoutStartTime(new Date());
        setElapsedTime(0);
        
        if (onStartSession) {
          onStartSession({ phaseId, levelId, dayId });
        }
      } catch (err) {
        Alert.alert('Error', 'Could not start workout session');
      }
    }
  };

  const exerciseColors = ['#4cbb17', '#ef4444', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899', '#10b981'];

  const renderExercise = ({ item, index }: { item: ExerciseRowView; index: number }) => (
    <ExerciseCard
      exercise={item}
      simplified={viewMode === 'simple'}
      borderColor={exerciseColors[index % exerciseColors.length]}
    />
  );

  // Open modal and reset to first step
  const openGoalSelector = () => {
    if (!hasWorkoutAccess) {
      setShowUpgrade(true);
      return;
    }
    setModalStep('goals');
    setShowGoalSelector(true);
  };

  // Close modal and reset state
  const closeGoalSelector = () => {
    setShowGoalSelector(false);
    setModalStep('goals');
    // Only clear generated program, keep selections for convenience
    setGeneratedProgram(null);
    setLastGeneratedGoals(''); // Reset cache so new workout will be generated
  };

  // Clear all selections and reset form
  const clearAllSelections = () => {
    setSelectedPerformanceGoals([]);
    setSelectedBodyGoals([]);
    setSelectedBodyParts([]);
    setSelectedEquipment([]);
    setGoalText('');
    setWorkoutDuration(30);
    setGeneratedProgram(null);
    setLastGeneratedGoals('');
    // Reset expanded sections
    setExpandedSections({
      performance: false,
      body: false,
      quick: false,
      bodyAreas: false,
      equipment: false,
      duration: true,
    });
  };

  // Clear current workout (for development/testing)
  const clearWorkout = () => {
    console.log('[FitnessDashboard] Clearing workout data');
    setWorkout(null as any);
    setTodayWorkouts([]); // Clear all today's workouts
    setScheduledWorkouts([]); // Clear scheduled workouts
    setProgramProgress(null);
    setIsWorkoutActive(false);
    setSession(null);
    setCompletedSets([]);
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    Alert.alert('Cleared', 'Workout data has been cleared.');
  };

  // Select fitness level and proceed
  const selectFitnessLevel = (level: string) => {
    setLevelId(level);
    setModalStep('goals');
  };

  // Start workout from preview
  const startWorkoutFromPreview = () => {
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setCompletedSets([]);
    setShowGoalSelector(false);
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setElapsedTime(0);
  };

  // Log a completed set during workout
  const logCompletedSet = () => {
    if (!workout || !workout.exercises[currentExerciseIndex]) return;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    const setData = {
      exercise_id: currentExercise.exercise_id,
      set: currentSet,
      reps: parseInt(loggedReps) || 10,
      weight: parseInt(loggedWeight) || 0,
      timestamp: new Date().toISOString()
    };

    setCompletedSets(prev => [...prev, setData]);
    setLoggedReps('');
    setLoggedWeight('');

    // Start rest timer if not last set
    if (currentSet < currentExercise.sets) {
      setRestTimeRemaining(currentExercise.rest_sec || 60);
      setRestTimerActive(true);
      setCurrentSet(prev => prev + 1);
    } else {
      // Move to next exercise
      if (currentExerciseIndex < workout.exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
        setCurrentSet(1);
      } else {
        // Workout complete
        finishActiveWorkout();
      }
    }
  };

  // Skip rest timer
  const skipRestTimer = () => {
    setRestTimerActive(false);
    setRestTimeRemaining(0);
  };

  // Calculate workout achievements
  const calculateAchievements = () => {
    const achievements = [];
    
    // First workout
    if (programProgress?.completed_workouts === 0) {
      achievements.push({
        icon: 'trophy',
        title: 'First Workout!',
        description: 'You completed your first workout in this program',
        color: '#f59e0b'
      });
    }
    
    // Full completion
    if (workout && completedSets.length >= workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)) {
      achievements.push({
        icon: 'star',
        title: '100% Complete',
        description: 'You finished all exercises and sets',
        color: '#10b981'
      });
    }
    
    // Streak milestone
    if (programProgress && programProgress.streak_days > 0 && (programProgress.streak_days + 1) % 7 === 0) {
      achievements.push({
        icon: 'flame',
        title: `${programProgress.streak_days + 1} Day Streak!`,
        description: 'Keep up the amazing consistency',
        color: '#ef4444'
      });
    }
    
    // Long workout
    if (elapsedTime > 45 * 60) {
      achievements.push({
        icon: 'timer',
        title: 'Endurance Master',
        description: 'You worked out for over 45 minutes',
        color: '#8b5cf6'
      });
    }
    
    return achievements;
  };

  // Finish active workout with enhanced achievements
  // Uses POST /api/fitness/programs/:programId/workouts/:workoutId/complete
  const finishActiveWorkout = async () => {
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    
    // Calculate stats before API call
    const totalWeight = completedSets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
    const totalReps = completedSets.reduce((sum, set) => sum + (set.reps || 0), 0);
    const estimatedCalories = completedSets.length * 5 + Math.floor(elapsedTime / 60) * 4;
    const achievements = calculateAchievements();
    
    // Try to complete workout via new API if we have program info
    if (generatedProgram?.program_id && workout?.workout_id) {
      try {
        const authToken = await authService.getAccessToken();
        
        // Format completed sets for API
        const exercisesCompleted = completedSets.reduce((acc, set) => {
          const existing = acc.find((e: any) => e.exercise_id === set.exercise_id);
          if (existing) {
            existing.sets_completed.push({
              set: set.set,
              reps: set.reps || 0,
              weight: set.weight || 'bodyweight',
              difficulty: 'moderate' as const
            });
          } else {
            acc.push({
              exercise_id: set.exercise_id,
              sets_completed: [{
                set: set.set,
                reps: set.reps || 0,
                weight: set.weight || 'bodyweight',
                difficulty: 'moderate' as const
              }]
            });
          }
          return acc;
        }, [] as any[]);
        
        const completionData: CompleteWorkoutRequest = {
          completed_at: new Date().toISOString(),
          duration_minutes: Math.round(elapsedTime / 60),
          exercises_completed: exercisesCompleted,
          notes: `Completed ${completedSets.length} sets`,
          energy_level: 'medium',
          calories_burned: estimatedCalories
        };
        
        console.log('[FitnessDashboard] Completing workout with:', JSON.stringify(completionData, null, 2));
        
        const result = await fitnessService.completeWorkout(
          generatedProgram.program_id,
          workout.workout_id,
          completionData,
          authToken || undefined
        );
        
        console.log('[FitnessDashboard] Workout completion response:', JSON.stringify(result, null, 2));
        
        // Update progress from API response
        if (result.success && result.progress) {
          setProgramProgress({
            program_id: generatedProgram.program_id,
            program_name: generatedProgram.program?.name || 'Workout Program',
            current_week: result.progress.current_week,
            current_day: result.progress.current_day,
            total_weeks: 4,
            days_per_week: 3,
            completed_workouts: result.progress.completed_workouts,
            total_workouts: result.progress.total_workouts,
            completion_percentage: result.progress.completion_percentage,
            streak_days: (programProgress?.streak_days || 0) + 1,
            next_workout_date: result.progress.next_workout?.scheduled_date || '',
            is_rest_day: false,
          });
          
          // Add API achievements to local achievements
          if (result.achievements) {
            result.achievements.forEach(a => {
              achievements.push({
                icon: a.icon || 'trophy',
                title: a.title,
                description: a.description,
                color: '#f59e0b'
              });
            });
          }
        }
      } catch (err) {
        console.error('[FitnessDashboard] Failed to complete workout via API:', err);
        // Fall back to local state update
      }
    } else if (session && workout) {
      // Legacy session completion for non-generated workouts
      try {
        await fitnessService.completeSession(session.id, {
          rpe: 7,
          felt_pain: false,
          overall_notes: `Completed ${completedSets.length} sets`,
        });
      } catch (err) {
        console.error('[FitnessDashboard] Failed to save workout session:', err);
      }
    }
    
    // Set workout summary for modal
    setWorkoutSummary({
      duration: formatTime(elapsedTime),
      setsCompleted: completedSets.length,
      calories: estimatedCalories,
      achievements,
    });
    setShowWorkoutCompleteModal(true);
    
    // Update local program progress if not updated from API
    if (programProgress && !generatedProgram?.program_id) {
      setProgramProgress({
        ...programProgress,
        completed_workouts: programProgress.completed_workouts + 1,
        completion_percentage: Math.round(((programProgress.completed_workouts + 1) / programProgress.total_workouts) * 100),
        streak_days: programProgress.streak_days + 1,
        current_day: programProgress.current_day + 1,
      });
    }
  };

  // Calendar Helper Functions
  const getCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isWorkoutDay = (date: Date | null) => {
    if (!date) return false;
    // Check if this date has a scheduled workout
    if (scheduledWorkouts.length > 0) {
      return scheduledWorkouts.some(sw => 
        sw.date.toDateString() === date.toDateString()
      );
    }
    // Fallback: Workout days: Mon, Wed, Fri (days 1, 3, 5)
    const dayOfWeek = date.getDay();
    return dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5;
  };

  const isRestDay = (date: Date | null) => {
    if (!date) return false;
    const dayOfWeek = date.getDay();
    return dayOfWeek !== 1 && dayOfWeek !== 3 && dayOfWeek !== 5;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  // Check if a past workout was completed (vs skipped)
  // Mock implementation - in real app, this would check workout history
  const isWorkoutCompleted = (date: Date | null) => {
    if (!date) return false;
    // Mock: odd-numbered days were completed, even-numbered were skipped
    // In production, check against actual workout completion records
    return date.getDate() % 3 !== 0; // Skip every 3rd workout day
  };

  const changeMonth = (delta: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCalendarMonth(newMonth);
  };

  const startWorkoutForExercise = (exerciseIndex: number) => {
    setCurrentExerciseIndex(exerciseIndex);
    setCurrentSet(1);
    setCompletedSets([]);
    setIsWorkoutActive(true);
    setWorkoutStartTime(new Date());
    setElapsedTime(0);
  };

  // Rest timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimerActive && restTimeRemaining > 0) {
      interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setRestTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [restTimerActive, restTimeRemaining]);

  // Render Program Overview Step - Shows all workouts in the program
  const renderProgramOverview = () => {
    if (!generatedProgram?.program) return null;
    
    const program = generatedProgram.program;
    const workouts = program.workouts || [];
    const totalExercises = workouts.reduce((sum: number, w: any) => sum + (w.exercises?.length || 0), 0);
    const totalDuration = workouts.reduce((sum: number, w: any) => sum + (w.estimated_duration || 30), 0);
    
    // Get day names for workout days (Sunday = 0, Monday = 1, etc. to match Date.getDay())
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = new Date().getDay();
    
    // Function to select a workout day and view its details
    const viewWorkoutDay = (index: number) => {
      setSelectedWorkoutDay(index);
      const selectedWorkout = workouts[index];
      
      // For running workouts, convert intervals/instructions to exercise-like format
      let exercises: any[] = [];
      
      if (selectedWorkout.exercises && selectedWorkout.exercises.length > 0) {
        // Standard strength workout with exercises
        exercises = selectedWorkout.exercises.map((ex: any) => ({
          exercise_id: ex.exercise_id || ex.name,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps?.toString() || '10-12',
          intensity: ex.intensity || 'Moderate',
          rest_sec: ex.rest_seconds || 60,
          muscle_group: ex.target_muscle || 'Mixed',
          equipment: ex.equipment?.[0] || 'Bodyweight',
          instructions: ex.instructions || []
        }));
      } else if (selectedWorkout.type === 'intervals' && selectedWorkout.intervals?.length > 0) {
        // Interval running workout - convert intervals to exercise format
        exercises = selectedWorkout.intervals.map((interval: any, idx: number) => ({
          exercise_id: `interval_${idx}`,
          name: interval.activity || interval.type,
          sets: interval.repeat || 1,
          reps: `${interval.duration_minutes} min`,
          intensity: interval.type === 'work' ? 'High' : 'Low',
          rest_sec: (interval.rest_minutes || 0) * 60,
          muscle_group: 'Cardio',
          equipment: 'None',
          instructions: []
        }));
      } else if (selectedWorkout.distance_km || selectedWorkout.pace_target) {
        // Simple running workout (easy run, tempo, long run)
        exercises = [{
          exercise_id: 'main_run',
          name: selectedWorkout.name || 'Run',
          sets: 1,
          reps: `${selectedWorkout.distance_km || '?'} km`,
          intensity: selectedWorkout.pace_target || 'Moderate',
          rest_sec: 0,
          muscle_group: 'Cardio / Legs',
          equipment: 'Running Shoes',
          instructions: selectedWorkout.instructions || []
        }];
      }
      
      // Convert to DailyWorkout format with optional running data
      const dailyWorkout = {
        workout_id: selectedWorkout.workout_id || `${generatedProgram.program_id}_day${index + 1}`,
        date: selectedWorkout.scheduled_date || new Date().toISOString(),
        day_of_week: selectedWorkout.day_name || `Day ${index + 1}`,
        phase: selectedWorkout.name || program.name || 'Custom Workout',
        level: levelId || 'intermediate',
        stretches: [] as any[],
        estimated_duration_min: selectedWorkout.estimated_duration || workoutDuration,
        exercises: exercises,
        // Store extra running data for display
        runningData: selectedWorkout.distance_km ? {
          distance_km: selectedWorkout.distance_km,
          pace_target: selectedWorkout.pace_target,
          focus: selectedWorkout.focus,
          type: selectedWorkout.type,
          instructions: selectedWorkout.instructions,
          calories_estimate: selectedWorkout.calories_estimate,
          intervals: selectedWorkout.intervals
        } : undefined
      } as DailyWorkout & { runningData?: any };
      
      setWorkout(dailyWorkout as DailyWorkout);
      setModalStep('preview');
    };
    
    return (
      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Program Header */}
        <View style={styles.programHeader}>
          <View style={styles.programIconContainer}>
            <Ionicons name="calendar-outline" size={48} color="#4cbb17" />
          </View>
          <Text style={styles.programTitle}>{program.name || 'Your Workout Program'}</Text>
          <Text style={styles.programDescription}>
            {program.description || goalText || 'Personalized workout program based on your goals'}
          </Text>
          
          {/* Schedule Pattern Info (for beginner/intermediate/advanced) */}
          {program.schedule_note && (
            <View style={styles.schedulePatternBadge}>
              <Ionicons 
                name={program.schedule_pattern === 'every_other_day' ? 'calendar-outline' : 'flash-outline'} 
                size={14} 
                color="#6366f1" 
              />
              <Text style={styles.schedulePatternText}>
                {program.schedule_note}
              </Text>
            </View>
          )}
        </View>

        {/* Program Stats */}
        <View style={styles.programStatsRow}>
          <View style={styles.programStatCard}>
            <Ionicons name="calendar-number-outline" size={24} color="#6366f1" />
            <Text style={styles.programStatValue}>{workouts.length}</Text>
            <Text style={styles.programStatLabel}>Workouts</Text>
          </View>
          <View style={styles.programStatCard}>
            <Ionicons name="barbell-outline" size={24} color="#8b5cf6" />
            <Text style={styles.programStatValue}>{totalExercises}</Text>
            <Text style={styles.programStatLabel}>Exercises</Text>
          </View>
          <View style={styles.programStatCard}>
            <Ionicons name="time-outline" size={24} color="#f59e0b" />
            <Text style={styles.programStatValue}>{totalDuration}</Text>
            <Text style={styles.programStatLabel}>Total Mins</Text>
          </View>
        </View>

        {/* When to Start Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>When do you want to start?</Text>
          <Text style={styles.sectionSubtitle}>Select a day to see the workout details</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.startDayScroll}
            contentContainerStyle={styles.startDayContainer}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
              const date = new Date();
              date.setDate(date.getDate() + offset);
              const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayNames[dayOfWeek];
              const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              const isSelected = selectedStartDayOffset === offset;
              
              return (
                <TouchableOpacity
                  key={offset}
                  style={[
                    styles.startDayButton,
                    isSelected && styles.startDayButtonSelected
                  ]}
                  onPress={() => setSelectedStartDayOffset(offset)}
                >
                  <Text style={[
                    styles.startDayName,
                    isSelected && styles.startDayNameSelected
                  ]}>{dayName}</Text>
                  <Text style={[
                    styles.startDayDate,
                    isSelected && styles.startDayDateSelected
                  ]}>{dateStr}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          
          {/* Start Program Button - right below date selector */}
          <TouchableOpacity
            style={[styles.startProgramButton, { marginTop: 16 }]}
            onPress={() => {
              // Calculate start date based on selected offset
              const startDate = new Date();
              startDate.setDate(startDate.getDate() + selectedStartDayOffset);
              
              // Schedule all workouts across multiple days (not all on same day)
              const allScheduledWorkouts: {date: Date, workout: any, programId: string, programName: string}[] = [];
              let currentDate = new Date(startDate);
              
              workouts.forEach((w: any, index: number) => {
                // Create scheduled date for this workout
                const workoutDate = new Date(currentDate);
                
                allScheduledWorkouts.push({
                  date: workoutDate,
                  programId: generatedProgram.program_id || '',
                  programName: program.name || 'Custom Program',
                  workout: {
                    ...w,
                    workout_id: w.workout_id || `${generatedProgram.program_id}_day${index + 1}`,
                    scheduled_date: workoutDate.toISOString(),
                  }
                });
                
                // Move to next day for the next workout
                currentDate.setDate(currentDate.getDate() + 1);
              });
              
              // Store all scheduled workouts for calendar display
              setScheduledWorkouts(allScheduledWorkouts);
              
              // Find today's workout(s) from the schedule
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const todaysScheduled = allScheduledWorkouts.filter(sw => {
                const swDate = new Date(sw.date);
                swDate.setHours(0, 0, 0, 0);
                return swDate.getTime() === today.getTime();
              });
              
              // Convert today's workouts to DailyWorkout format
              const todaysDailyWorkouts: DailyWorkout[] = todaysScheduled
                .filter(sw => !sw.workout.is_rest_day)
                .map((sw) => ({
                  workout_id: sw.workout.workout_id,
                  date: sw.date.toISOString(),
                  day_of_week: sw.date.toLocaleDateString('en-US', { weekday: 'long' }),
                  phase: sw.workout.name || program.name || 'Custom Workout',
                  level: levelId || 'intermediate',
                  stretches: [],
                  estimated_duration_min: sw.workout.estimated_duration || workoutDuration,
                  exercises: sw.workout.exercises?.map((ex: any) => ({
                    exercise_id: ex.exercise_id || ex.name,
                    name: ex.name,
                    sets: ex.sets || 3,
                    reps: ex.reps?.toString() || '10-12',
                    intensity: ex.intensity || 'Moderate',
                    rest_sec: ex.rest_seconds || 60,
                    muscle_group: ex.target_muscle || 'Mixed',
                    equipment: ex.equipment?.[0] || 'Bodyweight',
                    instructions: ex.instructions || []
                  })) || []
                }));
              
              // Set only today's workouts
              setTodayWorkouts(todaysDailyWorkouts);
              
              // Also set the first workout as the active workout (for backward compatibility)
              if (todaysDailyWorkouts.length > 0) {
                setWorkout(todaysDailyWorkouts[0]);
              }
              
              setProgramProgress({
                program_id: generatedProgram.program_id || 'generated_program',
                program_name: program.name || 'Custom Program',
                current_week: 1,
                current_day: 1,
                total_weeks: program.duration_weeks || 4,
                days_per_week: program.days_per_week || workouts.length,
                completed_workouts: 0,
                total_workouts: workouts.length,
                completion_percentage: 0,
                streak_days: 0,
                next_workout_date: startDate.toISOString(),
                is_rest_day: todaysDailyWorkouts.length === 0,
              });
              
              // Close modal and show the workout on the main dashboard
              setShowGoalSelector(false);
              setModalStep('goals'); // Reset for next time
              
              // Reload user programs to show newly created program in the list
              setTimeout(() => {
                loadUserPrograms(false); // Don't force refresh, use cache if available
              }, 500);
            }}
          >
            <Ionicons name="play-circle" size={24} color="#ffffff" />
            <Text style={styles.startProgramButtonText}>
              Start Program {selectedStartDayOffset === 0 ? 'Today' : selectedStartDayOffset === 1 ? 'Tomorrow' : `on ${dayNames[new Date(Date.now() + selectedStartDayOffset * 86400000).getDay()]}`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Workouts List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Workouts</Text>
          <Text style={styles.sectionSubtitle}>Tap a workout to see details and start</Text>
          
          {workouts.map((workout: any, index: number) => {
            // Calculate the scheduled date for this workout
            const workoutDate = new Date();
            workoutDate.setDate(workoutDate.getDate() + selectedStartDayOffset + index);
            const workoutDateStr = workoutDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            
            // Handle both strength workouts (exercises) and running workouts (intervals/distance)
            const isRunning = workout.type === 'easy_run' || workout.type === 'intervals' || 
                              workout.type === 'tempo' || workout.type === 'long_run' || 
                              workout.distance_km !== undefined;
            const isRestDay = workout.is_rest_day || workout.type === 'rest';
            
            // For running: show distance or interval count; for strength: show exercise count
            const exerciseCount = workout.exercises?.length || 0;
            const intervalCount = workout.intervals?.length || 0;
            const activityCount = isRunning ? (intervalCount || 1) : exerciseCount;
            
            // For running workouts, show run type; for strength, show muscle groups
            const muscleGroups = [...new Set(workout.exercises?.map((e: any) => e.target_muscle) || [])];
            const workoutFocus = isRunning ? (workout.focus || workout.type?.replace('_', ' ') || 'Run') : 
                                  (muscleGroups.slice(0, 3).join(' • ') || 'Full Body');
            
            const duration = workout.estimated_duration || 30;
            
            // Get scheduling info
            const dayOfWeek = workout.day_of_week;
            const workoutIntensity = workout.intensity; // easy, moderate, hard
            const isConsecutiveDay = workout.is_consecutive_day;
            const hasRestDayBefore = workout.rest_day_before;
            const hasRestDayAfter = workout.rest_day_after;
            
            // Intensity badge colors
            const getIntensityStyle = (intensity: string | undefined) => {
              switch (intensity) {
                case 'easy': return { bg: '#dcfce7', text: '#16a34a', label: '😌 Easy' };
                case 'moderate': return { bg: '#fef3c7', text: '#d97706', label: '💪 Moderate' };
                case 'hard': return { bg: '#fee2e2', text: '#dc2626', label: '🔥 Hard' };
                default: return null;
              }
            };
            const intensityStyle = getIntensityStyle(workoutIntensity);
            
            // Skip rest days or show them differently
            if (isRestDay) {
              return (
                <View
                  key={index}
                  style={[styles.workoutDayCard, styles.restDayCard]}
                >
                  <View style={styles.workoutDayHeader}>
                    <View style={[styles.workoutDayNumber, { backgroundColor: '#e5e7eb' }]}>
                      <Text style={[styles.workoutDayNumberText, { color: '#6B7280' }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.workoutDayInfo}>
                      <Text style={styles.workoutDayTitle}>{workout.name || 'Rest Day'}</Text>
                      <Text style={styles.workoutDayMuscles}>
                        {workoutDateStr} • {workout.notes || workout.suggestion || 'Recovery & Rest'}
                      </Text>
                    </View>
                    <Ionicons name="bed-outline" size={24} color="#9CA3AF" />
                  </View>
                </View>
              );
            }
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.workoutDayCard,
                  selectedWorkoutDay === index && styles.workoutDayCardSelected
                ]}
                onPress={() => viewWorkoutDay(index)}
              >
                <View style={styles.workoutDayHeader}>
                  <View style={styles.workoutDayNumber}>
                    <Text style={styles.workoutDayNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.workoutDayInfo}>
                    <Text style={styles.workoutDayTitle}>
                      {workout.name || workout.day_name || `Day ${index + 1}`}
                    </Text>
                    <Text style={styles.workoutDayMuscles}>
                      {workoutDateStr} • {workoutFocus}
                    </Text>
                  </View>
                  <View style={styles.workoutDayMeta}>
                    {/* Intensity Badge */}
                    {intensityStyle && (
                      <View style={[styles.workoutIntensityBadge, { backgroundColor: intensityStyle.bg }]}>
                        <Text style={[styles.workoutIntensityText, { color: intensityStyle.text }]}>
                          {intensityStyle.label}
                        </Text>
                      </View>
                    )}
                    <View style={styles.workoutDayMetaItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.workoutDayMetaText}>{duration}m</Text>
                    </View>
                    {isRunning ? (
                      <View style={styles.workoutDayMetaItem}>
                        <Ionicons name="navigate-outline" size={14} color="#6B7280" />
                        <Text style={styles.workoutDayMetaText}>{workout.distance_km || '?'} km</Text>
                      </View>
                    ) : (
                      <View style={styles.workoutDayMetaItem}>
                        <Ionicons name="barbell-outline" size={14} color="#6B7280" />
                        <Text style={styles.workoutDayMetaText}>{activityCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Workout Preview - Running or Strength */}
                <View style={styles.workoutDayExercises}>
                  {isRunning ? (
                    // Running workout preview
                    <>
                      {workout.pace_target && (
                        <View style={styles.workoutDayExerciseItem}>
                          <Ionicons name="speedometer-outline" size={12} color="#4cbb17" />
                          <Text style={styles.workoutDayExerciseText}>Pace: {workout.pace_target} min/km</Text>
                        </View>
                      )}
                      {/* Show workout structure for interval workouts */}
                      {workout.workout?.structure && (
                        <View style={styles.workoutDayExerciseItem}>
                          <Ionicons name="repeat-outline" size={12} color="#6366f1" />
                          <Text style={styles.workoutDayExerciseText} numberOfLines={1}>{workout.workout.structure}</Text>
                        </View>
                      )}
                      {workout.instructions?.slice(0, 2).map((inst: string, instIdx: number) => (
                        <View key={instIdx} style={styles.workoutDayExerciseItem}>
                          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                          <Text style={styles.workoutDayExerciseText} numberOfLines={1}>{inst}</Text>
                        </View>
                      ))}
                      {workout.intervals?.length > 0 && (
                        <View style={styles.workoutDayExerciseItem}>
                          <Ionicons name="repeat-outline" size={12} color="#ef4444" />
                          <Text style={styles.workoutDayExerciseText}>{workout.intervals.length} intervals</Text>
                        </View>
                      )}
                    </>
                  ) : (
                    // Strength workout preview
                    <>
                      {workout.exercises?.slice(0, 3).map((ex: any, exIndex: number) => (
                        <View key={exIndex} style={styles.workoutDayExerciseItem}>
                          <Ionicons name="chevron-forward" size={12} color="#9CA3AF" />
                          <Text style={styles.workoutDayExerciseText} numberOfLines={1}>
                            {ex.name}
                          </Text>
                        </View>
                      ))}
                      {exerciseCount > 3 && (
                        <Text style={styles.workoutDayMoreText}>
                          +{exerciseCount - 3} more exercises
                        </Text>
                      )}
                    </>
                  )}
                  
                  {/* Motivation Message */}
                  {workout.motivation && (
                    <View style={styles.motivationContainer}>
                      <Text style={styles.motivationText}>{workout.motivation}</Text>
                    </View>
                  )}
                  
                  {/* Progression Note */}
                  {workout.progression_note && (
                    <View style={styles.workoutCardProgressionNote}>
                      <Ionicons name="trending-up-outline" size={12} color="#8b5cf6" />
                      <Text style={styles.workoutCardProgressionText}>{workout.progression_note}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.workoutDayAction}>
                  <Text style={styles.workoutDayActionText}>View Details</Text>
                  <Ionicons name="arrow-forward" size={16} color="#4cbb17" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // Render Workout Preview Step
  const renderWorkoutPreview = () => {
    if (!workout || !workout.exercises) return null;
    
    const totalSets = (workout.exercises || []).reduce((sum, ex) => sum + ex.sets, 0);
    const focusAreas = [...new Set((workout.exercises || []).map(ex => ex.muscle_group))].join(', ');
    const runningData = (workout as any).runningData;
    const isRunningWorkout = !!runningData;
    
    // Check if we have the new session format with warmup/main/cooldown
    const session = (workout as any).session as TodayWorkoutSession | undefined;
    const hasSessionFormat = !!session?.warmup && !!session?.main && !!session?.cooldown;
    
    return (
      <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
        {/* Workout Summary Card */}
        <View style={styles.previewSummaryCard}>
          <View style={styles.previewTitleRow}>
            <Ionicons 
              name={isRunningWorkout ? "walk-outline" : "barbell-outline"} 
              size={28} 
              color="#4cbb17" 
            />
            <Text style={styles.previewTitle}>
              {session?.title || workout.phase || 'Your Custom Workout'}
            </Text>
          </View>
          
          <View style={styles.previewStats}>
            <View style={styles.previewStatItem}>
              <Ionicons name="time-outline" size={20} color="#6366f1" />
              <Text style={styles.previewStatText}>
                {session?.totalMinutes || workout.estimated_duration_min} min
              </Text>
            </View>
            {isRunningWorkout ? (
              <>
                <View style={styles.previewStatItem}>
                  <Ionicons name="navigate-outline" size={20} color="#8b5cf6" />
                  <Text style={styles.previewStatText}>
                    {runningData.distance_km} km
                  </Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Ionicons name="speedometer-outline" size={20} color="#f59e0b" />
                  <Text style={styles.previewStatText}>
                    {runningData.pace_target}
                  </Text>
                </View>
              </>
            ) : hasSessionFormat ? (
              <>
                <View style={styles.previewStatItem}>
                  <Ionicons name="flame-outline" size={20} color="#f59e0b" />
                  <Text style={styles.previewStatText}>
                    {session.warmupMinutes}m warmup
                  </Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Ionicons name="barbell-outline" size={20} color="#8b5cf6" />
                  <Text style={styles.previewStatText}>
                    {session.mainMinutes}m main
                  </Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Ionicons name="body-outline" size={20} color="#4cbb17" />
                  <Text style={styles.previewStatText}>
                    {session.cooldownMinutes}m cooldown
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.previewStatItem}>
                  <Ionicons name="layers-outline" size={20} color="#8b5cf6" />
                  <Text style={styles.previewStatText}>
                    {workout.exercises.length} exercises
                  </Text>
                </View>
                <View style={styles.previewStatItem}>
                  <Ionicons name="repeat-outline" size={20} color="#f59e0b" />
                  <Text style={styles.previewStatText}>
                    {totalSets} sets
                  </Text>
                </View>
              </>
            )}
          </View>
          
          <View style={styles.previewFocusRow}>
            <Ionicons name="flag-outline" size={16} color="#4cbb17" />
            <Text style={styles.previewFocusText}>
              Focus: {session?.category || (isRunningWorkout ? runningData.focus : focusAreas)}
            </Text>
          </View>
          
          {/* Equipment for session format */}
          {hasSessionFormat && session.equipment && session.equipment.length > 0 && (
            <View style={styles.previewFocusRow}>
              <Ionicons name="cube-outline" size={16} color="#8b5cf6" />
              <Text style={styles.previewFocusText}>
                Equipment: {session.equipment.join(', ')}
              </Text>
            </View>
          )}
          
          {isRunningWorkout && runningData.calories_estimate && (
            <View style={styles.previewFocusRow}>
              <Ionicons name="flame-outline" size={16} color="#ef4444" />
              <Text style={styles.previewFocusText}>
                Est. Calories: {runningData.calories_estimate}
              </Text>
            </View>
          )}
        </View>

        {/* ========== SESSION FORMAT: Warmup/Main/Cooldown ========== */}
        {hasSessionFormat && (
          <>
            {/* Warmup Section */}
            <Text style={styles.previewSectionTitle}>
              <Ionicons name="flame-outline" size={16} color="#f59e0b" /> Warm-up ({session.warmupMinutes} min)
            </Text>
            {session.warmup.map((warmupEx, index) => (
              <View key={`warmup-${index}`} style={styles.previewExerciseCard}>
                <View style={styles.previewExerciseHeader}>
                  <View style={[styles.previewExerciseNumber, { backgroundColor: '#f59e0b' }]}>
                    <Text style={styles.previewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.previewExerciseInfo}>
                    <Text style={styles.previewExerciseName}>{warmupEx.exercise}</Text>
                    <View style={styles.previewExerciseMeta}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.previewExerciseMetaText}>{warmupEx.duration} seconds</Text>
                    </View>
                  </View>
                </View>
                {warmupEx.notes && (
                  <View style={styles.previewExerciseEquipment}>
                    <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.previewEquipmentText}>{warmupEx.notes}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Main Workout Section */}
            <Text style={styles.previewSectionTitle}>
              <Ionicons name="barbell-outline" size={16} color="#6366f1" /> Main Workout ({session.mainMinutes} min)
            </Text>
            {session.main.map((mainEx, index) => (
              <View key={`main-${index}`} style={styles.previewExerciseCard}>
                <View style={styles.previewExerciseHeader}>
                  <View style={[styles.previewExerciseNumber, { backgroundColor: exerciseColors[index % exerciseColors.length] }]}>
                    <Text style={styles.previewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.previewExerciseInfo}>
                    <Text style={styles.previewExerciseName}>{mainEx.exercise}</Text>
                    {mainEx.weight && (
                      <View style={styles.previewExerciseMeta}>
                        <Ionicons name="fitness-outline" size={14} color="#6B7280" />
                        <Text style={styles.previewExerciseMetaText}>{mainEx.weight} weight</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.previewExerciseDetails}>
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetailLabel}>Sets</Text>
                    <Text style={styles.previewDetailValue}>{mainEx.sets}</Text>
                  </View>
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetailLabel}>Reps</Text>
                    <Text style={styles.previewDetailValue}>{mainEx.reps}</Text>
                  </View>
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetailLabel}>Rest</Text>
                    <Text style={styles.previewDetailValue}>{mainEx.rest}s</Text>
                  </View>
                </View>
                
                {mainEx.notes && (
                  <View style={styles.previewExerciseEquipment}>
                    <Ionicons name="bulb-outline" size={14} color="#f59e0b" />
                    <Text style={styles.previewEquipmentText}>{mainEx.notes}</Text>
                  </View>
                )}
              </View>
            ))}

            {/* Cooldown Section */}
            <Text style={styles.previewSectionTitle}>
              <Ionicons name="body-outline" size={16} color="#4cbb17" /> Cool-down ({session.cooldownMinutes} min)
            </Text>
            {session.cooldown.map((cooldownStretch, index) => (
              <View key={`cooldown-${index}`} style={styles.previewExerciseCard}>
                <View style={styles.previewExerciseHeader}>
                  <View style={[styles.previewExerciseNumber, { backgroundColor: '#4cbb17' }]}>
                    <Text style={styles.previewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.previewExerciseInfo}>
                    <Text style={styles.previewExerciseName}>{cooldownStretch.exercise}</Text>
                    <View style={styles.previewExerciseMeta}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.previewExerciseMetaText}>
                        {cooldownStretch.duration}s {cooldownStretch.perSide ? '(per side)' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {cooldownStretch.targetMuscles && cooldownStretch.targetMuscles.length > 0 && (
                  <View style={styles.previewExerciseEquipment}>
                    <Ionicons name="fitness-outline" size={14} color="#6B7280" />
                    <Text style={styles.previewEquipmentText}>
                      Target: {cooldownStretch.targetMuscles.join(', ')}
                    </Text>
                  </View>
                )}
                
                {cooldownStretch.instructions && (
                  <View style={styles.previewExerciseEquipment}>
                    <Ionicons name="information-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.previewEquipmentText}>{cooldownStretch.instructions}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* ========== LEGACY FORMAT: Running Instructions ========== */}
        {!hasSessionFormat && isRunningWorkout && runningData.instructions && runningData.instructions.length > 0 && (
          <>
            <Text style={styles.previewSectionTitle}>Instructions</Text>
            <View style={styles.runningInstructionsCard}>
              {runningData.instructions.map((instruction: string, idx: number) => (
                <View key={idx} style={styles.runningInstructionItem}>
                  <View style={styles.runningInstructionBullet}>
                    <Text style={styles.runningInstructionBulletText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.runningInstructionText}>{instruction}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Intervals Section for interval workouts */}
        {!hasSessionFormat && isRunningWorkout && runningData.intervals && runningData.intervals.length > 0 && (
          <>
            <Text style={styles.previewSectionTitle}>Intervals</Text>
            {runningData.intervals.map((interval: any, index: number) => (
              <View key={index} style={styles.previewExerciseCard}>
                <View style={styles.previewExerciseHeader}>
                  <View style={[
                    styles.previewExerciseNumber, 
                    { backgroundColor: interval.type === 'work' ? '#ef4444' : interval.type === 'warm_up' ? '#f59e0b' : '#4cbb17' }
                  ]}>
                    <Text style={styles.previewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.previewExerciseInfo}>
                    <Text style={styles.previewExerciseName}>{interval.activity || interval.type}</Text>
                    <View style={styles.previewExerciseMeta}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.previewExerciseMetaText}>
                        {interval.duration_minutes} min
                        {interval.repeat && interval.repeat > 1 ? ` × ${interval.repeat}` : ''}
                      </Text>
                    </View>
                  </View>
                </View>
                
                {interval.rest_minutes > 0 && (
                  <View style={styles.previewExerciseEquipment}>
                    <Ionicons name="pause-circle-outline" size={14} color="#6B7280" />
                    <Text style={styles.previewEquipmentText}>Rest: {interval.rest_minutes} min between sets</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* ========== LEGACY FORMAT: Exercise List ========== */}
        {!hasSessionFormat && workout.exercises && (!isRunningWorkout || workout.exercises.length > 0) && !runningData?.intervals?.length && (
          <>
            <Text style={styles.previewSectionTitle}>
              {isRunningWorkout ? 'Workout Details' : "Today's Exercises"}
            </Text>
            {(workout.exercises || []).map((exercise, index) => (
              <View key={exercise.exercise_id || index} style={styles.previewExerciseCard}>
                <View style={styles.previewExerciseHeader}>
                  <View style={[styles.previewExerciseNumber, { backgroundColor: exerciseColors[index % exerciseColors.length] }]}>
                    <Text style={styles.previewExerciseNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.previewExerciseInfo}>
                    <Text style={styles.previewExerciseName}>{exercise.name}</Text>
                    <View style={styles.previewExerciseMeta}>
                      <Ionicons name="fitness-outline" size={14} color="#6B7280" />
                      <Text style={styles.previewExerciseMetaText}>{exercise.muscle_group}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.previewExerciseDetails}>
                  {!isRunningWorkout && (
                    <View style={styles.previewDetailItem}>
                      <Text style={styles.previewDetailLabel}>Sets</Text>
                      <Text style={styles.previewDetailValue}>{exercise.sets}</Text>
                    </View>
                  )}
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetailLabel}>{isRunningWorkout ? 'Distance' : 'Reps'}</Text>
                    <Text style={styles.previewDetailValue}>{exercise.reps}</Text>
                  </View>
                  <View style={styles.previewDetailItem}>
                    <Text style={styles.previewDetailLabel}>{isRunningWorkout ? 'Pace' : 'Rest'}</Text>
                    <Text style={styles.previewDetailValue}>
                      {isRunningWorkout ? exercise.intensity : `${exercise.rest_sec}s`}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.previewExerciseEquipment}>
                  <Ionicons name="cube-outline" size={14} color="#6B7280" />
                  <Text style={styles.previewEquipmentText}>{exercise.equipment || 'Bodyweight'}</Text>
                </View>
                
                {/* Show instructions for running */}
                {isRunningWorkout && exercise.instructions && (
                  <View style={styles.exerciseInstructionsContainer}>
                    {(Array.isArray(exercise.instructions) ? exercise.instructions : [exercise.instructions]).map((inst: string, instIdx: number) => (
                      <Text key={instIdx} style={styles.exerciseInstructionText}>• {inst}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        {/* Action Buttons */}
        <View style={styles.previewActions}>
          <TouchableOpacity
            style={styles.previewBackButton}
            onPress={() => setModalStep('program')}
          >
            <Ionicons name="arrow-back-outline" size={20} color="#6B7280" />
            <Text style={styles.previewBackButtonText}>All Workouts</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.previewStartButton}
            onPress={startWorkoutFromPreview}
          >
            <Ionicons name="play-circle-outline" size={24} color="#ffffff" />
            <Text style={styles.previewStartButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // Toggle collapsible section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Goal Selection Modal with Steps
  const renderGoalSelector = () => (
    <Modal
      visible={showGoalSelector}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closeGoalSelector}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          {/* Back button for navigation between steps */}
          {modalStep !== 'goals' && (
            <TouchableOpacity
              style={styles.modalBackButton}
              onPress={() => {
                if (modalStep === 'preview') setModalStep('program');
                else if (modalStep === 'program') setModalStep('goals');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
          )}
          
          <View style={styles.modalTitleContainer}>
            <Ionicons 
              name={
                modalStep === 'goals' ? 'flag-outline' : 
                modalStep === 'program' ? 'calendar-outline' :
                'barbell-outline'
              } 
              size={24} 
              color="#4cbb17" 
            />
            <Text style={styles.modalTitle}>
              {modalStep === 'goals' ? 'Set Your Goals' : 
               modalStep === 'program' ? 'Your Program' :
               'Workout Details'}
            </Text>
          </View>
          
          {/* Forward button - shows when there's a cached program */}
          {modalStep === 'goals' && generatedProgram && (
            <TouchableOpacity
              style={styles.modalForwardButton}
              onPress={() => setModalStep('program')}
            >
              <Ionicons name="arrow-forward" size={24} color="#4cbb17" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={closeGoalSelector}
          >
            <Ionicons name="close" size={28} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Step Indicator - 3 steps */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, modalStep === 'goals' ? styles.stepDotActive : styles.stepDotCompleted]} />
          <View style={[styles.stepLine, (modalStep === 'program' || modalStep === 'preview') && styles.stepLineActive]} />
          <View style={[styles.stepDot, modalStep === 'program' ? styles.stepDotActive : (modalStep === 'preview' ? styles.stepDotCompleted : null)]} />
          <View style={[styles.stepLine, modalStep === 'preview' && styles.stepLineActive]} />
          <View style={[styles.stepDot, modalStep === 'preview' && styles.stepDotActive]} />
        </View>

        {/* Render appropriate step */}
        {modalStep === 'goals' && (
          <GoalSelection
            levelId={levelId}
            isGenerating={isGenerating}
            onLevelPress={() => {}}
            onGenerateWorkout={async (params) => {
              // Map new V2 params to legacy generateWorkout format
              console.log('[FitnessDashboard] Generate with V2 params:', params);
              
              // Set state from new params for compatibility
              setWorkoutDuration(params.duration);
              
              // Set isQuickWorkout based on mode
              setIsQuickWorkout(params.mode === 'quick');
              
              if (params.mode === 'quick') {
                // ============================================
                // QUICK MODE - Use NEW /api/fitness/quick-workout endpoint
                // ============================================
                setIsGenerating(true);
                try {
                  const authToken = await authService.getAccessToken();
                  
                  // Map workout type to API format
                  const workoutTypeMap: Record<string, 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'hiit'> = {
                    'full_body': 'full_body',
                    'upper_body': 'upper_body',
                    'lower_body': 'lower_body',
                    'core': 'core',
                    'cardio': 'cardio',
                    'hiit': 'hiit',
                  };
                  
                  // Build quick workout request
                  // Check if using full_gym preset or equipment array
                  const isFullGymPreset = params.equipment?.length === 1 && params.equipment[0] === 'full_gym';
                  
                  const quickRequest: QuickWorkoutRequest = {
                    user_id: userId,
                    workout_type: workoutTypeMap[params.workoutType || 'full_body'] || 'full_body',
                    intensity: params.intensity || 'moderate',
                    duration: params.duration,
                    mode: 'quick',
                    muscleGroups: params.targetAreas,
                    fitness_level: params.experienceLevel as any,
                    // Use equipmentPreset for full_gym, otherwise pass equipment array
                    ...(isFullGymPreset 
                      ? { equipmentPreset: 'full_gym' as const }
                      : { equipment: params.equipment?.length ? params.equipment : ['bodyweight'] }
                    ),
                  };
                  
                  console.log('[FitnessDashboard] Calling NEW /api/fitness/quick-workout with:', JSON.stringify(quickRequest, null, 2));
                  
                  // Call the NEW quick workout endpoint
                  const result = await fitnessService.generateQuickWorkout(quickRequest, authToken || undefined);
                  
                  console.log('[FitnessDashboard] Quick workout response:', JSON.stringify(result, null, 2));
                  
                  if (result.success && result.workout) {
                    // Convert quick workout response to program format for compatibility
                    const quickWorkout = result.workout;
                    
                    // Build exercises array from sections.main_workout (API returns sections, not segments)
                    const mainExercises = quickWorkout.sections?.main_workout?.exercises || [];
                    const exercises = mainExercises.map((ex: any, idx: number) => ({
                      exercise_id: ex.id || `ex_${idx}`,
                      name: ex.name,
                      target_muscle: ex.muscle_group || params.workoutType || 'full_body',
                      sets: ex.sets || 1,
                      reps: String(ex.reps || ex.duration_seconds ? `${ex.duration_seconds} sec` : '30 sec'),
                      rest_seconds: ex.rest || ex.rest_seconds || 60,
                      equipment: ex.equipment ? [ex.equipment] : params.equipment || [],
                      instructions: ex.detailedInstructions?.instructions || [],
                    }));
                    
                    // Get intensity label - handle both string and object formats
                    const intensityLabel = typeof quickWorkout.intensity === 'string' 
                      ? quickWorkout.intensity 
                      : quickWorkout.intensity_details?.label || quickWorkout.intensity?.label || 'Moderate';
                    
                    // Create a program-like structure for the preview
                    const programFormat = {
                      success: true,
                      program_id: quickWorkout.workout_id,
                      program: {
                        program_id: quickWorkout.workout_id,
                        name: quickWorkout.title || `${quickWorkout.workout_type} Workout`,
                        description: quickWorkout.subtitle || `${quickWorkout.duration_minutes} min ${intensityLabel} workout`,
                        duration_weeks: 0,
                        total_workouts: 1,
                        difficulty: intensityLabel,
                        workouts: [{
                          workout_id: quickWorkout.workout_id,
                          day: 1,
                          week: 1,
                          scheduled_date: new Date().toISOString().split('T')[0],
                          name: quickWorkout.title || `${quickWorkout.workout_type} Workout`,
                          focus: `${quickWorkout.workout_type} - ${intensityLabel}`,
                          type: 'strength' as const,
                          estimated_duration: quickWorkout.duration_minutes,
                          difficulty: intensityLabel,
                          is_rest_day: false,
                          exercises: exercises,
                          // Include warmup and cooldown from sections
                          warm_up: {
                            duration_minutes: quickWorkout.sections?.warmup?.duration_minutes || 5,
                            activities: (quickWorkout.sections?.warmup?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 60,
                            })),
                          },
                          cool_down: {
                            duration_minutes: quickWorkout.sections?.cooldown?.duration_minutes || 5,
                            activities: (quickWorkout.sections?.cooldown?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 30,
                            })),
                          },
                        }],
                      },
                    };
                    
                    setGeneratedProgram(programFormat as any);
                    setSelectedWorkoutDay(0);
                    setModalStep('program');
                  } else {
                    Alert.alert('Error', (result as any).message || 'Failed to generate quick workout');
                  }
                } catch (err) {
                  console.error('[FitnessDashboard] Quick workout error:', err);
                  Alert.alert('Error', 'Failed to generate quick workout. Please try again.');
                } finally {
                  setIsGenerating(false);
                }
              } else if (params.mode === 'routine') {
                // ============================================
                // ROUTINE MODE - Use NEW /api/fitness/quick-workout endpoint (same as Quick)
                // ============================================
                setIsGenerating(true);
                try {
                  const authToken = await authService.getAccessToken();
                  
                  // Map workout type to API format
                  const workoutTypeMap: Record<string, 'full_body' | 'upper_body' | 'lower_body' | 'core' | 'cardio' | 'hiit'> = {
                    'full_body': 'full_body',
                    'upper_body': 'upper_body',
                    'lower_body': 'lower_body',
                    'core': 'core',
                    'cardio': 'cardio',
                    'hiit': 'hiit',
                  };
                  
                  // Build workout request for Routine mode
                  // Check if using full_gym preset or equipment array
                  const isFullGymPreset = params.equipment?.length === 1 && params.equipment[0] === 'full_gym';
                  
                  // Map goal tags to API format
                  const goalMapping: Record<string, string> = {
                    'weight_loss': 'weight_loss',
                    'build_muscle': 'muscle_gain',
                    'strength': 'muscle_gain',
                    'endurance': 'endurance',
                    'flexibility': 'flexibility',
                    'general': 'general_fitness',
                  };
                  const apiGoals = (params.goalTags || []).map(g => goalMapping[g] || 'general_fitness');
                  
                  const routineRequest: QuickWorkoutRequest = {
                    user_id: userId,
                    workout_type: workoutTypeMap[params.workoutType || 'full_body'] || 'full_body',
                    intensity: params.intensity || 'moderate',
                    duration: params.duration,
                    mode: 'routine', // Use 'routine' mode for multi-day programs
                    fitness_level: params.experienceLevel as any || 'beginner',
                    muscleGroups: params.targetAreas,
                    // Routine-specific params
                    days_per_week: params.repeatPerWeek || 3,
                    goals: apiGoals.length > 0 ? apiGoals as any : ['general_fitness'],
                    // Use equipmentPreset for full_gym, otherwise pass equipment array
                    ...(isFullGymPreset 
                      ? { equipmentPreset: 'full_gym' as const }
                      : { equipment: params.equipment?.length ? params.equipment : ['bodyweight'] }
                    ),
                  };
                  
                  console.log('[FitnessDashboard] Routine mode calling /api/fitness/quick-workout with:', JSON.stringify(routineRequest, null, 2));
                  
                  // Call the workout endpoint with routine mode
                  const result = await fitnessService.generateQuickWorkout(routineRequest, authToken || undefined);
                  
                  console.log('[FitnessDashboard] Routine workout response:', JSON.stringify(result, null, 2));
                  
                  // Routine mode returns a 'routine' object with 'schedule' array
                  if (result.success && (result as any).routine) {
                    const routine = (result as any).routine;
                    
                    // Convert routine response to program format
                    // API returns routine.schedule array (not weekly_schedule)
                    const workouts = (routine.schedule || [])
                      .filter((day: any) => day.workout)
                      .map((day: any, idx: number) => {
                        const workout = day.workout;
                        // Build exercises array from sections.main_workout (API returns sections, not segments)
                        const mainExercises = workout.sections?.main_workout?.exercises || [];
                        const exercises = mainExercises.map((ex: any, exIdx: number) => ({
                          exercise_id: ex.id || `ex_${idx}_${exIdx}`,
                          name: ex.name,
                          target_muscle: ex.muscle_group || day.focus || 'full_body',
                          sets: ex.sets || 1,
                          reps: String(ex.reps || ex.duration_seconds ? `${ex.duration_seconds} sec` : '30 sec'),
                          rest_seconds: ex.rest || ex.rest_seconds || 60,
                          equipment: ex.equipment ? [ex.equipment] : params.equipment || [],
                          instructions: ex.detailedInstructions?.instructions || [],
                        }));
                        
                        return {
                          workout_id: workout.workout_id || `workout_${idx}`,
                          day: day.day_number,
                          week: 1,
                          scheduled_date: new Date().toISOString().split('T')[0],
                          name: workout.title || `${day.day_name} - ${day.focus}`,
                          focus: day.focus,
                          type: 'strength' as const,
                          estimated_duration: workout.duration_minutes || params.duration,
                          difficulty: routine.fitness_level || 'intermediate',
                          is_rest_day: false,
                          exercises: exercises,
                          warm_up: {
                            duration_minutes: workout.sections?.warmup?.duration_minutes || 5,
                            activities: (workout.sections?.warmup?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 60,
                            })),
                          },
                          cool_down: {
                            duration_minutes: workout.sections?.cooldown?.duration_minutes || 5,
                            activities: (workout.sections?.cooldown?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 30,
                            })),
                          },
                        };
                      });
                    
                    // Create a program-like structure for the preview
                    const programFormat = {
                      success: true,
                      program_id: routine.routine_id,
                      program: {
                        program_id: routine.routine_id,
                        name: `${routine.workout_type || 'Full Body'} Routine`,
                        description: `${routine.days_per_week} days/week - ${routine.duration_per_session || params.duration} min sessions`,
                        duration_weeks: 1,
                        days_per_week: routine.days_per_week,
                        total_workouts: workouts.length,
                        difficulty: routine.fitness_level || 'intermediate',
                        goals: routine.goals || [],
                        split_type: routine.workout_type || 'full_body',
                        workouts: workouts,
                      },
                    };
                    
                    setGeneratedProgram(programFormat as any);
                    setSelectedWorkoutDay(0);
                    setModalStep('program');
                  } else if (result.success && result.workout) {
                    // Fallback: API returned quick workout format instead of routine
                    console.log('[FitnessDashboard] Note: API returned quick format, converting...');
                    const quickWorkout = result.workout;
                    
                    // Build exercises array from sections.main_workout (API returns sections, not segments)
                    const mainExercises = quickWorkout.sections?.main_workout?.exercises || [];
                    const exercises = mainExercises.map((ex: any, idx: number) => ({
                      exercise_id: ex.id || `ex_${idx}`,
                      name: ex.name,
                      target_muscle: ex.muscle_group || params.workoutType || 'full_body',
                      sets: ex.sets || 1,
                      reps: String(ex.reps || ex.duration_seconds ? `${ex.duration_seconds} sec` : '30 sec'),
                      rest_seconds: ex.rest || ex.rest_seconds || 60,
                      equipment: ex.equipment ? [ex.equipment] : params.equipment || [],
                      instructions: ex.detailedInstructions?.instructions || [],
                    }));
                    
                    // Get intensity label - handle both string and object formats
                    const intensityLabel = typeof quickWorkout.intensity === 'string' 
                      ? quickWorkout.intensity 
                      : quickWorkout.intensity_details?.label || quickWorkout.intensity?.label || 'Moderate';
                    
                    // Create a program-like structure for the preview
                    const programFormat = {
                      success: true,
                      program_id: quickWorkout.workout_id,
                      program: {
                        program_id: quickWorkout.workout_id,
                        name: quickWorkout.title || `${quickWorkout.workout_type} Workout`,
                        description: quickWorkout.subtitle || `${quickWorkout.duration_minutes} min ${intensityLabel} workout`,
                        duration_weeks: 0,
                        total_workouts: 1,
                        difficulty: intensityLabel,
                        workouts: [{
                          workout_id: quickWorkout.workout_id,
                          day: 1,
                          week: 1,
                          scheduled_date: new Date().toISOString().split('T')[0],
                          name: quickWorkout.title || `${quickWorkout.workout_type} Workout`,
                          focus: `${quickWorkout.workout_type} - ${intensityLabel}`,
                          type: 'strength' as const,
                          estimated_duration: quickWorkout.duration_minutes,
                          difficulty: intensityLabel,
                          is_rest_day: false,
                          exercises: exercises,
                          warm_up: {
                            duration_minutes: quickWorkout.sections?.warmup?.duration_minutes || 5,
                            activities: (quickWorkout.sections?.warmup?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 60,
                            })),
                          },
                          cool_down: {
                            duration_minutes: quickWorkout.sections?.cooldown?.duration_minutes || 5,
                            activities: (quickWorkout.sections?.cooldown?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 30,
                            })),
                          },
                        }],
                      },
                    };
                    
                    setGeneratedProgram(programFormat as any);
                    setSelectedWorkoutDay(0);
                    setModalStep('program');
                  } else {
                    Alert.alert('Error', (result as any).message || 'Failed to generate routine workout');
                  }
                } catch (err) {
                  console.error('[FitnessDashboard] Routine workout error:', err);
                  Alert.alert('Error', 'Failed to generate routine workout. Please try again.');
                } finally {
                  setIsGenerating(false);
                }
              } else if (params.mode === 'train') {
                // ============================================
                // TRAINING MODE - Use /api/fitness/quick-workout with mode: 'training'
                // ============================================
                setIsGenerating(true);
                try {
                  const authToken = await authService.getAccessToken();
                  
                  // Determine if it's a running program or sport
                  const runningPrograms = ['couch_5k', 'c25k', '5k', '5k_improve', '10k', 'half_marathon', 'marathon'];
                  const isRunningProgram = runningPrograms.includes(params.program || '');
                  
                  // Map running program IDs to API format
                  const runningProgramMap: Record<string, string> = {
                    'couch_5k': 'running',
                    'c25k': 'running',
                    '5k_improve': 'running',
                    '5k': 'running',
                    '10k': 'running',
                    'half_marathon': 'running',
                    'marathon': 'running',
                  };
                  
                  const trainingRequest: QuickWorkoutRequest = {
                    user_id: userId,
                    mode: 'training',
                    sport: (isRunningProgram ? runningProgramMap[params.program || ''] : params.program) as any || 'general_fitness',
                    training_phase: 'pre_season', // Default to pre_season
                    fitness_level: params.experienceLevel as any || 'intermediate',
                    intensity: 'moderate',
                    duration: params.duration || 45,
                    // Use full_gym preset for sports training
                    equipmentPreset: 'full_gym',
                  };
                  
                  console.log('[FitnessDashboard] Training mode calling /api/fitness/quick-workout with:', JSON.stringify(trainingRequest, null, 2));
                  
                  // Call the workout endpoint with training mode
                  const result = await fitnessService.generateQuickWorkout(trainingRequest, authToken || undefined);
                  
                  console.log('[FitnessDashboard] Training workout response:', JSON.stringify(result, null, 2));
                  
                  if (result.success && result.workout) {
                    const trainingWorkout = result.workout;
                    
                    // Build exercises array from sections.main_workout (API returns sections, not segments)
                    const mainExercises = trainingWorkout.sections?.main_workout?.exercises || [];
                    const exercises = mainExercises.map((ex: any, idx: number) => ({
                      exercise_id: ex.id || `ex_${idx}`,
                      name: ex.name,
                      target_muscle: ex.muscle_group || 'full_body',
                      sets: ex.sets || 1,
                      reps: String(ex.reps || ex.duration_seconds ? `${ex.duration_seconds}s` : '10'),
                      rest_seconds: ex.rest || ex.rest_seconds || 60,
                      equipment: ex.equipment ? [ex.equipment] : [],
                      instructions: ex.detailedInstructions?.instructions || (ex.sport_relevance ? [ex.sport_relevance] : []),
                    }));
                    
                    // Get intensity label - handle both string and object formats
                    const intensityLabel = typeof trainingWorkout.intensity === 'string' 
                      ? trainingWorkout.intensity 
                      : trainingWorkout.intensity_details?.label || trainingWorkout.intensity?.level || 'intermediate';
                    
                    // Create a program-like structure for the preview
                    const programFormat = {
                      success: true,
                      program_id: trainingWorkout.workout_id,
                      program: {
                        program_id: trainingWorkout.workout_id,
                        name: trainingWorkout.title || `${trainingWorkout.workout_type} Training`,
                        description: trainingWorkout.subtitle || `${trainingWorkout.duration_minutes} min training workout`,
                        duration_weeks: 0,
                        total_workouts: 1,
                        difficulty: intensityLabel,
                        sport: (trainingWorkout as any).sport,
                        training_phase: (trainingWorkout as any).training_phase,
                        workouts: [{
                          workout_id: trainingWorkout.workout_id,
                          day: 1,
                          week: 1,
                          scheduled_date: new Date().toISOString().split('T')[0],
                          name: trainingWorkout.title || `${trainingWorkout.workout_type} Training`,
                          focus: (trainingWorkout as any).training_focus || trainingWorkout.workout_type,
                          type: 'sport_specific' as const,
                          estimated_duration: trainingWorkout.duration_minutes,
                          difficulty: intensityLabel,
                          is_rest_day: false,
                          exercises: exercises,
                          warm_up: {
                            duration_minutes: trainingWorkout.sections?.warmup?.duration_minutes || 5,
                            activities: (trainingWorkout.sections?.warmup?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 60,
                            })),
                          },
                          cool_down: {
                            duration_minutes: trainingWorkout.sections?.cooldown?.duration_minutes || 5,
                            activities: (trainingWorkout.sections?.cooldown?.exercises || []).map((e: any) => ({
                              name: e.name,
                              duration_seconds: e.duration_seconds || 30,
                            })),
                          },
                        }],
                      },
                    };
                    
                    setGeneratedProgram(programFormat as any);
                    setSelectedWorkoutDay(0);
                    setModalStep('program');
                  } else {
                    Alert.alert('Error', (result as any).message || 'Failed to generate training workout');
                  }
                } catch (err) {
                  console.error('[FitnessDashboard] Training workout error:', err);
                  Alert.alert('Error', 'Failed to generate training workout. Please try again.');
                } finally {
                  setIsGenerating(false);
                }
              }
            }}
          />
        )}
        {modalStep === 'program' && renderProgramOverview()}
        {modalStep === 'preview' && renderWorkoutPreview()}
      </SafeAreaView>
    </Modal>
  );

  // Workout Complete Modal
  const renderWorkoutCompleteModal = () => (
    <Modal
      visible={showWorkoutCompleteModal}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => setShowWorkoutCompleteModal(false)}
    >
      <View style={styles.workoutCompleteOverlay}>
        <View style={styles.workoutCompleteContainer}>
          <SafeAreaView style={styles.workoutCompleteSafeArea}>
            {/* Header with celebration */}
            <View style={styles.workoutCompleteHeader}>
              <View style={styles.celebrationIcon}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </View>
              <Text style={styles.workoutCompleteTitle}>Workout Complete!</Text>
              <Text style={styles.workoutCompleteSubtitle}>Great job crushing it today!</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.workoutStatsGrid}>
              <View style={styles.workoutStatCard}>
                <Ionicons name="time-outline" size={28} color="#3b82f6" />
                <Text style={styles.workoutCompleteStatValue}>{workoutSummary?.duration || '00:00'}</Text>
                <Text style={styles.workoutCompleteStatLabel}>Duration</Text>
              </View>
              <View style={styles.workoutStatCard}>
                <Ionicons name="checkmark-done-outline" size={28} color="#4cbb17" />
                <Text style={styles.workoutCompleteStatValue}>{workoutSummary?.setsCompleted || 0}</Text>
                <Text style={styles.workoutCompleteStatLabel}>Sets Completed</Text>
              </View>
              <View style={styles.workoutStatCard}>
                <Ionicons name="flame-outline" size={28} color="#f59e0b" />
                <Text style={styles.workoutCompleteStatValue}>{workoutSummary?.calories || 0}</Text>
                <Text style={styles.workoutCompleteStatLabel}>Est. Calories</Text>
              </View>
            </View>

            {/* Achievements */}
            {workoutSummary?.achievements && workoutSummary.achievements.length > 0 && (
              <View style={styles.achievementsSection}>
                <Text style={styles.achievementsSectionTitle}>
                  <Ionicons name="trophy" size={18} color="#f59e0b" /> Achievements Unlocked
                </Text>
                {workoutSummary.achievements.map((achievement, index) => (
                  <View key={index} style={styles.achievementItem}>
                    <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                      <Ionicons name={achievement.icon as any} size={24} color={achievement.color} />
                    </View>
                    <View style={styles.achievementText}>
                      <Text style={styles.achievementTitle}>{achievement.title}</Text>
                      <Text style={styles.achievementDesc}>{achievement.description}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Done Button */}
            <TouchableOpacity 
              style={styles.workoutCompleteDoneButton}
              onPress={() => setShowWorkoutCompleteModal(false)}
            >
              <Text style={styles.workoutCompleteDoneText}>Done</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );

  // Delete Confirmation Modal (Bottom Sheet Style)
  const renderDeleteConfirmationModal = () => (
    <Modal
      visible={showDeleteModal}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={() => {
        setShowDeleteModal(false);
        setProgramToDelete(null);
      }}
    >
      <View style={styles.deleteModalOverlay}>
        <TouchableOpacity 
          style={styles.deleteModalBackdrop} 
          activeOpacity={1}
          onPress={() => {
            setShowDeleteModal(false);
            setProgramToDelete(null);
          }}
        />
        <View style={styles.deleteModalContainer}>
          {/* Header */}
          <View style={styles.deleteModalHeader}>
            <View style={styles.deleteModalHandle} />
          </View>
          
          {/* Icon and Title */}
          <View style={styles.deleteModalContent}>
            <View style={styles.deleteModalIconContainer}>
              <Ionicons name="trash-outline" size={40} color="#dc2626" />
            </View>
            <Text style={styles.deleteModalTitle}>Delete Program</Text>
            <Text style={styles.deleteModalSubtitle}>
              Are you sure you want to delete "{programToDelete?.name}"?
            </Text>
            <Text style={styles.deleteModalWarning}>
              This action cannot be undone. All scheduled workouts will be removed.
            </Text>
          </View>
          
          {/* Action Buttons - with safe area bottom padding */}
          <View style={[styles.deleteModalActions, { paddingBottom: Math.max(insets.bottom, 24) + 16 }]}>
            <TouchableOpacity 
              style={styles.deleteModalCancelButton}
              onPress={() => {
                setShowDeleteModal(false);
                setProgramToDelete(null);
              }}
            >
              <Text style={styles.deleteModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteModalConfirmButton}
              onPress={confirmDeleteProgram}
              disabled={!!deletingProgramId}
            >
              {deletingProgramId ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="trash" size={18} color="#ffffff" />
                  <Text style={styles.deleteModalConfirmText}>Delete</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Horizontal Day Picker
  const renderDayPicker = () => {
    const days = getCalendarDays().filter(d => d !== null) as Date[];
    const monthName = calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <View style={styles.dayPickerContainer}>
        {/* Month Header */}
        <View style={styles.dayPickerHeader}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.dayPickerNavButton}>
            <Ionicons name="chevron-back" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.dayPickerMonthText}>{monthName}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={styles.dayPickerNavButton}>
            <Ionicons name="chevron-forward" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrolling Days */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayPickerScroll}
        >
          {days.map((date, index) => {
            const isWorkout = isWorkoutDay(date);
            const isTodayDate = isToday(date);
            const isPast = isPastDate(date);
            const isCompleted = isPast && isWorkout && isWorkoutCompleted(date);
            const isSkipped = isPast && isWorkout && !isWorkoutCompleted(date);
            const isSelected = selectedDate.toDateString() === date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            
            // Cycle through colors for upcoming workout days
            const workoutColors = [
              { bg: '#fff7ed', border: '#fa5f06', text: '#fa5f06' }, // Orange
              { bg: '#ecfdf5', border: '#4cbb17', text: '#4cbb17' }, // Green  
              { bg: '#eff6ff', border: '#3b82f6', text: '#3b82f6' }, // Blue
              { bg: '#fdf4ff', border: '#a855f7', text: '#a855f7' }, // Purple
            ];
            const colorIndex = date.getDate() % workoutColors.length;
            const workoutColor = workoutColors[colorIndex];

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayPickerItem,
                  // Upcoming workout days - colored border
                  isWorkout && !isPast && !isTodayDate && {
                    backgroundColor: workoutColor.bg,
                    borderWidth: 2,
                    borderColor: workoutColor.border,
                  },
                  // Completed past workouts - green
                  isCompleted && styles.dayPickerItemCompleted,
                  // Skipped past workouts - solid muted color
                  isSkipped && styles.dayPickerItemSkipped,
                  isTodayDate && styles.dayPickerItemToday,
                  isSelected && !isTodayDate && !isWorkout && styles.dayPickerItemSelected,
                ]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[
                  styles.dayPickerDayName,
                  isWorkout && !isPast && !isTodayDate && { color: workoutColor.text },
                  isCompleted && styles.dayPickerTextCompleted,
                  isSkipped && styles.dayPickerTextSkipped,
                  isTodayDate && styles.dayPickerTextToday,
                ]}>
                  {dayName}
                </Text>
                <Text style={[
                  styles.dayPickerDayNumber,
                  isWorkout && !isPast && !isTodayDate && { color: workoutColor.text },
                  isCompleted && styles.dayPickerTextCompleted,
                  isSkipped && styles.dayPickerTextSkipped,
                  isTodayDate && styles.dayPickerTextToday,
                ]}>
                  {date.getDate()}
                </Text>
                {/* X mark for skipped workouts */}
                {isSkipped && (
                  <View style={styles.dayPickerCheckmark}>
                    <Ionicons name="close-circle" size={14} color="#9ca3af" />
                  </View>
                )}
                {/* Dot indicator for workout days */}
                {isWorkout && !isSkipped && !isCompleted && (
                  <View style={[
                    styles.dayPickerDot,
                    { backgroundColor: isPast ? '#9ca3af' : (isTodayDate ? '#10b981' : workoutColor.border) }
                  ]} />
                )}
                {/* Checkmark for completed workouts */}
                {isCompleted && (
                  <View style={styles.dayPickerDot}>
                    <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render Exercise Execution View (during active workout)
  const renderExerciseExecution = () => {
    if (!workout || !isWorkoutActive) return null;
    
    const currentExercise = workout.exercises[currentExerciseIndex];
    if (!currentExercise) return null;
    
    const totalExercises = workout.exercises.length;
    const progress = ((currentExerciseIndex * currentExercise.sets + currentSet - 1) / 
      workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)) * 100;

    // Check if this workout can be started (previous workouts must be completed)
    const canStartWorkout = () => {
      if (!programProgress) return true; // No program context, allow
      const currentDay = programProgress.current_day;
      const completedWorkouts = programProgress.completed_workouts;
      // Allow if this is the next workout to complete or earlier
      return completedWorkouts >= currentDay - 1;
    };

    // Exit workout without completing
    const exitWorkout = () => {
      Alert.alert(
        'Exit Workout?',
        'Your progress will not be saved. You can start this workout again later.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => {
              setIsWorkoutActive(false);
              setWorkoutStartTime(null);
              setCompletedSets([]);
              setCurrentExerciseIndex(0);
              setCurrentSet(1);
              setElapsedTime(0);
            }
          }
        ]
      );
    };

    // Check if user is trying to do a workout out of order
    if (!canStartWorkout()) {
      return (
        <View style={styles.executionContainer}>
          <GradientDashboardHeader
            title="Workout Locked"
            gradient="workoutExecution"
            showBackButton
            onBackPress={exitWorkout}
            style={styles.executionHeader}
          />
          
          <View style={styles.lockedWorkoutContainer}>
            <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
            <Text style={styles.lockedWorkoutTitle}>Complete Previous Workouts First</Text>
            <Text style={styles.lockedWorkoutMessage}>
              You're on Day {programProgress?.current_day || 1} of your program.{'\n'}
              Complete your earlier workouts before starting this one.
            </Text>
            <TouchableOpacity style={styles.lockedWorkoutButton} onPress={exitWorkout}>
              <Text style={styles.lockedWorkoutButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.executionContainer}>
        {/* Gradient Header - Using GradientDashboardHeader */}
        <GradientDashboardHeader
          title="Workout"
          subtitle={`Set ${currentSet} of ${currentExercise.sets} • Exercise ${currentExerciseIndex + 1} of ${totalExercises}`}
          gradient="workoutExecution"
          showBackButton
          onBackPress={exitWorkout}
          style={styles.executionHeader}
        />

        {/* Progress Bar below header */}
        <View style={styles.executionProgressContainer}>
          <View style={styles.executionProgress}>
            <View style={[styles.executionProgressBar, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Rest Timer Overlay */}
        {restTimerActive && (
          <View style={styles.restTimerOverlay}>
            <View style={styles.restTimerContent}>
              <Ionicons name="timer-outline" size={64} color="#4cbb17" />
              <Text style={styles.restTimerTitle}>Rest Time</Text>
              <Text style={styles.restTimerValue}>{restTimeRemaining}s</Text>
              <Text style={styles.restTimerHint}>Get ready for the next set</Text>
              <TouchableOpacity style={styles.skipRestButton} onPress={skipRestTimer}>
                <Ionicons name="play-forward" size={20} color="#ffffff" />
                <Text style={styles.skipRestText}>Skip Rest</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView style={styles.executionContent} showsVerticalScrollIndicator={false}>
          {/* Exercise Card */}
          <View style={styles.executionExerciseCard}>
            <Ionicons name="barbell-outline" size={40} color="#4cbb17" />
            <Text style={styles.executionExerciseName}>{currentExercise.name}</Text>
          </View>

          {/* Exercise Info Card */}
          <View style={styles.executionInfoCard}>
            <View style={styles.executionInfoRow}>
              <Ionicons name="fitness-outline" size={22} color="#6366f1" />
              <Text style={styles.executionInfoText}>Target: {currentExercise.muscle_group}</Text>
            </View>
            <View style={styles.executionInfoRow}>
              <Ionicons name="cube-outline" size={22} color="#8b5cf6" />
              <Text style={styles.executionInfoText}>Equipment: {currentExercise.equipment || 'None (Bodyweight)'}</Text>
            </View>
            <View style={styles.executionInfoRow}>
              <Ionicons name="repeat-outline" size={22} color="#fa5f06" />
              <Text style={styles.executionInfoText}>Target: {currentExercise.reps} reps</Text>
            </View>
          </View>

          {/* Log Set Section */}
          <View style={styles.logSetSection}>
            <Text style={styles.logSetTitle}>Log Your Set</Text>
            
            <View style={styles.logInputsRow}>
              <View style={styles.logInputGroup}>
                <Text style={styles.logInputLabel}>Reps</Text>
                <TextInput
                  style={styles.logInput}
                  keyboardType="numeric"
                  placeholder={currentExercise.reps?.toString().split('-')[0] || '10'}
                  placeholderTextColor="#9ca3af"
                  value={loggedReps}
                  onChangeText={setLoggedReps}
                />
              </View>
              <View style={styles.logInputGroup}>
                <Text style={styles.logInputLabel}>Weight (lbs)</Text>
                <TextInput
                  style={styles.logInput}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#9ca3af"
                  value={loggedWeight}
                  onChangeText={setLoggedWeight}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.logSetButton} onPress={logCompletedSet}>
              <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
              <Text style={styles.logSetButtonText}>Complete Set</Text>
            </TouchableOpacity>
          </View>

          {/* Completed Sets */}
          {completedSets.filter(s => s.exercise_id === currentExercise.exercise_id).length > 0 && (
            <View style={styles.completedSetsSection}>
              <Text style={styles.completedSetsTitle}>Completed Sets</Text>
              {completedSets
                .filter(s => s.exercise_id === currentExercise.exercise_id)
                .map((set, idx) => (
                  <View key={idx} style={styles.completedSetRow}>
                    <Text style={styles.completedSetText}>
                      Set {set.set}: {set.reps} reps @ {set.weight} lbs
                    </Text>
                    <Ionicons name="checkmark" size={18} color="#4cbb17" />
                  </View>
                ))}
            </View>
          )}

          {/* Skip / End Options */}
          <View style={styles.executionActions}>
            <TouchableOpacity 
              style={styles.skipExerciseButton}
              onPress={() => {
                if (currentExerciseIndex < workout.exercises.length - 1) {
                  setCurrentExerciseIndex(prev => prev + 1);
                  setCurrentSet(1);
                } else {
                  finishActiveWorkout();
                }
              }}
            >
              <Ionicons name="play-skip-forward-outline" size={20} color="#6B7280" />
              <Text style={styles.skipExerciseText}>Skip Exercise</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.endWorkoutButton}
              onPress={finishActiveWorkout}
            >
              <Ionicons name="stop-circle-outline" size={20} color="#DC2626" />
              <Text style={styles.endWorkoutText}>End Workout</Text>
            </TouchableOpacity>
          </View>

          {/* Start Later Button */}
          <TouchableOpacity 
            style={styles.startLaterButton}
            onPress={exitWorkout}
          >
            <Ionicons name="time-outline" size={20} color="#6B7280" />
            <Text style={styles.startLaterText}>Start Later</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  // Show loading state
  if (loading && !workout) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your workout...</Text>
      </View>
    );
  }

  // Show exercise execution view when workout is active
  if (isWorkoutActive && workout) {
    return (
      <View style={styles.container}>
        {renderGoalSelector()}
        {renderWorkoutCompleteModal()}
        {renderDeleteConfirmationModal()}
        {renderExerciseExecution()}
      </View>
    );
  }

  // Temporarily simplified render for debugging
  return (
    <>
      {/* Paywall Check */}
      {!hasWorkoutAccess && (
        <UpgradePrompt
          visible={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          onUpgrade={() => {/* Navigate to subscription screen */}}
          feature="Workout Programs"
          description="Create AI-powered workout programs, track progress, and get personalized training plans with Premium."
          requiredPlan="Premium"
        />
      )}

      <View style={styles.container}>
        {renderGoalSelector()}
        {renderWorkoutCompleteModal()}
        {renderDeleteConfirmationModal()}
        
        {/* Status bar area - solid color */}
        <View style={{ height: insets.top, backgroundColor: '#fa5f06' }} />
        
        {/* Collapsing Header */}
        <Animated.View style={[styles.animatedHeader, { height: headerHeight }]}>
          <Animated.View style={[styles.animatedHeaderContent, { opacity: headerOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.animatedHeaderTitle}>{displayData.title}</Text>
            <Text style={styles.animatedHeaderSubtitle}>{displayData.subtitle}</Text>
            {workout && (
              <View style={styles.animatedHeaderStatsRow}>
                <Ionicons name="sparkles-outline" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.animatedHeaderStatsLabel}>Personalized for you</Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>
        
        {/* Create Custom Workout Button - Outside Header for split effect */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createWorkoutButtonInHeader}
            onPress={openGoalSelector}
          >
            <LinearGradient
              colors={['#4cbb17', '#22c55e']}
              style={styles.createWorkoutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle" size={28} color="#ffffff" />
              <View style={styles.createWorkoutTextContainer}>
                <Text style={styles.createWorkoutTitle}>Create Custom Workout</Text>
                <Text style={styles.createWorkoutSubtitle}>Target specific body parts & goals</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#ffffff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

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

          {/* Weather Section */}
          <TouchableOpacity
            style={[styles.weatherCard, showWeather && weather && styles.weatherCardExpanded]}
            onPress={() => {
              if (!showWeather && !weather) {
                loadWeatherData();
              }
              setShowWeather(!showWeather);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.weatherCardHeader}>
              <View style={styles.weatherCardLeft}>
                <Ionicons 
                  name={weather?.condition?.toLowerCase().includes('rain') ? 'rainy' : 
                        weather?.condition?.toLowerCase().includes('cloud') ? 'cloudy' :
                        weather?.condition?.toLowerCase().includes('snow') ? 'snow' : 'sunny'} 
                  size={28} 
                  color="#f59e0b" 
                />
                <View>
              <Text style={styles.weatherCardTitle}>
                {weatherLoading ? 'Loading...' : weather ? weather.location : 'Check Weather'}
              </Text>
              <Text style={styles.weatherCardSubtitle}>
                {weather ? weather.condition : 'Tap to load weather data'}
              </Text>
            </View>
          </View>
          {weather && (
            <Text style={styles.weatherCardTemp}>{weather.temperature}°</Text>
          )}
          <Ionicons 
            name={showWeather ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#9ca3af" 
          />
        </View>
      </TouchableOpacity>

      {showWeather && weather && (
        <View style={styles.weatherExpandedCard}>
          <View style={styles.weatherStatsRow}>
            <View style={styles.weatherStatBox}>
              <Ionicons name="water-outline" size={20} color="#3b82f6" />
              <Text style={styles.weatherStatValue}>{weather.humidity}%</Text>
              <Text style={styles.weatherStatLabel}>Humidity</Text>
            </View>
            <View style={styles.weatherStatBox}>
              <Ionicons name="flag-outline" size={20} color="#8b5cf6" />
              <Text style={styles.weatherStatValue}>{weather.windSpeed}</Text>
              <Text style={styles.weatherStatLabel}>Wind km/h</Text>
            </View>
            {weather.uvIndex !== undefined && (
              <View style={styles.weatherStatBox}>
                <Ionicons name="sunny-outline" size={20} color="#f59e0b" />
                <Text style={styles.weatherStatValue}>{weather.uvIndex}</Text>
                <Text style={styles.weatherStatLabel}>UV Index</Text>
              </View>
            )}
          </View>

          {weather.airQuality && weather.airQuality.aqi > 100 && (
            <View style={styles.weatherAlertBanner}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <View style={styles.weatherAlertContent}>
                <Text style={styles.weatherAlertTitle}>Poor Air Quality</Text>
                <Text style={styles.weatherAlertSubtitle}>Consider an indoor workout today</Text>
              </View>
            </View>
          )}

          <View style={[
            styles.weatherRecommendationBanner,
            (weather.airQuality?.aqi > 100 || weather.temperature > 35 || weather.temperature < 5) 
              ? styles.weatherIndoorBanner 
              : styles.weatherOutdoorBanner
          ]}>
            <Ionicons 
              name={(weather.airQuality?.aqi > 100 || weather.temperature > 35 || weather.temperature < 5) 
                ? "home" : "walk"} 
              size={24} 
              color={(weather.airQuality?.aqi > 100 || weather.temperature > 35 || weather.temperature < 5) 
                ? "#7c3aed" : "#059669"} 
            />
            <View style={styles.weatherRecommendationContent}>
              <Text style={[
                styles.weatherRecommendationTitle,
                (weather.airQuality?.aqi > 100 || weather.temperature > 35 || weather.temperature < 5) 
                  ? styles.weatherIndoorText : styles.weatherOutdoorText
              ]}>
                {(weather.airQuality?.aqi > 100 || weather.temperature > 35 || weather.temperature < 5) 
                  ? 'Indoor Workout Recommended' 
                  : 'Great Day for Outdoor Workout!'}
              </Text>
              {weather.healthRecommendations && weather.healthRecommendations.length > 0 && (
                <Text style={styles.weatherRecommendationTip}>
                  {weather.healthRecommendations[0]}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Your Saved Programs Section */}
      {userPrograms.length > 0 && (
        <View style={styles.savedProgramsSection}>
          <View style={styles.sectionTitleContainer}>
            <Ionicons name="folder-outline" size={20} color="#f59e0b" />
            <Text style={styles.workoutSectionTitle}>Your Programs</Text>
            <Text style={styles.programCount}>({userPrograms.length} active)</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.programsScrollView}
            contentContainerStyle={styles.programsScrollContent}
          >
            {userPrograms.map((program) => (
              <View key={program.programId} style={styles.savedProgramCard}>
                <View style={styles.savedProgramHeader}>
                  <Text style={styles.savedProgramName} numberOfLines={2}>
                    {program.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteProgramButton}
                    onPress={() => deleteProgram(program.programId, program.name)}
                    disabled={deletingProgramId === program.programId}
                  >
                    {deletingProgramId === program.programId ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    )}
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.savedProgramGoal} numberOfLines={1}>
                  {program.goal || 'Custom workout'}
                </Text>
                
                <View style={styles.savedProgramStats}>
                  <View style={styles.savedProgramStat}>
                    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
                    <Text style={styles.savedProgramStatText}>
                      {program.durationWeeks > 0 ? `${program.durationWeeks} weeks` : 'Single workout'}
                    </Text>
                  </View>
                  <View style={styles.savedProgramStat}>
                    <Ionicons name="fitness-outline" size={14} color="#6b7280" />
                    <Text style={styles.savedProgramStatText}>
                      {program.daysPerWeek || 3}x/week
                    </Text>
                  </View>
                </View>
                
                {/* Progress bar */}
                <View style={styles.savedProgramProgressContainer}>
                  <View style={styles.savedProgramProgressBar}>
                    <View 
                      style={[
                        styles.savedProgramProgressFill, 
                        { width: `${program.completionRate || 0}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.savedProgramProgressText}>
                    {program.completionRate || 0}%
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={styles.savedProgramStartButton}
                  onPress={async () => {
                    // Load the program's first pending workout
                    const authToken = await authService.getAccessToken();
                    const workoutsResponse = await fitnessService.getProgramWorkouts(
                      program.programId,
                      {},
                      authToken || undefined
                    );
                    
                    if (workoutsResponse.workouts && workoutsResponse.workouts.length > 0) {
                      // Find first non-completed, non-rest workout
                      const nextWorkout = workoutsResponse.workouts.find(
                        (w: any) => !w.is_completed && !w.is_rest_day
                      ) || workoutsResponse.workouts[0];
                      
                      // Set as current workout
                      setWorkout({
                        workout_id: nextWorkout.workout_id,
                        date: nextWorkout.scheduled_date || new Date().toISOString(),
                        phase: nextWorkout.name || program.name,
                        level: (nextWorkout as any).level || 'intermediate',
                        day_of_week: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                        estimated_duration_min: nextWorkout.estimated_duration || 30,
                        stretches: [],
                        exercises: nextWorkout.exercises?.map((ex: any) => ({
                          exercise_id: ex.exercise_id || ex.name,
                          name: ex.name,
                          sets: ex.sets || 3,
                          reps: ex.reps?.toString() || '10-12',
                          intensity: ex.intensity || 'Moderate',
                          rest_sec: ex.rest_seconds || 60,
                          muscle_group: ex.target_muscle || 'Mixed',
                          equipment: ex.equipment?.[0] || 'Bodyweight',
                          instructions: Array.isArray(ex.instructions) ? ex.instructions.join(' ') : (ex.instructions || '')
                        })) || []
                      });
                      
                      setGeneratedProgram({
                        program_id: program.programId,
                        name: program.name,
                        workouts: workoutsResponse.workouts
                      });
                      
                      setProgramProgress({
                        program_id: program.programId,
                        program_name: program.name,
                        current_week: program.currentWeek || 1,
                        current_day: 1,
                        total_weeks: program.durationWeeks || 4,
                        days_per_week: program.daysPerWeek || 3,
                        completed_workouts: Math.round((program.completionRate || 0) * (program.durationWeeks * program.daysPerWeek || 12) / 100),
                        total_workouts: program.durationWeeks * program.daysPerWeek || 12,
                        completion_percentage: program.completionRate || 0,
                        streak_days: 0,
                        next_workout_date: nextWorkout.scheduled_date || new Date().toISOString(),
                        is_rest_day: false
                      });
                    }
                  }}
                >
                  <LinearGradient
                    colors={['#4cbb17', '#22c55e']}
                    style={styles.startProgramGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="play" size={16} color="#ffffff" />
                    <Text style={styles.startProgramText}>Continue</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading Programs Indicator */}
      {programsLoading && userPrograms.length === 0 && (
        <View style={styles.programsLoadingContainer}>
          <ActivityIndicator size="small" color="#f59e0b" />
          <Text style={styles.programsLoadingText}>Loading your programs...</Text>
        </View>
      )}

      {/* Horizontal Day Picker */}
      {renderDayPicker()}

      {/* Current Workout Display (when workout exists) */}
      {workout && !isWorkoutActive && (
        <>
          {/* Program Progress Section */}
          {programProgress && (
            <>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.workoutSectionTitle}>Your Progress</Text>
            </View>
            <View style={styles.programProgressCard}>
              <View style={styles.programProgressHeader}>
                <Text style={styles.programProgressTitle}>{programProgress.program_name}</Text>
                <View style={styles.programProgressBadge}>
                  <Text style={styles.programProgressBadgeText}>
                    Week {programProgress.current_week} of {programProgress.total_weeks}
                  </Text>
                </View>
              </View>
              
              {/* Progress Bar */}
              <View style={styles.programProgressBarContainer}>
                <View style={styles.programProgressBarBackground}>
                  <View 
                    style={[
                      styles.programProgressBarFill, 
                      { width: `${programProgress.completion_percentage}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.programProgressPercentage}>
                  {programProgress.completion_percentage}% Complete
                </Text>
              </View>
              
              {/* Progress Stats */}
              <View style={styles.programProgressStats}>
                <View style={styles.programProgressStatItem}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#4cbb17" />
                  <Text style={styles.programProgressStatText}>
                    {programProgress.completed_workouts}/{programProgress.total_workouts} workouts
                  </Text>
                </View>
                <View style={styles.programProgressStatItem}>
                  <Ionicons name="flame-outline" size={16} color="#fa5f06" />
                  <Text style={styles.programProgressStatText}>
                    {programProgress.streak_days} day streak
                  </Text>
                </View>
              </View>

              {/* Progression Note (if available) */}
              {programProgress.progression_note && (
                <View style={styles.progressionNoteContainer}>
                  <Ionicons name="bulb-outline" size={16} color="#f59e0b" />
                  <Text style={styles.progressionNoteText}>
                    {programProgress.progression_note}
                  </Text>
                </View>
              )}
            </View>
            </>
          )}

          {/* REST DAY UI */}
          {programProgress?.is_rest_day && (
            <>
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.workoutSectionTitle}>Rest & Recovery</Text>
            </View>
            <View style={styles.restDayCard}>
              <View style={styles.restDayHeader}>
                <View style={styles.restDayIconContainer}>
                  <Ionicons name="moon-outline" size={48} color="#3b82f6" />
                </View>
                <Text style={styles.restDayTitle}>Rest Day</Text>
                <Text style={styles.restDaySubtitle}>
                  Your muscles are recovering and getting stronger!
                </Text>
              </View>

              <View style={styles.restDayTips}>
                <View style={styles.restDayTipItem}>
                  <View style={styles.restDayTipIconBg}>
                    <Ionicons name="water-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={styles.restDayTipContent}>
                    <Text style={styles.restDayTipTitle}>Stay Hydrated</Text>
                    <Text style={styles.restDayTipText}>Drink plenty of water for recovery</Text>
                  </View>
                </View>
                <View style={styles.restDayTipItem}>
                  <View style={styles.restDayTipIconBg}>
                    <Ionicons name="bed-outline" size={20} color="#4cbb17" />
                  </View>
                  <View style={styles.restDayTipContent}>
                    <Text style={styles.restDayTipTitle}>Get Quality Sleep</Text>
                    <Text style={styles.restDayTipText}>7-9 hours helps muscle repair</Text>
                  </View>
                </View>
                <View style={styles.restDayTipItem}>
                  <View style={styles.restDayTipIconBg}>
                    <Ionicons name="body-outline" size={20} color="#fa5f06" />
                  </View>
                  <View style={styles.restDayTipContent}>
                    <Text style={styles.restDayTipTitle}>Light Stretching</Text>
                    <Text style={styles.restDayTipText}>Optional mobility work is beneficial</Text>
                  </View>
                </View>
              </View>

              <View style={styles.nextWorkoutPreview}>
                <Text style={styles.nextWorkoutLabel}>Next Workout</Text>
                <Text style={styles.nextWorkoutDate}>
                  {new Date(programProgress.next_workout_date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
            </>
          )}

          {/* Today's Workout Section (only show if not rest day) */}
          {!programProgress?.is_rest_day && (
          <>
          {/* Section Title */}
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.workoutSectionTitle}>
              {selectedDate.toDateString() === new Date().toDateString() 
                ? `Today's Workout${todayWorkouts.length > 1 ? 's' : ''}`
                : `${selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} Workout${todayWorkouts.length > 1 ? 's' : ''}`
              }
            </Text>
            {__DEV__ && (
              <TouchableOpacity 
                style={styles.clearWorkoutButton}
                onPress={clearWorkout}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" />
                <Text style={styles.clearWorkoutButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Multiple Workouts Display */}
          {todayWorkouts.length > 1 ? (
            todayWorkouts.map((currentWorkout, workoutIndex) => (
              <View key={`workout-${workoutIndex}-${currentWorkout.workout_id || 'unknown'}`} style={styles.workoutInfoCard}>
                <View style={styles.workoutInfoHeader}>
                  <View style={styles.workoutInfoLeft}>
                    <Text style={styles.workoutInfoTitle}>
                      {currentWorkout.phase || `Workout ${workoutIndex + 1}`}
                    </Text>
                    {currentWorkout.day_of_week && (
                      <Text style={styles.workoutInfoSubtitle}>
                        {currentWorkout.day_of_week} • {currentWorkout.level ? currentWorkout.level.charAt(0).toUpperCase() + currentWorkout.level.slice(1) : 'Intermediate'}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.startNowButton}
                    activeOpacity={0.7}
                    onPress={() => {
                      setWorkout(currentWorkout);
                      setIsWorkoutActive(true);
                      setWorkoutStartTime(new Date());
                    }}
                  >
                    <Ionicons name="play-circle" size={20} color="#ffffff" />
                    <Text style={styles.startNowButtonText}>Start</Text>
                  </TouchableOpacity>
                </View>
              
                <View style={styles.workoutStatsRow}>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="time-outline" size={18} color="#3b82f6" />
                    <Text style={styles.workoutStatValue}>{currentWorkout.estimated_duration_min} min</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="layers-outline" size={18} color="#4cbb17" />
                    <Text style={styles.workoutStatValue}>{currentWorkout.exercises?.length || 0} exercises</Text>
                  </View>
                  <View style={styles.workoutStatItem}>
                    <Ionicons name="repeat-outline" size={18} color="#fa5f06" />
                    <Text style={styles.workoutStatValue}>{currentWorkout.exercises?.reduce((sum, ex) => sum + ex.sets, 0) || 0} sets</Text>
                  </View>
                </View>
              </View>
            ))
          ) : todayWorkouts.length === 0 && scheduledWorkouts.length > 0 ? (
            /* No workout for this date - show rest message */
            <View style={[styles.workoutInfoCard, { alignItems: 'center', paddingVertical: 32 }]}>
              <Ionicons name="calendar-outline" size={48} color="#9ca3af" />
              <Text style={[styles.workoutInfoTitle, { marginTop: 12, color: '#6b7280' }]}>
                No Workout Scheduled
              </Text>
              <Text style={[styles.workoutInfoSubtitle, { textAlign: 'center', marginTop: 4 }]}>
                This is a rest day. Select another date to view scheduled workouts.
              </Text>
            </View>
          ) : (
            /* Single Workout Display (original behavior) */
            <View style={styles.workoutInfoCard}>
            <View style={styles.workoutInfoHeader}>
              <View style={styles.workoutInfoLeft}>
                <Text style={styles.workoutInfoTitle}>
                  {(workout as any).session?.title || workout.phase || 'Your Workout'}
                </Text>
                {workout.day_of_week && (
                  <Text style={styles.workoutInfoSubtitle}>
                    {workout.day_of_week} • {workout.level ? workout.level.charAt(0).toUpperCase() + workout.level.slice(1) : 'Intermediate'}
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.startNowButton}
                activeOpacity={0.7}
                onPress={() => {
                  setIsWorkoutActive(true);
                  setWorkoutStartTime(new Date());
                }}
              >
                <Ionicons name="play-circle" size={20} color="#ffffff" />
                <Text style={styles.startNowButtonText}>Start</Text>
              </TouchableOpacity>
            </View>
          
            {/* Show session format breakdown if available */}
            {(workout as any).session ? (
              <View style={styles.workoutStatsRow}>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="time-outline" size={18} color="#3b82f6" />
                  <Text style={styles.workoutStatValue}>{(workout as any).session.totalMinutes || workout.estimated_duration_min} min</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="flame-outline" size={18} color="#f59e0b" />
                  <Text style={styles.workoutStatValue}>{(workout as any).session.warmupMinutes}m warmup</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="barbell-outline" size={18} color="#4cbb17" />
                  <Text style={styles.workoutStatValue}>{(workout as any).session.mainMinutes}m main</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="body-outline" size={18} color="#8b5cf6" />
                  <Text style={styles.workoutStatValue}>{(workout as any).session.cooldownMinutes}m stretch</Text>
                </View>
              </View>
            ) : (
              <View style={styles.workoutStatsRow}>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="time-outline" size={18} color="#3b82f6" />
                  <Text style={styles.workoutStatValue}>{workout.estimated_duration_min} min</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="layers-outline" size={18} color="#4cbb17" />
                  <Text style={styles.workoutStatValue}>{workout.exercises?.length || 0} exercises</Text>
                </View>
                <View style={styles.workoutStatItem}>
                  <Ionicons name="repeat-outline" size={18} color="#fa5f06" />
                  <Text style={styles.workoutStatValue}>{workout.exercises?.reduce((sum, ex) => sum + ex.sets, 0) || 0} sets</Text>
                </View>
              </View>
            )}
          </View>
          )}

          {/* Exercises Section - Only show when single workout or after selecting from multiple */}
          {(todayWorkouts.length <= 1 && workout) && (
          <>
          {/* Check for session format with warmup/main/cooldown */}
          {(workout as any).session ? (
            <>
              {/* Warmup Section */}
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="flame-outline" size={18} color="#f59e0b" style={{ marginRight: 8 }} />
                <Text style={styles.workoutSectionTitle}>Warm-up</Text>
                <Text style={styles.sectionSubtitle}>{(workout as any).session.warmupMinutes} min</Text>
              </View>
              <View style={styles.exerciseCardsContainer}>
                {(workout as any).session.warmup.map((warmupEx: WarmupExercise, index: number) => (
                  <View key={`warmup-${index}`} style={styles.exerciseCardItem}>
                    <View style={[styles.exerciseCardAccent, { backgroundColor: '#f59e0b' }]} />
                    <View style={styles.exerciseCardContent}>
                      <View style={styles.exerciseCardHeader}>
                        <Text style={styles.exerciseCardName}>{warmupEx.exercise}</Text>
                        <Text style={styles.exerciseCardMeta}>{warmupEx.duration}s</Text>
                      </View>
                      {warmupEx.notes && (
                        <Text style={styles.exerciseCardMuscle}>{warmupEx.notes}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* Main Workout Section */}
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="barbell-outline" size={18} color="#6366f1" style={{ marginRight: 8 }} />
                <Text style={styles.workoutSectionTitle}>Main Workout</Text>
                <Text style={styles.sectionSubtitle}>{(workout as any).session.mainMinutes} min</Text>
              </View>
              <View style={styles.exerciseCardsContainer}>
                {(workout as any).session.main.slice(0, 4).map((mainEx: MainExercise, index: number) => (
                  <TouchableOpacity 
                    key={`main-${index}`} 
                    style={styles.exerciseCardItem}
                    onPress={() => startWorkoutForExercise(index)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.exerciseCardAccent, { backgroundColor: exerciseColors[index % exerciseColors.length] }]} />
                    <View style={styles.exerciseCardContent}>
                      <View style={styles.exerciseCardHeader}>
                        <Text style={styles.exerciseCardName}>{mainEx.exercise}</Text>
                        <View style={styles.exerciseCardMetaContainer}>
                          <Text style={styles.exerciseCardMeta}>{mainEx.sets}×{mainEx.reps}</Text>
                          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                        </View>
                      </View>
                      <View style={styles.exerciseCardFooter}>
                        <Text style={styles.exerciseCardMuscle}>
                          {mainEx.weight ? `${mainEx.weight} weight` : 'Bodyweight'} • Rest: {mainEx.rest}s
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
                {(workout as any).session.main.length > 4 && (
                  <TouchableOpacity 
                    style={styles.moreExercisesButton}
                    onPress={() => startWorkoutForExercise(0)}
                  >
                    <Text style={styles.moreExercisesText}>
                      +{(workout as any).session.main.length - 4} more exercises
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#fa5f06" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Cooldown Section */}
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="body-outline" size={18} color="#4cbb17" style={{ marginRight: 8 }} />
                <Text style={styles.workoutSectionTitle}>Cool-down</Text>
                <Text style={styles.sectionSubtitle}>{(workout as any).session.cooldownMinutes} min</Text>
              </View>
              <View style={styles.exerciseCardsContainer}>
                {(workout as any).session.cooldown.map((cooldownStretch: CooldownStretch, index: number) => (
                  <View key={`cooldown-${index}`} style={styles.exerciseCardItem}>
                    <View style={[styles.exerciseCardAccent, { backgroundColor: '#4cbb17' }]} />
                    <View style={styles.exerciseCardContent}>
                      <View style={styles.exerciseCardHeader}>
                        <Text style={styles.exerciseCardName}>{cooldownStretch.exercise}</Text>
                        <Text style={styles.exerciseCardMeta}>
                          {cooldownStretch.duration}s{cooldownStretch.perSide ? ' /side' : ''}
                        </Text>
                      </View>
                      <Text style={styles.exerciseCardMuscle}>
                        {cooldownStretch.targetMuscles?.join(', ') || 'General recovery'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <>
              {/* Legacy Exercises Section Title */}
              <View style={styles.sectionTitleContainer}>
                <Text style={styles.workoutSectionTitle}>Exercises</Text>
              </View>

              {/* Legacy Exercise Cards */}
              <View style={styles.exerciseCardsContainer}>
                {workout.exercises?.slice(0, 4).map((exercise, index) => {
                  const overloadInfo = programProgress?.progressive_overload?.find(
                    po => po.exercise_id === exercise.exercise_id
                  );
                  return (
                    <TouchableOpacity 
                      key={exercise.exercise_id || index} 
                      style={styles.exerciseCardItem}
                      onPress={() => startWorkoutForExercise(index)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.exerciseCardAccent, { backgroundColor: exerciseColors[index % exerciseColors.length] }]} />
                      <View style={styles.exerciseCardContent}>
                        <View style={styles.exerciseCardHeader}>
                          <Text style={styles.exerciseCardName}>{exercise.name}</Text>
                          <View style={styles.exerciseCardMetaContainer}>
                            <Text style={styles.exerciseCardMeta}>{exercise.sets}×{exercise.reps}</Text>
                            <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                          </View>
                        </View>
                        <View style={styles.exerciseCardFooter}>
                          <Text style={styles.exerciseCardMuscle}>{exercise.muscle_group}</Text>
                          {overloadInfo && (
                            <View style={styles.progressiveOverloadBadge}>
                              <Ionicons name="trending-up" size={12} color="#4cbb17" />
                              <Text style={styles.progressiveOverloadText}>+{overloadInfo.increase_percentage}%</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {workout.exercises?.length > 4 && (
                  <TouchableOpacity 
                    style={styles.moreExercisesButton}
                    onPress={() => startWorkoutForExercise(0)}
                  >
                    <Text style={styles.moreExercisesText}>
                      +{workout.exercises.length - 4} more exercises
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#fa5f06" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Legacy Cool-down Stretches Section */}
              {workout.stretches && workout.stretches.length > 0 && (
                <>
                  <View style={styles.sectionTitleContainer}>
                    <Text style={styles.workoutSectionTitle}>Cool-down Stretches</Text>
                  </View>
                  <View style={styles.stretchesCard}>
                    <Ionicons name="body-outline" size={24} color="#4cbb17" />
                    <View style={styles.stretchesCardContent}>
                      <Text style={styles.stretchesCardTitle}>
                        {workout.stretches.length} stretches included
                      </Text>
                      <Text style={styles.stretchesCardSubtitle}>
                        {Math.round(workout.stretches.reduce((sum, s) => sum + s.duration_sec, 0) / 60)} min total
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>
                </>
              )}
            </>
          )}
          </>
          )}
          </>
          )}
        </>
      )}

      {/* Empty State - No Workout Yet */}
      {!workout && todayWorkouts.length === 0 && (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="barbell-outline" size={64} color="#d1d5db" />
          <Text style={styles.emptyStateTitle}>No Workout Yet</Text>
          <Text style={styles.emptyStateText}>
            Tap "Create Custom Workout" above to build your personalized fitness routine
          </Text>
        </View>
      )}

      </Animated.ScrollView>
      </View>
    </>
  );
};

export default FitnessDashboard;
