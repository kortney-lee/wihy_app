# WIHY Combined Programs - Fitness + Meals Integration Guide

> **Complete technical reference for combining workouts and meal plans into unified health programs**

This document describes how to create **integrated health programs** that pair fitness workouts with personalized meal plans, maximizing the 7+ billion fitness combinations with 10+ billion meal combinations for **70+ TRILLION** unique program possibilities.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Integration Strategy](#integration-strategy)
3. [Client-Side vs Service-Side](#client-side-vs-service-side)
4. [Goal-Based Pairing Logic](#goal-based-pairing-logic)
5. [Combined Program Types](#combined-program-types)
6. [API Integration](#api-integration)
7. [Sync Rules](#sync-rules)
8. [Implementation Examples](#implementation-examples)
9. [Data Models](#data-models)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    WIHY COMBINED HEALTH PROGRAMS                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────────────┐         ┌─────────────────────┐              │
│   │   FITNESS MODULE    │         │    MEALS MODULE     │              │
│   │   (~7B combos)      │◄───────►│    (~10B combos)    │              │
│   │                     │  SYNC   │                     │              │
│   │ • Quick Workout     │         │ • Quick Meal        │              │
│   │ • Routine Program   │         │ • Meal Plan         │              │
│   │ • Training Mode     │         │ • Diet Program      │              │
│   └─────────────────────┘         └─────────────────────┘              │
│              │                              │                           │
│              └──────────────┬───────────────┘                           │
│                             ▼                                           │
│              ┌─────────────────────────────┐                           │
│              │   COMBINED PROGRAM ENGINE   │                           │
│              │   (70+ TRILLION combos)     │                           │
│              │                             │                           │
│              │ • Goal Alignment            │                           │
│              │ • Calorie Sync              │                           │
│              │ • Timing Coordination       │                           │
│              │ • Progress Tracking         │                           │
│              └─────────────────────────────┘                           │
│                             │                                           │
│                             ▼                                           │
│              ┌─────────────────────────────┐                           │
│              │     USER DASHBOARD          │                           │
│              │  "Your Complete Program"    │                           │
│              └─────────────────────────────┘                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Strategy

### Why Combine?

| Standalone | Combined | Benefit |
|------------|----------|---------|
| Workout burns 400 cal | Meal plan accounts for burn | Accurate calorie balance |
| Generic meal plan | Post-workout nutrition timing | Optimized recovery |
| Separate tracking | Unified progress dashboard | Holistic view |
| Mismatched goals | Aligned fitness + nutrition | Better results |

### Combination Math

```
Total Combined Combinations:
  Fitness Combinations:     ~7,000,000,000 (7 billion)
  × Meal Combinations:     ~10,000,000,000 (10 billion)
  
  = 70,000,000,000,000,000,000 (70 quintillion)
  
Practical Combined Programs (90% coverage):
  Fitness Core Scenarios:   76
  × Meal Core Scenarios:    92
  
  = 6,992 core combined programs
```

---

## Client-Side vs Service-Side

### Recommendation: **Hybrid Approach**

| Component | Where | Why |
|-----------|-------|-----|
| Goal Alignment | **Client** | Fast, no API call needed |
| Calorie Calculation | **Client** | User profile already local |
| Program Pairing | **Client** | Simple rule-based matching |
| Workout Generation | **Service** | AI-powered, complex logic |
| Meal Plan Generation | **Service** | AI-powered, complex logic |
| Progress Tracking | **Both** | Local cache + cloud sync |

### Client-Side Logic (Recommended)

```typescript
// src/services/combinedProgramService.ts

interface CombinedProgram {
  id: string;
  goal: CombinedGoal;
  fitness: {
    mode: 'quick' | 'routine' | 'training';
    programId?: string;
    workoutSchedule: WorkoutDay[];
  };
  meals: {
    mode: 'quick' | 'plan' | 'diet';
    programId?: string;
    mealPlanId?: string;
  };
  sync: {
    calorieAdjustment: boolean;
    postWorkoutMeals: boolean;
    restDayNutrition: boolean;
  };
  duration: number; // days
  startDate: string;
}

type CombinedGoal = 
  | 'weight_loss'
  | 'muscle_gain'
  | 'maintenance'
  | 'athletic_performance'
  | 'general_health'
  | 'body_recomposition';

// Goal-based auto-pairing
const GOAL_PAIRINGS: Record<CombinedGoal, GoalPairing> = {
  weight_loss: {
    fitness: {
      preferredModes: ['routine', 'quick'],
      workoutTypes: ['hiit', 'cardio', 'full_body'],
      daysPerWeek: [3, 4, 5],
      intensity: 'moderate',
    },
    meals: {
      preferredModes: ['diet', 'plan'],
      fitnessGoal: 'weight_loss',
      calorieApproach: 'deficit',
      proteinTarget: 'high',
      diets: ['mediterranean', 'high_protein', 'low_carb'],
    },
  },
  muscle_gain: {
    fitness: {
      preferredModes: ['routine', 'training'],
      workoutTypes: ['strength', 'upper_body', 'lower_body'],
      daysPerWeek: [4, 5, 6],
      intensity: 'moderate_to_intense',
    },
    meals: {
      preferredModes: ['diet', 'plan'],
      fitnessGoal: 'muscle_gain',
      calorieApproach: 'surplus',
      proteinTarget: 'very_high',
      diets: ['high_protein'],
    },
  },
  // ... more goals
};
```

### Service-Side (Only for Complex AI)

Service endpoints are only called when generating the actual content:

```typescript
// Fitness generation - calls service
const workout = await fitnessService.generateQuickWorkout(fitnessParams);

// Meal generation - calls service  
const mealPlan = await mealService.createMealPlanFromDescription(mealParams);

// Combination logic - CLIENT SIDE (no service needed)
const combinedProgram = createCombinedProgram(workout, mealPlan, userGoal);
```

---

## Goal-Based Pairing Logic

### Pairing Matrix

| User Goal | Fitness Mode | Meal Mode | Calorie Sync | Special Rules |
|-----------|-------------|-----------|--------------|---------------|
| Weight Loss | Routine (3-5x/week) | Diet (deficit) | Workout burns add to deficit | High protein, low carb on rest days |
| Muscle Gain | Routine (4-6x/week) | Diet (surplus) | Post-workout carb boost | Protein timing around workouts |
| Maintenance | Routine (3-4x/week) | Plan (balanced) | Match TDEE + burns | Flexible macros |
| Athletic Performance | Training (sport-specific) | Diet (performance) | Periodized nutrition | Pre/post workout focus |
| General Health | Quick/Routine (2-4x/week) | Plan (healthy) | Balanced approach | Mediterranean/whole foods |
| Body Recomp | Routine (4-5x/week) | Diet (slight deficit) | High protein always | Carb cycling option |

### Auto-Configuration Rules

```typescript
function autoConfigureCombinedProgram(
  goal: CombinedGoal,
  userProfile: UserProfile
): CombinedProgramConfig {
  const pairing = GOAL_PAIRINGS[goal];
  
  // Calculate base calories
  const bmr = calculateBMR(userProfile);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[userProfile.activityLevel];
  
  // Adjust based on goal
  let dailyCalories: number;
  switch (goal) {
    case 'weight_loss':
      dailyCalories = tdee - 500; // 500 cal deficit
      break;
    case 'muscle_gain':
      dailyCalories = tdee + 300; // 300 cal surplus
      break;
    case 'body_recomposition':
      dailyCalories = tdee - 200; // Slight deficit
      break;
    default:
      dailyCalories = tdee; // Maintenance
  }
  
  // Calculate workout calorie burns
  const estimatedWeeklyBurn = calculateWeeklyBurn(
    pairing.fitness.daysPerWeek[1], // middle option
    pairing.fitness.intensity,
    45 // average duration
  );
  
  // Adjust meal plan for workout days
  const workoutDayCalories = dailyCalories + (estimatedWeeklyBurn / pairing.fitness.daysPerWeek[1]);
  const restDayCalories = dailyCalories;
  
  return {
    goal,
    fitness: {
      mode: pairing.fitness.preferredModes[0],
      daysPerWeek: pairing.fitness.daysPerWeek[1],
      workoutType: pairing.fitness.workoutTypes[0],
      intensity: pairing.fitness.intensity,
      duration: 45,
    },
    meals: {
      mode: pairing.meals.preferredModes[0],
      fitnessGoal: pairing.meals.fitnessGoal,
      workoutDayCalories,
      restDayCalories,
      proteinTarget: calculateProteinTarget(userProfile.weight, pairing.meals.proteinTarget),
      suggestedDiets: pairing.meals.diets,
    },
    sync: {
      calorieAdjustment: true,
      postWorkoutMeals: goal === 'muscle_gain' || goal === 'athletic_performance',
      restDayNutrition: goal === 'weight_loss' || goal === 'body_recomposition',
    },
  };
}
```

---

## Combined Program Types

### Type 1: Quick Combo (Instant)
- **Fitness**: Quick Workout (one-time)
- **Meals**: Quick Meal (post-workout)
- **Use Case**: "I just finished a workout, what should I eat?"

```typescript
interface QuickCombo {
  workout: QuickWorkout;
  postWorkoutMeal: {
    timing: 'within_30_min' | 'within_1_hour' | 'within_2_hours';
    proteinTarget: number;
    carbTarget: number;
    suggestions: QuickMeal[];
  };
}
```

### Type 2: Weekly Program
- **Fitness**: Routine (3-6 days/week)
- **Meals**: Plan (7-14 days)
- **Use Case**: "Set me up for the week"

```typescript
interface WeeklyProgram {
  fitnessRoutine: {
    daysPerWeek: number;
    schedule: Array<{
      day: string;
      workout: Workout | 'rest';
    }>;
  };
  mealPlan: {
    days: Array<{
      date: string;
      isWorkoutDay: boolean;
      meals: DayMeals;
      adjustedCalories: number;
    }>;
  };
}
```

### Type 3: Transformation Program
- **Fitness**: Routine/Training (4-12 weeks)
- **Meals**: Diet Program (4-12 weeks)
- **Use Case**: "I want to lose 20 lbs" or "I want to gain muscle"

```typescript
interface TransformationProgram {
  goal: CombinedGoal;
  duration: number; // weeks
  phases: Array<{
    weekStart: number;
    weekEnd: number;
    phaseName: string;
    fitnessAdjustments: Partial<FitnessConfig>;
    nutritionAdjustments: Partial<NutritionConfig>;
  }>;
  milestones: Array<{
    week: number;
    fitnessTarget: string;
    weightTarget?: number;
    measurementTargets?: Record<string, number>;
  }>;
  weeklySchedule: WeeklySchedule[];
}
```

### Type 4: Sport-Specific Program
- **Fitness**: Training Mode (sport-selected)
- **Meals**: Diet Program (performance-focused)
- **Use Case**: "I'm training for basketball season"

```typescript
interface SportProgram {
  sport: Sport;
  trainingPhase: 'off_season' | 'pre_season' | 'in_season';
  fitnessProgram: TrainingProgram;
  nutritionProgram: {
    periodization: 'linear' | 'block' | 'undulating';
    gameDay: GameDayNutrition;
    trainingDay: TrainingDayNutrition;
    recoveryDay: RecoveryDayNutrition;
  };
}
```

---

## API Integration

### Combined Endpoint (Optional Service Enhancement)

If you want a unified service endpoint:

```typescript
// POST /api/programs/combined
interface CreateCombinedProgramRequest {
  userId: string;
  goal: CombinedGoal;
  duration: number; // days or weeks
  
  // Optional overrides (client can pre-calculate these)
  fitnessOverrides?: Partial<FitnessConfig>;
  mealOverrides?: Partial<MealConfig>;
  
  // Sync preferences
  syncOptions: {
    calorieAdjustment: boolean;
    postWorkoutMeals: boolean;
    restDayNutrition: boolean;
    mealTiming: boolean;
  };
}

// Response
interface CombinedProgramResponse {
  success: boolean;
  programId: string;
  
  fitness: {
    routineId: string;
    schedule: WorkoutSchedule;
  };
  
  meals: {
    planId: string;
    days: MealPlanDay[];
  };
  
  combined: {
    weeklyView: CombinedWeekView[];
    calorieBalance: CalorieBalanceReport;
    recommendations: string[];
  };
}
```

### Client-Side Coordination (Recommended)

```typescript
// src/services/combinedProgramService.ts

class CombinedProgramService {
  private fitnessService: FitnessService;
  private mealService: MealService;
  
  async createCombinedProgram(
    goal: CombinedGoal,
    userProfile: UserProfile,
    options?: CombinedProgramOptions
  ): Promise<CombinedProgram> {
    // 1. Auto-configure based on goal (CLIENT)
    const config = autoConfigureCombinedProgram(goal, userProfile);
    
    // 2. Generate fitness program (SERVICE CALL)
    const fitnessProgram = await this.fitnessService.generateRoutine({
      mode: config.fitness.mode,
      daysPerWeek: config.fitness.daysPerWeek,
      workoutType: config.fitness.workoutType,
      intensity: config.fitness.intensity,
      duration: config.fitness.duration,
      goals: [goal],
      ...options?.fitnessOverrides,
    });
    
    // 3. Generate meal plan with workout awareness (SERVICE CALL)
    const mealPlan = await this.mealService.createMealPlanFromDescription({
      fitnessGoal: config.meals.fitnessGoal,
      dailyCalorieTarget: config.meals.workoutDayCalories,
      duration: options?.duration || 7,
      mealsPerDay: { breakfast: true, lunch: true, dinner: true, snack: true },
      activityLevel: userProfile.activityLevel,
      // Pass workout schedule for meal timing optimization
      workoutSchedule: fitnessProgram.weekly_schedule,
      ...options?.mealOverrides,
    });
    
    // 4. Combine and sync (CLIENT)
    const combined = this.syncPrograms(fitnessProgram, mealPlan, config);
    
    // 5. Store locally + sync to cloud
    await this.saveProgram(combined);
    
    return combined;
  }
  
  private syncPrograms(
    fitness: FitnessRoutine,
    meals: MealPlan,
    config: CombinedProgramConfig
  ): CombinedProgram {
    const syncedDays = meals.days.map((mealDay, index) => {
      const workoutDay = fitness.weekly_schedule.find(
        w => w.day_number === (index % 7) + 1
      );
      
      const isWorkoutDay = workoutDay?.type !== 'rest';
      const workoutCalories = isWorkoutDay ? workoutDay?.workout?.estimated_calories || 0 : 0;
      
      return {
        ...mealDay,
        isWorkoutDay,
        workoutCalories,
        adjustedCalories: mealDay.total_calories + (
          config.sync.calorieAdjustment ? Math.floor(workoutCalories * 0.5) : 0
        ),
        postWorkoutMeal: isWorkoutDay && config.sync.postWorkoutMeals
          ? this.identifyPostWorkoutMeal(mealDay.meals)
          : null,
      };
    });
    
    return {
      id: generateId(),
      goal: config.goal,
      fitness: {
        mode: config.fitness.mode as any,
        programId: fitness.routine_id,
        workoutSchedule: fitness.weekly_schedule,
      },
      meals: {
        mode: config.meals.mode as any,
        programId: meals.program_id,
        mealPlanId: meals.program_id,
      },
      sync: config.sync,
      duration: meals.duration_days,
      startDate: new Date().toISOString(),
      syncedDays,
    };
  }
}

export const combinedProgramService = new CombinedProgramService();
```

---

## Sync Rules

### Calorie Adjustment Rules

| Day Type | Base Calories | Adjustment | Total |
|----------|---------------|------------|-------|
| Intense Workout | TDEE | +200-300 | TDEE + 250 |
| Moderate Workout | TDEE | +100-150 | TDEE + 125 |
| Light Workout | TDEE | +50-75 | TDEE + 60 |
| Rest Day | TDEE | 0 or -100 | TDEE or TDEE - 100 |

### Macro Timing Rules

```typescript
const MACRO_TIMING_RULES: Record<MealTiming, MacroDistribution> = {
  pre_workout: {
    timing: '1-2 hours before',
    carbs: 'moderate_complex',
    protein: 'moderate',
    fat: 'low',
    example: 'Oatmeal with banana and protein powder',
  },
  post_workout: {
    timing: 'within 30-60 minutes',
    carbs: 'high_fast',
    protein: 'high',
    fat: 'low',
    example: 'Protein shake with fruit, chicken and rice',
  },
  rest_day: {
    timing: 'spread evenly',
    carbs: 'moderate_complex',
    protein: 'high',
    fat: 'moderate',
    example: 'Balanced meals with focus on protein',
  },
};
```

### Weekly Schedule Template

```
┌─────────┬───────────────────┬────────────────────┬─────────────┐
│   DAY   │     WORKOUT       │      NUTRITION     │   FOCUS     │
├─────────┼───────────────────┼────────────────────┼─────────────┤
│ Monday  │ Upper Body        │ +150 cal, high pro │ Muscle      │
│ Tuesday │ Lower Body        │ +150 cal, high pro │ Muscle      │
│ Wednesday│ REST             │ Base cal, mod carb │ Recovery    │
│ Thursday│ Full Body/HIIT   │ +200 cal, high carb│ Performance │
│ Friday  │ Upper Body        │ +150 cal, high pro │ Muscle      │
│ Saturday│ Active Recovery   │ Base cal, balanced │ Recovery    │
│ Sunday  │ REST              │ Base cal, low carb │ Recovery    │
└─────────┴───────────────────┴────────────────────┴─────────────┘
```

---

## Implementation Examples

### Example 1: Weight Loss Combo

```typescript
const weightLossProgram = await combinedProgramService.createCombinedProgram(
  'weight_loss',
  {
    userId: 'user_123',
    age: 35,
    weight: 180, // lbs
    height: 70, // inches
    gender: 'male',
    activityLevel: 'moderate',
  },
  {
    duration: 28, // 4 weeks
    fitnessOverrides: {
      daysPerWeek: 4,
      workoutTypes: ['full_body', 'hiit', 'cardio'],
    },
    mealOverrides: {
      dietaryRestrictions: ['mediterranean'],
      preferredStores: ['costco'],
    },
  }
);

// Result:
{
  goal: 'weight_loss',
  duration: 28,
  fitness: {
    mode: 'routine',
    daysPerWeek: 4,
    schedule: [
      { day: 'Monday', type: 'full_body', duration: 45 },
      { day: 'Tuesday', type: 'rest' },
      { day: 'Wednesday', type: 'hiit', duration: 30 },
      { day: 'Thursday', type: 'rest' },
      { day: 'Friday', type: 'full_body', duration: 45 },
      { day: 'Saturday', type: 'cardio', duration: 30 },
      { day: 'Sunday', type: 'rest' },
    ],
  },
  meals: {
    mode: 'diet',
    dailyCalories: {
      workoutDay: 1800,
      restDay: 1650,
    },
    macros: {
      protein: '35%',
      carbs: '40%',
      fat: '25%',
    },
  },
  sync: {
    calorieAdjustment: true,
    postWorkoutMeals: false,
    restDayNutrition: true, // Lower carbs on rest days
  },
}
```

### Example 2: Muscle Gain Combo

```typescript
const muscleGainProgram = await combinedProgramService.createCombinedProgram(
  'muscle_gain',
  userProfile,
  {
    duration: 56, // 8 weeks
    fitnessOverrides: {
      daysPerWeek: 5,
      workoutTypes: ['strength', 'upper_body', 'lower_body'],
      intensity: 'intense',
    },
    mealOverrides: {
      dietaryRestrictions: ['high_protein'],
      dailyCalorieTarget: 3000,
    },
  }
);
```

### Example 3: Quick Post-Workout Combo

```typescript
// After completing a workout
const postWorkoutCombo = await combinedProgramService.getPostWorkoutMeal(
  completedWorkout,
  userProfile
);

// Result:
{
  workout: {
    type: 'upper_body',
    duration: 45,
    caloriesBurned: 320,
    musclesWorked: ['chest', 'back', 'shoulders', 'arms'],
  },
  postWorkoutMeal: {
    timing: 'within 30 minutes',
    targetProtein: 40,
    targetCarbs: 60,
    suggestions: [
      {
        name: 'Protein Shake + Banana',
        calories: 350,
        protein: 35,
        carbs: 45,
        prepTime: 2,
      },
      {
        name: 'Chicken & Rice Bowl',
        calories: 450,
        protein: 42,
        carbs: 55,
        prepTime: 15,
      },
    ],
  },
}
```

---

## Data Models

### Combined Program Schema

```typescript
// Storage model
interface CombinedProgramSchema {
  id: string;
  userId: string;
  goal: CombinedGoal;
  status: 'active' | 'paused' | 'completed';
  
  // References to generated programs
  fitnessRoutineId: string;
  mealPlanId: string;
  
  // Configuration
  config: {
    duration: number;
    startDate: string;
    endDate: string;
    syncOptions: SyncOptions;
  };
  
  // Progress
  progress: {
    currentDay: number;
    workoutsCompleted: number;
    workoutsScheduled: number;
    mealsLogged: number;
    mealsPlanned: number;
    weightHistory: Array<{ date: string; weight: number }>;
    complianceRate: number;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### Dashboard View Model

```typescript
interface CombinedDashboardView {
  activeProgram: {
    goal: string;
    daysRemaining: number;
    overallProgress: number; // percentage
  };
  
  today: {
    workout: {
      scheduled: Workout | null;
      completed: boolean;
      caloriesBurned: number;
    };
    meals: {
      planned: DayMeals;
      logged: LoggedMeals;
      caloriesRemaining: number;
      proteinRemaining: number;
    };
    netCalories: number;
  };
  
  thisWeek: {
    workoutsCompleted: number;
    workoutsRemaining: number;
    avgCalorieBalance: number;
    avgProteinIntake: number;
  };
  
  recommendations: string[];
}
```

---

## Summary

### Implementation Path

1. **Phase 1**: Create `combinedProgramService.ts` with client-side pairing logic
2. **Phase 2**: Add goal-based auto-configuration
3. **Phase 3**: Implement calorie/macro sync between workouts and meals
4. **Phase 4**: Build combined dashboard UI
5. **Phase 5**: (Optional) Add server endpoint for complex AI coordination

### Key Decision: Client-Side is Recommended

| Reason | Benefit |
|--------|---------|
| No new API needed | Faster development |
| Works offline | Better UX |
| User data stays local | Privacy |
| Simple rule-based logic | Maintainable |
| Services already exist | Reuse fitness + meal APIs |

### Combined Totals

```
┌────────────────────────────────────────────────────────────┐
│              WIHY COMBINED PROGRAM STATISTICS               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Fitness Module:        ~7,000,000,000 combinations        │
│  Meals Module:         ~10,000,000,000 combinations        │
│                        ─────────────────────                │
│  Combined (theoretical): 70 QUINTILLION combinations       │
│                                                             │
│  Core Combined Programs: 6,992 (76 × 92)                   │
│  (covers 90% of users)                                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

*Generated for WIHY Health App - Combined Programs Module*
*Last Updated: January 2026*
