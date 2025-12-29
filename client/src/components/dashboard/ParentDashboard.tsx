import React, { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, X } from "lucide-react";

type ChildStatus = "ok" | "needs_attention" | "offline";
type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";
type ActionType = "meal" | "activity" | "habit" | "health" | "education";
type ActionStatus = "pending" | "in_progress" | "completed";

interface ChildDaySummary {
  date: string;
  mealsLogged: number;
  movementMinutes: number;
  steps: number;
  sleepHours: number;
  mood?: "happy" | "tired" | "upset" | "neutral";
}

interface ChildFoodSummary {
  todayQuality: "great" | "good" | "mixed" | "poor";
  notes?: string;
  favorites: string[];
  problemFoods: string[];
}

interface ChildActivitySummary {
  todayMinutes: number;
  weekMinutes: number;
  sports?: string;
}

interface MealItem {
  id: string;
  name: string;
  servings?: number;
  notes?: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
}

interface MealDay {
  id: string;
  label: string;
  meals: Partial<Record<MealType, MealItem[]>>;
}

interface MealProgram {
  programTitle?: string;
  programDescription?: string;
  days: MealDay[];
}

interface ShoppingListItem {
  id: string;
  item: string;
  category: string;
  quantity?: string;
  checked?: boolean;
}

interface Action {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  status: ActionStatus;
  frequency?: string;
}

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  birthDate?: string;
  avatarColor: string;
  status: ChildStatus;
  mainGoal: string;
  riskFlags: string[];
  dietaryRestrictions?: string[];
  today: ChildDaySummary;
  food: ChildFoodSummary;
  activity: ChildActivitySummary;
  notes: string[];
  mealProgram?: MealProgram;
  shoppingList?: ShoppingListItem[];
  actions?: Action[];
  priorities?: { id: string; title: string }[];
}

const mockKids: ChildProfile[] = [
  {
    id: "k1",
    name: "Jordan",
    age: 10,
    avatarColor: "bg-emerald-500",
    status: "ok",
    mainGoal: "More movement and less sugary drinks",
    riskFlags: ["Tends to snack late", "Low veggie intake"],
    today: {
      date: "2025-12-01",
      mealsLogged: 3,
      movementMinutes: 35,
      steps: 6200,
      sleepHours: 8.0,
      mood: "happy",
    },
    food: {
      todayQuality: "good",
      favorites: ["Chicken tacos", "Apple slices", "Yogurt"],
      problemFoods: ["Soda", "Chips"],
      notes: "Did great at breakfast and lunch. Dinner was rushed.",
    },
    activity: {
      todayMinutes: 35,
      weekMinutes: 140,
      sports: "Recess, bike rides",
    },
    notes: [
      "Jordan tried carrot sticks at lunch.",
      "Asked about bringing water bottle to school.",
    ],
    shoppingList: [],
    actions: [
      {
        id: "a1",
        type: "meal",
        title: "Pack healthy lunch",
        description: "Include veggies and protein",
        status: "pending",
        frequency: "daily"
      }
    ],
    priorities: [
      { id: "p1", title: "Increase veggie intake" },
      { id: "p2", title: "More water, less soda" }
    ]
  },
  {
    id: "k2",
    name: "Amira",
    age: 14,
    avatarColor: "bg-sky-500",
    status: "needs_attention",
    mainGoal: "Better sleep and regular meals",
    riskFlags: ["Skips breakfast", "Scrolls late on school nights"],
    today: {
      date: "2025-12-01",
      mealsLogged: 2,
      movementMinutes: 15,
      steps: 3100,
      sleepHours: 6.0,
      mood: "tired",
    },
    food: {
      todayQuality: "mixed",
      favorites: ["Smoothies", "Pasta", "Strawberries"],
      problemFoods: ["Energy drinks"],
      notes: "Skipped breakfast. Light lunch. Snacked in afternoon.",
    },
    activity: {
      todayMinutes: 15,
      weekMinutes: 65,
      sports: "PE class",
    },
    notes: [
      "Stayed up late studying; phone use after 11pm.",
      "Talk together about a simple bedtime routine.",
    ],
    shoppingList: [],
    actions: [
      {
        id: "a2",
        type: "habit",
        title: "Bedtime routine",
        description: "No screens after 9pm",
        status: "in_progress",
        frequency: "daily"
      }
    ],
    priorities: [
      { id: "p3", title: "Improve sleep schedule" },
      { id: "p4", title: "Never skip breakfast" }
    ]
  },
];

type TabId = "overview" | "food" | "activity" | "notes" | "meals" | "actions";

// Helper to generate IDs
const makeId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Avatar color options
const avatarColors = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-rose-500"
];

const ParentDashboard: React.FC = () => {
  const [kids, setKids] = useState<ChildProfile[]>(mockKids);
  const [selectedKidId, setSelectedKidId] = useState<string>(mockKids[0]?.id);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [search, setSearch] = useState("");
  
  // Modal states
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  
  // Form state for new/edit child
  const [childFormData, setChildFormData] = useState({
    name: "",
    birthDate: "",
    mainGoal: "",
    dietaryRestrictions: "",
    sports: ""
  });

  // Handlers for child CRUD operations
  const handleAddChild = () => {
    if (!childFormData.name.trim()) return;
    
    const birthDate = childFormData.birthDate || new Date().toISOString().split('T')[0];
    const age = Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    const newChild: ChildProfile = {
      id: makeId('child'),
      name: childFormData.name.trim(),
      age: age || 0,
      birthDate: birthDate,
      avatarColor: avatarColors[kids.length % avatarColors.length],
      status: "ok",
      mainGoal: childFormData.mainGoal.trim() || "Healthy growth and development",
      riskFlags: [],
      dietaryRestrictions: childFormData.dietaryRestrictions ? childFormData.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : [],
      today: {
        date: new Date().toISOString().split('T')[0],
        mealsLogged: 0,
        movementMinutes: 0,
        steps: 0,
        sleepHours: 0,
        mood: "neutral"
      },
      food: {
        todayQuality: "good",
        favorites: [],
        problemFoods: []
      },
      activity: {
        todayMinutes: 0,
        weekMinutes: 0,
        sports: childFormData.sports.trim()
      },
      notes: [],
      shoppingList: [],
      actions: [],
      priorities: []
    };
    
    setKids([...kids, newChild]);
    setSelectedKidId(newChild.id);
    setShowAddChildModal(false);
    setChildFormData({ name: "", birthDate: "", mainGoal: "", dietaryRestrictions: "", sports: "" });
  };

  const handleEditChild = () => {
    if (!editingChildId || !childFormData.name.trim()) return;
    
    const birthDate = childFormData.birthDate || new Date().toISOString().split('T')[0];
    const age = Math.floor((new Date().getTime() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    
    setKids(kids.map(kid => {
      if (kid.id === editingChildId) {
        return {
          ...kid,
          name: childFormData.name.trim(),
          age: age || kid.age,
          birthDate: birthDate,
          mainGoal: childFormData.mainGoal.trim() || kid.mainGoal,
          dietaryRestrictions: childFormData.dietaryRestrictions ? childFormData.dietaryRestrictions.split(',').map(s => s.trim()).filter(Boolean) : kid.dietaryRestrictions,
          activity: {
            ...kid.activity,
            sports: childFormData.sports.trim() || kid.activity.sports
          }
        };
      }
      return kid;
    }));
    
    setShowEditChildModal(false);
    setEditingChildId(null);
    setChildFormData({ name: "", birthDate: "", mainGoal: "", dietaryRestrictions: "", sports: "" });
  };

  const handleDeleteChild = (childId: string) => {
    if (!confirm("Are you sure you want to remove this child's profile?")) return;
    
    const newKids = kids.filter(k => k.id !== childId);
    setKids(newKids);
    
    if (selectedKidId === childId && newKids.length > 0) {
      setSelectedKidId(newKids[0].id);
    }
  };

  const openEditModal = (kid: ChildProfile) => {
    setEditingChildId(kid.id);
    setChildFormData({
      name: kid.name,
      birthDate: kid.birthDate || "",
      mainGoal: kid.mainGoal,
      dietaryRestrictions: kid.dietaryRestrictions?.join(', ') || "",
      sports: kid.activity.sports || ""
    });
    setShowEditChildModal(true);
  };

  const openAddModal = () => {
    setChildFormData({ name: "", birthDate: "", mainGoal: "", dietaryRestrictions: "", sports: "" });
    setShowAddChildModal(true);
  };

  const selectedKid = useMemo(
    () => kids.find((k) => k.id === selectedKidId) ?? kids[0],
    [kids, selectedKidId]
  );

  const filteredKids = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return kids;
    return kids.filter(
      (k) =>
        k.name.toLowerCase().includes(q) ||
        String(k.age).includes(q)
    );
  }, [kids, search]);

  // Simple aggregate for parent-level summary
  const aggregate = useMemo(() => {
    if (kids.length === 0) {
      return { avgSleep: 0, totalMovement: 0, totalMeals: 0 };
    }
    const totalSleep = kids.reduce((sum, k) => sum + k.today.sleepHours, 0);
    const totalMovement = kids.reduce(
      (sum, k) => sum + k.today.movementMinutes,
      0
    );
    const totalMeals = kids.reduce((sum, k) => sum + k.today.mealsLogged, 0);
    return {
      avgSleep: totalSleep / kids.length,
      totalMovement,
      totalMeals,
    };
  }, [kids]);

  // Notes input for selected kid (local only)
  const [newNote, setNewNote] = useState("");
  const handleAddNote = () => {
    if (!selectedKid || !newNote.trim()) return;
    const text = newNote.trim();
    setKids((prev) =>
      prev.map((k) =>
        k.id === selectedKid.id ? { ...k, notes: [text, ...k.notes] } : k
      )
    );
    setNewNote("");
  };

  return (
    <>
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(280px,1fr)] gap-6">
          {/* Left column: kids list + selected detail */}
          <div className="space-y-6">
            {/* Kids list */}
            <section className="rounded-lg bg-white border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 py-1">
                <div className="flex items-center gap-3 overflow-hidden">
                  <h2 className="text-lg font-bold text-slate-900 leading-relaxed truncate">
                    Your Kids
                  </h2>
                  <span className="text-xs text-slate-500 flex-shrink-0 bg-blue-100 px-2.5 py-1 rounded-full font-medium">
                    {kids.length} total
                  </span>
                </div>
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold"
                >
                  <Plus size={16} />
                  Add Child
                </button>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search by name or age..."
                  className="w-full rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                {filteredKids.map((child) => {
                  const active = child.id === selectedKidId;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => {
                        setSelectedKidId(child.id);
                        setActiveTab("overview");
                      }}
                      className={`w-full text-left flex gap-4 rounded-xl border-2 px-4 py-3.5 leading-relaxed ${
                        active
                          ? "border-blue-500 bg-blue-100"
                          : "border-blue-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-col justify-center">
                        <div
                          className={`h-12 w-12 rounded-full ${child.avatarColor} flex items-center justify-center text-base font-bold text-white shadow ring-4 ${
                            active ? 'ring-blue-100' : 'ring-white'
                          }`}
                        >
                          {child.name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 truncate">
                            {child.name}, {child.age}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                            child.status === "ok"
                              ? "bg-blue-100 text-blue-700"
                              : child.status === "needs_attention"
                              ? "bg-blue-200 text-blue-800"
                              : "bg-blue-100 text-blue-600"
                          }`}>
                            {child.status === "ok"
                              ? "✓ On track"
                              : child.status === "needs_attention"
                              ? "⚠ Check-in"
                              : "Offline"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed font-medium">
                          {child.today.mealsLogged} meals · {child.today.movementMinutes} min · {child.today.sleepHours.toFixed(1)}h sleep
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Selected child detail */}
            {selectedKid && (
              <section className="rounded-lg bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6 py-1">
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-14 w-14 rounded-full ${selectedKid.avatarColor} flex items-center justify-center text-xl font-bold text-white shadow ring-4 ring-white`}
                    >
                      {selectedKid.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 leading-relaxed">
                        {selectedKid.name}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium">
                        Age {selectedKid.age} · {selectedKid.mainGoal}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(selectedKid)}
                      className="p-2.5 text-slate-600 bg-white rounded-xl border border-blue-200"
                      title="Edit child profile"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteChild(selectedKid.id)}
                      className="p-2.5 text-slate-600 bg-white rounded-xl border border-blue-200"
                      title="Delete child profile"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto overflow-y-hidden scrollbar-hide">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "food", label: "Food" },
                    { id: "activity", label: "Activity" },
                    { id: "meals", label: "Meal Plans" },
                    { id: "actions", label: "Actions" },
                    { id: "notes", label: "Notes" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as TabId)}
                      className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-600"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <ChildOverview kid={selectedKid} />
                )}
                {activeTab === "food" && <ChildFood kid={selectedKid} />}
                {activeTab === "activity" && (
                  <ChildActivity kid={selectedKid} />
                )}
                {activeTab === "meals" && (
                  <ChildMealPlans kid={selectedKid} onUpdate={(updated) => {
                    setKids(kids.map(k => k.id === updated.id ? updated : k));
                  }} />
                )}
                {activeTab === "actions" && (
                  <ChildActions kid={selectedKid} onUpdate={(updated) => {
                    setKids(kids.map(k => k.id === updated.id ? updated : k));
                  }} />
                )}
                {activeTab === "notes" && (
                  <ChildNotes
                    kid={selectedKid}
                    newNote={newNote}
                    setNewNote={setNewNote}
                    onAddNote={handleAddNote}
                  />
                )}
              </section>
            )}
          </div>

          {/* Right column: summary cards */}
          <div className="space-y-6">
            <section className="rounded-lg bg-white border border-gray-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-5 py-1 leading-relaxed flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Family Summary
              </h2>
              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Kids monitored:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {kids.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Avg sleep:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {aggregate.avgSleep.toFixed(1)} h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total movement:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {aggregate.totalMovement} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Meals logged:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {aggregate.totalMeals}
                  </span>
                </div>
              </div>
            </section>

            {selectedKid && (
              <section className="rounded-lg bg-white border border-gray-200 p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4 py-1 leading-relaxed flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  Today&apos;s Goal
                </h2>
                <p className="text-sm text-slate-800 font-medium leading-relaxed">
                  {selectedKid.mainGoal}
                </p>
                {selectedKid.riskFlags.length > 0 && (
                  <>
                    <p className="text-sm text-slate-900 font-semibold mt-4 mb-2">
                      Things to watch:
                    </p>
                    <ul className="space-y-2">
                      {selectedKid.riskFlags.map((flag, idx) => (
                        <li key={idx} className="text-sm text-slate-800 flex items-start gap-2 bg-white p-2 rounded-lg">
                          <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </section>
            )}
          </div>
        </div>
        </div>
        </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-blue-50 rounded-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto shadow border border-blue-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add New Child</h3>
              <button
                onClick={() => setShowAddChildModal(false)}
                className="text-slate-400 p-2 bg-white rounded-lg border border-blue-200"
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Child's Name *</label>
                <input
                  type="text"
                  value={childFormData.name}
                  onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="Enter child's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Birth Date</label>
                <input
                  type="date"
                  value={childFormData.birthDate}
                  onChange={(e) => setChildFormData({ ...childFormData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Health Goal</label>
                <input
                  type="text"
                  value={childFormData.mainGoal}
                  onChange={(e) => setChildFormData({ ...childFormData, mainGoal: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Healthy growth, More vegetables"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Restrictions</label>
                <input
                  type="text"
                  value={childFormData.dietaryRestrictions}
                  onChange={(e) => setChildFormData({ ...childFormData, dietaryRestrictions: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Nut allergy, Lactose intolerant (comma separated)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sports/Activities</label>
                <input
                  type="text"
                  value={childFormData.sports}
                  onChange={(e) => setChildFormData({ ...childFormData, sports: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Soccer, Swimming, Dance"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowAddChildModal(false)}
                className="flex-1 px-5 py-3 border-2 border-blue-300 text-slate-700 rounded-xl font-semibold bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddChild}
                disabled={!childFormData.name.trim()}
                className="flex-1 px-5 py-3 bg-blue-500 text-white rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold"
              >
                Add Child
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Child Modal */}
      {showEditChildModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 max-h-[90vh] overflow-y-auto shadow border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Edit Child Profile</h3>
              <button
                onClick={() => setShowEditChildModal(false)}
                className="text-slate-400 p-2 bg-white rounded-lg border border-blue-200"
              >
                <X size={22} />
              </button>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Child's Name *</label>
                <input
                  type="text"
                  value={childFormData.name}
                  onChange={(e) => setChildFormData({ ...childFormData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="Enter child's name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Birth Date</label>
                <input
                  type="date"
                  value={childFormData.birthDate}
                  onChange={(e) => setChildFormData({ ...childFormData, birthDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Primary Health Goal</label>
                <input
                  type="text"
                  value={childFormData.mainGoal}
                  onChange={(e) => setChildFormData({ ...childFormData, mainGoal: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Healthy growth, More vegetables"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Restrictions</label>
                <input
                  type="text"
                  value={childFormData.dietaryRestrictions}
                  onChange={(e) => setChildFormData({ ...childFormData, dietaryRestrictions: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Nut allergy, Lactose intolerant (comma separated)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Sports/Activities</label>
                <input
                  type="text"
                  value={childFormData.sports}
                  onChange={(e) => setChildFormData({ ...childFormData, sports: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50 transition-all duration-200"
                  placeholder="e.g., Soccer, Swimming, Dance"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowEditChildModal(false)}
                className="flex-1 px-5 py-3 border-2 border-blue-300 text-slate-700 rounded-xl font-semibold bg-white"
              >
                Cancel
              </button>
              <button
                onClick={handleEditChild}
                disabled={!childFormData.name.trim()}
                className="flex-1 px-5 py-3 bg-blue-500 text-white rounded-xl disabled:bg-slate-300 disabled:cursor-not-allowed font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ---- Tab content components ----

const ChildOverview: React.FC<{ kid: ChildProfile }> = ({ kid }) => {
  const moodLabel =
    kid.today.mood === "happy"
      ? "😊 Happy"
      : kid.today.mood === "tired"
      ? "😴 Tired"
      : kid.today.mood === "upset"
      ? "😔 Upset"
      : "😐 Neutral";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-medium mb-1">Sleep</div>
            <div className="text-lg font-bold text-blue-600">
              {kid.today.sleepHours.toFixed(1)} h
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-medium mb-1">Movement</div>
            <div className="text-lg font-bold text-purple-600">
              {kid.today.movementMinutes} min
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-xs font-medium mb-1">Meals</div>
            <div className="text-lg font-bold text-orange-600">
              {kid.today.mealsLogged}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-700 mb-3 font-medium">
          <span className="font-bold text-slate-900">Mood today:</span> {moodLabel}
        </p>
        <p className="text-sm text-slate-700 font-medium">
          <span className="font-bold text-slate-900">Steps:</span> <span className="text-emerald-600 font-bold">{kid.today.steps.toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
};

const ChildFood: React.FC<{ kid: ChildProfile }> = ({ kid }) => {
  const qualityLabel =
    kid.food.todayQuality === "great"
      ? "Great"
      : kid.food.todayQuality === "good"
      ? "Good"
      : kid.food.todayQuality === "mixed"
      ? "Mixed"
      : "Needs work";

  const qualityColor =
    kid.food.todayQuality === "great"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : kid.food.todayQuality === "good"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : kid.food.todayQuality === "mixed"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border-2 p-5 shadow-sm ${qualityColor}`}>
        <p className="text-sm font-bold mb-2">
          Overall quality: <span className="font-extrabold">{qualityLabel}</span>
        </p>
        {kid.food.notes && (
          <p className="text-sm opacity-90">{kid.food.notes}</p>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-lg">✓</span>
          Helpful foods
        </h3>
        <div className="flex flex-wrap gap-2">
          {kid.food.favorites.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border-2 border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          Limit / watch
        </h3>
        <div className="flex flex-wrap gap-2">
          {kid.food.problemFoods.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-100 border-2 border-red-200 px-4 py-2 text-xs font-semibold text-red-800 shadow-sm"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChildActivity: React.FC<{ kid: ChildProfile }> = ({ kid }) => (
  <div className="space-y-5">
    <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 p-5 shadow-sm">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-medium mb-1">Today</div>
          <div className="text-lg font-bold text-purple-600">
            {kid.activity.todayMinutes} min
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-medium mb-1">This week</div>
          <div className="text-lg font-bold text-blue-600">
            {kid.activity.weekMinutes} min
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="text-slate-500 text-xs font-medium mb-1">Steps</div>
          <div className="text-lg font-bold text-emerald-600">
            {kid.today.steps.toLocaleString()}
          </div>
        </div>
      </div>
    </div>

    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-lg">🏃</span>
        Activities
      </h3>
      <p className="text-sm text-slate-700 font-medium mb-3">
        {kid.activity.sports ? (
          kid.activity.sports
        ) : (
          "No specific sports logged today."
        )}
      </p>
      <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
        💡 <strong>Tip:</strong> Aim for at least 60 minutes of movement most days. Short play sessions and walks all count.
      </p>
    </div>
  </div>
);

const ChildMealPlans: React.FC<{ kid: ChildProfile; onUpdate: (kid: ChildProfile) => void }> = ({ kid, onUpdate }) => {
  const [showAddMeal, setShowAddMeal] = useState(false);
  
  const hasShoppingList = kid.shoppingList && kid.shoppingList.length > 0;
  
  return (
    <div className="space-y-4">
      {!kid.mealProgram && (
        <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-4 text-center">
          <p className="text-sm text-slate-600 mb-3">No meal plan created yet</p>
          <button
            onClick={() => {
              const newProgram: MealProgram = {
                programTitle: `${kid.name}'s Meal Plan`,
                programDescription: "Weekly meal plan",
                days: [
                  { id: "day1", label: "Day 1", meals: {} },
                  { id: "day2", label: "Day 2", meals: {} },
                  { id: "day3", label: "Day 3", meals: {} },
                ]
              };
              onUpdate({ ...kid, mealProgram: newProgram });
            }}
            className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Create Meal Plan
          </button>
        </div>
      )}
      
      {kid.mealProgram && (
        <>
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <h3 className="text-sm font-semibold text-emerald-900 mb-1">
              {kid.mealProgram.programTitle}
            </h3>
            {kid.mealProgram.programDescription && (
              <p className="text-xs text-emerald-800">{kid.mealProgram.programDescription}</p>
            )}
          </div>
          
          <div className="space-y-3">
            {kid.mealProgram.days.map(day => (
              <div key={day.id} className="rounded-lg border border-slate-200 p-3">
                <h4 className="text-xs font-semibold text-slate-800 mb-2">{day.label}</h4>
                <div className="space-y-2 text-xs text-slate-600">
                  {(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as MealType[]).map(mealType => {
                    const meals = day.meals[mealType] || [];
                    return (
                      <div key={mealType} className="flex items-start gap-2">
                        <span className="font-medium min-w-[70px] text-slate-500">{mealType}:</span>
                        <span className="flex-1">
                          {meals.length > 0 ? meals.map(m => m.name).join(', ') : 'Not planned'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          
          <div className="pt-3 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">Shopping List</h4>
            {!hasShoppingList && (
              <button
                onClick={() => {
                  const newList: ShoppingListItem[] = [
                    { id: makeId('shop'), item: 'Fruits & vegetables', category: 'produce', quantity: 'Weekly supply' },
                    { id: makeId('shop'), item: 'Whole grain bread', category: 'grains', quantity: '1 loaf' },
                    { id: makeId('shop'), item: 'Lean protein', category: 'protein', quantity: 'As needed' },
                  ];
                  onUpdate({ ...kid, shoppingList: newList });
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                + Generate Shopping List
              </button>
            )}
            {hasShoppingList && (
              <div className="space-y-1.5">
                {kid.shoppingList!.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={item.checked || false}
                      onChange={(e) => {
                        const updated = {
                          ...kid,
                          shoppingList: kid.shoppingList!.map(i =>
                            i.id === item.id ? { ...i, checked: e.target.checked } : i
                          )
                        };
                        onUpdate(updated);
                      }}
                      className="rounded border-slate-300"
                    />
                    <span className={item.checked ? 'line-through text-slate-400' : 'text-slate-700'}>
                      {item.item} {item.quantity && `(${item.quantity})`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

const ChildActions: React.FC<{ kid: ChildProfile; onUpdate: (kid: ChildProfile) => void }> = ({ kid, onUpdate }) => {
  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionType, setNewActionType] = useState<ActionType>("meal");
  
  const handleAddAction = () => {
    if (!newActionTitle.trim()) return;
    
    const newAction: Action = {
      id: makeId('action'),
      type: newActionType,
      title: newActionTitle.trim(),
      status: "pending",
      frequency: "daily"
    };
    
    onUpdate({
      ...kid,
      actions: [...(kid.actions || []), newAction]
    });
    
    setNewActionTitle("");
    setShowAddAction(false);
  };
  
  const toggleActionStatus = (actionId: string) => {
    const updated = {
      ...kid,
      actions: kid.actions!.map(a => {
        if (a.id === actionId) {
          const statuses: ActionStatus[] = ['pending', 'in_progress', 'completed'];
          const currentIndex = statuses.indexOf(a.status);
          const nextStatus = statuses[(currentIndex + 1) % statuses.length];
          return { ...a, status: nextStatus };
        }
        return a;
      })
    };
    onUpdate(updated);
  };
  
  const deleteAction = (actionId: string) => {
    onUpdate({
      ...kid,
      actions: kid.actions!.filter(a => a.id !== actionId)
    });
  };
  
  const actions = kid.actions || [];
  const priorities = kid.priorities || [];
  
  return (
    <div className="space-y-4">
      {/* Priorities */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">Health Priorities</h3>
        {priorities.length === 0 && (
          <p className="text-xs text-slate-500">No priorities set</p>
        )}
        {priorities.map(priority => (
          <div key={priority.id} className="flex items-start gap-2 mb-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-xs text-slate-700">{priority.title}</span>
          </div>
        ))}
      </div>
      
      {/* Actions */}
      <div className="pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Daily Actions</h3>
          <button
            onClick={() => setShowAddAction(!showAddAction)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            <Plus size={12} />
            Add Action
          </button>
        </div>
        
        {showAddAction && (
          <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="text"
              value={newActionTitle}
              onChange={(e) => setNewActionTitle(e.target.value)}
              placeholder="Action title..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex items-center gap-2">
              <select
                value={newActionType}
                onChange={(e) => setNewActionType(e.target.value as ActionType)}
                className="flex-1 px-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="meal">Meal</option>
                <option value="activity">Activity</option>
                <option value="habit">Habit</option>
                <option value="health">Health</option>
                <option value="education">Education</option>
              </select>
              <button
                onClick={handleAddAction}
                className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-md hover:bg-emerald-600"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddAction(false)}
                className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs rounded-md hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {actions.length === 0 && !showAddAction && (
          <p className="text-xs text-slate-500">No actions yet</p>
        )}
        
        <div className="space-y-2">
          {actions.map(action => (
            <div
              key={action.id}
              className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                action.status === 'completed'
                  ? 'bg-emerald-50 border-emerald-200'
                  : action.status === 'in_progress'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <button
                onClick={() => toggleActionStatus(action.id)}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  action.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-500'
                    : action.status === 'in_progress'
                    ? 'bg-blue-500 border-blue-500'
                    : 'border-slate-300 hover:border-emerald-400'
                }`}
              >
                {action.status === 'completed' && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {action.status === 'in_progress' && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${
                    action.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-800'
                  }`}>
                    {action.title}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                    {action.type}
                  </span>
                </div>
                {action.description && (
                  <p className="text-[10px] text-slate-500 mt-0.5">{action.description}</p>
                )}
              </div>
              
              <button
                onClick={() => deleteAction(action.id)}
                className="text-slate-400 hover:text-red-500 flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ChildNotes: React.FC<{
  kid: ChildProfile;
  newNote: string;
  setNewNote: (v: string) => void;
  onAddNote: () => void;
}> = ({ kid, newNote, setNewNote, onAddNote }) => (
  <div className="space-y-4">
    {kid.notes.length === 0 && (
      <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-200">
        📝 No notes yet. Use this space to track patterns, conversations, or things to ask the pediatrician.
      </p>
    )}
    {kid.notes.map((note, idx) => (
      <div
        key={idx}
        className="rounded-xl border-2 border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 leading-relaxed shadow-sm hover:shadow-md transition-shadow"
      >
        {note}
      </div>
    ))}
    
    <div className="flex items-center gap-3 pt-4 border-t-2 border-slate-200">
      <input
        type="text"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add a quick note…"
        className="flex-1 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
      />
      <button
        type="button"
        onClick={onAddNote}
        className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white hover:shadow-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
      >
        Save
      </button>
    </div>
  </div>
);

export default ParentDashboard;
