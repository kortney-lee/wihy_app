/**
 * GoalSelection Component - v2
 * 
 * 3-Mode Architecture:
 * - Quick: Single workout, no complexity
 * - Routine: Equipment-gated, conditional areas
 * - Train/Sports: Program-driven, sport-specific
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ModeToggle,
  DurationSelector,
  RepeatPerWeekSelector,
  IntensitySelector,
  EquipmentSelector,
  type WorkoutMode,
} from './components';

const { width } = Dimensions.get('window');

// ============================================
// QUICK MODE DATA
// ============================================
const QUICK_WORKOUT_TYPES = [
  { id: 'full_body', label: 'Full Body', icon: 'body-outline' },
  { id: 'upper_body', label: 'Upper Body', icon: 'fitness-outline' },
  { id: 'lower_body', label: 'Lower Body', icon: 'walk-outline' },
  { id: 'core', label: 'Core', icon: 'ellipse-outline' },
  { id: 'cardio', label: 'Cardio', icon: 'heart-outline' },
  { id: 'hiit', label: 'HIIT', icon: 'flash-outline' },
];

// ============================================
// ROUTINE MODE DATA
// ============================================
const WORKOUT_FOCUS_OPTIONS = [
  { id: 'strength', label: 'Strength', icon: 'barbell-outline' },
  { id: 'hypertrophy', label: 'Build Muscle', icon: 'fitness-outline' },
  { id: 'endurance', label: 'Endurance', icon: 'heart-outline' },
  { id: 'flexibility', label: 'Flexibility', icon: 'body-outline' },
];

const TARGET_BODY_AREAS = [
  { id: 'chest', label: 'Chest', icon: 'fitness-outline' },
  { id: 'back', label: 'Back', icon: 'body-outline' },
  { id: 'shoulders', label: 'Shoulders', icon: 'chevron-up-circle-outline' },
  { id: 'arms', label: 'Arms', icon: 'barbell-outline' },
  { id: 'legs', label: 'Legs', icon: 'walk-outline' },
  { id: 'glutes', label: 'Glutes', icon: 'heart-outline' },
  { id: 'core', label: 'Core', icon: 'flame-outline' },
];

const GOAL_TAGS = [
  { id: 'lose_weight', label: 'Lose Weight' },
  { id: 'build_muscle', label: 'Build Muscle' },
  { id: 'get_toned', label: 'Get Toned' },
  { id: 'improve_strength', label: 'Improve Strength' },
];

// ============================================
// TRAIN/SPORTS MODE DATA
// ============================================
const TRAINING_CATEGORIES = [
  { id: 'running', label: 'Running', icon: 'walk-outline' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
];

const RUNNING_PROGRAMS = [
  { id: 'couch_5k', label: '5K Starter', weeks: 8 },
  { id: '5k_improve', label: '5K Improvement', weeks: 6 },
  { id: '10k', label: '10K Training', weeks: 10 },
  { id: 'half_marathon', label: 'Half Marathon', weeks: 12 },
  { id: 'marathon', label: 'Marathon', weeks: 16 },
];

const SPORTS_PROGRAMS = [
  { id: 'soccer', label: 'Soccer', icon: 'football-outline' },
  { id: 'football', label: 'Football (American)', icon: 'american-football-outline' },
  { id: 'basketball', label: 'Basketball', icon: 'basketball-outline' },
  { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  { id: 'cycling', label: 'Cycling / Biking', icon: 'bicycle-outline' },
  { id: 'swimming', label: 'Swimming', icon: 'water-outline' },
  { id: 'baseball', label: 'Baseball / Softball', icon: 'baseball-outline' },
  { id: 'volleyball', label: 'Volleyball', icon: 'globe-outline' },
  { id: 'hockey', label: 'Hockey', icon: 'snow-outline' },
  { id: 'boxing', label: 'Boxing / MMA', icon: 'hand-left-outline' },
  { id: 'golf', label: 'Golf', icon: 'golf-outline' },
  { id: 'skiing', label: 'Skiing / Snowboarding', icon: 'snow-outline' },
  { id: 'surfing', label: 'Surfing', icon: 'water-outline' },
  { id: 'climbing', label: 'Rock Climbing', icon: 'trending-up-outline' },
  { id: 'rowing', label: 'Rowing', icon: 'boat-outline' },
  { id: 'triathlon', label: 'Triathlon', icon: 'trophy-outline' },
];

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'New to this' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some experience' },
  { id: 'advanced', label: 'Advanced', description: 'Competitive level' },
];

// ============================================
// PROPS INTERFACE
// ============================================
interface GoalSelectionProps {
  levelId: string;
  isGenerating: boolean;
  onLevelPress: () => void;
  onGenerateWorkout: (params: GenerateParams) => void;
}

interface GenerateParams {
  mode: WorkoutMode;
  duration: number;
  // Quick mode
  workoutType?: string;
  intensity?: 'light' | 'moderate' | 'intense';
  equipment?: string[];
  // Routine mode
  equipmentGate?: 'bodyweight' | 'gym';
  workoutFocus?: string;
  targetAreas?: string[];
  repeatPerWeek?: number;
  goalTags?: string[];
  // Train mode
  trainingCategory?: 'running' | 'sports';
  program?: string;
  experienceLevel?: string;
}

// ============================================
// MAIN COMPONENT
// ============================================
export const GoalSelection: React.FC<GoalSelectionProps> = ({
  levelId,
  isGenerating,
  onLevelPress,
  onGenerateWorkout,
}) => {
  // Mode state
  const [mode, setMode] = useState<WorkoutMode>('quick');
  
  // Shared state
  const [duration, setDuration] = useState(30);
  const [repeatPerWeek, setRepeatPerWeek] = useState(3);
  
  // Quick mode state
  const [quickWorkoutType, setQuickWorkoutType] = useState<string>('full_body');
  const [intensity, setIntensity] = useState<'light' | 'moderate' | 'intense'>('moderate');
  const [quickEquipment, setQuickEquipment] = useState<string[]>(['none']);
  
  // Routine mode state
  const [equipmentGate, setEquipmentGate] = useState<'bodyweight' | 'gym' | null>(null);
  const [workoutFocus, setWorkoutFocus] = useState<string | null>(null);
  // Initialize with full body areas since default workout type is full_body
  const [targetAreas, setTargetAreas] = useState<string[]>(['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core']);
  const [goalTags, setGoalTags] = useState<string[]>([]);
  const [gymEquipment, setGymEquipment] = useState<string[]>([]); // Gym equipment selection
  
  // Train mode state
  const [trainingCategory, setTrainingCategory] = useState<'running' | 'sports'>('running');
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [experienceLevel, setExperienceLevel] = useState<string>('beginner');

  // Toggle equipment selection
  const toggleQuickEquipment = (id: string) => {
    if (id === 'none') {
      setQuickEquipment(['none']);
    } else {
      setQuickEquipment(prev => {
        const filtered = prev.filter(e => e !== 'none');
        return filtered.includes(id) 
          ? filtered.filter(e => e !== id) 
          : [...filtered, id];
      });
    }
  };

  // Mapping of workout types to target areas
  const WORKOUT_TYPE_TO_AREAS: Record<string, string[]> = {
    full_body: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'],
    upper_body: ['chest', 'back', 'shoulders', 'arms'],
    lower_body: ['legs', 'glutes'],
    core: ['core'],
    cardio: [], // No specific areas
    hiit: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'], // Full body for HIIT
  };

  // Mapping of workout focus to target areas (for Routine mode)
  const WORKOUT_FOCUS_TO_AREAS: Record<string, string[]> = {
    strength: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'],
    hypertrophy: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core'],
    endurance: ['legs', 'glutes', 'core'], // Cardio/endurance focus
    flexibility: [], // Flexibility - whole body stretching
  };

  // Handle workout type selection - auto-populate target areas (Quick mode)
  const handleWorkoutTypeSelect = (typeId: string) => {
    setQuickWorkoutType(typeId);
    // Auto-populate target areas based on workout type
    const mappedAreas = WORKOUT_TYPE_TO_AREAS[typeId] || [];
    setTargetAreas(mappedAreas);
  };

  // Handle workout focus selection - auto-populate target areas (Routine mode)
  const handleWorkoutFocusSelect = (focusId: string) => {
    setWorkoutFocus(focusId);
    // Auto-populate target areas based on workout focus
    const mappedAreas = WORKOUT_FOCUS_TO_AREAS[focusId] || [];
    setTargetAreas(mappedAreas);
  };

  // Toggle target area
  const toggleTargetArea = (id: string) => {
    setTargetAreas(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  // Toggle goal tag (max 2)
  const toggleGoalTag = (id: string) => {
    setGoalTags(prev => {
      if (prev.includes(id)) return prev.filter(t => t !== id);
      if (prev.length >= 2) return prev;
      return [...prev, id];
    });
  };

  // Handle generate
  const handleGenerate = () => {
    const params: GenerateParams = {
      mode,
      duration,
    };

    // Determine equipment based on gate selection
    const getEquipmentList = () => {
      if (equipmentGate === 'gym') {
        return gymEquipment.length > 0 ? gymEquipment : ['dumbbells', 'barbell', 'cable_machine', 'bench'];
      }
      return ['none']; // Bodyweight
    };

    if (mode === 'quick') {
      params.workoutType = quickWorkoutType;
      params.workoutFocus = workoutFocus || undefined;
      params.intensity = intensity;
      params.equipment = getEquipmentList();
      params.targetAreas = targetAreas;
      params.experienceLevel = experienceLevel;
      params.equipmentGate = equipmentGate || undefined;
    } else if (mode === 'routine') {
      params.equipmentGate = equipmentGate || undefined;
      params.workoutType = quickWorkoutType;
      params.workoutFocus = workoutFocus || undefined;
      params.targetAreas = targetAreas;
      params.repeatPerWeek = repeatPerWeek;
      params.goalTags = goalTags;
      params.intensity = intensity;
      params.experienceLevel = experienceLevel;
      params.equipment = getEquipmentList();
    } else if (mode === 'train') {
      params.trainingCategory = trainingCategory;
      params.program = selectedProgram || undefined;
      params.experienceLevel = experienceLevel;
      params.repeatPerWeek = repeatPerWeek;
    }

    onGenerateWorkout(params);
  };

  // Check if can generate
  const canGenerate = () => {
    if (mode === 'quick') return !!quickWorkoutType && !!equipmentGate;
    if (mode === 'routine') return !!equipmentGate;
    if (mode === 'train') return !!selectedProgram;
    return false;
  };

  // ============================================
  // QUICK MODE RENDER
  // ============================================
  const renderQuickMode = () => (
    <>
      {/* Equipment Gate */}
      <EquipmentSelector
        mode={mode}
        variant="gate"
        selectedEquipment={[]}
        onEquipmentToggle={() => {}}
        selectedGate={equipmentGate}
        onGateSelect={setEquipmentGate}
        selectedGymEquipment={gymEquipment}
        onGymEquipmentChange={setGymEquipment}
      />

      {equipmentGate && (
        <>
          {/* Workout Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <View style={styles.chipGrid}>
              {QUICK_WORKOUT_TYPES.map((type) => {
                const isSelected = quickWorkoutType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleWorkoutTypeSelect(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Target Body Parts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Areas (optional)</Text>
            <View style={styles.chipGrid}>
              {TARGET_BODY_AREAS.map((area) => {
                const isSelected = targetAreas.includes(area.id);
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleTargetArea(area.id)}
                  >
                    <Ionicons
                      name={area.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {area.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Workout Focus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Focus</Text>
            <View style={styles.chipGrid}>
              {WORKOUT_FOCUS_OPTIONS.map((option) => {
                const isSelected = workoutFocus === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleWorkoutFocusSelect(option.id)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Fitness Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Level</Text>
            <View style={styles.levelRow}>
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = experienceLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.levelOption, isSelected && styles.levelOptionSelected]}
                    onPress={() => setExperienceLevel(level.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Intensity */}
          <IntensitySelector
            mode={mode}
            selectedIntensity={intensity}
            onIntensityChange={setIntensity}
          />

          {/* Duration */}
          <DurationSelector
            mode={mode}
            selectedDuration={duration}
            onDurationChange={setDuration}
          />
        </>
      )}
    </>
  );

  // ============================================
  // ROUTINE MODE RENDER
  // ============================================
  const renderRoutineMode = () => (
    <>
      {/* Equipment Gate */}
      <EquipmentSelector
        mode={mode}
        variant="gate"
        selectedEquipment={[]}
        onEquipmentToggle={() => {}}
        selectedGate={equipmentGate}
        onGateSelect={setEquipmentGate}
        selectedGymEquipment={gymEquipment}
        onGymEquipmentChange={setGymEquipment}
      />

      {equipmentGate && (
        <>
          {/* Workout Type - same as Quick mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Type</Text>
            <View style={styles.chipGrid}>
              {QUICK_WORKOUT_TYPES.map((type) => {
                const isSelected = quickWorkoutType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleWorkoutTypeSelect(type.id)}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Target Body Parts - same as Quick mode */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Areas (optional)</Text>
            <View style={styles.chipGrid}>
              {TARGET_BODY_AREAS.map((area) => {
                const isSelected = targetAreas.includes(area.id);
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => toggleTargetArea(area.id)}
                  >
                    <Ionicons
                      name={area.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {area.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Workout Focus */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Focus</Text>
            <View style={styles.chipGrid}>
              {WORKOUT_FOCUS_OPTIONS.map((option) => {
                const isSelected = workoutFocus === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => handleWorkoutFocusSelect(option.id)}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={18}
                      color={isSelected ? '#4cbb17' : '#6b7280'}
                    />
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Fitness Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Level</Text>
            <View style={styles.levelRow}>
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = experienceLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.levelOption, isSelected && styles.levelOptionSelected]}
                    onPress={() => setExperienceLevel(level.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Intensity */}
          <IntensitySelector
            mode={mode}
            selectedIntensity={intensity}
            onIntensityChange={setIntensity}
          />

          {/* Duration */}
          <DurationSelector
            mode={mode}
            selectedDuration={duration}
            onDurationChange={setDuration}
          />

          {/* Repeat Per Week */}
          <RepeatPerWeekSelector
            mode={mode}
            selectedDays={repeatPerWeek}
            onDaysChange={setRepeatPerWeek}
          />

          {/* Optional Goal Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitleLight}>Goal Tags (optional, max 2)</Text>
            <View style={styles.tagRow}>
              {GOAL_TAGS.map((tag) => {
                const isSelected = goalTags.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.tag, isSelected && styles.tagSelected]}
                    onPress={() => toggleGoalTag(tag.id)}
                  >
                    <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    </>
  );

  // ============================================
  // TRAIN/SPORTS MODE RENDER
  // ============================================
  const renderTrainMode = () => (
    <>
      {/* Training Category Toggle */}
      <View style={styles.section}>
        <View style={styles.categoryToggle}>
          {TRAINING_CATEGORIES.map((cat) => {
            const isSelected = trainingCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryButton, isSelected && styles.categoryButtonSelected]}
                onPress={() => {
                  setTrainingCategory(cat.id as 'running' | 'sports');
                  setSelectedProgram(null);
                }}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={20}
                  color={isSelected ? '#ffffff' : '#6b7280'}
                />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Program Picker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {trainingCategory === 'running' ? 'Select Program' : 'Select Sport'}
        </Text>
        <View style={styles.programGrid}>
          {(trainingCategory === 'running' ? RUNNING_PROGRAMS : SPORTS_PROGRAMS).map((program) => {
            const isSelected = selectedProgram === program.id;
            return (
              <TouchableOpacity
                key={program.id}
                style={[styles.programCard, isSelected && styles.programCardSelected]}
                onPress={() => setSelectedProgram(program.id)}
              >
                <Text style={[styles.programLabel, isSelected && styles.programLabelSelected]}>
                  {program.label}
                </Text>
                {'weeks' in program && (
                  <Text style={styles.programWeeks}>{program.weeks} weeks</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {selectedProgram && (
        <>
          {/* Experience Level */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Level</Text>
            <View style={styles.levelRow}>
              {EXPERIENCE_LEVELS.map((level) => {
                const isSelected = experienceLevel === level.id;
                return (
                  <TouchableOpacity
                    key={level.id}
                    style={[styles.levelOption, isSelected && styles.levelOptionSelected]}
                    onPress={() => setExperienceLevel(level.id)}
                  >
                    <Text style={[styles.levelLabel, isSelected && styles.levelLabelSelected]}>
                      {level.label}
                    </Text>
                    <Text style={styles.levelDescription}>{level.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <DurationSelector
            mode={mode}
            selectedDuration={duration}
            onDurationChange={setDuration}
          />

          {/* Repeat Per Week */}
          <RepeatPerWeekSelector
            mode={mode}
            selectedDays={repeatPerWeek}
            onDaysChange={setRepeatPerWeek}
          />
        </>
      )}
    </>
  );

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Mode Toggle */}
      <ModeToggle selectedMode={mode} onModeChange={setMode} />

      {/* Mode-specific content */}
      {mode === 'quick' && renderQuickMode()}
      {mode === 'routine' && renderRoutineMode()}
      {mode === 'train' && renderTrainMode()}

      {/* Primary CTA */}
      <TouchableOpacity
        style={[
          styles.generateButton,
          (!canGenerate() || isGenerating) && styles.generateButtonDisabled,
        ]}
        onPress={handleGenerate}
        disabled={!canGenerate() || isGenerating}
      >
        {isGenerating ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Ionicons name="flash" size={22} color="#ffffff" />
            <Text style={styles.generateButtonText}>
              {mode === 'quick' ? 'Generate Workout' : 
               mode === 'routine' ? 'Create Routine' : 
               'Start Program'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentContainer: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  sectionTitleLight: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  // Chip styles
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  chipSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  chipTextSelected: {
    color: '#166534',
    fontWeight: '600',
  },
  // Tag styles
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
  },
  tagSelected: {
    backgroundColor: '#dcfce7',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  tagTextSelected: {
    color: '#166534',
  },
  // Category toggle (Train mode)
  categoryToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    padding: 4,
  },
  categoryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  categoryButtonSelected: {
    backgroundColor: '#4cbb17',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryTextSelected: {
    color: '#ffffff',
  },
  // Program grid (Train mode)
  programGrid: {
    gap: 8,
  },
  programCard: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
  },
  programCardSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  programLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  programLabelSelected: {
    color: '#166534',
  },
  programWeeks: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Level selection (Train mode)
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  levelOptionSelected: {
    backgroundColor: '#f0fdf4',
    borderColor: '#4cbb17',
  },
  levelLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  levelLabelSelected: {
    color: '#166534',
  },
  levelDescription: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Generate button
  generateButton: {
    backgroundColor: '#4cbb17',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  generateButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default GoalSelection;
