import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '../components/shared';
import SvgIcon from '../components/shared/SvgIcon';
import { useTheme } from '../context/ThemeContext';
import { AuthContext, useAuth } from '../context/AuthContext';
import { fitnessService, QuickWorkoutRequest, QuickWorkout, ProgramWorkout } from '../services/fitnessService';
import { authService } from '../services/authService';
import { useFeatureAccess } from '../hooks/usePaywall';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TrainingDashboardProps {
  isDashboardMode?: boolean;
  onBack?: () => void;
}

// Sports configuration with icons and colors
const SPORTS_CONFIG: Record<string, { icon: string; color: string; bgColor: string; label: string; description: string }> = {
  running: { icon: 'walk', color: '#3b82f6', bgColor: '#dbeafe', label: 'Running', description: '5K to Marathon training' },
  cycling: { icon: 'bicycle', color: '#f59e0b', bgColor: '#fef3c7', label: 'Cycling', description: 'Road & mountain biking' },
  swimming: { icon: 'water', color: '#06b6d4', bgColor: '#cffafe', label: 'Swimming', description: 'Pool & open water' },
  triathlon: { icon: 'medal', color: '#8b5cf6', bgColor: '#ede9fe', label: 'Triathlon', description: 'Multi-sport training' },
  basketball: { icon: 'basketball', color: '#f97316', bgColor: '#ffedd5', label: 'Basketball', description: 'Court conditioning' },
  soccer: { icon: 'football', color: '#22c55e', bgColor: '#dcfce7', label: 'Soccer', description: 'Field endurance' },
  tennis: { icon: 'tennisball', color: '#eab308', bgColor: '#fef9c3', label: 'Tennis', description: 'Agility & power' },
  golf: { icon: 'golf', color: '#10b981', bgColor: '#d1fae5', label: 'Golf', description: 'Flexibility & core' },
  hiking: { icon: 'trail-sign', color: '#84cc16', bgColor: '#ecfccb', label: 'Hiking', description: 'Trail preparation' },
  martial_arts: { icon: 'hand-left', color: '#ef4444', bgColor: '#fee2e2', label: 'Martial Arts', description: 'Combat conditioning' },
  crossfit: { icon: 'barbell', color: '#6366f1', bgColor: '#e0e7ff', label: 'CrossFit', description: 'WOD training' },
  yoga: { icon: 'body', color: '#ec4899', bgColor: '#fce7f3', label: 'Yoga', description: 'Flexibility & balance' },
  weightlifting: { icon: 'barbell', color: '#64748b', bgColor: '#f1f5f9', label: 'Weightlifting', description: 'Olympic lifts' },
  rock_climbing: { icon: 'trending-up', color: '#78716c', bgColor: '#f5f5f4', label: 'Rock Climbing', description: 'Grip & endurance' },
  skiing: { icon: 'snow', color: '#0ea5e9', bgColor: '#e0f2fe', label: 'Skiing', description: 'Winter sports prep' },
  general_fitness: { icon: 'fitness', color: '#10b981', bgColor: '#d1fae5', label: 'General Fitness', description: 'All-round conditioning' },
};

// Training phases
const TRAINING_PHASES = [
  { id: 'off_season', label: 'Off Season', description: 'Build base fitness & recovery', icon: 'refresh', color: '#64748b' },
  { id: 'pre_season', label: 'Pre Season', description: 'Increase intensity & sport-specific', icon: 'trending-up', color: '#f59e0b' },
  { id: 'in_season', label: 'In Season', description: 'Maintain & peak performance', icon: 'trophy', color: '#10b981' },
];

// Equipment presets for sport training
const EQUIPMENT_PRESETS = [
  { id: 'bodyweight', label: 'Bodyweight Only', icon: 'body-outline' },
  { id: 'basic', label: 'Basic Equipment', icon: 'home-outline' },
  { id: 'home_gym', label: 'Home Gym', icon: 'barbell-outline' },
  { id: 'full_gym', label: 'Full Gym', icon: 'fitness-outline' },
  { id: 'outdoor', label: 'Outdoor Training', icon: 'sunny-outline' },
];

// Intensity levels
const INTENSITY_LEVELS = [
  { id: 'light', label: 'Light', description: 'Recovery & mobility', color: '#22c55e' },
  { id: 'moderate', label: 'Moderate', description: 'Steady state training', color: '#f59e0b' },
  { id: 'intense', label: 'Intense', description: 'High performance', color: '#ef4444' },
];

// Workout duration options
const DURATION_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

interface GeneratedWorkout extends QuickWorkout {
  sport?: string;
  training_phase?: string;
}

const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ isDashboardMode = false, onBack }) => {
  const { user } = useContext(AuthContext);
  const { userId } = useAuth();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { width } = Dimensions.get('window');

  // Paywall check
  const hasWorkoutAccess = useFeatureAccess('workouts');
  const [showUpgrade, setShowUpgrade] = useState(false);

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sport selection state
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string>('pre_season');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('basic');
  const [selectedIntensity, setSelectedIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [selectedDuration, setSelectedDuration] = useState<number>(45);

  // Generated workout state
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Saved sport programs
  const [savedPrograms, setSavedPrograms] = useState<any[]>([]);
  const [programsLoading, setProgramsLoading] = useState(false);

  // Modal state
  const [showSportSelector, setShowSportSelector] = useState(false);
  const [showWorkoutPreview, setShowWorkoutPreview] = useState(false);

  // Recent workouts
  const [recentWorkouts, setRecentWorkouts] = useState<GeneratedWorkout[]>([]);

  // Cache key for recent workouts
  const RECENT_WORKOUTS_KEY = '@wihy_training_recent';

  // Load saved programs and recent workouts on mount
  useEffect(() => {
    loadSavedPrograms();
    loadRecentWorkouts();
  }, []);

  const loadSavedPrograms = async () => {
    try {
      setProgramsLoading(true);
      const authToken = await authService.getAccessToken();
      const response = await fitnessService.listPrograms(userId || '', authToken || undefined);
      
      // Filter to show only sport-specific programs
      const sportPrograms = (response.programs || []).filter(
        (p: any) => p.program_type === 'sport' || p.sport
      );
      setSavedPrograms(sportPrograms);
    } catch (err) {
      console.error('[TrainingDashboard] Failed to load saved programs:', err);
    } finally {
      setProgramsLoading(false);
    }
  };

  const loadRecentWorkouts = async () => {
    try {
      const cached = await AsyncStorage.getItem(RECENT_WORKOUTS_KEY);
      if (cached) {
        setRecentWorkouts(JSON.parse(cached));
      }
    } catch (err) {
      console.error('[TrainingDashboard] Failed to load recent workouts:', err);
    }
  };

  const saveRecentWorkout = async (workout: GeneratedWorkout) => {
    try {
      const updated = [workout, ...recentWorkouts.slice(0, 4)]; // Keep last 5
      setRecentWorkouts(updated);
      await AsyncStorage.setItem(RECENT_WORKOUTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('[TrainingDashboard] Failed to save recent workout:', err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedPrograms();
    await loadRecentWorkouts();
    setRefreshing(false);
  }, []);

  // Generate sport-specific workout
  const generateSportWorkout = async () => {
    if (!selectedSport) {
      Alert.alert('Select Sport', 'Please select a sport to generate a training workout.');
      return;
    }

    if (!hasWorkoutAccess) {
      setShowUpgrade(true);
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const authToken = await authService.getAccessToken();

      const request: QuickWorkoutRequest = {
        user_id: userId || '',
        mode: 'training',
        sport: selectedSport as any,
        training_phase: selectedPhase as any,
        equipmentPreset: selectedEquipment as any,
        intensity: selectedIntensity,
        duration: selectedDuration,
        fitness_level: 'intermediate', // Could be from user profile
      };

      console.log('[TrainingDashboard] Generating sport workout:', request);

      const response = await fitnessService.generateQuickWorkout(request, authToken || undefined);

      if (response.success && response.workout) {
        const workoutWithMeta: GeneratedWorkout = {
          ...response.workout,
          sport: selectedSport,
          training_phase: selectedPhase,
        };
        setGeneratedWorkout(workoutWithMeta);
        setShowWorkoutPreview(true);
        await saveRecentWorkout(workoutWithMeta);
      } else {
        Alert.alert('Error', 'Failed to generate workout. Please try again.');
      }
    } catch (err) {
      console.error('[TrainingDashboard] Generate workout error:', err);
      Alert.alert('Error', 'Failed to generate workout. Please check your connection.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render sport card
  const renderSportCard = (sportKey: string, config: typeof SPORTS_CONFIG[string]) => {
    const isSelected = selectedSport === sportKey;

    return (
      <TouchableOpacity
        key={sportKey}
        style={[
          styles.sportCard,
          { backgroundColor: theme.colors.card, borderColor: isSelected ? config.color : theme.colors.border },
          isSelected && { borderWidth: 2 },
        ]}
        onPress={() => setSelectedSport(sportKey)}
        activeOpacity={0.7}
      >
        <View style={[styles.sportIconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon as any} size={28} color={config.color} />
        </View>
        <Text style={[styles.sportLabel, { color: theme.colors.text }]}>{config.label}</Text>
        <Text style={[styles.sportDescription, { color: theme.colors.textSecondary }]} numberOfLines={1}>
          {config.description}
        </Text>
        {isSelected && (
          <View style={[styles.selectedBadge, { backgroundColor: config.color }]}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render training phase selector
  const renderPhaseSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Training Phase</Text>
      <View style={styles.phaseContainer}>
        {TRAINING_PHASES.map((phase) => (
          <TouchableOpacity
            key={phase.id}
            style={[
              styles.phaseCard,
              { backgroundColor: theme.colors.card, borderColor: selectedPhase === phase.id ? phase.color : theme.colors.border },
              selectedPhase === phase.id && { borderWidth: 2 },
            ]}
            onPress={() => setSelectedPhase(phase.id)}
          >
            <Ionicons name={phase.icon as any} size={24} color={selectedPhase === phase.id ? phase.color : theme.colors.textSecondary} />
            <Text style={[styles.phaseLabel, { color: theme.colors.text }]}>{phase.label}</Text>
            <Text style={[styles.phaseDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
              {phase.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render intensity selector
  const renderIntensitySelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Intensity Level</Text>
      <View style={styles.intensityContainer}>
        {INTENSITY_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.intensityButton,
              { backgroundColor: selectedIntensity === level.id ? level.color : theme.colors.card, borderColor: level.color },
            ]}
            onPress={() => setSelectedIntensity(level.id as any)}
          >
            <Text style={[styles.intensityLabel, { color: selectedIntensity === level.id ? '#fff' : theme.colors.text }]}>
              {level.label}
            </Text>
            <Text style={[styles.intensityDescription, { color: selectedIntensity === level.id ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary }]}>
              {level.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render duration selector
  const renderDurationSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Duration (minutes)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.durationScroll}>
        {DURATION_OPTIONS.map((duration) => (
          <TouchableOpacity
            key={duration}
            style={[
              styles.durationButton,
              { backgroundColor: selectedDuration === duration ? '#10b981' : theme.colors.card, borderColor: '#10b981' },
            ]}
            onPress={() => setSelectedDuration(duration)}
          >
            <Text style={[styles.durationLabel, { color: selectedDuration === duration ? '#fff' : theme.colors.text }]}>
              {duration}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render equipment selector
  const renderEquipmentSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Equipment Available</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.equipmentScroll}>
        {EQUIPMENT_PRESETS.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            style={[
              styles.equipmentButton,
              { backgroundColor: selectedEquipment === preset.id ? '#3b82f6' : theme.colors.card, borderColor: '#3b82f6' },
            ]}
            onPress={() => setSelectedEquipment(preset.id)}
          >
            <Ionicons
              name={preset.icon as any}
              size={20}
              color={selectedEquipment === preset.id ? '#fff' : theme.colors.textSecondary}
            />
            <Text style={[styles.equipmentLabel, { color: selectedEquipment === preset.id ? '#fff' : theme.colors.text }]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render recent workouts
  const renderRecentWorkouts = () => {
    if (recentWorkouts.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Workouts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {recentWorkouts.map((workout, index) => {
            const sportConfig = SPORTS_CONFIG[workout.sport || 'general_fitness'];
            return (
              <TouchableOpacity
                key={`${workout.workout_id}-${index}`}
                style={[styles.recentCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => {
                  setGeneratedWorkout(workout);
                  setShowWorkoutPreview(true);
                }}
              >
                <View style={[styles.recentIconContainer, { backgroundColor: sportConfig?.bgColor || '#f3f4f6' }]}>
                  <Ionicons name={(sportConfig?.icon || 'fitness') as any} size={24} color={sportConfig?.color || '#10b981'} />
                </View>
                <Text style={[styles.recentTitle, { color: theme.colors.text }]} numberOfLines={1}>
                  {workout.title}
                </Text>
                <Text style={[styles.recentMeta, { color: theme.colors.textSecondary }]}>
                  {workout.duration_minutes} min • {workout.intensity?.label || 'Moderate'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Render workout preview modal
  const renderWorkoutPreviewModal = () => {
    if (!generatedWorkout) return null;

    const sportConfig = SPORTS_CONFIG[generatedWorkout.sport || 'general_fitness'];
    const segments = generatedWorkout.segments || [];
    const sections = generatedWorkout.sections;

    // Normalize to segments format
    const displaySegments = segments.length > 0 ? segments : sections ? [
      { phase: 'warmup' as const, duration_minutes: sections.warmup?.duration_minutes || 0, exercises: sections.warmup?.exercises || [] },
      { phase: 'main' as const, duration_minutes: sections.main_workout?.duration_minutes || 0, exercises: sections.main_workout?.exercises || [] },
      { phase: 'cooldown' as const, duration_minutes: sections.cooldown?.duration_minutes || 0, exercises: sections.cooldown?.exercises || [] },
    ] : [];

    return (
      <Modal
        visible={showWorkoutPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWorkoutPreview(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowWorkoutPreview(false)} style={styles.modalCloseButton}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.modalTitleContainer}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>{generatedWorkout.title}</Text>
              <Text style={[styles.modalSubtitle, { color: theme.colors.textSecondary }]}>
                {sportConfig?.label} • {generatedWorkout.duration_minutes} min
              </Text>
            </View>
            <View style={[styles.sportBadge, { backgroundColor: sportConfig?.bgColor }]}>
              <Ionicons name={(sportConfig?.icon || 'fitness') as any} size={24} color={sportConfig?.color} />
            </View>
          </View>

          {/* Workout Stats */}
          <View style={[styles.statsRow, { backgroundColor: theme.colors.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{generatedWorkout.duration_minutes} min</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Duration</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="flame-outline" size={20} color="#ef4444" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{generatedWorkout.estimated_calories}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Calories</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color="#8b5cf6" />
              <Text style={[styles.statValue, { color: theme.colors.text }]}>{generatedWorkout.total_exercises}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Exercises</Text>
            </View>
          </View>

          {/* Workout Segments */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {displaySegments.map((segment, segmentIndex) => (
              <View key={`${segment.phase}-${segmentIndex}`} style={styles.segmentContainer}>
                <View style={styles.segmentHeader}>
                  <View style={[styles.segmentBadge, { 
                    backgroundColor: segment.phase === 'warmup' ? '#fef3c7' : 
                      segment.phase === 'main' ? '#dbeafe' : '#d1fae5' 
                  }]}>
                    <Ionicons 
                      name={segment.phase === 'warmup' ? 'sunny-outline' : 
                        segment.phase === 'main' ? 'barbell-outline' : 'leaf-outline'} 
                      size={18} 
                      color={segment.phase === 'warmup' ? '#f59e0b' : 
                        segment.phase === 'main' ? '#3b82f6' : '#10b981'} 
                    />
                  </View>
                  <Text style={[styles.segmentTitle, { color: theme.colors.text }]}>
                    {segment.phase === 'warmup' ? 'Warm Up' : 
                      segment.phase === 'main' ? 'Main Workout' : 'Cool Down'}
                  </Text>
                  <Text style={[styles.segmentDuration, { color: theme.colors.textSecondary }]}>
                    {segment.duration_minutes} min
                  </Text>
                </View>

                {segment.exercises?.map((exercise, exIndex) => (
                  <View key={`${exercise.name}-${exIndex}`} style={[styles.exerciseCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.exerciseName, { color: theme.colors.text }]}>{exercise.name}</Text>
                    <Text style={[styles.exerciseDetails, { color: theme.colors.textSecondary }]}>
                      {exercise.sets ? `${exercise.sets} sets × ` : ''}
                      {exercise.reps ? `${exercise.reps} reps` : ''}
                      {exercise.duration_seconds ? `${Math.round(exercise.duration_seconds / 60)} min` : ''}
                      {exercise.per_side ? ' (each side)' : ''}
                    </Text>
                    {exercise.instructions && (
                      <Text style={[styles.exerciseInstructions, { color: theme.colors.textSecondary }]}>
                        {exercise.instructions}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}

            {/* Equipment Used */}
            {generatedWorkout.equipment_used && generatedWorkout.equipment_used.length > 0 && (
              <View style={[styles.equipmentSection, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.equipmentTitle, { color: theme.colors.text }]}>Equipment Needed</Text>
                <View style={styles.equipmentTags}>
                  {generatedWorkout.equipment_used.map((equipment, index) => (
                    <View key={index} style={[styles.equipmentTag, { backgroundColor: theme.colors.background }]}>
                      <Text style={[styles.equipmentTagText, { color: theme.colors.text }]}>{equipment}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Start Workout Button */}
          <View style={[styles.modalFooter, { backgroundColor: theme.colors.background }]}>
            <TouchableOpacity
              style={[styles.startWorkoutButton, { backgroundColor: sportConfig?.color || '#10b981' }]}
              onPress={() => {
                setShowWorkoutPreview(false);
                Alert.alert('Workout Started!', 'Your training session has begun. Good luck!');
              }}
            >
              <Ionicons name="play" size={24} color="#fff" />
              <Text style={styles.startWorkoutText}>Start Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconContainer, { backgroundColor: '#d1fae5' }]}>
        <Ionicons name="trophy-outline" size={48} color="#10b981" />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Sport Training</Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.textSecondary }]}>
        Select your sport and training phase to generate a customized workout program.
      </Text>
    </View>
  );

  // Main render
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Status bar area - solid color */}
      <View style={{ height: insets.top, backgroundColor: '#10b981' }} />

      {/* Collapsing Header */}
      <Animated.View
        style={[
          styles.header,
          {
            height: headerHeight,
            opacity: headerOpacity,
            backgroundColor: '#10b981',
          },
        ]}
      >
        <Animated.View style={[styles.headerContent, { transform: [{ scale: titleScale }] }]}>
          <View style={styles.headerIcon}>
            <Ionicons name="trophy" size={36} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Sport Training</Text>
          <Text style={styles.headerSubtitle}>
            Sport-specific workout programs
          </Text>
        </Animated.View>
      </Animated.View>

      {/* Main Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {/* Error Display */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="warning-outline" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Recent Workouts */}
        {renderRecentWorkouts()}

        {/* Sport Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Select Your Sport</Text>
          <View style={styles.sportsGrid}>
            {Object.entries(SPORTS_CONFIG).map(([key, config]) => renderSportCard(key, config))}
          </View>
        </View>

        {/* Training Phase */}
        {selectedSport && renderPhaseSelector()}

        {/* Intensity */}
        {selectedSport && renderIntensitySelector()}

        {/* Duration */}
        {selectedSport && renderDurationSelector()}

        {/* Equipment */}
        {selectedSport && renderEquipmentSelector()}

        {/* Generate Button */}
        {selectedSport && (
          <View style={styles.generateSection}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                { backgroundColor: SPORTS_CONFIG[selectedSport]?.color || '#10b981' },
                isGenerating && styles.generateButtonDisabled,
              ]}
              onPress={generateSportWorkout}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={24} color="#fff" />
                  <Text style={styles.generateButtonText}>
                    Generate {SPORTS_CONFIG[selectedSport]?.label} Workout
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </Animated.ScrollView>

      {/* Workout Preview Modal */}
      {renderWorkoutPreviewModal()}

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgrade}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgrade(false)}
      >
        <TouchableOpacity
          style={styles.upgradeModalOverlay}
          activeOpacity={1}
          onPress={() => setShowUpgrade(false)}
        >
          <View style={[styles.upgradeModalContent, { backgroundColor: theme.colors.card }]}>
            <View style={[styles.upgradeIconContainer, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="lock-closed" size={32} color="#f59e0b" />
            </View>
            <Text style={[styles.upgradeTitle, { color: theme.colors.text }]}>Premium Feature</Text>
            <Text style={[styles.upgradeDescription, { color: theme.colors.textSecondary }]}>
              Sport-specific training programs are available with Premium subscription.
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => {
                setShowUpgrade(false);
                // Navigate to subscription
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20, // Moved here - inside header content
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    position: 'relative',
  },
  sportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sportLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  sportDescription: {
    fontSize: 11,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phaseContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  phaseCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  intensityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  intensityDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  durationScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  durationButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  equipmentScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  equipmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 12,
    gap: 8,
  },
  equipmentLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  generateSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  recentScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  recentCard: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
  },
  recentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  recentMeta: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    flex: 1,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalCloseButton: {
    padding: 8,
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sportBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  segmentContainer: {
    marginTop: 20,
  },
  segmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  segmentBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  segmentTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  segmentDuration: {
    fontSize: 13,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseDetails: {
    fontSize: 13,
    marginBottom: 4,
  },
  exerciseInstructions: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  equipmentSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  equipmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  equipmentTagText: {
    fontSize: 12,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: 32,
  },
  startWorkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  startWorkoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Upgrade modal
  upgradeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  upgradeModalContent: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  upgradeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  upgradeDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default TrainingDashboard;
