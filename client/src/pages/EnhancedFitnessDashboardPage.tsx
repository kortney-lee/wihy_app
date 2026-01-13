import React, { useState, useCallback } from 'react';
import Header from '../components/shared/Header';
import {
  FitnessLevelSelection,
  FitnessGoalSelection,
  WorkoutPreview,
  WorkoutExecution,
  FitnessCalendar,
  EnhancedFitnessDashboard,
  WorkoutConfig
} from '../components/fitness';
import {
  FitnessLevel,
  FitnessProgram,
  Workout,
  CalendarData,
  SavedProgram,
  ExerciseCompletion
} from '../types/fitness';

interface EnhancedFitnessDashboardPageProps {
  windowWidth: number;
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
  },
  {
    program_id: 'prog_002',
    name: 'Full Body Strength',
    created_at: '2025-12-15T10:00:00Z',
    duration_weeks: 6,
    total_workouts: 18,
    completed_workouts: 18,
    current_week: 6,
    current_day: 3,
    completion_percentage: 100,
    is_favorite: false,
    times_completed: 1,
    last_completed: '2025-12-28T16:00:00Z'
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
  },
  {
    id: 'w2',
    name: 'Full Body Workout',
    date: '2026-01-02T10:00:00Z',
    duration: 45,
    caloriesBurned: 420,
    muscleGroups: ['Full Body']
  }
];

const EnhancedFitnessDashboardPage: React.FC<EnhancedFitnessDashboardPageProps> = ({ 
  windowWidth 
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

  // API Base URL
  const API_BASE = 'https://services.wihy.ai/api';

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
      // In production, this would call the actual API
      // const response = await fetch(`${API_BASE}/fitness/programs/create`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${authToken}`
      //   },
      //   body: JSON.stringify({
      //     description: config.description,
      //     difficulty: config.difficulty,
      //     duration: config.duration,
      //     equipment: config.equipment,
      //     targetMuscles: config.targetMuscles,
      //     daysPerWeek: config.daysPerWeek || 3
      //   })
      // });
      // const data = await response.json();

      // Mock response for demonstration
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
                sets: config.difficulty === 'beginner' ? 3 : config.difficulty === 'intermediate' ? 4 : 4,
                reps: config.difficulty === 'beginner' ? '8-10' : config.difficulty === 'intermediate' ? '10-12' : '12-15',
                rest_seconds: config.difficulty === 'beginner' ? 120 : config.difficulty === 'intermediate' ? 90 : 60,
                equipment: ['dumbbells', 'bench'],
                instructions: [
                  'Lie flat on bench with dumbbells at chest level',
                  'Press weights up until arms fully extended',
                  'Lower slowly to starting position'
                ],
                weight_recommendation: 'Moderate - 60% of max',
                form_tips: [
                  'Keep feet flat on floor',
                  'Maintain slight arch in lower back',
                  "Don't let dumbbells touch at top"
                ]
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
                instructions: [
                  'Set bench to 30-45 degree incline',
                  'Hold dumbbells at chest level',
                  'Press weights up until arms fully extended',
                  'Lower slowly to starting position'
                ]
              },
              {
                exercise_id: 'ex_003',
                name: 'Dumbbell Flyes',
                target_muscle: 'Chest',
                sets: 3,
                reps: '12-15',
                rest_seconds: 60,
                equipment: ['dumbbells', 'bench'],
                instructions: [
                  'Lie flat on bench with dumbbells above chest',
                  'Lower dumbbells out to sides with slight bend in elbows',
                  'Bring dumbbells back together above chest'
                ]
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
                instructions: [
                  'Grip dip bars with arms straight',
                  'Lower body until upper arms parallel to ground',
                  'Push back up to starting position'
                ]
              },
              {
                exercise_id: 'ex_005',
                name: 'Overhead Tricep Extension',
                target_muscle: 'Triceps',
                sets: 3,
                reps: '12-15',
                rest_seconds: 60,
                equipment: ['dumbbell'],
                instructions: [
                  'Hold dumbbell overhead with both hands',
                  'Lower weight behind head by bending elbows',
                  'Extend arms back to starting position'
                ]
              }
            ],
            warm_up: {
              duration_minutes: 5,
              activities: [
                { name: 'Arm Circles', duration_seconds: 60 },
                { name: 'Push-ups', reps: 10 },
                { name: 'Band Pull-Aparts', reps: 15 }
              ]
            },
            cool_down: {
              duration_minutes: 5,
              activities: [
                { name: 'Chest Stretch', duration_seconds: 30 },
                { name: 'Tricep Stretch', duration_seconds: 30 },
                { name: 'Shoulder Rolls', duration_seconds: 60 }
              ]
            }
          }
        ],
        progress_tracking: {
          current_week: 1,
          current_day: 1,
          completed_workouts: 0,
          total_workouts: 12,
          completion_percentage: 0,
          next_workout: {
            workout_id: 'workout_001',
            scheduled_date: new Date().toISOString().split('T')[0],
            day: 1,
            week: 1,
            name: 'Week 1 Day 1'
          }
        }
      };

      setGeneratedProgram(mockProgram);
      setProgramId(mockProgram.program_id);
      setCurrentStep('workout-preview');
    } catch (error) {
      console.error('Failed to generate workout:', error);
      // Show error toast/notification
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Handle quick workout
  const handleQuickWorkout = useCallback((type: string, duration: number) => {
    // Pre-configure for quick workout
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
      // In production, this would call the actual API
      // await fetch(`${API_BASE}/fitness/programs/${programId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ is_favorite: true })
      // });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      // Show success notification
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
    notes?: string;
    energy_level?: 'low' | 'moderate' | 'high';
    calories_burned?: number;
  }) => {
    try {
      // In production, this would call the actual API
      // await fetch(`${API_BASE}/fitness/programs/${programId}/workouts/${workoutId}/complete`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(completionData)
      // });
      
      console.log('Workout completed:', completionData);
      setCurrentStep('workout-complete');
    } catch (error) {
      console.error('Failed to save workout completion:', error);
    }
  }, []);

  // Handle calendar view
  const handleViewCalendar = useCallback(async (selectedProgramId?: string) => {
    const targetProgramId = selectedProgramId || programId;
    
    if (targetProgramId) {
      // In production, fetch calendar data
      // const response = await fetch(
      //   `${API_BASE}/fitness/programs/${targetProgramId}/calendar?month=2026-01`,
      //   { headers: { 'Authorization': `Bearer ${authToken}` } }
      // );
      // const data = await response.json();
      // setCalendarData(data);

      // Mock calendar data
      const today = new Date();
      const mockCalendarData: CalendarData = {
        success: true,
        program_id: targetProgramId,
        program_name: 'Chest & Triceps Program',
        calendar_days: Array.from({ length: 31 }, (_, i) => {
          const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = date.getDay();
          const isRestDay = dayOfWeek === 0 || dayOfWeek === 6;
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
              is_completed: isPast && !isRestDay && Math.random() > 0.3,
              completed_at: isPast ? new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString() : undefined,
              energy_level: isPast ? 'moderate' : undefined,
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
    }
    
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
            <div className="flex items-center justify-center min-h-screen">
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
            <div className="flex items-center justify-center min-h-screen">
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
            onStartWorkout={(workoutId) => {
              // Could load specific workout here
              setCurrentStep('workout-execution');
            }}
          />
        );

      case 'workout-complete':
        return (
          <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Workout Complete! 🎉</h1>
              <p className="text-gray-600 mb-8">Great job! Your progress has been saved.</p>
              
              <div className="space-y-3">
                <button
                  onClick={() => setCurrentStep('calendar')}
                  className="w-full py-3 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600"
                >
                  View Calendar
                </button>
                <button
                  onClick={() => setCurrentStep('dashboard')}
                  className="w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200"
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
              // In production, would load the program details
              handleViewCalendar(id);
            }}
            onViewCalendar={() => handleViewCalendar()}
            onViewHistory={() => console.log('View history')}
            onChangeFitnessLevel={() => setCurrentStep('level-selection')}
          />
        );
    }
  };

  // Determine if we need the header
  const showHeader = currentStep === 'dashboard';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f7ff' }}>
      {showHeader && (
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={false}
          onSearchSubmit={() => {}}
          onChatMessage={() => {}}
          isInChatMode={false}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      )}
      
      <div style={{ 
        paddingTop: showHeader ? (windowWidth < 768 ? '120px' : '100px') : 0 
      }}>
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default EnhancedFitnessDashboardPage;
