import React, { useState, useMemo } from "react";
import { WihyCoachModel } from "./MyProgressDashboard";

// -----------------------------------------------------------------
// TYPE DEFINITIONS (nutrition features)
// -----------------------------------------------------------------
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

export type ShoppingListItem = {
  id: string;
  name: string;
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

// Extended plan with nutrition
export interface CoachPlan extends WihyCoachModel {
  goals?: string[];           // Simple array of goal strings
  diets?: DietTag[];          // Custom diet patterns
  shoppingList?: ShoppingListItem[];
  dietGoals?: DietGoalKey[];  // Selected from the 11 core diet approaches
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
export type TabKey = "plan" | "actions" | "shopping" | "preview";

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
          name: "Chicken breast",
          category: "protein",
          quantity: "2 lbs",
        },
        {
          id: "shop-alice-2",
          name: "Spinach",
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
          name: "Ground beef",
          category: "protein",
          quantity: "3 lbs",
        },
        {
          id: "shop-bob-2",
          name: "Eggs",
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
    const newItem: ShoppingListItem = {
      id: makeId("shop"),
      name: newShoppingName.trim(),
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
                    <span className="font-semibold">{item.name}</span>
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
  // RENDER HELPERS: Preview Tab (MyProgressDashboard placeholder)
  // -----------------------------------------------------------------
  function renderPreview() {
    if (!selectedClient) return null;
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Client View Preview
        </h3>
        <p className="text-sm text-gray-600">
          Here you could embed the <code>MyProgressDashboard</code> component
          to show how the client sees their plan.
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------------
  // MAIN RENDER
  // -----------------------------------------------------------------
  return (
    <div
      className="min-h-screen p-6 overflow-auto"
      style={{ backgroundColor: "#f0f7ff" }}
    >
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Coach Portal – Client Plans
        </h1>

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
