// src/components/dashboard/MyProgressDashboard.tsx
import React, { useState, useMemo } from "react";
import { WorkoutProgramGrid, ExerciseRowView } from "./WorkoutProgramGrid";

type Priority = {
  id: string;
  title: string;
  description?: string;
  icon?: string; // kept for compatibility, but not rendered as Unicode
};

type ActionType =
  | "workout"
  | "meal"
  | "hydration"
  | "log"
  | "habit"
  | "checkin"
  | "education"
  | "custom";

type ActionStatus = "pending" | "in_progress" | "completed";

type Action = {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  status: ActionStatus;
  meta?: string; // e.g. "20-25 minutes", "4/6 cups", etc.
};

type WorkoutStep = {
  id: string;
  label: string;
  detail?: string;
};

type WorkoutPlan = {
  title: string;
  durationLabel?: string; // "20-25 min"
  intensityLabel?: string; // "Light-Moderate"
  steps?: WorkoutStep[];
};

type ConsumptionSummary = {
  mealsLogged?: number;
  mealsPlanned?: number;
  calories?: number;
  caloriesTarget?: number;
  protein?: number;
  proteinTarget?: number;
};

type HydrationSummary = {
  cups?: number;
  goalCups?: number;
};

type Streak = {
  id: string;
  label: string;
  icon?: string; // kept for compatibility, but not rendered as Unicode
};

type CheckInConfig = {
  question: string;
  inputType: "mood" | "text" | "options";
  options?: string[];
};

type ShoppingListItem = {
  id: string;
  item: string;
  qty?: string;
  completed?: boolean;
};

type Receipt = {
  id: string;
  vendor: string;
  date: string;
  calories?: number;
  items?: string[];
};

type HistoryEntry = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meals: number;
};

type FastFoodDetection = {
  chain: string; // e.g. "Pizza Hut"
  meal: string; // e.g. "Meat Lovers Pizza"
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type WihyCoachModel = {
  summary?: string;
  motivation?: string;
  priorities?: Priority[];
  actions?: Action[];
  workout?: WorkoutPlan | null;
  workoutProgram?: ExerciseRowView[]; // PE/ACSM-based program grid
  consumption?: ConsumptionSummary | null;
  hydration?: HydrationSummary | null;
  streaks?: Streak[];
  checkin?: CheckInConfig | null;
  education?: {
    title: string;
    summary: string;
    linkLabel?: string;
  } | null;

  // Consumption dashboard + history integration
  shoppingList?: ShoppingListItem[];
  receipts?: Receipt[];
  history?: HistoryEntry[];
  fastFoodDetections?: FastFoodDetection[];
};

interface MyProgressDashboardProps {
  coach: WihyCoachModel;
  // optional callbacks for interaction
  onToggleAction?: (actionId: string) => void;
  onStartWorkout?: () => void;
  onAddHydration?: () => void;
  onLogMeal?: () => void;
  onEducationClick?: () => void;
}

// ---------- Inline SVG icons (no Unicode / emoji) ----------

const DotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "h-3 w-3"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="6" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "h-3 w-3"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <polyline
      points="5 13 10 18 19 7"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MoodHappyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "h-5 w-5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="9" cy="10" r="1" />
    <circle cx="15" cy="10" r="1" />
    <path
      d="M8 15c1.2 1 2.5 1.5 4 1.5s2.8-.5 4-1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MoodNeutralIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "h-5 w-5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="9" cy="10" r="1" />
    <circle cx="15" cy="10" r="1" />
    <line
      x1="8"
      y1="15"
      x2="16"
      y2="15"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const MoodSadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className ?? "h-5 w-5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <circle cx="9" cy="10" r="1" />
    <circle cx="15" cy="10" r="1" />
    <path
      d="M8 16c1.2-1 2.5-1.5 4-1.5s2.8.5 4 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

// -----------------------------------------------------------

const MyProgressDashboard: React.FC<MyProgressDashboardProps> = ({
  coach,
  onToggleAction,
  onStartWorkout,
  onAddHydration,
  onLogMeal,
  onEducationClick,
}) => {
  const {
    summary,
    motivation,
    priorities = [],
    actions = [],
    workout,
    workoutProgram = [],
    consumption,
    hydration,
    streaks = [],
    checkin,
    education,
    shoppingList = [],
    receipts = [],
    history = [],
    fastFoodDetections = [],
  } = coach;

  // Top-level view: Today / Week / History
  const [viewTab, setViewTab] = useState<"today" | "week" | "history">(
    "today"
  );

  // Workout sub-tab: Today workout vs Program grid
  const [workoutTab, setWorkoutTab] = useState<"today" | "program">("today");

  const hasCoachFocus = Boolean(motivation) || priorities.length > 0;

  // Weekly summary from history (latest up to 7 entries)
  const weekHistory = useMemo<HistoryEntry[]>(() => {
    if (!history || history.length === 0) return [];
    return history.slice(0, 7);
  }, [history]);

  const weeklyTotals = useMemo(
    () =>
      weekHistory.reduce(
        (acc, entry) => {
          acc.calories += entry.calories || 0;
          acc.protein += entry.protein || 0;
          acc.carbs += entry.carbs || 0;
          acc.fat += entry.fat || 0;
          acc.meals += entry.meals || 0;
          return acc;
        },
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          meals: 0,
        }
      ),
    [weekHistory]
  );

  const averageFromWeek = (field: keyof typeof weeklyTotals) => {
    if (!weekHistory.length) return 0;
    return Math.round(weeklyTotals[field] / weekHistory.length);
  };

  const renderCoachFocus = () => {
    if (!hasCoachFocus) return null;

    return (
      <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 mb-4 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Coach Focus
        </h2>
        {motivation && (
          <p className="text-sm text-gray-700 mb-3">
            {motivation}
          </p>
        )}

        {priorities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {priorities.map((p) => (
              <div
                key={p.id}
                className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-800 max-w-full"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <DotIcon className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="font-semibold truncate">{p.title}</span>
                </div>
                {p.description && (
                  <p className="text-xs text-gray-600 mt-0.5">
                    {p.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderTodayView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
        {/* Left column: coach focus + actions + workout */}
        <div className="space-y-6">
          {renderCoachFocus()}

          {/* Action List */}
          {actions.length > 0 && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  Your Actions Today
                </h2>
              </div>
              <div className="space-y-3">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onToggleAction?.(action.id)}
                    className="w-full text-left flex gap-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-2.5"
                  >
                    <div className="flex flex-col justify-center">
                      <span
                        className={[
                          "inline-flex h-4 w-4 rounded-full border",
                          action.status === "completed"
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-gray-300 bg-white",
                        ].join(" ")}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {action.title}
                        </span>
                        {action.type && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-gray-600">
                            {action.type}
                          </span>
                        )}
                      </div>
                      {action.description && (
                        <p className="mt-0.5 text-xs text-gray-600">
                          {action.description}
                        </p>
                      )}
                    </div>
                    {action.meta && (
                      <div className="text-xs text-gray-500 shrink-0">
                        {action.meta}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Workout module */}
          {workout && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  Your Workout
                </h2>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setWorkoutTab("today")}
                  className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                    workoutTab === "today"
                      ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                      : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setWorkoutTab("program")}
                  className={`px-6 py-4 text-[15px] font-medium rounded-t-lg whitespace-nowrap leading-normal transition-colors ${
                    workoutTab === "program"
                      ? "bg-white text-gray-900 border border-gray-200 border-b-white -mb-px"
                      : "bg-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  Program
                </button>
              </div>

              {/* Today Tab Content */}
              {workoutTab === "today" && (
                <>
                  <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {workout.title}
                        </p>
                        <p className="text-xs text-gray-600">
                          {workout.durationLabel && (
                            <span>{workout.durationLabel}</span>
                          )}
                          {workout.durationLabel &&
                            workout.intensityLabel && <span> / </span>}
                          {workout.intensityLabel && (
                            <span>{workout.intensityLabel}</span>
                          )}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onStartWorkout}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
                      >
                        Start Workout
                      </button>
                    </div>
                  </div>
                  {workout.steps && workout.steps.length > 0 && (
                    <ul className="space-y-2">
                      {workout.steps.map((step) => (
                        <li
                          key={step.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <DotIcon className="h-2 w-2 mt-1 text-emerald-500" />
                          <div>
                            <p className="font-medium text-gray-800">
                              {step.label}
                            </p>
                            {step.detail && (
                              <p className="text-gray-600">{step.detail}</p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}

              {/* Program Tab Content */}
              {workoutTab === "program" && (
                <WorkoutProgramGrid
                  title="Your personalized program"
                  rows={workoutProgram}
                />
              )}
            </section>
          )}
        </div>

        {/* Right column: consumption, hydration, fast food, receipts, shopping list, streaks, check-in, education */}
        <div className="space-y-6">
          {/* Meals & logging */}
          {consumption && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  Meals Today
                </h2>
                <button
                  type="button"
                  onClick={onLogMeal}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
                >
                  Log meal
                </button>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  Meals logged:{" "}
                  <span className="font-semibold text-gray-900">
                    {consumption.mealsLogged ?? 0}
                  </span>{" "}
                  / <span>{consumption.mealsPlanned ?? "—"}</span>
                </p>
                <p>
                  Calories:{" "}
                  <span className="font-semibold text-gray-900">
                    {consumption.calories ?? 0}
                  </span>{" "}
                  {consumption.caloriesTarget && (
                    <>
                      / <span>{consumption.caloriesTarget}</span> target
                    </>
                  )}
                </p>
                <p>
                  Protein:{" "}
                  <span className="font-semibold text-gray-900">
                    {consumption.protein ?? 0}g
                  </span>{" "}
                  {consumption.proteinTarget && (
                    <>
                      / <span>{consumption.proteinTarget}g</span> target
                    </>
                  )}
                </p>
              </div>
            </section>
          )}

          {/* Hydration */}
          {hydration && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h2 className="text-lg font-semibold text-gray-900 truncate">
                  Hydration
                </h2>
                <button
                  type="button"
                  onClick={onAddHydration}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
                >
                  Add cup
                </button>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  Cups:{" "}
                  <span className="font-semibold text-gray-900">
                    {hydration.cups ?? 0}
                  </span>{" "}
                  / <span>{hydration.goalCups ?? "—"}</span>
                </span>
                {typeof hydration.cups === "number" &&
                  typeof hydration.goalCups === "number" && (
                    <div className="flex-1 ml-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${
                            Math.min(
                              100,
                              (hydration.cups /
                                Math.max(1, hydration.goalCups)) *
                                100
                            ) || 0
                          }%`,
                        }}
                      />
                    </div>
                  )}
              </div>
            </section>
          )}

          {/* Fast-Food Detection */}
          {fastFoodDetections.length > 0 && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Fast-Food Detected
                </h2>
              </div>
              <div className="space-y-2 min-w-0">
                {fastFoodDetections.map((f, idx) => (
                  <div
                    key={`${f.chain}-${f.meal}-${idx}`}
                    className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-800 min-w-0"
                  >
                    <p className="font-semibold truncate">
                      {f.chain} - {f.meal}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-600 truncate">
                      {f.calories} cal / {f.protein}g protein / {f.carbs}g carbs
                      / {f.fat}g fat
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Receipts */}
          <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                Receipts
              </h2>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors whitespace-nowrap shrink-0"
                // hook this into your receipt upload flow
                onClick={() => {
                  /* TODO: open receipt upload */
                }}
              >
                Upload receipt
              </button>
            </div>
            {receipts.length > 0 ? (
              <div className="mt-2 space-y-2 text-sm text-gray-700 min-w-0">
                {receipts.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-lg bg-gray-50 border border-gray-200 p-2 min-w-0"
                  >
                    <p className="font-semibold text-gray-900">{r.vendor}</p>
                    <p className="text-gray-600">{r.date}</p>
                    {typeof r.calories === "number" && (
                      <p className="text-gray-600">{r.calories} calories</p>
                    )}
                    {r.items && r.items.length > 0 && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        Items: {r.items.join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                No receipts yet. Upload one to begin tracking.
              </p>
            )}
          </section>

          {/* Shopping List */}
          {shoppingList.length > 0 && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Shopping List
                </h2>
              </div>
              <div className="space-y-2 min-w-0">
                {shoppingList.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm min-w-0"
                  >
                    <span
                      className={
                        item.completed
                          ? "line-through text-gray-400 truncate"
                          : "text-gray-800 truncate"
                      }
                    >
                      {item.item}
                      {item.qty ? ` - ${item.qty}` : ""}
                    </span>
                    {item.completed && (
                      <span className="text-emerald-600">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Streaks */}
          {streaks.length > 0 && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Your Streaks
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 min-w-0">
                {streaks.map((s) => (
                  <div
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    <DotIcon className="h-2.5 w-2.5 text-emerald-500" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Check-in */}
          {checkin && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Daily Check-In
                </h2>
              </div>
              <p className="text-sm text-gray-600 mb-3 min-w-0">
                {checkin.question}
              </p>

              {checkin.inputType === "mood" && (
                <div className="flex gap-3">
                  <button className="h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <MoodHappyIcon />
                  </button>
                  <button className="h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <MoodNeutralIcon />
                  </button>
                  <button className="h-10 w-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                    <MoodSadIcon />
                  </button>
                </div>
              )}

              {checkin.inputType === "text" && (
                <textarea
                  className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={3}
                  placeholder="Type a short reflection..."
                />
              )}

              {checkin.inputType === "options" && checkin.options && (
                <div className="flex flex-wrap gap-2">
                  {checkin.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className="rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Education tile */}
          {education && (
            <section className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <h2 className="text-lg font-semibold text-emerald-900 mb-3">
                Learn One Thing Today
              </h2>
              <p className="text-sm text-emerald-800 font-medium">
                {education.title}
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                {education.summary}
              </p>
              <button
                type="button"
                onClick={onEducationClick}
                className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {education.linkLabel ?? "Open in WIHY Research ->"}
              </button>
            </section>
          )}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
        {/* Left: weekly snapshot */}
        <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              This Week at a Glance
            </h2>
          </div>
          {weekHistory.length === 0 ? (
            <p className="text-sm text-gray-500">
              Once you have logged a few days of meals, your weekly snapshot
              will show up here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-600">
                    Avg Calories
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {averageFromWeek("calories")}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-600">
                    Avg Protein
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {averageFromWeek("protein")}g
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-600">
                    Avg Carbs
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {averageFromWeek("carbs")}g
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-600">
                    Avg Fat
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
                    {averageFromWeek("fat")}g
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm min-w-0">
                {weekHistory.map((d) => (
                  <div
                    key={d.date}
                    className="rounded-lg bg-gray-50 border border-gray-200 p-2 min-w-0"
                  >
                    <p className="font-semibold text-gray-900">{d.date}</p>
                    <p className="text-gray-700">
                      {d.calories} cal / {d.protein}g protein / {d.carbs}g carbs
                      / {d.fat}g fat
                    </p>
                    <p className="text-gray-600">{d.meals} meals</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Right: keep streaks + coach focus for weekly context */}
        <div className="space-y-6">
          {renderCoachFocus()}

          {streaks.length > 0 && (
            <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Your Streaks
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 min-w-0">
                {streaks.map((s) => (
                  <div
                    key={s.id}
                    className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-sm text-gray-700"
                  >
                    <DotIcon className="h-2.5 w-2.5 text-emerald-500" />
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {education && (
            <section className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
              <h2 className="text-lg font-semibold text-emerald-900 mb-3">
                Learn One Thing This Week
              </h2>
              <p className="text-sm text-emerald-800 font-medium">
                {education.title}
              </p>
              <p className="mt-1 text-sm text-emerald-800">
                {education.summary}
              </p>
              <button
                type="button"
                onClick={onEducationClick}
                className="mt-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                {education.linkLabel ?? "Open in WIHY Research ->"}
              </button>
            </section>
          )}
        </div>
      </div>
    );
  };

  const renderHistoryView = () => {
    return (
      <section className="rounded-lg bg-white shadow-sm border border-gray-200 p-4 overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Nutrition History
        </h2>
        {(!history || history.length === 0) && (
          <p className="text-sm text-gray-500">
            Your history will appear here as you log more days.
          </p>
        )}
        {history && history.length > 0 && (
          <div className="space-y-2 text-sm">
            {history.map((d) => (
              <div
                key={d.date}
                className="rounded-lg bg-gray-50 border border-gray-200 p-2"
              >
                <p className="font-semibold text-gray-900">{d.date}</p>
                <p className="text-gray-700">
                  {d.calories} cal / {d.protein}g protein / {d.carbs}g carbs /{" "}
                  {d.fat}g fat
                </p>
                <p className="text-gray-600">{d.meals} meals</p>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="w-full bg-[#f0f7ff] min-h-[70vh] relative px-4 sm:px-6 pb-6">
      {/* Header */}
      <header className="flex flex-col items-center gap-2 pb-4 pt-4">
        {/* View Tabs */}
        <div className="mt-3 flex gap-2 bg-gray-100 p-1 rounded-full">
          {(["today", "week", "history"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setViewTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                viewTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab === "today"
                ? "Today"
                : tab === "week"
                ? "Week"
                : "History"}
            </button>
          ))}
        </div>
      </header>

      {/* View Content */}
      {viewTab === "today" && renderTodayView()}
      {viewTab === "week" && renderWeekView()}
      {viewTab === "history" && (
        <div className="max-w-3xl mx-auto mt-2">{renderHistoryView()}</div>
      )}
    </div>
  );
};

export default MyProgressDashboard;
