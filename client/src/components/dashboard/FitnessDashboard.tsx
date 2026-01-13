// src/components/dashboard/FitnessDashboard.tsx
// Enhanced Fitness Dashboard - AI-Powered Workout Generation
import React, { useState, useCallback } from "react";
import {
  FitnessLevelSelection,
  FitnessGoalSelection,
  WorkoutPreview,
  WorkoutExecution,
  FitnessCalendar,
  EnhancedFitnessDashboard,
  WorkoutConfig
} from '../fitness';
import {
  FitnessLevel,
  FitnessProgram,
  CalendarData,
  SavedProgram,
  ExerciseCompletion
} from '../../types/fitness';

// Re-export types for backward compatibility
export type { ExerciseRowView, ExerciseMeta, ExercisePrescription } from "./WorkoutProgramGrid";

/**
 * Props for the FitnessDashboard component
 */
export interface FitnessDashboardProps {
  onStartSession?: (params: {
    phaseId: string;
    levelId: string;
    dayId: string;
    rows: any[];
  }) => void;
}

type FlowStep = 
  | 'dashboard'
  | 'level-selection'
  | 'goal-selection'
  | 'workout-preview'
  | 'workout-execution'
  | 'calendar'
  | 'workout-complete';

// Mock data for demonstration
const mockSavedPrograms: SavedProgram[] = [
  {
    program_id: 'prog_001',
    name: 'Chest & Triceps Program',
    created_at: '2026-01-01T10:00:00Z',
    duration_weeks: 4,
    total_workouts: 12,
    completed_workouts: 5,
    current_week: 2,
    current_day: 2,
    completion_percentage: 42,
    is_favorite: true,
    times_completed: 0,
    last_completed: '2026-01-04T14:30:00Z'
  }
];

const mockRecentWorkouts = [
  {
    id: 'w1',
    name: 'Chest & Triceps - Day 5',
    date: '2026-01-04T14:30:00Z',
    duration: 38,
    caloriesBurned: 320,
    muscleGroups: ['Chest', 'Triceps']
  }
];

/**
 * Enhanced Fitness Dashboard Component
 * Replaces the old static workout selector with AI-powered workout generation
 */
const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  onStartSession,
}) => {
  // Flow state
  const [currentStep, setCurrentStep] = useState<FlowStep>('dashboard');
  const [fitnessLevel, setFitnessLevel] = useState<FitnessLevel>('intermediate');
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  
  // Workout state
  const [generatedProgram, setGeneratedProgram] = useState<FitnessProgram | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Calendar state
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);

  // Handle fitness level selection
  const handleSelectFitnessLevel = useCallback((level: FitnessLevel) => {
    setFitnessLevel(level);
    setIsFirstTimeUser(false);
    setCurrentStep('goal-selection');
  }, []);

  // Handle workout generation
  const handleGenerateWorkout = useCallback(async (config: WorkoutConfig) => {
    setIsGenerating(true);
    
    try {
      // Simulate API call - in production, call the actual API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockProgram: FitnessProgram = {
        program_id: `prog_${Date.now()}`,
        name: config.goalText || `${config.targetMuscles.join(' & ')} Workout`,
        description: config.description,
        duration_weeks: 4,
        days_per_week: config.daysPerWeek || 3,
        difficulty: config.difficulty,
        total_workouts: 12,
        supports_quick_workouts: config.duration <= 20,
        workouts: [
          {
            workout_id: 'workout_001',
            day: 1,
            week: 1,
            scheduled_date: new Date().toISOString().split('T')[0],
            name: `Week 1 Day 1 - ${config.targetMuscles[0] || 'Full Body'} Focus`,
            focus: config.targetMuscles.length > 0 
              ? `${config.targetMuscles[0]} (Primary)${config.targetMuscles.length > 1 ? `, ${config.targetMuscles[1]} (Secondary)` : ''}`
              : 'Full Body',
            type: 'strength',
            estimated_duration: config.duration,
            difficulty: config.difficulty,
            is_rest_day: false,
            exercises: [
              {
                exercise_id: 'ex_001',
                name: 'Dumbbell Bench Press',
                target_muscle: 'Chest',
                secondary_muscles: ['Triceps', 'Shoulders'],
                sets: config.difficulty === 'beginner' ? 3 : 4,
                reps: config.difficulty === 'beginner' ? '8-10' : config.difficulty === 'intermediate' ? '10-12' : '12-15',
                rest_seconds: config.difficulty === 'beginner' ? 120 : config.difficulty === 'intermediate' ? 90 : 60,
                equipment: ['dumbbells', 'bench'],
                instructions: [
                  'Lie flat on bench with dumbbells at chest level',
                  'Press weights up until arms fully extended',
                  'Lower slowly to starting position'
                ],
                weight_recommendation: 'Moderate - 60% of max',
                form_tips: ['Keep feet flat on floor', 'Maintain slight arch in lower back']
              },
              {
                exercise_id: 'ex_002',
                name: 'Incline Dumbbell Press',
                target_muscle: 'Chest',
                secondary_muscles: ['Triceps', 'Shoulders'],
                sets: 3,
                reps: '10-12',
                rest_seconds: 90,
                equipment: ['dumbbells', 'bench'],
                instructions: ['Set bench to 30-45 degree incline', 'Press weights up until arms fully extended']
              },
              {
                exercise_id: 'ex_003',
                name: 'Dumbbell Flyes',
                target_muscle: 'Chest',
                sets: 3,
                reps: '12-15',
                rest_seconds: 60,
                equipment: ['dumbbells', 'bench'],
                instructions: ['Lie flat with dumbbells above chest', 'Lower out to sides with slight bend in elbows']
              },
              {
                exercise_id: 'ex_004',
                name: 'Tricep Dips',
                target_muscle: 'Triceps',
                secondary_muscles: ['Chest', 'Shoulders'],
                sets: 3,
                reps: '8-12',
                rest_seconds: 90,
                equipment: ['dip bars'],
                instructions: ['Grip dip bars with arms straight', 'Lower until upper arms parallel to ground']
              }
            ],
            warm_up: {
              duration_minutes: 5,
              activities: [
                { name: 'Arm Circles', duration_seconds: 60 },
                { name: 'Push-ups', reps: 10 }
              ]
            },
            cool_down: {
              duration_minutes: 5,
              activities: [
                { name: 'Chest Stretch', duration_seconds: 30 },
                { name: 'Tricep Stretch', duration_seconds: 30 }
              ]
            }
          }
        ],
        progress_tracking: {
          current_week: 1,
          current_day: 1,
          completed_workouts: 0,
          total_workouts: 12,
          completion_percentage: 0
        }
      };

      setGeneratedProgram(mockProgram);
      setProgramId(mockProgram.program_id);
      setCurrentStep('workout-preview');
    } catch (error) {
      console.error('Failed to generate workout:', error);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Handle quick workout
  const handleQuickWorkout = useCallback((type: string, duration: number) => {
    const config: WorkoutConfig = {
      description: `Quick ${duration}-minute ${type} workout`,
      difficulty: fitnessLevel,
      duration,
      equipment: ['bodyweight', 'dumbbells'],
      targetMuscles: type === 'cardio' || type === 'hiit' ? [] : ['chest', 'arms', 'core'],
      daysPerWeek: 5
    };
    handleGenerateWorkout(config);
  }, [fitnessLevel, handleGenerateWorkout]);

  // Handle program save
  const handleSaveProgram = useCallback(async () => {
    if (!programId) return;
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Program saved!');
    } catch (error) {
      console.error('Failed to save program:', error);
    } finally {
      setIsSaving(false);
    }
  }, [programId]);

  // Handle workout completion
  const handleWorkoutComplete = useCallback(async (completionData: {
    completed_at: string;
    duration_minutes: number;
    exercises_completed: ExerciseCompletion[];
  }) => {
    console.log('Workout completed:', completionData);
    
    // Call legacy onStartSession if provided for backward compatibility
    if (onStartSession && generatedProgram) {
      onStartSession({
        phaseId: 'ai-generated',
        levelId: fitnessLevel,
        dayId: 'day1',
        rows: generatedProgram.workouts[0]?.exercises || []
      });
    }
    
    setCurrentStep('workout-complete');
  }, [onStartSession, generatedProgram, fitnessLevel]);

  // Handle calendar view
  const handleViewCalendar = useCallback(async (selectedProgramId?: string) => {
    const today = new Date();
    const mockCalendarData: CalendarData = {
      success: true,
      program_id: selectedProgramId || programId || 'default',
      program_name: 'Workout Program',
      calendar_days: Array.from({ length: 31 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
        const dateStr = date.toISOString().split('T')[0];
        const isRestDay = date.getDay() === 0 || date.getDay() === 6;
        const isPast = date < today;
        
        return {
          date: dateStr,
          workouts: isRestDay ? [] : [{
            workout_id: `workout_${i + 1}`,
            name: `Week ${Math.ceil((i + 1) / 7)} Day ${(i % 7) + 1}`,
            type: 'strength',
            week: Math.ceil((i + 1) / 7),
            day: (i % 7) + 1,
            estimated_duration: 35,
            is_rest_day: false,
            is_completed: isPast && !isRestDay,
            exercise_count: 5,
            interval_count: 0
          }],
          has_workout: !isRestDay,
          has_rest_day: isRestDay,
          all_completed: isPast && !isRestDay
        };
      }),
      summary: {
        total_days: 31,
        workout_days: 22,
        rest_days: 9,
        completed_days: 8,
        completion_percentage: 36
      }
    };
    
    setCalendarData(mockCalendarData);
    setCurrentStep('calendar');
  }, [programId]);

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'level-selection':
        return (
          <FitnessLevelSelection
            onSelectLevel={handleSelectFitnessLevel}
            currentLevel={fitnessLevel}
            isOnboarding={isFirstTimeUser}
          />
        );

      case 'goal-selection':
        return (
          <FitnessGoalSelection
            fitnessLevel={fitnessLevel}
            onGenerateWorkout={handleGenerateWorkout}
            onChangeFitnessLevel={() => setCurrentStep('level-selection')}
            isGenerating={isGenerating}
          />
        );

      case 'workout-preview':
        if (!generatedProgram || !programId) {
          return (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-gray-500">No workout generated</p>
            </div>
          );
        }
        return (
          <WorkoutPreview
            program={generatedProgram}
            programId={programId}
            onStartWorkout={() => setCurrentStep('workout-execution')}
            onSaveProgram={handleSaveProgram}
            onBack={() => setCurrentStep('goal-selection')}
            isSaving={isSaving}
          />
        );

      case 'workout-execution':
        if (!generatedProgram || !programId) {
          return (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-gray-500">No workout to execute</p>
            </div>
          );
        }
        return (
          <WorkoutExecution
            program={generatedProgram}
            programId={programId}
            onComplete={handleWorkoutComplete}
            onExit={() => setCurrentStep('workout-preview')}
          />
        );

      case 'calendar':
        return (
          <FitnessCalendar
            programId={programId || 'default'}
            programName={generatedProgram?.name || calendarData?.program_name}
            calendarData={calendarData || undefined}
            onBack={() => setCurrentStep('dashboard')}
            onStartWorkout={() => setCurrentStep('workout-execution')}
          />
        );

      case 'workout-complete':
        return (
          <div className="min-h-[400px] flex items-center justify-center p-4 rounded-2xl" style={{ backgroundColor: '#f0f7ff' }}>
            <div className="max-w-md w-full text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#4cbb17' }}>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1f2937' }}>Workout Complete!</h2>
              <p className="mb-6" style={{ color: '#6b7280' }}>Great job! Your progress has been saved.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep('calendar')}
                  className="w-full py-3 text-white font-semibold rounded-xl"
                  style={{ backgroundColor: '#fa5f06' }}
                >
                  View Calendar
                </button>
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="w-full py-3 font-semibold rounded-xl"
                  style={{ backgroundColor: '#fa5f0615', color: '#fa5f06', border: '2px solid #fa5f0630' }}
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
      default:
        return (
          <EnhancedFitnessDashboard
            userFitnessLevel={fitnessLevel}
            savedPrograms={mockSavedPrograms}
            recentWorkouts={mockRecentWorkouts}
            onStartNewWorkout={() => {
              if (isFirstTimeUser) {
                setCurrentStep('level-selection');
              } else {
                setCurrentStep('goal-selection');
              }
            }}
            onQuickWorkout={handleQuickWorkout}
            onSelectProgram={(id) => {
              setProgramId(id);
              handleViewCalendar(id);
            }}
            onViewCalendar={() => handleViewCalendar()}
            onViewHistory={() => console.log('View history')}
            onChangeFitnessLevel={() => setCurrentStep('level-selection')}
          />
        );
    }
  };

  return (
    <div 
      className="w-full min-h-full"
      style={{ backgroundColor: '#e0f2fe' }}
    >
      <div className="max-w-5xl mx-auto p-4 lg:p-6">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default FitnessDashboard;

// Legacy exports for backward compatibility
export interface FitnessPhase {
  id: string;
  name: string;
}

export interface ProgramLevel {
  id: string;
  label: string;
}

export interface ProgramDay {
  id: string;
  label: string;
}

export type ProgramVariantMap = Record<string, any[]>;

export const buildProgramKey = (
  phaseId: string,
  levelId: string,
  dayId: string
): string => `${phaseId}__${levelId}__${dayId}`;

// Legacy model type for backward compatibility
export interface FitnessDashboardModel {
  title?: string;
  subtitle?: string;
  phases: FitnessPhase[];
  levels: ProgramLevel[];
  days: ProgramDay[];
  variants: ProgramVariantMap;
  programTitle?: string;
  programDescription?: string;
  defaultPhaseId?: string;
  defaultLevelId?: string;
  defaultDayId?: string;
}
