import React from "react";

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

// Map LoadLevel -> Tailwind classes (light / medium / dark squares)
function loadLevelClass(level: LoadLevel): string {
  if (level === 0) return "bg-slate-100 border-slate-200";
  if (level === 1) return "bg-emerald-100 border-emerald-200";
  if (level === 2) return "bg-emerald-300 border-emerald-400";
  return "bg-emerald-500 border-emerald-600"; // 3
}

export const WorkoutProgramGrid: React.FC<WorkoutProgramGridProps> = ({
  title = "Program overview",
  rows,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            Based on your age, goals, and PE guidelines.
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className="grid grid-cols-[auto,72px,1fr] border-b border-slate-100 px-4 py-2 text-[11px] font-medium text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-10 text-center">Sets</span>
          <span>Exercise</span>
        </div>
        <div className="text-center">Intensity</div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            {fitnessOrder.map((c) => (
              <span
                key={c}
                className="flex-1 text-center text-[10px] tracking-tight"
              >
                {c[0] + c.toLowerCase().slice(1, 3)}
              </span>
            ))}
          </div>
          <div className="flex gap-1 text-[10px]">
            {muscleOrder.map((m) => (
              <span key={m} className="flex-1 text-center">
                {m[0]}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Body rows */}
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.meta.id}
            className="grid grid-cols-[auto,72px,1fr] items-center px-4 py-2 text-xs"
          >
            {/* Left: Sets + Exercise */}
            <div className="flex items-center gap-2">
              <span className="flex w-10 items-center justify-center rounded-full bg-slate-50 text-[11px] font-semibold text-slate-700">
                {row.prescription.sets}x
              </span>
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">
                  {row.meta.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  {row.meta.equipment === "NONE"
                    ? "Bodyweight"
                    : row.meta.equipment}
                </span>
              </div>
            </div>

            {/* Middle: Intensity */}
            <div className="text-center text-[11px] text-slate-700">
              {row.prescription.intensityLabel}
            </div>

            {/* Right: tiles */}
            <div className="flex flex-col gap-1">
              {/* Fitness row */}
              <div className="flex gap-1">
                {fitnessOrder.map((c) => {
                  const level = row.meta.fitnessLoad[c] ?? 0;
                  return (
                    <div
                      key={c}
                      className={`h-4 flex-1 rounded-[3px] border ${loadLevelClass(
                        level
                      )}`}
                      title={`${c.toLowerCase()} load: ${level}/3`}
                    />
                  );
                })}
              </div>
              {/* Muscle row */}
              <div className="flex gap-1">
                {muscleOrder.map((m) => {
                  const level = row.meta.muscleLoad[m] ?? 0;
                  return (
                    <div
                      key={m}
                      className={`h-4 flex-1 rounded-[3px] border ${loadLevelClass(
                        level
                      )}`}
                      title={`${m.toLowerCase()} load: ${level}/3`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-slate-500">
            No exercises scheduled yet. Your coach will create a plan once you
            complete onboarding.
          </div>
        )}
      </div>
    </div>
  );
};

export type { ExerciseMeta, ExercisePrescription, ExerciseRowView, FitnessComponent, MuscleGroup, LoadLevel };
