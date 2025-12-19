import React, { useState, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Heart, Dumbbell, Timer, Move, Target, Hash, Activity, Zap } from 'lucide-react';

type FitnessComponent = "CARDIO" | "STRENGTH" | "ENDURANCE" | "MOBILITY";
type MuscleGroup =
  | "QUADS"
  | "HAMSTRINGS"
  | "GLUTES"
  | "CALVES"
  | "CHEST"
  | "BACK"
  | "SHOULDERS"
  | "ARMS"
  | "CORE";

type LoadLevel = 0 | 1 | 2 | 3; // 0 none -> 3 primary

interface ExerciseMeta {
  id: string;
  name: string;
  equipment: "NONE" | "DUMBBELLS" | "BARBELL" | "MACHINE";
  fitnessLoad: Partial<Record<FitnessComponent, LoadLevel>>;
  muscleLoad: Partial<Record<MuscleGroup, LoadLevel>>;
}

interface ExercisePrescription {
  exerciseId: string;
  sets: number;
  intensityLabel: string; // e.g. "3 x 10 @ moderate" or "60% 1RM"
}

interface ExerciseRowView {
  meta: ExerciseMeta;
  prescription: ExercisePrescription;
}

interface WorkoutProgramGridProps {
  title?: string;
  rows: ExerciseRowView[];
  simplifiedView?: boolean;
}

const fitnessOrder: FitnessComponent[] = [
  "CARDIO",
  "STRENGTH",
  "ENDURANCE",
  "MOBILITY",
];

const muscleOrder: MuscleGroup[] = [
  "QUADS",
  "HAMSTRINGS",
  "GLUTES",
  "CALVES",
  "CHEST",
  "BACK",
  "SHOULDERS",
  "ARMS",
  "CORE",
];

// Simplified versions for better clarity
const simplifiedFitnessOrder: FitnessComponent[] = ["CARDIO", "STRENGTH"];
const simplifiedMuscleOrder: MuscleGroup[] = ["QUADS", "CHEST", "BACK", "CORE"];

/**
 * Labels + icons for header rows
 */

const fitnessHeaderConfig: Record<
  FitnessComponent,
  { label: string; Icon: React.FC<any>; color: string }
> = {
  CARDIO: { label: "Cardio", Icon: Heart, color: "#ef4444" },
  STRENGTH: { label: "Strength", Icon: Dumbbell, color: "#3b82f6" },
  ENDURANCE: { label: "Endurance", Icon: Timer, color: "#8b5cf6" },
  MOBILITY: { label: "Mobility", Icon: Move, color: "#10b981" },
};

const muscleHeaderConfig: Record<
  MuscleGroup,
  { label: string; Icon: React.FC<any>; color: string }
> = {
  QUADS: { label: "Quads", Icon: Target, color: "#f59e0b" },
  HAMSTRINGS: { label: "Hamstrings", Icon: Target, color: "#f59e0b" },
  GLUTES: { label: "Glutes", Icon: Target, color: "#f59e0b" },
  CALVES: { label: "Calves", Icon: Target, color: "#f59e0b" },
  CHEST: { label: "Chest", Icon: Target, color: "#06b6d4" },
  BACK: { label: "Back", Icon: Target, color: "#06b6d4" },
  SHOULDERS: { label: "Shoulders", Icon: Target, color: "#06b6d4" },
  ARMS: { label: "Arms", Icon: Target, color: "#06b6d4" },
  CORE: { label: "Core", Icon: Target, color: "#84cc16" },
};

// --- Helpers: label + top picks ---
const humanize = (s: string) =>
  s.slice(0, 1) + s.slice(1).toLowerCase();

function getTopKeys<T extends string>(
  record: Partial<Record<T, LoadLevel>>,
  order: T[],
  topN: number
): { key: T; value: number }[] {
  const arr = order
    .map((k) => ({ key: k, value: record[k] ?? 0 }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value);
  return arr.slice(0, topN);
}

function parseEffortLabel(intensityLabel: string): string | null {
  const s = intensityLabel.toLowerCase();
  if (s.includes("easy") || s.includes("light")) return "Light";
  if (s.includes("moderate") || s.includes("medium")) return "Moderate";
  if (s.includes("hard") || s.includes("heavy")) return "Hard";
  return null;
}

const Chip: React.FC<{
  label: string;
  tone?: "neutral" | "blue";
}> = ({ label, tone = "neutral" }) => {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap";
  const tones: Record<string, string> = {
    neutral: "bg-gray-50 border-gray-200 text-gray-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };
  return <span className={`${base} ${tones[tone]}`}>{label}</span>;
};

export const WorkoutProgramGrid: React.FC<WorkoutProgramGridProps> = ({
  title = "Program overview", 
  rows,
  simplifiedView = true, // Default to simplified view
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'charts'>('grid');
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  // Calculate aggregate data for charts
  const aggregateData = useMemo(() => {
    if (rows.length === 0) return { fitness: [], muscle: [] };

    const activeFitnessOrder = simplifiedView ? simplifiedFitnessOrder : fitnessOrder;
    const activeMuscleOrder = simplifiedView ? simplifiedMuscleOrder : muscleOrder;

    const fitnessData = activeFitnessOrder.map(component => ({
      component,
      label: fitnessHeaderConfig[component].label,
      value: rows.reduce((sum, row) => sum + (row.meta.fitnessLoad[component] ?? 0), 0) / rows.length,
      fullMark: 3
    }));

    const muscleData = activeMuscleOrder.map(muscle => ({
      muscle,
      label: muscleHeaderConfig[muscle].label,
      load: rows.reduce((sum, row) => sum + (row.meta.muscleLoad[muscle] ?? 0), 0) / rows.length
    }));

    return { fitness: fitnessData, muscle: muscleData };
  }, [rows, simplifiedView]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs font-semibold">{label}</p>
          <p className="text-xs text-blue-600">
            Load: {payload[0].value.toFixed(1)}/3
          </p>
        </div>
      );
    }
    return null;
  };
  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">{title}</h3>
          <p className="text-xs text-gray-500">
            Based on your age, goals, and PE guidelines.
          </p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
          <button
            onClick={() => setActiveTab('grid')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              activeTab === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              activeTab === 'charts'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Chart View
          </button>
        </div>
      </div>

      {activeTab === 'charts' ? (
        /* Chart View */
        <div className="p-4 space-y-6">
          {rows.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No data available for charts</p>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Fitness Load Radar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Fitness Load Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={aggregateData.fitness}>
                        <PolarGrid />
                        {React.createElement(PolarAngleAxis as any, { dataKey: "label", tick: { fontSize: 10 } })}
                        {React.createElement(PolarRadiusAxis as any, { domain: [0, 3], tick: false })}
                        <Radar
                          name="Load"
                          dataKey="value"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Muscle Load Bar Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Muscle Group Activation</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aggregateData.muscle}>
                        {React.createElement(XAxis as any, { dataKey: "label", tick: { fontSize: 10 }, angle: -45, textAnchor: "end", height: 80 })}
                        {React.createElement(YAxis as any, { domain: [0, 3], tick: { fontSize: 10 } })}
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="load" fill="#10b981" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="overflow-x-auto scrollbar-hide">
          {/* Header row (quiet / sticky) */}
          <div className="sticky top-0 z-10 grid grid-cols-[minmax(260px,1.2fr),minmax(180px,0.8fr),minmax(320px,1.6fr)] border-b border-gray-200 bg-white/90 backdrop-blur px-4 py-3 text-[11px] font-semibold text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-gray-900">Exercise</span>
              <span className="text-gray-400 font-medium">(name + equipment)</span>
            </div>
            <div className="text-gray-900">Prescription</div>
            <div className="text-gray-900">Primary Focus</div>
          </div>

          {/* Body rows */}
          <div className="divide-y divide-gray-100 bg-white">
            {rows.map((row, idx) => {
              const fitnessTop = getTopKeys(row.meta.fitnessLoad, fitnessOrder, 1);
              const muscleTop = getTopKeys(row.meta.muscleLoad, muscleOrder, simplifiedView ? 2 : 3);
              const effort = parseEffortLabel(row.prescription.intensityLabel);

              const isOpen = selectedExercise === row.meta.id;

              return (
                <div
                  key={row.meta.id}
                  className={`border-b border-gray-100 ${isOpen ? "bg-blue-50/40" : "bg-white"} hover:bg-gray-50 transition-colors`}
                >
                  {/* Row: primary (scan-friendly) */}
                  <button
                    type="button"
                    onClick={() => setSelectedExercise(isOpen ? null : row.meta.id)}
                    className="w-full grid grid-cols-[minmax(260px,1.2fr),minmax(180px,0.8fr),minmax(320px,1.6fr)] items-center px-4 py-3 text-left"
                  >
                    {/* Exercise zone */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Step / Sets badge */}
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className="h-10 w-10 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-sm font-semibold text-gray-900">
                          {row.prescription.sets}×
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1">#{idx + 1}</div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate text-sm font-semibold text-gray-900">
                            {row.meta.name}
                          </span>
                          {row.meta.equipment !== "NONE" && (
                            <Chip label={humanize(row.meta.equipment)} />
                          )}
                          {row.meta.equipment === "NONE" && (
                            <Chip label="Bodyweight" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 truncate">
                          Tap to {isOpen ? "hide" : "view"} details
                        </div>
                      </div>
                    </div>

                    {/* Prescription zone */}
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-semibold text-gray-900">
                        {row.prescription.intensityLabel}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Chip label={`${row.prescription.sets} sets`} />
                        {effort && <Chip label={effort} tone="blue" />}
                      </div>
                    </div>

                    {/* Focus zone (chips in simplified view) */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        {fitnessTop[0] && (
                          <Chip
                            label={`${fitnessHeaderConfig[fitnessTop[0].key].label}`}
                            tone="blue"
                          />
                        )}
                        {muscleTop.map((m) => (
                          <Chip key={m.key} label={muscleHeaderConfig[m.key].label} />
                        ))}
                        {muscleTop.length === 0 && <Chip label="Balanced" />}
                      </div>

                      <span className="text-xs text-gray-400">
                        {isOpen ? "−" : "+"}
                      </span>
                    </div>
                  </button>

                  {/* Row: expanded details (your bars) */}
                  {isOpen && (
                    <div className="px-4 pb-4">
                      <div className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="text-xs font-semibold text-gray-700 mb-2">
                          Detailed Load Map
                        </div>

                        {/* Fitness row */}
                        <div className="mb-2">
                          <div className="text-[11px] font-medium text-gray-500 mb-1">
                            Fitness
                          </div>
                          <div className="flex gap-1">
                            {(simplifiedView ? simplifiedFitnessOrder : fitnessOrder).map((c) => {
                              const level = row.meta.fitnessLoad[c] ?? 0;
                              return (
                                <div
                                  key={c}
                                  className={`h-3 flex-1 rounded border ${
                                    level === 0 ? "bg-gray-100 border-gray-200" :
                                    level === 1 ? "bg-blue-100 border-blue-200" :
                                    level === 2 ? "bg-blue-300 border-blue-400" :
                                    "bg-blue-600 border-blue-700"
                                  }`}
                                  title={`${fitnessHeaderConfig[c].label}: ${level}/3`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Muscle row */}
                        <div>
                          <div className="text-[11px] font-medium text-gray-500 mb-1">
                            Muscles
                          </div>
                          <div className="flex gap-1">
                            {(simplifiedView ? simplifiedMuscleOrder : muscleOrder).map((m) => {
                              const level = row.meta.muscleLoad[m] ?? 0;
                              return (
                                <div
                                  key={m}
                                  className={`h-3 flex-1 rounded border ${
                                    level === 0 ? "bg-gray-100 border-gray-200" :
                                    level === 1 ? "bg-emerald-100 border-emerald-200" :
                                    level === 2 ? "bg-emerald-300 border-emerald-400" :
                                    "bg-emerald-600 border-emerald-700"
                                  }`}
                                  title={`${muscleHeaderConfig[m].label}: ${level}/3`}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-500">
                Choose your workout type, difficulty, and session above to see your exercises.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export type {
  ExerciseMeta,
  ExercisePrescription,
  ExerciseRowView,
  FitnessComponent,
  MuscleGroup,
  LoadLevel,
};
