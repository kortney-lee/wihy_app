/**
 * Coach Plan Aggregator
 * 
 * This module provides the "aggregation up" layer that converts CoachDashboard 
 * plan data into the WihyCoachModel format expected by MyProgressDashboard.
 * 
 * Data Flow:
 * 1. Coach builds plan in CoachDashboard (workoutProgram + mealProgram)
 * 2. User activity generates tracking data (meals logged, hydration, etc.)
 * 3. This aggregator combines both into WihyCoachModel for MyProgressDashboard
 * 
 * Usage:
 * import { buildMyProgressCoachModel } from '../services/coachAggregators';
 * 
 * const coachModel = buildMyProgressCoachModel({
 *   plan: selectedClient.plan,
 *   workoutSelection: { phaseId: "phase1", levelId: "beginner", dayId: "day1" },
 *   mealDayId: "day1",
 *   todayStats: userTodayStats,
 * });
 * 
 * <MyProgressDashboard coach={coachModel} />
 */

import type { ExerciseRowView } from "../components/dashboard/WorkoutProgramGrid";
import type { WihyCoachModel } from "../components/dashboard/MyProgressDashboard";

// Reuse your CoachPlan type from CoachDashboard
import type { CoachPlan, MealType, CoachMealItem } from "../pages/CoachDashboardPage";

// Your app will have real user tracking types later.
// For now: keep it optional and pass what you have.
export type UserDayStats = {
  dateISO: string;
  mealsLogged?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  hydrationCups?: number;
  hydrationGoalCups?: number;
};

export type AggregationInputs = {
  plan: CoachPlan;

  // Which program day is "today"
  workoutSelection?: { phaseId: string; levelId: string; dayId: string };
  mealDayId?: string;

  // Tracking
  todayStats?: UserDayStats;

  // Optional other feeds
  shoppingList?: WihyCoachModel["shoppingList"];
  receipts?: WihyCoachModel["receipts"];
  history?: WihyCoachModel["history"];
  fastFoodDetections?: WihyCoachModel["fastFoodDetections"];
};

const key = (p: string, l: string, d: string) => `${p}__${l}__${d}`;

function flattenMealCounts(meals: Partial<Record<MealType, CoachMealItem[]>>): number {
  return Object.values(meals ?? {}).reduce((acc, arr) => acc + (arr?.length ?? 0), 0);
}

export function buildMyProgressCoachModel(input: AggregationInputs): WihyCoachModel {
  const { plan, workoutSelection, mealDayId, todayStats } = input;

  // 1) Workout rows for "Program" tab inside MyProgress
  let workoutProgram: ExerciseRowView[] = [];
  if (plan.workoutProgram?.phases?.length && workoutSelection) {
    const phase = plan.workoutProgram.phases.find(p => p.id === workoutSelection.phaseId);
    const level = phase?.levels.find(l => l.id === workoutSelection.levelId);
    const day = level?.days.find(d => d.id === workoutSelection.dayId);
    workoutProgram = day?.rows ?? [];
  }

  // 2) Meal plan summary for MyProgress "Meals Today"
  let mealsPlanned = 0;
  if (plan.mealProgram?.days?.length) {
    const day = plan.mealProgram.days.find(d => d.id === (mealDayId ?? plan.mealProgram!.days[0].id));
    mealsPlanned = day ? flattenMealCounts(day.meals) : 0;
  }

  // 3) Build MyProgress coach payload
  return {
    summary: plan.summary ?? "Your plan is ready.",
    motivation: plan.motivation ?? undefined,

    priorities: plan.priorities ?? [],

    actions: plan.actions ?? [],

    // "Today workout" card in MyProgress (simple) + "Program grid"
    workout: plan.workout ?? null,
    workoutProgram, // feeds WorkoutProgramGrid inside MyProgress

    // Consumption card uses logs + planned count
    consumption: {
      mealsLogged: todayStats?.mealsLogged ?? 0,
      mealsPlanned: mealsPlanned || undefined,
      calories: todayStats?.calories,
      protein: todayStats?.protein,
      caloriesTarget: undefined, // TODO: add to CoachPlan
      proteinTarget: undefined,  // TODO: add to CoachPlan
    },

    hydration: {
      cups: todayStats?.hydrationCups ?? 0,
      goalCups: todayStats?.hydrationGoalCups ?? undefined,
    },

    shoppingList: input.shoppingList ?? plan.shoppingList ?? [],
    receipts: input.receipts ?? [],
    history: input.history ?? [],
    fastFoodDetections: input.fastFoodDetections ?? [],

    streaks: plan.streaks ?? [],
    checkin: plan.checkin ?? null,
    education: plan.education ?? null,
  };
}