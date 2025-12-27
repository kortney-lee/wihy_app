import React, { useState, useEffect, useMemo } from 'react';
import { Users, Plus, Calendar, BarChart3, MessageSquare, Settings } from 'lucide-react';
import { useRelationships } from '../contexts/RelationshipContext';
import { useMealPlans } from '../contexts/MealPlanContext';
import { useFitness } from '../contexts/FitnessContext';
import Header from '../components/shared/Header';
import { PlatformDetectionService } from '../services/shared/platformDetectionService';

// Coach Dashboard Type Definitions
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

// Workout program types (for MyProgressDashboard integration)
export type CoachWorkoutDay = { id: string; label: string; rows: any[] }; // ExerciseRowView[]
export type CoachWorkoutLevel = { id: string; label: string; days: CoachWorkoutDay[] };
export type CoachWorkoutPhase = { id: string; name: string; levels: CoachWorkoutLevel[] };

export type CoachWorkoutProgram = {
  programTitle?: string;
  programDescription?: string;
  phases: CoachWorkoutPhase[];
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

export const commonDietOptions: DietTag[] = [
  { id: "std1", name: "Low-Carb", description: "Reduce carbs, focus on protein & veggies" },
  { id: "std2", name: "Calorie Deficit", description: "Track calories, maintain a moderate deficit" },
  { id: "std3", name: "Whole Foods", description: "Eliminate processed foods" },
  { id: "std4", name: "Intermittent Fasting", description: "16/8 or 18/6 eating window" },
];

export interface CoachPlan {
  goals?: string[];
  diets?: DietTag[];
  shoppingList?: CoachShoppingListItem[];
  dietGoals?: DietGoalKey[];
  mealProgram?: CoachMealProgram;
  instacartProductsLinkUrl?: string;
  instacartProductsLinkUpdatedAt?: string;
  actions?: Action[];
  priorities?: { id: string; title: string }[];
  // Extended properties for MyProgressDashboard integration
  workoutProgram?: CoachWorkoutProgram;
  summary?: string;
  motivation?: string;
  workout?: any; // WorkoutPlan type from MyProgressDashboard  
  streaks?: any[];
  checkin?: any;
  education?: any;
}

export type CoachClient = {
  id: string;
  name: string;
  email: string;
  goal?: string;
  status: string;
  plan: CoachPlan;
};

interface Client {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'pending';
  goal?: string;
  joinDate: string;
  lastActivity: string;
  mealPlanStatus?: 'none' | 'active' | 'draft';
  workoutPlanStatus?: 'none' | 'active' | 'draft';
  progressScore?: number;
}

// Helper function
function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Seed data for comprehensive clients
const seedClients: CoachClient[] = [
  {
    id: "c1",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    goal: "Weight loss",
    status: "Active",
    plan: {
      goals: ["Lose 15 lbs by June", "Improve energy levels"],
      dietGoals: ["gut_nutrition", "mediterranean"],
      diets: [
        {
          id: "diet-sarah-1",
          name: "Low-Carb",
          description: "Reduce carbs to <50g/day",
        },
      ],
      shoppingList: [
        {
          id: "shop-sarah-1",
          item: "Chicken breast",
          category: "protein",
          quantity: "2 lbs",
        },
        {
          id: "shop-sarah-2",
          item: "Spinach",
          category: "produce",
          quantity: "1 bag",
          optional: true,
        },
      ],
      actions: [
        {
          id: "action-sarah-1",
          type: "workout",
          title: "Morning walk",
          description: "30-minute brisk walk",
          meta: "daily",
          status: "pending",
        },
        {
          id: "action-sarah-2",
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
    name: "Mike Chen",
    email: "mike@example.com",
    goal: "Muscle gain",
    status: "Active",
    plan: {
      goals: ["Gain 10 lbs lean mass", "Increase bench press to 225 lbs"],
      dietGoals: ["keto", "carnivore"],
      diets: [
        {
          id: "diet-mike-1",
          name: "High-Protein",
          description: "1.5g protein per lb bodyweight",
        },
      ],
      shoppingList: [
        {
          id: "shop-mike-1",
          item: "Ground beef",
          category: "protein",
          quantity: "3 lbs",
        },
        {
          id: "shop-mike-2",
          item: "Eggs",
          category: "protein",
          quantity: "2 dozen",
        },
      ],
      actions: [
        {
          id: "action-mike-1",
          type: "workout",
          title: "Upper body strength",
          description: "Bench, rows, OHP",
          meta: "3x/week",
          status: "in_progress",
        },
      ],
      priorities: [
        { id: "p1", title: "Progressive overload" },
        { id: "p2", title: "Sleep 8 hours" },
      ],
    },
  },
  {
    id: "c3",
    name: "Emma Davis",
    email: "emma@example.com",
    goal: "General health",
    status: "Pending",
    plan: {
      goals: ["Improve overall fitness", "Better nutrition habits"],
      dietGoals: ["mediterranean", "dash"],
      diets: [],
      shoppingList: [],
      actions: [],
      priorities: [],
    },
  },
];

const CoachDashboardPage: React.FC = () => {
  // Use available context properties and create mock functions for missing ones
  const { coachClients } = useRelationships();
  const { createClientMealPlan } = useMealPlans();
  const { } = useFitness();
  
  // Comprehensive client management state
  const [clients, setClients] = useState<CoachClient[]>(seedClients);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<CoachClient | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "actions" | "meals" | "shopping" | "preview">("plan");
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

  // Instacart state
  const [generatingInstacartLink, setGeneratingInstacartLink] = useState(false);
  const [instacartSuccessMessage, setInstacartSuccessMessage] = useState('');

  // Mock functions for missing context properties
  const addNewClient = (client: any) => console.log('Add client:', client);
  const selectClient = (clientId: string) => console.log('Select client:', clientId);
  const selectedClientId = null;
  const getClientMealPlans = (clientId: string) => [];
  const getClientWorkouts = (clientId: string) => [];
  const createClientWorkout = (clientId: string, workout: any) => console.log('Create workout:', clientId, workout);
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'clients' | 'plans' | 'analytics'>('clients');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    email: '',
    goal: '',
    phone: ''
  });

  // Handle window resize
  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Instacart integration
  async function handleGenerateInstacartLink() {
    if (!selectedClient || !selectedClient.plan.shoppingList?.length) return;
    
    setGeneratingInstacartLink(true);
    setInstacartSuccessMessage('');
    
    try {
      // Format items for Instacart API
      const items = selectedClient.plan.shoppingList.map(item => ({
        name: item.item,
        quantity: item.quantity || '1',
        category: item.category
      }));
      
      // Mock API call - replace with actual Instacart API
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
      
      const mockInstacartUrl = `https://instacart.com/store/kroger/cart?items=${encodeURIComponent(JSON.stringify(items))}`;
      
      // Update client with link
      const updated = { ...selectedClient };
      updated.plan.instacartProductsLinkUrl = mockInstacartUrl;
      updated.plan.instacartProductsLinkUpdatedAt = new Date().toISOString();
      handleSaveToLocalClient(updated);
      
      setInstacartSuccessMessage('Smart shopping list generated! Client can now access their personalized list.');
      
    } catch (error) {
      console.error('Failed to generate Instacart link:', error);
    } finally {
      setGeneratingInstacartLink(false);
    }
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
                      className="text-xs text-red-600 hover:underline"
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
                    <div key={key} className="flex items-start justify-between">
                      <div>
                        <span className="font-medium">{found?.label}</span>
                        <p className="text-gray-600 text-xs">{found?.description}</p>
                      </div>
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
                    className={`p-2 text-left rounded-lg border transition ${
                      isSelected
                        ? "border-blue-500 bg-blue-50 text-blue-900"
                        : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <div className="font-medium text-xs">{dg.label}</div>
                    <div className="text-xs text-gray-600">{dg.description}</div>
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
                    <span className="font-medium">{d.name}</span>
                    {d.description && (
                      <p className="text-gray-600 text-xs">{d.description}</p>
                    )}
                  </div>
                  {editingDiets && (
                    <button
                      onClick={() => handleRemoveDiet(d.id)}
                      className="text-xs text-red-600 hover:underline"
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
                {commonDietOptions.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleAddDietFromTemplate(template)}
                    className="text-xs p-2 bg-gray-100 rounded text-left hover:bg-gray-200"
                  >
                    <div className="font-medium">{template.name}</div>
                    <div className="text-gray-600">{template.description}</div>
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
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        a.status === "pending"
                          ? "bg-yellow-400"
                          : a.status === "in_progress"
                          ? "bg-blue-400"
                          : "bg-green-400"
                      }`}
                    />
                    <span className="font-medium">{a.title}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {a.type}
                    </span>
                  </div>
                  {a.description && (
                    <p className="text-gray-600 text-xs mt-1">
                      {a.description}
                    </p>
                  )}
                  {a.meta && (
                    <p className="text-gray-500 text-xs mt-1">
                      Frequency: {a.meta}
                    </p>
                  )}
                </div>
                {editingActions && (
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => handleToggleActionStatus(a.id)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Toggle
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
                    <span className="font-medium">{item.item}</span>
                    {item.optional && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                        Optional
                      </span>
                    )}
                  </div>
                  {item.quantity && (
                    <p className="text-gray-600 text-xs">
                      Quantity: {item.quantity}
                    </p>
                  )}
                  {item.note && (
                    <p className="text-gray-500 text-xs">
                      Note: {item.note}
                    </p>
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
        
        {/* Instacart Integration */}
        {selectedClient.plan.shoppingList && selectedClient.plan.shoppingList.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-semibold text-green-800 mb-2">
              🛒 Meal & Grocery Planning
            </h4>
            
            {selectedClient.plan.instacartProductsLinkUrl ? (
              <div className="space-y-2">
                <div className="text-xs text-green-700">
                  ✅ Smart shopping list generated for client
                </div>
                {selectedClient.plan.instacartProductsLinkUpdatedAt && (
                  <div className="text-xs text-gray-500">
                    Updated: {new Date(selectedClient.plan.instacartProductsLinkUpdatedAt).toLocaleDateString()}
                  </div>
                )}
                <div className="flex gap-2">
                  <a
                    href={selectedClient.plan.instacartProductsLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700"
                  >
                    Preview Cart
                  </a>
                  <button
                    onClick={handleGenerateInstacartLink}
                    disabled={generatingInstacartLink}
                    className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generatingInstacartLink ? 'Regenerating...' : 'Regenerate'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-600">
                  Combine WIHY suggestions, coach plans, and your own items into one smart list.
                </div>
                <button
                  onClick={handleGenerateInstacartLink}
                  disabled={generatingInstacartLink || !selectedClient.plan.shoppingList?.length}
                  className="text-xs px-3 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50"
                >
                  {generatingInstacartLink ? 'Generating...' : 'Generate Smart List'}
                </button>
              </div>
            )}
            
            {instacartSuccessMessage && (
              <div className="mt-2 text-xs text-green-700 bg-green-100 p-2 rounded">
                {instacartSuccessMessage}
              </div>
            )}
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

          {/* Day selector */}
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
                <div key={mt.key} className="rounded-2xl border border-gray-200 p-4">
                  <div className="text-sm font-semibold text-gray-900 mb-3">
                    {mt.label}
                  </div>
                  <div className="space-y-3">
                    {items.length === 0 ? (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        No {mt.label.toLowerCase()} items yet
                      </div>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-xl border border-gray-100 bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900 mb-1">
                                {item.name}
                              </div>
                              {item.notes && (
                                <div className="text-xs text-gray-600 mb-2">
                                  {item.notes}
                                </div>
                              )}
                              {item.tags && item.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.map((tag, idx) => (
                                    <Chip key={idx} label={tag} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveMeal(mt.key, item.id)}
                              className="ml-2 text-xs text-red-600 hover:underline"
                            >
                              ×
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

  const handleAddClient = () => {
    if (newClientData.name && newClientData.email) {
      const newClient: CoachClient = {
        id: `client-${Date.now()}`,
        name: newClientData.name,
        email: newClientData.email,
        goal: newClientData.goal,
        status: 'pending',
        plan: {
          goals: [],
          diets: [],
          shoppingList: [],
          dietGoals: [],
          actions: [],
          priorities: [],
        }
      };
      
      setClients(prev => [...prev, newClient]);
      setNewClientData({ name: '', email: '', goal: '', phone: '' });
      setShowAddClientModal(false);
    }
  };

  const handleSelectClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
      setActiveTab('plan');
    }
  };

  const createMealPlanForClient = (clientId: string) => {
    const client = coachClients.find(c => c.id === clientId);
    if (client) {
      const mealPlan = {
        id: `meal-plan-${Date.now()}`,
        name: `${client.name}'s Meal Plan`,
        planType: 'This Week' as const,
        goals: [],
        meals: [],
        prepBatches: []
      };
      createClientMealPlan(clientId, mealPlan);
    }
  };

  const createWorkoutPlanForClient = (clientId: string) => {
    const client = coachClients.find(c => c.id === clientId);
    if (client) {
      const workout = {
        name: `${client.name}'s Workout`,
        description: 'Custom workout plan',
        exercises: [],
        duration: 30,
        difficulty: 'beginner' as const,
        date: new Date(),
        status: 'active' as const,
        phases: []
      };
      createClientWorkout(clientId, workout);
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-800">{coachClients.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Plans</p>
              <p className="text-2xl font-bold text-gray-800">{coachClients.filter(c => c.status === 'active').length}</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-800">12</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Messages</p>
              <p className="text-2xl font-bold text-gray-800">5</p>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {coachClients.slice(0, 5).map((client) => (
            <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{client.name}</p>
                  <p className="text-sm text-gray-600">Updated meal plan</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderClients = () => {
    if (selectedClient) {
      // Show detailed client management interface
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: Client List */}
          <div className="lg:col-span-1 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Clients</h2>
              <button
                onClick={() => setShowAddClientModal(true)}
                className="text-xs px-3 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600"
              >
                Add
              </button>
            </div>
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
            <button
              onClick={() => setSelectedClient(null)}
              className="mt-4 w-full text-xs px-3 py-2 bg-gray-500 text-white rounded-full hover:bg-gray-600"
            >
              Back to Overview
            </button>
          </div>

          {/* RIGHT: Details Panel with Tabs */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-200">
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
              {activeTab === "preview" && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Client Preview</h3>
                  <p className="text-gray-600 mb-4">Preview functionality coming soon</p>
                </div>
              )}
            </>
          </div>
        </div>
      );
    }

    // Show client grid overview
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Your Clients</h3>
          <button
            onClick={() => setShowAddClientModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
          >
            <Plus size={16} />
            Add Client
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{client.name}</h4>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  client.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-700' :
                  client.status.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {client.status}
                </span>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectClient(client.id)}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
                >
                  Manage Plans
                </button>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setActiveTab('meals');
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  Meal Plan
                </button>
                <button
                  onClick={() => {
                    setSelectedClient(client);
                    setActiveTab('actions');
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  Workout
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPlans = () => {
    const selectedClient = selectedClientId ? coachClients.find(c => c.id === selectedClientId) : null;
    
    return (
      <div className="space-y-6">
        {selectedClient ? (
          <>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-lg font-medium">
                    {selectedClient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{selectedClient.name}</h3>
                    <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => selectClient('')}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
                >
                  Back to Clients
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Meal Plans</h4>
                  <p className="text-sm text-gray-600 mb-3">Create and manage nutrition plans</p>
                  <button
                    onClick={() => createMealPlanForClient(selectedClient.id)}
                    className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                  >
                    Create Meal Plan
                  </button>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Workout Plans</h4>
                  <p className="text-sm text-gray-600 mb-3">Design fitness routines</p>
                  <button
                    onClick={() => createWorkoutPlanForClient(selectedClient.id)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Create Workout Plan
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">Select a Client</h3>
            <p className="text-gray-600 mb-4">Choose a client from the clients tab to manage their plans</p>
            <button
              onClick={() => setSelectedTab('clients')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              View Clients
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Header Component */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000, 
        backgroundColor: 'white',
        paddingTop: PlatformDetectionService.isNative() ? '48px' : undefined
      }}>
        <Header
          variant="results"
          showLogin={true}
          showSearchInput={true}
          onSearchSubmit={(query) => setSearch(query)}
          searchQuery={search}
          showProgressMenu={true}
          onProgressMenuClick={undefined}
        />
      </div>

      {/* Main Container */}
      <div 
        className="min-h-screen bg-[#f0f7ff] overflow-hidden"
        style={{ paddingTop: windowWidth < 768 ? '320px' : windowWidth < 1200 ? '300px' : '180px' }}
      >
        <div 
          className="w-full min-h-screen bg-[#f0f7ff]"
          style={{
            padding: windowWidth < 768 ? '5px 8px 0 8px' : '10px 20px',
            paddingTop: 0,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          {/* Page Header - only show when not in detailed client view */}
          {!selectedClient && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Coach Dashboard</h1>
                  <p className="text-gray-600">Manage your clients and their wellness plans</p>
                </div>
                <Settings className="h-6 w-6 text-gray-400" />
              </div>

              {/* Tab Navigation */}
              <div className="flex space-x-4 border-b border-gray-200">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'clients', label: 'Clients' },
                  { key: 'plans', label: 'Plans' },
                  { key: 'analytics', label: 'Analytics' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      selectedTab === tab.key
                        ? 'text-orange-600 border-orange-600'
                        : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-6">
            {selectedClient ? (
              // Show comprehensive client management when a client is selected
              renderClients()
            ) : (
              // Show tab-based navigation when no client is selected
              <>
                {selectedTab === 'overview' && renderOverview()}
                {selectedTab === 'clients' && renderClients()}
                {selectedTab === 'plans' && renderPlans()}
                {selectedTab === 'analytics' && (
                  <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Analytics Coming Soon</h3>
                    <p className="text-gray-600">Track client progress and engagement metrics</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Client</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newClientData.name}
                  onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newClientData.email}
                  onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Enter client email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Goal</label>
                <input
                  type="text"
                  value={newClientData.goal}
                  onChange={(e) => setNewClientData({ ...newClientData, goal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="e.g., Weight loss, Muscle gain, General health"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddClientModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClientData.name || !newClientData.email}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CoachDashboardPage;