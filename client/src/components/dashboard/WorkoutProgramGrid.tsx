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

/**
 * SVG icons for headers (all plain, simple shapes)
 */

interface IconProps {
  className?: string;
}

const CardioIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      d="M12 21s-5.5-3.5-8-7.2C2.7 12.6 2.3 11.3 2.3 10a4.2 4.2 0 0 1 7.5-2.6L12 9l2.2-1.6A4.2 4.2 0 0 1 21.7 10c0 1.3-.4 2.6-1.7 3.8C17.5 17.5 12 21 12 21z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const StrengthIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="9"
      width="3"
      height="6"
      rx="0.5"
      stroke="currentColor"
      fill="none"
      strokeWidth="1.4"
    />
    <rect
      x="18"
      y="9"
      width="3"
      height="6"
      rx="0.5"
      stroke="currentColor"
      fill="none"
      strokeWidth="1.4"
    />
    <rect
      x="7"
      y="10"
      width="10"
      height="4"
      rx="0.8"
      stroke="currentColor"
      fill="none"
      strokeWidth="1.4"
    />
  </svg>
);

const EnduranceIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M12 8v4l2.5 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MobilityIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="6"
      r="2"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
    />
    <path
      d="M10 9l-3 4.5 2 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 9l3 4.5-2 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10 18l2-3 2 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Simple generic muscle icon (circle + highlight)
const MuscleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-3.5 w-3.5"}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M9 13c1 .7 2 1 3 1s2-.3 3-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

/**
 * Labels + icons for header rows
 */

const fitnessHeaderConfig: Record<
  FitnessComponent,
  { label: string; Icon: React.FC<IconProps> }
> = {
  CARDIO: { label: "Cardio", Icon: CardioIcon },
  STRENGTH: { label: "Strength", Icon: StrengthIcon },
  ENDURANCE: { label: "Endurance", Icon: EnduranceIcon },
  MOBILITY: { label: "Mobility", Icon: MobilityIcon },
};

const muscleHeaderConfig: Record<
  MuscleGroup,
  { label: string; Icon: React.FC<IconProps> }
> = {
  QUADS: { label: "Quads", Icon: MuscleIcon },
  HAMSTRINGS: { label: "Hamstrings", Icon: MuscleIcon },
  GLUTES: { label: "Glutes", Icon: MuscleIcon },
  CALVES: { label: "Calves", Icon: MuscleIcon },
  CHEST: { label: "Chest", Icon: MuscleIcon },
  BACK: { label: "Back", Icon: MuscleIcon },
  SHOULDERS: { label: "Shoulders", Icon: MuscleIcon },
  ARMS: { label: "Arms", Icon: MuscleIcon },
  CORE: { label: "Core", Icon: MuscleIcon },
};

export const WorkoutProgramGrid: React.FC<WorkoutProgramGridProps> = ({
  title = "Program overview",
  rows,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">
            Based on your age, goals, and PE guidelines.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-hide">
        {/* Header row */}
        <div className="grid grid-cols-[auto,72px,1fr] border-b border-slate-100 px-4 py-2 text-[11px] font-medium text-slate-600 min-w-[600px]">
          {/* Left: sets + exercise name */}
          <div className="flex items-center gap-2">
            <span className="w-10 text-center">Sets</span>
            <span>Exercise</span>
          </div>

          {/* Middle: intensity */}
          <div className="text-center">Intensity Level</div>

          {/* Right: fitness focus + muscle groups */}
          <div className="flex flex-col gap-1">
            {/* Fitness row (Cardio / Strength / Endurance / Mobility) */}
            <div className="flex gap-1">
              {fitnessOrder.map((c) => {
                const config = fitnessHeaderConfig[c];
                const Icon = config.Icon;
                return (
                  <span
                    key={c}
                    className="flex-1 flex items-center justify-center gap-1 text-[10px] text-slate-600"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-600" />
                    <span>{config.label}</span>
                  </span>
                );
              })}
            </div>

            {/* Muscle row (Quads / Hamstrings / etc.) */}
            <div className="flex gap-1 text-[10px]">
              {muscleOrder.map((m) => {
                const config = muscleHeaderConfig[m];
                const Icon = config.Icon;
                return (
                  <span
                    key={m}
                    className="flex-1 flex items-center justify-center gap-1 text-slate-600"
                  >
                    <Icon className="h-3.5 w-3.5 text-slate-600" />
                    <span>{config.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body rows */}
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.meta.id}
              className="grid grid-cols-[auto,72px,1fr] items-center px-4 py-3 text-xs min-w-[600px]"
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
                        className={`h-5 flex-1 rounded-[3px] border ${loadLevelClass(
                          level
                        )}`}
                        title={`${fitnessHeaderConfig[c].label} load: ${level}/3`}
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
                        className={`h-5 flex-1 rounded-[3px] border ${loadLevelClass(
                          level
                        )}`}
                        title={`${muscleHeaderConfig[m].label} load: ${level}/3`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-500 min-w-[600px]">
              No exercises scheduled yet. Your coach will create a plan once you
              complete onboarding.
            </div>
          )}
        </div>
      </div>
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
