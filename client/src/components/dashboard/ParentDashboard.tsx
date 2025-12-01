import React, { useMemo, useState } from "react";

type ChildStatus = "ok" | "needs_attention" | "offline";

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

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  avatarColor: string;
  status: ChildStatus;
  mainGoal: string;
  riskFlags: string[];
  today: ChildDaySummary;
  food: ChildFoodSummary;
  activity: ChildActivitySummary;
  notes: string[];
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
  },
];

type TabId = "overview" | "food" | "activity" | "notes";

const ParentDashboard: React.FC = () => {
  const [kids, setKids] = useState<ChildProfile[]>(mockKids);
  const [selectedKidId, setSelectedKidId] = useState<string>(mockKids[0]?.id);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [search, setSearch] = useState("");

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
      <div className="w-full bg-[#f0f7ff] min-h-[70vh] relative">
        <header className="flex flex-col gap-2 pb-4">
          <h1 className="dashboard-title text-[22px] text-center mb-3 mt-2 px-2 leading-normal">
            Parent Dashboard – Today
          </h1>
          <p className="text-sm text-slate-600 text-center">
            Monitor how your kids are eating, moving, and sleeping
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
          {/* Left column: kids list + selected detail */}
          <div className="space-y-6">
            {/* Kids list */}
            <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-4 py-1">
                <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">
                  Your Kids
                </h2>
                <span className="text-[11px] text-slate-500">
                  {kids.length} total
                </span>
              </div>

              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Search by name or age"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                      className={`w-full text-left flex gap-3 rounded-xl border transition-colors px-3 py-2.5 leading-relaxed ${
                        active
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-100 bg-slate-50/70 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex flex-col justify-center">
                        <div
                          className={`h-9 w-9 rounded-full ${child.avatarColor} flex items-center justify-center text-sm font-semibold text-white`}
                        >
                          {child.name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {child.name}, {child.age}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                            {child.status === "ok"
                              ? "On track"
                              : child.status === "needs_attention"
                              ? "Needs attention"
                              : "Offline"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">
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
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 leading-relaxed">
                <div className="flex items-center justify-between mb-4 py-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 rounded-full ${selectedKid.avatarColor} flex items-center justify-center text-sm font-semibold text-white`}
                    >
                      {selectedKid.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-800 leading-relaxed">
                        {selectedKid.name}
                      </h2>
                      <p className="text-[11px] text-slate-500">
                        Age {selectedKid.age} · {selectedKid.mainGoal}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4 border-b border-slate-100">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "food", label: "Food" },
                    { id: "activity", label: "Activity" },
                    { id: "notes", label: "Notes" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as TabId)}
                      className={`px-4 py-2 text-xs font-medium transition-colors ${
                        activeTab === tab.id
                          ? "text-emerald-600 border-b-2 border-emerald-600"
                          : "text-slate-500 hover:text-slate-700"
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
            <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
              <h2 className="text-sm font-semibold text-slate-800 mb-4 py-1 leading-relaxed">
                Family Summary
              </h2>
              <div className="space-y-3 text-[11px] text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Kids monitored:</span>
                  <span className="font-semibold text-slate-900">
                    {kids.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Avg sleep last night:</span>
                  <span className="font-semibold text-slate-900">
                    {aggregate.avgSleep.toFixed(1)} h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total movement today:</span>
                  <span className="font-semibold text-slate-900">
                    {aggregate.totalMovement} min
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total meals logged:</span>
                  <span className="font-semibold text-slate-900">
                    {aggregate.totalMeals}
                  </span>
                </div>
              </div>
            </section>

            {selectedKid && (
              <section className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <h2 className="text-sm font-semibold text-emerald-900 mb-3 py-1 leading-relaxed">
                  Today&apos;s Goal
                </h2>
                <p className="text-[11px] text-emerald-800">
                  {selectedKid.mainGoal}
                </p>
                {selectedKid.riskFlags.length > 0 && (
                  <>
                    <p className="text-[11px] text-emerald-800 font-medium mt-3 mb-1">
                      Things to watch:
                    </p>
                    <ul className="space-y-1">
                      {selectedKid.riskFlags.map((flag, idx) => (
                        <li key={idx} className="text-[11px] text-emerald-800 flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 mb-3">
        <div className="grid grid-cols-3 gap-3 text-[11px]">
          <div>
            <div className="text-slate-500">Sleep</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {kid.today.sleepHours.toFixed(1)} h
            </div>
          </div>
          <div>
            <div className="text-slate-500">Movement</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {kid.today.movementMinutes} min
            </div>
          </div>
          <div>
            <div className="text-slate-500">Meals</div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              {kid.today.mealsLogged}
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-slate-600 mb-2">
          <span className="font-medium text-slate-700">Mood today:</span> {moodLabel}
        </p>
        <p className="text-[11px] text-slate-600">
          <span className="font-medium text-slate-700">Steps:</span> {kid.today.steps.toLocaleString()}
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

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 mb-3">
        <p className="text-[11px] text-slate-700 mb-1">
          Overall quality: <span className="font-semibold">{qualityLabel}</span>
        </p>
        {kid.food.notes && (
          <p className="text-[11px] text-slate-600">{kid.food.notes}</p>
        )}
      </div>

      <div>
        <h3 className="text-[11px] font-semibold text-slate-700 mb-2">
          Helpful foods
        </h3>
        <div className="flex flex-wrap gap-2">
          {kid.food.favorites.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-[11px] text-emerald-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-[11px] font-semibold text-slate-700 mb-2">
          Limit / watch
        </h3>
        <div className="flex flex-wrap gap-2">
          {kid.food.problemFoods.map((item, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-100 px-3 py-1 text-[11px] text-red-700"
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
  <div className="space-y-4">
    <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 mb-3">
      <div className="grid grid-cols-3 gap-3 text-[11px]">
        <div>
          <div className="text-slate-500">Today</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {kid.activity.todayMinutes} min
          </div>
        </div>
        <div>
          <div className="text-slate-500">This week</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {kid.activity.weekMinutes} min
          </div>
        </div>
        <div>
          <div className="text-slate-500">Steps</div>
          <div className="text-sm font-semibold text-slate-900 mt-1">
            {kid.today.steps.toLocaleString()}
          </div>
        </div>
      </div>
    </div>

    <div>
      <h3 className="text-[11px] font-semibold text-slate-700 mb-2">
        Activities
      </h3>
      <p className="text-[11px] text-slate-600">
        {kid.activity.sports ? (
          kid.activity.sports
        ) : (
          "No specific sports logged today."
        )}
      </p>
      <p className="mt-2 text-[11px] text-slate-500">
        Aim for at least 60 minutes of movement most days. Short play sessions and walks all count.
      </p>
    </div>
  </div>
);

const ChildNotes: React.FC<{
  kid: ChildProfile;
  newNote: string;
  setNewNote: (v: string) => void;
  onAddNote: () => void;
}> = ({ kid, newNote, setNewNote, onAddNote }) => (
  <div className="space-y-3">
    {kid.notes.length === 0 && (
      <p className="text-[11px] text-slate-500">
        No notes yet. Use this space to track patterns, conversations, or things to ask the pediatrician.
      </p>
    )}
    {kid.notes.map((note, idx) => (
      <div
        key={idx}
        className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-[11px] text-slate-800 leading-relaxed"
      >
        {note}
      </div>
    ))}
    
    <div className="flex items-center gap-2 pt-3 border-t border-slate-200">
      <input
        type="text"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add a quick note…"
        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <button
        type="button"
        onClick={onAddNote}
        className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors"
      >
        Save
      </button>
    </div>
  </div>
);

export default ParentDashboard;
