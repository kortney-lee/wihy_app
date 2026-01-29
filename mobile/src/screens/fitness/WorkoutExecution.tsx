/**
 * WorkoutExecution Component
 * 
 * The active workout view - displays exercise, set tracking, rest timer, and completion
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '../../components/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { DailyWorkout, Exercise } from '../../services';
import { ProgramProgress, CompletedSet } from './types';
import { GradientDashboardHeader } from '../../components/shared';

interface WorkoutExecutionProps {
  workout: DailyWorkout;
  currentExerciseIndex: number;
  currentSet: number;
  completedSets: CompletedSet[];
  restTimerActive: boolean;
  restTimeRemaining: number;
  loggedReps: string;
  loggedWeight: string;
  programProgress: ProgramProgress | null;
  
  // Callbacks
  onExit: () => void;
  onLogSet: () => void;
  onSkipRestTimer: () => void;
  onSkipExercise: () => void;
  onFinishWorkout: () => void;
  onRepsChange: (reps: string) => void;
  onWeightChange: (weight: string) => void;
}

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export const WorkoutExecution: React.FC<WorkoutExecutionProps> = ({
  workout,
  currentExerciseIndex,
  currentSet,
  completedSets,
  restTimerActive,
  restTimeRemaining,
  loggedReps,
  loggedWeight,
  programProgress,
  onExit,
  onLogSet,
  onSkipRestTimer,
  onSkipExercise,
  onFinishWorkout,
  onRepsChange,
  onWeightChange,
}) => {
  const { theme } = useTheme();
  const currentExercise = workout.exercises[currentExerciseIndex];
  if (!currentExercise) return null;
  
  const totalExercises = workout.exercises.length;
  const progress = ((currentExerciseIndex * currentExercise.sets + currentSet - 1) / 
    workout.exercises.reduce((sum, ex) => sum + ex.sets, 0)) * 100;

  // Check if this workout can be started (previous workouts must be completed)
  const canStartWorkout = () => {
    if (!programProgress) return true; // No program context, allow
    const currentDay = programProgress.current_day;
    const completedWorkoutsCount = programProgress.completed_workouts;
    // Allow if this is the next workout to complete or earlier
    return completedWorkoutsCount >= currentDay - 1;
  };

  // Handle exit with confirmation
  const handleExit = () => {
    Alert.alert(
      'Exit Workout?',
      'Your progress will not be saved. You can start this workout again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: onExit,
        }
      ]
    );
  };

  // Check if user is trying to do a workout out of order
  if (!canStartWorkout()) {
    return (
      <View style={styles.container}>
        <GradientDashboardHeader
          title="Workout Locked"
          gradient="workoutExecution"
          showBackButton
          onBackPress={handleExit}
          style={styles.header}
        />
        
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
          <Text style={styles.lockedTitle}>Complete Previous Workouts First</Text>
          <Text style={styles.lockedMessage}>
            You're on Day {programProgress?.current_day || 1} of your program.{'\n'}
            Complete your earlier workouts before starting this one.
          </Text>
          <TouchableOpacity style={styles.lockedButton} onPress={handleExit}>
            <Text style={styles.lockedButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header - Using GradientDashboardHeader */}
      <GradientDashboardHeader
        title="Workout"
        subtitle={`Set ${currentSet} of ${currentExercise.sets} • Exercise ${currentExerciseIndex + 1} of ${totalExercises}`}
        gradient="workoutExecution"
        showBackButton
        onBackPress={handleExit}
        style={styles.header}
      />

      {/* Progress Bar below header */}
      <View style={styles.progressContainer}>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
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
            <TouchableOpacity style={styles.skipRestButton} onPress={onSkipRestTimer}>
              <Ionicons name="play-forward" size={20} color="#ffffff" />
              <Text style={styles.skipRestText}>Skip Rest</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Exercise Card */}
        <View style={styles.exerciseCard}>
          <Ionicons name="barbell-outline" size={40} color="#4cbb17" />
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
        </View>

        {/* Exercise Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="fitness-outline" size={22} color="#6366f1" />
            <Text style={styles.infoText}>Target: {currentExercise.muscle_group}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="cube-outline" size={22} color="#8b5cf6" />
            <Text style={styles.infoText}>Equipment: {currentExercise.equipment || 'None (Bodyweight)'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="repeat-outline" size={22} color="#fa5f06" />
            <Text style={styles.infoText}>Target: {currentExercise.reps} reps</Text>
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
                onChangeText={onRepsChange}
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
                onChangeText={onWeightChange}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.logSetButton} onPress={onLogSet}>
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
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.skipExerciseButton}
            onPress={onSkipExercise}
          >
            <Ionicons name="play-skip-forward-outline" size={20} color="#6B7280" />
            <Text style={styles.skipExerciseText}>Skip Exercise</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.endWorkoutButton}
            onPress={onFinishWorkout}
          >
            <Ionicons name="stop-circle-outline" size={20} color="#DC2626" />
            <Text style={styles.endWorkoutText}>End Workout</Text>
          </TouchableOpacity>
        </View>

        {/* Start Later Button */}
        <TouchableOpacity 
          style={styles.startLaterButton}
          onPress={handleExit}
        >
          <Ionicons name="time-outline" size={20} color="#6B7280" />
          <Text style={styles.startLaterText}>Start Later</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
  },
  header: {
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
  },
  progress: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4cbb17',
    borderRadius: 3,
  },
  restTimerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    zIndex: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restTimerContent: {
    alignItems: 'center',
    padding: 32,
  },
  restTimerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 16,
  },
  restTimerValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#4cbb17',
    marginVertical: 8,
    fontVariant: ['tabular-nums'],
  },
  restTimerHint: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 24,
  },
  skipRestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4cbb17',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  skipRestText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 24 : 16,
  },
  exerciseCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 12,
    textAlign: 'center',
  },
  infoCard: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  logSetSection: {
    // backgroundColor: '#ffffff', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  logSetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  logInputsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  logInputGroup: {
    flex: 1,
  },
  logInputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  logInput: {
    // backgroundColor: '#f9fafb', // theme.colors.surface // theme.colors.surface // Use theme.colors.surface
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    outlineStyle: 'none' as any,
  },
  logSetButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logSetButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  completedSetsSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  completedSetsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 12,
  },
  completedSetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  completedSetText: {
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  skipExerciseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    // backgroundColor: '#f3f4f6', // theme.colors.surface // theme.colors.surface // Use theme.colors.background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  skipExerciseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  endWorkoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  endWorkoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  startLaterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginBottom: 24,
  },
  startLaterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  lockedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  lockedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    textAlign: 'center',
  },
  lockedMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  lockedButton: {
    backgroundColor: '#4cbb17',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 24,
  },
  lockedButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default WorkoutExecution;
