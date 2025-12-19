import React, { useState, useMemo } from "react";
import { WihyCoachModel } from "./MyProgressDashboard";
import FitnessDashboard from "./FitnessDashboard";
import type { ExerciseRowView } from "./WorkoutProgramGrid";
import type { FitnessDashboardModel, ProgramVariantMap } from "./FitnessDashboard";

// -----------------------------------------------------------------
// TYPE DEFINITIONS (nutrition features)
// -----------------------------------------------------------------

// Meal program types
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export type CoachMealItem = {
  id: string;
  name: string;
  servings?: number;
  notes?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  tags?: string[];
};

export type CoachMealDay = {
  id: string;
  label: string;
  meals: Partial<Record<MealType, CoachMealItem[]>>;
};

export type CoachMealProgram = {
  programTitle?: string;
  programDescription?: string;
  days: CoachMealDay[];
};

// Workout program types
export type CoachWorkoutDay = { id: string; label: string; rows: ExerciseRowView[] };
export type CoachWorkoutLevel = { id: string; label: string; days: CoachWorkoutDay[] };
export type CoachWorkoutPhase = { id: string; name: string; levels: CoachWorkoutLevel[] };

export type CoachWorkoutProgram = {
  programTitle?: string;
  programDescription?: string;
  phases: CoachWorkoutPhase[];
};

// Nutrition dashboard model (scaffold)
export type NutritionDashboardModel = {
  title: string;
  subtitle?: string;
  days: { id: string; label: string }[];
  variants: Record<string, Partial<Record<MealType, CoachMealItem[]>>>;
  defaultDayId?: string;
  programTitle?: string;
  programDescription?: string;
};

export type DietTag = {
  id: string;
  name: string;
  description?: string;
};

export type ShoppingListCategory =
  | "protein"
  | "produce"
  | "grains"
  | "dairy"
  | "pantry"
  | "snacks"
  | "drinks"
  | "other";

export type CoachShoppingListItem = {
  id: string;
  item: string;
  category: ShoppingListCategory;
  quantity?: string;
  note?: string;
  optional?: boolean;
};

// 11 core diet goals/approaches
export type DietGoalKey =
  | "gut_nutrition"
  | "sad"
  | "mediterranean"
  | "keto"
  | "paleo"
  | "carnivore"
  | "vegan"
  | "vegetarian"
  | "wfpb"
  | "dash"
  | "biblical_levitical";

export type DietGoalTag = {
  key: DietGoalKey;
  label: string;
  description: string;
};

// Action types (from WihyCoachModel)
export type ActionType =
  | "workout"
  | "meal"
  | "hydration"
  | "log"
  | "habit"
  | "checkin"
  | "education"
  | "custom";

export type ActionStatus = "pending" | "in_progress" | "completed";

export type Action = {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  meta?: string;
  status: ActionStatus;
};

export const ALL_DIET_GOALS: DietGoalTag[] = [
  {
    key: "gut_nutrition",
    label: "Gut Nutrition",
    description: "Focus on gut health through probiotics, prebiotics, and fiber.",
  },
  {
    key: "sad",
    label: "Standard American Diet (SAD)",
    description: "High-processed, convenience-based eating.",
  },
  {
    key: "mediterranean",
    label: "Mediterranean",
    description: "Olive oil, fish, whole grains, vegetables, moderate wine.",
  },
  {
    key: "keto",
    label: "Keto",
    description: "Very low-carb, high-fat, moderate protein for ketosis.",
  },
  {
    key: "paleo",
    label: "Paleo",
    description: "Unprocessed foods: meat, fish, vegetables, nuts, seeds.",
  },
  {
    key: "carnivore",
    label: "Carnivore",
    description: "Animal-based: meat, fish, eggs, minimal plant foods.",
  },
  {
    key: "vegan",
    label: "Vegan",
    description: "No animal products; plant-based only.",
  },
  {
    key: "vegetarian",
    label: "Vegetarian",
    description: "No meat; includes dairy, eggs, and plant foods.",
  },
  {
    key: "wfpb",
    label: "Whole-Food Plant-Based (WFPB)",
    description: "Unprocessed plant foods; minimal/no animal products.",
  },
  {
    key: "dash",
    label: "DASH",
    description: "Dietary Approaches to Stop Hypertension; low sodium, balanced.",
  },
  {
    key: "biblical_levitical",
    label: "Biblical Levitical",
    description: "Following Levitical dietary laws; clean meats, no pork/shellfish.",
  },
];

// Quick-add diet pattern templates
export const commonDietOptions: DietTag[] = [
  { id: "std1", name: "Low-Carb", description: "Reduce carbs, focus on protein & veggies" },
  { id: "std2", name: "Calorie Deficit", description: "Track calories, maintain a moderate deficit" },
  { id: "std3", name: "Whole Foods", description: "Eliminate processed foods" },
  { id: "std4", name: "Intermittent Fasting", description: "16/8 or 18/6 eating window" },
];

// Helper to generate unique IDs
function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Adapter functions
const buildProgramKey = (phaseId: string, levelId: string, dayId: string) =>
  `${phaseId}__${levelId}__${dayId}`;

function buildFitnessModelFromCoachPlan(plan: CoachPlan): FitnessDashboardModel {
  const wp = plan.workoutProgram;

  // Safe fallback
  if (!wp || !wp.phases?.length) {
    return {
      title: "Start Your Workout",
      subtitle: "Your coach hasn't assigned a workout yet.",
      phases: [{ id: "phase1", name: "Phase 1" }],
      levels: [{ id: "beginner", label: "Beginner" }],
      days: [{ id: "day1", label: "Day 1" }],
      variants: {},
      programTitle: "Workout plan",
      programDescription: "No workout program assigned.",
      defaultPhaseId: "phase1",
      defaultLevelId: "beginner",
      defaultDayId: "day1",
    };
  }

  const phases = wp.phases.map((p) => ({ id: p.id, name: p.name }));
  const firstPhase = wp.phases[0];
  const levels = firstPhase.levels.map((l) => ({ id: l.id, label: l.label }));
  const firstLevel = firstPhase.levels[0];
  const days = firstLevel.days.map((d) => ({ id: d.id, label: d.label }));

  const variants: ProgramVariantMap = {};
  for (const phase of wp.phases) {
    for (const level of phase.levels) {
      for (const day of level.days) {
        variants[buildProgramKey(phase.id, level.id, day.id)] = day.rows;
      }
    }
  }

  return {
    title: "Start Your Workout",
    subtitle: "Choose your workout and start moving.",
    phases,
    levels,
    days,
    variants,
    programTitle: wp.programTitle ?? "Workout plan",
    programDescription: wp.programDescription ?? "Coach-assigned program.",
    defaultPhaseId: firstPhase.id,
    defaultLevelId: firstLevel.id,
    defaultDayId: firstLevel.days[0]?.id ?? "day1",
  };
}

function buildNutritionModelFromCoachPlan(plan: CoachPlan): NutritionDashboardModel {
  const mp = plan.mealProgram;

  if (!mp || !mp.days?.length) {
    return {
      title: "Meals",
      subtitle: "Your coach hasn't assigned a meal plan yet.",
      days: [{ id: "day1", label: "Day 1" }],
      variants: { day1: {} },
      defaultDayId: "day1",
      programTitle: "Meal plan",
      programDescription: "No meal program assigned.",
    };
  }

  const days = mp.days.map((d) => ({ id: d.id, label: d.label }));
  const variants: NutritionDashboardModel["variants"] = {};
  mp.days.forEach((d) => (variants[d.id] = d.meals ?? {}));

  return {
    title: "Meals",
    subtitle: "Meals assigned by your coach.",
    days,
    variants,
    defaultDayId: mp.days[0].id,
    programTitle: mp.programTitle ?? "Meal plan",
    programDescription: mp.programDescription ?? "Coach-assigned meals.",
  };
}

// Extended plan with nutrition
export interface CoachPlan extends Omit<WihyCoachModel, 'shoppingList' | 'workoutProgram'> {
  goals?: string[];           // Simple array of goal strings
  diets?: DietTag[];          // Custom diet patterns
  shoppingList?: CoachShoppingListItem[];
  dietGoals?: DietGoalKey[];  // Selected from the 11 core diet approaches
  workoutProgram?: CoachWorkoutProgram;  // feeds FitnessDashboard (overrides WihyCoachModel)
  mealProgram?: CoachMealProgram;        // feeds NutritionDashboard
}

export type CoachClient = {
  id: string;
  name: string;
  email: string;
  goal?: string;
  status: string;
  plan: CoachPlan;
};

// Tab keys
export type TabKey = "plan" | "actions" | "meals" | "shopping" | "preview";

// -----------------------------------------------------------------
// SEED DATA
// -----------------------------------------------------------------
const seedClients: CoachClient[] = [
  {
    id: "c1",
    name: "Alice Johnson",
    email: "alice@example.com",
    goal: "Weight loss",
    status: "Active",
    plan: {
      goals: ["Lose 15 lbs by June", "Improve energy levels"],
      dietGoals: ["gut_nutrition", "mediterranean"],
      diets: [
        {
          id: "diet-alice-1",
          name: "Low-Carb",
          description: "Reduce carbs to <50g/day",
        },
      ],
      shoppingList: [
        {
          id: "shop-alice-1",
          item: "Chicken breast",
          category: "protein",
          quantity: "2 lbs",
        },
        {
          id: "shop-alice-2",
          item: "Spinach",
          category: "produce",
          quantity: "1 bag",
          optional: true,
        },
      ],
      actions: [
        {
          id: "action-alice-1",
          type: "workout",
          title: "Morning walk",
          description: "30-minute brisk walk",
          meta: "daily",
          status: "pending",
        },
        {
          id: "action-alice-2",
          type: "meal",
          title: "Meal prep Sundays",
          description: "Prep lunches for the week",
          meta: "weekly",
          status: "completed",
        },
      ],
      priorities: [
        { id: "p1", title: "Track daily calories" },
        { id: "p2", title: "Stay hydrated" },
      ],
      workoutProgram: {
        programTitle: "Fat Loss Foundation",
        programDescription: "A beginner-friendly program focused on building habits and burning calories.",
        phases: [{
          id: "phase1",
          name: "Foundation Phase",
          levels: [{
            id: "beginner",
            label: "Beginner",
            days: [{
              id: "day1",
              label: "Day 1 - Full Body",
              rows: [
                {
                  meta: { 
                    id: "ex1", 
                    name: "Bodyweight Squats", 
                    equipment: "NONE", 
                    fitnessLoad: { STRENGTH: 2, CARDIO: 1 },
                    muscleLoad: { QUADS: 3, GLUTES: 3 }
                  },
                  prescription: { exerciseId: "ex1", sets: 3, intensityLabel: "3 x 12-15 @ bodyweight" }
                },
                {
                  meta: { 
                    id: "ex2", 
                    name: "Push-ups (Modified)", 
                    equipment: "NONE", 
                    fitnessLoad: { STRENGTH: 2 },
                    muscleLoad: { CHEST: 3, ARMS: 2 }
                  },
                  prescription: { exerciseId: "ex2", sets: 3, intensityLabel: "3 x 8-12 @ bodyweight" }
                },
                {
                  meta: { 
                    id: "ex3", 
                    name: "Walking", 
                    equipment: "NONE", 
                    fitnessLoad: { CARDIO: 3, ENDURANCE: 1 },
                    muscleLoad: { QUADS: 1, CALVES: 1 }
                  },
                  prescription: { exerciseId: "ex3", sets: 1, intensityLabel: "20min @ light pace" }
                }
              ]
            }]
          }]
        }]
      },
      mealProgram: {
        programTitle: "Healthy Habits Meal Plan",
        programDescription: "Simple, nutritious meals to support your weight loss goals.",
        days: [
          {
            id: "day1",
            label: "Day 1",
            meals: {
              BREAKFAST: [{
                id: "meal1",
                name: "Greek Yogurt with Berries",
                notes: "Use plain Greek yogurt for lower sugar",
                tags: ["High Protein", "Probiotics"]
              }],
              LUNCH: [{
                id: "meal2",
                name: "Grilled Chicken Salad",
                notes: "Mixed greens, olive oil dressing",
                tags: ["High Protein", "Low Carb"]
              }],
              DINNER: [{
                id: "meal3",
                name: "Salmon with Roasted Vegetables",
                notes: "Broccoli, bell peppers, olive oil",
                tags: ["Omega-3", "Fiber"]
              }]
            }
          }
        ]
      }
    },
  },
  {
    id: "c2",
    name: "Bob Smith",
    email: "bob@example.com",
    goal: "Muscle gain",
    status: "Active",
    plan: {
      goals: ["Gain 10 lbs lean mass", "Increase bench press to 225 lbs"],
      dietGoals: ["keto", "carnivore"],
      diets: [
        {
          id: "diet-bob-1",
          name: "High-Protein",
          description: "1.5g protein per lb bodyweight",
        },
      ],
      shoppingList: [
        {
          id: "shop-bob-1",
          item: "Ground beef",
          category: "protein",
          quantity: "3 lbs",
        },
        {
          id: "shop-bob-2",
          item: "Eggs",
          category: "protein",
          quantity: "2 dozen",
        },
      ],
      actions: [
        {
          id: "action-bob-1",
          type: "workout",
          title: "Upper body strength",
          description: "Bench, rows, OHP",
          meta: "3x/week",
          status: "in_progress",
        },
        {
          id: "action-bob-2",
          type: "meal",
          title: "Post-workout shake",
          description: "40g protein + carbs",
          meta: "after training",
          status: "pending",
        },
      ],
      priorities: [
        { id: "p1", title: "Progressive overload" },
        { id: "p2", title: "Sleep 8 hours" },
      ],
      workoutProgram: {
        programTitle: "Strength & Mass Builder",
        programDescription: "Intermediate program focused on building strength and muscle mass.",
        phases: [{
          id: "phase1",
          name: "Hypertrophy Phase",
          levels: [{
            id: "intermediate",
            label: "Intermediate",
            days: [{
              id: "day1",
              label: "Day 1 - Upper Body",
              rows: [
                {
                  meta: { 
                    id: "ex1", 
                    name: "Bench Press", 
                    equipment: "BARBELL", 
                    fitnessLoad: { STRENGTH: 3 },
                    muscleLoad: { CHEST: 3, ARMS: 2 }
                  },
                  prescription: { exerciseId: "ex1", sets: 4, intensityLabel: "4 x 8-10 @ 75-80% 1RM" }
                },
                {
                  meta: { 
                    id: "ex2", 
                    name: "Barbell Rows", 
                    equipment: "BARBELL", 
                    fitnessLoad: { STRENGTH: 3 },
                    muscleLoad: { BACK: 3, ARMS: 1 }
                  },
                  prescription: { exerciseId: "ex2", sets: 4, intensityLabel: "4 x 8-10 @ 75-80% 1RM" }
                },
                {
                  meta: { 
                    id: "ex3", 
                    name: "Overhead Press", 
                    equipment: "BARBELL", 
                    fitnessLoad: { STRENGTH: 3 },
                    muscleLoad: { SHOULDERS: 3, ARMS: 2 }
                  },
                  prescription: { exerciseId: "ex3", sets: 3, intensityLabel: "3 x 10-12 @ 70-75% 1RM" }
                }
              ]
            }]
          }]
        }]
      },
      mealProgram: {
        programTitle: "Mass Gaining Protocol",
        programDescription: "High-calorie, high-protein meals to support muscle growth.",
        days: [
          {
            id: "day1",
            label: "Day 1",
            meals: {
              BREAKFAST: [{
                id: "meal1",
                name: "Steak and Eggs",
                notes: "6oz ribeye with 3 whole eggs",
                tags: ["High Protein", "High Fat"]
              }],
              LUNCH: [{
                id: "meal2",
                name: "Ground Beef Bowl",
                notes: "1lb ground beef, 80/20 blend",
                tags: ["High Protein", "Zero Carb"]
              }],
              DINNER: [{
                id: "meal3",
                name: "Pork Chops",
                notes: "8oz bone-in pork chops",
                tags: ["High Protein", "Carnivore"]
              }],
              SNACK: [{
                id: "meal4",
                name: "Protein Shake",
                notes: "50g whey protein with whole milk",
                tags: ["Post Workout", "High Protein"]
              }]
            }
          }
        ]
      }
    },
  },
];

// -----------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------
export default function CoachDashboard() {
  const [clients, setClients] = useState<CoachClient[]>(seedClients);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<CoachClient | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("plan");
  const [clientViewTab, setClientViewTab] = useState<"workouts" | "meals">("workouts");

  // Meal editing states
  const [mealDayId, setMealDayId] = useState<string>("day1");
  const [newMealType, setNewMealType] = useState<MealType>("BREAKFAST");
  const [newMealName, setNewMealName] = useState("");
  const [newMealNotes, setNewMealNotes] = useState("");
  const [newMealTags, setNewMealTags] = useState("");

  // Edit states for Goals & Diets tab
  const [editingGoals, setEditingGoals] = useState(false);
  const [newGoal, setNewGoal] = useState("");
  const [editingDietGoals, setEditingDietGoals] = useState(false);
  const [editingDiets, setEditingDiets] = useState(false);
  const [newDietName, setNewDietName] = useState("");
  const [newDietDesc, setNewDietDesc] = useState("");

  // Edit states for Actions tab
  const [editingActions, setEditingActions] = useState(false);
  const [newActionType, setNewActionType] = useState<ActionType>("workout");
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDescription, setNewActionDescription] = useState("");
  const [newActionMeta, setNewActionMeta] = useState("");

  // Edit states for Shopping tab
  const [editingShopping, setEditingShopping] = useState(false);
  const [newShoppingName, setNewShoppingName] = useState("");
  const [newShoppingCategory, setNewShoppingCategory] = useState<ShoppingListCategory>("protein");
  const [newShoppingQty, setNewShoppingQty] = useState("");
  const [newShoppingNote, setNewShoppingNote] = useState("");
  const [newShoppingOptional, setNewShoppingOptional] = useState(false);

  // MyProgress aggregation (must be at component level, not inside conditional render functions)
  const myProgressModel = React.useMemo(() => {
    if (!selectedClient) return null;
    
    const { buildMyProgressCoachModel } = require('../../services/coachAggregators');
    return buildMyProgressCoachModel({
      plan: selectedClient.plan,
      workoutSelection: { phaseId: "phase1", levelId: "beginner", dayId: "day1" },
      mealDayId: "day1",
      todayStats: {
        dateISO: new Date().toISOString().split('T')[0],
        mealsLogged: 2,
        calories: 1800,
        protein: 120,
        hydrationCups: 6,
        hydrationGoalCups: 8,
      }
    });
  }, [selectedClient]);

  // Filter clients by search
  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients;
    const lower = search.toLowerCase();
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        (c.goal && c.goal.toLowerCase().includes(lower))
    );
  }, [clients, search]);

  // -----------------------------------------------------------------
  // CRUD HANDLERS: Goals
  // -----------------------------------------------------------------
  function handleAddGoal() {
    if (!selectedClient || !newGoal.trim()) return;
    const updated = { ...selectedClient };
    updated.plan.goals = [...(updated.plan.goals || []), newGoal.trim()];
    handleSaveToLocalClient(updated);
    setNewGoal("");
  }
  function handleRemoveGoal(index: number) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    updated.plan.goals = (updated.plan.goals || []).filter((_, i) => i !== index);
    handleSaveToLocalClient(updated);
  }

  // -----------------------------------------------------------------
  // CRUD HANDLERS: Diet Goals (the 11 core diet approaches)
  // -----------------------------------------------------------------
  function toggleDietGoal(key: DietGoalKey) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    const current = updated.plan.dietGoals || [];
    if (current.includes(key)) {
      updated.plan.dietGoals = current.filter((k) => k !== key);
    } else {
      updated.plan.dietGoals = [...current, key];
    }
    handleSaveToLocalClient(updated);
  }

  // -----------------------------------------------------------------
  // CRUD HANDLERS: Diet Patterns
  // -----------------------------------------------------------------
  function handleAddDiet() {
    if (!selectedClient || !newDietName.trim()) return;
    const updated = { ...selectedClient };
    const newDiet: DietTag = {
      id: makeId("diet"),
      name: newDietName.trim(),
      description: newDietDesc.trim() || undefined,
    };
    updated.plan.diets = [...(updated.plan.diets || []), newDiet];
    handleSaveToLocalClient(updated);
    setNewDietName("");
    setNewDietDesc("");
  }
  function handleAddDietFromTemplate(template: DietTag) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    const newDiet: DietTag = {
      id: makeId("diet"),
      name: template.name,
      description: template.description,
    };
    updated.plan.diets = [...(updated.plan.diets || []), newDiet];
    handleSaveToLocalClient(updated);
  }
  function handleRemoveDiet(dietId: string) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    updated.plan.diets = (updated.plan.diets || []).filter(
      (d) => d.id !== dietId
    );
    handleSaveToLocalClient(updated);
  }

  // -----------------------------------------------------------------
  // CRUD HANDLERS: Actions
  // -----------------------------------------------------------------
  function handleAddAction() {
    if (!selectedClient || !newActionTitle.trim()) return;
    const updated = { ...selectedClient };
    const newAction = {
      id: makeId("action"),
      type: newActionType,
      title: newActionTitle.trim(),
      status: "pending" as const,
      description: newActionDescription.trim() || undefined,
      meta: newActionMeta.trim() || undefined,
    };
    updated.plan.actions = [...(updated.plan.actions || []), newAction];
    handleSaveToLocalClient(updated);
    setNewActionTitle("");
    setNewActionDescription("");
    setNewActionMeta("");
  }
  function handleRemoveAction(actionId: string) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    updated.plan.actions = (updated.plan.actions || []).filter(
      (a) => a.id !== actionId
    );
    handleSaveToLocalClient(updated);
  }
  function handleToggleActionStatus(actionId: string) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    updated.plan.actions = (updated.plan.actions || []).map((a) =>
      a.id === actionId
        ? {
            ...a,
            status:
              a.status === "pending"
                ? "in_progress"
                : a.status === "in_progress"
                ? "completed"
                : "pending",
          }
        : a
    );
    handleSaveToLocalClient(updated);
  }

  // -----------------------------------------------------------------
  // CRUD HANDLERS: Shopping List
  // -----------------------------------------------------------------
  function handleAddShoppingItem() {
    if (!selectedClient || !newShoppingName.trim()) return;
    const updated = { ...selectedClient };
    const newItem: CoachShoppingListItem = {
      id: makeId("shop"),
      item: newShoppingName.trim(),
      category: newShoppingCategory,
      quantity: newShoppingQty.trim() || undefined,
      note: newShoppingNote.trim() || undefined,
      optional: newShoppingOptional,
    };
    updated.plan.shoppingList = [...(updated.plan.shoppingList || []), newItem];
    handleSaveToLocalClient(updated);
    setNewShoppingName("");
    setNewShoppingQty("");
    setNewShoppingNote("");
    setNewShoppingOptional(false);
  }
  function handleRemoveShoppingItem(itemId: string) {
    if (!selectedClient) return;
    const updated = { ...selectedClient };
    updated.plan.shoppingList = (updated.plan.shoppingList || []).filter(
      (i) => i.id !== itemId
    );
    handleSaveToLocalClient(updated);
  }

  // -----------------------------------------------------------------
  // SAVE (local state)
  // -----------------------------------------------------------------
  function handleSaveToLocalClient(updated: CoachClient) {
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedClient(updated);
  }

  // -----------------------------------------------------------------
  // RENDER HELPERS: Goals & Diets Tab
  // -----------------------------------------------------------------
  function renderGoalsAndDiets() {
    if (!selectedClient) return null;
    return (
      <div className="space-y-6">
        {/* 1) Goals */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">Goals</h3>
            <button
              onClick={() => setEditingGoals(!editingGoals)}
              className="text-xs px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {editingGoals ? "Done" : "Edit"}
            </button>
          </div>
          <ul className="space-y-1 text-sm">
            {(selectedClient.plan.goals || []).length === 0 ? (
              <li className="text-gray-400 italic">No goals set</li>
            ) : (
              (selectedClient.plan.goals || []).map((g, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between"
                >
                  <span>• {g}</span>
                  {editingGoals && (
                    <button
                      onClick={() => handleRemoveGoal(idx)}
                      className="ml-2 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
          {editingGoals && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="New goal..."
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={handleAddGoal}
                className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
              >
                Add
              </button>
            </div>
          )}
        </div>

        {/* 2) Diet Goals (11 core approaches) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">
              Diet Goals (Approach)
            </h3>
            <button
              onClick={() => setEditingDietGoals(!editingDietGoals)}
              className="text-xs px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {editingDietGoals ? "Done" : "Edit"}
            </button>
          </div>

          {!editingDietGoals ? (
            <div className="text-sm space-y-1">
              {(selectedClient.plan.dietGoals || []).length === 0 ? (
                <p className="text-gray-400 italic">
                  No diet goals selected
                </p>
              ) : (
                (selectedClient.plan.dietGoals || []).map((key) => {
                  const found = ALL_DIET_GOALS.find(
                    (dg) => dg.key === key
                  );
                  return (
                    <div key={key} className="flex items-start space-x-1">
                      <span className="font-semibold">•</span>
                      <span>
                        {found?.label} – {found?.description}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {ALL_DIET_GOALS.map((dg) => {
                const isSelected = (
                  selectedClient.plan.dietGoals || []
                ).includes(dg.key);
                return (
                  <button
                    key={dg.key}
                    onClick={() => toggleDietGoal(dg.key)}
                    className={`text-left p-2 rounded border text-xs transition ${
                      isSelected
                        ? "bg-blue-50 border-blue-400 font-semibold"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-semibold">{dg.label}</div>
                    <div className="text-gray-600 text-xs">
                      {dg.description}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 3) Diet Patterns (custom/quick-add) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800">
              Diet Patterns
            </h3>
            <button
              onClick={() => setEditingDiets(!editingDiets)}
              className="text-xs px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              {editingDiets ? "Done" : "Edit"}
            </button>
          </div>
          <ul className="space-y-2 text-sm">
            {(selectedClient.plan.diets || []).length === 0 ? (
              <li className="text-gray-400 italic">
                No diet patterns yet
              </li>
            ) : (
              (selectedClient.plan.diets || []).map((d) => (
                <li
                  key={d.id}
                  className="flex items-start justify-between"
                >
                  <div>
                    <div className="font-semibold">{d.name}</div>
                    {d.description && (
                      <div className="text-gray-600 text-xs">
                        {d.description}
                      </div>
                    )}
                  </div>
                  {editingDiets && (
                    <button
                      onClick={() => handleRemoveDiet(d.id)}
                      className="ml-2 text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))
            )}
          </ul>
          {editingDiets && (
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Diet name..."
                  value={newDietName}
                  onChange={(e) => setNewDietName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={handleAddDiet}
                  className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
                >
                  Add
                </button>
              </div>
              <input
                type="text"
                placeholder="Description (optional)..."
                value={newDietDesc}
                onChange={(e) => setNewDietDesc(e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <div className="text-xs text-gray-600 mt-2">
                Quick-add templates:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {commonDietOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleAddDietFromTemplate(opt)}
                    className="text-left p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 text-xs"
                  >
                    <div className="font-semibold">{opt.name}</div>
                    <div className="text-gray-600 text-xs">
                      {opt.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER HELPERS: Actions Tab
  // -----------------------------------------------------------------
  function renderActions() {
    if (!selectedClient) return null;
    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">Actions</h3>
          <button
            onClick={() => setEditingActions(!editingActions)}
            className="text-xs px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {editingActions ? "Done" : "Edit"}
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {(selectedClient.plan.actions || []).length === 0 ? (
            <li className="text-gray-400 italic">No actions yet</li>
          ) : (
            (selectedClient.plan.actions || []).map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between border-b border-gray-100 pb-2"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{a.title}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        a.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : a.status === "in_progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {a.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      [{a.type}]
                    </span>
                  </div>
                  {a.description && (
                    <div className="text-gray-600 text-xs mt-1">
                      {a.description}
                    </div>
                  )}
                  {a.meta && (
                    <div className="text-gray-500 italic text-xs mt-1">
                      Frequency: {a.meta}
                    </div>
                  )}
                </div>
                {editingActions && (
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleToggleActionStatus(a.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ⟳
                    </button>
                    <button
                      onClick={() => handleRemoveAction(a.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
        {editingActions && (
          <div className="mt-4 space-y-2">
            <select
              value={newActionType}
              onChange={(e) =>
                setNewActionType(e.target.value as ActionType)
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="workout">Workout</option>
              <option value="meal">Meal</option>
              <option value="hydration">Hydration</option>
              <option value="log">Log</option>
              <option value="habit">Habit</option>
              <option value="checkin">Check-in</option>
              <option value="education">Education</option>
              <option value="custom">Custom</option>
            </select>
            <input
              type="text"
              placeholder="Action title..."
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Description (optional)..."
              value={newActionDescription}
              onChange={(e) => setNewActionDescription(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Frequency (e.g. daily, 3x/week)..."
              value={newActionMeta}
              onChange={(e) => setNewActionMeta(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <button
              onClick={handleAddAction}
              className="w-full text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
            >
              Add Action
            </button>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER HELPERS: Shopping Tab
  // -----------------------------------------------------------------
  function renderShopping() {
    if (!selectedClient) return null;
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800">
            Shopping List
          </h3>
          <button
            onClick={() => setEditingShopping(!editingShopping)}
            className="text-xs px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {editingShopping ? "Done" : "Edit"}
          </button>
        </div>
        <ul className="space-y-2 text-sm">
          {(selectedClient.plan.shoppingList || []).length === 0 ? (
            <li className="text-gray-400 italic">
              No items on list yet
            </li>
          ) : (
            (selectedClient.plan.shoppingList || []).map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between border-b border-gray-100 pb-2"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.item}</span>
                    <span className="text-xs text-gray-500">
                      [{item.category}]
                    </span>
                    {item.optional && (
                      <span className="text-xs italic text-gray-400">
                        (optional)
                      </span>
                    )}
                  </div>
                  {item.quantity && (
                    <div className="text-xs text-gray-600 mt-1">
                      Qty: {item.quantity}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-xs text-gray-500 italic mt-1">
                      {item.note}
                    </div>
                  )}
                </div>
                {editingShopping && (
                  <button
                    onClick={() => handleRemoveShoppingItem(item.id)}
                    className="ml-2 text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))
          )}
        </ul>
        {editingShopping && (
          <div className="mt-4 space-y-2">
            <input
              type="text"
              placeholder="Item name..."
              value={newShoppingName}
              onChange={(e) => setNewShoppingName(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <select
              value={newShoppingCategory}
              onChange={(e) =>
                setNewShoppingCategory(
                  e.target.value as ShoppingListCategory
                )
              }
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="protein">Protein</option>
              <option value="produce">Produce</option>
              <option value="grains">Grains</option>
              <option value="dairy">Dairy</option>
              <option value="pantry">Pantry</option>
              <option value="snacks">Snacks</option>
              <option value="drinks">Drinks</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              placeholder="Quantity (optional)..."
              value={newShoppingQty}
              onChange={(e) => setNewShoppingQty(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <input
              type="text"
              placeholder="Note (optional)..."
              value={newShoppingNote}
              onChange={(e) => setNewShoppingNote(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
            <label className="flex items-center space-x-2 text-xs">
              <input
                type="checkbox"
                checked={newShoppingOptional}
                onChange={(e) =>
                  setNewShoppingOptional(e.target.checked)
                }
              />
              <span>Mark as optional</span>
            </label>
            <button
              onClick={handleAddShoppingItem}
              className="w-full text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
            >
              Add Item
            </button>
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER HELPERS: Meals Tab
  // -----------------------------------------------------------------
  const mealTypes: { key: MealType; label: string }[] = [
    { key: "BREAKFAST", label: "Breakfast" },
    { key: "LUNCH", label: "Lunch" },
    { key: "DINNER", label: "Dinner" },
    { key: "SNACK", label: "Snack" },
  ];

  function ensureMealProgram(plan: CoachPlan): CoachMealProgram {
    if (plan.mealProgram?.days?.length) return plan.mealProgram;
    return {
      programTitle: "Meal plan",
      programDescription: "Coach-assigned meals.",
      days: [
        { id: "day1", label: "Day 1", meals: {} },
        { id: "day2", label: "Day 2", meals: {} },
        { id: "day3", label: "Day 3", meals: {} },
      ],
    };
  }

  function renderMeals() {
    if (!selectedClient) return null;

    const mp = ensureMealProgram(selectedClient.plan);
    const day = mp.days.find((d) => d.id === mealDayId) ?? mp.days[0];

    const updateClientPlan = (nextPlan: CoachPlan) => {
      setClients((prev) =>
        prev.map((c) => (c.id === selectedClient.id ? { ...c, plan: nextPlan } : c))
      );
      setSelectedClient((prev) => (prev ? { ...prev, plan: nextPlan } : prev));
    };

    const handleAddMeal = () => {
      if (!newMealName.trim()) return;

      const item: CoachMealItem = {
        id: makeId("meal"),
        name: newMealName.trim(),
        notes: newMealNotes.trim() || undefined,
        tags: newMealTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      };

      const next: CoachMealProgram = {
        ...mp,
        days: mp.days.map((d) => {
          if (d.id !== day.id) return d;
          const current = d.meals?.[newMealType] ?? [];
          return {
            ...d,
            meals: {
              ...(d.meals ?? {}),
              [newMealType]: [...current, item],
            },
          };
        }),
      };

      updateClientPlan({ ...selectedClient.plan, mealProgram: next });
      setNewMealName("");
      setNewMealNotes("");
      setNewMealTags("");
    };

    const handleRemoveMeal = (mealType: MealType, id: string) => {
      const next: CoachMealProgram = {
        ...mp,
        days: mp.days.map((d) => {
          if (d.id !== day.id) return d;
          const current = d.meals?.[mealType] ?? [];
          return {
            ...d,
            meals: {
              ...(d.meals ?? {}),
              [mealType]: current.filter((m) => m.id !== id),
            },
          };
        }),
      };
      updateClientPlan({ ...selectedClient.plan, mealProgram: next });
    };

    const Chip = ({ label }: { label: string }) => (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700">
        {label}
      </span>
    );

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Meals</h3>
            <p className="text-xs text-gray-500">Build the client's meal plan by day.</p>
          </div>

          {/* Day selector (WIHY segmented) */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-full overflow-x-auto">
            {mp.days.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setMealDayId(d.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition whitespace-nowrap ${
                  d.id === mealDayId ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Builder */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Add Meal */}
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-sm font-semibold text-gray-900 mb-2">Add item</div>

            <label className="block text-xs font-medium text-gray-600 mb-1">Meal type</label>
            <select
              value={newMealType}
              onChange={(e) => setNewMealType(e.target.value as MealType)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              {mealTypes.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>

            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Meal name</label>
            <input
              value={newMealName}
              onChange={(e) => setNewMealName(e.target.value)}
              placeholder="e.g., Chicken bowl with veggies"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />

            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Notes (optional)</label>
            <input
              value={newMealNotes}
              onChange={(e) => setNewMealNotes(e.target.value)}
              placeholder="e.g., no cheese, add salsa"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />

            <label className="block text-xs font-medium text-gray-600 mt-3 mb-1">Tags (comma separated)</label>
            <input
              value={newMealTags}
              onChange={(e) => setNewMealTags(e.target.value)}
              placeholder="High Protein, Fiber"
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={handleAddMeal}
              className="mt-4 w-full inline-flex items-center justify-center rounded-full bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800 transition"
            >
              Add
            </button>
          </div>

          {/* Meal columns */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {mealTypes.map((mt) => {
              const items = day.meals?.[mt.key] ?? [];
              return (
                <div key={mt.key} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">{mt.label}</div>
                    <div className="text-xs text-gray-500">{items.length}</div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="text-xs text-gray-500 rounded-xl border border-dashed border-gray-200 p-3">
                        No items yet.
                      </div>
                    ) : (
                      items.map((m) => (
                        <div key={m.id} className="rounded-xl border border-gray-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-gray-900 truncate">{m.name}</div>
                              {m.notes && (
                                <div className="mt-1 text-xs text-gray-600">{m.notes}</div>
                              )}
                              {m.tags?.length ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {m.tags.map((t) => (
                                    <Chip key={t} label={t} />
                                  ))}
                                </div>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveMeal(mt.key, m.id)}
                              className="shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-900"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // RENDER HELPERS: Preview Tab (dual preview system)
  // -----------------------------------------------------------------
  function renderPreview() {
    if (!selectedClient) return null;

    const fitnessModel = buildFitnessModelFromCoachPlan(selectedClient.plan);
    const nutritionModel = buildNutritionModelFromCoachPlan(selectedClient.plan);

    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Client view</h3>
            <p className="text-xs text-gray-500">Preview what the client sees.</p>
          </div>

          {/* WIHY segmented control */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
            <button
              type="button"
              onClick={() => setClientViewTab("workouts")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition ${
                clientViewTab === "workouts"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Workouts
            </button>
            <button
              type="button"
              onClick={() => setClientViewTab("meals")}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition ${
                clientViewTab === "meals"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Meals
            </button>
          </div>
        </div>

        <div className="p-4">
          {clientViewTab === "workouts" ? (
            <div className="rounded-2xl border border-gray-200 overflow-hidden h-[740px]">
              <FitnessDashboard data={fitnessModel} />
            </div>
          ) : clientViewTab === "meals" ? (
            <MealsPreviewWIHY model={nutritionModel} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Preview mode coming soon
            </div>
          )}
        </div>
        
        {/* Debug: Show aggregated model structure */}
        <div className="px-4 pb-4">
          <details className="text-xs">
            <summary className="cursor-pointer text-gray-500 mb-2">🔧 MyProgress Aggregation (Debug)</summary>
            <div className="bg-gray-50 p-3 rounded border text-gray-700 font-mono text-xs overflow-auto max-h-40">
              <div><strong>Data Flow Summary:</strong></div>
              <div>• Coach Plan → Aggregator → MyProgress</div>
              <div>• Workout Rows: {myProgressModel?.workoutProgram?.length ?? 0}</div>
              <div>• Meals Planned: {myProgressModel?.consumption?.mealsPlanned ?? 0}</div>
              <div>• Meals Logged: {myProgressModel?.consumption?.mealsLogged ?? 0}</div>
              <div>• Actions: {myProgressModel?.actions?.length ?? 0}</div>
              <div>• Priorities: {myProgressModel?.priorities?.length ?? 0}</div>
              <div>• Shopping Items: {myProgressModel?.shoppingList?.length ?? 0}</div>
              <div>• Calories: {myProgressModel?.consumption?.calories ?? 0}</div>
              <div>• Protein: {myProgressModel?.consumption?.protein ?? 0}g</div>
              <div>• Hydration: {myProgressModel?.hydration?.cups ?? 0}/{myProgressModel?.hydration?.goalCups ?? 0} cups</div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // MEALS PREVIEW COMPONENT
  // -----------------------------------------------------------------
  function MealsPreviewWIHY({ model }: { model: NutritionDashboardModel }) {
    const [dayId, setDayId] = React.useState(model.defaultDayId ?? model.days[0]?.id ?? "day1");
    const day = model.days.find((d) => d.id === dayId) ?? model.days[0];
    const meals = model.variants[dayId] ?? {};

    const Chip = ({ label }: { label: string }) => (
      <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-700">
        {label}
      </span>
    );

    const order: { key: MealType; label: string }[] = [
      { key: "BREAKFAST", label: "Breakfast" },
      { key: "LUNCH", label: "Lunch" },
      { key: "DINNER", label: "Dinner" },
      { key: "SNACK", label: "Snack" },
    ];

    return (
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">{model.programTitle ?? model.title}</div>
            {model.programDescription && <div className="text-xs text-gray-500">{model.programDescription}</div>}
          </div>

          <div className="flex gap-1 bg-gray-100 p-1 rounded-full overflow-x-auto">
            {model.days.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDayId(d.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition whitespace-nowrap ${
                  d.id === dayId ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {order.map((mt) => {
            const items = meals[mt.key] ?? [];
            return (
              <div key={mt.key} className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">{mt.label}</div>
                  <div className="text-xs text-gray-500">{items.length}</div>
                </div>

                <div className="mt-3 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-xs text-gray-500 rounded-xl border border-dashed border-gray-200 p-3">
                      No items yet.
                    </div>
                  ) : (
                    items.map((m) => (
                      <div key={m.id} className="rounded-xl border border-gray-200 p-3">
                        <div className="text-sm font-semibold text-gray-900">{m.name}</div>
                        {m.notes && <div className="mt-1 text-xs text-gray-600">{m.notes}</div>}
                        {m.tags?.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.tags.map((t) => <Chip key={t} label={t} />)}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------
  return (
    <div
      className="min-h-screen pt-20 px-6 pb-6 overflow-auto"
      style={{ backgroundColor: "#f0f7ff" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Client List */}
          <div className="lg:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Clients</h2>
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm mb-4"
            />
            <ul className="space-y-2">
              {filteredClients.map((c) => (
                <li
                  key={c.id}
                  onClick={() => {
                    setSelectedClient(c);
                    setActiveTab("plan");
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition ${
                    selectedClient?.id === c.id
                      ? "bg-blue-100 border border-blue-400"
                      : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="text-xs text-gray-600">{c.email}</div>
                  {c.goal && (
                    <div className="text-xs text-gray-500 italic mt-1">
                      Goal: {c.goal}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT: Details Panel with Tabs */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            {!selectedClient ? (
              <p className="text-gray-500 italic">
                Select a client to view/edit their plan
              </p>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  {selectedClient.name}
                </h2>

                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
                  <button
                    onClick={() => setActiveTab("plan")}
                    className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                      activeTab === "plan"
                        ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                        : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Goals & Diets
                  </button>
                  <button
                    onClick={() => setActiveTab("actions")}
                    className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                      activeTab === "actions"
                        ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                        : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Actions
                  </button>
                  <button
                    onClick={() => setActiveTab("meals")}
                    className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                      activeTab === "meals"
                        ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                        : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Meals
                  </button>
                  <button
                    onClick={() => setActiveTab("shopping")}
                    className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                      activeTab === "shopping"
                        ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                        : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Shopping
                  </button>
                  <button
                    onClick={() => setActiveTab("preview")}
                    className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                      activeTab === "preview"
                        ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                        : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    Client View
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "plan" && renderGoalsAndDiets()}
                {activeTab === "actions" && renderActions()}
                {activeTab === "meals" && renderMeals()}
                {activeTab === "shopping" && renderShopping()}
                {activeTab === "preview" && renderPreview()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
