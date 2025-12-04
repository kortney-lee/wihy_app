// src/components/dashboard/FitnessDashboard.tsx
import React, { useMemo, useState } from "react";
import {
  WorkoutProgramGrid,
  ExerciseRowView,
  ExerciseMeta,
  ExercisePrescription,
  FitnessComponent,
  MuscleGroup,
  LoadLevel,
} from "./WorkoutProgramGrid";

/**
 * Inline SVG icons for legend (no emoji / unicode)
 */
interface IconProps {
  className?: string;
}

const CardioIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-4 w-4"}
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
    className={className ?? "h-4 w-4"}
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
    className={className ?? "h-4 w-4"}
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
    className={className ?? "h-4 w-4"}
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

const MuscleIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    className={className ?? "h-4 w-4"}
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
 * High-level program configuration
 */

export interface FitnessPhase {
  id: string;          // "phase1"
  name: string;        // "Phase 1 - Foundation"
}

export interface ProgramLevel {
  id: string;          // "beginner" | "intermediate" | "advanced"
  label: string;
}

export interface ProgramDay {
  id: string;          // "day1"
  label: string;       // "Day 1", "Full body A", etc.
}

/**
 * All program variants (phase + level + day) stored in a map
 * key: "phaseId__levelId__dayId"
 */

export type ProgramVariantMap = Record<string, ExerciseRowView[]>;

export const buildProgramKey = (
  phaseId: string,
  levelId: string,
  dayId: string
): string => `${phaseId}__${levelId}__${dayId}`;

/**
 * Main model for the dashboard
 */

export interface FitnessDashboardModel {
  title?: string;
  subtitle?: string;

  phases: FitnessPhase[];
  levels: ProgramLevel[];
  days: ProgramDay[];

  variants: ProgramVariantMap;

  programTitle?: string;
  programDescription?: string;

  defaultPhaseId?: string;
  defaultLevelId?: string;
  defaultDayId?: string;
}

/**
 * Props
 */

export interface FitnessDashboardProps {
  data: FitnessDashboardModel;
  onStartSession?: (params: {
    phaseId: string;
    levelId: string;
    dayId: string;
    rows: ExerciseRowView[];
  }) => void;
}

/**
 * Mobile-friendly card view for each exercise
 */

const MobileExerciseCard: React.FC<{ row: ExerciseRowView }> = ({ row }) => {
  const { meta, prescription } = row;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 mb-2 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-xs font-semibold text-slate-900">{meta.name}</p>
          <p className="text-[11px] text-slate-500">
            {meta.equipment === "NONE" ? "Bodyweight" : meta.equipment}
          </p>
        </div>
        <span className="inline-flex items-center justify-center rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
          {prescription.sets} sets
        </span>
      </div>
      <p className="text-[11px] text-slate-700 mb-2">
        {prescription.intensityLabel}
      </p>

      <div className="flex flex-wrap gap-1 text-[10px] text-slate-600">
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
          Cardio load {meta.fitnessLoad.CARDIO ?? 0}/3
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
          Strength load {meta.fitnessLoad.STRENGTH ?? 0}/3
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
          Mobility load {meta.fitnessLoad.MOBILITY ?? 0}/3
        </span>
      </div>
    </div>
  );
};

/**
 * Main dashboard component
 */

const FitnessDashboard: React.FC<FitnessDashboardProps> = ({
  data,
  onStartSession,
}) => {
  const {
    title = "Fitness Program",
    subtitle = "Your personalized workout plan, based on physical education and progression.",
    phases,
    levels,
    days,
    variants,
    programTitle = "Program overview",
    programDescription = "Each column shows how hard the exercise works your heart, muscles, and main muscle groups.",
    defaultPhaseId,
    defaultLevelId,
    defaultDayId,
  } = data;

  const initialPhaseId = defaultPhaseId || (phases[0]?.id ?? "");
  const initialLevelId = defaultLevelId || (levels[0]?.id ?? "");
  const initialDayId = defaultDayId || (days[0]?.id ?? "");

  const [phaseId, setPhaseId] = useState<string>(initialPhaseId);
  const [levelId, setLevelId] = useState<string>(initialLevelId);
  const [dayId, setDayId] = useState<string>(initialDayId);

  const programKey = useMemo(
    () => buildProgramKey(phaseId, levelId, dayId),
    [phaseId, levelId, dayId]
  );

  const currentRows: ExerciseRowView[] = useMemo(
    () => variants[programKey] || [],
    [variants, programKey]
  );

  const currentPhase = phases.find((p) => p.id === phaseId);
  const currentLevel = levels.find((l) => l.id === levelId);
  const currentDay = days.find((d) => d.id === dayId);

  const handleStartSession = () => {
    if (!onStartSession) return;
    onStartSession({
      phaseId,
      levelId,
      dayId,
      rows: currentRows,
    });
  };

  return (
    <div className="w-full bg-[#f0f7ff] min-h-[70vh] px-2 sm:px-4 pb-10">

      <div className="max-w-6xl mx-auto space-y-4">
        {/* HOW TO READ THIS PROGRAM (Legend) */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">
            How to read this program
          </h2>
          <div className="grid gap-3 md:grid-cols-2 text-[11px] text-slate-700">
            <div className="space-y-1.5">
              <p>
                <span className="font-semibold">Sets</span> means how many
                times you repeat the exercise block. For example, 3 sets of 10
                reps means you do 10 reps, rest, and repeat 3 times.
              </p>
              <p>
                <span className="font-semibold">Intensity Level</span> explains
                how hard you should feel you are working. We use simple cues
                like easy, moderate, or hard instead of complicated numbers.
              </p>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2">
                <CardioIcon className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">Cardio</span> shows how much
                  the exercise works your heart and breathing.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <StrengthIcon className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">Strength</span> shows how
                  much it challenges your muscles and force.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <EnduranceIcon className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">Endurance</span> shows how
                  much it builds your ability to keep moving longer.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MobilityIcon className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">Mobility</span> shows how
                  much it helps your joints move freely and easily.
                </span>
              </p>
              <p className="flex items-center gap-2">
                <MuscleIcon className="h-4 w-4 text-emerald-600" />
                <span>
                  <span className="font-semibold">Muscle Focus</span> tiles show
                  which muscle groups (legs, back, core, etc.) are working the
                  most. The darker the tile, the more that area is loaded.
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Controls: Phase selector, Level toggle, Day picker, Start session */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4">
          <div className="grid gap-3 sm:grid-cols-[2fr,2fr,3fr] items-center">
            {/* Phase selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Phase
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                value={phaseId}
                onChange={(e) => setPhaseId(e.target.value)}
              >
                {phases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Level toggle */}
            <div>
              <p className="block text-[11px] font-semibold text-slate-700 mb-1">
                Level
              </p>
              <div className="flex flex-wrap gap-1">
                {levels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => setLevelId(level.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                      levelId === level.id
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Day picker */}
            <div>
              <p className="block text-[11px] font-semibold text-slate-700 mb-1">
                Day
              </p>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {days.map((day) => (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setDayId(day.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-medium border whitespace-nowrap transition-colors ${
                      dayId === day.id
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Session context + Start button */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-[11px] text-slate-600">
              <p className="font-semibold text-slate-800">
                {currentPhase ? currentPhase.name : "Phase"} /{" "}
                {currentLevel ? currentLevel.label : "Level"} /{" "}
                {currentDay ? currentDay.label : "Day"}
              </p>
              {programDescription && (
                <p className="mt-1 max-w-2xl">{programDescription}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleStartSession}
              className="inline-flex items-center justify-center self-start sm:self-auto rounded-full bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors"
              disabled={currentRows.length === 0}
            >
              Start Session
            </button>
          </div>
        </section>

        {/* Desktop: Program grid */}
        <section className="hidden sm:block">
          <WorkoutProgramGrid title={programTitle} rows={currentRows} />
        </section>

        {/* Mobile: Card list */}
        <section className="sm:hidden">
          <h2 className="text-xs font-semibold text-slate-800 mb-2">
            {programTitle}
          </h2>
          {currentRows.length === 0 && (
            <p className="text-[11px] text-slate-500">
              No exercises scheduled yet for this combination. Your coach may
              not have configured this phase, level, and day.
            </p>
          )}
          {currentRows.map((row) => (
            <MobileExerciseCard key={row.meta.id} row={row} />
          ))}
        </section>
      </div>
    </div>
  );
};

export default FitnessDashboard;

/**
 * Optional: Adapter types to auto-type ExerciseRowView
 * from your service payloads.
 */

export interface ServiceExerciseDto {
  id: string;
  name: string;
  equipment: "NONE" | "DUMBBELLS" | "BARBELL" | "MACHINE";
  fitnessLoad?: Partial<Record<FitnessComponent, LoadLevel>>;
  muscleLoad?: Partial<Record<MuscleGroup, LoadLevel>>;
  sets: number;
  intensityLabel: string;
}

export function mapServiceExerciseToRow(
  dto: ServiceExerciseDto
): ExerciseRowView {
  const meta: ExerciseMeta = {
    id: dto.id,
    name: dto.name,
    equipment: dto.equipment,
    fitnessLoad: dto.fitnessLoad ?? {},
    muscleLoad: dto.muscleLoad ?? {},
  };

  const prescription: ExercisePrescription = {
    exerciseId: dto.id,
    sets: dto.sets,
    intensityLabel: dto.intensityLabel,
  };

  return { meta, prescription };
}

export type ServiceProgramConfig = {
  [phaseId: string]: {
    [levelId: string]: {
      [dayId: string]: ServiceExerciseDto[];
    };
  };
};

export function buildProgramVariantsFromService(
  config: ServiceProgramConfig
): ProgramVariantMap {
  const variants: ProgramVariantMap = {};

  Object.entries(config).forEach(([phaseId, levels]) => {
    Object.entries(levels).forEach(([levelId, days]) => {
      Object.entries(days).forEach(([dayId, exercises]) => {
        const key = buildProgramKey(phaseId, levelId, dayId);
        variants[key] = exercises.map(mapServiceExerciseToRow);
      });
    });
  });

  return variants;
}
