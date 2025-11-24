// src/components/dashboard/MyProgressDashboard.tsx
import React from "react";

type Priority = {
  id: string;
  title: string;
  description?: string;
  icon?: string; // emoji or icon name
};

type Action = {
  id: string;
  type:
    | "workout"
    | "meal"
    | "hydration"
    | "log"
    | "habit"
    | "checkin"
    | "education"
    | "custom";
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  meta?: string; // e.g. "20–25 minutes", "4/6 cups", etc.
};

type WorkoutStep = {
  id: string;
  label: string;
  detail?: string;
};

type WorkoutPlan = {
  title: string;
  durationLabel?: string; // "20–25 min"
  intensityLabel?: string; // "Light–Moderate"
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
  icon?: string;
};

type CheckInConfig = {
  question: string;
  inputType: "mood" | "text" | "options";
  options?: string[];
};

export type WihyCoachModel = {
  summary?: string;
  motivation?: string;
  priorities?: Priority[];
  actions?: Action[];
  workout?: WorkoutPlan | null;
  consumption?: ConsumptionSummary | null;
  hydration?: HydrationSummary | null;
  streaks?: Streak[];
  checkin?: CheckInConfig | null;
  education?: {
    title: string;
    summary: string;
    linkLabel?: string;
  } | null;
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
    consumption,
    hydration,
    streaks = [],
    checkin,
    education,
  } = coach;

  return (
    <div className="w-full bg-[#f0f7ff] min-h-[70vh] relative">
        {/* Today header */}
        <header className="flex flex-col gap-2" style={{ paddingBottom: '16px' }}>
          <h1 className="dashboard-title" style={{ fontSize: '22px', textAlign: 'center', marginBottom: '12px', marginTop: '8px', padding: '0px 8px', lineHeight: '1.5' }}>
            My Progress – Today
          </h1>
          {summary && (
            <p className="mt-1 text-sm text-slate-600 text-center">{summary}</p>
          )}
        </header>

        {/* Today's Focus section removed */}

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,minmax(260px,1fr)] gap-6">
          {/* Left column: core actions + workout */}
          <div className="space-y-6">
            {/* Action List */}
            {actions.length > 0 && (
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Your Actions Today
                  </h2>
                </div>
                <div className="space-y-3">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => onToggleAction?.(action.id)}
                      className="w-full text-left flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-colors px-3 py-2.5"
                    >
                      <div className="flex flex-col justify-center">
                        <span
                          className={[
                            "inline-flex h-4 w-4 rounded-full border",
                            action.status === "completed"
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-slate-300 bg-white",
                          ].join(" ")}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-900 truncate">
                            {action.title}
                          </span>
                          {action.type && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                              {action.type}
                            </span>
                          )}
                        </div>
                        {action.description && (
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {action.description}
                          </p>
                        )}
                      </div>
                      {action.meta && (
                        <div className="text-[11px] text-slate-500 shrink-0">
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
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Your Workout
                  </h2>
                </div>
                <div className="rounded-xl bg-slate-50/80 border border-slate-100 p-3 mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div>
                      <p className="text-xs font-medium text-slate-900">
                        {workout.title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {workout.durationLabel && (
                          <span>{workout.durationLabel}</span>
                        )}
                        {workout.durationLabel && workout.intensityLabel && (
                          <span> · </span>
                        )}
                        {workout.intensityLabel && (
                          <span>{workout.intensityLabel}</span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={onStartWorkout}
                      className="mt-1 inline-flex items-center justify-center rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
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
                        className="flex items-start gap-2 text-[11px]"
                      >
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <div>
                          <p className="font-medium text-slate-800">
                            {step.label}
                          </p>
                          {step.detail && (
                            <p className="text-slate-500">{step.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {/* Right column: consumption, hydration, streaks, check-in, education */}
          <div className="space-y-6">
            {/* Meals & logging */}
            {consumption && (
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Meals Today
                  </h2>
                  <button
                    type="button"
                    onClick={onLogMeal}
                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Log meal
                  </button>
                </div>
                <div className="space-y-2 text-[11px] text-slate-600">
                  <p>
                    Meals logged:{" "}
                    <span className="font-semibold text-slate-900">
                      {consumption.mealsLogged ?? 0}
                    </span>{" "}
                    /{" "}
                    <span>{consumption.mealsPlanned ?? "—"}</span>
                  </p>
                  <p>
                    Calories:{" "}
                    <span className="font-semibold text-slate-900">
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
                    <span className="font-semibold text-slate-900">
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
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-slate-800">
                    Hydration
                  </h2>
                  <button
                    type="button"
                    onClick={onAddHydration}
                    className="text-[11px] font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Add cup
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Cups:{" "}
                    <span className="font-semibold text-slate-900">
                      {hydration.cups ?? 0}
                    </span>{" "}
                    /{" "}
                    <span>{hydration.goalCups ?? "—"}</span>
                  </span>
                  {typeof hydration.cups === "number" &&
                    typeof hydration.goalCups === "number" && (
                      <div className="flex-1 ml-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${
                              Math.min(
                                100,
                                (hydration.cups / Math.max(1, hydration.goalCups)) *
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

            {/* Streaks */}
            {streaks.length > 0 && (
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">
                  Your Streaks
                </h2>
                <div className="flex flex-wrap gap-2">
                  {streaks.map((s) => (
                    <div
                      key={s.id}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] text-slate-700"
                    >
                      {s.icon && <span>{s.icon}</span>}
                      <span>{s.label}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Check-in */}
            {checkin && (
              <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
                <h2 className="text-sm font-semibold text-slate-800 mb-2">
                  Daily Check-In
                </h2>
                <p className="text-[11px] text-slate-600 mb-2">
                  {checkin.question}
                </p>

                {checkin.inputType === "mood" && (
                  <div className="flex gap-3 text-xl">
                    <button className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                      🙂
                    </button>
                    <button className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                      😐
                    </button>
                    <button className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                      🙁
                    </button>
                  </div>
                )}

                {checkin.inputType === "text" && (
                  <textarea
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                        className="rounded-full bg-slate-50 border border-slate-200 px-3 py-1 text-[11px] text-slate-700 hover:bg-slate-100"
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
              <section className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <h2 className="text-sm font-semibold text-emerald-900 mb-1">
                  Learn One Thing Today
                </h2>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {education.title}
                </p>
                <p className="mt-1 text-[11px] text-emerald-800">
                  {education.summary}
                </p>
                <button
                  type="button"
                  onClick={onEducationClick}
                  className="mt-2 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  {education.linkLabel ?? "Open in WIHY Research →"}
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
  );
};

export default MyProgressDashboard;
