import React, { createContext, useContext, useState, ReactNode } from 'react';

// ============================================================
// FITNESS CONTEXT - Workouts, Programs, Wellness
// ============================================================

export interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'skill';
  muscleGroups: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions?: string[];
  videoUrl?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  weight?: number;
  distance?: number;
  restTime?: number; // seconds
  notes?: string;
  completed: boolean;
}

export interface WorkoutPhase {
  id: string;
  name: 'warmup' | 'skill' | 'conditioning' | 'cooldown' | 'reflection';
  exercises: WorkoutExercise[];
  duration?: number; // total phase duration in minutes
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  userId: string; // client
  coachId?: string;
  date: Date;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  phases: WorkoutPhase[];
  totalDuration?: number; // minutes
  notes?: string;
  wellnessScore?: number; // 1-10
  energy?: number; // 1-10
  motivation?: number; // 1-10
  completedAt?: Date;
}

export interface FitnessPlan {
  id: string;
  name: string;
  userId: string; // client
  coachId?: string;
  status: 'draft' | 'active' | 'completed' | 'paused';
  startDate: Date;
  endDate?: Date;
  goals: string[];
  workoutIds: string[];
  frequency: number; // workouts per week
  createdAt: Date;
  updatedAt: Date;
}

export interface WellnessMetrics {
  userId: string;
  date: Date;
  overallScore: number; // 1-100
  energy: number; // 1-10
  sleep: number; // hours
  stress: number; // 1-10
  motivation: number; // 1-10
  nutrition: number; // 1-10
  recovery: number; // 1-10
  notes?: string;
}

interface FitnessContextType {
  // Workouts
  workoutsByUserId: Record<string, Workout[]>;
  todayWorkoutByUserId: Record<string, Workout | null>;
  
  // Fitness Plans
  activeFitnessPlanByUserId: Record<string, FitnessPlan>;
  fitnessPlans: FitnessPlan[];
  
  // Wellness
  wellnessByUserId: Record<string, WellnessMetrics[]>;
  
  // Exercise library
  exerciseLibrary: Exercise[];
  
  // Actions - Workouts
  startWorkout: (workoutId: string) => void;
  completeWorkout: (workoutId: string, wellnessData: Partial<WellnessMetrics>) => void;
  updateWorkoutExercise: (workoutId: string, phaseId: string, exerciseIndex: number, updates: Partial<WorkoutExercise>) => void;
  
  // Actions - Plans
  createFitnessPlan: (plan: Omit<FitnessPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  assignWorkoutToPlan: (planId: string, workout: Omit<Workout, 'id'>) => void;
  
  // Actions - Wellness
  recordWellnessMetrics: (userId: string, metrics: Omit<WellnessMetrics, 'userId'>) => void;
  getTodayWellness: (userId: string) => WellnessMetrics | null;
  
  // Client functions (coach view)
  getClientWorkouts: (clientId: string) => Workout[];
  createClientWorkout: (clientId: string, workout: Omit<Workout, 'id' | 'userId'>) => void;
}

const FitnessContext = createContext<FitnessContextType | undefined>(undefined);

// Mock exercise library
const mockExercises: Exercise[] = [
  {
    id: 'ex1',
    name: 'Push-ups',
    category: 'strength',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    equipment: ['bodyweight'],
    difficulty: 'beginner',
    instructions: ['Start in plank position', 'Lower chest to floor', 'Push back up']
  },
  {
    id: 'ex2', 
    name: 'Air Squats',
    category: 'strength',
    muscleGroups: ['quads', 'glutes', 'hamstrings'],
    equipment: ['bodyweight'],
    difficulty: 'beginner'
  },
  {
    id: 'ex3',
    name: 'Deadlifts',
    category: 'strength', 
    muscleGroups: ['hamstrings', 'glutes', 'erectors'],
    equipment: ['barbell'],
    difficulty: 'intermediate'
  },
  {
    id: 'ex4',
    name: '10-minute Walk',
    category: 'cardio',
    muscleGroups: ['legs'],
    equipment: ['none'],
    difficulty: 'beginner'
  }
];

// Mock workouts
const mockWorkouts: Workout[] = [
  {
    id: 'workout1',
    name: 'Upper Body Strength',
    userId: 'client1',
    coachId: 'coach1',
    date: new Date(),
    status: 'scheduled',
    phases: [
      {
        id: 'phase1',
        name: 'warmup',
        exercises: [
          { exerciseId: 'ex4', duration: 600, completed: false }
        ],
        duration: 10
      },
      {
        id: 'phase2',
        name: 'conditioning',
        exercises: [
          { exerciseId: 'ex1', sets: 3, reps: 12, restTime: 60, completed: false },
          { exerciseId: 'ex2', sets: 3, reps: 15, restTime: 60, completed: false }
        ],
        duration: 20
      }
    ],
    totalDuration: 30
  },
  {
    id: 'workout2',
    name: 'Strength Training',
    userId: 'client2',
    coachId: 'coach1',
    date: new Date(),
    status: 'completed',
    phases: [
      {
        id: 'phase3',
        name: 'conditioning',
        exercises: [
          { exerciseId: 'ex3', sets: 5, reps: 5, weight: 185, restTime: 180, completed: true }
        ]
      }
    ],
    wellnessScore: 8,
    completedAt: new Date()
  }
];

// Mock fitness plans
const mockFitnessPlans: FitnessPlan[] = [
  {
    id: 'plan1',
    name: 'Beginner Strength Program',
    userId: 'client1',
    coachId: 'coach1',
    status: 'active',
    startDate: new Date('2024-12-01'),
    goals: ['Build strength', 'Learn proper form'],
    workoutIds: ['workout1'],
    frequency: 3,
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-20')
  },
  {
    id: 'plan2',
    name: 'Powerlifting Program',
    userId: 'client2', 
    coachId: 'coach1',
    status: 'active',
    startDate: new Date('2024-11-15'),
    goals: ['Increase max lifts', 'Compete in meet'],
    workoutIds: ['workout2'],
    frequency: 4,
    createdAt: new Date('2024-11-15'),
    updatedAt: new Date('2024-12-15')
  }
];

// Mock wellness data
const mockWellnessData: Record<string, WellnessMetrics[]> = {
  'client1': [
    {
      userId: 'client1',
      date: new Date(),
      overallScore: 75,
      energy: 7,
      sleep: 7.5,
      stress: 4,
      motivation: 8,
      nutrition: 6,
      recovery: 7
    }
  ],
  'client2': [
    {
      userId: 'client2', 
      date: new Date(),
      overallScore: 85,
      energy: 9,
      sleep: 8,
      stress: 3,
      motivation: 9,
      nutrition: 8,
      recovery: 8
    }
  ]
};

export const FitnessProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workouts, setWorkouts] = useState<Workout[]>(mockWorkouts);
  const [fitnessPlans, setFitnessPlans] = useState<FitnessPlan[]>(mockFitnessPlans);
  const [wellnessData, setWellnessData] = useState<Record<string, WellnessMetrics[]>>(mockWellnessData);
  const [exerciseLibrary] = useState<Exercise[]>(mockExercises);

  // Computed values
  const workoutsByUserId = workouts.reduce((acc, workout) => {
    if (!acc[workout.userId]) acc[workout.userId] = [];
    acc[workout.userId].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  const todayWorkoutByUserId = Object.keys(workoutsByUserId).reduce((acc, userId) => {
    const todayWorkouts = workoutsByUserId[userId]?.filter(w => 
      w.date.toDateString() === new Date().toDateString()
    ) || [];
    acc[userId] = todayWorkouts[0] || null;
    return acc;
  }, {} as Record<string, Workout | null>);

  const activeFitnessPlanByUserId = fitnessPlans.reduce((acc, plan) => {
    if (plan.status === 'active') {
      acc[plan.userId] = plan;
    }
    return acc;
  }, {} as Record<string, FitnessPlan>);

  const wellnessByUserId = wellnessData;

  const startWorkout = (workoutId: string) => {
    setWorkouts(prev => 
      prev.map(workout => 
        workout.id === workoutId 
          ? { ...workout, status: 'in_progress' }
          : workout
      )
    );
  };

  const completeWorkout = (workoutId: string, wellnessData: Partial<WellnessMetrics>) => {
    setWorkouts(prev => 
      prev.map(workout => 
        workout.id === workoutId 
          ? { 
              ...workout, 
              status: 'completed',
              completedAt: new Date(),
              wellnessScore: wellnessData.overallScore,
              energy: wellnessData.energy,
              motivation: wellnessData.motivation
            }
          : workout
      )
    );

    // Record wellness metrics
    const workout = workouts.find(w => w.id === workoutId);
    if (workout) {
      recordWellnessMetrics(workout.userId, {
        date: new Date(),
        overallScore: wellnessData.overallScore || 70,
        energy: wellnessData.energy || 7,
        sleep: wellnessData.sleep || 7,
        stress: wellnessData.stress || 5,
        motivation: wellnessData.motivation || 7,
        nutrition: wellnessData.nutrition || 7,
        recovery: wellnessData.recovery || 7
      });
    }
  };

  const updateWorkoutExercise = (
    workoutId: string, 
    phaseId: string, 
    exerciseIndex: number, 
    updates: Partial<WorkoutExercise>
  ) => {
    setWorkouts(prev =>
      prev.map(workout =>
        workout.id === workoutId
          ? {
              ...workout,
              phases: workout.phases.map(phase =>
                phase.id === phaseId
                  ? {
                      ...phase,
                      exercises: phase.exercises.map((exercise, index) =>
                        index === exerciseIndex
                          ? { ...exercise, ...updates }
                          : exercise
                      )
                    }
                  : phase
              )
            }
          : workout
      )
    );
  };

  const createFitnessPlan = (planData: Omit<FitnessPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: FitnessPlan = {
      ...planData,
      id: `plan_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setFitnessPlans(prev => [...prev, newPlan]);
  };

  const assignWorkoutToPlan = (planId: string, workoutData: Omit<Workout, 'id'>) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: `workout_${Date.now()}`
    };
    
    setWorkouts(prev => [...prev, newWorkout]);
    
    setFitnessPlans(prev =>
      prev.map(plan =>
        plan.id === planId
          ? { ...plan, workoutIds: [...plan.workoutIds, newWorkout.id] }
          : plan
      )
    );
  };

  const recordWellnessMetrics = (userId: string, metrics: Omit<WellnessMetrics, 'userId'>) => {
    const newMetrics: WellnessMetrics = {
      ...metrics,
      userId
    };
    
    setWellnessData(prev => ({
      ...prev,
      [userId]: [...(prev[userId] || []), newMetrics]
    }));
  };

  const getTodayWellness = (userId: string): WellnessMetrics | null => {
    const userWellness = wellnessData[userId] || [];
    const today = new Date().toDateString();
    return userWellness.find(w => w.date.toDateString() === today) || null;
  };

  const getClientWorkouts = (clientId: string): Workout[] => {
    return workoutsByUserId[clientId] || [];
  };

  const createClientWorkout = (clientId: string, workoutData: Omit<Workout, 'id' | 'userId'>) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: `workout_${Date.now()}`,
      userId: clientId
    };
    
    setWorkouts(prev => [...prev, newWorkout]);
  };

  return (
    <FitnessContext.Provider value={{
      workoutsByUserId,
      todayWorkoutByUserId,
      activeFitnessPlanByUserId,
      fitnessPlans,
      wellnessByUserId,
      exerciseLibrary,
      startWorkout,
      completeWorkout,
      updateWorkoutExercise,
      createFitnessPlan,
      assignWorkoutToPlan,
      recordWellnessMetrics,
      getTodayWellness,
      getClientWorkouts,
      createClientWorkout
    }}>
      {children}
    </FitnessContext.Provider>
  );
};

export const useFitness = () => {
  const context = useContext(FitnessContext);
  if (context === undefined) {
    throw new Error('useFitness must be used within a FitnessProvider');
  }
  return context;
};